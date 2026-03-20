package com.example.sandalpunk.friend;

public record FriendRequestResponse(
        String requestId,
        String playerId,
        String displayName,
        int level,
        boolean online
) {
}
