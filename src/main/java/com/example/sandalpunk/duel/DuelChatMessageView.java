package com.example.sandalpunk.duel;

import java.time.Instant;

public record DuelChatMessageView(
        String messageId,
        String playerId,
        String displayName,
        String text,
        Instant createdAt
) {
    public static DuelChatMessageView from(DuelChatMessage message) {
        return new DuelChatMessageView(
                message.messageId(),
                message.playerId(),
                message.displayName(),
                message.text(),
                message.createdAt()
        );
    }
}
