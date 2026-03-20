package com.example.sandalpunk.duel;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Repository;

@Repository
public class InMemoryDuelRepository implements DuelRepository {

    private final ConcurrentHashMap<String, Duel> duels = new ConcurrentHashMap<>();

    @Override
    public Duel save(Duel duel) {
        duels.put(duel.getId(), duel);
        return duel;
    }

    @Override
    public Optional<Duel> findById(String duelId) {
        return Optional.ofNullable(duels.get(duelId));
    }
}
