package com.example.sandalpunk.progression;

import com.example.sandalpunk.auth.SessionService;
import com.example.sandalpunk.exploration.PlayerStateService;
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
@RequestMapping("/api/base")
public class BaseController {

    private final SessionService sessionService;
    private final BaseService baseService;
    private final EquipmentService equipmentService;
    private final MapService mapService;
    private final PlayerStateService playerStateService;

    public BaseController(
            SessionService sessionService,
            BaseService baseService,
            EquipmentService equipmentService,
            MapService mapService,
            PlayerStateService playerStateService
    ) {
        this.sessionService = sessionService;
        this.baseService = baseService;
        this.equipmentService = equipmentService;
        this.mapService = mapService;
        this.playerStateService = playerStateService;
    }

    @GetMapping("/state")
    public BaseOverview state(
            @RequestHeader("X-Session-Token") String token,
            @RequestParam(required = false) String playerId
    ) {
        PlayerProfile player = requireActor(token, playerId);
        baseService.logOpened(player);
        return overview(player);
    }

    @PostMapping("/upgrades/{upgradeId}/buy")
    public BaseOverview buy(
            @RequestHeader("X-Session-Token") String token,
            @PathVariable String upgradeId,
            @RequestBody(required = false) PlayerRequest request
    ) {
        PlayerProfile player = requireActor(token, request == null ? null : request.playerId());
        baseService.buyUpgrade(player, upgradeId);
        return overview(player);
    }

    private BaseOverview overview(PlayerProfile player) {
        EquipmentView equipment = equipmentService.view(player);
        return new BaseOverview(
                baseService.getOrCreate(player),
                playerStateService.getOrCreate(player),
                equipment.equipment(),
                equipment.items(),
                mapService.view(player)
        );
    }

    private PlayerProfile requireActor(String token, String playerId) {
        PlayerProfile player = sessionService.requirePlayer(token);
        if (playerId != null && !playerId.isBlank() && !player.getId().equals(playerId)) {
            throw new UnauthorizedException("playerId не совпадает с текущей сессией");
        }
        return player;
    }
}
