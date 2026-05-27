package com.example.sandalpunk.duel;

import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.stereotype.Component;

@Component
public class DuelEngine {
    private static final double SHIELD_DAMAGE_REDUCTION = 0.30d;
    private static final double SHOTGUN_EDGE_GRAZE_CHANCE = 0.35d;
    private static final int SHOTGUN_EDGE_DAMAGE = 5;
    private static final int PISTOL_DAMAGE = 18;
    private static final int RIFLE_DAMAGE = 30;
    private static final int SHOTGUN_PELLET_DAMAGE = 5;
    private static final int SHOTGUN_PELLET_COUNT = 5;

    private final Clock clock;

    public DuelEngine(Clock clock) {
        this.clock = clock;
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
                lines.add("Итог раунда: оба дуэлянта выбывают одновременно. Ничья.");
            } else if (playerTwoHpAfter <= 0) {
                winnerPlayerId = duel.getPlayerOneId();
                lines.add("Итог раунда: " + duel.getPlayerOneName() + " побеждает.");
            } else {
                winnerPlayerId = duel.getPlayerTwoId();
                lines.add("Итог раунда: " + duel.getPlayerTwoName() + " побеждает.");
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
        return new AttackResolution(applyShieldDamageReduction(PISTOL_DAMAGE, defenderWeapon), Outcome.HIT, 0, 0);
    }

    private AttackResolution resolveRifle(boolean lineMatched, WeaponType defenderWeapon) {
        if (!lineMatched) {
            return new AttackResolution(0, Outcome.MISS_LINE, 0, 0);
        }
        return new AttackResolution(applyShieldDamageReduction(RIFLE_DAMAGE, defenderWeapon), Outcome.HIT, 0, 0);
    }

    private AttackResolution resolveShotgun(boolean lineMatched, WeaponType defenderWeapon) {
        if (!lineMatched) {
            if (nextRandom() < SHOTGUN_EDGE_GRAZE_CHANCE) {
                return new AttackResolution(SHOTGUN_EDGE_DAMAGE, Outcome.GRAZE, 0, 0);
            }
            return new AttackResolution(0, Outcome.GRAZE_MISS, 0, 0);
        }

        return new AttackResolution(
                applyShieldDamageReduction(SHOTGUN_PELLET_COUNT * SHOTGUN_PELLET_DAMAGE, defenderWeapon),
                Outcome.SHOTGUN_HIT,
                0,
                SHOTGUN_PELLET_COUNT
        );
    }

    private int applyShieldDamageReduction(int damage, WeaponType defenderWeapon) {
        if (defenderWeapon != WeaponType.PISTOLS || damage <= 0) {
            return Math.max(0, damage);
        }
        return Math.max(0, (int) Math.round(damage * (1d - SHIELD_DAMAGE_REDUCTION)));
    }

    private String buildIntentLine(String playerName, DuelRoundAction action) {
        String prefix = action.source() == DuelActionSource.TIMEOUT_DEFAULT
                ? playerName + " не успевает выбрать ход и по таймеру стреляет "
                : playerName + " стреляет ";
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
            case HIT, IGNORE_BLOCK_HIT, SHOTGUN_HIT, GRAZE -> "соперник попал";
            case BLOCKED, SHOTGUN_BLOCKED -> "соперник не пробил щит";
            case MISS_LINE, GRAZE_MISS -> "соперник промахнулся";
        };
    }

    private String shotDirectionPhrase(ShotDirection shotDirection) {
        return switch (shotDirection) {
            case LEFT -> "влево";
            case CENTER -> "по центру";
            case RIGHT -> "вправо";
        };
    }

    private String dodgeDirectionPhrase(DodgeDirection dodgeDirection) {
        return switch (dodgeDirection) {
            case LEFT -> "смещается влево";
            case STAY -> "остается по центру";
            case RIGHT -> "смещается вправо";
        };
    }

    private String weaponInstrument(WeaponType weaponType) {
        return switch (weaponType) {
            case PISTOLS -> "из пистоля и щита";
            case RIFLE -> "из винтовки";
            case SHOTGUN -> "из дробовика";
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
                case HIT -> "попадание на " + damage + " урона";
                case IGNORE_BLOCK_HIT -> "попадание на " + damage + " урона";
                case BLOCKED -> "выстрел заблокирован щитом";
                case MISS_LINE -> "промах мимо линии";
                case GRAZE -> "зацеп на " + damage + " урона";
                case GRAZE_MISS -> "дробь ушла мимо цели";
                case SHOTGUN_HIT -> blockedProjectiles > 0
                        ? "попадание на " + damage + " урона, щит блокирует " + blockedProjectiles + pelletWord(blockedProjectiles)
                        : "попадание на " + damage + " урона";
                case SHOTGUN_BLOCKED -> "все дробины заблокированы щитом";
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
