# Находки

Находки — легкий слой персонализации и памяти базы. Это не инвентарь и не экономическая система.

## Модель

`Discovery`:

- `id`
- `playerId`
- `type`
- `title`
- `text`
- `sourceEventId`
- `discoveredAt`
- `tags`

`DiscoveryType`:

- `NOTE`
- `OBJECT`
- `MAP_FRAGMENT`
- `MONSTER_TRACE`
- `ANOMALY_MARK`

## API

```http
GET /api/discoveries?playerId=<id>
```

Требует `X-Session-Token`. Если `playerId` передан, он должен совпадать с текущей сессией.

## UI

Во вкладках базы добавлен раздел "Находки". Он показывает последние записи, тип, короткий текст и время. Пустое состояние объясняет, что находки появляются из объектов, следов существ, аномалий и фрагментов.

