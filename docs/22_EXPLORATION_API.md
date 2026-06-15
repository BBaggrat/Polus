# Exploration API

## Авторизация

Все запросы требуют:

```http
X-Session-Token: <token>
```

`playerId` в query/body опционален для клиента, но если передан, обязан совпадать с игроком сессии.

## Player state

`GET /api/player/state`

Создает дефолтное состояние при первом обращении и возвращает HP, ресурсы, активный выход и режим видимости.

## Начать исследование

`POST /api/exploration/start`

```json
{
  "playerId": "player-id",
  "visibilityMode": "HIDDEN"
}
```

Режимы: `HIDDEN`, `OPEN_PVP`. Повторный старт при активном выходе возвращает `409`.

## Текущее исследование

`GET /api/exploration/current?playerId=player-id`

Возвращает `200` и `ExplorationState` либо `204`, если активного выхода нет.

## Следующий шаг

`POST /api/exploration/step`

```json
{
  "playerId": "player-id",
  "explorationId": "exploration-id"
}
```

Добавляет движение и может создать `currentEncounter`. Новый шаг недоступен, пока encounter не разрешен.

## Выбрать действие

`POST /api/exploration/{explorationId}/choice`

```json
{
  "playerId": "player-id",
  "choiceId": "inspect"
}
```

Применяет награду/урон, добавляет `CHOICE_RESULT` и очищает текущий encounter. При PvP-выборе ответ содержит:

```json
{
  "startPvpDuel": true
}
```

Остальные поля полного `ExplorationState` также присутствуют.

## Изменить видимость

`POST /api/exploration/{explorationId}/visibility`

```json
{
  "playerId": "player-id",
  "visibilityMode": "OPEN_PVP"
}
```

В этапе 2 разрешен только переход `HIDDEN -> OPEN_PVP`. Попытка вернуться в `HIDDEN` до базы дает `409`.

## Вернуться

`POST /api/exploration/{explorationId}/return`

```json
{
  "playerId": "player-id"
}
```

Переводит состояние в `RETURNED`, переносит временную добычу игроку и очищает активный выход.

## История

`GET /api/journal?playerId=player-id&limit=50`

Возвращает последние записи в обратном хронологическом порядке. `limit` ограничивается диапазоном 1-200.

## Основные состояния

- `ACTIVE`: выход продолжается;
- `RETURNED`: игрок вернулся с добычей;
- `FAILED`: HP достиг нуля, временная добыча потеряна.

## Ошибки

- `400`: неполное тело запроса или недоступный `choiceId`;
- `401`: нет сессии, чужой `playerId` или чужое исследование;
- `404`: исследование не найдено;
- `409`: конфликт текущего состояния, незавершенный encounter или запрещенная смена режима.
