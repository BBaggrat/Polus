package com.example.sandalpunk.exploration;

import com.example.sandalpunk.auth.SessionService;
import com.example.sandalpunk.player.PlayerProfile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/exploration")
public class ExplorationController {

    private final SessionService sessionService;
    private final ExplorationService explorationService;

    public ExplorationController(
            SessionService sessionService,
            ExplorationService explorationService
    ) {
        this.sessionService = sessionService;
        this.explorationService = explorationService;
    }

    @PostMapping("/start")
    public ExplorationState start(
            @RequestHeader("X-Session-Token") String sessionToken,
            @RequestBody(required = false) ExplorationStartRequest request
    ) {
        return explorationService.start(sessionService.requirePlayer(sessionToken), request);
    }

    @GetMapping("/current")
    public ResponseEntity<ExplorationState> current(
            @RequestHeader("X-Session-Token") String sessionToken,
            @RequestParam(required = false) String playerId
    ) {
        PlayerProfile playerProfile = sessionService.requirePlayer(sessionToken);
        explorationService.verifyRequestedPlayer(playerProfile, playerId);
        return explorationService.current(playerProfile)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/step")
    public ExplorationState step(
            @RequestHeader("X-Session-Token") String sessionToken,
            @RequestBody ExplorationStepRequest request
    ) {
        return explorationService.step(
                sessionService.requirePlayer(sessionToken),
                request == null ? null : request.explorationId(),
                request
        );
    }

    @PostMapping("/{explorationId}/choice")
    public ExplorationState choose(
            @RequestHeader("X-Session-Token") String sessionToken,
            @PathVariable String explorationId,
            @RequestBody ExplorationChoiceRequest request
    ) {
        return explorationService.choose(
                sessionService.requirePlayer(sessionToken),
                explorationId,
                request
        );
    }

    @PostMapping("/{explorationId}/visibility")
    public ExplorationState visibility(
            @RequestHeader("X-Session-Token") String sessionToken,
            @PathVariable String explorationId,
            @RequestBody ExplorationVisibilityRequest request
    ) {
        return explorationService.changeVisibility(
                sessionService.requirePlayer(sessionToken),
                explorationId,
                request
        );
    }

    @PostMapping("/{explorationId}/return")
    public ExplorationState returnToBase(
            @RequestHeader("X-Session-Token") String sessionToken,
            @PathVariable String explorationId,
            @RequestBody(required = false) ExplorationReturnRequest request
    ) {
        return explorationService.returnToBase(
                sessionService.requirePlayer(sessionToken),
                explorationId,
                request
        );
    }
}
