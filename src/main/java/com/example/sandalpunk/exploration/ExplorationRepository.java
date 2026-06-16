package com.example.sandalpunk.exploration;

import java.util.List;
import java.util.Optional;

public interface ExplorationRepository {

    ExplorationState save(ExplorationState explorationState);

    Optional<ExplorationState> findById(String explorationId);

    Optional<ExplorationState> findActiveByPlayerId(String playerId);

    List<ExplorationState> findByPlayerId(String playerId);

    List<ExplorationState> findAll();
}
