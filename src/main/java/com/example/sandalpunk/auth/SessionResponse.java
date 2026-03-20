package com.example.sandalpunk.auth;

import com.example.sandalpunk.player.PlayerResponse;

public record SessionResponse(
        String sessionToken,
        PlayerResponse player
) {
}

