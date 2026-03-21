package com.example.sandalpunk.duel;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Pattern;

import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.logging.AppEventType;
import com.example.sandalpunk.player.PlayerProfile;
import com.example.sandalpunk.player.PlayerService;
import com.example.sandalpunk.web.BadRequestException;
import com.example.sandalpunk.web.ConflictException;
import com.example.sandalpunk.web.NotFoundException;
import com.example.sandalpunk.web.UnauthorizedException;
import org.springframework.stereotype.Service;

@Service
public class DuelService {

    private static final int PVP_VICTORY_COINS = 100;
    private static final int PVP_VICTORY_EXPERIENCE = 10;
    private static final int MAX_CHAT_MESSAGES = 80;
    private static final int ROUND_TIMEOUT_SECONDS = 120;
    private static final Pattern LINK_PATTERN = Pattern.compile(
            "(?i)\\b(?:https?://|www\\.|t\\.me/|telegram\\.me/|[a-z0-9-]+(?:\\.[a-z0-9-]+)+(?:/|\\b))"
    );

    private final DuelRepository duelRepository;
    private final DuelEngine duelEngine;
    private final PlayerService playerService;
    private final AppEventLogger appEventLogger;
    private final Clock clock;

    public DuelService(
            DuelRepository duelRepository,
            DuelEngine duelEngine,
            PlayerService playerService,
            AppEventLogger appEventLogger,
            Clock clock
    ) {
        this.duelRepository = duelRepository;
        this.duelEngine = duelEngine;
        this.playerService = playerService;
        this.appEventLogger = appEventLogger;
        this.clock = clock;
    }

    public Duel createDuel(PlayerProfile playerOne, PlayerProfile playerTwo) {
        Instant now = clock.instant();
        Duel duel = new Duel(
                UUID.randomUUID().toString(),
                playerOne.getId(),
                playerOne.displayName(),
                playerTwo.getId(),
                playerTwo.displayName(),
                now
        );
        duel.setRoundDeadlineAt(now.plusSeconds(ROUND_TIMEOUT_SECONDS));
        duelRepository.save(duel);
        appEventLogger.info(
                AppEventType.DUEL_CREATED,
                "Duel created",
                Map.of(
                        "duelId", duel.getId(),
                        "playerOneId", duel.getPlayerOneId(),
                        "playerTwoId", duel.getPlayerTwoId()
                )
        );
        return duel;
    }

    public Duel findRequired(String duelId) {
        return duelRepository.findById(duelId)
                .orElseThrow(() -> new NotFoundException("Duel not found: " + duelId));
    }

    public DuelStateResponse getState(String duelId, PlayerProfile viewer) {
        Duel duel = findRequired(duelId);
        verifyParticipant(duel, viewer.getId());
        synchronized (duel) {
            syncDuelState(duel);
            duelRepository.save(duel);
            return toState(duel, viewer.getId());
        }
    }

    public DuelStateResponse submitAction(String duelId, PlayerProfile actor, DuelActionRequest request) {
        Duel duel = findRequired(duelId);
        verifyParticipant(duel, actor.getId());
        synchronized (duel) {
            syncDuelState(duel);
            if (duel.getStatus() != DuelStatus.ACTIVE) {
                throw new ConflictException("Duel is already finished");
            }
            if (isAutoBattleEnabled(duel, actor.getId())) {
                throw new ConflictException("Автоматический бой уже ведет этот раунд");
            }

            duel.getPendingActions().put(
                    actor.getId(),
                    new DuelRoundAction(
                            actor.getId(),
                            duel.getRoundNumber(),
                            request.weapon(),
                            request.shotDirection(),
                            request.dodgeDirection(),
                            DuelActionSource.MANUAL,
                            clock.instant()
                    )
            );
            duel.setUpdatedAt(clock.instant());
            appEventLogger.info(
                    AppEventType.ROUND_ACTION_SUBMIT,
                    "Round action submitted",
                    Map.of(
                            "duelId", duel.getId(),
                            "playerId", actor.getId(),
                            "round", duel.getRoundNumber()
                    )
            );

            if (duel.getPendingActions().size() == 2) {
                resolveRound(duel);
            }
            duelRepository.save(duel);
            return toState(duel, actor.getId());
        }
    }

    public DuelStateResponse submitChat(String duelId, PlayerProfile actor, DuelChatRequest request) {
        Duel duel = findRequired(duelId);
        verifyParticipant(duel, actor.getId());
        synchronized (duel) {
            syncDuelState(duel);
            if (duel.getStatus() != DuelStatus.ACTIVE) {
                throw new ConflictException("Бой уже завершен");
            }
            String message = normalizeChatMessage(request.message());
            if (LINK_PATTERN.matcher(message).find()) {
                throw new BadRequestException("Ссылка запрещена в боевом чате");
            }
            duel.getChatMessages().add(new DuelChatMessage(
                    UUID.randomUUID().toString(),
                    actor.getId(),
                    actor.displayName(),
                    message,
                    false,
                    clock.instant()
            ));
            trimChatIfNeeded(duel);
            duel.setUpdatedAt(clock.instant());
            duelRepository.save(duel);
            return toState(duel, actor.getId());
        }
    }

    public DuelStateResponse configureAutomation(String duelId, PlayerProfile actor, DuelAutomationRequest request) {
        Duel duel = findRequired(duelId);
        verifyParticipant(duel, actor.getId());
        synchronized (duel) {
            syncDuelState(duel);
            if (duel.getStatus() != DuelStatus.ACTIVE) {
                throw new ConflictException("Бой уже завершен");
            }
            boolean current = isAutoBattleEnabled(duel, actor.getId());
            Boolean pending = getPendingAutoBattleEnabled(duel, actor.getId());
            boolean desired = request.enabled();
            if (desired == current) {
                setPendingAutoBattleEnabled(duel, actor.getId(), null);
            } else if (pending != null && pending == desired) {
                setPendingAutoBattleEnabled(duel, actor.getId(), null);
            } else {
                setPendingAutoBattleEnabled(duel, actor.getId(), desired);
            }
            duel.setUpdatedAt(clock.instant());
            duelRepository.save(duel);
            return toState(duel, actor.getId());
        }
    }

    public DuelStateResponse forfeit(String duelId, PlayerProfile actor) {
        Duel duel = findRequired(duelId);
        verifyParticipant(duel, actor.getId());
        synchronized (duel) {
            syncDuelState(duel);
            if (duel.getStatus() == DuelStatus.FINISHED) {
                return toState(duel, actor.getId());
            }

            String actorId = actor.getId();
            String winnerPlayerId = duel.opponentId(actorId);
            String actorName = duel.getPlayerOneId().equals(actorId) ? duel.getPlayerOneName() : duel.getPlayerTwoName();
            String winnerName = duel.getPlayerOneId().equals(winnerPlayerId) ? duel.getPlayerOneName() : duel.getPlayerTwoName();
            Instant now = clock.instant();

            if (duel.getPlayerOneId().equals(actorId)) {
                duel.setPlayerOneHp(0);
            } else {
                duel.setPlayerTwoHp(0);
            }

            duel.setStatus(DuelStatus.FINISHED);
            duel.setWinnerPlayerId(winnerPlayerId);
            duel.setFinishedAt(now);
            duel.setUpdatedAt(now);
            duel.getPendingActions().clear();
            duel.getRoundLogs().add(new RoundLog(
                    duel.getRoundNumber(),
                    List.of(
                            "Раунд " + duel.getRoundNumber() + ": " + actorName + " покидает бой.",
                            "Итог: " + winnerName + " получает автопобеду."
                    ),
                    duel.getPlayerOneHp(),
                    duel.getPlayerTwoHp(),
                    now
            ));

            playerService.rewardVictory(winnerPlayerId, PVP_VICTORY_COINS, PVP_VICTORY_EXPERIENCE);
            playerService.recordLoss(actorId);

            appEventLogger.info(
                    AppEventType.MATCH_FINISH,
                    "Match finished by forfeit",
                    Map.of(
                            "duelId", duel.getId(),
                            "winnerPlayerId", winnerPlayerId,
                            "loserPlayerId", actorId,
                            "forfeit", true
                    )
            );

            duelRepository.save(duel);
            return toState(duel, actorId);
        }
    }

    private void syncDuelState(Duel duel) {
        if (duel.getStatus() != DuelStatus.ACTIVE) {
            return;
        }
        Instant now = clock.instant();
        if (duel.getRoundStartedAt() == null) {
            duel.setRoundStartedAt(now);
        }
        if (duel.getRoundDeadlineAt() == null) {
            duel.setRoundDeadlineAt(now.plusSeconds(ROUND_TIMEOUT_SECONDS));
        }

        applyAutoActionsIfNeeded(duel, now);
        if (duel.getPendingActions().size() == 2) {
            resolveRound(duel);
            return;
        }

        if (!now.isBefore(duel.getRoundDeadlineAt())) {
            applyTimeoutDefaultsIfNeeded(duel, now);
            if (duel.getPendingActions().size() == 2) {
                resolveRound(duel);
            }
        }
    }

    private void applyAutoActionsIfNeeded(Duel duel, Instant now) {
        submitAutoActionIfNeeded(duel, duel.getPlayerOneId(), now);
        submitAutoActionIfNeeded(duel, duel.getPlayerTwoId(), now);
    }

    private void submitAutoActionIfNeeded(Duel duel, String playerId, Instant now) {
        if (!isAutoBattleEnabled(duel, playerId) || duel.getPendingActions().containsKey(playerId)) {
            return;
        }
        duel.getPendingActions().put(playerId, randomAutoAction(playerId, duel.getRoundNumber(), now));
        duel.setUpdatedAt(now);
    }

    private void applyTimeoutDefaultsIfNeeded(Duel duel, Instant now) {
        submitTimeoutDefaultIfNeeded(duel, duel.getPlayerOneId(), now);
        submitTimeoutDefaultIfNeeded(duel, duel.getPlayerTwoId(), now);
    }

    private void submitTimeoutDefaultIfNeeded(Duel duel, String playerId, Instant now) {
        if (duel.getPendingActions().containsKey(playerId)) {
            return;
        }
        duel.getPendingActions().put(playerId, timeoutDefaultAction(playerId, duel.getRoundNumber(), now));
        duel.setUpdatedAt(now);
    }

    private DuelRoundAction randomAutoAction(String playerId, int roundNumber, Instant now) {
        WeaponType weapon = randomWeapon();
        ShotDirection shot = randomShotDirection();
        DodgeDirection dodge = randomDodgeDirection();
        return new DuelRoundAction(playerId, roundNumber, weapon, shot, dodge, DuelActionSource.AUTO_BATTLE, now);
    }

    private DuelRoundAction timeoutDefaultAction(String playerId, int roundNumber, Instant now) {
        return new DuelRoundAction(
                playerId,
                roundNumber,
                WeaponType.PISTOLS,
                ShotDirection.CENTER,
                DodgeDirection.STAY,
                DuelActionSource.TIMEOUT_DEFAULT,
                now
        );
    }

    private WeaponType randomWeapon() {
        WeaponType[] values = WeaponType.values();
        return values[ThreadLocalRandom.current().nextInt(values.length)];
    }

    private ShotDirection randomShotDirection() {
        ShotDirection[] values = ShotDirection.values();
        return values[ThreadLocalRandom.current().nextInt(values.length)];
    }

    private DodgeDirection randomDodgeDirection() {
        DodgeDirection[] values = DodgeDirection.values();
        return values[ThreadLocalRandom.current().nextInt(values.length)];
    }

    private void resolveRound(Duel duel) {
        DuelRoundAction playerOneAction = duel.getPendingActions().get(duel.getPlayerOneId());
        DuelRoundAction playerTwoAction = duel.getPendingActions().get(duel.getPlayerTwoId());
        DuelEngine.RoundResolution resolution = duelEngine.resolveRound(duel, playerOneAction, playerTwoAction);
        duel.setPlayerOneHp(resolution.playerOneHpAfter());
        duel.setPlayerTwoHp(resolution.playerTwoHpAfter());
        duel.getRoundLogs().add(resolution.roundLog());
        duel.getPendingActions().clear();
        duel.setUpdatedAt(clock.instant());

        appEventLogger.info(
                AppEventType.ROUND_RESOLUTION,
                "Round resolved",
                Map.of(
                        "duelId", duel.getId(),
                        "round", duel.getRoundNumber(),
                        "playerOneHp", duel.getPlayerOneHp(),
                        "playerTwoHp", duel.getPlayerTwoHp()
                )
        );

        if (resolution.duelStatus() == DuelStatus.FINISHED) {
            duel.setStatus(DuelStatus.FINISHED);
            duel.setWinnerPlayerId(resolution.winnerPlayerId());
            duel.setFinishedAt(clock.instant());
            if (resolution.winnerPlayerId() != null) {
                String loserPlayerId = duel.opponentId(resolution.winnerPlayerId());
                playerService.rewardVictory(resolution.winnerPlayerId(), PVP_VICTORY_COINS, PVP_VICTORY_EXPERIENCE);
                playerService.recordLoss(loserPlayerId);
            }
            appEventLogger.info(
                    AppEventType.MATCH_FINISH,
                    "Match finished",
                    Map.of(
                            "duelId", duel.getId(),
                            "winnerPlayerId", String.valueOf(resolution.winnerPlayerId())
                    )
            );
        } else {
            startNextRound(duel, clock.instant());
        }
    }

    private void startNextRound(Duel duel, Instant now) {
        duel.incrementRoundNumber();
        duel.setRoundStartedAt(now);
        duel.setRoundDeadlineAt(now.plusSeconds(ROUND_TIMEOUT_SECONDS));
        applyPendingAutoBattleChanges(duel, now);
    }

    private void applyPendingAutoBattleChanges(Duel duel, Instant now) {
        applyPendingAutoBattleChange(duel, duel.getPlayerOneId(), duel.getPlayerOneName(), now);
        applyPendingAutoBattleChange(duel, duel.getPlayerTwoId(), duel.getPlayerTwoName(), now);
    }

    private void applyPendingAutoBattleChange(Duel duel, String playerId, String playerName, Instant now) {
        Boolean pending = getPendingAutoBattleEnabled(duel, playerId);
        if (pending == null) {
            return;
        }
        boolean current = isAutoBattleEnabled(duel, playerId);
        setPendingAutoBattleEnabled(duel, playerId, null);
        if (pending == current) {
            return;
        }
        setAutoBattleEnabled(duel, playerId, pending);
        String text = pending
                ? "С этого раунда ходы игрока " + playerName + " будут автоматическими."
                : "С этого раунда автоматические ходы игрока " + playerName + " отключены.";
        addSystemChatMessage(duel, text, now);
    }

    private void addSystemChatMessage(Duel duel, String text, Instant now) {
        duel.getChatMessages().add(new DuelChatMessage(
                UUID.randomUUID().toString(),
                null,
                "Система",
                text,
                true,
                now
        ));
        trimChatIfNeeded(duel);
        duel.setUpdatedAt(now);
    }

    private void trimChatIfNeeded(Duel duel) {
        while (duel.getChatMessages().size() > MAX_CHAT_MESSAGES) {
            duel.getChatMessages().remove(0);
        }
    }

    private DuelStateResponse toState(Duel duel, String viewerPlayerId) {
        PlayerProfile viewer = playerService.findRequiredById(viewerPlayerId);
        PlayerProfile opponent = playerService.findRequiredById(duel.opponentId(viewerPlayerId));
        boolean viewerIsPlayerOne = duel.getPlayerOneId().equals(viewerPlayerId);
        DuelRoundAction yourAction = duel.getPendingActions().get(viewerPlayerId);

        DuelParticipantView you = new DuelParticipantView(
                viewer.getId(),
                viewer.displayName(),
                viewerIsPlayerOne ? duel.getPlayerOneHp() : duel.getPlayerTwoHp(),
                viewer.getWins(),
                viewer.getLosses()
        );
        DuelParticipantView opponentView = new DuelParticipantView(
                opponent.getId(),
                opponent.displayName(),
                viewerIsPlayerOne ? duel.getPlayerTwoHp() : duel.getPlayerOneHp(),
                opponent.getWins(),
                opponent.getLosses()
        );

        String resultLabel = null;
        if (duel.getStatus() == DuelStatus.FINISHED) {
            resultLabel = duel.getWinnerPlayerId() == null
                    ? "DRAW"
                    : duel.getWinnerPlayerId().equals(viewerPlayerId) ? "VICTORY" : "DEFEAT";
        }

        return new DuelStateResponse(
                duel.getId(),
                duel.getStatus(),
                duel.getRoundNumber(),
                you,
                opponentView,
                yourAction != null,
                duel.getPendingActions().containsKey(duel.opponentId(viewerPlayerId)),
                duel.getStatus() == DuelStatus.ACTIVE && !isAutoBattleEnabled(duel, viewerPlayerId),
                DuelSelectedActionView.from(yourAction),
                duel.getRoundStartedAt(),
                duel.getRoundDeadlineAt(),
                isAutoBattleEnabled(duel, viewerPlayerId),
                getPendingAutoBattleEnabled(duel, viewerPlayerId),
                duel.getWinnerPlayerId(),
                resultLabel,
                duel.getRoundLogs().stream().map(RoundLogView::from).toList(),
                duel.getChatMessages().stream().map(DuelChatMessageView::from).toList(),
                duel.getCreatedAt(),
                duel.getUpdatedAt(),
                duel.getFinishedAt()
        );
    }

    private boolean isAutoBattleEnabled(Duel duel, String playerId) {
        if (duel.getPlayerOneId().equals(playerId)) {
            return duel.isPlayerOneAutoBattleEnabled();
        }
        if (duel.getPlayerTwoId().equals(playerId)) {
            return duel.isPlayerTwoAutoBattleEnabled();
        }
        throw new UnauthorizedException("Player is not part of this duel");
    }

    private void setAutoBattleEnabled(Duel duel, String playerId, boolean enabled) {
        if (duel.getPlayerOneId().equals(playerId)) {
            duel.setPlayerOneAutoBattleEnabled(enabled);
            return;
        }
        if (duel.getPlayerTwoId().equals(playerId)) {
            duel.setPlayerTwoAutoBattleEnabled(enabled);
            return;
        }
        throw new UnauthorizedException("Player is not part of this duel");
    }

    private Boolean getPendingAutoBattleEnabled(Duel duel, String playerId) {
        if (duel.getPlayerOneId().equals(playerId)) {
            return duel.getPlayerOneAutoBattlePendingEnabled();
        }
        if (duel.getPlayerTwoId().equals(playerId)) {
            return duel.getPlayerTwoAutoBattlePendingEnabled();
        }
        throw new UnauthorizedException("Player is not part of this duel");
    }

    private void setPendingAutoBattleEnabled(Duel duel, String playerId, Boolean enabled) {
        if (duel.getPlayerOneId().equals(playerId)) {
            duel.setPlayerOneAutoBattlePendingEnabled(enabled);
            return;
        }
        if (duel.getPlayerTwoId().equals(playerId)) {
            duel.setPlayerTwoAutoBattlePendingEnabled(enabled);
            return;
        }
        throw new UnauthorizedException("Player is not part of this duel");
    }

    private void verifyParticipant(Duel duel, String playerId) {
        if (!duel.isParticipant(playerId)) {
            throw new UnauthorizedException("Player is not part of this duel");
        }
    }

    private String normalizeChatMessage(String rawMessage) {
        if (rawMessage == null) {
            throw new BadRequestException("Сообщение не должно быть пустым");
        }
        String normalized = rawMessage.trim().replaceAll("\\s+", " ");
        if (normalized.isEmpty()) {
            throw new BadRequestException("Сообщение не должно быть пустым");
        }
        return normalized;
    }
}
