package com.example.sandalpunk.progression;

import java.util.Optional;

public interface EquipmentStateRepository {

    EquipmentState save(EquipmentState equipmentState);

    Optional<EquipmentState> findByPlayerId(String playerId);
}
