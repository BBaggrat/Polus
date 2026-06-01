package com.example.sandalpunk.player;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verifyNoInteractions;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import com.example.sandalpunk.auth.AuthenticatedUser;
import com.example.sandalpunk.logging.AppEventLogger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PlayerServiceTest {

    @Mock
    private PlayerRepository playerRepository;

    @Mock
    private AppEventLogger appEventLogger;

    private PlayerService playerService;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.parse("2026-06-01T08:00:00Z"), ZoneOffset.UTC);
        playerService = new PlayerService(playerRepository, clock, appEventLogger);
    }

    @Test
    void browserDemoProfilesStayInMemory() {
        PlayerProfile profile = playerService.createOrUpdate(browserDemoUser("guest-1"));

        assertTrue(profile.getId().startsWith("browser-demo-"));

        PlayerProfile registered = playerService.registerNickname(profile.getId(), "DemoOne", "M");
        playerService.setActiveDuel(profile.getId(), "duel-1");
        playerService.rewardVictory(profile.getId(), 100, 10);

        PlayerProfile reloaded = playerService.findRequiredById(profile.getId());
        assertEquals(registered.getId(), reloaded.getId());
        assertEquals("DemoOne", reloaded.getNickname());
        assertEquals("duel-1", reloaded.getActiveDuelId());
        assertEquals(100, reloaded.getCoins());
        assertEquals(10, reloaded.getRating());

        verifyNoInteractions(playerRepository);
    }

    @Test
    void browserDemoSessionReusesGuestIdentity() {
        PlayerProfile firstSession = playerService.createOrUpdate(browserDemoUser("guest-2"));
        playerService.registerNickname(firstSession.getId(), "DemoTwo", "W");

        PlayerProfile secondSession = playerService.createOrUpdate(browserDemoUser("guest-2"));

        assertEquals(firstSession.getId(), secondSession.getId());
        assertEquals("DemoTwo", secondSession.getNickname());

        verifyNoInteractions(playerRepository);
    }

    private AuthenticatedUser browserDemoUser(String guestId) {
        return new AuthenticatedUser(
                "browser-demo:" + guestId,
                null,
                null,
                "Browser demo",
                null,
                "ru",
                false,
                false
        );
    }
}
