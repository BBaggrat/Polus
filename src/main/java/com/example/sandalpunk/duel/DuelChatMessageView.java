package com.example.sandalpunk.duel;

import java.time.Instant;

public record DuelChatMessageView(
        String messageId,
        String playerId,
        String displayName,
        String text,
        boolean systemMessage,
        Instant createdAt
) {
    public static DuelChatMessageView from(DuelChatMessage message) {
        return new DuelChatMessageView(
                message.messageId(),
                message.playerId(),
                message.displayName(),
                message.text(),
                message.systemMessage(),
                message.createdAt()
        );
    }
}
