package com.example.sandalpunk.progression;

import java.util.Optional;

public interface MapProgressRepository {

    MapProgress save(MapProgress mapProgress);

    Optional<MapProgress> findByPlayerId(String playerId);
}
