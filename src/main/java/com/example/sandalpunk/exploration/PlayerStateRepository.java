package com.example.sandalpunk.exploration;

import java.util.Optional;

public interface PlayerStateRepository {

    PlayerState save(PlayerState playerState);

    Optional<PlayerState> findByPlayerId(String playerId);
}
