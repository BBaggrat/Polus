package com.example.sandalpunk.progression;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Repository;

@Repository
public class InMemoryEquipmentStateRepository implements EquipmentStateRepository {

    private final ConcurrentHashMap<String, EquipmentState> states = new ConcurrentHashMap<>();

    @Override
    public EquipmentState save(EquipmentState equipmentState) {
        states.put(equipmentState.getPlayerId(), equipmentState);
        return equipmentState;
    }

    @Override
    public Optional<EquipmentState> findByPlayerId(String playerId) {
        return Optional.ofNullable(states.get(playerId));
    }
}
