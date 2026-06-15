package com.example.sandalpunk.progression;

import java.util.List;

public record EquipmentView(
        EquipmentState equipment,
        List<EquipmentCatalogItem> items
) {
}
