package com.example.sandalpunk.friend;

import java.util.List;
import java.util.Optional;

public interface FriendRepository {

    FriendRequest saveRequest(FriendRequest friendRequest);

    Optional<FriendRequest> findRequestById(String requestId);

    List<FriendRequest> findIncomingRequests(String receiverPlayerId);

    Optional<FriendRequest> findPendingBetween(String firstPlayerId, String secondPlayerId);

    void deleteRequest(String requestId);

    void linkFriends(String firstPlayerId, String secondPlayerId);

    boolean areFriends(String firstPlayerId, String secondPlayerId);

    List<String> findFriendIds(String playerId);
}
