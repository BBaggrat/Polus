package com.example.sandalpunk.progression;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class EquipmentState {

    private final String playerId;
    private WeaponSlot equippedWeapon;
    private ArmorItem armor;
    private CharmItem charm;
    private final List<ToolItem> tools;
    private final Set<String> ownedItemIds;
    private Instant updatedAt;

    public EquipmentState(
            String playerId,
            WeaponSlot equippedWeapon,
            ArmorItem armor,
            CharmItem charm,
            List<ToolItem> tools,
            Set<String> ownedItemIds,
            Instant updatedAt
    ) {
        this.playerId = playerId;
        this.equippedWeapon = equippedWeapon;
        this.armor = armor;
        this.charm = charm;
        this.tools = new ArrayList<>(tools);
        this.ownedItemIds = new LinkedHashSet<>(ownedItemIds);
        this.updatedAt = updatedAt;
    }

    public String getPlayerId() {
        return playerId;
    }

    public WeaponSlot getEquippedWeapon() {
        return equippedWeapon;
    }

    public void setEquippedWeapon(WeaponSlot equippedWeapon) {
        this.equippedWeapon = equippedWeapon;
    }

    public ArmorItem getArmor() {
        return armor;
    }

    public void setArmor(ArmorItem armor) {
        this.armor = armor;
    }

    public CharmItem getCharm() {
        return charm;
    }

    public void setCharm(CharmItem charm) {
        this.charm = charm;
    }

    public List<ToolItem> getTools() {
        return List.copyOf(tools);
    }

    public void equipTool(ToolItem toolItem) {
        tools.removeIf(item -> item.id().equals(toolItem.id()));
        if (tools.size() >= 2) {
            tools.remove(0);
        }
        tools.add(toolItem);
    }

    public void replaceTool(ToolItem toolItem) {
        tools.removeIf(item -> item.id().equals(toolItem.id()));
        tools.add(toolItem);
    }

    public Set<String> getOwnedItemIds() {
        return Set.copyOf(ownedItemIds);
    }

    public boolean owns(String itemId) {
        return ownedItemIds.contains(itemId);
    }

    public void acquire(String itemId) {
        ownedItemIds.add(itemId);
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
