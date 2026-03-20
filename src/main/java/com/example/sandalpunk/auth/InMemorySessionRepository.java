package com.example.sandalpunk.auth;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Repository;

@Repository
public class InMemorySessionRepository implements SessionRepository {

    private final ConcurrentHashMap<String, PlayerSession> sessions = new ConcurrentHashMap<>();

    @Override
    public PlayerSession save(PlayerSession session) {
        sessions.put(session.getToken(), session);
        return session;
    }

    @Override
    public Optional<PlayerSession> findByToken(String token) {
        return Optional.ofNullable(sessions.get(token));
    }

    @Override
    public void deleteByToken(String token) {
        sessions.remove(token);
    }
}

