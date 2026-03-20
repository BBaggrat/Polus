package com.example.sandalpunk.auth;

public record AuthUserPayload(
        Long telegramUserId,
        String username,
        String firstName,
        String lastName,
        String languageCode,
        String guestId
) {
}

