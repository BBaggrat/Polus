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
        RiskLevel risk
) {
    public Encounter(
            String id,
            String contentId,
            EncounterType type,
            String title,
            String text,
            List<EncounterChoice> choices,
            PlayerResources reward,
            String risk
    ) {
        this(id, contentId, type, title, text, choices, reward, RiskLevel.fromRussian(risk));
    }
}
