package com.example.sandalpunk.progression;

import java.util.List;

import com.example.sandalpunk.exploration.PlayerResources;

public record BaseUpgrade(
        String id,
        BaseUpgradeType type,
        String name,
        String description,
        int level,
        int maxLevel,
        PlayerResources cost,
        List<UpgradeEffect> effects,
        boolean isUnlocked
) {
}
