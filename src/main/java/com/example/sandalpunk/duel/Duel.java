package com.example.sandalpunk.duel;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

public class Duel {

    public static final int STARTING_HP = 100;

    private final String id;
    private final String playerOneId;
    private final String playerOneName;
    private final String playerTwoId;
    private final String playerTwoName;
    private int playerOneHp = STARTING_HP;
    private int playerTwoHp = STARTING_HP;
    private int roundNumber = 1;
    private DuelStatus status = DuelStatus.ACTIVE;
    private String winnerPlayerId;
    private final ConcurrentHashMap<String, DuelRoundAction> pendingActions = new ConcurrentHashMap<>();
    private final List<RoundLog> roundLogs = new ArrayList<>();
    private final List<DuelChatMessage> chatMessages = new ArrayList<>();
    private final Instant createdAt;
    private Instant updatedAt;
    private Instant finishedAt;

    public Duel(String id, String playerOneId, String playerOneName, String playerTwoId, String playerTwoName, Instant createdAt) {
        this.id = id;
        this.playerOneId = playerOneId;
        this.playerOneName = playerOneName;
        this.playerTwoId = playerTwoId;
        this.playerTwoName = playerTwoName;
        this.createdAt = createdAt;
        this.updatedAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getPlayerOneId() {
        return playerOneId;
    }

    public String getPlayerOneName() {
        return playerOneName;
    }

    public String getPlayerTwoId() {
        return playerTwoId;
    }

    public String getPlayerTwoName() {
        return playerTwoName;
    }

    public int getPlayerOneHp() {
        return playerOneHp;
    }

    public void setPlayerOneHp(int playerOneHp) {
        this.playerOneHp = playerOneHp;
    }

    public int getPlayerTwoHp() {
        return playerTwoHp;
    }

    public void setPlayerTwoHp(int playerTwoHp) {
        this.playerTwoHp = playerTwoHp;
    }

    public int getRoundNumber() {
        return roundNumber;
    }

    public void incrementRoundNumber() {
        this.roundNumber++;
    }

    public DuelStatus getStatus() {
        return status;
    }

    public void setStatus(DuelStatus status) {
        this.status = status;
    }

    public String getWinnerPlayerId() {
        return winnerPlayerId;
    }

    public void setWinnerPlayerId(String winnerPlayerId) {
        this.winnerPlayerId = winnerPlayerId;
    }

    public ConcurrentHashMap<String, DuelRoundAction> getPendingActions() {
        return pendingActions;
    }

    public List<RoundLog> getRoundLogs() {
        return roundLogs;
    }

    public List<DuelChatMessage> getChatMessages() {
        return chatMessages;
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

    public Instant getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(Instant finishedAt) {
        this.finishedAt = finishedAt;
    }

    public boolean isParticipant(String playerId) {
        return playerOneId.equals(playerId) || playerTwoId.equals(playerId);
    }

    public String opponentId(String playerId) {
        if (playerOneId.equals(playerId)) {
            return playerTwoId;
        }
        if (playerTwoId.equals(playerId)) {
            return playerOneId;
        }
        throw new IllegalArgumentException("Player is not part of duel");
    }
}
