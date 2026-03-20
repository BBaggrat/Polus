package com.example.sandalpunk.player;

import java.util.Optional;

public interface PlayerRepository {

    PlayerProfile save(PlayerProfile playerProfile);

    Optional<PlayerProfile> findById(String playerId);

    Optional<PlayerProfile> findByIdentityKey(String identityKey);

    Optional<PlayerProfile> findByNicknameKey(String nicknameKey);
}
