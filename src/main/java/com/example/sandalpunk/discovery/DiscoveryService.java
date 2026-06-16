package com.example.sandalpunk.discovery;

import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.logging.AppEventType;
import com.example.sandalpunk.player.PlayerProfile;
import org.springframework.stereotype.Service;

@Service
public class DiscoveryService {

    private final DiscoveryRepository repository;
    private final AppEventLogger eventLogger;
    private final Clock clock;

    public DiscoveryService(
            DiscoveryRepository repository,
            AppEventLogger eventLogger,
            Clock clock
    ) {
        this.repository = repository;
        this.eventLogger = eventLogger;
        this.clock = clock;
    }

    public List<Discovery> list(PlayerProfile player) {
        return repository.findByPlayerId(player.getId());
    }

    public Discovery record(
            PlayerProfile player,
            DiscoveryType type,
            String title,
            String text,
            String sourceEventId,
            List<String> tags
    ) {
        return repository.findByPlayerIdAndSourceEventId(player.getId(), sourceEventId)
                .orElseGet(() -> {
                    Discovery discovery = repository.save(new Discovery(
                            UUID.randomUUID().toString(),
                            player.getId(),
                            type,
                            title,
                            text,
                            sourceEventId,
                            clock.instant(),
                            tags
                    ));
                    eventLogger.info(
                            AppEventType.DISCOVERY_FOUND,
                            "Найдена запись для базы",
                            Map.of(
                                    "playerId", player.getId(),
                                    "discoveryId", discovery.id(),
                                    "sourceEventId", sourceEventId,
                                    "discoveryType", type
                            )
                    );
                    return discovery;
                });
    }
}
