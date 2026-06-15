package com.example.sandalpunk.exploration;

import java.util.List;

import com.example.sandalpunk.auth.SessionService;
import com.example.sandalpunk.player.PlayerProfile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/journal")
public class JournalController {

    private final SessionService sessionService;
    private final ExplorationService explorationService;

    public JournalController(
            SessionService sessionService,
            ExplorationService explorationService
    ) {
        this.sessionService = sessionService;
        this.explorationService = explorationService;
    }

    @GetMapping
    public List<JournalEntry> journal(
            @RequestHeader("X-Session-Token") String sessionToken,
            @RequestParam(required = false) String playerId,
            @RequestParam(defaultValue = "50") int limit
    ) {
        PlayerProfile playerProfile = sessionService.requirePlayer(sessionToken);
        explorationService.verifyRequestedPlayer(playerProfile, playerId);
        return explorationService.journal(playerProfile, limit);
    }
}
