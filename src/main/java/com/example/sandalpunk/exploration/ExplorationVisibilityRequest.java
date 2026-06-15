package com.example.sandalpunk.exploration;

public record ExplorationVisibilityRequest(
        String playerId,
        ExplorationVisibilityMode visibilityMode
) {
}
