package com.example.sandalpunk.exploration;

import java.time.Clock;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.logging.AppEventType;
import com.example.sandalpunk.player.PlayerProfile;
import com.example.sandalpunk.progression.MapFragment;
import com.example.sandalpunk.web.BadRequestException;
import com.example.sandalpunk.web.ConflictException;
import com.example.sandalpunk.web.NotFoundException;
import com.example.sandalpunk.web.UnauthorizedException;
import org.springframework.stereotype.Service;

@Service
public class ExplorationService {

    private static final int MAX_STEPS = 8;

    private final ExplorationRepository explorationRepository;
    private final JournalRepository journalRepository;
    private final PlayerStateService playerStateService;
    private final EncounterGenerator encounterGenerator;
    private final ExplorationModifierService modifierService;
    private final AppEventLogger appEventLogger;
    private final Clock clock;

    public ExplorationService(
            ExplorationRepository explorationRepository,
            JournalRepository journalRepository,
            PlayerStateService playerStateService,
            EncounterGenerator encounterGenerator,
            ExplorationModifierService modifierService,
            AppEventLogger appEventLogger,
            Clock clock
    ) {
        this.explorationRepository = explorationRepository;
        this.journalRepository = journalRepository;
        this.playerStateService = playerStateService;
        this.encounterGenerator = encounterGenerator;
        this.modifierService = modifierService;
        this.appEventLogger = appEventLogger;
        this.clock = clock;
    }

    public synchronized ExplorationState start(
            PlayerProfile playerProfile,
            ExplorationStartRequest request
    ) {
        verifyActor(playerProfile, request == null ? null : request.playerId());
        explorationRepository.findActiveByPlayerId(playerProfile.getId()).ifPresent(active -> {
            throw new ConflictException("Исследование уже начато");
        });

        PlayerState playerState = playerStateService.getOrCreate(playerProfile);
        if (playerState.getHp() <= 0) {
            throw new ConflictException("Для нового выхода нужно восстановить здоровье");
        }

        ExplorationVisibilityMode mode = request != null && request.visibilityMode() != null
                ? request.visibilityMode()
                : ExplorationVisibilityMode.HIDDEN;
        ExplorationState explorationState = new ExplorationState(
                UUID.randomUUID().toString(),
                playerProfile.getId(),
                ExplorationStatus.ACTIVE,
                mode,
                0,
                MAX_STEPS,
                PlayerResources.empty(),
                clock.instant()
        );
        explorationRepository.save(explorationState);

        playerState.setCurrentExplorationId(explorationState.getExplorationId());
        playerState.setVisibilityMode(mode);
        playerStateService.save(playerState);

        addJournalEntry(
                explorationState,
                JournalEntryType.SYSTEM,
                mode == ExplorationVisibilityMode.OPEN_PVP
                        ? "Ты выходишь в открытую часть топи. Здесь следы могут привести к другому выжившему."
                        : "Ты уходишь с базы скрытым маршрутом. Другие выжившие не смогут втянуть тебя в стычку.",
                Map.of("visibilityMode", mode.name())
        );
        log(AppEventType.EXPLORATION_STARTED, explorationState, Map.of("visibilityMode", mode.name()));
        if (mode == ExplorationVisibilityMode.OPEN_PVP) {
            log(AppEventType.OPEN_PVP_ENABLED, explorationState, Map.of("source", "exploration_start"));
        }
        return explorationState;
    }

    public synchronized Optional<ExplorationState> current(PlayerProfile playerProfile) {
        playerStateService.getOrCreate(playerProfile);
        return explorationRepository.findActiveByPlayerId(playerProfile.getId());
    }

    public synchronized ExplorationState step(
            PlayerProfile playerProfile,
            String explorationId,
            ExplorationStepRequest request
    ) {
        verifyActor(playerProfile, request == null ? null : request.playerId());
        ExplorationState explorationState = requireActive(playerProfile, explorationId);
        if (explorationState.getCurrentEncounter() != null) {
            throw new ConflictException("Сначала выбери действие в текущем событии");
        }
        if (explorationState.getStep() >= explorationState.getMaxSteps()) {
            throw new ConflictException("Маршрут завершен. Пора возвращаться на базу");
        }

        explorationState.setStartPvpDuel(false);
        explorationState.incrementStep();
        addJournalEntry(
                explorationState,
                JournalEntryType.MOVEMENT,
                encounterGenerator.nextMovementEntry(),
                Map.of("step", String.valueOf(explorationState.getStep()))
        );
        log(
                AppEventType.EXPLORATION_STEP,
                explorationState,
                Map.of("step", explorationState.getStep(), "maxSteps", explorationState.getMaxSteps())
        );

        MapFragment fragment = modifierService.tryDiscoverMapFragment(
                playerProfile,
                explorationState.getExplorationId()
        );
        if (fragment != null) {
            addJournalEntry(
                    explorationState,
                    JournalEntryType.OBJECT,
                    "Картографический стол помог заметить старую метку. " + fragment.text(),
                    Map.of("fragmentId", fragment.id(), "mapFragment", "true")
            );
        }

        boolean encounterDue = explorationState.getStep() % 2 == 0 || encounterGenerator.shouldGenerateEncounter();
        if (encounterDue) {
            Encounter encounter = modifierService.nextEncounter(
                    playerProfile,
                    explorationState.getVisibilityMode(),
                    encounterGenerator
            );
            explorationState.setCurrentEncounter(encounter);
            addJournalEntry(
                    explorationState,
                    journalType(encounter.type()),
                    encounter.title() + ". " + encounter.text(),
                    Map.of(
                            "encounterId", encounter.id(),
                            "contentId", encounter.contentId(),
                            "risk", encounter.risk().name()
                    )
            );
            log(
                    AppEventType.ENCOUNTER_GENERATED,
                    explorationState,
                    Map.of(
                            "encounterId", encounter.id(),
                            "contentId", encounter.contentId(),
                            "encounterType", encounter.type()
                    )
            );
            if (encounter.type() == EncounterType.PVP_TRACE) {
                log(
                        AppEventType.PVP_TRACE_SEEN,
                        explorationState,
                        Map.of("encounterId", encounter.id(), "contentId", encounter.contentId())
                );
            }
        }

        if (explorationState.getStep() == explorationState.getMaxSteps()) {
            addJournalEntry(
                    explorationState,
                    JournalEntryType.SYSTEM,
                    "Дальше путь размывает топь. Можно забрать найденное и вернуться на базу.",
                    Map.of("routeComplete", "true")
            );
        }
        return explorationRepository.save(explorationState);
    }

    public synchronized ExplorationState choose(
            PlayerProfile playerProfile,
            String explorationId,
            ExplorationChoiceRequest request
    ) {
        verifyActor(playerProfile, request == null ? null : request.playerId());
        if (request == null || request.choiceId() == null || request.choiceId().isBlank()) {
            throw new BadRequestException("choiceId обязателен");
        }

        ExplorationState explorationState = requireActive(playerProfile, explorationId);
        Encounter encounter = explorationState.getCurrentEncounter();
        if (encounter == null) {
            throw new ConflictException("Сейчас нет события, требующего выбора");
        }
        EncounterChoice choice = encounter.choices().stream()
                .filter(candidate -> candidate.id().equals(request.choiceId()))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Выбранное действие недоступно"));

        explorationState.setStartPvpDuel(false);
        ExplorationModifierService.ChoiceOutcome outcome = modifierService.applyChoice(
                playerProfile,
                explorationState,
                encounter,
                choice
        );
        if (outcome.reward() != null && !outcome.reward().isEmpty()) {
            explorationState.setCollectedResources(
                    explorationState.getCollectedResources().add(outcome.reward())
            );
            log(
                    AppEventType.RESOURCE_EARNED,
                    explorationState,
                    resourceMetadata(outcome.reward(), "exploration")
            );
        }

        PlayerState playerState = playerStateService.getOrCreate(playerProfile);
        int hpBefore = playerState.getHp();
        if (outcome.hpDelta() != 0) {
            playerState.setHp(playerState.getHp() + outcome.hpDelta());
            playerStateService.save(playerState);
            log(
                    AppEventType.HP_CHANGED,
                    explorationState,
                    Map.of(
                            "before", hpBefore,
                            "after", playerState.getHp(),
                            "delta", playerState.getHp() - hpBefore
                    )
            );
        }

        addJournalEntry(
                explorationState,
                JournalEntryType.CHOICE_RESULT,
                choice.resultText(),
                choiceMetadata(encounter, choice)
        );
        for (String message : outcome.journalMessages()) {
            addJournalEntry(
                    explorationState,
                    JournalEntryType.SYSTEM,
                    message,
                    Map.of("progressionEffect", "true")
            );
        }
        log(
                AppEventType.ENCOUNTER_CHOICE_MADE,
                explorationState,
                Map.of(
                        "encounterId", encounter.id(),
                        "contentId", encounter.contentId(),
                        "encounterType", encounter.type(),
                        "choiceId", choice.id(),
                        "resultType", choice.resultType()
                )
        );

        if (choice.resultType() == ChoiceResultType.ENTER_OPEN_PVP) {
            enableOpenPvp(explorationState, playerState, "encounter_choice");
        } else if (choice.resultType() == ChoiceResultType.START_PVP_DUEL) {
            if (explorationState.getVisibilityMode() != ExplorationVisibilityMode.OPEN_PVP) {
                throw new ConflictException("PvP-встречи доступны только в открытом режиме");
            }
            explorationState.setStartPvpDuel(true);
            log(
                    AppEventType.PVP_ENCOUNTER_STARTED,
                    explorationState,
                    Map.of("encounterId", encounter.id(), "contentId", encounter.contentId())
            );
        }

        explorationState.setCurrentEncounter(null);
        explorationRepository.save(explorationState);

        if (playerState.getHp() <= 0) {
            failExploration(playerProfile, explorationState, playerState);
            return explorationState;
        }
        if (choice.resultType() == ChoiceResultType.RETURN_TO_BASE) {
            return finishReturn(explorationState, playerState);
        }
        return explorationState;
    }

    public synchronized ExplorationState changeVisibility(
            PlayerProfile playerProfile,
            String explorationId,
            ExplorationVisibilityRequest request
    ) {
        verifyActor(playerProfile, request == null ? null : request.playerId());
        if (request == null || request.visibilityMode() == null) {
            throw new BadRequestException("visibilityMode обязателен");
        }
        ExplorationState explorationState = requireActive(playerProfile, explorationId);
        if (request.visibilityMode() == explorationState.getVisibilityMode()) {
            return explorationState;
        }
        if (request.visibilityMode() != ExplorationVisibilityMode.OPEN_PVP) {
            throw new ConflictException("После выхода в открытую топь скрытый режим недоступен до возвращения");
        }
        PlayerState playerState = playerStateService.getOrCreate(playerProfile);
        enableOpenPvp(explorationState, playerState, "player_action");
        return explorationRepository.save(explorationState);
    }

    public synchronized ExplorationState returnToBase(
            PlayerProfile playerProfile,
            String explorationId,
            ExplorationReturnRequest request
    ) {
        verifyActor(playerProfile, request == null ? null : request.playerId());
        ExplorationState explorationState = requireActive(playerProfile, explorationId);
        PlayerState playerState = playerStateService.getOrCreate(playerProfile);
        return finishReturn(explorationState, playerState);
    }

    public void verifyRequestedPlayer(PlayerProfile playerProfile, String requestedPlayerId) {
        verifyActor(playerProfile, requestedPlayerId);
    }

    public List<JournalEntry> journal(PlayerProfile playerProfile, int limit) {
        playerStateService.getOrCreate(playerProfile);
        return journalRepository.findLatestByPlayerId(playerProfile.getId(), limit);
    }

    private ExplorationState finishReturn(
            ExplorationState explorationState,
            PlayerState playerState
    ) {
        PlayerResources collected = explorationState.getCollectedResources();
        playerState.setResources(playerState.getResources().add(collected));
        playerState.setCurrentExplorationId(null);
        playerState.setVisibilityMode(ExplorationVisibilityMode.HIDDEN);
        playerStateService.save(playerState);

        explorationState.setStatus(ExplorationStatus.RETURNED);
        explorationState.setFinishedAt(clock.instant());
        explorationState.setCurrentEncounter(null);
        explorationState.setStartPvpDuel(false);
        addJournalEntry(
                explorationState,
                JournalEntryType.RETURN,
                "Ты возвращаешься на базу. Все найденное перенесено в личный запас.",
                resourceMetadata(collected, "return")
        );
        explorationRepository.save(explorationState);
        log(AppEventType.EXPLORATION_RETURNED, explorationState, resourceMetadata(collected, "return"));
        return explorationState;
    }

    private void failExploration(
            PlayerProfile playerProfile,
            ExplorationState explorationState,
            PlayerState playerState
    ) {
        ExplorationModifierService.FailureOutcome failure = modifierService.failureOutcome(
                playerProfile,
                explorationState
        );
        playerState.setResources(playerState.getResources().add(failure.preserved()));
        playerState.setHp(Math.max(25, playerState.getMaxHp() / 4));
        playerState.setCurrentExplorationId(null);
        playerState.setVisibilityMode(ExplorationVisibilityMode.HIDDEN);
        playerStateService.save(playerState);

        explorationState.setStatus(ExplorationStatus.FAILED);
        explorationState.setFinishedAt(clock.instant());
        explorationState.setCurrentEncounter(null);
        explorationState.setStartPvpDuel(false);
        explorationState.setCollectedResources(failure.preserved());
        addJournalEntry(
                explorationState,
                JournalEntryType.RETURN,
                "Силы закончились. Поисковая группа вернула тебя на базу. Потеряно "
                        + failure.lossPercent() + "% добычи, остальное удалось сохранить.",
                Map.of(
                        "hp", String.valueOf(playerState.getHp()),
                        "resourcesLost", "true",
                        "lossPercent", String.valueOf(failure.lossPercent()),
                        "storageProtection", String.valueOf(failure.storageReductionPercent())
                )
        );
        explorationRepository.save(explorationState);
        log(
                AppEventType.EXPLORATION_FAILED,
                explorationState,
                Map.of(
                        "reason", "hp_depleted",
                        "lossPercent", failure.lossPercent(),
                        "resourcesLost", failure.lost(),
                        "resourcesPreserved", failure.preserved()
                )
        );
    }

    private void enableOpenPvp(
            ExplorationState explorationState,
            PlayerState playerState,
            String source
    ) {
        ExplorationVisibilityMode previous = explorationState.getVisibilityMode();
        explorationState.setVisibilityMode(ExplorationVisibilityMode.OPEN_PVP);
        playerState.setVisibilityMode(ExplorationVisibilityMode.OPEN_PVP);
        playerStateService.save(playerState);
        addJournalEntry(
                explorationState,
                JournalEntryType.SYSTEM,
                "Ты выходишь из скрытого маршрута. Теперь в дневнике могут появиться чужие следы и встречи.",
                Map.of("visibilityMode", ExplorationVisibilityMode.OPEN_PVP.name())
        );
        log(
                AppEventType.VISIBILITY_MODE_CHANGED,
                explorationState,
                Map.of("from", previous, "to", ExplorationVisibilityMode.OPEN_PVP, "source", source)
        );
        log(AppEventType.OPEN_PVP_ENABLED, explorationState, Map.of("source", source));
    }

    private ExplorationState requireActive(PlayerProfile playerProfile, String explorationId) {
        if (explorationId == null || explorationId.isBlank()) {
            throw new BadRequestException("explorationId обязателен");
        }
        ExplorationState explorationState = explorationRepository.findById(explorationId)
                .orElseThrow(() -> new NotFoundException("Исследование не найдено"));
        if (!explorationState.getPlayerId().equals(playerProfile.getId())) {
            throw new UnauthorizedException("Это исследование принадлежит другому игроку");
        }
        if (explorationState.getStatus() != ExplorationStatus.ACTIVE) {
            throw new ConflictException("Исследование уже завершено");
        }
        return explorationState;
    }

    private void verifyActor(PlayerProfile playerProfile, String requestedPlayerId) {
        if (requestedPlayerId != null
                && !requestedPlayerId.isBlank()
                && !requestedPlayerId.equals(playerProfile.getId())) {
            throw new UnauthorizedException("playerId не совпадает с текущей сессией");
        }
    }

    private void addJournalEntry(
            ExplorationState explorationState,
            JournalEntryType type,
            String text,
            Map<String, String> metadata
    ) {
        JournalEntry journalEntry = new JournalEntry(
                UUID.randomUUID().toString(),
                explorationState.getExplorationId(),
                explorationState.getPlayerId(),
                type,
                text,
                clock.instant(),
                Map.copyOf(metadata)
        );
        explorationState.addJournalEntry(journalEntry);
        journalRepository.append(journalEntry);
        log(
                AppEventType.JOURNAL_ENTRY_ADDED,
                explorationState,
                Map.of("entryId", journalEntry.id(), "entryType", journalEntry.type())
        );
    }

    private void log(
            AppEventType type,
            ExplorationState explorationState,
            Map<String, ?> metadata
    ) {
        Map<String, Object> eventMetadata = new LinkedHashMap<>();
        eventMetadata.put("playerId", explorationState.getPlayerId());
        eventMetadata.put("explorationId", explorationState.getExplorationId());
        eventMetadata.put("visibilityMode", explorationState.getVisibilityMode());
        eventMetadata.putAll(metadata);
        appEventLogger.info(type, type.eventName(), eventMetadata);
    }

    private Map<String, String> choiceMetadata(Encounter encounter, EncounterChoice choice) {
        Map<String, String> metadata = new LinkedHashMap<>();
        metadata.put("encounterId", encounter.id());
        metadata.put("contentId", encounter.contentId());
        metadata.put("choiceId", choice.id());
        metadata.put("resultType", choice.resultType().name());
        metadata.put("hpDelta", String.valueOf(choice.hpDelta()));
        metadata.putAll(resourceMetadata(choice.reward(), "choice"));
        return metadata;
    }

    private Map<String, String> resourceMetadata(PlayerResources resources, String source) {
        PlayerResources safeResources = resources == null ? PlayerResources.empty() : resources;
        Map<String, String> metadata = new LinkedHashMap<>();
        metadata.put("source", source);
        metadata.put("scrap", String.valueOf(safeResources.scrap()));
        metadata.put("supplies", String.valueOf(safeResources.supplies()));
        metadata.put("swampResin", String.valueOf(safeResources.swampResin()));
        return metadata;
    }

    private JournalEntryType journalType(EncounterType encounterType) {
        return switch (encounterType) {
            case OBJECT -> JournalEntryType.OBJECT;
            case MONSTER -> JournalEntryType.MONSTER;
            case ANOMALY -> JournalEntryType.ANOMALY;
            case LOOT -> JournalEntryType.LOOT;
            case PVP_TRACE -> JournalEntryType.PVP_TRACE;
            case PVP_ENCOUNTER -> JournalEntryType.PVP_ENCOUNTER;
            case QUIET_EVENT -> JournalEntryType.SYSTEM;
        };
    }
}
