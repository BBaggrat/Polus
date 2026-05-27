# Gameplay

## Core loop

- Duel format: 1v1
- Starting HP: 100 each
- Round input:
  - `weapon`: `MG`, `PISTOL`, `RIFLE`
  - `shotDirection`: `LEFT`, `CENTER`, `RIGHT`
  - `dodgeDirection`: `LEFT`, `STAY`, `RIGHT`
- Resolution model: both players submit simultaneously, then the server resolves both attacks in the same round

`STAY` maps to the `CENTER` line for hit checking.

## Hit logic

If the attack line matches the target dodge line, the selected weapon resolves according to its own rules. If the line does not match:

- `MG`: uses graze logic
- `PISTOL`: 0 damage
- `RIFLE`: 0 damage

## Weapons

### MG

- 7 bullets
- 5 damage per bullet
- On correct line:
  - each bullet has 65% hit chance
- On wrong line:
  - 20% chance to deal 1 bullet
  - 10% chance to deal 2 bullets
  - otherwise 0

### PISTOLS

- 18 damage
- Shield effect:
  - incoming damage is always reduced by 30%
- On wrong line:
  - 0 damage

### RIFLE

- 1 bullet
- 30 damage
- On correct line:
  - deals damage on matched line
- On wrong line:
  - 0 damage

## Match result

- First player to reduce the opponent to 0 HP wins
- Simultaneous knockout is treated as a draw
- Draws do not change wins or losses in this MVP

