package com.example.sandalpunk.duel;

import com.example.sandalpunk.auth.SessionService;
import com.example.sandalpunk.player.PlayerProfile;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/duel")
public class DuelController {

    private final DuelService duelService;
    private final SessionService sessionService;

    public DuelController(DuelService duelService, SessionService sessionService) {
        this.duelService = duelService;
        this.sessionService = sessionService;
    }

    @GetMapping("/{duelId}")
    public DuelStateResponse getDuel(
            @PathVariable String duelId,
            @RequestHeader("X-Session-Token") String sessionToken
    ) {
        PlayerProfile playerProfile = sessionService.requirePlayer(sessionToken);
        return duelService.getState(duelId, playerProfile);
    }

    @PostMapping("/{duelId}/action")
    public DuelStateResponse submitAction(
            @PathVariable String duelId,
            @RequestHeader("X-Session-Token") String sessionToken,
            @Valid @RequestBody DuelActionRequest request
    ) {
        PlayerProfile playerProfile = sessionService.requirePlayer(sessionToken);
        return duelService.submitAction(duelId, playerProfile, request);
    }

    @PostMapping("/{duelId}/chat")
    public DuelStateResponse submitChat(
            @PathVariable String duelId,
            @RequestHeader("X-Session-Token") String sessionToken,
            @Valid @RequestBody DuelChatRequest request
    ) {
        PlayerProfile playerProfile = sessionService.requirePlayer(sessionToken);
        return duelService.submitChat(duelId, playerProfile, request);
    }

    @PostMapping("/{duelId}/automation")
    public DuelStateResponse configureAutomation(
            @PathVariable String duelId,
            @RequestHeader("X-Session-Token") String sessionToken,
            @RequestBody DuelAutomationRequest request
    ) {
        PlayerProfile playerProfile = sessionService.requirePlayer(sessionToken);
        return duelService.configureAutomation(duelId, playerProfile, request);
    }

    @PostMapping("/{duelId}/forfeit")
    public DuelStateResponse forfeit(
            @PathVariable String duelId,
            @RequestHeader("X-Session-Token") String sessionToken
    ) {
        PlayerProfile playerProfile = sessionService.requirePlayer(sessionToken);
        return duelService.forfeit(duelId, playerProfile);
    }
}
