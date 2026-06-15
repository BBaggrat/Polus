package com.example.sandalpunk.progression;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import com.example.sandalpunk.config.DuelBalanceProperties;
import com.example.sandalpunk.exploration.InMemoryPlayerStateRepository;
import com.example.sandalpunk.exploration.PlayerResources;
import com.example.sandalpunk.exploration.PlayerStateService;
import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.player.PlayerProfile;
import org.junit.jupiter.api.Test;

class BaseServiceTest {

    @Test
    void firstStorageLevelCostsTwoSuppliesAndProtectsTenPercent() {
        Clock clock = Clock.fixed(Instant.parse("2026-06-15T12:00:00Z"), ZoneOffset.UTC);
        PlayerStateService playerStateService = new PlayerStateService(
                new InMemoryPlayerStateRepository(),
                new DuelBalanceProperties(),
                clock
        );
        AppEventLogger logger = new AppEventLogger(clock);
        ProgressionBalance balance = new ProgressionBalance();
        MapService mapService = new MapService(
                new InMemoryMapProgressRepository(),
                balance,
                logger,
                clock
        );
        BaseService service = new BaseService(
                new InMemoryBaseStateRepository(),
                mapService,
                playerStateService,
                balance,
                logger,
                clock
        );
        PlayerProfile player = player();

        BaseState state = service.buyUpgrade(player, "storage");

        assertThat(state.getStorageProtectionLevel()).isEqualTo(1);
        assertThat(service.level(player, BaseUpgradeType.STORAGE)).isEqualTo(1);
        assertThat(playerStateService.getOrCreate(player).getResources())
                .isEqualTo(new PlayerResources(0, 1, 0));
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
}
