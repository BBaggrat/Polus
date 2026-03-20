package com.example.sandalpunk.friend;

import com.example.sandalpunk.auth.SessionService;
import com.example.sandalpunk.player.PlayerProfile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    private final FriendService friendService;
    private final SessionService sessionService;

    public FriendController(FriendService friendService, SessionService sessionService) {
        this.friendService = friendService;
        this.sessionService = sessionService;
    }

    @GetMapping
    public FriendsOverviewResponse overview(@RequestHeader("X-Session-Token") String sessionToken) {
        PlayerProfile playerProfile = sessionService.requirePlayer(sessionToken);
        return friendService.overview(playerProfile);
    }

    @PostMapping("/request")
    public FriendsOverviewResponse sendRequest(@RequestHeader("X-Session-Token") String sessionToken,
                                               @RequestBody SendFriendRequestRequest request) {
        PlayerProfile playerProfile = sessionService.requirePlayer(sessionToken);
        return friendService.sendRequest(playerProfile, request != null ? request.nickname() : null);
    }

    @PostMapping("/request/{requestId}/accept")
    public FriendsOverviewResponse accept(@RequestHeader("X-Session-Token") String sessionToken,
                                          @PathVariable String requestId) {
        PlayerProfile playerProfile = sessionService.requirePlayer(sessionToken);
        return friendService.accept(playerProfile, requestId);
    }

    @PostMapping("/request/{requestId}/reject")
    public FriendsOverviewResponse reject(@RequestHeader("X-Session-Token") String sessionToken,
                                          @PathVariable String requestId) {
        PlayerProfile playerProfile = sessionService.requirePlayer(sessionToken);
        return friendService.reject(playerProfile, requestId);
    }
}
