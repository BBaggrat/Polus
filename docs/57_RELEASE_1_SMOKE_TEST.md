# Release 1.0 smoke test

## Bot

1. Написать боту `/start`.
2. Увидеть текст про край топи.
3. Увидеть кнопку "Открыть топь".
4. Открыть Mini App.

## Mini App

1. Открыть `/duel`.
2. Зарегистрировать ник и стиль дневника.
3. Увидеть стартовый экран и onboarding.
4. Нажать "Что это значит?".
5. Нажать "Начать скрытно".
6. Получить записи дневника.
7. Сделать шаг до encounter.
8. Выбрать действие.
9. Вернуться на базу.
10. Купить апгрейд или увидеть, что ресурсов не хватает.
11. Открыть карту.
12. Открыть снаряжение.
13. Открыть находки.
14. Начать второе исследование.
15. Перейти в `OPEN_PVP`.
16. Получить PvP trace или PvP encounter.
17. Запустить или проверить стычку.

## Backend

- `GET /api/health`
- `GET /actuator/health`
- `GET /api/player/state`
- `POST /api/exploration/start`
- `POST /api/exploration/step`
- `POST /api/exploration/{id}/return`
- `GET /api/base/state`
- `POST /api/base/upgrades/{upgradeId}/buy`
- `GET /api/equipment`
- `GET /api/map`
- `GET /api/discoveries`

## Logs

- Проверить `journalctl -u polus`.
- Проверить наличие `app_open`, `first_exploration_started`, `encounter_generated`, `exploration_returned`.
- Проверить отсутствие 500 и `error_occurred`.
