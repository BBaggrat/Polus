package com.example.sandalpunk.duel;

import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.stereotype.Component;

@Component
public class DuelEngine {
    private static final double SHIELD_BLOCK_CHANCE = 0.30d;
    private static final double SHOTGUN_EDGE_GRAZE_CHANCE = 0.35d;
    private static final int SHOTGUN_EDGE_DAMAGE = 5;

    private final Clock clock;

    public DuelEngine(Clock clock) {
        this.clock = clock;
    }

    public RoundResolution resolveRound(Duel duel, DuelRoundAction playerOneAction, DuelRoundAction playerTwoAction) {
        AttackResolution playerOneAttack = resolveAttack(
                duel.getPlayerOneName(),
                playerOneAction,
                duel.getPlayerTwoName(),
                playerTwoAction
        );
        AttackResolution playerTwoAttack = resolveAttack(
                duel.getPlayerTwoName(),
                playerTwoAction,
                duel.getPlayerOneName(),
                playerOneAction
        );

        int playerOneHpAfter = Math.max(0, duel.getPlayerOneHp() - playerTwoAttack.damage());
        int playerTwoHpAfter = Math.max(0, duel.getPlayerTwoHp() - playerOneAttack.damage());

        List<String> lines = new ArrayList<>();
        lines.add(buildIntentLine(duel.getPlayerOneName(), playerOneAction));
        lines.add(buildIntentLine(duel.getPlayerTwoName(), playerTwoAction));
        lines.add(playerOneAttack.summary());
        lines.add(playerTwoAttack.summary());

        DuelStatus status = DuelStatus.ACTIVE;
        String winnerPlayerId = null;
        if (playerOneHpAfter <= 0 || playerTwoHpAfter <= 0) {
            status = DuelStatus.FINISHED;
            if (playerOneHpAfter <= 0 && playerTwoHpAfter <= 0) {
                lines.add("Итог: оба дуэлянта падают одновременно. Ничья.");
            } else if (playerTwoHpAfter <= 0) {
                winnerPlayerId = duel.getPlayerOneId();
                lines.add("Итог: " + duel.getPlayerOneName() + " побеждает.");
            } else {
                winnerPlayerId = duel.getPlayerTwoId();
                lines.add("Итог: " + duel.getPlayerTwoName() + " побеждает.");
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

    private AttackResolution resolveAttack(
            String attackerName,
            DuelRoundAction attackerAction,
            String defenderName,
            DuelRoundAction defenderAction
    ) {
        boolean lineMatched = attackerAction.shotDirection() == defenderAction.dodgeDirection().toShotLine();
        return switch (attackerAction.weapon()) {
            case PISTOLS -> resolvePistolShield(attackerName, defenderName, lineMatched, defenderAction.weapon());
            case RIFLE -> resolveRifle(attackerName, lineMatched);
            case SHOTGUN -> resolveShotgun(attackerName, defenderName, lineMatched, defenderAction.weapon());
        };
    }

    private AttackResolution resolvePistolShield(
            String attackerName,
            String defenderName,
            boolean lineMatched,
            WeaponType defenderWeapon
    ) {
        if (!lineMatched) {
            return new AttackResolution(0, attackerName + " промахивается мимо линии.");
        }
        if (isBlocked(defenderWeapon)) {
            return new AttackResolution(0, defenderName + " закрывается щитом и блокирует выстрел.");
        }
        return new AttackResolution(18, attackerName + " попадает из пистоля и наносит 18 урона.");
    }

    private AttackResolution resolveRifle(String attackerName, boolean lineMatched) {
        if (!lineMatched) {
            return new AttackResolution(0, attackerName + " промахивается мимо линии.");
        }
        return new AttackResolution(30, attackerName + " попадает из винтовки и игнорирует блокирование.");
    }

    private AttackResolution resolveShotgun(
            String attackerName,
            String defenderName,
            boolean lineMatched,
            WeaponType defenderWeapon
    ) {
        if (!lineMatched) {
            if (ThreadLocalRandom.current().nextDouble() < SHOTGUN_EDGE_GRAZE_CHANCE) {
                return new AttackResolution(SHOTGUN_EDGE_DAMAGE, attackerName + " цепляет краем и наносит 5 урона.");
            }
            return new AttackResolution(0, attackerName + " не задевает цель дробью.");
        }

        int pelletsHit = 0;
        int pelletsBlocked = 0;
        for (int index = 0; index < 5; index++) {
            if (isBlocked(defenderWeapon)) {
                pelletsBlocked++;
            } else {
                pelletsHit++;
            }
        }
        if (pelletsHit == 0) {
            return new AttackResolution(0, defenderName + " полностью перекрывает дробь щитом.");
        }

        int damage = pelletsHit * 5;
        StringBuilder summary = new StringBuilder(attackerName)
                .append(" попадает ")
                .append(pelletsHit)
                .append(" дробинами и наносит ")
                .append(damage)
                .append(" урона.");
        if (pelletsBlocked > 0) {
            summary.append(" Щит снимает ").append(pelletsBlocked).append(" дробин.");
        }
        return new AttackResolution(damage, summary.toString());
    }

    private boolean isBlocked(WeaponType defenderWeapon) {
        if (defenderWeapon != WeaponType.PISTOLS) {
            return false;
        }
        return ThreadLocalRandom.current().nextDouble() < SHIELD_BLOCK_CHANCE;
    }

    private String buildIntentLine(String playerName, DuelRoundAction action) {
        return switch (action.source()) {
            case MANUAL -> playerName + " стреляет " + shotDirectionPhrase(action.shotDirection())
                    + " " + weaponInstrument(action.weapon()) + " и " + dodgeDirectionPhrase(action.dodgeDirection()) + ".";
            case AUTO_BATTLE -> playerName + " стреляет " + shotDirectionPhrase(action.shotDirection())
                    + " " + weaponInstrument(action.weapon()) + " и " + dodgeDirectionPhrase(action.dodgeDirection()) + ".";
            case TIMEOUT_DEFAULT -> playerName + " не успевает выбрать ход и по таймеру стреляет "
                    + shotDirectionPhrase(action.shotDirection()) + " " + weaponInstrument(action.weapon())
                    + " и " + dodgeDirectionPhrase(action.dodgeDirection()) + ".";
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

    public record AttackResolution(int damage, String summary) {
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
