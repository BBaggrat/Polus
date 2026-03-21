package com.example.sandalpunk.duel;

import java.time.Instant;

public record DuelSelectedActionView(
        WeaponType weapon,
        ShotDirection shotDirection,
        DodgeDirection dodgeDirection,
        DuelActionSource source,
        Instant submittedAt
) {
    public static DuelSelectedActionView from(DuelRoundAction action) {
        if (action == null) {
            return null;
        }
        return new DuelSelectedActionView(
                action.weapon(),
                action.shotDirection(),
                action.dodgeDirection(),
                action.source(),
                action.submittedAt()
        );
    }
}
