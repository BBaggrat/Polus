package com.example.sandalpunk.discovery;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.player.PlayerProfile;
import org.junit.jupiter.api.Test;

class DiscoveryServiceTest {

    @Test
    void recordsDiscoveryOncePerSourceEvent() {
        Instant now = Instant.parse("2026-06-16T10:00:00Z");
        DiscoveryService service = new DiscoveryService(
                new InMemoryDiscoveryRepository(),
                new AppEventLogger(Clock.fixed(now, ZoneOffset.UTC)),
                Clock.fixed(now, ZoneOffset.UTC)
        );
        PlayerProfile player = new PlayerProfile(
                "player-1",
                "test:player-1",
                null,
                "survivor",
                "Выживший",
                "Выживший",
                null,
                "ru",
                "M",
                0,
                0,
                now,
                now
        );

        service.record(player, DiscoveryType.NOTE, "Запись", "Текст", "event-1", List.of("note"));
        service.record(player, DiscoveryType.NOTE, "Запись", "Текст", "event-1", List.of("note"));

        assertThat(service.list(player)).hasSize(1);
        assertThat(service.list(player).get(0).sourceEventId()).isEqualTo("event-1");
    }
}
