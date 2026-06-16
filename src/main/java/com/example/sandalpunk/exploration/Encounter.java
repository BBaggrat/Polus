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
        RiskLevel risk,
        String chainId,
        String chainStepId,
        List<String> tags
) {
    public Encounter(
            String id,
            String contentId,
            EncounterType type,
            String title,
            String text,
            List<EncounterChoice> choices,
            PlayerResources reward,
            RiskLevel risk
    ) {
        this(id, contentId, type, title, text, choices, reward, risk, null, null, List.of());
    }

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

    public Encounter {
        tags = tags == null ? List.of() : List.copyOf(tags);
    }
}
