package com.example.sandalpunk.progression;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class MapProgress {

    private final String playerId;
    private final List<MapFragment> fragments;
    private String selectedRouteId;
    private int riskReductionPercent;
    private int rareEventChanceBonus;
    private Instant updatedAt;

    public MapProgress(
            String playerId,
            List<MapFragment> fragments,
            String selectedRouteId,
            int riskReductionPercent,
            int rareEventChanceBonus,
            Instant updatedAt
    ) {
        this.playerId = playerId;
        this.fragments = new ArrayList<>(fragments);
        this.selectedRouteId = selectedRouteId;
        this.riskReductionPercent = riskReductionPercent;
        this.rareEventChanceBonus = rareEventChanceBonus;
        this.updatedAt = updatedAt;
    }

    public String getPlayerId() {
        return playerId;
    }

    public int getFragmentsFound() {
        return fragments.size();
    }

    public List<MapFragment> getFragments() {
        return List.copyOf(fragments);
    }

    public void addFragment(MapFragment mapFragment) {
        fragments.add(mapFragment);
    }

    public String getSelectedRouteId() {
        return selectedRouteId;
    }

    public void setSelectedRouteId(String selectedRouteId) {
        this.selectedRouteId = selectedRouteId;
    }

    public int getRiskReductionPercent() {
        return riskReductionPercent;
    }

    public void setRiskReductionPercent(int riskReductionPercent) {
        this.riskReductionPercent = riskReductionPercent;
    }

    public int getRareEventChanceBonus() {
        return rareEventChanceBonus;
    }

    public void setRareEventChanceBonus(int rareEventChanceBonus) {
        this.rareEventChanceBonus = rareEventChanceBonus;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
