package com.example.sandalpunk.exploration;

public record EncounterChoice(
        String id,
        String text,
        ChoiceResultType resultType,
        RiskLevel riskLevel,
        PlayerResources reward,
        int hpDelta,
        String resultText
) {
    public EncounterChoice(
            String id,
            String text,
            ChoiceResultType resultType,
            String riskLevel,
            PlayerResources reward,
            int hpDelta,
            String resultText
    ) {
        this(id, text, resultType, RiskLevel.fromRussian(riskLevel), reward, hpDelta, resultText);
    }
}
