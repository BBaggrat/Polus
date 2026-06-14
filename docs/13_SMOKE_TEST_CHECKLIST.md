# Smoke checklist

Использовать после локальной сборки и каждого production-деплоя.

## 1. Сборка

- [ ] `java -version` показывает Java 17.
- [ ] `mvn -version` выполняется.
- [ ] `mvn clean package` завершился с `BUILD SUCCESS`.
- [ ] Создан `target/sandalpunk-0.0.1-SNAPSHOT.jar`.

## 2. Backend

Запуск:

```bash
mvn spring-boot:run
```

Проверки:

- [ ] приложение стартовало без stack trace;
- [ ] `GET http://localhost:8080/api/health` возвращает HTTP 200;
- [ ] `status` равен `ok`;
- [ ] `service` равен `polus-backend`;
- [ ] `version` равен `0.8`;
- [ ] timestamp заполнен;
- [ ] в логе есть `game_event=app_startup`;
- [ ] в логах нет токена Telegram.

PowerShell:

```powershell
Invoke-RestMethod http://localhost:8080/api/health
```

Bash:

```bash
curl -fsS http://localhost:8080/api/health
```

## 3. Mini App в браузере

- [ ] открыть `http://localhost:8080/duel`;
- [ ] страница отвечает HTTP 200;
- [ ] загружаются `app.css`, `journal-events.js`, `app.js`;
- [ ] создается browser demo session;
- [ ] появляется регистрация нового игрока;
- [ ] после регистрации виден главный экран;
- [ ] навигация открывает Хаб, Инвентарь, Друзья, Магазин;
- [ ] в console нет uncaught JavaScript errors;
- [ ] нет горизонтального скролла на 360, 390 и 430 px.

## 4. Telegram Bot

Перед проверкой:

```text
BOT_TOKEN=<test token>
BOT_USERNAME=<bot username>
BASE_URL=https://<domain>
```

- [ ] написать боту `/start`;
- [ ] бот отвечает без задержки;
- [ ] есть WebApp-кнопка;
- [ ] URL кнопки начинается с `BASE_URL`;
- [ ] URL заканчивается `/duel?build=...`;
- [ ] Mini App открывается внутри Telegram;
- [ ] в журнале есть `game_event=bot_start`;
- [ ] после открытия есть `game_event=app_open` с `channel=telegram`.

## 5. Сетевая дуэль

Нужны два разных браузерных demo-профиля или два Telegram-пользователя.

- [ ] оба игрока зарегистрированы;
- [ ] первый нажал «Найти матч» и получил состояние очереди;
- [ ] второй вошел в очередь;
- [ ] обоим выдан один `duelId`;
- [ ] в логе есть `game_event=duel_started`;
- [ ] выбрать оружие;
- [ ] выбрать направление атаки;
- [ ] выбрать направление уворота;
- [ ] отправить ход обоими игроками;
- [ ] появились `weapon_selected`, `shot_direction_selected`, `dodge_direction_selected`;
- [ ] раунд разрешился один раз;
- [ ] HP и боевой лог совпадают у обоих игроков;
- [ ] при уроне есть `damage_applied`;
- [ ] повторить ходы до завершения;
- [ ] результат появился у обоих;
- [ ] есть `player_defeated` и `duel_finished`;
- [ ] победителю начислены 100 монет и +10 рейтинга;
- [ ] проигравшему начислены 25 монет и −10 рейтинга без ухода рейтинга ниже 0;
- [ ] после завершения можно снова войти в очередь.

## 6. Чат

- [ ] сообщение без ссылки отправляется;
- [ ] оно появляется у обоих игроков;
- [ ] ссылка `https://example.com` отклоняется;
- [ ] пустое сообщение не принимается;
- [ ] завершенный бой не принимает новые сообщения.

## 7. Рестарт

- [ ] перезапустить приложение;
- [ ] профиль Telegram сохраняется;
- [ ] монеты, рейтинг и друзья сохраняются;
- [ ] старый session token больше не работает;
- [ ] активная дуэль из памяти исчезает;
- [ ] при следующем matchmaking status stale-ссылка очищается;
- [ ] browser demo profile после рестарта исчезает — это ожидаемое поведение этапа 1.

## 8. Production server

```bash
sudo systemctl status sandalpunk --no-pager
sudo journalctl -u sandalpunk -n 200 --no-pager
sudo nginx -t
curl -fsS http://127.0.0.1:8080/api/health
curl -fsS https://<domain>/api/health
curl -I https://<domain>/duel
```

- [ ] systemd service активен;
- [ ] Nginx config валиден;
- [ ] HTTP перенаправляется на HTTPS;
- [ ] сертификат действителен;
- [ ] внешний health возвращает 200;
- [ ] `/duel` возвращает 200;
- [ ] после деплоя нет новых 500;
- [ ] свободное место и размер journal достаточны.

## 9. Откат

- [ ] существует `/opt/sandalpunk/sandalpunk.jar.previous`;
- [ ] backup каталога `/opt/sandalpunk/data` сделан отдельно;
- [ ] команда `deploy/scripts/rollback.sh` доступна;
- [ ] после отката health возвращает 200;
- [ ] Mini App загружается.

## Минимальный отчет

Зафиксировать:

- commit;
- среду и URL;
- время проверки;
- прошедшие/не прошедшие пункты;
- duel ID тестовой сессии;
- найденные ошибки;
- решение: deploy разрешен или запрещен.
