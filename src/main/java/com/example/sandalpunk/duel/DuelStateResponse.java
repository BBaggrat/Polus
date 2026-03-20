package com.example.sandalpunk.duel;

import java.time.Instant;
import java.util.List;

public record DuelStateResponse(
        String duelId,
        DuelStatus status,
        int roundNumber,
        DuelParticipantView you,
        DuelParticipantView opponent,
        boolean yourActionSubmitted,
        boolean opponentActionSubmitted,
        boolean canSubmitAction,
        String winnerPlayerId,
        String resultLabel,
        List<RoundLogView> logs,
        List<DuelChatMessageView> chatMessages,
        Instant createdAt,
        Instant updatedAt,
        Instant finishedAt
) {
}
