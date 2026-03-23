package com.example.sandalpunk.friend;

import java.time.Clock;
import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.logging.AppEventType;
import com.example.sandalpunk.player.PlayerProfile;
import com.example.sandalpunk.player.PlayerService;
import com.example.sandalpunk.web.BadRequestException;
import com.example.sandalpunk.web.ConflictException;
import com.example.sandalpunk.web.NotFoundException;
import org.springframework.stereotype.Service;

@Service
public class FriendService {

    private static final Duration ONLINE_WINDOW = Duration.ofMinutes(10);

    private final FriendRepository friendRepository;
    private final PlayerService playerService;
    private final Clock clock;
    private final AppEventLogger appEventLogger;

    public FriendService(
            FriendRepository friendRepository,
            PlayerService playerService,
            Clock clock,
            AppEventLogger appEventLogger
    ) {
        this.friendRepository = friendRepository;
        this.playerService = playerService;
        this.clock = clock;
        this.appEventLogger = appEventLogger;
    }

    public FriendsOverviewResponse overview(PlayerProfile viewer) {
        List<FriendSummaryResponse> friends = friendRepository.findFriendIds(viewer.getId()).stream()
                .map(playerService::findRequiredById)
                .sorted(Comparator.comparing(PlayerProfile::displayName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toFriendSummary)
                .toList();
        List<FriendRequestResponse> incomingRequests = friendRepository.findIncomingRequests(viewer.getId()).stream()
                .map(request -> playerService.findRequiredById(request.senderPlayerId()))
                .sorted(Comparator.comparing(PlayerProfile::displayName, String.CASE_INSENSITIVE_ORDER))
                .map(profile -> toFriendRequest(profile, viewer.getId()))
                .toList();
        return new FriendsOverviewResponse(friends, incomingRequests);
    }

    public synchronized FriendsOverviewResponse sendRequest(PlayerProfile sender, String nickname) {
        if (nickname == null || nickname.isBlank()) {
            throw new BadRequestException("Никнейм обязателен");
        }
        PlayerProfile receiver = playerService.findByNickname(nickname);
        if (!receiver.isRegistered()) {
            throw new NotFoundException("Игрок с таким ником не найден");
        }
        if (receiver.getId().equals(sender.getId())) {
            throw new ConflictException("Нельзя добавить себя в друзья");
        }
        if (friendRepository.areFriends(sender.getId(), receiver.getId())) {
            throw new ConflictException("Вы уже в друзьях");
        }
        if (friendRepository.findPendingBetween(sender.getId(), receiver.getId()).isPresent()) {
            throw new ConflictException("Запрос уже отправлен");
        }

        friendRepository.saveRequest(new FriendRequest(
                UUID.randomUUID().toString(),
                sender.getId(),
                receiver.getId(),
                clock.instant()
        ));
        appEventLogger.info(
                AppEventType.PLAYER_UPDATED,
                "Friend request sent",
                Map.of(
                        "fromPlayerId", sender.getId(),
                        "toPlayerId", receiver.getId()
                )
        );
        return overview(sender);
    }

    public synchronized FriendsOverviewResponse accept(PlayerProfile receiver, String requestId) {
        FriendRequest friendRequest = findIncomingRequest(receiver.getId(), requestId);
        friendRepository.linkFriends(friendRequest.senderPlayerId(), friendRequest.receiverPlayerId());
        friendRepository.deleteRequest(friendRequest.id());
        appEventLogger.info(
                AppEventType.PLAYER_UPDATED,
                "Friend request accepted",
                Map.of(
                        "fromPlayerId", friendRequest.senderPlayerId(),
                        "toPlayerId", friendRequest.receiverPlayerId()
                )
        );
        return overview(receiver);
    }

    public synchronized FriendsOverviewResponse reject(PlayerProfile receiver, String requestId) {
        FriendRequest friendRequest = findIncomingRequest(receiver.getId(), requestId);
        friendRepository.deleteRequest(friendRequest.id());
        appEventLogger.info(
                AppEventType.PLAYER_UPDATED,
                "Friend request rejected",
                Map.of(
                        "fromPlayerId", friendRequest.senderPlayerId(),
                        "toPlayerId", friendRequest.receiverPlayerId()
                )
        );
        return overview(receiver);
    }

    private FriendRequest findIncomingRequest(String receiverPlayerId, String requestId) {
        FriendRequest friendRequest = friendRepository.findRequestById(requestId)
                .orElseThrow(() -> new NotFoundException("Запрос в друзья не найден"));
        if (!friendRequest.receiverPlayerId().equals(receiverPlayerId)) {
            throw new ConflictException("Этот запрос адресован другому игроку");
        }
        return friendRequest;
    }

    private FriendSummaryResponse toFriendSummary(PlayerProfile profile) {
        return new FriendSummaryResponse(
                profile.getId(),
                profile.displayName(),
                profile.getRating(),
                isOnline(profile)
        );
    }

    private FriendRequestResponse toFriendRequest(PlayerProfile profile, String receiverPlayerId) {
        FriendRequest request = friendRepository.findPendingBetween(profile.getId(), receiverPlayerId)
                .orElseThrow(() -> new NotFoundException("Запрос в друзья не найден"));
        return new FriendRequestResponse(
                request.id(),
                profile.getId(),
                profile.displayName(),
                profile.getRating(),
                isOnline(profile)
        );
    }

    private boolean isOnline(PlayerProfile profile) {
        return profile.getUpdatedAt() != null
                && Duration.between(profile.getUpdatedAt(), clock.instant()).abs().compareTo(ONLINE_WINDOW) <= 0;
    }
}
