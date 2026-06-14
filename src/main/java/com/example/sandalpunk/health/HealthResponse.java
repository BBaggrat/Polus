package com.example.sandalpunk.health;

import java.time.Instant;

public record HealthResponse(
        String status,
        String service,
        String version,
        Instant timestamp,
        String appName,
        String storage,
        Instant time
) {
}

