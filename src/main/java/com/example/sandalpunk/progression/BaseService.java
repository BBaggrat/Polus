package com.example.sandalpunk.progression;

import java.time.Clock;
import java.util.Map;
import java.util.Set;

import com.example.sandalpunk.exploration.ExplorationRepository;
import com.example.sandalpunk.exploration.ExplorationStatus;
import com.example.sandalpunk.exploration.PlayerState;
import com.example.sandalpunk.exploration.PlayerStateService;
import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.logging.AppEventType;
import com.example.sandalpunk.player.PlayerProfile;
import com.example.sandalpunk.web.ConflictException;
import com.example.sandalpunk.web.NotFoundException;
import org.springframework.stereotype.Service;

@Service
public class BaseService {

    private final BaseStateRepository repository;
    private final MapService mapService;
    private final PlayerStateService playerStateService;
    private final ExplorationRepository explorationRepository;
    private final ProgressionBalance balance;
    private final AppEventLogger eventLogger;
    private final Clock clock;

    public BaseService(
            BaseStateRepository repository,
            MapService mapService,
            PlayerStateService playerStateService,
            ExplorationRepository explorationRepository,
            ProgressionBalance balance,
            AppEventLogger eventLogger,
            Clock clock
    ) {
        this.repository = repository;
        this.mapService = mapService;
        this.playerStateService = playerStateService;
        this.explorationRepository = explorationRepository;
        this.balance = balance;
        this.eventLogger = eventLogger;
        this.clock = clock;
    }

    public synchronized BaseState getOrCreate(PlayerProfile player) {
        return repository.findByPlayerId(player.getId()).orElseGet(() -> repository.save(
                new BaseState(
                        player.getId(),
                        balance.initialUpgrades(),
                        0,
                        mapService.getOrCreate(player),
                        Set.of(),
                        clock.instant()
                )
        ));
    }

    public synchronized BaseState buyUpgrade(PlayerProfile player, String upgradeId) {
        BaseState base = getOrCreate(player);
        BaseUpgrade current = base.getUpgrades().stream()
                .filter(upgrade -> upgrade.id().equals(upgradeId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Улучшение не найдено"));
        if (!current.isUnlocked() || current.level() >= current.maxLevel()) {
            throw new ConflictException("Это улучшение сейчас недоступно");
        }

        PlayerState playerState = playerStateService.getOrCreate(player);
        if (!playerState.getResources().canAfford(current.cost())) {
            eventLogger.info(
                    AppEventType.BASE_UPGRADE_FAILED_NOT_ENOUGH_RESOURCES,
                    "Недостаточно ресурсов для улучшения",
                    Map.of("playerId", player.getId(), "upgradeId", current.id(), "cost", current.cost())
            );
            throw new ConflictException("Недостаточно ресурсов");
        }

        playerState.setResources(playerState.getResources().subtract(current.cost()));
        playerStateService.save(playerState);

        BaseUpgrade upgraded = balance.upgradeAtLevel(current, current.level() + 1);
        base.replaceUpgrade(upgraded);
        if (upgraded.type() == BaseUpgradeType.STORAGE) {
            base.setStorageProtectionLevel(upgraded.level());
        }
        if (upgraded.type() == BaseUpgradeType.WEAPON_WORKBENCH) {
            base.unlockFeature(ProgressionBalance.FEATURE_EQUIPMENT_UPGRADES);
        }
        base.setUpdatedAt(clock.instant());
        repository.save(base);

        eventLogger.info(
                AppEventType.BASE_UPGRADE_BOUGHT,
                "Улучшение базы куплено",
                Map.of(
                        "playerId", player.getId(),
                        "upgradeId", upgraded.id(),
                        "level", upgraded.level(),
                        "resourcesDelta", "-" + current.cost()
                )
        );
        boolean hasReturnedExploration = explorationRepository.findByPlayerId(player.getId()).stream()
                .anyMatch(exploration -> exploration.getStatus() == ExplorationStatus.RETURNED);
        long upgradedCount = base.getUpgrades().stream()
                .filter(upgrade -> upgrade.level() > 0)
                .count();
        if (hasReturnedExploration && upgradedCount == 1) {
            eventLogger.info(
                    AppEventType.FIRST_UPGRADE_AFTER_EXPLORATION,
                    "Первое улучшение после экспедиции",
                    Map.of("playerId", player.getId(), "upgradeId", upgraded.id())
            );
        }
        return base;
    }

    public int level(PlayerProfile player, BaseUpgradeType type) {
        return getOrCreate(player).getUpgrades().stream()
                .filter(upgrade -> upgrade.type() == type)
                .mapToInt(BaseUpgrade::level)
                .findFirst()
                .orElse(0);
    }

    public void logOpened(PlayerProfile player) {
        eventLogger.info(AppEventType.BASE_OPENED, "База открыта", Map.of("playerId", player.getId()));
    }
}
