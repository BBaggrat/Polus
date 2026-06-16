# Release 1.0 regression test

| Раздел | Check | Expected result | Status | Notes |
| --- | --- | --- | --- | --- |
| Telegram Bot | `/start` | Кнопка "Открыть топь" открывает WebApp | TODO | Перед production |
| Mini App UI | `/duel` | Первый экран читаемый, onboarding виден | TODO | 320/360/390/430 |
| Exploration | Start HIDDEN | Создается active exploration | TODO | Без 500 |
| HIDDEN | Step + encounter | Нет принудительного PvP | TODO | |
| OPEN_PVP | Change visibility | Появляются PvP trace/encounter события | TODO | |
| PvP/RPS | Submit actions | Раунд резолвится, бой завершается | TODO | |
| Base | Open state | Ресурсы и апгрейды видны | TODO | |
| Upgrades | Buy storage | Ресурсы списаны, уровень вырос | TODO | |
| Equipment | Equip item | Состояние обновлено | TODO | |
| Map | Fragment/route | Маршрут выбирается после unlock | TODO | |
| Discoveries | Open tab | Empty/item state работает | TODO | |
| Content chains | Chain started | Chain chip и journal entry видны | TODO | |
| Monsters | Monster encounter | Choice не ломает state | TODO | |
| Failure states | HP <= 0 | Exploration FAILED, ресурсы частично сохранены | TODO | |
| Analytics logs | Recent events | Ключевые события пишутся | TODO | |
| Deploy | Healthcheck | `/api/health` ok | TODO | |
| Mobile layout | 320px+ | Нет горизонтального скролла | TODO | |

