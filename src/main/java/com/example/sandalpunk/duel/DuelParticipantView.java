package com.example.sandalpunk.duel;

public record DuelParticipantView(
        String playerId,
        String displayName,
        int hp,
        int wins,
        int losses
) {
}

