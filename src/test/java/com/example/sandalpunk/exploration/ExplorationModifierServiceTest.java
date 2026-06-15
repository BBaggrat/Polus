package com.example.sandalpunk.exploration;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import com.example.sandalpunk.config.DuelBalanceProperties;
import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.player.PlayerProfile;
import com.example.sandalpunk.progression.BaseService;
import com.example.sandalpunk.progression.EquipmentService;
import com.example.sandalpunk.progression.InMemoryBaseStateRepository;
import com.example.sandalpunk.progression.InMemoryEquipmentStateRepository;
import com.example.sandalpunk.progression.InMemoryMapProgressRepository;
import com.example.sandalpunk.progression.MapService;
import com.example.sandalpunk.progression.ProgressionBalance;
import org.junit.jupiter.api.Test;

class ExplorationModifierServiceTest {

    @Test
    void storageLevelOneReducesHiddenFailureLossFromFiftyToFortyPercent() {
        Instant now = Instant.parse("2026-06-15T12:00:00Z");
        Clock clock = Clock.fixed(now, ZoneOffset.UTC);
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
        BaseService baseService = new BaseService(
                new InMemoryBaseStateRepository(),
                mapService,
                playerStateService,
                balance,
                logger,
                clock
        );
        EquipmentService equipmentService = new EquipmentService(
                new InMemoryEquipmentStateRepository(),
                baseService,
                playerStateService,
                balance,
                logger,
                clock
        );
        ExplorationModifierService service = new ExplorationModifierService(
                baseService,
                equipmentService,
                mapService,
                logger
        );
        PlayerProfile player = new PlayerProfile(
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
        baseService.buyUpgrade(player, "storage");
        ExplorationState exploration = new ExplorationState(
                "exp-1",
                player.getId(),
                ExplorationStatus.ACTIVE,
                ExplorationVisibilityMode.HIDDEN,
                2,
                8,
                new PlayerResources(10, 10, 10),
                now
        );

        ExplorationModifierService.FailureOutcome result = service.failureOutcome(player, exploration);

        assertThat(result.lossPercent()).isEqualTo(40);
        assertThat(result.preserved()).isEqualTo(new PlayerResources(6, 6, 6));
        assertThat(result.lost()).isEqualTo(new PlayerResources(4, 4, 4));
    }
}
