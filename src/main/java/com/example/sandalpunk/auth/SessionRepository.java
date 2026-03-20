package com.example.sandalpunk.auth;

import java.util.Optional;

public interface SessionRepository {

    PlayerSession save(PlayerSession session);

    Optional<PlayerSession> findByToken(String token);

    void deleteByToken(String token);
}

