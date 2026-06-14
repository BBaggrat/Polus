# Технический аудит этапа 1

Дата аудита: **14 июня 2026 года**.

## Резюме

Polus / Sandalpunk — один Spring Boot-монолит на Java 17. Backend, Telegram-бот и статический Mini App запускаются в одном JVM и деплоятся одним JAR. Архитектура подходит текущему масштабу и не требует разделения перед версией 1.0.

Текущая PvP-механика работоспособна и покрыта unit-тестами. Основные риски находятся не в формуле боя, а в хранении оперативного состояния, размере frontend-файла и отсутствии автоматического end-to-end smoke-теста.

## Структура

```text
Polus/
├─ src/main/java/com/example/sandalpunk/
│  ├─ auth/          Telegram initData, browser demo, сессии
│  ├─ bot/           Telegram Bot API long polling
│  ├─ config/        env, DataSource, PvP-конфигурация
│  ├─ duel/          duel aggregate, service, engine, API, чат
│  ├─ friend/        друзья и заявки
│  ├─ health/        GET /api/health
│  ├─ logging/       структурированные события
│  ├─ matchmaking/   очередь игроков
│  ├─ player/        профиль, монеты, рейтинг
│  ├─ web/           route /duel и API errors
│  └─ zrp/           последние события приложения
├─ src/main/resources/
│  ├─ application.yml
│  └─ static/duel/   HTML/CSS/JavaScript Mini App
├─ src/test/java/    unit и controller-тесты
├─ deploy/           Nginx, systemd, deploy/restart/logs/rollback
└─ docs/
```

## Точки входа

- Java: `SandalpunkApplication`.
- Mini App: `GET /duel` → `/duel/index.html`.
- API: `/api/**`.
- Healthcheck: `GET /api/health`.
- Telegram: `TelegramLongPollingService`, команда `/start`.
- Production process: `/usr/bin/java -jar /opt/sandalpunk/sandalpunk.jar`.

## Запуск

Локально:

```bash
mvn spring-boot:run
```

Проверка:

```text
http://localhost:8080/duel
http://localhost:8080/api/health
```

Production-схема:

```text
Telegram / Browser
  → Nginx :443
  → Spring Boot :8080
  → H2 file или внешний JDBC
```

## Backend

### Работает

- Telegram и browser demo session bootstrap.
- Регистрация ника и стиля дневника.
- JDBC-профили и друзья.
- Matchmaking.
- Серверная PvP-математика.
- Боевое сообщение с фильтром ссылок.
- Награды в монетах и рейтинге.
- Единый JSON error model.
- Структурированные серверные события.

### Хранение

Постоянно через JDBC:

- профиль;
- ник и стиль дневника;
- монеты и рейтинг;
- победы и поражения;
- друзья и заявки.

Только в памяти:

- session tokens;
- очередь;
- активные дуэли;
- чат дуэли;
- browser demo profiles;
- последние 200 событий.

Рестарт приложения сбрасывает весь второй список. Профиль может сохранить ссылку на исчезнувшую дуэль; `MatchmakingService` умеет обнаружить это и очистить ссылку.

## PvP и оружие

Актуальный enum:

- `PISTOLS`;
- `RIFLE`;
- `SHOTGUN`.

Актуальная логика:

- 100 стартовых HP;
- `PISTOLS`: 18 урона, щит всегда снижает входящий урон на 30%;
- `RIFLE`: 30 урона;
- `SHOTGUN`: 5 дробин по 5 урона, 35% шанс зацепа на 5 урона при несовпадении линии;
- раунд: 120 секунд;
- победа: 100 монет и +10 рейтинга;
- поражение: 25 монет и −10 рейтинга.

Инструкция этапа 1 содержит старое описание `MG / PISTOL / RIFLE`. Оно не соответствует текущему `main`. В соответствии с ограничением «не менять баланс» в конфигурацию вынесены фактические production-значения.

## Frontend / Mini App

Mini App:

- статический HTML/CSS/JS;
- подключает официальный Telegram WebApp SDK;
- использует относительные `/api/...` URL;
- не содержит production-ссылок на localhost;
- поддерживает browser demo session;
- сохраняет клиентское состояние в `localStorage`.

### Главный риск frontend

`app.js` содержит много повторных объявлений одних функций. Последние function declarations переопределяют предыдущие в пределах IIFE. Активный слой в конце файла дополнительно восстанавливает состояние и выставляет `window.PolusApp`.

Последствия:

- трудно доказать, какой код исполняется;
- исправление ранней функции может не влиять на результат;
- в неактивных слоях остаются mojibake и устаревшие API-вызовы;
- размер и стоимость регрессии растут.

Обнаружен вызов отсутствующего `POST /api/player/stats` в старых слоях. Финальный `window.PolusApp` не экспортирует `allocateStat`, а соответствующий UI скрыт, поэтому основной сценарий сейчас не вызывает endpoint. Удалять дубли без browser smoke рискованно.

## Telegram-бот

Проверено по коду:

- `/start` обрабатывается;
- WebApp-кнопка присутствует;
- URL строится из `BASE_URL + /duel`;
- используются `BOT_TOKEN` и `BOT_USERNAME`;
- токен и домен не захардкожены;
- при старте выполняются `deleteWebhook` и `getMe`;
- long polling завершается через lifecycle `stop`.

Риск: бот и backend находятся в одном JVM. Длительные проблемы Telegram API не должны останавливать HTTP-сервис; текущий poll loop перехватывает исключения, но отдельного bot-health пока нет.

## Healthcheck

`GET /api/health` сохранен и расширен:

```json
{
  "status": "ok",
  "service": "polus-backend",
  "version": "0.8",
  "timestamp": "2026-06-14T12:00:00Z",
  "appName": "sandalpunk",
  "storage": "jdbc",
  "time": "2026-06-14T12:00:00Z"
}
```

`appName`, `storage` и `time` оставлены для совместимости.

Ограничение: endpoint подтверждает работу процесса, но пока не выполняет отдельный запрос к БД и Telegram API.

## Логирование

Используется SLF4J. `AppEventLogger`:

- пишет события в стандартный application log;
- сохраняет последние 200 событий в памяти;
- нормализует metadata в строки;
- не использует `System.out.println`.

Риск: `/api/zrp/events` возвращает последние события без отдельной административной авторизации. В metadata могут находиться внутренние player ID. Перед публичным релизом endpoint нужно защитить, выключить или обезличить.

## Тесты

Есть:

- `DuelEngineTest`;
- `HealthControllerTest`;
- `MatchmakingServiceTest`;
- `PlayerServiceTest`.

Проверяется:

- действующая PvP-математика;
- чтение урона из конфигурации;
- health endpoint;
- очистка ссылки на потерянную дуэль;
- изоляция browser demo profiles.

Пока нет:

- полного HTTP smoke двух игроков;
- browser automation;
- теста Telegram `/start`;
- теста JDBC schema/migration;
- CI workflow;
- теста production Nginx/systemd.

## Deploy

В репозитории есть:

- systemd unit;
- Nginx HTTP→HTTPS reverse proxy;
- `deploy.sh`;
- `restart.sh`;
- `logs.sh`;
- `rollback.sh`.

`deploy.sh` теперь сохраняет текущий JAR как `sandalpunk.jar.previous`. Это дает один простой шаг отката, но не заменяет backup БД.

Фактический серверный wrapper `/usr/local/bin/polus-deploy`, использовавшийся ранее, отсутствует в репозитории. Его содержимое нужно сверить с `deploy/scripts/deploy.sh`.

## Что можно менять безопасно

- новые типизированные application properties;
- расширение metadata событий;
- документацию и smoke-чеклисты;
- unit/controller-тесты;
- внутренние сервисные методы при сохранении API DTO;
- относительные frontend API-вызовы;
- deploy-проверки без изменения путей systemd.

## Что трогать осторожно

- `app.js`: только после фиксации browser smoke;
- `DuelEngine`: каждое изменение под тест текущего баланса;
- `PlayerProfile` и JDBC schema: сейчас схема создается вручную;
- auth и `TelegramInitDataValidator`;
- browser demo isolation;
- `DuelStateResponse` и DOM `id`, используемые frontend;
- ключ `polus_frontend_prototype_v48` в `localStorage`.

## Что требует отдельного рефакторинга

1. Сокращение повторных frontend-слоев.
2. Постоянное хранение активной вылазки и критичного прогресса.
3. Миграции БД через Flyway/Liquibase или эквивалент.
4. Защита debug/event endpoint.
5. Автоматический smoke двух игроков.
6. Отделение UI-подписей баланса от ручных чисел в HTML.
7. Bot health и эксплуатационные метрики.
8. CI для `mvn clean package` и smoke.

Эти задачи не требуют смены архитектуры на микросервисы.
