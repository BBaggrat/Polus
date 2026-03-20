package com.example.sandalpunk.friend;

import java.time.Instant;

public record FriendRequest(
        String id,
        String senderPlayerId,
        String receiverPlayerId,
        Instant createdAt
) {
}
