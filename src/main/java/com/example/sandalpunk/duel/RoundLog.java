package com.example.sandalpunk.duel;

import java.time.Instant;
import java.util.List;

public record RoundLog(
        int roundNumber,
        List<String> lines,
        int playerOneHpAfter,
        int playerTwoHpAfter,
        Instant createdAt
) {
}

