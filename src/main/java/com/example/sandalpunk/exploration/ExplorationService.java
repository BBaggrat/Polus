package com.example.sandalpunk.exploration;

import java.time.Clock;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import com.example.sandalpunk.discovery.DiscoveryService;
import com.example.sandalpunk.discovery.DiscoveryType;
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
    private final EventChainService eventChainService;
    private final DiscoveryService discoveryService;
    private final ContentBalance contentBalance;
    private final AppEventLogger appEventLogger;
    private final Clock clock;

    public ExplorationService(
            ExplorationRepository explorationRepository,
            JournalRepository journalRepository,
            PlayerStateService playerStateService,
            EncounterGenerator encounterGenerator,
            ExplorationModifierService modifierService,
            EventChainService eventChainService,
            DiscoveryService discoveryService,
            ContentBalance contentBalance,
            AppEventLogger appEventLogger,
            Clock clock
    ) {
        this.explorationRepository = explorationRepository;
        this.journalRepository = journalRepository;
        this.playerStateService = playerStateService;
        this.encounterGenerator = encounterGenerator;
        this.modifierService = modifierService;
        this.eventChainService = eventChainService;
        this.discoveryService = discoveryService;
        this.contentBalance = contentBalance;
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
        int previousExplorationCount = explorationRepository.findByPlayerId(playerProfile.getId()).size();
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
        log(
                mode == ExplorationVisibilityMode.OPEN_PVP
                        ? AppEventType.OPEN_PVP_MODE_SELECTED
                        : AppEventType.HIDDEN_MODE_SELECTED,
                explorationState,
                Map.of("source", "exploration_start")
        );
        if (previousExplorationCount == 0) {
            log(AppEventType.RETENTION_MARKER_D1_CANDIDATE, explorationState, Map.of("reason", "first_start"));
        } else if (previousExplorationCount == 1) {
            log(AppEventType.SECOND_EXPLORATION_STARTED, explorationState, Map.of("previousExplorations", previousExplorationCount));
        } else {
            log(AppEventType.REPEAT_EXPLORATION_STARTED, explorationState, Map.of("previousExplorations", previousExplorationCount));
        }
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
                    JournalEntryType.MAP_FRAGMENT,
                    "Картографический стол помог заметить старую метку. " + fragment.text(),
                    Map.of("fragmentId", fragment.id(), "mapFragment", "true")
            );
            discoveryService.record(
                    playerProfile,
                    DiscoveryType.MAP_FRAGMENT,
                    fragment.title(),
                    fragment.text(),
                    fragment.id(),
                    List.of("map_fragment", "route")
            );
        }

        boolean encounterDue = explorationState.getStep() % 2 == 0 || encounterGenerator.shouldGenerateEncounter();
        if (encounterDue) {
            String activeChainBefore = explorationState.getActiveChainId();
            Encounter encounter = eventChainService.nextChainEncounter(explorationState)
                    .or(() -> eventChainService.maybeStartChain(explorationState))
                    .orElseGet(() -> modifierService.nextEncounter(
                            playerProfile,
                            explorationState.getVisibilityMode(),
                            encounterGenerator,
                            Set.copyOf(explorationState.getRecentlySeenEventIds())
                    ));
            boolean repeated = explorationState.hasRecentlySeen(encounter.contentId());
            explorationState.markEventSeen(encounter.contentId(), contentBalance.repeatedEventCooldownSize());
            explorationState.setCurrentEncounter(encounter);
            addJournalEntry(
                    explorationState,
                    journalType(encounter.type()),
                    encounter.title() + ". " + encounter.text(),
                    encounterMetadata(encounter)
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
            if (repeated) {
                log(
                        AppEventType.CONTENT_EVENT_REPEATED,
                        explorationState,
                        Map.of("contentId", encounter.contentId(), "reason", "cooldown_pool_exhausted")
                );
            }
            if (activeChainBefore == null && encounter.chainId() != null) {
                addJournalEntry(
                        explorationState,
                        JournalEntryType.SYSTEM,
                        "Началась цепочка: " + eventChainService.title(encounter.chainId()) + ".",
                        Map.of("chainId", encounter.chainId(), "chainStarted", "true")
                );
                log(
                        AppEventType.CHAIN_STARTED,
                        explorationState,
                        Map.of("chainId", encounter.chainId(), "chainTitle", eventChainService.title(encounter.chainId()))
                );
            }
            if (encounter.type() == EncounterType.MONSTER) {
                log(
                        AppEventType.MONSTER_ENCOUNTER_SEEN,
                        explorationState,
                        Map.of("encounterId", encounter.id(), "contentId", encounter.contentId())
                );
            }
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
        EventChainService.ChainResolution chainResolution = eventChainService.resolveChoice(
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
        if (chainResolution.reward() != null && !chainResolution.reward().isEmpty()) {
            explorationState.setCollectedResources(
                    explorationState.getCollectedResources().add(chainResolution.reward())
            );
            log(
                    AppEventType.RESOURCE_EARNED,
                    explorationState,
                    resourceMetadata(chainResolution.reward(), "chain")
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
        if (chainResolution.hpDelta() != 0) {
            int beforeChainHp = playerState.getHp();
            playerState.setHp(playerState.getHp() + chainResolution.hpDelta());
            playerStateService.save(playerState);
            log(
                    AppEventType.HP_CHANGED,
                    explorationState,
                    Map.of(
                            "before", beforeChainHp,
                            "after", playerState.getHp(),
                            "delta", playerState.getHp() - beforeChainHp,
                            "source", "chain"
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
        if (chainResolution.status() != EventChainService.ChainResolutionStatus.NONE
                && chainResolution.journalMessage() != null
                && !chainResolution.journalMessage().isBlank()) {
            addJournalEntry(
                    explorationState,
                    JournalEntryType.SYSTEM,
                    chainResolution.journalMessage(),
                    Map.of(
                            "chainId", chainResolution.chain() == null ? "" : chainResolution.chain().chainId(),
                            "chainStatus", chainResolution.status().name()
                    )
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
        if (encounter.type() == EncounterType.MONSTER) {
            log(
                    AppEventType.MONSTER_CHOICE_MADE,
                    explorationState,
                    Map.of("encounterId", encounter.id(), "contentId", encounter.contentId(), "choiceId", choice.id())
            );
        }
        if (encounter.type() == EncounterType.PVP_TRACE) {
            log(
                    AppEventType.PVP_TRACE_CHOICE_MADE,
                    explorationState,
                    Map.of("encounterId", encounter.id(), "contentId", encounter.contentId(), "choiceId", choice.id())
            );
        }
        if (chainResolution.status() == EventChainService.ChainResolutionStatus.COMPLETED) {
            log(
                    AppEventType.CHAIN_COMPLETED,
                    explorationState,
                    Map.of("chainId", chainResolution.chain().chainId(), "chainTitle", chainResolution.chain().title())
            );
        } else if (chainResolution.status() == EventChainService.ChainResolutionStatus.FAILED) {
            log(
                    AppEventType.CHAIN_FAILED,
                    explorationState,
                    Map.of("chainId", chainResolution.chain().chainId(), "chainTitle", chainResolution.chain().title())
            );
        }
        recordDiscovery(playerProfile, encounter, choice);

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
            addJournalEntry(
                    explorationState,
                    JournalEntryType.PVP_ENCOUNTER,
                    "Стычка передана в обычный PvP-поиск. Итог дуэли будет записан отдельным событием после интеграции результата.",
                    Map.of("pvpAdapter", "minimal", "contentId", encounter.contentId())
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
        boolean firstReturnedBefore = explorationRepository.findByPlayerId(explorationState.getPlayerId()).stream()
                .anyMatch(previous -> previous.getStatus() == ExplorationStatus.RETURNED);
        PlayerResources collected = explorationState.getCollectedResources();
        playerState.setResources(playerState.getResources().add(collected));
        playerState.setCurrentExplorationId(null);
        playerState.setVisibilityMode(ExplorationVisibilityMode.HIDDEN);
        playerStateService.save(playerState);

        explorationState.setStatus(ExplorationStatus.RETURNED);
        explorationState.setFinishedAt(clock.instant());
        explorationState.setCurrentEncounter(null);
        explorationState.setStartPvpDuel(false);
        explorationState.clearActiveChain();
        addJournalEntry(
                explorationState,
                JournalEntryType.RETURN,
                encounterGenerator.nextReturnEntry() + " Все найденное перенесено в личный запас.",
                resourceMetadata(collected, "return")
        );
        explorationRepository.save(explorationState);
        log(AppEventType.EXPLORATION_RETURNED, explorationState, resourceMetadata(collected, "return"));
        log(AppEventType.RETURN_TO_BASE_SUCCESS, explorationState, resourceMetadata(collected, "return"));
        if (!firstReturnedBefore) {
            log(AppEventType.FIRST_EXPLORATION_COMPLETED, explorationState, Map.of("status", "returned"));
        }
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
        if (explorationState.getActiveChainId() != null) {
            String failedChainId = explorationState.getActiveChainId();
            explorationState.markChainFailed(failedChainId);
            explorationState.clearActiveChain();
            log(
                    AppEventType.CHAIN_FAILED,
                    explorationState,
                    Map.of("chainId", failedChainId, "reason", "exploration_failed")
            );
        }
        addJournalEntry(
                explorationState,
                JournalEntryType.FAILED,
                encounterGenerator.nextFailedEntry() + " Потеряно "
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
        log(AppEventType.RETURN_TO_BASE_AFTER_FAILURE, explorationState, Map.of("reason", "hp_depleted"));
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
        if (previous == ExplorationVisibilityMode.HIDDEN) {
            log(AppEventType.OPEN_PVP_AFTER_HIDDEN_ENABLED, explorationState, Map.of("source", source));
        }
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

    private Map<String, String> encounterMetadata(Encounter encounter) {
        Map<String, String> metadata = new LinkedHashMap<>();
        metadata.put("encounterId", encounter.id());
        metadata.put("contentId", encounter.contentId());
        metadata.put("risk", encounter.risk().name());
        if (encounter.chainId() != null) {
            metadata.put("chainId", encounter.chainId());
            metadata.put("chainStepId", encounter.chainStepId());
        }
        if (!encounter.tags().isEmpty()) {
            metadata.put("tags", String.join(",", encounter.tags()));
        }
        return metadata;
    }

    private void recordDiscovery(
            PlayerProfile playerProfile,
            Encounter encounter,
            EncounterChoice choice
    ) {
        DiscoveryType type = discoveryType(encounter, choice);
        if (type == null) {
            return;
        }
        discoveryService.record(
                playerProfile,
                type,
                encounter.title(),
                choice.resultText(),
                encounter.contentId(),
                encounter.tags()
        );
    }

    private DiscoveryType discoveryType(Encounter encounter, EncounterChoice choice) {
        if (choice.resultType() == ChoiceResultType.AVOID || choice.resultType() == ChoiceResultType.LOSE_HP) {
            return null;
        }
        return switch (encounter.type()) {
            case MAP_FRAGMENT -> DiscoveryType.MAP_FRAGMENT;
            case BASE_MEMORY -> DiscoveryType.NOTE;
            case MONSTER -> choice.resultType() == ChoiceResultType.MONSTER_FIGHT_TEXT
                    || choice.resultType() == ChoiceResultType.FIND_OBJECT
                    ? DiscoveryType.MONSTER_TRACE
                    : null;
            case ANOMALY -> choice.resultType() == ChoiceResultType.FIND_OBJECT
                    || choice.resultType() == ChoiceResultType.GAIN_RESOURCE
                    ? DiscoveryType.ANOMALY_MARK
                    : null;
            case OBJECT, QUIET_EVENT, PVP_AFTERMATH -> choice.resultType() == ChoiceResultType.FIND_OBJECT
                    ? DiscoveryType.OBJECT
                    : null;
            case PVP_TRACE, PVP_ENCOUNTER, RISK_REWARD, LOOT -> choice.resultType() == ChoiceResultType.FIND_OBJECT
                    ? DiscoveryType.NOTE
                    : null;
        };
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
            case MAP_FRAGMENT -> JournalEntryType.MAP_FRAGMENT;
            case BASE_MEMORY -> JournalEntryType.BASE_MEMORY;
            case MONSTER -> JournalEntryType.MONSTER;
            case ANOMALY -> JournalEntryType.ANOMALY;
            case LOOT -> JournalEntryType.LOOT;
            case PVP_TRACE -> JournalEntryType.PVP_TRACE;
            case PVP_ENCOUNTER -> JournalEntryType.PVP_ENCOUNTER;
            case PVP_AFTERMATH -> JournalEntryType.PVP_AFTERMATH;
            case RISK_REWARD -> JournalEntryType.RISK_REWARD;
            case QUIET_EVENT -> JournalEntryType.SYSTEM;
        };
    }
}
