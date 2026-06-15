package com.example.sandalpunk.exploration;

import java.util.List;

public record Encounter(
        String id,
        String contentId,
        EncounterType type,
        String title,
        String text,
        List<EncounterChoice> choices,
        PlayerResources reward,
        String risk
) {
}
