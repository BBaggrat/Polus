package com.example.sandalpunk.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.duel")
public class DuelBalanceProperties {

    @NotBlank
    private String balanceVersion = "polus-pvp-20260614";

    @Min(1)
    @Max(10000)
    private int startingHp = 100;

    @Min(10)
    @Max(3600)
    private int roundTimeoutSeconds = 120;

    @Min(1)
    @Max(1000)
    private int maxChatMessages = 80;

    @Valid
    private final Rewards rewards = new Rewards();

    @Valid
    private final Pistols pistols = new Pistols();

    @Valid
    private final Rifle rifle = new Rifle();

    @Valid
    private final Shotgun shotgun = new Shotgun();

    public String getBalanceVersion() {
        return balanceVersion;
    }

    public void setBalanceVersion(String balanceVersion) {
        this.balanceVersion = balanceVersion;
    }

    public int getStartingHp() {
        return startingHp;
    }

    public void setStartingHp(int startingHp) {
        this.startingHp = startingHp;
    }

    public int getRoundTimeoutSeconds() {
        return roundTimeoutSeconds;
    }

    public void setRoundTimeoutSeconds(int roundTimeoutSeconds) {
        this.roundTimeoutSeconds = roundTimeoutSeconds;
    }

    public int getMaxChatMessages() {
        return maxChatMessages;
    }

    public void setMaxChatMessages(int maxChatMessages) {
        this.maxChatMessages = maxChatMessages;
    }

    public Rewards getRewards() {
        return rewards;
    }

    public Pistols getPistols() {
        return pistols;
    }

    public Rifle getRifle() {
        return rifle;
    }

    public Shotgun getShotgun() {
        return shotgun;
    }

    public static class Rewards {

        @Min(0)
        @Max(1000000)
        private int victoryCoins = 100;

        @Min(0)
        @Max(1000000)
        private int defeatCoins = 25;

        @Min(0)
        @Max(1000000)
        private int ratingDelta = 10;

        public int getVictoryCoins() {
            return victoryCoins;
        }

        public void setVictoryCoins(int victoryCoins) {
            this.victoryCoins = victoryCoins;
        }

        public int getDefeatCoins() {
            return defeatCoins;
        }

        public void setDefeatCoins(int defeatCoins) {
            this.defeatCoins = defeatCoins;
        }

        public int getRatingDelta() {
            return ratingDelta;
        }

        public void setRatingDelta(int ratingDelta) {
            this.ratingDelta = ratingDelta;
        }
    }

    public static class Pistols {

        @Min(0)
        @Max(10000)
        private int damage = 18;

        @DecimalMin("0.0")
        @DecimalMax("1.0")
        private double shieldDamageReduction = 0.30d;

        public int getDamage() {
            return damage;
        }

        public void setDamage(int damage) {
            this.damage = damage;
        }

        public double getShieldDamageReduction() {
            return shieldDamageReduction;
        }

        public void setShieldDamageReduction(double shieldDamageReduction) {
            this.shieldDamageReduction = shieldDamageReduction;
        }
    }

    public static class Rifle {

        @Min(0)
        @Max(10000)
        private int damage = 30;

        public int getDamage() {
            return damage;
        }

        public void setDamage(int damage) {
            this.damage = damage;
        }
    }

    public static class Shotgun {

        @Min(1)
        @Max(100)
        private int pelletCount = 5;

        @Min(0)
        @Max(10000)
        private int pelletDamage = 5;

        @DecimalMin("0.0")
        @DecimalMax("1.0")
        private double edgeGrazeChance = 0.35d;

        @Min(0)
        @Max(10000)
        private int edgeDamage = 5;

        public int getPelletCount() {
            return pelletCount;
        }

        public void setPelletCount(int pelletCount) {
            this.pelletCount = pelletCount;
        }

        public int getPelletDamage() {
            return pelletDamage;
        }

        public void setPelletDamage(int pelletDamage) {
            this.pelletDamage = pelletDamage;
        }

        public double getEdgeGrazeChance() {
            return edgeGrazeChance;
        }

        public void setEdgeGrazeChance(double edgeGrazeChance) {
            this.edgeGrazeChance = edgeGrazeChance;
        }

        public int getEdgeDamage() {
            return edgeDamage;
        }

        public void setEdgeDamage(int edgeDamage) {
            this.edgeDamage = edgeDamage;
        }
    }
}
