package com.example.sandalpunk.player;

import java.time.Instant;

public class PlayerProfile {

    private final String id;
    private final String identityKey;
    private Long telegramUserId;
    private String username;
    private String nickname;
    private String firstName;
    private String lastName;
    private String languageCode;
    private int coins;
    private int experience;
    private int strength;
    private int reaction;
    private int analysis;
    private int wins;
    private int losses;
    private String activeDuelId;
    private final Instant createdAt;
    private Instant updatedAt;

    public PlayerProfile(
            String id,
            String identityKey,
            Long telegramUserId,
            String username,
            String nickname,
            String firstName,
            String lastName,
            String languageCode,
            int coins,
            int experience,
            int strength,
            int reaction,
            int analysis,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.id = id;
        this.identityKey = identityKey;
        this.telegramUserId = telegramUserId;
        this.username = username;
        this.nickname = nickname;
        this.firstName = firstName;
        this.lastName = lastName;
        this.languageCode = languageCode;
        this.coins = coins;
        this.experience = experience;
        this.strength = strength;
        this.reaction = reaction;
        this.analysis = analysis;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public String getIdentityKey() {
        return identityKey;
    }

    public Long getTelegramUserId() {
        return telegramUserId;
    }

    public void setTelegramUserId(Long telegramUserId) {
        this.telegramUserId = telegramUserId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getLanguageCode() {
        return languageCode;
    }

    public void setLanguageCode(String languageCode) {
        this.languageCode = languageCode;
    }

    public int getCoins() {
        return coins;
    }

    public void setCoins(int coins) {
        this.coins = coins;
    }

    public int getWins() {
        return wins;
    }

    public int getStrength() {
        return strength;
    }

    public int getReaction() {
        return reaction;
    }

    public int getAnalysis() {
        return analysis;
    }

    public int getExperience() {
        return experience;
    }

    public void addExperience(int experienceDelta) {
        this.experience = Math.max(0, this.experience + experienceDelta);
    }

    public void incrementWins() {
        this.wins++;
    }

    public int getLosses() {
        return losses;
    }

    public void incrementLosses() {
        this.losses++;
    }

    public String getActiveDuelId() {
        return activeDuelId;
    }

    public void setActiveDuelId(String activeDuelId) {
        this.activeDuelId = activeDuelId;
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

    public String displayName() {
        if (nickname != null && !nickname.isBlank()) {
            return nickname;
        }
        if (firstName != null && !firstName.isBlank()) {
            return firstName;
        }
        if (username != null && !username.isBlank()) {
            return "@" + username;
        }
        return id.substring(0, Math.min(8, id.length()));
    }

    public boolean isRegistered() {
        return nickname != null && !nickname.isBlank();
    }

    public void incrementStat(PlayerStat stat) {
        switch (stat) {
            case STRENGTH -> strength++;
            case REACTION -> reaction++;
            case ANALYSIS -> analysis++;
        }
    }

    public int getAllocatedStatPoints() {
        return strength + reaction + analysis;
    }

    public int getAvailableStatPoints() {
        return Math.max(0, getLevel() - 1 - getAllocatedStatPoints());
    }

    public int getLevel() {
        if (experience >= 500) {
            return 5;
        }
        if (experience >= 350) {
            return 4;
        }
        if (experience >= 200) {
            return 3;
        }
        if (experience >= 100) {
            return 2;
        }
        return 1;
    }

    public int getCurrentLevelExperience() {
        int level = getLevel();
        return experience - levelFloor(level);
    }

    public int getNextLevelExperience() {
        int level = getLevel();
        return level >= 5 ? 150 : levelCap(level) - levelFloor(level);
    }

    private int levelFloor(int level) {
        return switch (level) {
            case 5 -> 350;
            case 4 -> 200;
            case 3 -> 100;
            default -> 0;
        };
    }

    private int levelCap(int level) {
        return switch (level) {
            case 1 -> 100;
            case 2 -> 200;
            case 3 -> 350;
            case 4 -> 500;
            default -> 500;
        };
    }
}
