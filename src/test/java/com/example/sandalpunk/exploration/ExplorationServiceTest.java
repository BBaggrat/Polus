package com.example.sandalpunk.exploration;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import com.example.sandalpunk.config.DuelBalanceProperties;
import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.player.PlayerProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ExplorationServiceTest {

    private static final Instant NOW = Instant.parse("2026-06-15T12:00:00Z");

    private PlayerStateService playerStateService;
    private ExplorationService explorationService;
    private PlayerProfile player;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(NOW, ZoneOffset.UTC);
        InMemoryPlayerStateRepository playerRepository = new InMemoryPlayerStateRepository();
        playerStateService = new PlayerStateService(
                playerRepository,
                new DuelBalanceProperties(),
                clock
        );
        explorationService = new ExplorationService(
                new InMemoryExplorationRepository(),
                new InMemoryJournalRepository(),
                playerStateService,
                new PredictableEncounterGenerator(),
                new AppEventLogger(clock),
                clock
        );
        player = new PlayerProfile(
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
                NOW,
                NOW
        );
    }

    @Test
    void hiddenExplorationCollectsLootAndTransfersItOnReturn() {
        ExplorationState exploration = explorationService.start(
                player,
                new ExplorationStartRequest(player.getId(), ExplorationVisibilityMode.HIDDEN)
        );

        exploration = explorationService.step(
                player,
                exploration.getExplorationId(),
                new ExplorationStepRequest(player.getId(), exploration.getExplorationId())
        );

        assertThat(exploration.getCurrentEncounter()).isNotNull();
        assertThat(exploration.getCurrentEncounter().type()).isEqualTo(EncounterType.LOOT);

        exploration = explorationService.choose(
                player,
                exploration.getExplorationId(),
                new ExplorationChoiceRequest(player.getId(), "take")
        );

        assertThat(exploration.getCollectedResources()).isEqualTo(new PlayerResources(1, 1, 0));

        ExplorationState returned = explorationService.returnToBase(
                player,
                exploration.getExplorationId(),
                new ExplorationReturnRequest(player.getId())
        );
        PlayerState playerState = playerStateService.getOrCreate(player);

        assertThat(returned.getStatus()).isEqualTo(ExplorationStatus.RETURNED);
        assertThat(playerState.getCurrentExplorationId()).isNull();
        assertThat(playerState.getResources()).isEqualTo(new PlayerResources(1, 4, 0));
    }

    @Test
    void openPvpChoiceSignalsExistingDuelFlow() {
        ExplorationState exploration = explorationService.start(
                player,
                new ExplorationStartRequest(player.getId(), ExplorationVisibilityMode.OPEN_PVP)
        );
        exploration = explorationService.step(
                player,
                exploration.getExplorationId(),
                new ExplorationStepRequest(player.getId(), exploration.getExplorationId())
        );
        exploration = explorationService.choose(
                player,
                exploration.getExplorationId(),
                new ExplorationChoiceRequest(player.getId(), "track")
        );

        assertThat(exploration.isStartPvpDuel()).isTrue();
        assertThat(exploration.getVisibilityMode()).isEqualTo(ExplorationVisibilityMode.OPEN_PVP);
    }

    private static final class PredictableEncounterGenerator extends EncounterGenerator {

        @Override
        protected int nextInt(int bound) {
            return 0;
        }

        @Override
        protected double nextDouble() {
            return 0.0d;
        }
    }
}
