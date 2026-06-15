package com.example.sandalpunk.exploration;

import java.time.Clock;

import com.example.sandalpunk.config.DuelBalanceProperties;
import com.example.sandalpunk.player.PlayerProfile;
import org.springframework.stereotype.Service;

@Service
public class PlayerStateService {

    private final PlayerStateRepository playerStateRepository;
    private final DuelBalanceProperties duelBalanceProperties;
    private final Clock clock;

    public PlayerStateService(
            PlayerStateRepository playerStateRepository,
            DuelBalanceProperties duelBalanceProperties,
            Clock clock
    ) {
        this.playerStateRepository = playerStateRepository;
        this.duelBalanceProperties = duelBalanceProperties;
        this.clock = clock;
    }

    public synchronized PlayerState getOrCreate(PlayerProfile playerProfile) {
        PlayerState playerState = playerStateRepository.findByPlayerId(playerProfile.getId())
                .orElseGet(() -> create(playerProfile));
        if (!playerProfile.displayName().equals(playerState.getDisplayName())) {
            playerState.setDisplayName(playerProfile.displayName());
            playerState.setUpdatedAt(clock.instant());
            playerStateRepository.save(playerState);
        }
        return playerState;
    }

    public synchronized PlayerState save(PlayerState playerState) {
        playerState.setUpdatedAt(clock.instant());
        return playerStateRepository.save(playerState);
    }

    private PlayerState create(PlayerProfile playerProfile) {
        PlayerState playerState = new PlayerState(
                playerProfile.getId(),
                playerProfile.displayName(),
                duelBalanceProperties.getStartingHp(),
                duelBalanceProperties.getStartingHp(),
                new PlayerResources(0, 3, 0),
                null,
                ExplorationVisibilityMode.HIDDEN,
                clock.instant(),
                clock.instant()
        );
        return playerStateRepository.save(playerState);
    }
}
