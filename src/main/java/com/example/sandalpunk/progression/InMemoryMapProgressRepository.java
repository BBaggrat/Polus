package com.example.sandalpunk.progression;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Repository;

@Repository
public class InMemoryMapProgressRepository implements MapProgressRepository {

    private final ConcurrentHashMap<String, MapProgress> states = new ConcurrentHashMap<>();

    @Override
    public MapProgress save(MapProgress mapProgress) {
        states.put(mapProgress.getPlayerId(), mapProgress);
        return mapProgress;
    }

    @Override
    public Optional<MapProgress> findByPlayerId(String playerId) {
        return Optional.ofNullable(states.get(playerId));
    }
}
