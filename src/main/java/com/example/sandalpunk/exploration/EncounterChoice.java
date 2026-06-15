package com.example.sandalpunk.exploration;

public record EncounterChoice(
        String id,
        String text,
        ChoiceResultType resultType,
        String riskLevel,
        PlayerResources reward,
        int hpDelta,
        String resultText
) {
}
