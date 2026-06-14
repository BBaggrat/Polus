# Конфигурация PvP-баланса

## Источник истины

Backend-баланс находится в:

- значения: `src/main/resources/application.yml`;
- типизированная модель и валидация: `DuelBalanceProperties`;
- применение: `DuelEngine`, `DuelService`, `Duel`.

Префикс Spring properties:

```text
app.duel
```

Все значения можно переопределить переменными окружения.

## Действующая версия

```text
DUEL_BALANCE_VERSION=polus-pvp-20260614
```

Версия попадает в `app_startup` и `duel_started`. При изменении чисел нужно изменить идентификатор версии.

## Параметры

| Env | Property | Текущее значение |
| --- | --- | ---: |
| `DUEL_STARTING_HP` | `app.duel.starting-hp` | 100 |
| `DUEL_ROUND_TIMEOUT_SECONDS` | `app.duel.round-timeout-seconds` | 120 |
| `DUEL_MAX_CHAT_MESSAGES` | `app.duel.max-chat-messages` | 80 |
| `DUEL_VICTORY_COINS` | `app.duel.rewards.victory-coins` | 100 |
| `DUEL_DEFEAT_COINS` | `app.duel.rewards.defeat-coins` | 25 |
| `DUEL_RATING_DELTA` | `app.duel.rewards.rating-delta` | 10 |
| `DUEL_PISTOLS_DAMAGE` | `app.duel.pistols.damage` | 18 |
| `DUEL_PISTOLS_SHIELD_DAMAGE_REDUCTION` | `app.duel.pistols.shield-damage-reduction` | 0.30 |
| `DUEL_RIFLE_DAMAGE` | `app.duel.rifle.damage` | 30 |
| `DUEL_SHOTGUN_PELLET_COUNT` | `app.duel.shotgun.pellet-count` | 5 |
| `DUEL_SHOTGUN_PELLET_DAMAGE` | `app.duel.shotgun.pellet-damage` | 5 |
| `DUEL_SHOTGUN_EDGE_GRAZE_CHANCE` | `app.duel.shotgun.edge-graze-chance` | 0.35 |
| `DUEL_SHOTGUN_EDGE_DAMAGE` | `app.duel.shotgun.edge-damage` | 5 |

Вероятности задаются числом от `0.0` до `1.0`.

## Пример изменения для локального теста

PowerShell:

```powershell
$env:DUEL_RIFLE_DAMAGE="35"
$env:DUEL_BALANCE_VERSION="local-rifle-35"
mvn spring-boot:run
```

Bash:

```bash
DUEL_RIFLE_DAMAGE=35 \
DUEL_BALANCE_VERSION=local-rifle-35 \
mvn spring-boot:run
```

Не использовать тестовую версию баланса в production без отдельного решения.

## Валидация

Приложение не стартует при явно недопустимых значениях:

- HP и количество дробин меньше 1;
- отрицательный урон или награды;
- вероятность меньше 0 или больше 1;
- пустой `balance-version`;
- чрезмерно большой таймер/лимит.

## Расхождение со старой постановкой

В инструкции этапа 1 описаны `MG / PISTOL / RIFLE` со старой математикой. В текущем коде и UI используются:

- `PISTOLS`;
- `RIFLE`;
- `SHOTGUN`.

Чтобы не нарушать запрет на изменение баланса, этап 1 вынес в конфиг фактическую механику `main`. Возврат MG или изменение пистоля на 25 урона является отдельным балансным изменением и не входит в техническую стабилизацию.

## Что нельзя менять без тестов

- стартовые HP;
- shield reduction;
- сочетание pellet count × pellet damage;
- вероятность и урон зацепа;
- награды, влияющие на экономику;
- таймер раунда;
- rating delta.

Минимальная проверка после любого изменения:

```bash
mvn test
```

Для релизного изменения дополнительно нужны:

- новый `DUEL_BALANCE_VERSION`;
- ручная дуэль двух игроков;
- проверка UI-подписей оружия;
- просмотр `weapon_selected`, `damage_applied`, `duel_finished`;
- оценка Weapon Pick Rate и Weapon Win Rate после накопления данных.

## Известное ограничение

HTML-карточки оружия пока содержат отображаемые числа 18, 30 и 5–25. Они не участвуют в серверном расчете, но могут разойтись с backend-конфигом. В этапе 2 следует добавить read-only balance endpoint или серверную генерацию bootstrap-конфига для frontend.
