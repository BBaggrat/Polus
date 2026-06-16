(function () {
    "use strict";

    var elements = {
        panel: document.getElementById("exploration-panel"),
        mode: document.getElementById("exploration-mode-chip"),
        hp: document.getElementById("exploration-hp"),
        hpFill: document.getElementById("exploration-hp-fill"),
        scrap: document.getElementById("exploration-scrap"),
        supplies: document.getElementById("exploration-supplies"),
        resin: document.getElementById("exploration-resin"),
        intro: document.getElementById("exploration-intro"),
        active: document.getElementById("exploration-active"),
        stepLabel: document.getElementById("exploration-step-label"),
        chainLabel: document.getElementById("exploration-chain-label"),
        collected: document.getElementById("exploration-collected"),
        journal: document.getElementById("exploration-live-journal"),
        encounter: document.getElementById("exploration-encounter"),
        encounterType: document.getElementById("exploration-encounter-type"),
        encounterRisk: document.getElementById("exploration-encounter-risk"),
        encounterTitle: document.getElementById("exploration-encounter-title"),
        encounterText: document.getElementById("exploration-encounter-text"),
        choices: document.getElementById("exploration-choice-list"),
        history: document.getElementById("exploration-history-list"),
        status: document.getElementById("exploration-status"),
        startHidden: document.getElementById("exploration-start-hidden"),
        startOpen: document.getElementById("exploration-start-open"),
        directPvp: document.getElementById("exploration-direct-pvp"),
        helpToggle: document.getElementById("exploration-help-toggle"),
        helpPanel: document.getElementById("exploration-help-panel"),
        step: document.getElementById("exploration-step"),
        openPvp: document.getElementById("exploration-open-pvp"),
        returnButton: document.getElementById("exploration-return"),
        progressionSummary: document.getElementById("base-preparation-summary"),
        progressionContent: document.getElementById("progression-content"),
        progressionTabs: document.querySelector(".progression-tabs")
    };

    if (!elements.panel) {
        return;
    }

    var state = {
        player: null,
        base: null,
        exploration: null,
        history: [],
        discoveries: [],
        busy: false,
        initialized: false,
        browserSessionToken: null,
        browserPlayerId: null,
        recoveringBrowserSession: false,
        progressionView: "upgrades"
    };

    function getApp() {
        return window.PolusApp || null;
    }

    function getSessionToken() {
        if (state.browserSessionToken) {
            return state.browserSessionToken;
        }
        var app = getApp();
        return app && typeof app.getSessionToken === "function" ? app.getSessionToken() : null;
    }

    function getPlayerId() {
        if (state.browserPlayerId) {
            return state.browserPlayerId;
        }
        var app = getApp();
        if (app && typeof app.getPlayerId === "function") {
            return app.getPlayerId();
        }
        return state.player ? state.player.playerId : null;
    }

    async function api(path, options) {
        var token = getSessionToken();
        if (!token) {
            throw new Error("Сессия еще загружается");
        }
        var config = Object.assign({}, options || {});
        config.headers = Object.assign({}, config.headers || {}, {
            "X-Session-Token": token
        });
        if (config.body) {
            config.headers["Content-Type"] = "application/json";
        }
        var response = await fetch(path, config);
        if (response.status === 204) {
            return null;
        }
        var text = await response.text();
        var payload = text ? JSON.parse(text) : null;
        if (!response.ok) {
            throw new Error(payload && payload.message ? payload.message : "Не удалось продолжить исследование");
        }
        return payload;
    }

    async function loadSnapshot() {
        var playerId = getPlayerId();
        var query = playerId ? "?playerId=" + encodeURIComponent(playerId) : "";
        var results = await Promise.all([
            api("/api/player/state"),
            api("/api/exploration/current" + query),
            api("/api/journal" + query + (query ? "&" : "?") + "limit=60"),
            api("/api/base/state" + query),
            api("/api/discoveries" + query)
        ]);
        state.player = results[0];
        state.exploration = results[1];
        state.history = Array.isArray(results[2]) ? results[2] : [];
        state.base = results[3];
        state.discoveries = Array.isArray(results[4]) ? results[4] : [];
        state.initialized = true;
        setStatus("", false);
        render();
    }

    async function run(action, successMessage) {
        if (state.busy) {
            return null;
        }
        state.busy = true;
        setStatus("", false);
        renderBusy();
        try {
            var result = await action();
            if (successMessage) {
                setStatus(successMessage, false);
            }
            return result;
        } catch (error) {
            setStatus(error && error.message ? error.message : "Топь не отвечает. Попробуй еще раз.", true);
            return null;
        } finally {
            state.busy = false;
            renderBusy();
        }
    }

    async function startExploration(mode) {
        var result = await run(function () {
            return api("/api/exploration/start", {
                method: "POST",
                body: JSON.stringify({
                    playerId: getPlayerId(),
                    visibilityMode: mode
                })
            });
        }, mode === "OPEN_PVP" ? "Ты вышел в открытую топь." : "Скрытый маршрут начат.");
        if (result) {
            state.exploration = result;
            await refreshAfterAction();
        }
    }

    async function takeStep() {
        if (!state.exploration) {
            return;
        }
        var result = await run(function () {
            return api("/api/exploration/step", {
                method: "POST",
                body: JSON.stringify({
                    playerId: getPlayerId(),
                    explorationId: state.exploration.explorationId
                })
            });
        });
        if (result) {
            state.exploration = result;
            await refreshAfterAction();
        }
    }

    async function choose(choiceId) {
        if (!state.exploration) {
            return;
        }
        var result = await run(function () {
            return api(
                "/api/exploration/" + encodeURIComponent(state.exploration.explorationId) + "/choice",
                {
                    method: "POST",
                    body: JSON.stringify({
                        playerId: getPlayerId(),
                        choiceId: choiceId
                    })
                }
            );
        });
        if (!result) {
            return;
        }
        state.exploration = result;
        var shouldStartPvp = Boolean(result.startPvpDuel);
        await refreshAfterAction();
        if (shouldStartPvp) {
            setStatus("Чужой силуэт уже близко. Начинается поиск стычки.", false);
            var app = getApp();
            if (app && typeof app.startQueueDuel === "function") {
                app.startQueueDuel();
            }
        }
    }

    async function enableOpenPvp() {
        if (!state.exploration) {
            return;
        }
        var result = await run(function () {
            return api(
                "/api/exploration/" + encodeURIComponent(state.exploration.explorationId) + "/visibility",
                {
                    method: "POST",
                    body: JSON.stringify({
                        playerId: getPlayerId(),
                        visibilityMode: "OPEN_PVP"
                    })
                }
            );
        }, "Теперь твои следы видны другим выжившим.");
        if (result) {
            state.exploration = result;
            await refreshAfterAction();
        }
    }

    async function returnToBase() {
        if (!state.exploration) {
            return;
        }
        var explorationId = state.exploration.explorationId;
        var result = await run(function () {
            return api("/api/exploration/" + encodeURIComponent(explorationId) + "/return", {
                method: "POST",
                body: JSON.stringify({ playerId: getPlayerId() })
            });
        }, "Ты вернулся на базу. Добыча сохранена.");
        if (result) {
            state.exploration = null;
            await refreshAfterAction();
        }
    }

    async function refreshAfterAction() {
        var message = elements.status && !elements.status.classList.contains("hidden")
            ? elements.status.textContent
            : "";
        await loadSnapshot();
        if (message) {
            setStatus(message, false);
        }
    }

    async function buyUpgrade(upgradeId) {
        var result = await run(function () {
            return api("/api/base/upgrades/" + encodeURIComponent(upgradeId) + "/buy", {
                method: "POST",
                body: JSON.stringify({ playerId: getPlayerId() })
            });
        }, "База стала надёжнее.");
        if (result) {
            state.base = result;
            state.player = result.player;
            render();
        }
    }

    async function equipItem(slot, itemId) {
        var result = await run(function () {
            return api("/api/equipment/equip", {
                method: "POST",
                body: JSON.stringify({
                    playerId: getPlayerId(),
                    slot: slot,
                    itemId: itemId
                })
            });
        }, "Снаряжение подготовлено.");
        if (result) {
            await loadSnapshot();
        }
    }

    async function upgradeItem(itemId) {
        var result = await run(function () {
            return api("/api/equipment/upgrade", {
                method: "POST",
                body: JSON.stringify({ playerId: getPlayerId(), itemId: itemId })
            });
        }, "Предмет улучшен.");
        if (result) {
            await loadSnapshot();
        }
    }

    async function selectRoute(routeId) {
        var result = await run(function () {
            return api("/api/map/routes/" + encodeURIComponent(routeId) + "/select", {
                method: "POST",
                body: JSON.stringify({ playerId: getPlayerId() })
            });
        }, "Маршрут отмечен в дневнике.");
        if (result) {
            await loadSnapshot();
        }
    }

    function render() {
        renderPlayer();
        renderProgression();
        renderExploration();
        renderHistory();
        renderBusy();
    }

    function renderProgression() {
        if (!elements.progressionContent || !state.base) {
            return;
        }
        var base = state.base.base || {};
        var map = state.base.map || {};
        var upgrades = Array.isArray(base.upgrades) ? base.upgrades : [];
        var activeEffects = upgrades.filter(function (upgrade) {
            return Number(upgrade.level || 0) > 0;
        }).length;
        elements.progressionSummary.textContent = "Фрагменты " + Number(map.fragmentsFound || 0)
            + " · Бонусы " + activeEffects;
        elements.progressionTabs.querySelectorAll("[data-progression-view]").forEach(function (button) {
            var active = button.getAttribute("data-progression-view") === state.progressionView;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-selected", active ? "true" : "false");
        });
        if (state.progressionView === "equipment") {
            renderEquipment(state.base.equipment || {}, state.base.equipmentCatalog || []);
        } else if (state.progressionView === "map") {
            renderMap(map);
        } else if (state.progressionView === "discoveries") {
            renderDiscoveries();
        } else {
            renderUpgrades(upgrades);
        }
    }

    function renderUpgrades(upgrades) {
        var resources = state.player && state.player.resources ? state.player.resources : {};
        elements.progressionContent.innerHTML = upgrades.map(function (upgrade) {
            var maxed = Number(upgrade.level || 0) >= Number(upgrade.maxLevel || 0);
            var affordable = canAfford(resources, upgrade.cost);
            var effect = Array.isArray(upgrade.effects) && upgrade.effects[0]
                ? upgrade.effects[0].description
                : upgrade.description;
            return '<article class="progression-item">'
                + '<div class="progression-item-copy"><div class="progression-item-title"><strong>'
                + escapeHtml(upgrade.name) + '</strong><span>ур. ' + Number(upgrade.level || 0)
                + '/' + Number(upgrade.maxLevel || 0) + '</span></div><p>'
                + escapeHtml(effect || upgrade.description || "") + '</p><small>'
                + (maxed ? "Максимальный уровень" : "Цена: " + compactResources(upgrade.cost))
                + '</small></div><button class="progression-action" type="button" data-buy-upgrade="'
                + escapeHtml(upgrade.id) + '" ' + (maxed || !affordable || state.busy ? "disabled" : "")
                + ' aria-label="Улучшить ' + escapeHtml(upgrade.name) + '">'
                + (maxed ? "✓" : "+") + '</button></article>';
        }).join("");
    }

    function renderEquipment(equipment, catalog) {
        var upgrades = state.base && state.base.base && Array.isArray(state.base.base.upgrades)
            ? state.base.base.upgrades
            : [];
        var hasWorkbench = upgrades.some(function (upgrade) {
            return upgrade.id === "weapon_workbench" && Number(upgrade.level || 0) > 0;
        });
        elements.progressionContent.innerHTML = catalog.map(function (item) {
            var unlocked = item.unlocked !== false && item.isUnlocked !== false;
            var disabled = !unlocked || state.busy || (item.equipped && !hasWorkbench);
            var owned = item.owned !== false;
            var action = item.equipped ? "Улучшить" : owned ? "Экипировать" : "Купить";
            var attribute = item.equipped ? "data-upgrade-item" : "data-equip-item";
            return '<article class="progression-item ' + (!unlocked ? "is-locked" : "") + '">'
                + '<div class="progression-item-copy"><div class="progression-item-title"><strong>'
                + escapeHtml(item.name) + '</strong><span>' + escapeHtml(slotLabel(item.slot))
                + (item.equipped ? " · выбрано" : "") + '</span></div><p>'
                + escapeHtml(item.description || "") + '</p><small>'
                + (unlocked ? (owned ? "Ур. " + Number(item.level || 1) + " · улучшение "
                    : "Цена: ") + compactResources(item.upgradeCost)
                    : "Нужен оружейный верстак")
                + '</small></div><button class="progression-action progression-action-wide" type="button" '
                + attribute + '="' + escapeHtml(item.id) + '" data-equipment-slot="'
                + escapeHtml(item.slot) + '" ' + (disabled ? "disabled" : "") + '>'
                + escapeHtml(action) + '</button></article>';
        }).join("");
    }

    function renderMap(map) {
        var routes = Array.isArray(map.knownRoutes) ? map.knownRoutes : [];
        var fragments = Array.isArray(map.fragments) ? map.fragments : [];
        var latest = fragments.length ? fragments[fragments.length - 1] : null;
        elements.progressionContent.innerHTML = '<div class="map-fragment-summary"><strong>'
            + Number(map.fragmentsFound || 0) + ' фрагм.</strong><span>'
            + escapeHtml(latest ? latest.text : "Карта ещё не начала складываться.") + '</span></div>'
            + routes.map(function (route) {
                var unlocked = route.unlocked === true || route.isUnlocked === true;
                var selected = route.selected === true || route.isSelected === true;
                var disabled = !unlocked || selected || state.busy;
                return '<article class="progression-item ' + (!unlocked ? "is-locked" : "") + '">'
                    + '<div class="progression-item-copy"><div class="progression-item-title"><strong>'
                    + escapeHtml(route.name) + '</strong><span>'
                    + (selected ? "активен" : route.requiredFragments + " фрагм.")
                    + '</span></div><p>' + escapeHtml(route.description || "") + '</p><small>'
                    + escapeHtml(route.effects && route.effects[0] ? route.effects[0].description : "")
                    + '</small></div><button class="progression-action" type="button" data-select-route="'
                    + escapeHtml(route.id) + '" ' + (disabled ? "disabled" : "") + ' aria-label="Выбрать маршрут">'
                    + (selected ? "✓" : "→") + '</button></article>';
            }).join("");
    }

    function renderDiscoveries() {
        var discoveries = Array.isArray(state.discoveries) ? state.discoveries : [];
        if (!discoveries.length) {
            elements.progressionContent.innerHTML = '<article class="progression-empty">'
                + '<strong>Находок пока нет</strong><p>Ищи объекты, следы существ, аномальные метки и фрагменты маршрутов в топи.</p>'
                + '</article>';
            return;
        }
        elements.progressionContent.innerHTML = discoveries.slice(0, 16).map(function (discovery) {
            return '<article class="progression-item discovery-item is-' + escapeHtml(String(discovery.type || "note").toLowerCase())
                + '"><div class="discovery-icon" aria-hidden="true">' + escapeHtml(discoveryMarker(discovery.type)) + '</div>'
                + '<div class="progression-item-copy"><div class="progression-item-title"><strong>'
                + escapeHtml(discovery.title || "Находка") + '</strong><span>'
                + escapeHtml(discoveryTypeLabel(discovery.type)) + '</span></div><p>'
                + escapeHtml(discovery.text || "") + '</p><small>'
                + escapeHtml(formatTime(discovery.discoveredAt)) + '</small></div></article>';
        }).join("");
    }

    function renderPlayer() {
        var player = state.player;
        if (!player) {
            return;
        }
        var maxHp = Math.max(1, Number(player.maxHp || 100));
        var hp = Math.max(0, Number(player.hp || 0));
        var resources = player.resources || {};
        elements.hp.textContent = hp + " / " + maxHp;
        elements.hpFill.style.width = Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100))) + "%";
        elements.scrap.textContent = Number(resources.scrap || 0);
        elements.supplies.textContent = Number(resources.supplies || 0);
        elements.resin.textContent = Number(resources.swampResin || 0);
    }

    function renderExploration() {
        var exploration = state.exploration;
        elements.intro.classList.toggle("hidden", Boolean(exploration));
        elements.active.classList.toggle("hidden", !exploration);

        if (!exploration) {
            setMode("На базе", "");
            return;
        }

        var open = exploration.visibilityMode === "OPEN_PVP";
        setMode(open ? "Открытый PvP" : "Скрытно", open ? "is-open" : "is-hidden");
        elements.stepLabel.textContent = "Шаг " + Number(exploration.step || 0)
            + " из " + Number(exploration.maxSteps || 0);
        var chainText = exploration.activeChainId ? "Цепочка: " + chainLabel(exploration.activeChainId) : "";
        if (elements.chainLabel) {
            elements.chainLabel.textContent = chainText;
            elements.chainLabel.classList.toggle("hidden", !chainText);
        }
        elements.collected.textContent = formatResources(
            exploration.collectedResources,
            "В рюкзаке пока пусто"
        );

        var entries = Array.isArray(exploration.journalEntries)
            ? exploration.journalEntries
            : [];
        elements.journal.innerHTML = entries.length
            ? entries.map(renderEntry).join("")
            : '<p class="panel-copy">Первая запись появится после выхода с базы.</p>';

        renderEncounter(exploration.currentEncounter);
        elements.openPvp.classList.toggle("hidden", open);
        elements.step.disabled = Boolean(exploration.currentEncounter)
            || Number(exploration.step || 0) >= Number(exploration.maxSteps || 0);
        elements.step.textContent = exploration.currentEncounter
            ? "Сначала сделай выбор"
            : Number(exploration.step || 0) >= Number(exploration.maxSteps || 0)
                ? "Маршрут завершен"
                : "Идти дальше";

        window.requestAnimationFrame(function () {
            elements.journal.scrollTop = elements.journal.scrollHeight;
        });
    }

    function renderEncounter(encounter) {
        elements.encounter.classList.toggle("hidden", !encounter);
        if (!encounter) {
            elements.choices.innerHTML = "";
            return;
        }
        elements.encounterType.textContent = encounterTypeLabel(encounter.type);
        elements.encounterRisk.textContent = "Риск: " + riskLabel(encounter.risk);
        elements.encounterTitle.textContent = encounter.title || "Событие";
        elements.encounterText.textContent = encounter.text || "";
        var choices = Array.isArray(encounter.choices) ? encounter.choices : [];
        elements.choices.innerHTML = choices.map(function (choice) {
            return '<button class="exploration-choice" type="button" data-exploration-choice="'
                + escapeHtml(choice.id) + '"><span>' + escapeHtml(choice.text)
                + '</span><span>' + escapeHtml(riskLabel(choice.riskLevel)) + '</span></button>';
        }).join("");
    }

    function renderHistory() {
        var currentId = state.exploration ? state.exploration.explorationId : null;
        var past = state.history.filter(function (entry) {
            return !currentId || entry.explorationId !== currentId;
        }).slice(0, 16);
        elements.history.innerHTML = past.length
            ? past.map(renderEntry).join("")
            : '<p class="panel-copy">Завершенных записей пока нет.</p>';
    }

    function renderEntry(entry) {
        var type = String(entry.type || "SYSTEM").toLowerCase().replace(/_/g, "-");
        var metadata = entry.metadata || {};
        var extra = metadata.chainId
            ? '<span class="exploration-entry-meta-chip">цепочка</span>'
            : metadata.mapFragment === "true"
                ? '<span class="exploration-entry-meta-chip">карта</span>'
                : metadata.progressionEffect === "true"
                    ? '<span class="exploration-entry-meta-chip">эффект</span>'
                    : "";
        return '<article class="exploration-entry is-' + escapeHtml(type) + '">'
            + '<span class="exploration-entry-marker" aria-hidden="true">'
            + escapeHtml(entryMarker(entry.type)) + '</span>'
            + '<div class="exploration-entry-copy"><p>' + escapeHtml(entry.text || "") + '</p>'
            + '<div class="exploration-entry-meta"><span>' + escapeHtml(entryTypeLabel(entry.type))
            + '</span>' + extra + '<time datetime="' + escapeHtml(entry.createdAt || "") + '">'
            + escapeHtml(formatTime(entry.createdAt)) + '</time></div></div></article>';
    }

    function renderBusy() {
        [
            elements.startHidden,
            elements.startOpen,
            elements.directPvp,
            elements.step,
            elements.openPvp,
            elements.returnButton
        ].forEach(function (button) {
            if (button) {
                button.disabled = state.busy || (button === elements.step
                    && state.exploration
                    && (Boolean(state.exploration.currentEncounter)
                        || Number(state.exploration.step || 0) >= Number(state.exploration.maxSteps || 0)));
            }
        });
        elements.choices.querySelectorAll("button").forEach(function (button) {
            button.disabled = state.busy;
        });
    }

    function setMode(label, className) {
        elements.mode.textContent = label;
        elements.mode.classList.remove("is-open", "is-hidden");
        if (className) {
            elements.mode.classList.add(className);
        }
    }

    function setStatus(message, isError) {
        if (!message) {
            elements.status.textContent = "";
            elements.status.classList.add("hidden");
            return;
        }
        elements.status.textContent = message;
        elements.status.classList.remove("hidden");
        elements.status.classList.toggle("is-error", Boolean(isError));
    }

    function formatResources(resources, emptyText) {
        var value = resources || {};
        var parts = [];
        if (Number(value.scrap || 0)) {
            parts.push("лом " + Number(value.scrap));
        }
        if (Number(value.supplies || 0)) {
            parts.push("припасы " + Number(value.supplies));
        }
        if (Number(value.swampResin || 0)) {
            parts.push("смола " + Number(value.swampResin));
        }
        return parts.length ? "В рюкзаке: " + parts.join(", ") : emptyText;
    }

    function encounterTypeLabel(type) {
        return {
            OBJECT: "Объект",
            MONSTER: "Существо",
            ANOMALY: "Аномалия",
            LOOT: "Находка",
            MAP_FRAGMENT: "Фрагмент",
            BASE_MEMORY: "Память базы",
            PVP_TRACE: "Чужой след",
            PVP_ENCOUNTER: "Встреча",
            PVP_AFTERMATH: "След стычки",
            RISK_REWARD: "Риск",
            QUIET_EVENT: "Запись"
        }[type] || "Событие";
    }

    function entryTypeLabel(type) {
        return {
            MOVEMENT: "Путь",
            LOOT: "Добыча",
            OBJECT: "Объект",
            MAP_FRAGMENT: "Карта",
            BASE_MEMORY: "Память",
            MONSTER: "Существо",
            ANOMALY: "Аномалия",
            PVP_TRACE: "След",
            PVP_ENCOUNTER: "Стычка",
            PVP_AFTERMATH: "Итог",
            RISK_REWARD: "Риск",
            CHOICE_RESULT: "Выбор",
            SYSTEM: "Система",
            FAILED: "Провал",
            RETURN: "База"
        }[type] || "Запись";
    }

    function chainLabel(chainId) {
        return {
            chain_underwater_sign: "Знак под водой",
            chain_walkway_trace: "След вдоль настила",
            chain_breathing_planks: "Доски дышат",
            chain_old_cordon: "Старая линия кордона",
            chain_journal_voice: "Голос из дневника"
        }[chainId] || chainId;
    }

    function riskLabel(value) {
        return {
            LOW: "низкий",
            MEDIUM: "средний",
            HIGH: "высокий"
        }[value] || String(value || "неизвестен");
    }

    function slotLabel(slot) {
        return {
            WEAPON: "оружие",
            ARMOR: "броня",
            CHARM: "оберег",
            TOOL: "инструмент"
        }[slot] || "предмет";
    }

    function canAfford(resources, cost) {
        var available = resources || {};
        var price = cost || {};
        return Number(available.scrap || 0) >= Number(price.scrap || 0)
            && Number(available.supplies || 0) >= Number(price.supplies || 0)
            && Number(available.swampResin || 0) >= Number(price.swampResin || 0);
    }

    function compactResources(resources) {
        var value = resources || {};
        var parts = [];
        if (Number(value.scrap || 0)) {
            parts.push("⌁" + Number(value.scrap));
        }
        if (Number(value.supplies || 0)) {
            parts.push("▣" + Number(value.supplies));
        }
        if (Number(value.swampResin || 0)) {
            parts.push("◆" + Number(value.swampResin));
        }
        return parts.length ? parts.join(" ") : "без затрат";
    }

    function entryMarker(type) {
        return {
            MOVEMENT: "→",
            LOOT: "+",
            OBJECT: "□",
            MAP_FRAGMENT: "⌁",
            BASE_MEMORY: "≡",
            MONSTER: "!",
            ANOMALY: "◇",
            PVP_TRACE: "≋",
            PVP_ENCOUNTER: "×",
            PVP_AFTERMATH: "∴",
            RISK_REWARD: "!",
            CHOICE_RESULT: "✓",
            SYSTEM: "i",
            FAILED: "×",
            RETURN: "⌂"
        }[type] || "·";
    }

    function discoveryTypeLabel(type) {
        return {
            NOTE: "запись",
            OBJECT: "объект",
            MAP_FRAGMENT: "карта",
            MONSTER_TRACE: "след существа",
            ANOMALY_MARK: "аномалия"
        }[type] || "находка";
    }

    function discoveryMarker(type) {
        return {
            NOTE: "≡",
            OBJECT: "□",
            MAP_FRAGMENT: "⌁",
            MONSTER_TRACE: "!",
            ANOMALY_MARK: "◇"
        }[type] || "·";
    }

    function formatTime(value) {
        var date = value ? new Date(value) : null;
        if (!date || Number.isNaN(date.getTime())) {
            return "только что";
        }
        return date.toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function openDirectPvp() {
        var app = getApp();
        if (app && typeof app.startQueueDuel === "function") {
            app.startQueueDuel();
        }
    }

    function bind() {
        if (elements.helpToggle && elements.helpPanel) {
            elements.helpToggle.addEventListener("click", function () {
                var expanded = elements.helpToggle.getAttribute("aria-expanded") === "true";
                elements.helpToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
                elements.helpPanel.classList.toggle("hidden", expanded);
            });
        }
        elements.startHidden.addEventListener("click", function () {
            startExploration("HIDDEN");
        });
        elements.startOpen.addEventListener("click", function () {
            startExploration("OPEN_PVP");
        });
        elements.directPvp.addEventListener("click", openDirectPvp);
        elements.step.addEventListener("click", takeStep);
        elements.openPvp.addEventListener("click", enableOpenPvp);
        elements.returnButton.addEventListener("click", returnToBase);
        elements.choices.addEventListener("click", function (event) {
            var button = event.target.closest("[data-exploration-choice]");
            if (button) {
                choose(button.getAttribute("data-exploration-choice"));
            }
        });
        elements.progressionTabs.addEventListener("click", function (event) {
            var tab = event.target.closest("[data-progression-view]");
            if (tab) {
                state.progressionView = tab.getAttribute("data-progression-view");
                renderProgression();
            }
        });
        elements.progressionContent.addEventListener("click", function (event) {
            var buy = event.target.closest("[data-buy-upgrade]");
            var equip = event.target.closest("[data-equip-item]");
            var upgrade = event.target.closest("[data-upgrade-item]");
            var route = event.target.closest("[data-select-route]");
            if (buy) {
                buyUpgrade(buy.getAttribute("data-buy-upgrade"));
            } else if (equip) {
                equipItem(equip.getAttribute("data-equipment-slot"), equip.getAttribute("data-equip-item"));
            } else if (upgrade) {
                upgradeItem(upgrade.getAttribute("data-upgrade-item"));
            } else if (route) {
                selectRoute(route.getAttribute("data-select-route"));
            }
        });
    }

    function hasTelegramIdentity() {
        return Boolean(
            window.Telegram
            && window.Telegram.WebApp
            && window.Telegram.WebApp.initData
        );
    }

    async function recoverBrowserSession() {
        if (state.recoveringBrowserSession || hasTelegramIdentity()) {
            return;
        }
        state.recoveringBrowserSession = true;
        try {
            var guestId = "";
            try {
                guestId = window.localStorage.getItem("polus_browser_guest_id") || "";
            } catch (error) {
                guestId = "";
            }
            if (!guestId) {
                guestId = "exploration-" + Date.now().toString(36)
                    + "-" + Math.random().toString(36).slice(2, 10);
            }
            var response = await fetch("/api/player/browser-demo-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fallbackUser: {
                        guestId: guestId,
                        firstName: "Новый игрок",
                        languageCode: navigator.language || "ru"
                    }
                })
            });
            var payload = await response.json();
            if (!response.ok || !payload || !payload.sessionToken || !payload.player) {
                throw new Error(payload && payload.message
                    ? payload.message
                    : "Browser session is unavailable");
            }
            state.browserSessionToken = payload.sessionToken;
            state.browserPlayerId = payload.player.id;
            await loadSnapshot();
        } finally {
            state.recoveringBrowserSession = false;
        }
    }

    function waitForSession(attempt) {
        if (getSessionToken()) {
            loadSnapshot().catch(function (error) {
                var message = error && error.message ? error.message : "Не удалось загрузить дневник.";
                if (/session|сесси/i.test(message) && !hasTelegramIdentity()) {
                    setStatus("Обновляем сессию после перезапуска...", false);
                    recoverBrowserSession().catch(function (recoveryError) {
                        setStatus(
                            recoveryError && recoveryError.message
                                ? recoveryError.message
                                : "Не удалось обновить browser-сессию.",
                            true
                        );
                    });
                    return;
                }
                setStatus(message, true);
            });
            return;
        }
        if (attempt >= 4 && !hasTelegramIdentity()) {
            setStatus("Подключаем браузерный вход...", false);
            recoverBrowserSession().catch(function (error) {
                setStatus(
                    error && error.message ? error.message : "Не удалось открыть browser-сессию.",
                    true
                );
            });
            return;
        }
        if (attempt === 0) {
            setStatus("Подключаем дневник к твоей сессии...", false);
        }
        window.setTimeout(function () {
            waitForSession(attempt + 1);
        }, attempt < 20 ? 250 : 1000);
    }

    bind();
    waitForSession(0);
})();
