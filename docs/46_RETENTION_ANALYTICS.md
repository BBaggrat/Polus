# Retention analytics

Stage 4 использует существующий `AppEventLogger`. События остаются в recent in-memory buffer и в логах приложения.

## Добавленные markers

- `retention_marker_d1_candidate`
- `first_exploration_completed`
- `second_exploration_started`
- `repeat_exploration_started`
- `hidden_mode_selected`
- `open_pvp_mode_selected`
- `open_pvp_after_hidden_enabled`
- `chain_started`
- `chain_completed`
- `chain_failed`
- `monster_encounter_seen`
- `monster_choice_made`
- `pvp_trace_choice_made`
- `discovery_found`
- `return_to_base_success`
- `return_to_base_after_failure`
- `first_upgrade_after_exploration`
- `map_route_used`
- `content_event_repeated`

## Debug API

```http
GET /api/analytics/debug/player?playerId=<id>
```

Требует `X-Session-Token`. Возвращает количество экспедиций, активную экспедицию, находки и recent events текущего игрока.

