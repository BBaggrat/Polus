package com.example.sandalpunk.matchmaking;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Repository;

@Repository
public class InMemoryMatchmakingRepository implements MatchmakingRepository {

    private final ConcurrentHashMap<String, QueueEntry> queueEntries = new ConcurrentHashMap<>();

    @Override
    public QueueEntry save(QueueEntry entry) {
        queueEntries.put(entry.playerId(), entry);
        return entry;
    }

    @Override
    public Optional<QueueEntry> findByPlayerId(String playerId) {
        return Optional.ofNullable(queueEntries.get(playerId));
    }

    @Override
    public List<QueueEntry> findAll() {
        return new ArrayList<>(queueEntries.values());
    }

    @Override
    public void deleteByPlayerId(String playerId) {
        queueEntries.remove(playerId);
    }
}

