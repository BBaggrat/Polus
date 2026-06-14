package com.example.sandalpunk.logging;

public enum AppEventType {
    APP_OPEN("app_open"),
    APP_STARTUP("app_startup"),
    BOT_START("bot_start"),
    BOT_STARTUP("bot_startup"),
    BOT_START_COMMAND("bot_start_command"),
    PLAYER_SESSION("player_session"),
    PLAYER_UPDATED("player_updated"),
    MATCHMAKING_JOIN("matchmaking_join"),
    MATCHMAKING_CANCEL("matchmaking_cancel"),
    DUEL_STARTED("duel_started"),
    DUEL_CREATED("duel_created"),
    ROUND_ACTION_SUBMIT("round_action_submit"),
    WEAPON_SELECTED("weapon_selected"),
    SHOT_DIRECTION_SELECTED("shot_direction_selected"),
    DODGE_DIRECTION_SELECTED("dodge_direction_selected"),
    ROUND_RESOLUTION("round_resolution"),
    DAMAGE_APPLIED("damage_applied"),
    PLAYER_DEFEATED("player_defeated"),
    DUEL_FINISHED("duel_finished"),
    MATCH_FINISH("match_finish"),
    ERROR_OCCURRED("error_occurred"),
    ERROR("error");

    private final String eventName;

    AppEventType(String eventName) {
        this.eventName = eventName;
    }

    public String eventName() {
        return eventName;
    }
}

