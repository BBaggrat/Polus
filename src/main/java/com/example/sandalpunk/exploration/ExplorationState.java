package com.example.sandalpunk.exploration;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

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
