package com.example.sandalpunk.exploration;

import java.time.Instant;

public class PlayerState {

    private final String playerId;
    private String displayName;
    private int hp;
    private final int maxHp;
    private PlayerResources resources;
    private String currentExplorationId;
    private ExplorationVisibilityMode visibilityMode;
    private final Instant createdAt;
    private Instant updatedAt;

    public PlayerState(
            String playerId,
            String displayName,
            int hp,
            int maxHp,
            PlayerResources resources,
            String currentExplorationId,
            ExplorationVisibilityMode visibilityMode,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.playerId = playerId;
        this.displayName = displayName;
        this.hp = hp;
        this.maxHp = maxHp;
        this.resources = resources;
        this.currentExplorationId = currentExplorationId;
        this.visibilityMode = visibilityMode;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getPlayerId() {
        return playerId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public int getHp() {
        return hp;
    }

    public void setHp(int hp) {
        this.hp = Math.max(0, Math.min(maxHp, hp));
    }

    public int getMaxHp() {
        return maxHp;
    }

    public PlayerResources getResources() {
        return resources;
    }

    public void setResources(PlayerResources resources) {
        this.resources = resources;
    }

    public String getCurrentExplorationId() {
        return currentExplorationId;
    }

    public void setCurrentExplorationId(String currentExplorationId) {
        this.currentExplorationId = currentExplorationId;
    }

    public ExplorationVisibilityMode getVisibilityMode() {
        return visibilityMode;
    }

    public void setVisibilityMode(ExplorationVisibilityMode visibilityMode) {
        this.visibilityMode = visibilityMode;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
