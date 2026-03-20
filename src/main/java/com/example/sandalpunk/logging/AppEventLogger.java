package com.example.sandalpunk.logging;

import java.time.Clock;
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
        log.info("{} | {}", type, message);
        addEvent(type, message, metadata);
    }

    public void error(String message, Throwable throwable) {
        log.error(message, throwable);
        addEvent(AppEventType.ERROR, message, Map.of("error", throwable.getClass().getSimpleName()));
    }

    public List<AppEvent> recentEvents() {
        return new ArrayList<>(recentEvents);
    }

    private void addEvent(AppEventType type, String message, Map<String, ?> metadata) {
        Map<String, String> safeMetadata = new LinkedHashMap<>();
        metadata.forEach((key, value) -> safeMetadata.put(key, value == null ? "null" : String.valueOf(value)));
        recentEvents.addFirst(new AppEvent(clock.instant(), type, message, safeMetadata));
        while (recentEvents.size() > MAX_EVENTS) {
            recentEvents.pollLast();
        }
    }
}

