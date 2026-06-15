package com.example.sandalpunk.exploration;

import java.util.List;

public interface JournalRepository {

    void append(JournalEntry journalEntry);

    List<JournalEntry> findLatestByPlayerId(String playerId, int limit);
}
