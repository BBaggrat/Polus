package com.example.sandalpunk.player;

import com.example.sandalpunk.auth.SessionRequest;
import com.example.sandalpunk.auth.SessionResponse;
import com.example.sandalpunk.auth.SessionService;
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

    public PlayerController(SessionService sessionService, PlayerService playerService) {
        this.sessionService = sessionService;
        this.playerService = playerService;
    }

    @PostMapping("/session")
    public SessionResponse createSession(@RequestBody SessionRequest request) {
        return sessionService.createSession(request);
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

    @PostMapping("/stats")
    public PlayerResponse allocateStat(@RequestHeader("X-Session-Token") String sessionToken,
                                       @RequestBody AllocateStatRequest request) {
        PlayerProfile playerProfile = sessionService.requirePlayer(sessionToken);
        return PlayerResponse.from(playerService.allocateStat(
                playerProfile.getId(),
                PlayerStat.fromValue(request != null ? request.stat() : null)
        ));
    }
}
