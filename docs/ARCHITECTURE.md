# Architecture

## Overview

Sandalpunk is a modular monolith built as one Spring Boot application.

- The Telegram bot uses Bot API long polling inside the same JVM.
- The Mini App frontend is static HTML/CSS/JS served from Spring Boot.
- The backend API provides session bootstrap, player state, matchmaking, duels, health, and recent events.
- Storage defaults to in-memory repositories backed by `ConcurrentHashMap`.

## Modules

- `config`: application properties, shared beans, clock, Telegram `RestClient`
- `health`: `/api/health`
- `web`: route forwarding for `/duel`, API error model, global exception handling
- `auth`: Telegram Mini App session bootstrap, `initData` validation, session token storage
- `player`: player profile model, repository, service, controller
- `matchmaking`: queue repository, service, controller
- `duel`: duel aggregate, action DTOs, duel engine, repository, service, controller
- `bot`: Telegram Bot API client and long polling lifecycle service
- `zrp`: recent application event feed at `/api/zrp/events`
- `logging`: structured event capture for gameplay and operational actions

## Runtime flow

1. Telegram user sends `/start` to the bot.
2. The bot replies with an inline WebApp button pointing to `https://<BASE_URL>/duel`.
3. The Mini App posts Telegram `initData` to `/api/player/session`.
4. The backend validates the payload, creates or updates a player, and returns a session token.
5. The frontend uses `X-Session-Token` for subsequent API calls.
6. Matchmaking pairs the first waiting player with the next one and creates a duel.
7. Both players submit one action per round.
8. `DuelEngine` resolves the round and appends round logs.
9. The frontend polls for updated matchmaking and duel state every 1.5 seconds.

## Storage strategy

- `PlayerRepository`
- `SessionRepository`
- `MatchmakingRepository`
- `DuelRepository`

Each repository currently has an in-memory implementation. The interfaces are intentionally small so a PostgreSQL-backed implementation can be added later without changing controllers or services.

## Production notes

- Single VPS deployment keeps the MVP operationally simple.
- Nginx terminates TLS and proxies to Spring Boot on localhost.
- systemd keeps the process alive and makes logs available through `journalctl`.
- Secrets are read from environment variables, not from committed files.

