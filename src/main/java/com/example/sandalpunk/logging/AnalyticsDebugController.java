package com.example.sandalpunk.logging;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.example.sandalpunk.auth.SessionService;
import com.example.sandalpunk.discovery.DiscoveryService;
import com.example.sandalpunk.exploration.ExplorationRepository;
import com.example.sandalpunk.exploration.ExplorationState;
import com.example.sandalpunk.player.PlayerProfile;
import com.example.sandalpunk.web.UnauthorizedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AnalyticsDebugController {

    private final SessionService sessionService;
    private final ExplorationRepository explorationRepository;
    private final DiscoveryService discoveryService;
    private final AppEventLogger eventLogger;

    public AnalyticsDebugController(
            SessionService sessionService,
            ExplorationRepository explorationRepository,
            DiscoveryService discoveryService,
            AppEventLogger eventLogger
    ) {
        this.sessionService = sessionService;
        this.explorationRepository = explorationRepository;
        this.discoveryService = discoveryService;
        this.eventLogger = eventLogger;
    }

    @GetMapping("/api/analytics/debug/player")
    public Map<String, Object> playerDebug(
            @RequestHeader("X-Session-Token") String sessionToken,
            @RequestParam(required = false) String playerId
    ) {
        PlayerProfile player = sessionService.requirePlayer(sessionToken);
        if (playerId != null && !playerId.isBlank() && !playerId.equals(player.getId())) {
            throw new UnauthorizedException("playerId не совпадает с текущей сессией");
        }

        List<ExplorationState> explorations = explorationRepository.findByPlayerId(player.getId());
        List<AppEvent> events = eventLogger.recentEvents().stream()
                .filter(event -> player.getId().equals(event.metadata().get("playerId")))
                .toList();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("playerId", player.getId());
        payload.put("explorations", explorations.size());
        payload.put("returnedExplorations", explorations.stream()
                .filter(exploration -> "RETURNED".equals(exploration.getStatus().name()))
                .count());
        payload.put("failedExplorations", explorations.stream()
                .filter(exploration -> "FAILED".equals(exploration.getStatus().name()))
                .count());
        payload.put("activeExploration", explorationRepository.findActiveByPlayerId(player.getId()).orElse(null));
        payload.put("discoveries", discoveryService.list(player));
        payload.put("recentEvents", events);
        return payload;
    }

    @GetMapping("/api/analytics/debug/summary")
    public Map<String, Object> summary(
            @RequestHeader("X-Session-Token") String sessionToken
    ) {
        PlayerProfile player = sessionService.requirePlayer(sessionToken);
        List<AppEvent> events = eventLogger.recentEvents();
        Map<String, Long> countsByEvent = new LinkedHashMap<>();
        for (AppEvent event : events) {
            countsByEvent.merge(event.type().eventName(), 1L, Long::sum);
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("requestedByPlayerId", player.getId());
        payload.put("recentEventsTracked", events.size());
        payload.put("countsByEvent", countsByEvent);
        payload.put("errorEvents", countsByEvent.getOrDefault(AppEventType.ERROR_OCCURRED.eventName(), 0L)
                + countsByEvent.getOrDefault(AppEventType.ERROR.eventName(), 0L));
        payload.put("explorations", explorationRepository.findAll().size());
        payload.put("activeExplorations", explorationRepository.findAll().stream()
                .filter(exploration -> "ACTIVE".equals(exploration.getStatus().name()))
                .count());
        return payload;
    }
}
