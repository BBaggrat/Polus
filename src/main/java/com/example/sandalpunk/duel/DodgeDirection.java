package com.example.sandalpunk.duel;

public enum DodgeDirection {
    LEFT,
    STAY,
    RIGHT;

    public ShotDirection toShotLine() {
        return switch (this) {
            case LEFT -> ShotDirection.LEFT;
            case STAY -> ShotDirection.CENTER;
            case RIGHT -> ShotDirection.RIGHT;
        };
    }
}

