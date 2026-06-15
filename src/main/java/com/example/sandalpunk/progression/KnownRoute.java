package com.example.sandalpunk.progression;

import java.util.List;

public record KnownRoute(
        String id,
        String name,
        String description,
        int requiredFragments,
        boolean isUnlocked,
        boolean isSelected,
        List<UpgradeEffect> effects
) {
}
