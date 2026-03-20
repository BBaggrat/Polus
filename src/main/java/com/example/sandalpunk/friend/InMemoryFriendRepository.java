package com.example.sandalpunk.friend;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Repository;

@Repository
public class InMemoryFriendRepository implements FriendRepository {

    private final ConcurrentHashMap<String, FriendRequest> requests = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Set<String>> friendships = new ConcurrentHashMap<>();

    @Override
    public FriendRequest saveRequest(FriendRequest friendRequest) {
        requests.put(friendRequest.id(), friendRequest);
        return friendRequest;
    }

    @Override
    public Optional<FriendRequest> findRequestById(String requestId) {
        return Optional.ofNullable(requests.get(requestId));
    }

    @Override
    public List<FriendRequest> findIncomingRequests(String receiverPlayerId) {
        List<FriendRequest> incoming = new ArrayList<>();
        requests.values().forEach(request -> {
            if (request.receiverPlayerId().equals(receiverPlayerId)) {
                incoming.add(request);
            }
        });
        incoming.sort((left, right) -> left.createdAt().compareTo(right.createdAt()));
        return incoming;
    }

    @Override
    public Optional<FriendRequest> findPendingBetween(String firstPlayerId, String secondPlayerId) {
        return requests.values().stream()
                .filter(request -> request.senderPlayerId().equals(firstPlayerId) && request.receiverPlayerId().equals(secondPlayerId)
                        || request.senderPlayerId().equals(secondPlayerId) && request.receiverPlayerId().equals(firstPlayerId))
                .findFirst();
    }

    @Override
    public void deleteRequest(String requestId) {
        requests.remove(requestId);
    }

    @Override
    public void linkFriends(String firstPlayerId, String secondPlayerId) {
        friendships.computeIfAbsent(firstPlayerId, ignored -> ConcurrentHashMap.newKeySet()).add(secondPlayerId);
        friendships.computeIfAbsent(secondPlayerId, ignored -> ConcurrentHashMap.newKeySet()).add(firstPlayerId);
    }

    @Override
    public boolean areFriends(String firstPlayerId, String secondPlayerId) {
        return friendships.getOrDefault(firstPlayerId, Set.of()).contains(secondPlayerId);
    }

    @Override
    public List<String> findFriendIds(String playerId) {
        return new ArrayList<>(friendships.getOrDefault(playerId, Set.of()));
    }
}
