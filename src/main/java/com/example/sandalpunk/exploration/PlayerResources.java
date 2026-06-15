package com.example.sandalpunk.exploration;

public record PlayerResources(
        int scrap,
        int supplies,
        int swampResin
) {

    public static PlayerResources empty() {
        return new PlayerResources(0, 0, 0);
    }

    public PlayerResources add(PlayerResources other) {
        if (other == null) {
            return this;
        }
        return new PlayerResources(
                Math.max(0, scrap + other.scrap),
                Math.max(0, supplies + other.supplies),
                Math.max(0, swampResin + other.swampResin)
        );
    }

    public PlayerResources subtract(PlayerResources cost) {
        if (!canAfford(cost)) {
            throw new IllegalArgumentException("Not enough resources");
        }
        return new PlayerResources(
                scrap - cost.scrap,
                supplies - cost.supplies,
                swampResin - cost.swampResin
        );
    }

    public boolean canAfford(PlayerResources cost) {
        return cost == null
                || (scrap >= cost.scrap
                && supplies >= cost.supplies
                && swampResin >= cost.swampResin);
    }

    public PlayerResources multiply(double multiplier) {
        return new PlayerResources(
                Math.max(0, (int) Math.round(scrap * multiplier)),
                Math.max(0, (int) Math.round(supplies * multiplier)),
                Math.max(0, (int) Math.round(swampResin * multiplier))
        );
    }

    public PlayerResources retainPercent(int percent) {
        double multiplier = Math.max(0, Math.min(100, percent)) / 100.0d;
        return multiply(multiplier);
    }

    public PlayerResources difference(PlayerResources other) {
        PlayerResources safeOther = other == null ? empty() : other;
        return new PlayerResources(
                Math.max(0, scrap - safeOther.scrap),
                Math.max(0, supplies - safeOther.supplies),
                Math.max(0, swampResin - safeOther.swampResin)
        );
    }

    public boolean isEmpty() {
        return scrap == 0 && supplies == 0 && swampResin == 0;
    }
}
