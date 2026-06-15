package com.example.sandalpunk.player;

import com.example.sandalpunk.auth.SessionRequest;
import com.example.sandalpunk.auth.SessionResponse;
import com.example.sandalpunk.auth.SessionService;
import com.example.sandalpunk.exploration.PlayerState;
import com.example.sandalpunk.exploration.PlayerStateService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/player")
public class PlayerController {

    private final SessionService sessionService;
    private final PlayerService playerService;
    private final PlayerStateService playerStateService;

    public PlayerController(
            SessionService sessionService,
            PlayerService playerService,
            PlayerStateService playerStateService
    ) {
        this.sessionService = sessionService;
        this.playerService = playerService;
        this.playerStateService = playerStateService;
    }

    @PostMapping("/session")
    public SessionResponse createSession(@RequestBody SessionRequest request) {
        return sessionService.createSession(request);
    }

    @PostMapping("/browser-demo-session")
    public SessionResponse createBrowserDemoSession(@RequestBody SessionRequest request) {
        return sessionService.createBrowserDemoSession(request);
    }

    @PostMapping("/register")
    public PlayerResponse register(@RequestHeader("X-Session-Token") String sessionToken,
                                   @RequestBody RegisterPlayerRequest request) {
        return sessionService.registerNickname(sessionToken, request);
    }

    @GetMapping("/me")
    public PlayerResponse me(@RequestHeader("X-Session-Token") String sessionToken) {
        return PlayerResponse.from(sessionService.requirePlayer(sessionToken));
    }

    @GetMapping("/state")
    public PlayerState state(@RequestHeader("X-Session-Token") String sessionToken) {
        return playerStateService.getOrCreate(sessionService.requirePlayer(sessionToken));
    }
}
