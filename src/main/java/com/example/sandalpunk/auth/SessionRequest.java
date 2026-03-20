package com.example.sandalpunk.auth;

public record SessionRequest(
        String initData,
        AuthUserPayload fallbackUser
) {
}

