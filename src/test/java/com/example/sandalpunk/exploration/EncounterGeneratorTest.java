package com.example.sandalpunk.exploration;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.stream.IntStream;

import org.junit.jupiter.api.Test;

class EncounterGeneratorTest {

    private final EncounterGenerator generator = new EncounterGenerator();

    @Test
    void exposesRequiredStageTwoContentCounts() {
        assertThat(generator.hiddenContentCount()).isEqualTo(20);
        assertThat(generator.openPvpContentCount()).isEqualTo(7);
    }

    @Test
    void hiddenModeNeverGeneratesPvpEncounter() {
        assertThat(IntStream.range(0, 500)
                .mapToObj(ignored -> generator.nextEncounter(ExplorationVisibilityMode.HIDDEN))
                .map(Encounter::type))
                .doesNotContain(EncounterType.PVP_TRACE, EncounterType.PVP_ENCOUNTER);
    }

    @Test
    void everyEncounterOffersTwoOrThreeChoices() {
        assertThat(IntStream.range(0, 200)
                .mapToObj(ignored -> generator.nextEncounter(ExplorationVisibilityMode.HIDDEN))
                .map(encounter -> encounter.choices().size()))
                .allMatch(size -> size >= 2 && size <= 3);

        assertThat(IntStream.range(0, 200)
                .mapToObj(ignored -> generator.nextEncounter(ExplorationVisibilityMode.OPEN_PVP))
                .map(encounter -> encounter.choices().size()))
                .allMatch(size -> size >= 2 && size <= 3);
    }
}
