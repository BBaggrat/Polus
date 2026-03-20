package com.example.sandalpunk.duel;

import jakarta.validation.constraints.NotNull;

public record DuelActionRequest(
        @NotNull(message = "weapon is required")
        WeaponType weapon,
        @NotNull(message = "shotDirection is required")
        ShotDirection shotDirection,
        @NotNull(message = "dodgeDirection is required")
        DodgeDirection dodgeDirection
) {
}

