package com.example.sandalpunk.discovery;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Repository;

@Repository
public class InMemoryDiscoveryRepository implements DiscoveryRepository {

    private final ConcurrentHashMap<String, Discovery> discoveries = new ConcurrentHashMap<>();

    @Override
    public Discovery save(Discovery discovery) {
        discoveries.put(discovery.id(), discovery);
        return discovery;
    }

    @Override
    public List<Discovery> findByPlayerId(String playerId) {
        return discoveries.values().stream()
                .filter(discovery -> discovery.playerId().equals(playerId))
                .sorted(Comparator.comparing(Discovery::discoveredAt).reversed())
                .toList();
    }

    @Override
    public Optional<Discovery> findByPlayerIdAndSourceEventId(String playerId, String sourceEventId) {
        if (sourceEventId == null || sourceEventId.isBlank()) {
            return Optional.empty();
        }
        return discoveries.values().stream()
                .filter(discovery -> discovery.playerId().equals(playerId))
                .filter(discovery -> sourceEventId.equals(discovery.sourceEventId()))
                .findFirst();
    }
}
