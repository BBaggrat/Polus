# Sandalpunk / Полюс

Sandalpunk / Полюс — компактная Telegram survival-RPG / Mini App о выживании в аномальной сибирской топи. Игрок выходит из убежища на вылазки, принимает решения о риске, собирает ресурсы и дневниковые записи, встречает аномалии, PvE-угрозы и других игроков.

Существующая PvP-механика сохраняется как **стычка в топи**: два игрока одновременно выбирают оружие, направление атаки и направление уворота.

Проект находится в переходе к релизной версии 1.0.

**Текущий статус: этап 4 — контент, цепочки событий и release 1.0 prep.** Игрок возвращает добычу, улучшает убежище и снаряжение, собирает фрагменты карты, открывает находки, проходит короткие цепочки событий и выбирает между скрытым маршрутом и рискованным `OPEN_PVP`.

## Текущая архитектура

- один Spring Boot 3.3 / Java 17 модуль;
- JSON API и статический Mini App в одном приложении;
- Telegram-бот через long polling в том же JVM;
- JDBC-хранение профилей и друзей, файловая H2 по умолчанию;
- матчмейкинг и активные дуэли в памяти процесса;
- frontend на HTML/CSS/JavaScript без внешнего UI-фреймворка;
- деплой одного JAR через Nginx и systemd.

Подробный снимок состояния: [аудит репозитория](./docs/07_CURRENT_STATE_AUDIT.md).

## Локальный запуск

1. Скопировать `.env.example` в `.env` и загрузить переменные в shell или IDE.
2. Запустить:

```bash
mvn spring-boot:run
```

3. Открыть [http://localhost:8080/duel](http://localhost:8080/duel).

Для Telegram-сценария нужны `BASE_URL`, `BOT_TOKEN` и `BOT_USERNAME`. Для браузерной демонстрации используется отдельная временная demo-сессия без создания постоянного Telegram-профиля.

На главном экране:

1. На базе открыть «Улучшения», «Снаряжение» или «Карта».
2. Купить доступное улучшение за лом, припасы и смолу.
3. Подготовить экипировку и выбрать открытый маршрут.
4. Открыть «Находки», чтобы увидеть записи, найденные в прошлых вылазках.
5. Начать скрытое исследование или выйти в `OPEN_PVP`.
6. Читать живые записи, принимать решения, собирать добычу и завершать цепочки.
7. Вернуться на базу, чтобы сохранить ресурсы и продолжить прогрессию.

Проверка сборки:

```bash
mvn clean package
```

Healthcheck:

```bash
curl http://localhost:8080/api/health
```

## Документация перехода к 1.0

- [Видение продукта](./docs/00_PRODUCT_VISION.md)
- [Игровые циклы](./docs/01_CORE_LOOP.md)
- [Scope релиза 1.0](./docs/02_RELEASE_1_SCOPE.md)
- [Roadmap](./docs/03_ROADMAP.md)
- [Метрики](./docs/04_METRICS.md)
- [Производство контента](./docs/05_CONTENT_PIPELINE.md)
- [Модель малой команды](./docs/06_PRODUCTION_MODEL.md)
- [Следующий технический этап](./docs/99_CODEX_NEXT_STEPS.md)

## Документация этапа 1

- [Технический аудит](./docs/10_TECH_AUDIT.md)
- [Конфигурация PvP-баланса](./docs/11_BALANCE_CONFIG.md)
- [Игровые события](./docs/12_GAME_EVENTS_LOGGING.md)
- [Smoke checklist](./docs/13_SMOKE_TEST_CHECKLIST.md)
- [Аудит деплоя](./docs/14_DEPLOY_AUDIT.md)
- [Backlog этапа 2](./docs/15_STAGE_2_TECH_BACKLOG.md)

## Документация этапа 2

- [План и архитектурные решения](./docs/20_STAGE_2_IMPLEMENTATION_PLAN.md)
- [Игровой цикл живого дневника](./docs/21_JOURNAL_EXPLORATION.md)
- [Exploration API](./docs/22_EXPLORATION_API.md)
- [Каталог encounter-событий](./docs/23_ENCOUNTER_EVENTS.md)
- [Backlog этапа 3](./docs/24_STAGE_3_BACKLOG.md)
- [Smoke checklist этапа 2](./docs/25_STAGE_2_SMOKE_TEST.md)

## Документация этапа 3

- [План реализации](./docs/30_STAGE_3_IMPLEMENTATION_PLAN.md)
- [Улучшения базы](./docs/31_BASE_UPGRADES.md)
- [Снаряжение](./docs/32_EQUIPMENT.md)
- [Система карты](./docs/33_MAP_SYSTEM.md)
- [Баланс риска и награды](./docs/34_RISK_REWARD_BALANCE.md)
- [Smoke checklist этапа 3](./docs/35_STAGE_3_SMOKE_TEST.md)
- [Backlog этапа 4](./docs/36_STAGE_4_BACKLOG.md)

## Документация этапа 4

- [План реализации](./docs/40_STAGE_4_IMPLEMENTATION_PLAN.md)
- [Расширение контента](./docs/41_CONTENT_EXPANSION.md)
- [Цепочки событий](./docs/42_EVENT_CHAINS.md)
- [Существа](./docs/43_MONSTERS.md)
- [OPEN_PVP события](./docs/44_OPEN_PVP_EVENTS.md)
- [Находки](./docs/45_DISCOVERIES.md)
- [Retention analytics](./docs/46_RETENTION_ANALYTICS.md)
- [Баланс контента](./docs/47_CONTENT_BALANCE.md)
- [Smoke checklist этапа 4](./docs/48_STAGE_4_SMOKE_TEST.md)
- [Release 1.0 backlog](./docs/49_RELEASE_1_BACKLOG.md)

## Технические документы

- [Архитектура](./docs/ARCHITECTURE.md)
- [API](./docs/API.md)
- [Деплой](./docs/DEPLOY.md)
- [Текущие правила PvP](./docs/GAMEPLAY.md)
