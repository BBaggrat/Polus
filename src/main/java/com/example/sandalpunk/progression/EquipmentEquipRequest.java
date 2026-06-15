package com.example.sandalpunk.progression;

public record EquipmentEquipRequest(
        String playerId,
        EquipmentSlot slot,
        String itemId
) {
}
