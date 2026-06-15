package com.example.sandalpunk.progression;

public record UpgradeEffect(
        UpgradeEffectType type,
        double value,
        String description
) {
}
