package com.example.sandalpunk.logging;

import java.time.Instant;
import java.util.Map;

public record AppEvent(
        Instant timestamp,
        AppEventType type,
        String message,
        Map<String, String> metadata
) {
}

