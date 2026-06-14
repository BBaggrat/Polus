# Логирование игровых событий

## Реализация

Код:

- `logging/AppEventType.java` — стабильные имена;
- `logging/AppEventLogger.java` — SLF4J и буфер последних событий;
- `auth/SessionService.java` — `app_open`;
- `bot/TelegramLongPollingService.java` — `bot_start`;
- `duel/DuelService.java` — PvP-события;
- `web/GlobalExceptionHandler.java` — `error_occurred`.

Внешняя аналитическая система не подключена.

## Формат серверной строки

```text
game_event=damage_applied
timestamp=2026-06-14T12:00:00Z
metadata={duelId=..., attackerPlayerId=..., targetPlayerId=..., weapon=RIFLE, damage=30}
message=Damage applied
```

Фактически строка выводится в одну запись SLF4J. Timestamp также добавляет logging framework.

## События этапа 1

| Event name | Когда | Основные metadata |
| --- | --- | --- |
| `app_open` | создана Telegram/browser session | `playerId`, `channel`, `verified` |
| `bot_start` | запущен long polling | `botUsername`, `baseUrl` |
| `duel_started` | matchmaking создал дуэль | `duelId`, оба player ID, `balanceVersion` |
| `weapon_selected` | сервер принял действие | `duelId`, `playerId`, `round`, `weapon` |
| `shot_direction_selected` | сервер принял действие | `duelId`, `playerId`, `round`, direction |
| `dodge_direction_selected` | сервер принял действие | `duelId`, `playerId`, `round`, direction |
| `damage_applied` | HP цели уменьшилось | attacker, target, weapon, damage, remaining HP |
| `player_defeated` | HP достиг 0 или игрок сдался | player, winner, round/result |
| `duel_finished` | дуэль завершилась | winner, result, round, forfeit |
| `error_occurred` | необработанная серверная ошибка | exception class и контекст message |

Сохраняются и существующие operational events:

- `app_startup`;
- `bot_startup`;
- `bot_start_command`;
- `player_session`;
- `player_updated`;
- `matchmaking_join`;
- `matchmaking_cancel`;
- `round_action_submit`;
- `round_resolution`.

## Семантика app_open

Backend не видит сам факт загрузки HTML без отдельного telemetry endpoint. На этапе 1 `app_open` означает успешное создание игровой session через `/api/player/session` или `/api/player/browser-demo-session`.

Это надежнее клиентского fire-and-forget для базового smoke, но не считает загрузки, которые упали до создания session.

## Просмотр на сервере

Все события:

```bash
sudo journalctl -u sandalpunk -f
```

Только игровые:

```bash
sudo journalctl -u sandalpunk --since "1 hour ago" | grep "game_event="
```

Только завершенные дуэли:

```bash
sudo journalctl -u sandalpunk --since today | grep "game_event=duel_finished"
```

Ошибки:

```bash
sudo journalctl -u sandalpunk --since today | grep "game_event=error_occurred"
```

Последние события также доступны через:

```text
GET /api/zrp/events
```

Этот endpoint является техническим и требует защиты или отключения перед публичным релизом.

## Ограничения

- последние 200 событий в `AppEventLogger` теряются при рестарте;
- journalctl не заменяет продуктовую базу аналитики;
- нет `sessionId` в общем формате metadata;
- нет отдельного event ID;
- browser demo и Telegram различаются только в metadata `channel`;
- приватный текст чата не логируется как игровое событие.

## События для этапа вылазок

- `base_viewed`;
- `expedition_started`;
- `expedition_event_presented`;
- `expedition_choice_made`;
- `risk_choice_presented`;
- `risk_choice_made`;
- `resource_earned`;
- `resource_spent`;
- `expedition_returned`;
- `expedition_failed`;
- `diary_entry_unlocked`;
- `base_upgrade_started`;
- `base_upgrade_completed`;
- `zone_unlocked`.

До реализации нужно утвердить обязательные metadata и правила хранения.
