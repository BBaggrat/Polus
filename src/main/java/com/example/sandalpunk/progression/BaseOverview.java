package com.example.sandalpunk.progression;

import java.util.List;

import com.example.sandalpunk.exploration.PlayerState;

public record BaseOverview(
        BaseState base,
        PlayerState player,
        EquipmentState equipment,
        List<EquipmentCatalogItem> equipmentCatalog,
        MapView map
) {
}
