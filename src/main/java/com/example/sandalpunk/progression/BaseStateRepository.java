package com.example.sandalpunk.progression;

import java.util.Optional;

public interface BaseStateRepository {

    BaseState save(BaseState baseState);

    Optional<BaseState> findByPlayerId(String playerId);
}
