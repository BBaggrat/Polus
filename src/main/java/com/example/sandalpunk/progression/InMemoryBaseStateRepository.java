package com.example.sandalpunk.progression;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Repository;

@Repository
public class InMemoryBaseStateRepository implements BaseStateRepository {

    private final ConcurrentHashMap<String, BaseState> states = new ConcurrentHashMap<>();

    @Override
    public BaseState save(BaseState baseState) {
        states.put(baseState.getPlayerId(), baseState);
        return baseState;
    }

    @Override
    public Optional<BaseState> findByPlayerId(String playerId) {
        return Optional.ofNullable(states.get(playerId));
    }
}
