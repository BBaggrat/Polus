package com.example.sandalpunk.exploration;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class ExplorationState {

    private final String explorationId;
    private final String playerId;
    private ExplorationStatus status;
    private ExplorationVisibilityMode visibilityMode;
    private int step;
    private final int maxSteps;
    private PlayerResources collectedResources;
    private final List<JournalEntry> journalEntries;
    private Encounter currentEncounter;
    private boolean startPvpDuel;
    private String activeChainId;
    private String activeChainStep;
    private final Set<String> completedChainIds;
    private final Set<String> failedChainIds;
    private final List<String> recentlySeenEventIds;
    private final Instant startedAt;
    private Instant finishedAt;

    public ExplorationState(
            String explorationId,
            String playerId,
            ExplorationStatus status,
            ExplorationVisibilityMode visibilityMode,
            int step,
            int maxSteps,
            PlayerResources collectedResources,
            Instant startedAt
    ) {
        this.explorationId = explorationId;
        this.playerId = playerId;
        this.status = status;
        this.visibilityMode = visibilityMode;
        this.step = step;
        this.maxSteps = maxSteps;
        this.collectedResources = collectedResources;
        this.journalEntries = new ArrayList<>();
        this.completedChainIds = new LinkedHashSet<>();
        this.failedChainIds = new LinkedHashSet<>();
        this.recentlySeenEventIds = new ArrayList<>();
        this.startedAt = startedAt;
    }

    public String getExplorationId() {
        return explorationId;
    }

    public String getPlayerId() {
        return playerId;
    }

    public ExplorationStatus getStatus() {
        return status;
    }

    public void setStatus(ExplorationStatus status) {
        this.status = status;
    }

    public ExplorationVisibilityMode getVisibilityMode() {
        return visibilityMode;
    }

    public void setVisibilityMode(ExplorationVisibilityMode visibilityMode) {
        this.visibilityMode = visibilityMode;
    }

    public int getStep() {
        return step;
    }

    public void incrementStep() {
        this.step++;
    }

    public int getMaxSteps() {
        return maxSteps;
    }

    public PlayerResources getCollectedResources() {
        return collectedResources;
    }

    public void setCollectedResources(PlayerResources collectedResources) {
        this.collectedResources = collectedResources;
    }

    public List<JournalEntry> getJournalEntries() {
        return List.copyOf(journalEntries);
    }

    public void addJournalEntry(JournalEntry journalEntry) {
        journalEntries.add(journalEntry);
    }

    public Encounter getCurrentEncounter() {
        return currentEncounter;
    }

    public void setCurrentEncounter(Encounter currentEncounter) {
        this.currentEncounter = currentEncounter;
    }

    public boolean isStartPvpDuel() {
        return startPvpDuel;
    }

    public void setStartPvpDuel(boolean startPvpDuel) {
        this.startPvpDuel = startPvpDuel;
    }

    public String getActiveChainId() {
        return activeChainId;
    }

    public void setActiveChainId(String activeChainId) {
        this.activeChainId = activeChainId;
    }

    public String getActiveChainStep() {
        return activeChainStep;
    }

    public void setActiveChainStep(String activeChainStep) {
        this.activeChainStep = activeChainStep;
    }

    public Set<String> getCompletedChainIds() {
        return Set.copyOf(completedChainIds);
    }

    public void markChainCompleted(String chainId) {
        if (chainId != null && !chainId.isBlank()) {
            completedChainIds.add(chainId);
            failedChainIds.remove(chainId);
        }
    }

    public Set<String> getFailedChainIds() {
        return Set.copyOf(failedChainIds);
    }

    public void markChainFailed(String chainId) {
        if (chainId != null && !chainId.isBlank()) {
            failedChainIds.add(chainId);
        }
    }

    public List<String> getRecentlySeenEventIds() {
        return List.copyOf(recentlySeenEventIds);
    }

    public boolean hasRecentlySeen(String contentId) {
        return contentId != null && recentlySeenEventIds.contains(contentId);
    }

    public void markEventSeen(String contentId, int cooldownSize) {
        if (contentId == null || contentId.isBlank()) {
            return;
        }
        recentlySeenEventIds.remove(contentId);
        recentlySeenEventIds.add(contentId);
        int limit = Math.max(1, cooldownSize);
        while (recentlySeenEventIds.size() > limit) {
            recentlySeenEventIds.remove(0);
        }
    }

    public void clearActiveChain() {
        activeChainId = null;
        activeChainStep = null;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(Instant finishedAt) {
        this.finishedAt = finishedAt;
    }
}
