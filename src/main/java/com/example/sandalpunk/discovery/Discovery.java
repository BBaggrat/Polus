package com.example.sandalpunk.discovery;

import java.time.Instant;
import java.util.List;

public record Discovery(
        String id,
        String playerId,
        DiscoveryType type,
        String title,
        String text,
        String sourceEventId,
        Instant discoveredAt,
        List<String> tags
) {
    public Discovery {
        tags = tags == null ? List.of() : List.copyOf(tags);
    }
}
