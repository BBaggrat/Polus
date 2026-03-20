package com.example.sandalpunk.duel;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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
        Duel duel = new Duel(
                UUID.randomUUID().toString(),
                playerOne.getId(),
                playerOne.displayName(),
                playerTwo.getId(),
                playerTwo.displayName(),
                clock.instant()
        );
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
        return toState(duel, viewer.getId());
    }

    public DuelStateResponse submitAction(String duelId, PlayerProfile actor, DuelActionRequest request) {
        Duel duel = findRequired(duelId);
        verifyParticipant(duel, actor.getId());
        synchronized (duel) {
            if (duel.getStatus() != DuelStatus.ACTIVE) {
                throw new ConflictException("Duel is already finished");
            }
            if (duel.getPendingActions().containsKey(actor.getId())) {
                throw new ConflictException("Action already submitted for this round");
            }
            duel.getPendingActions().put(
                    actor.getId(),
                    new DuelRoundAction(
                            actor.getId(),
                            duel.getRoundNumber(),
                            request.weapon(),
                            request.shotDirection(),
                            request.dodgeDirection(),
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
                    clock.instant()
            ));
            while (duel.getChatMessages().size() > MAX_CHAT_MESSAGES) {
                duel.getChatMessages().remove(0);
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
            duel.incrementRoundNumber();
        }
    }

    private DuelStateResponse toState(Duel duel, String viewerPlayerId) {
        PlayerProfile viewer = playerService.findRequiredById(viewerPlayerId);
        PlayerProfile opponent = playerService.findRequiredById(duel.opponentId(viewerPlayerId));

        boolean viewerIsPlayerOne = duel.getPlayerOneId().equals(viewerPlayerId);
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
                duel.getPendingActions().containsKey(viewerPlayerId),
                duel.getPendingActions().containsKey(duel.opponentId(viewerPlayerId)),
                duel.getStatus() == DuelStatus.ACTIVE && !duel.getPendingActions().containsKey(viewerPlayerId),
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
