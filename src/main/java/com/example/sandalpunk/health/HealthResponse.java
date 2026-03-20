package com.example.sandalpunk.health;

import java.time.Instant;

public record HealthResponse(
        String status,
        String appName,
        String storage,
        Instant time
) {
}

