package com.example.sandalpunk.exploration;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Repository;

@Repository
public class InMemoryJournalRepository implements JournalRepository {

    private final ConcurrentHashMap<String, CopyOnWriteArrayList<JournalEntry>> entriesByPlayer =
            new ConcurrentHashMap<>();

    @Override
    public void append(JournalEntry journalEntry) {
        entriesByPlayer
                .computeIfAbsent(journalEntry.playerId(), ignored -> new CopyOnWriteArrayList<>())
                .add(journalEntry);
    }

    @Override
    public List<JournalEntry> findLatestByPlayerId(String playerId, int limit) {
        List<JournalEntry> entries = entriesByPlayer.getOrDefault(playerId, new CopyOnWriteArrayList<>());
        int safeLimit = Math.max(1, Math.min(limit, 200));
        int fromIndex = Math.max(0, entries.size() - safeLimit);
        List<JournalEntry> result = new ArrayList<>(entries.subList(fromIndex, entries.size()));
        result.sort((left, right) -> right.createdAt().compareTo(left.createdAt()));
        return result;
    }
}
