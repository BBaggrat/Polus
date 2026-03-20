package com.example.sandalpunk.duel;

import java.time.Instant;

public record DuelRoundAction(
        String playerId,
        int roundNumber,
        WeaponType weapon,
        ShotDirection shotDirection,
        DodgeDirection dodgeDirection,
        Instant submittedAt
) {
}

