# Smoke test этапа 4

## Backend

```bash
mvn clean package
```

Проверить каталоги:

```bash
curl http://localhost:8080/api/events/catalog
curl http://localhost:8080/api/chains/catalog
```

## Browser demo

1. Открыть `http://localhost:8080/duel`.
2. Дождаться browser demo session.
3. На базе проверить вкладки: "Улучшения", "Снаряжение", "Карта", "Находки".
4. Начать скрытую экспедицию.
5. Сделать несколько шагов и выборов.
6. Проверить, что дневник показывает типы записей и meta chips.
7. Если появляется цепочка, проверить chip "Цепочка: ...".
8. Вернуться на базу и проверить, что добыча перенесена.

## API с session token

С токеном из браузерной сессии:

```bash
curl -H "X-Session-Token: <token>" "http://localhost:8080/api/discoveries?playerId=<playerId>"
curl -H "X-Session-Token: <token>" "http://localhost:8080/api/analytics/debug/player?playerId=<playerId>"
```

## Acceptance

- сборка проходит;
- контент-каталог показывает Stage 4 counts;
- цепочек 5;
- фронт не ломается на 320px+;
- находки открываются в базе;
- старый PvP flow стартует через `startPvpDuel`.

