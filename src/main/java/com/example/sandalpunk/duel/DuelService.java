package com.example.sandalpunk.duel;

import java.time.Clock;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

import com.example.sandalpunk.config.DuelBalanceProperties;
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

    private static final Pattern LINK_PATTERN = Pattern.compile(
            "(?i)\\b(?:https?://|www\\.|t\\.me/|telegram\\.me/|[a-z0-9-]+(?:\\.[a-z0-9-]+)+(?:/|\\b))"
    );

    private final DuelRepository duelRepository;
    private final DuelEngine duelEngine;
    private final PlayerService playerService;
    private final AppEventLogger appEventLogger;
    private final Clock clock;
    private final DuelBalanceProperties balance;

    public DuelService(
            DuelRepository duelRepository,
            DuelEngine duelEngine,
            PlayerService playerService,
            AppEventLogger appEventLogger,
            Clock clock,
            DuelBalanceProperties balance
    ) {
        this.duelRepository = duelRepository;
        this.duelEngine = duelEngine;
        this.playerService = playerService;
        this.appEventLogger = appEventLogger;
        this.clock = clock;
        this.balance = balance;
    }

    public Duel createDuel(PlayerProfile playerOne, PlayerProfile playerTwo) {
        Instant now = clock.instant();
        Duel duel = new Duel(
                UUID.randomUUID().toString(),
                playerOne.getId(),
                playerOne.displayName(),
                playerTwo.getId(),
                playerTwo.displayName(),
                balance.getStartingHp(),
                now
        );
        duel.setRoundDeadlineAt(now.plusSeconds(balance.getRoundTimeoutSeconds()));
        duelRepository.save(duel);
        appEventLogger.info(
                AppEventType.DUEL_STARTED,
                "Duel started",
                Map.of(
                        "duelId", duel.getId(),
                        "playerOneId", duel.getPlayerOneId(),
                        "playerTwoId", duel.getPlayerTwoId(),
                        "balanceVersion", balance.getBalanceVersion()
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
                        "round", duel.getRoundNumber(),
                        "weapon", request.weapon(),
                        "shotDirection", request.shotDirection(),
                        "dodgeDirection", request.dodgeDirection()
                    )
            );
            logSelectionEvents(duel, actor, request);

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
            throw new BadRequestException("Автобой отключен");
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

            playerService.rewardVictory(
                    winnerPlayerId,
                    balance.getRewards().getVictoryCoins(),
                    balance.getRewards().getRatingDelta()
            );
            playerService.rewardDefeat(
                    actorId,
                    balance.getRewards().getDefeatCoins(),
                    -balance.getRewards().getRatingDelta()
            );

            appEventLogger.info(
                    AppEventType.PLAYER_DEFEATED,
                    "Player defeated by forfeit",
                    Map.of(
                            "duelId", duel.getId(),
                            "playerId", actorId,
                            "winnerPlayerId", winnerPlayerId,
                            "result", "forfeit"
                    )
            );
            appEventLogger.info(
                    AppEventType.DUEL_FINISHED,
                    "Duel finished by forfeit",
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
            duel.setRoundDeadlineAt(now.plusSeconds(balance.getRoundTimeoutSeconds()));
        }

        if (!now.isBefore(duel.getRoundDeadlineAt())) {
            applyTimeoutDefaultsIfNeeded(duel, now);
            if (duel.getPendingActions().size() == 2) {
                resolveRound(duel);
            }
        }
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

    private void resolveRound(Duel duel) {
        DuelRoundAction playerOneAction = duel.getPendingActions().get(duel.getPlayerOneId());
        DuelRoundAction playerTwoAction = duel.getPendingActions().get(duel.getPlayerTwoId());
        int playerOneHpBefore = duel.getPlayerOneHp();
        int playerTwoHpBefore = duel.getPlayerTwoHp();
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
        logDamageApplied(
                duel,
                playerTwoAction,
                duel.getPlayerOneId(),
                playerOneHpBefore,
                resolution.playerOneHpAfter()
        );
        logDamageApplied(
                duel,
                playerOneAction,
                duel.getPlayerTwoId(),
                playerTwoHpBefore,
                resolution.playerTwoHpAfter()
        );

        if (resolution.duelStatus() == DuelStatus.FINISHED) {
            duel.setStatus(DuelStatus.FINISHED);
            duel.setWinnerPlayerId(resolution.winnerPlayerId());
            duel.setFinishedAt(clock.instant());
            if (resolution.winnerPlayerId() != null) {
                String loserPlayerId = duel.opponentId(resolution.winnerPlayerId());
                playerService.rewardVictory(
                        resolution.winnerPlayerId(),
                        balance.getRewards().getVictoryCoins(),
                        balance.getRewards().getRatingDelta()
                );
                playerService.rewardDefeat(
                        loserPlayerId,
                        balance.getRewards().getDefeatCoins(),
                        -balance.getRewards().getRatingDelta()
                );
            } else {
                playerService.rewardDraw(duel.getPlayerOneId());
                playerService.rewardDraw(duel.getPlayerTwoId());
            }
            logDefeatedPlayers(duel, resolution);
            appEventLogger.info(
                    AppEventType.DUEL_FINISHED,
                    "Duel finished",
                    Map.of(
                            "duelId", duel.getId(),
                            "winnerPlayerId", String.valueOf(resolution.winnerPlayerId()),
                            "result", resolution.winnerPlayerId() == null ? "draw" : "victory",
                            "round", duel.getRoundNumber()
                    )
            );
        } else {
            startNextRound(duel, clock.instant());
        }
    }

    private void startNextRound(Duel duel, Instant now) {
        duel.incrementRoundNumber();
        duel.setRoundStartedAt(now);
        duel.setRoundDeadlineAt(now.plusSeconds(balance.getRoundTimeoutSeconds()));
    }

    private void trimChatIfNeeded(Duel duel) {
        while (duel.getChatMessages().size() > balance.getMaxChatMessages()) {
            duel.getChatMessages().remove(0);
        }
    }

    private void logSelectionEvents(Duel duel, PlayerProfile actor, DuelActionRequest request) {
        Map<String, Object> commonMetadata = Map.of(
                "duelId", duel.getId(),
                "playerId", actor.getId(),
                "round", duel.getRoundNumber()
        );
        appEventLogger.info(
                AppEventType.WEAPON_SELECTED,
                "Weapon selected",
                withValue(commonMetadata, "weapon", request.weapon())
        );
        appEventLogger.info(
                AppEventType.SHOT_DIRECTION_SELECTED,
                "Shot direction selected",
                withValue(commonMetadata, "shotDirection", request.shotDirection())
        );
        appEventLogger.info(
                AppEventType.DODGE_DIRECTION_SELECTED,
                "Dodge direction selected",
                withValue(commonMetadata, "dodgeDirection", request.dodgeDirection())
        );
    }

    private Map<String, Object> withValue(Map<String, Object> metadata, String key, Object value) {
        Map<String, Object> enriched = new LinkedHashMap<>(metadata);
        enriched.put(key, value);
        return enriched;
    }

    private void logDamageApplied(
            Duel duel,
            DuelRoundAction attackerAction,
            String targetPlayerId,
            int hpBefore,
            int hpAfter
    ) {
        int damage = Math.max(0, hpBefore - hpAfter);
        if (damage == 0) {
            return;
        }
        appEventLogger.info(
                AppEventType.DAMAGE_APPLIED,
                "Damage applied",
                Map.of(
                        "duelId", duel.getId(),
                        "round", duel.getRoundNumber(),
                        "attackerPlayerId", attackerAction.playerId(),
                        "targetPlayerId", targetPlayerId,
                        "weapon", attackerAction.weapon(),
                        "damage", damage,
                        "remainingHp", hpAfter
                )
        );
    }

    private void logDefeatedPlayers(Duel duel, DuelEngine.RoundResolution resolution) {
        if (resolution.playerOneHpAfter() <= 0) {
            logPlayerDefeated(duel, duel.getPlayerOneId(), resolution.winnerPlayerId());
        }
        if (resolution.playerTwoHpAfter() <= 0) {
            logPlayerDefeated(duel, duel.getPlayerTwoId(), resolution.winnerPlayerId());
        }
    }

    private void logPlayerDefeated(Duel duel, String playerId, String winnerPlayerId) {
        appEventLogger.info(
                AppEventType.PLAYER_DEFEATED,
                "Player defeated",
                Map.of(
                        "duelId", duel.getId(),
                        "playerId", playerId,
                        "winnerPlayerId", String.valueOf(winnerPlayerId),
                        "round", duel.getRoundNumber(),
                        "result", winnerPlayerId == null ? "draw" : "defeat"
                )
        );
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
                viewer.getRating()
        );
        DuelParticipantView opponentView = new DuelParticipantView(
                opponent.getId(),
                opponent.displayName(),
                viewerIsPlayerOne ? duel.getPlayerTwoHp() : duel.getPlayerOneHp(),
                opponent.getRating()
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
                duel.getStatus() == DuelStatus.ACTIVE,
                DuelSelectedActionView.from(yourAction),
                duel.getRoundStartedAt(),
                duel.getRoundDeadlineAt(),
                false,
                null,
                duel.getWinnerPlayerId(),
                resultLabel,
                duel.getRoundLogs().stream().map(RoundLogView::from).toList(),
                duel.getChatMessages().stream().map(DuelChatMessageView::from).toList(),
                duel.getCreatedAt(),
                duel.getUpdatedAt(),
                duel.getFinishedAt()
        );
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

