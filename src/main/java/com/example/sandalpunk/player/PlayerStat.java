package com.example.sandalpunk.player;

import com.example.sandalpunk.web.BadRequestException;

public enum PlayerStat {
    STRENGTH,
    REACTION,
    ANALYSIS;

    public static PlayerStat fromValue(String value) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException("Стат обязателен");
        }
        return switch (value.trim().toLowerCase()) {
            case "strength" -> STRENGTH;
            case "reaction" -> REACTION;
            case "analysis" -> ANALYSIS;
            default -> throw new BadRequestException("Неизвестный стат: " + value);
        };
    }
}
