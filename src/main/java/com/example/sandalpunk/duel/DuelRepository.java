package com.example.sandalpunk.duel;

import java.util.Optional;

public interface DuelRepository {

    Duel save(Duel duel);

    Optional<Duel> findById(String duelId);
}

