package com.example.sandalpunk.progression;

import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.example.sandalpunk.exploration.PlayerState;
import com.example.sandalpunk.exploration.PlayerStateService;
import com.example.sandalpunk.logging.AppEventLogger;
import com.example.sandalpunk.logging.AppEventType;
import com.example.sandalpunk.player.PlayerProfile;
import com.example.sandalpunk.web.ConflictException;
import com.example.sandalpunk.web.NotFoundException;
import org.springframework.stereotype.Service;

@Service
public class EquipmentService {

    private final EquipmentStateRepository repository;
    private final BaseService baseService;
    private final PlayerStateService playerStateService;
    private final ProgressionBalance balance;
    private final AppEventLogger eventLogger;
    private final Clock clock;

    public EquipmentService(
            EquipmentStateRepository repository,
            BaseService baseService,
            PlayerStateService playerStateService,
            ProgressionBalance balance,
            AppEventLogger eventLogger,
            Clock clock
    ) {
        this.repository = repository;
        this.baseService = baseService;
        this.playerStateService = playerStateService;
        this.balance = balance;
        this.eventLogger = eventLogger;
        this.clock = clock;
    }

    public synchronized EquipmentState getOrCreate(PlayerProfile player) {
        return repository.findByPlayerId(player.getId()).orElseGet(() -> repository.save(
                new EquipmentState(
                        player.getId(),
                        WeaponSlot.PISTOL,
                        armor("swamp_cloak", "Рваный болотный плащ", 1, 5),
                        charm("bone_charm", "Костяной оберег", 1, 5),
                        List.of(tool("rope", "Верёвка", 1, 10)),
                        Set.of("swamp_cloak", "bone_charm", "rope"),
                        clock.instant()
                )
        ));
    }

    public synchronized EquipmentView view(PlayerProfile player) {
        EquipmentState state = getOrCreate(player);
        int workbench = baseService.level(player, BaseUpgradeType.WEAPON_WORKBENCH);
        return new EquipmentView(state, balance.equipmentCatalog(state, workbench));
    }

    public synchronized EquipmentView equip(PlayerProfile player, EquipmentSlot slot, String itemId) {
        EquipmentState state = getOrCreate(player);
        EquipmentCatalogItem item = requireCatalogItem(player, itemId);
        if (!item.unlocked() || item.slot() != slot) {
            throw new ConflictException("Этот предмет пока нельзя экипировать");
        }
        if (!state.owns(itemId)) {
            PlayerState playerState = playerStateService.getOrCreate(player);
            if (!playerState.getResources().canAfford(item.upgradeCost())) {
                throw new ConflictException("Недостаточно ресурсов для покупки предмета");
            }
            playerState.setResources(playerState.getResources().subtract(item.upgradeCost()));
            playerStateService.save(playerState);
            state.acquire(itemId);
        }
        switch (slot) {
            case WEAPON -> state.setEquippedWeapon(WeaponSlot.valueOf(itemId.toUpperCase()));
            case ARMOR -> state.setArmor(armor(item.id(), item.name(), item.level(), item.effects().get(0).value()));
            case CHARM -> state.setCharm(charm(item.id(), item.name(), item.level(), item.effects().get(0).value()));
            case TOOL -> state.equipTool(tool(item.id(), item.name(), item.level(), item.effects().get(0).value()));
        }
        state.setUpdatedAt(clock.instant());
        repository.save(state);
        eventLogger.info(
                AppEventType.EQUIPMENT_EQUIPPED,
                "Предмет экипирован",
                Map.of("playerId", player.getId(), "itemId", itemId, "slot", slot)
        );
        return view(player);
    }

    public synchronized EquipmentView upgrade(PlayerProfile player, String itemId) {
        if (baseService.level(player, BaseUpgradeType.WEAPON_WORKBENCH) < 1) {
            throw new ConflictException("Сначала построй оружейный верстак");
        }
        EquipmentState state = getOrCreate(player);
        EquipmentCatalogItem item = requireCatalogItem(player, itemId);
        if (!item.unlocked() || !item.owned() || !item.equipped()) {
            throw new ConflictException("Сначала экипируй доступный предмет");
        }
        int currentLevel = currentLevel(state, item);
        if (currentLevel >= item.maxLevel()) {
            throw new ConflictException("Предмет уже улучшен до максимума");
        }
        PlayerState playerState = playerStateService.getOrCreate(player);
        if (!playerState.getResources().canAfford(item.upgradeCost())) {
            throw new ConflictException("Недостаточно ресурсов");
        }
        playerState.setResources(playerState.getResources().subtract(item.upgradeCost()));
        playerStateService.save(playerState);
        replaceAtLevel(state, item, currentLevel + 1);
        state.setUpdatedAt(clock.instant());
        repository.save(state);
        eventLogger.info(
                AppEventType.EQUIPMENT_UPGRADED,
                "Снаряжение улучшено",
                Map.of("playerId", player.getId(), "itemId", itemId, "level", currentLevel + 1)
        );
        return view(player);
    }

    public double effect(PlayerProfile player, String effectType) {
        EquipmentState state = getOrCreate(player);
        double value = 0;
        value += state.getArmor().effects().stream()
                .filter(effect -> effect.type().equals(effectType))
                .mapToDouble(EquipmentEffect::value)
                .sum();
        value += state.getCharm().effects().stream()
                .filter(effect -> effect.type().equals(effectType))
                .mapToDouble(EquipmentEffect::value)
                .sum();
        value += state.getTools().stream()
                .flatMap(item -> item.effects().stream())
                .filter(effect -> effect.type().equals(effectType))
                .mapToDouble(EquipmentEffect::value)
                .sum();
        return value;
    }

    public boolean hasTool(PlayerProfile player, String itemId) {
        return getOrCreate(player).getTools().stream().anyMatch(item -> item.id().equals(itemId));
    }

    public void logOpened(PlayerProfile player) {
        eventLogger.info(
                AppEventType.EQUIPMENT_OPENED,
                "Снаряжение открыто",
                Map.of("playerId", player.getId())
        );
    }

    private EquipmentCatalogItem requireCatalogItem(PlayerProfile player, String itemId) {
        return view(player).items().stream()
                .filter(item -> item.id().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Предмет не найден"));
    }

    private int currentLevel(EquipmentState state, EquipmentCatalogItem item) {
        return switch (item.slot()) {
            case ARMOR -> state.getArmor().level();
            case CHARM -> state.getCharm().level();
            case TOOL -> state.getTools().stream()
                    .filter(tool -> tool.id().equals(item.id()))
                    .mapToInt(ToolItem::level)
                    .findFirst()
                    .orElse(1);
            case WEAPON -> 1;
        };
    }

    private void replaceAtLevel(EquipmentState state, EquipmentCatalogItem item, int level) {
        double value = item.effects().get(0).value() + ((level - 1) * 2);
        switch (item.slot()) {
            case ARMOR -> state.setArmor(armor(item.id(), item.name(), level, value));
            case CHARM -> state.setCharm(charm(item.id(), item.name(), level, value));
            case TOOL -> state.replaceTool(tool(item.id(), item.name(), level, value));
            case WEAPON -> throw new ConflictException("Улучшение оружия будет добавлено отдельно");
        }
    }

    private ArmorItem armor(String id, String name, int level, double value) {
        String type = id.equals("shell_jacket") ? "danger_damage_reduction" : "danger_damage_reduction";
        return new ArmorItem(id, name, level, 3, "Защита для экспедиций",
                List.of(new EquipmentEffect(type, value, "Снижает потерю HP")));
    }

    private CharmItem charm(String id, String name, int level, double value) {
        String type = id.equals("rusty_token") ? "map_fragment_bonus" : "anomaly_reduction";
        return new CharmItem(id, name, level, 3, "Оберег для топи",
                List.of(new EquipmentEffect(type, value, "Меняет исходы экспедиций")));
    }

    private ToolItem tool(String id, String name, int level, double value) {
        String type = switch (id) {
            case "flashlight" -> "object_event_bonus";
            case "hook" -> "hook_choice";
            default -> "object_damage_reduction";
        };
        return new ToolItem(id, name, level, 3, "Инструмент исследователя",
                List.of(new EquipmentEffect(type, value, "Открывает преимущество в топи")));
    }
}
