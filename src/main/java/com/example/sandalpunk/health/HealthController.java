package com.example.sandalpunk.health;

import java.time.Clock;

import com.example.sandalpunk.config.ApplicationProperties;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final ApplicationProperties applicationProperties;
    private final Clock clock;

    public HealthController(ApplicationProperties applicationProperties, Clock clock) {
        this.applicationProperties = applicationProperties;
        this.clock = clock;
    }

    @GetMapping
    public HealthResponse health() {
        return new HealthResponse(
                "UP",
                applicationProperties.getName(),
                applicationProperties.getStorage(),
                clock.instant()
        );
    }
}

