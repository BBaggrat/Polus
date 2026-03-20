package com.example.sandalpunk.matchmaking;

import com.example.sandalpunk.auth.SessionService;
import com.example.sandalpunk.player.PlayerProfile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matchmaking")
public class MatchmakingController {

    private final MatchmakingService matchmakingService;
    private final SessionService sessionService;

    public MatchmakingController(MatchmakingService matchmakingService, SessionService sessionService) {
        this.matchmakingService = matchmakingService;
        this.sessionService = sessionService;
    }

    @PostMapping("/join")
    public MatchmakingStatusResponse join(@RequestHeader("X-Session-Token") String sessionToken) {
        PlayerProfile playerProfile = sessionService.requirePlayer(sessionToken);
        return matchmakingService.join(playerProfile);
    }

    @PostMapping("/cancel")
    public MatchmakingStatusResponse cancel(@RequestHeader("X-Session-Token") String sessionToken) {
        PlayerProfile playerProfile = sessionService.requirePlayer(sessionToken);
        return matchmakingService.cancel(playerProfile);
    }

    @GetMapping("/status")
    public MatchmakingStatusResponse status(@RequestHeader("X-Session-Token") String sessionToken) {
        PlayerProfile playerProfile = sessionService.requirePlayer(sessionToken);
        return matchmakingService.status(playerProfile);
    }
}

