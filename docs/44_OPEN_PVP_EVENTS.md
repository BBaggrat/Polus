# OPEN_PVP события

`OPEN_PVP` стал рискованным режимом с собственным контентом, а не только входом в обычную дуэль.

## Типы

- `PVP_TRACE`: следы, гильзы, сигналы, приманки.
- `PVP_ENCOUNTER`: встреча с другим выжившим, возможность разойтись или начать стычку.
- `PVP_AFTERMATH`: следы уже прошедшей стычки.
- `RISK_REWARD`: высокая награда за заметный или опасный маршрут.

## Интеграция с дуэлью

Если выбор дает `START_PVP_DUEL`, существующий `startPvpDuel` флаг сохраняется, frontend запускает текущий queue duel flow. Дневник пишет минимальный adapter-message. Полная запись результата PvP после дуэли оставлена в release backlog.

## Analytics

- `open_pvp_mode_selected`
- `open_pvp_after_hidden_enabled`
- `pvp_trace_choice_made`
- `pvp_encounter_started`

