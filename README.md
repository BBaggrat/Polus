# Sandalpunk / Полюс

Sandalpunk is a minimal production-oriented Telegram Mini App MVP for 1v1 simultaneous-round duels. A Telegram bot handles `/start`, opens the WebApp at `/duel`, and the Spring Boot app serves both the JSON API and the static frontend.

## Quick start

1. Copy `.env.example` to `.env`.
2. Export the variables into your shell or IDE run configuration.
3. Run `mvn spring-boot:run`.
4. Open `http://localhost:8080/duel`.

For a real Telegram flow, set `BASE_URL`, `BOT_TOKEN`, and `BOT_USERNAME`. For local browser-only development, the frontend falls back to a guest profile if Telegram `initData` is unavailable.

## What is included

- `/api/health`
- Telegram bot `/start` long polling flow
- Player session bootstrap via Telegram Mini App `initData`
- Matchmaking queue and duel room
- In-memory repositories behind repository interfaces
- Static mobile-friendly frontend under `src/main/resources/static/duel`
- VPS deployment assets for Nginx, systemd, and Let's Encrypt

## Docs

- [Architecture](./docs/ARCHITECTURE.md)
- [API](./docs/API.md)
- [Deploy](./docs/DEPLOY.md)
- [Gameplay](./docs/GAMEPLAY.md)
