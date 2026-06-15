package com.example.sandalpunk.exploration;

public record ExplorationStartRequest(
        String playerId,
        ExplorationVisibilityMode visibilityMode
) {
}
