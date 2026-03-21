package com.example.sandalpunk.duel;

import java.time.Instant;

public record DuelChatMessage(
        String messageId,
        String playerId,
        String displayName,
        String text,
        boolean systemMessage,
        Instant createdAt
) {
}
