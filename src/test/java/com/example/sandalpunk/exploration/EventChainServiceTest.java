package com.example.sandalpunk.exploration;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;

import org.junit.jupiter.api.Test;

class EventChainServiceTest {

    @Test
    void exposesFiveStageFourChainsAndAdvancesOneStep() {
        EventChainService service = new EventChainService(new ContentBalance());
        ExplorationState state = new ExplorationState(
                "exp-1",
                "player-1",
                ExplorationStatus.ACTIVE,
                ExplorationVisibilityMode.HIDDEN,
                1,
                8,
                PlayerResources.empty(),
                Instant.parse("2026-06-16T10:00:00Z")
        );
        state.setActiveChainId("chain_underwater_sign");
        state.setActiveChainStep("sign");

        Encounter encounter = service.nextChainEncounter(state).orElseThrow();
        EventChainService.ChainResolution resolution = service.resolveChoice(
                state,
                encounter,
                encounter.choices().get(0)
        );

        assertThat(service.catalog()).hasSize(5);
        assertThat(encounter.chainId()).isEqualTo("chain_underwater_sign");
        assertThat(resolution.status()).isEqualTo(EventChainService.ChainResolutionStatus.ADVANCED);
        assertThat(state.getActiveChainStep()).isEqualTo("mark");
    }
}
