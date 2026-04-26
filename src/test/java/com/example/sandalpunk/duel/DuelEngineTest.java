package com.example.sandalpunk.duel;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

class DuelEngineTest {

    private static final Instant NOW = Instant.parse("2026-04-14T12:00:00Z");

    @Test
    void rifleHitsWhenShotGoesCenterAndDefenderStays() {
        DuelEngine engine = new DuelEngine(Clock.fixed(NOW, ZoneOffset.UTC));
        Duel duel = new Duel("duel-1", "p1", "Player", "p2", "Opponent", NOW);

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
        DuelEngine engine = new DuelEngine(Clock.fixed(NOW, ZoneOffset.UTC));
        Duel duel = new Duel("duel-2", "p1", "Player", "p2", "Opponent", NOW);

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
    void rifleIgnoresShieldAndStillDealsDamage() {
        DuelEngine engine = new DuelEngine(Clock.fixed(NOW, ZoneOffset.UTC));
        Duel duel = new Duel("duel-3", "p1", "Player", "p2", "Opponent", NOW);

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
        assertEquals(70, result.playerTwoHpAfter());
    }

    @Test
    void shotgunCanGrazeOnMiss() {
        DuelEngine engine = new DuelEngine(Clock.fixed(NOW, ZoneOffset.UTC)) {
            @Override
            protected double nextRandom() {
                return 0.10d;
            }
        };
        Duel duel = new Duel("duel-4", "p1", "Player", "p2", "Opponent", NOW);

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
    void shotgunPelletsCanAllBeBlockedByShield() {
        DuelEngine engine = new DuelEngine(Clock.fixed(NOW, ZoneOffset.UTC)) {
            @Override
            protected double nextRandom() {
                return 0.0d;
            }
        };
        Duel duel = new Duel("duel-5", "p1", "Player", "p2", "Opponent", NOW);

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
        assertEquals(100, result.playerTwoHpAfter());
    }
}
