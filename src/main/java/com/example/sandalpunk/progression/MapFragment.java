package com.example.sandalpunk.progression;

import java.time.Instant;

public record MapFragment(
        String id,
        String title,
        String text,
        Instant discoveredAt
) {
}
