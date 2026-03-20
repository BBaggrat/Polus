package com.example.sandalpunk.matchmaking;

import java.time.Instant;

public record MatchmakingStatusResponse(
        MatchmakingStatusType status,
        String duelId,
        String message,
        Instant queuedAt
) {
}
