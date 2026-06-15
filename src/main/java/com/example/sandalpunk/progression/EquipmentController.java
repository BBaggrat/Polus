package com.example.sandalpunk.progression;

import com.example.sandalpunk.auth.SessionService;
import com.example.sandalpunk.player.PlayerProfile;
import com.example.sandalpunk.web.BadRequestException;
import com.example.sandalpunk.web.UnauthorizedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/equipment")
public class EquipmentController {

    private final SessionService sessionService;
    private final EquipmentService equipmentService;

    public EquipmentController(SessionService sessionService, EquipmentService equipmentService) {
        this.sessionService = sessionService;
        this.equipmentService = equipmentService;
    }

    @GetMapping
    public EquipmentView equipment(
            @RequestHeader("X-Session-Token") String token,
            @RequestParam(required = false) String playerId
    ) {
        PlayerProfile player = requireActor(token, playerId);
        equipmentService.logOpened(player);
        return equipmentService.view(player);
    }

    @PostMapping("/equip")
    public EquipmentView equip(
            @RequestHeader("X-Session-Token") String token,
            @RequestBody EquipmentEquipRequest request
    ) {
        if (request == null || request.slot() == null || request.itemId() == null) {
            throw new BadRequestException("slot и itemId обязательны");
        }
        PlayerProfile player = requireActor(token, request.playerId());
        return equipmentService.equip(player, request.slot(), request.itemId());
    }

    @PostMapping("/upgrade")
    public EquipmentView upgrade(
            @RequestHeader("X-Session-Token") String token,
            @RequestBody EquipmentUpgradeRequest request
    ) {
        if (request == null || request.itemId() == null) {
            throw new BadRequestException("itemId обязателен");
        }
        PlayerProfile player = requireActor(token, request.playerId());
        return equipmentService.upgrade(player, request.itemId());
    }

    private PlayerProfile requireActor(String token, String playerId) {
        PlayerProfile player = sessionService.requirePlayer(token);
        if (playerId != null && !playerId.isBlank() && !player.getId().equals(playerId)) {
            throw new UnauthorizedException("playerId не совпадает с текущей сессией");
        }
        return player;
    }
}
