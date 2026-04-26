package com.example.sandalpunk.matchmaking;

import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.Map;

import com.example.sandalpunk.duel.Duel;
import com.example.sandalpunk.duel.DuelService;
import com.example.sandalpunk.duel.DuelStatus;
import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.logging.AppEventType;
import com.example.sandalpunk.player.PlayerProfile;
import com.example.sandalpunk.player.PlayerService;
import com.example.sandalpunk.web.NotFoundException;
import org.springframework.stereotype.Service;

@Service
public class MatchmakingService {

    private final MatchmakingRepository matchmakingRepository;
    private final DuelService duelService;
    private final PlayerService playerService;
    private final AppEventLogger appEventLogger;
    private final Clock clock;

    public MatchmakingService(
            MatchmakingRepository matchmakingRepository,
            DuelService duelService,
            PlayerService playerService,
            AppEventLogger appEventLogger,
            Clock clock
    ) {
        this.matchmakingRepository = matchmakingRepository;
        this.duelService = duelService;
        this.playerService = playerService;
        this.appEventLogger = appEventLogger;
        this.clock = clock;
    }

    public synchronized MatchmakingStatusResponse join(PlayerProfile playerProfile) {
        Duel activeDuel = resolveActiveDuel(playerProfile);
        if (activeDuel != null) {
            return new MatchmakingStatusResponse(
                    activeDuel.getStatus() == DuelStatus.ACTIVE ? MatchmakingStatusType.IN_DUEL : MatchmakingStatusType.COMPLETED,
                    activeDuel.getId(),
                    activeDuel.getStatus() == DuelStatus.ACTIVE ? "Match already active" : "Last duel completed",
                    null
            );
        }
        QueueEntry existingQueueEntry = matchmakingRepository.findByPlayerId(playerProfile.getId()).orElse(null);
        if (existingQueueEntry != null) {
            return queuedResponse("Already in matchmaking queue", existingQueueEntry.joinedAt());
        }
        QueueEntry opponentEntry = matchmakingRepository.findAll()
                .stream()
                .filter(entry -> !entry.playerId().equals(playerProfile.getId()))
                .min(Comparator.comparing(QueueEntry::joinedAt))
                .orElse(null);
        if (opponentEntry == null) {
            matchmakingRepository.save(new QueueEntry(playerProfile.getId(), clock.instant()));
            appEventLogger.info(
                    AppEventType.MATCHMAKING_JOIN,
                    "Player joined matchmaking",
                    Map.of("playerId", playerProfile.getId(), "displayName", playerProfile.displayName())
            );
            return queuedResponse("Waiting for an opponent", clock.instant());
        }

        matchmakingRepository.deleteByPlayerId(opponentEntry.playerId());
        PlayerProfile opponent = playerService.findRequiredById(opponentEntry.playerId());
        Duel duel = duelService.createDuel(opponent, playerProfile);
        playerService.setActiveDuel(opponent.getId(), duel.getId());
        playerService.setActiveDuel(playerProfile.getId(), duel.getId());
        return new MatchmakingStatusResponse(MatchmakingStatusType.IN_DUEL, duel.getId(), "Opponent found", null);
    }

    public synchronized MatchmakingStatusResponse cancel(PlayerProfile playerProfile) {
        matchmakingRepository.deleteByPlayerId(playerProfile.getId());
            appEventLogger.info(
                    AppEventType.MATCHMAKING_CANCEL,
                    "Player canceled matchmaking",
                    Map.of("playerId", playerProfile.getId(), "displayName", playerProfile.displayName())
            );
        return status(playerProfile);
    }

    public synchronized MatchmakingStatusResponse status(PlayerProfile playerProfile) {
        Duel activeDuel = resolveActiveDuel(playerProfile);
        if (activeDuel != null) {
            return new MatchmakingStatusResponse(
                    activeDuel.getStatus() == DuelStatus.ACTIVE ? MatchmakingStatusType.IN_DUEL : MatchmakingStatusType.COMPLETED,
                    activeDuel.getId(),
                    activeDuel.getStatus() == DuelStatus.ACTIVE ? "Duel in progress" : "Duel finished",
                    null
            );
        }
        QueueEntry queueEntry = matchmakingRepository.findByPlayerId(playerProfile.getId()).orElse(null);
        if (queueEntry != null) {
            return queuedResponse("Waiting for an opponent", queueEntry.joinedAt());
        }
        return new MatchmakingStatusResponse(MatchmakingStatusType.IDLE, null, "Ready to queue", null);
    }

    private Duel resolveActiveDuel(PlayerProfile playerProfile) {
        if (playerProfile.getActiveDuelId() == null) {
            return null;
        }
        Duel duel;
        try {
            duel = duelService.findRequired(playerProfile.getActiveDuelId());
        } catch (NotFoundException exception) {
            playerService.clearActiveDuel(playerProfile.getId());
            playerProfile.setActiveDuelId(null);
            return null;
        }
        if (duel.getStatus() != DuelStatus.ACTIVE) {
            playerService.clearActiveDuel(playerProfile.getId());
            playerProfile.setActiveDuelId(null);
            return null;
        }
        return duel;
    }

    private MatchmakingStatusResponse queuedResponse(String message, Instant queuedAt) {
        return new MatchmakingStatusResponse(MatchmakingStatusType.QUEUED, null, message, queuedAt);
    }
}
