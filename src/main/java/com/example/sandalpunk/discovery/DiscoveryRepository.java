package com.example.sandalpunk.discovery;

import java.util.List;
import java.util.Optional;

public interface DiscoveryRepository {

    Discovery save(Discovery discovery);

    List<Discovery> findByPlayerId(String playerId);

    Optional<Discovery> findByPlayerIdAndSourceEventId(String playerId, String sourceEventId);
}
