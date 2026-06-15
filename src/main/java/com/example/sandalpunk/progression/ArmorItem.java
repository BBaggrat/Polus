package com.example.sandalpunk.progression;

import java.util.List;

public record ArmorItem(
        String id,
        String name,
        int level,
        int maxLevel,
        String description,
        List<EquipmentEffect> effects
) {
}
