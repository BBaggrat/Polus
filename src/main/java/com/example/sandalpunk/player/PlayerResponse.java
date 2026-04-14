package com.example.sandalpunk.player;

import java.time.Instant;

public record PlayerResponse(
        String id,
        Long telegramUserId,
        String username,
        String nickname,
        String firstName,
        String lastName,
        String displayName,
        String journalStyle,
        int coins,
        int rating,
        boolean registered,
        int wins,
        int losses,
        String activeDuelId,
        Instant createdAt,
        Instant updatedAt
) {

    public static PlayerResponse from(PlayerProfile playerProfile) {
        return new PlayerResponse(
                playerProfile.getId(),
                playerProfile.getTelegramUserId(),
                playerProfile.getUsername(),
                playerProfile.getNickname(),
                playerProfile.getFirstName(),
                playerProfile.getLastName(),
                playerProfile.displayName(),
                playerProfile.getJournalStyle(),
                playerProfile.getCoins(),
                playerProfile.getRating(),
                playerProfile.isRegistered(),
                playerProfile.getWins(),
                playerProfile.getLosses(),
                playerProfile.getActiveDuelId(),
                playerProfile.getCreatedAt(),
                playerProfile.getUpdatedAt()
        );
    }
}
