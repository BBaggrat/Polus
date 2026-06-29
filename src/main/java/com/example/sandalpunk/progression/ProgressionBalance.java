package com.example.sandalpunk.progression;

import java.util.List;

import com.example.sandalpunk.exploration.PlayerResources;
import org.springframework.stereotype.Component;

@Component
public class ProgressionBalance {

    public static final String FEATURE_EQUIPMENT_UPGRADES = "equipment_upgrades";
    public static final String ROUTE_QUIET_WALKWAY = "quiet_walkway";
    public static final String ROUTE_BLACK_ALDER = "black_alder";
    public static final String ROUTE_OLD_CORDON = "old_cordon";

    public List<BaseUpgrade> initialUpgrades() {
        return List.of(
                upgrade("storage", BaseUpgradeType.STORAGE, "Палубный ящик",
                        "Сохраняет часть груза при провале.", 0, 3),
                upgrade("cartography_table", BaseUpgradeType.CARTOGRAPHY_TABLE, "Штурманский стол",
                        "Повышает шанс найти фрагмент карты.", 0, 3),
                upgrade("reinforced_walkway", BaseUpgradeType.REINFORCED_WALKWAY, "Усиленный корпус",
                        "Снижает потерю прочности в опасных событиях.", 0, 3),
                upgrade("drying_rack", BaseUpgradeType.DRYING_RACK, "Сухой отсек",
                        "Иногда добавляет припас к грузу.", 0, 3),
                upgrade("weapon_workbench", BaseUpgradeType.WEAPON_WORKBENCH, "Палубный верстак",
                        "Открывает простые модификации лодочных модулей.", 0, 1),
                upgrade("warding_charm", BaseUpgradeType.WARDING_CHARM, "Эхолот у входа",
                        "Снижает последствия аномальных событий.", 0, 3)
        );
    }

    public BaseUpgrade upgradeAtLevel(BaseUpgrade current, int level) {
        return new BaseUpgrade(
                current.id(),
                current.type(),
                current.name(),
                current.description(),
                level,
                current.maxLevel(),
                nextUpgradeCost(current.type(), level),
                effects(current.type(), level),
                current.isUnlocked()
        );
    }

    public PlayerResources nextUpgradeCost(BaseUpgradeType type, int currentLevel) {
        if (currentLevel >= maxLevel(type)) {
            return PlayerResources.empty();
        }
        return switch (type) {
            case STORAGE -> List.of(
                    new PlayerResources(0, 2, 0),
                    new PlayerResources(4, 2, 0),
                    new PlayerResources(8, 3, 1)
            ).get(currentLevel);
            case CARTOGRAPHY_TABLE -> List.of(
                    new PlayerResources(2, 1, 0),
                    new PlayerResources(5, 2, 0),
                    new PlayerResources(8, 3, 1)
            ).get(currentLevel);
            case REINFORCED_WALKWAY -> List.of(
                    new PlayerResources(2, 2, 0),
                    new PlayerResources(5, 3, 0),
                    new PlayerResources(8, 4, 1)
            ).get(currentLevel);
            case DRYING_RACK -> List.of(
                    new PlayerResources(1, 2, 0),
                    new PlayerResources(4, 3, 0),
                    new PlayerResources(7, 4, 1)
            ).get(currentLevel);
            case WEAPON_WORKBENCH -> new PlayerResources(5, 3, 1);
            case WARDING_CHARM -> List.of(
                    new PlayerResources(2, 1, 1),
                    new PlayerResources(5, 2, 1),
                    new PlayerResources(8, 3, 2)
            ).get(currentLevel);
        };
    }

    public List<UpgradeEffect> effects(BaseUpgradeType type, int level) {
        if (level <= 0) {
            return List.of();
        }
        return switch (type) {
            case STORAGE -> List.of(effect(
                    UpgradeEffectType.REDUCE_RESOURCE_LOSS,
                    level * 10,
                    "Потери груза меньше на " + (level * 10) + "%"
            ));
            case CARTOGRAPHY_TABLE -> List.of(effect(
                    UpgradeEffectType.INCREASE_MAP_FRAGMENT_CHANCE,
                    level * 10,
                    "Шанс найти карту выше на " + (level * 10) + "%"
            ));
            case REINFORCED_WALKWAY -> List.of(effect(
                    UpgradeEffectType.REDUCE_HP_LOSS,
                    level * 5,
                    "Потеря прочности меньше на " + (level * 5) + "%"
            ));
            case DRYING_RACK -> List.of(effect(
                    UpgradeEffectType.INCREASE_SUPPLIES_GAIN,
                    switch (level) {
                        case 1 -> 20;
                        case 2 -> 35;
                        default -> 50;
                    },
                    "Шанс сохранить дополнительный припас"
            ));
            case WEAPON_WORKBENCH -> List.of(effect(
                    UpgradeEffectType.UNLOCK_EQUIPMENT_UPGRADE,
                    1,
                    "Доступны модификации модулей"
            ));
            case WARDING_CHARM -> List.of(effect(
                    UpgradeEffectType.REDUCE_NEGATIVE_EVENT_CHANCE,
                    level * 5,
                    "Аномальные последствия слабее на " + (level * 5) + "%"
            ));
        };
    }

    public List<KnownRoute> routes(MapProgress progress) {
        int fragments = progress.getFragmentsFound();
        String selected = progress.getSelectedRouteId();
        return List.of(
                route(ROUTE_QUIET_WALKWAY, "Тихая протока",
                        "Безопаснее на тихом ходу.", 2, fragments, selected,
                        UpgradeEffectType.REDUCE_HP_LOSS, 5, "На 5% меньше опасных событий"),
                route(ROUTE_BLACK_ALDER, "Черная протока",
                        "Чаще выводит к невозможным объектам и плавающим тайникам.", 4, fragments, selected,
                        UpgradeEffectType.INCREASE_SUPPLIES_GAIN, 5, "+5% к loot/object событиям"),
                route(ROUTE_OLD_CORDON, "Линия старых буев",
                        "Чаще оставляет следы других лодок на открытой воде.", 6, fragments, selected,
                        UpgradeEffectType.INCREASE_MAP_FRAGMENT_CHANCE, 5, "+5% к следам в OPEN_PVP")
        );
    }

    public List<EquipmentCatalogItem> equipmentCatalog(EquipmentState state, int workbenchLevel) {
        return List.of(
                item("swamp_cloak", EquipmentSlot.ARMOR, "Брезентовый тент", 1, 3,
                        "Смягчает урон опасных событий.", "danger_damage_reduction", 5,
                        new PlayerResources(2, 2, 0), true, state, state.getArmor().id().equals("swamp_cloak")),
                item("shell_jacket", EquipmentSlot.ARMOR, "Бронелисты", 1, 3,
                        "Тяжёлая защита для открытой воды. PvP-эффект отложен.", "danger_damage_reduction", 8,
                        new PlayerResources(5, 3, 1), workbenchLevel > 0, state, state.getArmor().id().equals("shell_jacket")),
                item("bone_charm", EquipmentSlot.CHARM, "Старый эхолот", 1, 3,
                        "Ослабляет аномальные последствия.", "anomaly_reduction", 5,
                        new PlayerResources(2, 1, 1), true, state, state.getCharm().id().equals("bone_charm")),
                item("rusty_token", EquipmentSlot.CHARM, "Ржавый жетон", 1, 3,
                        "Помогает замечать следы и фрагменты карты.", "map_fragment_bonus", 5,
                        new PlayerResources(4, 2, 1), workbenchLevel > 0, state, state.getCharm().id().equals("rusty_token")),
                item("rope", EquipmentSlot.TOOL, "Швартовый трос", 1, 3,
                        "Смягчает неудачи у объектов и тайников.", "object_damage_reduction", 10,
                        new PlayerResources(2, 2, 0), true, state, hasTool(state, "rope")),
                item("flashlight", EquipmentSlot.TOOL, "Фонарь", 1, 3,
                        "Чаще выводит к объектам.", "object_event_bonus", 5,
                        new PlayerResources(3, 2, 0), workbenchLevel > 0, state, hasTool(state, "flashlight")),
                item("hook", EquipmentSlot.TOOL, "Носовой крюк", 1, 3,
                        "Даёт дополнительный выбор у некоторых находок.", "hook_choice", 1,
                        new PlayerResources(4, 2, 1), workbenchLevel > 0, state, hasTool(state, "hook"))
        );
    }

    private BaseUpgrade upgrade(
            String id,
            BaseUpgradeType type,
            String name,
            String description,
            int level,
            int maxLevel
    ) {
        return new BaseUpgrade(
                id,
                type,
                name,
                description,
                level,
                maxLevel,
                nextUpgradeCost(type, level),
                effects(type, level),
                true
        );
    }

    private int maxLevel(BaseUpgradeType type) {
        return type == BaseUpgradeType.WEAPON_WORKBENCH ? 1 : 3;
    }

    private UpgradeEffect effect(UpgradeEffectType type, double value, String description) {
        return new UpgradeEffect(type, value, description);
    }

    private KnownRoute route(
            String id,
            String name,
            String description,
            int required,
            int fragments,
            String selected,
            UpgradeEffectType effectType,
            double value,
            String effectDescription
    ) {
        return new KnownRoute(
                id,
                name,
                description,
                required,
                fragments >= required,
                id.equals(selected),
                List.of(effect(effectType, value, effectDescription))
        );
    }

    private EquipmentCatalogItem item(
            String id,
            EquipmentSlot slot,
            String name,
            int level,
            int maxLevel,
            String description,
            String effectType,
            double value,
            PlayerResources cost,
            boolean unlocked,
            EquipmentState state,
            boolean equipped
    ) {
        int currentLevel = switch (slot) {
            case ARMOR -> state.getArmor().id().equals(id) ? state.getArmor().level() : level;
            case CHARM -> state.getCharm().id().equals(id) ? state.getCharm().level() : level;
            case TOOL -> state.getTools().stream()
                    .filter(tool -> tool.id().equals(id))
                    .mapToInt(ToolItem::level)
                    .findFirst()
                    .orElse(level);
            case WEAPON -> level;
        };
        return new EquipmentCatalogItem(
                id,
                slot,
                name,
                currentLevel,
                maxLevel,
                description,
                List.of(new EquipmentEffect(effectType, value, description)),
                cost,
                unlocked,
                state.owns(id),
                equipped
        );
    }

    private boolean hasTool(EquipmentState state, String id) {
        return state.getTools().stream().anyMatch(tool -> tool.id().equals(id));
    }
}
