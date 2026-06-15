package com.example.sandalpunk.exploration;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Repository;

@Repository
public class InMemoryExplorationRepository implements ExplorationRepository {

    private final ConcurrentHashMap<String, ExplorationState> explorations = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> activeByPlayer = new ConcurrentHashMap<>();

    @Override
    public ExplorationState save(ExplorationState explorationState) {
        explorations.put(explorationState.getExplorationId(), explorationState);
        if (explorationState.getStatus() == ExplorationStatus.ACTIVE) {
            activeByPlayer.put(explorationState.getPlayerId(), explorationState.getExplorationId());
        } else {
            activeByPlayer.remove(explorationState.getPlayerId(), explorationState.getExplorationId());
        }
        return explorationState;
    }

    @Override
    public Optional<ExplorationState> findById(String explorationId) {
        return Optional.ofNullable(explorations.get(explorationId));
    }

    @Override
    public Optional<ExplorationState> findActiveByPlayerId(String playerId) {
        String explorationId = activeByPlayer.get(playerId);
        if (explorationId == null) {
            return Optional.empty();
        }
        ExplorationState explorationState = explorations.get(explorationId);
        if (explorationState == null || explorationState.getStatus() != ExplorationStatus.ACTIVE) {
            activeByPlayer.remove(playerId, explorationId);
            return Optional.empty();
        }
        return Optional.of(explorationState);
    }
}
