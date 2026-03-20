package com.example.sandalpunk.auth;

public record AuthenticatedUser(
        String identityKey,
        Long telegramUserId,
        String username,
        String firstName,
        String lastName,
        String languageCode,
        boolean verified,
        boolean telegramUser
) {

    public String displayName() {
        if (firstName != null && !firstName.isBlank()) {
            return firstName;
        }
        if (username != null && !username.isBlank()) {
            return "@" + username;
        }
        return telegramUser ? "Telegram Player" : "Local Duelist";
    }
}

