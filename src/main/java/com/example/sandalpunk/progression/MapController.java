package com.example.sandalpunk.progression;

import com.example.sandalpunk.auth.SessionService;
import com.example.sandalpunk.player.PlayerProfile;
import com.example.sandalpunk.web.UnauthorizedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/map")
public class MapController {

    private final SessionService sessionService;
    private final MapService mapService;

    public MapController(SessionService sessionService, MapService mapService) {
        this.sessionService = sessionService;
        this.mapService = mapService;
    }

    @GetMapping
    public MapView map(
            @RequestHeader("X-Session-Token") String token,
            @RequestParam(required = false) String playerId
    ) {
        PlayerProfile player = requireActor(token, playerId);
        mapService.logOpened(player);
        return mapService.view(player);
    }

    @PostMapping("/routes/{routeId}/select")
    public MapView select(
            @RequestHeader("X-Session-Token") String token,
            @PathVariable String routeId,
            @RequestBody(required = false) PlayerRequest request
    ) {
        PlayerProfile player = requireActor(token, request == null ? null : request.playerId());
        return mapService.selectRoute(player, routeId);
    }

    private PlayerProfile requireActor(String token, String playerId) {
        PlayerProfile player = sessionService.requirePlayer(token);
        if (playerId != null && !playerId.isBlank() && !player.getId().equals(playerId)) {
            throw new UnauthorizedException("playerId не совпадает с текущей сессией");
        }
        return player;
    }
}
