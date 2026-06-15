package com.example.sandalpunk.progression;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class BaseState {

    private final String playerId;
    private final List<BaseUpgrade> upgrades;
    private int storageProtectionLevel;
    private MapProgress mapProgress;
    private final Set<String> unlockedFeatures;
    private Instant updatedAt;

    public BaseState(
            String playerId,
            List<BaseUpgrade> upgrades,
            int storageProtectionLevel,
            MapProgress mapProgress,
            Set<String> unlockedFeatures,
            Instant updatedAt
    ) {
        this.playerId = playerId;
        this.upgrades = new ArrayList<>(upgrades);
        this.storageProtectionLevel = storageProtectionLevel;
        this.mapProgress = mapProgress;
        this.unlockedFeatures = new LinkedHashSet<>(unlockedFeatures);
        this.updatedAt = updatedAt;
    }

    public String getPlayerId() {
        return playerId;
    }

    public List<BaseUpgrade> getUpgrades() {
        return List.copyOf(upgrades);
    }

    public void replaceUpgrade(BaseUpgrade baseUpgrade) {
        for (int index = 0; index < upgrades.size(); index++) {
            if (upgrades.get(index).id().equals(baseUpgrade.id())) {
                upgrades.set(index, baseUpgrade);
                return;
            }
        }
        upgrades.add(baseUpgrade);
    }

    public int getStorageProtectionLevel() {
        return storageProtectionLevel;
    }

    public void setStorageProtectionLevel(int storageProtectionLevel) {
        this.storageProtectionLevel = storageProtectionLevel;
    }

    public MapProgress getMapProgress() {
        return mapProgress;
    }

    public void setMapProgress(MapProgress mapProgress) {
        this.mapProgress = mapProgress;
    }

    public Set<String> getUnlockedFeatures() {
        return Set.copyOf(unlockedFeatures);
    }

    public void unlockFeature(String feature) {
        unlockedFeatures.add(feature);
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
