package com.example.sandalpunk.matchmaking;

import java.util.List;
import java.util.Optional;

public interface MatchmakingRepository {

    QueueEntry save(QueueEntry entry);

    Optional<QueueEntry> findByPlayerId(String playerId);

    List<QueueEntry> findAll();

    void deleteByPlayerId(String playerId);
}

