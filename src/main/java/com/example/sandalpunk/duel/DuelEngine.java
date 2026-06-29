package com.example.sandalpunk.duel;

import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import com.example.sandalpunk.config.DuelBalanceProperties;
import org.springframework.stereotype.Component;

@Component
public class DuelEngine {
    private final Clock clock;
    private final DuelBalanceProperties balance;

    public DuelEngine(Clock clock, DuelBalanceProperties balance) {
        this.clock = clock;
        this.balance = balance;
    }

    public RoundResolution resolveRound(Duel duel, DuelRoundAction playerOneAction, DuelRoundAction playerTwoAction) {
        AttackResolution playerOneAttack = resolveAttack(playerOneAction, playerTwoAction);
        AttackResolution playerTwoAttack = resolveAttack(playerTwoAction, playerOneAction);

        int playerOneHpAfter = Math.max(0, duel.getPlayerOneHp() - playerTwoAttack.damage());
        int playerTwoHpAfter = Math.max(0, duel.getPlayerTwoHp() - playerOneAttack.damage());

        List<String> lines = new ArrayList<>();
        lines.add(buildIntentLine(duel.getPlayerOneName(), playerOneAction));
        lines.add(buildResultLine(playerOneAttack, playerTwoAttack));
        lines.add(buildIntentLine(duel.getPlayerTwoName(), playerTwoAction));
        lines.add(buildResultLine(playerTwoAttack, playerOneAttack));

        DuelStatus status = DuelStatus.ACTIVE;
        String winnerPlayerId = null;
        if (playerOneHpAfter <= 0 || playerTwoHpAfter <= 0) {
            status = DuelStatus.FINISHED;
            if (playerOneHpAfter <= 0 && playerTwoHpAfter <= 0) {
                lines.add("Итог раунда: оба корпуса теряют ход одновременно. Ничья на воде.");
            } else if (playerTwoHpAfter <= 0) {
                winnerPlayerId = duel.getPlayerOneId();
                lines.add("Итог раунда: лодка " + duel.getPlayerOneName() + " удерживает курс.");
            } else {
                winnerPlayerId = duel.getPlayerTwoId();
                lines.add("Итог раунда: лодка " + duel.getPlayerTwoName() + " удерживает курс.");
            }
        }

        return new RoundResolution(
                playerOneHpAfter,
                playerTwoHpAfter,
                status,
                winnerPlayerId,
                new RoundLog(duel.getRoundNumber(), lines, playerOneHpAfter, playerTwoHpAfter, clock.instant())
        );
    }

    protected double nextRandom() {
        return ThreadLocalRandom.current().nextDouble();
    }

    private AttackResolution resolveAttack(DuelRoundAction attackerAction, DuelRoundAction defenderAction) {
        boolean lineMatched = attackerAction.shotDirection() == defenderAction.dodgeDirection().toShotLine();
        return switch (attackerAction.weapon()) {
            case PISTOLS -> resolvePistolShield(lineMatched, defenderAction.weapon());
            case RIFLE -> resolveRifle(lineMatched, defenderAction.weapon());
            case SHOTGUN -> resolveShotgun(lineMatched, defenderAction.weapon());
        };
    }

    private AttackResolution resolvePistolShield(boolean lineMatched, WeaponType defenderWeapon) {
        if (!lineMatched) {
            return new AttackResolution(0, Outcome.MISS_LINE, 0, 0);
        }
        return new AttackResolution(
                applyShieldDamageReduction(balance.getPistols().getDamage(), defenderWeapon),
                Outcome.HIT,
                0,
                0
        );
    }

    private AttackResolution resolveRifle(boolean lineMatched, WeaponType defenderWeapon) {
        if (!lineMatched) {
            return new AttackResolution(0, Outcome.MISS_LINE, 0, 0);
        }
        return new AttackResolution(
                applyShieldDamageReduction(balance.getRifle().getDamage(), defenderWeapon),
                Outcome.HIT,
                0,
                0
        );
    }

    private AttackResolution resolveShotgun(boolean lineMatched, WeaponType defenderWeapon) {
        if (!lineMatched) {
            if (nextRandom() < balance.getShotgun().getEdgeGrazeChance()) {
                return new AttackResolution(balance.getShotgun().getEdgeDamage(), Outcome.GRAZE, 0, 0);
            }
            return new AttackResolution(0, Outcome.GRAZE_MISS, 0, 0);
        }

        return new AttackResolution(
                applyShieldDamageReduction(
                        balance.getShotgun().getPelletCount() * balance.getShotgun().getPelletDamage(),
                        defenderWeapon
                ),
                Outcome.SHOTGUN_HIT,
                0,
                balance.getShotgun().getPelletCount()
        );
    }

    private int applyShieldDamageReduction(int damage, WeaponType defenderWeapon) {
        if (defenderWeapon != WeaponType.PISTOLS || damage <= 0) {
            return Math.max(0, damage);
        }
        return Math.max(0, (int) Math.round(
                damage * (1d - balance.getPistols().getShieldDamageReduction())
        ));
    }

    private String buildIntentLine(String playerName, DuelRoundAction action) {
        String prefix = action.source() == DuelActionSource.TIMEOUT_DEFAULT
                ? playerName + " не успевает выбрать маневр и по таймеру бьет "
                : playerName + " бьет ";
        return prefix
                + shotDirectionPhrase(action.shotDirection())
                + " "
                + weaponInstrument(action.weapon())
                + " и "
                + dodgeDirectionPhrase(action.dodgeDirection())
                + ".";
    }

    private String buildResultLine(AttackResolution ownAttack, AttackResolution opponentAttack) {
        return "Итог: " + ownAttack.summary() + ", " + opponentOutcomeFragment(opponentAttack) + ".";
    }

    private String opponentOutcomeFragment(AttackResolution opponentAttack) {
        return switch (opponentAttack.outcome()) {
            case HIT, IGNORE_BLOCK_HIT, SHOTGUN_HIT, GRAZE -> "чужая лодка попала по корпусу";
            case BLOCKED, SHOTGUN_BLOCKED -> "чужая лодка не пробила щит";
            case MISS_LINE, GRAZE_MISS -> "чужая лодка дала воду мимо борта";
        };
    }

    private String shotDirectionPhrase(ShotDirection shotDirection) {
        return switch (shotDirection) {
            case LEFT -> "по левому борту";
            case CENTER -> "в нос";
            case RIGHT -> "по правому борту";
        };
    }

    private String dodgeDirectionPhrase(DodgeDirection dodgeDirection) {
        return switch (dodgeDirection) {
            case LEFT -> "уходит левым бортом";
            case STAY -> "держит курс";
            case RIGHT -> "уходит правым бортом";
        };
    }

    private String weaponInstrument(WeaponType weaponType) {
        return switch (weaponType) {
            case PISTOLS -> "коротким точечным выстрелом";
            case RIFLE -> "дальним выстрелом с палубы";
            case SHOTGUN -> "палубным дробовиком";
        };
    }

    private static String pelletWord(int count) {
        int remainderTen = count % 10;
        int remainderHundred = count % 100;
        if (remainderTen == 1 && remainderHundred != 11) {
            return " дробину";
        }
        if (remainderTen >= 2 && remainderTen <= 4 && (remainderHundred < 12 || remainderHundred > 14)) {
            return " дробины";
        }
        return " дробин";
    }

    private enum Outcome {
        HIT,
        IGNORE_BLOCK_HIT,
        BLOCKED,
        MISS_LINE,
        GRAZE,
        GRAZE_MISS,
        SHOTGUN_HIT,
        SHOTGUN_BLOCKED
    }

    public record AttackResolution(int damage, Outcome outcome, int blockedProjectiles, int hitProjectiles) {
        public String summary() {
            return switch (outcome) {
                case HIT -> "попадание по корпусу на " + damage + " урона";
                case IGNORE_BLOCK_HIT -> "попадание по корпусу на " + damage + " урона";
                case BLOCKED -> "выстрел принят щитом борта";
                case MISS_LINE -> "вода поднялась рядом с бортом, корпус цел";
                case GRAZE -> "зацеп по борту на " + damage + " урона";
                case GRAZE_MISS -> "дробь ушла в воду мимо корпуса";
                case SHOTGUN_HIT -> blockedProjectiles > 0
                        ? "попадание по корпусу на " + damage + " урона, щит борта принимает " + blockedProjectiles + pelletWord(blockedProjectiles)
                        : "попадание по корпусу на " + damage + " урона";
                case SHOTGUN_BLOCKED -> "вся дробь принята щитом борта";
            };
        }
    }

    public record RoundResolution(
            int playerOneHpAfter,
            int playerTwoHpAfter,
            DuelStatus duelStatus,
            String winnerPlayerId,
            RoundLog roundLog
    ) {
    }
}
