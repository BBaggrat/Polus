package com.example.sandalpunk.duel;

import java.time.Instant;
import java.util.List;

public record RoundLogView(
        int roundNumber,
        List<String> lines,
        int playerOneHpAfter,
        int playerTwoHpAfter,
        Instant createdAt
) {
    public static RoundLogView from(RoundLog roundLog) {
        return new RoundLogView(
                roundLog.roundNumber(),
                roundLog.lines(),
                roundLog.playerOneHpAfter(),
                roundLog.playerTwoHpAfter(),
                roundLog.createdAt()
        );
    }
}

