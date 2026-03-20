package com.example.sandalpunk.matchmaking;

import java.time.Instant;

public record QueueEntry(
        String playerId,
        Instant joinedAt
) {
}

