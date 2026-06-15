package com.example.sandalpunk.progression;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.player.PlayerProfile;
import org.junit.jupiter.api.Test;

class MapServiceTest {

    @Test
    void fragmentsUnlockAndAllowSelectingQuietRoute() {
        Clock clock = Clock.fixed(Instant.parse("2026-06-15T12:00:00Z"), ZoneOffset.UTC);
        AlwaysDiscoverMapService service = new AlwaysDiscoverMapService(
                new InMemoryMapProgressRepository(),
                new ProgressionBalance(),
                new AppEventLogger(clock),
                clock
        );
        PlayerProfile player = player();

        service.discoverFragment(player, "exp-1", 100);
        service.discoverFragment(player, "exp-1", 100);
        MapView view = service.selectRoute(player, ProgressionBalance.ROUTE_QUIET_WALKWAY);

        assertThat(view.fragmentsFound()).isEqualTo(2);
        assertThat(view.selectedRouteId()).isEqualTo(ProgressionBalance.ROUTE_QUIET_WALKWAY);
        assertThat(view.riskReductionPercent()).isEqualTo(5);
    }

    private PlayerProfile player() {
        Instant now = Instant.parse("2026-06-15T12:00:00Z");
        return new PlayerProfile(
                "player-1",
                "test:player-1",
                null,
                "survivor",
                "Выживший",
                "Выживший",
                null,
                "ru",
                "M",
                0,
                0,
                now,
                now
        );
    }

    private static final class AlwaysDiscoverMapService extends MapService {

        private AlwaysDiscoverMapService(
                MapProgressRepository repository,
                ProgressionBalance balance,
                AppEventLogger eventLogger,
                Clock clock
        ) {
            super(repository, balance, eventLogger, clock);
        }

        @Override
        protected int nextInt(int bound) {
            return 0;
        }
    }
}
