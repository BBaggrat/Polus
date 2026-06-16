# Release analytics check

## Логируемые события

- `bot_start`
- `app_open`
- `first_exploration_started`
- `first_exploration_completed`
- `second_exploration_started`
- `repeat_exploration_started`
- `hidden_mode_selected`
- `open_pvp_mode_selected`
- `exploration_step`
- `journal_entry_added`
- `encounter_generated`
- `encounter_choice_made`
- `exploration_returned`
- `exploration_failed`
- `resources_lost`
- `resource_earned`
- `base_upgrade_bought`
- `equipment_equipped`
- `map_fragment_found`
- `route_selected`
- `chain_started`
- `chain_completed`
- `monster_encounter_seen`
- `pvp_encounter_started`
- `pvp_finished`
- `discovery_found`
- `content_event_repeated`
- `error_occurred`

## Минимальные метрики по логам

- Первый запуск: `app_open`.
- Первая начатая вылазка: `first_exploration_started`.
- Первая завершенная вылазка: `first_exploration_completed`.
- Повторная вылазка: `second_exploration_started`, `repeat_exploration_started`.
- Выбор режима: `hidden_mode_selected`, `open_pvp_mode_selected`.
- Возврат после провала: `return_to_base_after_failure`.
- Первый апгрейд: `first_upgrade_after_exploration`.
- PvP после `OPEN_PVP`: `pvp_encounter_started`, `pvp_finished`.
- Повторы контента: `content_event_repeated`.
- Частота провалов: `exploration_failed`.
- Популярность choices: `encounter_choice_made`.

## Debug endpoints

- `GET /api/analytics/debug/player`
- `GET /api/analytics/debug/summary`

Оба endpoint'а требуют `X-Session-Token`. Для production стоит оставить доступ только доверенным тестовым аккаунтам или закрыть отдельным admin-guard после релиза.

