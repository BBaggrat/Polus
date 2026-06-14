package com.example.sandalpunk.logging;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentLinkedDeque;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AppEventLogger {

    private static final Logger log = LoggerFactory.getLogger(AppEventLogger.class);
    private static final int MAX_EVENTS = 200;

    private final Clock clock;
    private final ConcurrentLinkedDeque<AppEvent> recentEvents = new ConcurrentLinkedDeque<>();

    public AppEventLogger(Clock clock) {
        this.clock = clock;
    }

    public void info(AppEventType type, String message) {
        info(type, message, Map.of());
    }

    public void info(AppEventType type, String message, Map<String, ?> metadata) {
        Instant timestamp = clock.instant();
        Map<String, String> safeMetadata = sanitizeMetadata(metadata);
        log.info(
                "game_event={} timestamp={} metadata={} message={}",
                type.eventName(),
                timestamp,
                safeMetadata,
                message
        );
        addEvent(timestamp, type, message, safeMetadata);
    }

    public void error(String message, Throwable throwable) {
        Instant timestamp = clock.instant();
        Map<String, String> metadata = Map.of("error", throwable.getClass().getSimpleName());
        log.error(
                "game_event={} timestamp={} metadata={} message={}",
                AppEventType.ERROR_OCCURRED.eventName(),
                timestamp,
                metadata,
                message,
                throwable
        );
        addEvent(timestamp, AppEventType.ERROR_OCCURRED, message, metadata);
    }

    public List<AppEvent> recentEvents() {
        return new ArrayList<>(recentEvents);
    }

    private Map<String, String> sanitizeMetadata(Map<String, ?> metadata) {
        Map<String, String> safeMetadata = new LinkedHashMap<>();
        metadata.forEach((key, value) -> safeMetadata.put(key, value == null ? "null" : String.valueOf(value)));
        return safeMetadata;
    }

    private void addEvent(Instant timestamp, AppEventType type, String message, Map<String, String> metadata) {
        recentEvents.addFirst(new AppEvent(timestamp, type, message, metadata));
        while (recentEvents.size() > MAX_EVENTS) {
            recentEvents.pollLast();
        }
    }
}

