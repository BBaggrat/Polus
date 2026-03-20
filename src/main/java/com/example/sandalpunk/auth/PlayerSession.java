package com.example.sandalpunk.auth;

import java.time.Instant;

public class PlayerSession {

    private final String token;
    private final String playerId;
    private final Instant createdAt;
    private final Instant expiresAt;

    public PlayerSession(String token, String playerId, Instant createdAt, Instant expiresAt) {
        this.token = token;
        this.playerId = playerId;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    public String getToken() {
        return token;
    }

    public String getPlayerId() {
        return playerId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public boolean isExpired(Instant now) {
        return expiresAt.isBefore(now);
    }
}

