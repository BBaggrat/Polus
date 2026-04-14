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
    private String journalStyle;
    private int coins;
    private int rating;
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
            String journalStyle,
            int coins,
            int rating,
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
        this.journalStyle = journalStyle;
        this.coins = coins;
        this.rating = rating;
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

    public String getJournalStyle() {
        return journalStyle;
    }

    public void setJournalStyle(String journalStyle) {
        this.journalStyle = journalStyle;
    }

    public int getCoins() {
        return coins;
    }

    public void setCoins(int coins) {
        this.coins = coins;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public void addRating(int ratingDelta) {
        this.rating = Math.max(0, this.rating + ratingDelta);
    }

    public int getWins() {
        return wins;
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
}
