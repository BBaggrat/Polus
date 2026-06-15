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

    public boolean isEmpty() {
        return scrap == 0 && supplies == 0 && swampResin == 0;
    }
}
