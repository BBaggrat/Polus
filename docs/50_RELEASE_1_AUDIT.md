# Release 1.0 audit

## Структура продукта

Polus / Sandalpunk — Telegram Mini App survival-RPG о вылазках в аномальную топь. Главный интерфейс исследования — живой дневник. Игрок начинает с базы, выходит в `HIDDEN` или `OPEN_PVP`, принимает решения в событиях, возвращает ресурсы, усиливает базу, снаряжение и карту, затем повторяет цикл.

## Реализованные системы

- Telegram Bot long polling: `/start` отправляет WebApp-кнопку.
- Mini App `/duel` на HTML/CSS/JS без внешнего frontend framework.
- Профиль игрока, регистрация никнейма, browser fallback session для локальной проверки.
- RPS/PvP-стычка: оружие, направление выстрела, уворот, чат, логи.
- Exploration: живой дневник, `HIDDEN`, `OPEN_PVP`, события, выборы, возврат, провал.
- База: ресурсы, апгрейды, эффекты склада/карты/настила/сушилки/оберега.
- Снаряжение: броня, обереги, инструменты, улучшения при верстаке.
- Карта: фрагменты и маршруты.
- Stage 4 content: расширенный каталог событий, цепочки, монстры как text encounters, discoveries.
- Логирование игровых событий и debug endpoints.

## API

Основные endpoint'ы:

- `GET /api/health`
- `GET /actuator/health`
- `POST /api/session`
- `POST /api/player/browser-demo-session`
- `GET /api/player/state`
- `POST /api/player/register`
- `POST /api/exploration/start`
- `GET /api/exploration/current`
- `POST /api/exploration/step`
- `POST /api/exploration/{id}/choice`
- `POST /api/exploration/{id}/visibility`
- `POST /api/exploration/{id}/return`
- `GET /api/journal`
- `GET /api/base/state`
- `POST /api/base/upgrades/{upgradeId}/buy`
- `GET /api/equipment`
- `POST /api/equipment/equip`
- `POST /api/equipment/upgrade`
- `GET /api/map`
- `POST /api/map/routes/{routeId}/select`
- `GET /api/discoveries`
- `GET /api/events/catalog`
- `GET /api/chains/catalog`
- `GET /api/analytics/debug/player`
- `GET /api/analytics/debug/summary`
- duel/matchmaking/social endpoints from existing PvP and friends flow.

## Frontend-экраны

- Хаб / главный экран.
- Регистрация профиля.
- Профиль, ресурсы, рейтинг, leaderboard.
- Живой дневник исследования.
- Активное событие и выборы.
- База: апгрейды, снаряжение, карта, находки.
- PvP-стычка.
- Друзья, приглашения, социальные чаты.
- Магазин и инвентарь.

## Игровые режимы

- `HIDDEN`: осторожное solo/PvE-исследование без принудительного PvP.
- `OPEN_PVP`: рискованный открытый режим, где возможны PvP-следы и стычки.
- PvP/RPS: отдельная стычка с текущей боевой математикой.

## Документы

Сохранены документы этапов 0–4. Для релиза добавлены `docs/50–59`: audit, scope freeze, QA, баланс, PvP, analytics, deploy, smoke, regression, post-release backlog.

## Release blockers

- Нет открытых blocker'ов после этапа 5.

## Исправленные blockers/риски

- Пользовательский `/start` теперь ведет в топь, а не в отдельный PvP-first сценарий.
- Кнопка Telegram Bot переименована в "Открыть топь".
- Добавлен короткий onboarding первого выхода.
- Добавлены `first_exploration_started` и `pvp_finished`.
- Добавлен `GET /api/analytics/debug/summary`.
- Добавлен deploy-compatible healthcheck alias `GET /actuator/health`.

## Non-blocking issues

- Discoveries и analytics debug живут in-memory; после рестарта debug-агрегаты сбрасываются.
- Итог реальной PvP-стычки пока не записывается обратно в конкретную exploration-цепочку.
- Debug endpoints защищены session token, но не имеют отдельного admin-role.
- Browser fallback session должна быть выключена в production через `ALLOW_DEV_SESSIONS=false`, если внешним игрокам нужен только Telegram-вход.
- Полная визуальная карта пока заменена списком маршрутов.

## Post-release backlog

- Постоянное хранилище discoveries/analytics.
- Интеграция результата PvP обратно в дневник исследования.
- Admin/debug role для analytics endpoints.
- Расширение карты и content tools.
- Балансный проход по реальным данным игроков.

## Входит в Release 1.0

Telegram Bot, Mini App, живой дневник, `HIDDEN`, `OPEN_PVP`, текущая PvP-стычка, база, ресурсы, апгрейды, снаряжение, карта, события, цепочки, монстры как text encounters, находки, логирование, базовая аналитика, smoke/regression docs, production deploy instructions.

## Не входит в Release 1.0

Монетизация, кланы, рынок, торговля, полноценная визуальная карта, полноценная PvE-боевка, большой сюжетный режим, сезоны рейтинга, сложный крафт, дерево навыков, push-уведомления, сложная админ-панель.
