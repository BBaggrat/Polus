# Старые MVP-формулировки

Аудит выполнен 14 июня 2026 года до правок этапа 0.

Цель реестра — не скрыть историю проекта, а заменить продуктовые формулировки там, где они больше не соответствуют переходу к релизной версии 1.0.

## Найденные продуктовые упоминания

| Файл и исходная строка | Пример исходного текста | Рекомендуемая релизная формулировка | Статус этапа 0 |
| --- | --- | --- | --- |
| `README.md:3` | `minimal production-oriented Telegram Mini App MVP` | `компактная Telegram survival-RPG, переходящая к релизной версии 1.0` | Заменено на этапе 0 |
| `pom.xml:18` | `Telegram Mini App PvP duel MVP` | `Telegram survival-RPG Mini App with PvP encounters` | Заменено на этапе 0 |
| `docs/ARCHITECTURE.md:48` | `keeps the MVP operationally simple` | `keeps the release product operationally manageable for a small team` | Заменено на этапе 0 |
| `docs/DEPLOY.md:3` | `This MVP is designed for one Linux VPS` | `The current release architecture is designed for one Linux VPS` | Заменено на этапе 0 |
| `docs/GAMEPLAY.md:57` | `in this MVP` | `in the current release rules` | Заменено на этапе 0 |

Номера строк относятся к состоянию до внесения документации этапа 0 и могут измениться после правок.

## Технические вхождения слова prototype

Они не называют весь продукт MVP, но требуют осознанного решения:

| Файл | Пример | Решение |
| --- | --- | --- |
| `src/main/resources/static/duel/app.js:2` | `polus_frontend_prototype_v48` | Пока не менять: это ключ `localStorage`, переименование без миграции сбросит клиентское состояние |
| `src/main/resources/static/duel/app.js:11506` | комментарий про `prototype` и старые дубли функций | Уточнить/удалить вместе со стабилизацией дублирующихся frontend-слоев в 0.8 |

## Правило дальнейшей документации

Не использовать:

- «мы делаем MVP»;
- «прототип продукта» для текущей версии;
- «минимальная проверка идеи» как описание цели.

Использовать:

- «переход к релизной версии 1.0»;
- «релизная версия»;
- «полноценный игровой продукт»;
- «live-продукт малой команды»;
- «текущая реализация» для технически ограниченных частей.

Исторические commit messages менять не нужно.
