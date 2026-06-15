# Smoke-test этапа 2

## Подготовка

```bash
mvn clean package
mvn spring-boot:run
```

Для браузерной проверки `ALLOW_DEV_SESSIONS=true`. Открыть `http://localhost:8080/duel`.

## Backend

Создать demo-сессию:

```bash
curl -X POST http://localhost:8080/api/player/browser-demo-session \
  -H "Content-Type: application/json" \
  -d '{"fallbackUser":{"firstName":"Комиссия","guestId":"stage-2-smoke"}}'
```

Сохранить `sessionToken` в `TOKEN`, а `player.id` в `PLAYER_ID`.

- [ ] `GET /api/health` возвращает `status: ok`.
- [ ] `GET /api/player/state` возвращает HP 100 и 3 припаса.
- [ ] `POST /api/exploration/start` с `HIDDEN` создает `ACTIVE`.
- [ ] `GET /api/exploration/current` возвращает тот же `explorationId`.
- [ ] `POST /api/exploration/step` добавляет `MOVEMENT`.
- [ ] При encounter `POST /api/exploration/{id}/choice` добавляет результат.
- [ ] `POST /api/exploration/{id}/visibility` переключает в `OPEN_PVP`.
- [ ] `POST /api/exploration/{id}/return` возвращает `RETURNED`.
- [ ] `GET /api/journal` содержит записи выхода.

Пример заголовка:

```bash
-H "X-Session-Token: $TOKEN"
```

## Frontend

- [ ] `/duel` открывает «Дневник выжившего».
- [ ] Видны HP, лом, припасы и смола.
- [ ] Можно начать скрытное исследование.
- [ ] «Идти дальше» добавляет записи без перезагрузки.
- [ ] Encounter показывает 2-3 варианта.
- [ ] После выбора появляется итоговая запись.
- [ ] В `HIDDEN` не появляется принудительный PvP.
- [ ] «Перестать скрываться» включает `OPEN_PVP`.
- [ ] Открытый encounter может предложить стычку.
- [ ] PvP-выбор открывает существующий flow поиска соперника.
- [ ] Возвращение переносит добычу в постоянные ресурсы.
- [ ] На 320, 360, 390 и 430 px нет горизонтального скролла.

## Bot

- [ ] `/start` возвращает WebApp-кнопку.
- [ ] URL строится из `BASE_URL` и ведет на `/duel`.
- [ ] Кнопка открывает актуальный дневник.

## Logs

- [ ] есть `exploration_started`;
- [ ] есть `journal_entry_added`;
- [ ] есть `encounter_generated`;
- [ ] есть `visibility_mode_changed`;
- [ ] есть `exploration_returned`;
- [ ] метаданные содержат player/exploration/visibility.
