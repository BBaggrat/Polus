# Sandalpunk / Полюс

Sandalpunk / Полюс — компактная Telegram survival-RPG / Mini App о выживании в аномальной сибирской топи. Игрок выходит из убежища на вылазки, принимает решения о риске, собирает ресурсы и дневниковые записи, встречает аномалии, PvE-угрозы и других игроков.

Существующая PvP-механика сохраняется как **стычка в топи**: два игрока одновременно выбирают оружие, направление атаки и направление уворота.

Проект находится в переходе к релизной версии 1.0.

**Текущий этап: 0.8 — техническая стабилизация.** Действующая PvP-механика сохранена, баланс вынесен в типизированную конфигурацию, healthcheck расширен, добавлены структурированные игровые события, smoke-чеклист и проверяемый rollback JAR.

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

## Технические документы

- [Архитектура](./docs/ARCHITECTURE.md)
- [API](./docs/API.md)
- [Деплой](./docs/DEPLOY.md)
- [Текущие правила PvP](./docs/GAMEPLAY.md)
