package com.example.sandalpunk.progression;

import java.util.List;

public record MapView(
        String playerId,
        int fragmentsFound,
        List<MapFragment> fragments,
        List<KnownRoute> knownRoutes,
        String selectedRouteId,
        int riskReductionPercent,
        int rareEventChanceBonus
) {
}
