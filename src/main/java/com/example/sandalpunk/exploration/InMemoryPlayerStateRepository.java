package com.example.sandalpunk.exploration;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Repository;

@Repository
public class InMemoryPlayerStateRepository implements PlayerStateRepository {

    private final ConcurrentHashMap<String, PlayerState> states = new ConcurrentHashMap<>();

    @Override
    public PlayerState save(PlayerState playerState) {
        states.put(playerState.getPlayerId(), playerState);
        return playerState;
    }

    @Override
    public Optional<PlayerState> findByPlayerId(String playerId) {
        return Optional.ofNullable(states.get(playerId));
    }
}
