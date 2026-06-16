package com.example.sandalpunk.discovery;

import com.example.sandalpunk.auth.SessionService;
import com.example.sandalpunk.player.PlayerProfile;
import com.example.sandalpunk.web.UnauthorizedException;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DiscoveryController {

    private final SessionService sessionService;
    private final DiscoveryService discoveryService;

    public DiscoveryController(
            SessionService sessionService,
            DiscoveryService discoveryService
    ) {
        this.sessionService = sessionService;
        this.discoveryService = discoveryService;
    }

    @GetMapping("/api/discoveries")
    public List<Discovery> discoveries(
            @RequestHeader("X-Session-Token") String sessionToken,
            @RequestParam(required = false) String playerId
    ) {
        PlayerProfile player = sessionService.requirePlayer(sessionToken);
        if (playerId != null && !playerId.isBlank() && !playerId.equals(player.getId())) {
            throw new UnauthorizedException("playerId не совпадает с текущей сессией");
        }
        return discoveryService.list(player);
    }
}
