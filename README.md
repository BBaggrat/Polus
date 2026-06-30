# Sandalpunk / Полюс

Sandalpunk / Полюс — компактная Telegram survival-RPG / Mini App о плаваниях по аномальному океану. Игрок держит лодку у старой пристани, следит за автоматическим бортовым журналом, собирает детали, припасы и записи, встречает невозможные объекты, подводные угрозы и чужие лодки.

Существующая PvP-механика сохраняется как **стычка на воде**: две лодки одновременно выбирают оружие, направление атаки и маневр защиты.

Проект находится в состоянии **Release 1.0 Candidate**.

**Текущий статус: релизная сборка 1.0.** Игрок открывает бота, запускает Mini App, читает автоматический бортовой журнал плавания, улучшает лодку, модули и карту, а PvP запускает старым прямым поиском стычки.

## Текущая архитектура

- один Spring Boot 3.3 / Java 17 модуль;
- JSON API и статический Mini App в одном приложении;
- Telegram-бот через long polling в том же JVM;
- JDBC-хранение профилей и друзей, файловая H2 по умолчанию;
- матчмейкинг и активные стычки в памяти процесса;
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

Для Telegram-сценария нужны `BASE_URL`, `BOT_TOKEN` и `BOT_USERNAME`. Для браузерной проверки можно оставить `ALLOW_DEV_SESSIONS=true`; для публичного production выставить `ALLOW_DEV_SESSIONS=false`.

Основные env:

- `APP_VERSION=1.0-rc1`
- `PORT`
- `BASE_URL`
- `BOT_TOKEN`
- `BOT_USERNAME`
- `SPRING_PROFILES_ACTIVE=prod`
- `APP_STORAGE`
- `DB_DATA_DIR` или `DB_URL`

На главном экране:

1. У причала открыть «Модификации», «Модули» или «Карта».
2. Купить доступную модификацию за лом, припасы и налет.
3. Подготовить экипировку и выбрать открытый курс.
4. Открыть «Находки», чтобы увидеть записи, найденные в прошлых плаваниях.
5. Читать автоматические записи бортового журнала о плавании.
6. Запустить PvP через прямую кнопку поиска стычки.
7. Продолжить модификации лодки после стычек и найденных записей.

Проверка сборки:

```bash
mvn clean package
```

Healthcheck:

```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/actuator/health
```

Минимальная проверка release smoke описана в [docs/57_RELEASE_1_SMOKE_TEST.md](./docs/57_RELEASE_1_SMOKE_TEST.md).

## Деплой

Сборка:

```bash
mvn clean package
```

Production checklist:

```bash
sudo systemctl status polus
sudo journalctl -u polus -f
curl https://YOUR_DOMAIN/api/health
curl https://YOUR_DOMAIN/actuator/health
sudo nginx -t
sudo systemctl reload nginx
```

Подробно: [release deploy checklist](./docs/56_RELEASE_DEPLOY_CHECKLIST.md).

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
- [Игровой цикл живого бортового журнала](./docs/21_JOURNAL_EXPLORATION.md)
- [Exploration API](./docs/22_EXPLORATION_API.md)
- [Каталог encounter-событий](./docs/23_ENCOUNTER_EVENTS.md)
- [Backlog этапа 3](./docs/24_STAGE_3_BACKLOG.md)
- [Smoke checklist этапа 2](./docs/25_STAGE_2_SMOKE_TEST.md)

## Документация этапа 3

- [План реализации](./docs/30_STAGE_3_IMPLEMENTATION_PLAN.md)
- [Модификации лодки](./docs/31_BASE_UPGRADES.md)
- [Модули](./docs/32_EQUIPMENT.md)
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

## Документация Release 1.0 Candidate

- [Release audit](./docs/50_RELEASE_1_AUDIT.md)
- [Scope freeze](./docs/51_RELEASE_1_SCOPE_FREEZE.md)
- [Content QA report](./docs/52_CONTENT_QA_REPORT.md)
- [Release balance](./docs/53_RELEASE_1_BALANCE.md)
- [PvP release check](./docs/54_PVP_RELEASE_CHECK.md)
- [Analytics check](./docs/55_RELEASE_ANALYTICS_CHECK.md)
- [Deploy checklist](./docs/56_RELEASE_DEPLOY_CHECKLIST.md)
- [Smoke test](./docs/57_RELEASE_1_SMOKE_TEST.md)
- [Regression test](./docs/58_RELEASE_1_REGRESSION_TEST.md)
- [Post-release backlog](./docs/59_POST_RELEASE_BACKLOG.md)
- [Changelog](./CHANGELOG.md)

## Технические документы

- [Архитектура](./docs/ARCHITECTURE.md)
- [API](./docs/API.md)
- [Деплой](./docs/DEPLOY.md)
- [Текущие правила PvP](./docs/GAMEPLAY.md)
