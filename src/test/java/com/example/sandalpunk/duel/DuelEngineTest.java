package com.example.sandalpunk.duel;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import com.example.sandalpunk.config.DuelBalanceProperties;
import org.junit.jupiter.api.Test;

class DuelEngineTest {

    private static final Instant NOW = Instant.parse("2026-04-14T12:00:00Z");

    @Test
    void rifleHitsWhenShotGoesCenterAndDefenderStays() {
        DuelBalanceProperties balance = defaultBalance();
        DuelEngine engine = new DuelEngine(Clock.fixed(NOW, ZoneOffset.UTC), balance);
        Duel duel = duel("duel-1", balance);

        DuelRoundAction playerOneAction = new DuelRoundAction(
                "p1",
                1,
                WeaponType.RIFLE,
                ShotDirection.CENTER,
                DodgeDirection.STAY,
                DuelActionSource.MANUAL,
                NOW
        );
        DuelRoundAction playerTwoAction = new DuelRoundAction(
                "p2",
                1,
                WeaponType.RIFLE,
                ShotDirection.LEFT,
                DodgeDirection.STAY,
                DuelActionSource.MANUAL,
                NOW
        );

        DuelEngine.RoundResolution result = engine.resolveRound(duel, playerOneAction, playerTwoAction);

        assertEquals(100, result.playerOneHpAfter());
        assertEquals(70, result.playerTwoHpAfter());
    }

    @Test
    void pistolHitsWhenLinesMatchWithoutShieldBlock() {
        DuelBalanceProperties balance = defaultBalance();
        DuelEngine engine = new DuelEngine(Clock.fixed(NOW, ZoneOffset.UTC), balance);
        Duel duel = duel("duel-2", balance);

        DuelRoundAction playerOneAction = new DuelRoundAction(
                "p1",
                1,
                WeaponType.PISTOLS,
                ShotDirection.LEFT,
                DodgeDirection.STAY,
                DuelActionSource.MANUAL,
                NOW
        );
        DuelRoundAction playerTwoAction = new DuelRoundAction(
                "p2",
                1,
                WeaponType.RIFLE,
                ShotDirection.RIGHT,
                DodgeDirection.LEFT,
                DuelActionSource.MANUAL,
                NOW
        );

        DuelEngine.RoundResolution result = engine.resolveRound(duel, playerOneAction, playerTwoAction);

        assertEquals(100, result.playerOneHpAfter());
        assertEquals(82, result.playerTwoHpAfter());
    }

    @Test
    void pistolShieldAlwaysReducesIncomingDamageByThirtyPercent() {
        DuelBalanceProperties balance = defaultBalance();
        DuelEngine engine = new DuelEngine(Clock.fixed(NOW, ZoneOffset.UTC), balance);
        Duel duel = duel("duel-3", balance);

        DuelRoundAction playerOneAction = new DuelRoundAction(
                "p1",
                1,
                WeaponType.RIFLE,
                ShotDirection.CENTER,
                DodgeDirection.STAY,
                DuelActionSource.MANUAL,
                NOW
        );
        DuelRoundAction playerTwoAction = new DuelRoundAction(
                "p2",
                1,
                WeaponType.PISTOLS,
                ShotDirection.LEFT,
                DodgeDirection.STAY,
                DuelActionSource.MANUAL,
                NOW
        );

        DuelEngine.RoundResolution result = engine.resolveRound(duel, playerOneAction, playerTwoAction);

        assertEquals(100, result.playerOneHpAfter());
        assertEquals(79, result.playerTwoHpAfter());
    }

    @Test
    void shotgunCanGrazeOnMiss() {
        DuelBalanceProperties balance = defaultBalance();
        DuelEngine engine = new DuelEngine(Clock.fixed(NOW, ZoneOffset.UTC), balance) {
            @Override
            protected double nextRandom() {
                return 0.10d;
            }
        };
        Duel duel = duel("duel-4", balance);

        DuelRoundAction playerOneAction = new DuelRoundAction(
                "p1",
                1,
                WeaponType.SHOTGUN,
                ShotDirection.LEFT,
                DodgeDirection.STAY,
                DuelActionSource.MANUAL,
                NOW
        );
        DuelRoundAction playerTwoAction = new DuelRoundAction(
                "p2",
                1,
                WeaponType.RIFLE,
                ShotDirection.RIGHT,
                DodgeDirection.RIGHT,
                DuelActionSource.MANUAL,
                NOW
        );

        DuelEngine.RoundResolution result = engine.resolveRound(duel, playerOneAction, playerTwoAction);

        assertEquals(100, result.playerOneHpAfter());
        assertEquals(95, result.playerTwoHpAfter());
    }

    @Test
    void pistolShieldAlwaysReducesShotgunDamageByThirtyPercent() {
        DuelBalanceProperties balance = defaultBalance();
        DuelEngine engine = new DuelEngine(Clock.fixed(NOW, ZoneOffset.UTC), balance) {
            @Override
            protected double nextRandom() {
                return 0.0d;
            }
        };
        Duel duel = duel("duel-5", balance);

        DuelRoundAction playerOneAction = new DuelRoundAction(
                "p1",
                1,
                WeaponType.SHOTGUN,
                ShotDirection.CENTER,
                DodgeDirection.STAY,
                DuelActionSource.MANUAL,
                NOW
        );
        DuelRoundAction playerTwoAction = new DuelRoundAction(
                "p2",
                1,
                WeaponType.PISTOLS,
                ShotDirection.LEFT,
                DodgeDirection.STAY,
                DuelActionSource.MANUAL,
                NOW
        );

        DuelEngine.RoundResolution result = engine.resolveRound(duel, playerOneAction, playerTwoAction);

        assertEquals(100, result.playerOneHpAfter());
        assertEquals(82, result.playerTwoHpAfter());
    }

    @Test
    void rifleDamageComesFromBalanceConfiguration() {
        DuelBalanceProperties balance = defaultBalance();
        balance.getRifle().setDamage(44);
        DuelEngine engine = new DuelEngine(Clock.fixed(NOW, ZoneOffset.UTC), balance);
        Duel duel = duel("duel-config", balance);

        DuelRoundAction playerOneAction = new DuelRoundAction(
                "p1",
                1,
                WeaponType.RIFLE,
                ShotDirection.CENTER,
                DodgeDirection.STAY,
                DuelActionSource.MANUAL,
                NOW
        );
        DuelRoundAction playerTwoAction = new DuelRoundAction(
                "p2",
                1,
                WeaponType.RIFLE,
                ShotDirection.LEFT,
                DodgeDirection.STAY,
                DuelActionSource.MANUAL,
                NOW
        );

        DuelEngine.RoundResolution result = engine.resolveRound(duel, playerOneAction, playerTwoAction);

        assertEquals(56, result.playerTwoHpAfter());
    }

    private DuelBalanceProperties defaultBalance() {
        return new DuelBalanceProperties();
    }

    private Duel duel(String duelId, DuelBalanceProperties balance) {
        return new Duel(
                duelId,
                "p1",
                "Player",
                "p2",
                "Opponent",
                balance.getStartingHp(),
                NOW
        );
    }
}
