package com.example.sandalpunk.exploration;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.logging.AppEventType;
import com.example.sandalpunk.player.PlayerProfile;
import com.example.sandalpunk.progression.BaseService;
import com.example.sandalpunk.progression.BaseUpgradeType;
import com.example.sandalpunk.progression.EquipmentService;
import com.example.sandalpunk.progression.MapFragment;
import com.example.sandalpunk.progression.MapService;
import com.example.sandalpunk.progression.ProgressionBalance;
import org.springframework.stereotype.Service;

@Service
public class ExplorationModifierService {

    private final BaseService baseService;
    private final EquipmentService equipmentService;
    private final MapService mapService;
    private final ContentBalance contentBalance;
    private final AppEventLogger eventLogger;

    public ExplorationModifierService(
            BaseService baseService,
            EquipmentService equipmentService,
            MapService mapService,
            ContentBalance contentBalance,
            AppEventLogger eventLogger
    ) {
        this.baseService = baseService;
        this.equipmentService = equipmentService;
        this.mapService = mapService;
        this.contentBalance = contentBalance;
        this.eventLogger = eventLogger;
    }

    public Encounter nextEncounter(
            PlayerProfile player,
            ExplorationVisibilityMode mode,
            EncounterGenerator generator
    ) {
        return nextEncounter(player, mode, generator, Set.of());
    }

    public Encounter nextEncounter(
            PlayerProfile player,
            ExplorationVisibilityMode mode,
            EncounterGenerator generator,
            Set<String> recentlySeenEventIds
    ) {
        String route = mapService.selectedRoute(player);
        Set<EncounterType> preferred = Set.of();
        double chance = equipmentService.effect(player, "object_event_bonus") / 100.0d;

        if (ProgressionBalance.ROUTE_BLACK_ALDER.equals(route)) {
            preferred = Set.of(EncounterType.OBJECT, EncounterType.LOOT);
            chance += 0.05d;
        } else if (ProgressionBalance.ROUTE_QUIET_WALKWAY.equals(route)
                && mode == ExplorationVisibilityMode.HIDDEN) {
            preferred = Set.of(EncounterType.QUIET_EVENT, EncounterType.OBJECT, EncounterType.LOOT);
            chance += 0.05d;
        } else if (ProgressionBalance.ROUTE_OLD_CORDON.equals(route)
                && mode == ExplorationVisibilityMode.OPEN_PVP) {
            preferred = Set.of(EncounterType.PVP_TRACE);
            chance += 0.05d;
        }
        if (route != null && !route.isBlank()) {
            eventLogger.info(
                    AppEventType.MAP_ROUTE_USED,
                    "Курс повлиял на генерацию события",
                    Map.of("playerId", player.getId(), "routeId", route, "visibilityMode", mode)
            );
        }
        return decorateHookChoice(player, generator.nextEncounter(mode, preferred, chance, recentlySeenEventIds));
    }

    public MapFragment tryDiscoverMapFragment(PlayerProfile player, String explorationId) {
        int chance = contentBalance.mapFragmentChance()
                + (baseService.level(player, BaseUpgradeType.CARTOGRAPHY_TABLE) * 10)
                + (int) equipmentService.effect(player, "map_fragment_bonus");
        return mapService.discoverFragment(player, explorationId, chance);
    }

    public ChoiceOutcome applyChoice(
            PlayerProfile player,
            ExplorationState exploration,
            Encounter encounter,
            EncounterChoice choice
    ) {
        List<String> messages = new ArrayList<>();
        PlayerResources reward = choice.reward() == null ? PlayerResources.empty() : choice.reward();
        if (!reward.isEmpty() && exploration.getVisibilityMode() == ExplorationVisibilityMode.OPEN_PVP) {
            reward = scaleReward(reward, contentBalance.openPvpRewardMultiplier());
            messages.add("Открытый курс принёс больше груза.");
            logEffect(
                    AppEventType.OPEN_PVP_REWARD_APPLIED,
                    player,
                    exploration,
                    "rewardMultiplier",
                    contentBalance.openPvpRewardMultiplier()
            );
        }

        int dryingLevel = baseService.level(player, BaseUpgradeType.DRYING_RACK);
        int dryingChance = switch (dryingLevel) {
            case 1 -> 20;
            case 2 -> 35;
            case 3 -> 50;
            default -> 0;
        };
        if (encounter.type() == EncounterType.LOOT && dryingChance > 0 && roll(dryingChance)) {
            reward = reward.add(new PlayerResources(0, 1, 0));
            messages.add("Сушилка помогла сохранить дополнительный припас.");
            logEffect(AppEventType.UPGRADE_EFFECT_APPLIED, player, exploration, "upgradeId", "drying_rack");
        }

        int hpDelta = choice.hpDelta();
        if (hpDelta < 0) {
            double reduction = baseService.level(player, BaseUpgradeType.REINFORCED_WALKWAY) * 5.0d;
            reduction += equipmentService.effect(player, "danger_damage_reduction");
            if (encounter.type() == EncounterType.ANOMALY) {
                reduction += baseService.level(player, BaseUpgradeType.WARDING_CHARM) * 5.0d;
                reduction += equipmentService.effect(player, "anomaly_reduction");
            }
            if (encounter.type() == EncounterType.OBJECT || encounter.type() == EncounterType.LOOT) {
                reduction += equipmentService.effect(player, "object_damage_reduction");
            }
            int reduced = Math.max(1, (int) Math.round(Math.abs(hpDelta) * (1.0d - Math.min(80, reduction) / 100.0d)));
            if (reduced < Math.abs(hpDelta)) {
                hpDelta = -reduced;
                messages.add("Модули и лодка смягчили полученный урон.");
                logEffect(AppEventType.EQUIPMENT_EFFECT_APPLIED, player, exploration, "hpReduction", reduction);
            }
        }
        return new ChoiceOutcome(reward, hpDelta, List.copyOf(messages));
    }

    public FailureOutcome failureOutcome(PlayerProfile player, ExplorationState exploration) {
        int baseLoss = contentBalance.failureResourceLossPercent()
                + (exploration.getVisibilityMode() == ExplorationVisibilityMode.OPEN_PVP
                ? contentBalance.openPvpFailureResourceLossBonus()
                : 0);
        int storageReduction = baseService.level(player, BaseUpgradeType.STORAGE) * 10;
        int lossPercent = Math.max(10, baseLoss - storageReduction);
        PlayerResources collected = exploration.getCollectedResources();
        PlayerResources preserved = collected.retainPercent(100 - lossPercent);
        PlayerResources lost = collected.difference(preserved);
        if (storageReduction > 0) {
            logEffect(
                    AppEventType.STORAGE_PROTECTION_APPLIED,
                    player,
                    exploration,
                    "savedPercent",
                    storageReduction
            );
        }
        eventLogger.info(
                AppEventType.RESOURCES_LOST,
                "Часть груза потеряна",
                Map.of(
                        "playerId", player.getId(),
                        "explorationId", exploration.getExplorationId(),
                        "lossPercent", lossPercent,
                        "resourcesDelta", lost
                )
        );
        return new FailureOutcome(preserved, lost, lossPercent, storageReduction);
    }

    private Encounter decorateHookChoice(PlayerProfile player, Encounter encounter) {
        if (!equipmentService.hasTool(player, "hook")
                || (encounter.type() != EncounterType.OBJECT && encounter.type() != EncounterType.LOOT)) {
            return encounter;
        }
        List<EncounterChoice> choices = new ArrayList<>(encounter.choices());
        EncounterChoice hookChoice = new EncounterChoice(
                "use_hook",
                "Использовать самодельный крюк",
                ChoiceResultType.FIND_OBJECT,
                RiskLevel.LOW,
                new PlayerResources(1, 0, 0),
                0,
                "Крюк цепляется за край находки. Ты достаёшь её, не входя в опасную воду."
        );
        if (choices.size() >= 3) {
            choices.set(choices.size() - 1, hookChoice);
        } else {
            choices.add(hookChoice);
        }
        return new Encounter(
                encounter.id(),
                encounter.contentId(),
                encounter.type(),
                encounter.title(),
                encounter.text(),
                List.copyOf(choices),
                encounter.reward(),
                encounter.risk(),
                encounter.chainId(),
                encounter.chainStepId(),
                encounter.tags()
        );
    }

    private PlayerResources scaleReward(PlayerResources reward, double multiplier) {
        return new PlayerResources(
                reward.scrap() == 0 ? 0 : Math.max(1, (int) Math.ceil(reward.scrap() * multiplier)),
                reward.supplies() == 0 ? 0 : Math.max(1, (int) Math.ceil(reward.supplies() * multiplier)),
                reward.swampResin() == 0 ? 0 : Math.max(1, (int) Math.ceil(reward.swampResin() * multiplier))
        );
    }

    private boolean roll(int chancePercent) {
        return ThreadLocalRandom.current().nextInt(100) < chancePercent;
    }

    private void logEffect(
            AppEventType type,
            PlayerProfile player,
            ExplorationState exploration,
            String key,
            Object value
    ) {
        eventLogger.info(
                type,
                type.eventName(),
                Map.of(
                        "playerId", player.getId(),
                        "explorationId", exploration.getExplorationId(),
                        key, value
                )
        );
    }

    public record ChoiceOutcome(
            PlayerResources reward,
            int hpDelta,
            List<String> journalMessages
    ) {
    }

    public record FailureOutcome(
            PlayerResources preserved,
            PlayerResources lost,
            int lossPercent,
            int storageReductionPercent
    ) {
    }
}
