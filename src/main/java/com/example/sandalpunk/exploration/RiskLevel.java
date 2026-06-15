package com.example.sandalpunk.exploration;

public enum RiskLevel {
    LOW,
    MEDIUM,
    HIGH;

    public static RiskLevel fromRussian(String value) {
        if (value == null) {
            return MEDIUM;
        }
        return switch (value.toLowerCase()) {
            case "низкий" -> LOW;
            case "высокий" -> HIGH;
            default -> MEDIUM;
        };
    }
}
