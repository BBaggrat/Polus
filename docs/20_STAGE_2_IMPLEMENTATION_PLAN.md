# Этап 2: план реализации исследования топи

## Короткий аудит после этапа 1

- Backend: единый Spring Boot модуль в `src/main/java/com/example/sandalpunk`.
- Mini App: статика в `src/main/resources/static/duel`; входная точка `/duel`.
- Telegram Bot: `bot/TelegramLongPollingService` и `bot/TelegramBotClient` в том же JVM.
- PvP: `duel`, `matchmaking` и баланс в `config/DuelBalanceProperties`.
- Игровые логи: `logging/AppEventLogger` и `logging/AppEventType`.
- Баланс: переменные `DUEL_*` и типизированные свойства `app.duel`.
- `/duel` отдается Spring Boot как статический Mini App; бот строит URL из `BASE_URL`.

## Архитектурное решение

Исследование добавляется пакетом `exploration` внутри существующего приложения. Отдельный сервис, новый frontend-стек и изменение PvP-контрактов не требуются.

Состояния этапа 2 хранятся в in-memory repositories:

- `PlayerStateRepository`;
- `ExplorationRepository`;
- `JournalRepository`.

Это позволяет проверить игровой цикл без миграции основной БД. Ограничение: активные исследования, HP, ресурсы и журнал исследования сбрасываются после перезапуска процесса. Персистентное хранение вынесено в этап 3.

## Новые сущности

- `PlayerState`, `PlayerResources`, `ResourceType`;
- `ExplorationState`, `ExplorationStatus`, `ExplorationVisibilityMode`;
- `JournalEntry`, `JournalEntryType`;
- `Encounter`, `EncounterChoice`, `EncounterType`, `ChoiceResultType`;
- `EncounterGenerator`, `ExplorationService`, `PlayerStateService`.

## API

- `GET /api/player/state`;
- `POST /api/exploration/start`;
- `GET /api/exploration/current`;
- `POST /api/exploration/step`;
- `POST /api/exploration/{explorationId}/choice`;
- `POST /api/exploration/{explorationId}/visibility`;
- `POST /api/exploration/{explorationId}/return`;
- `GET /api/journal`.

Все endpoints используют существующий `X-Session-Token`. Переданный `playerId` сверяется с владельцем сессии и не является источником авторизации.

## Frontend

Изменяются:

- `duel/index.html`: главный блок живого дневника и новые пользовательские тексты стычки;
- `duel/app.css`: адаптивная композиция дневника;
- `duel/app.js`: read-only доступ к токену/ID сессии и тексты стычки;
- `duel/exploration.js`: изолированный клиент нового API.

Старый декоративный список дневника скрыт, но сохранен в DOM для совместимости. Существующие профиль, социальные экраны, магазин и PvP не переписываются.

## Игровой цикл

1. Игрок начинает выход в `HIDDEN` или `OPEN_PVP`.
2. Каждое продвижение сразу добавляет запись движения.
3. Генератор может создать encounter с 2-3 выборами.
4. Выбор меняет временную добычу и/или HP и добавляет результат в дневник.
5. Добыча переносится в `PlayerState.resources` только при возвращении.
6. При HP 0 исследование получает `FAILED`, а временная добыча теряется.

## Режимы

`HIDDEN` использует только соло-пул: находки, объекты, аномалии, монстры и странные записи. Типы `PVP_TRACE` и `PVP_ENCOUNTER` из него не генерируются.

`OPEN_PVP` использует пул повышенного риска. Выбор `START_PVP_DUEL` возвращает frontend-флаг `startPvpDuel`; клиент вызывает существующий `PolusApp.startQueueDuel()`.

Во время активного выхода разрешен переход только `HIDDEN -> OPEN_PVP`. Обратный переход происходит после возвращения. TODO этапа 3: определить предмет/условие для повторного скрытия.

## Проверки

- unit-тесты генератора и сервиса;
- `node --check` для `app.js` и `exploration.js`;
- `mvn test`;
- `mvn clean package`;
- ручной HTTP и браузерный smoke-test по `25_STAGE_2_SMOKE_TEST.md`.
