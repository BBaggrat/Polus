# Цепочки событий

Цепочки — это не отдельный режим и не квестовая система. Это последовательность encounter-событий внутри текущего flow экспедиции.

## Модель

`EventChain`:

- `chainId`
- `title`
- `description`
- `mode`
- `requiredTags`
- `steps`
- `completionReward`
- `failurePenalty`
- `isRepeatable`

`EventChainStep`:

- `stepId`
- `eventId`
- `order`
- `requiredPreviousChoice`
- `nextStepOnSuccess`
- `nextStepOnFailure`

`ExplorationState` хранит:

- `activeChainId`
- `activeChainStep`
- `completedChainIds`
- `failedChainIds`

## Цепочки этапа 4

- "Знак под водой"
- "След вдоль настила"
- "Доски дышат"
- "Старая линия кордона"
- "Голос из дневника"

Каталог:

```http
GET /api/chains/catalog
```

## Поведение

Если цепочка активна, следующий encounter цепочки получает приоритет над обычным случайным encounter. Завершение дает небольшой reward, провал может снять HP. Возврат/провал экспедиции очищает активную цепочку.

