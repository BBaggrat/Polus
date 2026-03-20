package com.example.sandalpunk.friend;

public record FriendSummaryResponse(
        String playerId,
        String displayName,
        int level,
        boolean online
) {
}
