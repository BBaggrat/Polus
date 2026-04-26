package com.example.sandalpunk.matchmaking;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import com.example.sandalpunk.duel.DuelService;
import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.player.PlayerProfile;
import com.example.sandalpunk.player.PlayerService;
import com.example.sandalpunk.web.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MatchmakingServiceTest {

    @Mock
    private MatchmakingRepository matchmakingRepository;

    @Mock
    private DuelService duelService;

    @Mock
    private PlayerService playerService;

    @Mock
    private AppEventLogger appEventLogger;

    private Clock clock;
    private MatchmakingService matchmakingService;

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(Instant.parse("2026-04-26T12:00:00Z"), ZoneOffset.UTC);
        matchmakingService = new MatchmakingService(
                matchmakingRepository,
                duelService,
                playerService,
                appEventLogger,
                clock
        );
    }

    @Test
    void statusClearsMissingActiveDuelAndReturnsIdle() {
        PlayerProfile playerProfile = registeredPlayer("player-1");
        playerProfile.setActiveDuelId("stale-duel");

        when(duelService.findRequired("stale-duel")).thenThrow(new NotFoundException("Duel not found: stale-duel"));
        when(matchmakingRepository.findByPlayerId(playerProfile.getId())).thenReturn(Optional.empty());

        MatchmakingStatusResponse response = matchmakingService.status(playerProfile);

        assertEquals(MatchmakingStatusType.IDLE, response.status());
        assertNull(response.duelId());
        assertEquals("Ready to queue", response.message());
        assertNull(playerProfile.getActiveDuelId());
        verify(playerService).clearActiveDuel(playerProfile.getId());
    }

    @Test
    void joinClearsMissingActiveDuelAndPlacesPlayerIntoQueue() {
        PlayerProfile playerProfile = registeredPlayer("player-2");
        playerProfile.setActiveDuelId("stale-duel");

        when(duelService.findRequired("stale-duel")).thenThrow(new NotFoundException("Duel not found: stale-duel"));
        when(matchmakingRepository.findByPlayerId(playerProfile.getId())).thenReturn(Optional.empty());
        when(matchmakingRepository.findAll()).thenReturn(List.of());

        MatchmakingStatusResponse response = matchmakingService.join(playerProfile);

        assertEquals(MatchmakingStatusType.QUEUED, response.status());
        assertNull(response.duelId());
        assertEquals("Waiting for an opponent", response.message());
        assertNull(playerProfile.getActiveDuelId());
        verify(playerService).clearActiveDuel(playerProfile.getId());
        verify(matchmakingRepository).save(any(QueueEntry.class));
        verify(playerService, never()).setActiveDuel(any(), any());
    }

    private PlayerProfile registeredPlayer(String id) {
        return new PlayerProfile(
                id,
                "identity-" + id,
                123L,
                "user_" + id,
                "Player_" + id,
                "Player",
                "Test",
                "ru",
                "M",
                0,
                0,
                clock.instant(),
                clock.instant()
        );
    }
}
