package com.example.sandalpunk.player;

import java.util.Optional;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

@Repository
@ConditionalOnProperty(name = "app.storage", havingValue = "inmemory")
public class InMemoryPlayerRepository implements PlayerRepository {

    private final ConcurrentHashMap<String, PlayerProfile> players = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> identityIndex = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> nicknameIndex = new ConcurrentHashMap<>();

    @Override
    public PlayerProfile save(PlayerProfile playerProfile) {
        players.put(playerProfile.getId(), playerProfile);
        identityIndex.put(playerProfile.getIdentityKey(), playerProfile.getId());
        nicknameIndex.entrySet().removeIf(entry -> entry.getValue().equals(playerProfile.getId()));
        if (playerProfile.getNickname() != null && !playerProfile.getNickname().isBlank()) {
            nicknameIndex.put(normalizeNickname(playerProfile.getNickname()), playerProfile.getId());
        }
        return playerProfile;
    }

    @Override
    public Optional<PlayerProfile> findById(String playerId) {
        return Optional.ofNullable(players.get(playerId));
    }

    @Override
    public Optional<PlayerProfile> findByIdentityKey(String identityKey) {
        String playerId = identityIndex.get(identityKey);
        return playerId == null ? Optional.empty() : Optional.ofNullable(players.get(playerId));
    }

    @Override
    public Optional<PlayerProfile> findByNicknameKey(String nicknameKey) {
        String playerId = nicknameIndex.get(nicknameKey);
        return playerId == null ? Optional.empty() : Optional.ofNullable(players.get(playerId));
    }

    private String normalizeNickname(String nickname) {
        return nickname.trim().toLowerCase(Locale.ROOT);
    }
}
