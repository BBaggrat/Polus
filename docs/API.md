# API

All authenticated endpoints require:

- Header: `X-Session-Token: <token>`

## `GET /api/health`

Response:

```json
{
  "status": "ok",
  "service": "polus-backend",
  "version": "0.8",
  "timestamp": "2026-06-14T10:00:00Z",
  "appName": "sandalpunk",
  "storage": "jdbc",
  "time": "2026-03-14T10:00:00Z"
}
```

`appName`, `storage`, and `time` remain present for compatibility with the earlier response.

## `POST /api/player/session`

Request:

```json
{
  "initData": "query_id=...&user=%7B...%7D&hash=...",
  "fallbackUser": {
    "guestId": "dev-browser-1",
    "firstName": "Local Duelist",
    "username": "guest_dev"
  }
}
```

`fallbackUser` is only needed for browser-only development outside Telegram.

Response:

```json
{
  "sessionToken": "uuid",
  "player": {
    "id": "uuid",
    "telegramUserId": 123456789,
    "username": "player",
    "firstName": "Player",
    "lastName": null,
    "displayName": "Player",
    "wins": 0,
    "losses": 0,
    "activeDuelId": null,
    "createdAt": "2026-03-14T10:00:00Z",
    "updatedAt": "2026-03-14T10:00:00Z"
  }
}
```

## `GET /api/player/me`

Returns the current player profile.

## `POST /api/matchmaking/join`

Response:

```json
{
  "status": "QUEUED",
  "duelId": null,
  "message": "Waiting for an opponent"
}
```

Possible `status` values:

- `IDLE`
- `QUEUED`
- `IN_DUEL`
- `COMPLETED`

## `POST /api/matchmaking/cancel`

Cancels queue membership if present.

## `GET /api/matchmaking/status`

Returns the current queue or duel summary for the authenticated player.

## `GET /api/duel/{duelId}`

Response:

```json
{
  "duelId": "uuid",
  "status": "ACTIVE",
  "roundNumber": 2,
  "you": {
    "playerId": "uuid-a",
    "displayName": "Alice",
    "hp": 75,
    "wins": 3,
    "losses": 1
  },
  "opponent": {
    "playerId": "uuid-b",
    "displayName": "Bob",
    "hp": 70,
    "wins": 5,
    "losses": 4
  },
  "yourActionSubmitted": false,
  "opponentActionSubmitted": true,
  "canSubmitAction": true,
  "winnerPlayerId": null,
  "resultLabel": null,
  "logs": []
}
```

## `POST /api/duel/{duelId}/action`

Request:

```json
{
  "weapon": "RIFLE",
  "shotDirection": "CENTER",
  "dodgeDirection": "LEFT"
}
```

Returns the updated duel state. If both players have submitted, the response includes the resolved round log.

## `GET /api/zrp/events`

Returns the most recent in-memory app events captured by the logging module.
