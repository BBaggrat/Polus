package com.example.sandalpunk.exploration;

import org.springframework.stereotype.Component;

@Component
public class ContentBalance {

    public double hiddenRewardMultiplier() {
        return 1.0d;
    }

    public double openPvpRewardMultiplier() {
        return 1.25d;
    }

    public int baseMonsterChance() {
        return 18;
    }

    public int baseAnomalyChance() {
        return 18;
    }

    public int baseLootChance() {
        return 28;
    }

    public int baseObjectChance() {
        return 24;
    }

    public int basePvpTraceChance() {
        return 42;
    }

    public double chainStartChance() {
        return 0.18d;
    }

    public int mapFragmentChance() {
        return 8;
    }

    public int repeatedEventCooldownSize() {
        return 10;
    }

    public int failureResourceLossPercent() {
        return 50;
    }

    public int openPvpFailureResourceLossBonus() {
        return 10;
    }

    public int monsterHpLossLow() {
        return 3;
    }

    public int monsterHpLossMedium() {
        return 6;
    }

    public int monsterHpLossHigh() {
        return 10;
    }
}
