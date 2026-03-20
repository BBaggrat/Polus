package com.example.sandalpunk.friend;

import java.util.List;

public record FriendsOverviewResponse(
        List<FriendSummaryResponse> friends,
        List<FriendRequestResponse> incomingRequests
) {
}
