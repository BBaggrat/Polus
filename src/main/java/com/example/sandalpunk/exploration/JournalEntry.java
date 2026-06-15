package com.example.sandalpunk.exploration;

import java.time.Instant;
import java.util.Map;

public record JournalEntry(
        String id,
        String explorationId,
        String playerId,
        JournalEntryType type,
        String text,
        Instant createdAt,
        Map<String, String> metadata
) {
}
