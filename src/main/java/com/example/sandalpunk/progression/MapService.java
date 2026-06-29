package com.example.sandalpunk.progression;

import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.logging.AppEventType;
import com.example.sandalpunk.player.PlayerProfile;
import com.example.sandalpunk.web.ConflictException;
import com.example.sandalpunk.web.NotFoundException;
import org.springframework.stereotype.Service;

@Service
public class MapService {

    private static final List<String> FRAGMENT_TEXTS = List.of(
            "На промокшей бумаге отмечен сухой настил у причала.",
            "Угольная линия обходит черную протоку.",
            "На обороте старого пропуска выведены координаты линии буев.",
            "Край карты пахнет соленой водой и отмечен тремя зарубками.",
            "Красная нить связывает брошенный маяк с дамбой.",
            "На кальке проступает старая линия патрульных огней."
    );

    private final MapProgressRepository repository;
    private final ProgressionBalance balance;
    private final AppEventLogger eventLogger;
    private final Clock clock;

    public MapService(
            MapProgressRepository repository,
            ProgressionBalance balance,
            AppEventLogger eventLogger,
            Clock clock
    ) {
        this.repository = repository;
        this.balance = balance;
        this.eventLogger = eventLogger;
        this.clock = clock;
    }

    public synchronized MapProgress getOrCreate(PlayerProfile player) {
        return repository.findByPlayerId(player.getId()).orElseGet(() -> repository.save(
                new MapProgress(player.getId(), List.of(), null, 0, 0, clock.instant())
        ));
    }

    public synchronized MapView view(PlayerProfile player) {
        MapProgress progress = getOrCreate(player);
        return new MapView(
                player.getId(),
                progress.getFragmentsFound(),
                progress.getFragments(),
                balance.routes(progress),
                progress.getSelectedRouteId(),
                progress.getRiskReductionPercent(),
                progress.getRareEventChanceBonus()
        );
    }

    public synchronized MapView selectRoute(PlayerProfile player, String routeId) {
        MapProgress progress = getOrCreate(player);
        KnownRoute route = balance.routes(progress).stream()
                .filter(candidate -> candidate.id().equals(routeId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Маршрут не найден"));
        if (!route.isUnlocked()) {
            throw new ConflictException("Для маршрута нужно больше фрагментов карты");
        }
        progress.setSelectedRouteId(routeId);
        progress.setRiskReductionPercent(route.id().equals(ProgressionBalance.ROUTE_QUIET_WALKWAY) ? 5 : 0);
        progress.setRareEventChanceBonus(route.id().equals(ProgressionBalance.ROUTE_BLACK_ALDER) ? 5 : 0);
        progress.setUpdatedAt(clock.instant());
        repository.save(progress);
        eventLogger.info(
                AppEventType.ROUTE_SELECTED,
                "Выбран маршрут",
                Map.of("playerId", player.getId(), "routeId", routeId)
        );
        return view(player);
    }

    public synchronized MapFragment discoverFragment(
            PlayerProfile player,
            String explorationId,
            int chancePercent
    ) {
        if (chancePercent <= 0 || nextInt(100) >= Math.min(100, chancePercent)) {
            return null;
        }
        MapProgress progress = getOrCreate(player);
        int previousCount = progress.getFragmentsFound();
        String text = FRAGMENT_TEXTS.get(previousCount % FRAGMENT_TEXTS.size());
        MapFragment fragment = new MapFragment(
                UUID.randomUUID().toString(),
                "Фрагмент карты " + (previousCount + 1),
                text,
                clock.instant()
        );
        progress.addFragment(fragment);
        progress.setUpdatedAt(clock.instant());
        repository.save(progress);

        eventLogger.info(
                AppEventType.MAP_FRAGMENT_FOUND,
                "Найден фрагмент карты",
                Map.of(
                        "playerId", player.getId(),
                        "explorationId", explorationId,
                        "fragmentId", fragment.id(),
                        "fragmentsFound", progress.getFragmentsFound()
                )
        );
        balance.routes(progress).stream()
                .filter(KnownRoute::isUnlocked)
                .filter(route -> route.requiredFragments() > previousCount)
                .forEach(route -> eventLogger.info(
                        AppEventType.ROUTE_UNLOCKED,
                        "Открыт маршрут",
                        Map.of("playerId", player.getId(), "routeId", route.id())
                ));
        return fragment;
    }

    public String selectedRoute(PlayerProfile player) {
        return getOrCreate(player).getSelectedRouteId();
    }

    public void logOpened(PlayerProfile player) {
        eventLogger.info(AppEventType.MAP_OPENED, "Карта открыта", Map.of("playerId", player.getId()));
    }

    protected int nextInt(int bound) {
        return ThreadLocalRandom.current().nextInt(bound);
    }
}
