package com.example.sandalpunk.progression;

import java.util.List;

import com.example.sandalpunk.exploration.PlayerResources;

public record EquipmentCatalogItem(
        String id,
        EquipmentSlot slot,
        String name,
        int level,
        int maxLevel,
        String description,
        List<EquipmentEffect> effects,
        PlayerResources upgradeCost,
        boolean unlocked,
        boolean owned,
        boolean equipped
) {
}
