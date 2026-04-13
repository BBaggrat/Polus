(function () {
    const STORAGE_KEY = "polus_frontend_prototype_v27";
    const GUEST_ID_KEY = "polus_browser_guest_id";
    const TICK_MS = 1000;
    const FRIEND_SYNC_MS = 15000;
    const JOURNAL_EVENT_MS = 60000;
    const DUEL_ROUND_TIMEOUT_MS = 2 * 60 * 1000;
    const SHIELD_BLOCK_CHANCE = 0.30;
    const SHOTGUN_EDGE_GRAZE_CHANCE = 0.35;
    const SHOTGUN_EDGE_DAMAGE = 5;
    const BATTLE_VICTORY_COINS = 100;
    const BATTLE_DEFEAT_COINS = 25;
    const PVP_RATING_DELTA = 10;
    const CHAT_LINK_PATTERN = /(?:https?:\/\/|www\.|t\.me\/|telegram\.me\/|[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/|\b))/i;
    const JOURNAL_FREQUENCY_WEIGHTS = {
        COMMON: 1,
        DAILY: 0.92,
        RARE: 0.45,
        VERY_RARE: 0.2,
        UNIQUE: 0.08
    };
    const JOURNAL_EVENT_CATALOG = normalizeJournalEventCatalog(window.POLUS_JOURNAL_EVENTS || []);
    const JOURNAL_LOCATION_LABELS = {
        street: "Улица",
        tavern: "Трактир",
        arena: "Арена",
        market: "Рынок"
    };
    const SIMPLE_JOURNAL_EVENTS = [
        "Случайное событие: на крыше снова воет ледяной ветер.",
        "Случайное событие: на рынке заговорили о новой дуэльной площадке.",
        "Случайное событие: соседний генератор пережил еще один морозный цикл.",
        "Случайное событие: кто-то оставил ящик с пустыми гильзами у склада.",
        "Случайное событие: в трактире спорят, кто держит лучшую линию огня.",
        "Случайное событие: механик обещает скоро открыть теплую мастерскую.",
        "Случайное событие: курьер привез свежие вести с южного коридора.",
        "Случайное событие: сторож заметил свет в заброшенном ангаре."
    ];
    const DIRECTION_TERMS = ["по центру", "влево", "вправо"];
    const ITEM_LIBRARY = {
        cartridges38: { id: "cartridges38", name: "Патроны .38", description: "Стандартный боезапас для короткой линии.", pocket: true },
        medkit: { id: "medkit", name: "Аптечка", description: "Полевой набор для быстрого восстановления.", pocket: true, usable: true },
        brassGear: { id: "brassGear", name: "Латунная шестерня", description: "Тяжелая деталь для мастерских заказов." },
        relicBox: { id: "relicBox", name: "Реликварий", description: "Старая коробка с приметами прежнего хозяина." },
        iceToken: { id: "iceToken", name: "Ледяной жетон", description: "Холодный знак доступа к старым секторам.", pocket: true },
        scrapMap: { id: "scrapMap", name: "Схема тоннелей", description: "Смятая карта с безопасными обходами.", pocket: true }
    };
    const QUEST_SCENES = {
        familyRelic: {
            start: {
                subtitle: "РўСЂР°РєС‚РёСЂС‰РёРє РїСЂРѕСЃРёС‚ РІРµСЂРЅСѓС‚СЊ Р·Р°РїРµСЂС‚СѓСЋ С€РєР°С‚СѓР»РєСѓ",
                text: [
                    "РўСЂР°РєС‚РёСЂС‰РёРє РёР· В«РЎРµРІРµСЂРЅРѕРіРѕ Р’РµС‚СЂР°В» РјРЅРµС‚ С„Р°СЂС‚СѓРє Рё С€РµРїС‡РµС‚, С‡С‚Рѕ С„Р°РјРёР»СЊРЅР°СЏ СЂРµР»РёРєРІРёСЏ СЃРЅРѕРІР° СѓС€Р»Р° РЅРµ РІ С‚Рµ СЂСѓРєРё.",
                    "Р•СЃР»Рё РІРµСЂРЅРµС€СЊ С€РєР°С‚СѓР»РєСѓ Р±РµР· Р»РёС€РЅРµРіРѕ С€СѓРјР°, Р±СѓРґРµС‚ РЅР°РіСЂР°РґР°. Р•СЃР»Рё РїРѕР»РµР·РµС€СЊ РІРЅСѓС‚СЂСЊ СЃР°Рј, СЂРёСЃРє Рё С…РѕР»РѕРґ РѕСЃС‚Р°РЅСѓС‚СЃСЏ СЃ С‚РѕР±РѕР№."
                ],
                tags: ["РґРѕР»Рі", "С…РѕР»РѕРґ", "СЃР»СѓС…Рё"],
                choices: [
                    { id: "return-box", label: "Р’РµСЂРЅСѓС‚СЊ С€РєР°С‚СѓР»РєСѓ С‚СЂР°РєС‚РёСЂС‰РёРєСѓ", note: "Р•СЃР»Рё С€РєР°С‚СѓР»РєР° РїРѕРґ СЂСѓРєРѕР№.", requiresItem: "relicBox", consumeItem: "relicBox", rewardMoney: 38, successText: "РЈСЃРїРµС…. РўСЂР°РєС‚РёСЂС‰РёРє РјРѕР»С‡Р° РєРёРІР°РµС‚. +38в‚Ѕ Рё РЅРѕРІР°СЏ РЅР°РІРѕРґРєР° РЅР° СЃРєР»Р°Рґ.", complete: true },
                    { id: "open-box", label: "Р’СЃРєСЂС‹С‚СЊ С€РєР°С‚СѓР»РєСѓ РјРѕРЅРµС‚РѕР№", note: "РЁР°РЅСЃ 50%.", chance: 0.5, successGoto: "opened", failText: "РџСЂРѕРІР°Р». Р—Р°РјРѕРє С…СЂСѓСЃС‚РёС‚ СЃР»РёС€РєРѕРј РіСЂРѕРјРєРѕ, С€СѓРј РїРѕРґРЅРёРјР°РµС‚СЃСЏ, -6в‚Ѕ РЅР° РѕС‚РјС‹С‡РєРё.", penaltyMoney: 6 }
                ]
            },
            opened: {
                subtitle: "Р’РЅСѓС‚СЂРё СЃС‚СѓС‡РёС‚ С‡С‚Рѕ-С‚Рѕ РјРµС‚Р°Р»Р»РёС‡РµСЃРєРѕРµ",
                text: [
                    "РљСЂС‹С€РєР° РїРѕРґРґР°РµС‚СЃСЏ, Рё РёР· Р±Р°СЂС…Р°С‚Р° РІС‹РєР°С‚С‹РІР°РµС‚СЃСЏ Р»РµРґСЏРЅРѕР№ Р¶РµС‚РѕРЅ. РќР° РѕР±СЂР°С‚РЅРѕР№ СЃС‚РѕСЂРѕРЅРµ РІС‹Р±РёС‚ РЅРѕРјРµСЂ СЃРєР»Р°РґР°.",
                    "РњРѕР¶РЅРѕ Р·Р°Р±СЂР°С‚СЊ РЅР°С…РѕРґРєСѓ СЃРµР±Рµ РёР»Рё РІСЃРµ-С‚Р°РєРё РѕС‚РЅРµСЃС‚Рё РµРµ С…РѕР·СЏРёРЅСѓ Рё СЃС‹РіСЂР°С‚СЊ РІ РґРѕР»РіСѓСЋ."
                ],
                tags: ["СѓРґР°С‡Р°", "Р¶Р°РґРЅРѕСЃС‚СЊ", "С‚РёС…РёР№ СЃРєСЂРёРї"],
                choices: [
                    { id: "keep-token", label: "Р—Р°Р±СЂР°С‚СЊ Р¶РµС‚РѕРЅ СЃРµР±Рµ", note: "РџРѕР»СѓС‡РёС€СЊ РЅРѕРІС‹Р№ РїСЂРµРґРјРµС‚ Рё РЅРµРјРЅРѕРіРѕ РґРµРЅРµРі.", rewardMoney: 12, rewardItem: "iceToken", successText: "РќР°С…РѕРґРєР°. +12в‚Ѕ Рё Р»РµРґСЏРЅРѕР№ Р¶РµС‚РѕРЅ СѓС…РѕРґРёС‚ РІ РєР°СЂРјР°РЅ.", complete: true },
                    { id: "bring-token", label: "РћС‚РЅРµСЃС‚Рё РЅР°С…РѕРґРєСѓ С‚СЂР°РєС‚РёСЂС‰РёРєСѓ", note: "РњРµРЅСЊС€Рµ СЂРёСЃРєР°, Р±РѕР»СЊС€Рµ РґРѕРІРµСЂРёСЏ.", rewardMoney: 26, successText: "РЈСЃРїРµС…. РўСЂР°РєС‚РёСЂС‰РёРє РІС‹РґР°РµС‚ +26в‚Ѕ Рё РѕР±РµС‰Р°РµС‚ РїРѕРјРЅРёС‚СЊ СѓСЃР»СѓРіСѓ.", complete: true }
                ]
            }
        },
        brassDisease: {
            start: {
                subtitle: "РњРµС…Р°РЅРёРє РїСЂРѕСЃРёС‚ РїСЂРёРЅРµСЃС‚Рё С€РµСЃС‚РµСЂРЅСЋ",
                text: [
                    "РњРµС…Р°РЅРёРє С‚СЂРµС‚ РїР°Р»СЊС†Р°РјРё Р»Р°С‚СѓРЅРЅСѓСЋ РїС‹Р»СЊ. Р•РіРѕ Р°РІС‚РѕРјР°С‚ С‰РµР»РєР°РµС‚ Рё РіР»РѕС…РЅРµС‚.",
                    "РџСЂРёРЅРµСЃРё С€РµСЃС‚РµСЂРЅСЋ. РР»Рё РЅР°Р№РґРё, С‡РµРј Р·Р°РјРµРЅРёС‚СЊ. РўСѓС‚ РІР°Р¶РЅС‹ РїСЂРµРґРјРµС‚С‹, СЂРёСЃРє Рё Р±С‹СЃС‚СЂС‹Рµ СЂРµС€РµРЅРёСЏ."
                ],
                tags: ["СЂРёСЃРє", "С€СѓРј", "Р»Р°С‚СѓРЅСЊ"],
                choices: [
                    { id: "give-gear", label: "РћС‚РґР°С‚СЊ С€РµСЃС‚РµСЂРЅСЋ", note: "Р•СЃР»Рё РµСЃС‚СЊ Р»Р°С‚СѓРЅРЅР°СЏ С€РµСЃС‚РµСЂРЅСЏ.", requiresItem: "brassGear", consumeItem: "brassGear", rewardMoney: 27, successText: "РЈСЃРїРµС…. РђРІС‚РѕРјР°С‚ РѕР¶РёРІР°РµС‚, Р° РјР°СЃС‚РµСЂСЃРєР°СЏ РїР»Р°С‚РёС‚ +27в‚Ѕ.", complete: true },
                    { id: "coin-fix", label: "РџРѕРїСЂРѕР±РѕРІР°С‚СЊ В«РєРѕР»С…РѕР·В» РёР· РјРѕРЅРµС‚С‹", note: "РЁР°РЅСЃ 50%.", chance: 0.5, successGoto: "jury-rigged", failText: "РџСЂРѕРІР°Р». РСЃРєСЂР° СЂРµР¶РµС‚ РїР°Р»СЊС†С‹, РјРµС…Р°РЅРёР·Рј РїР»СЋРµС‚СЃСЏ, -8в‚Ѕ РЅР° Р±РёРЅС‚С‹.", penaltyMoney: 8 }
                ]
            },
            "jury-rigged": {
                subtitle: "РњРѕРЅРµС‚Р° РґРµСЂР¶РёС‚ Р·СѓР±С†С‹ РЅР° С‡РµСЃС‚РЅРѕРј СЃР»РѕРІРµ",
                text: [
                    "РЎР°РјРѕРґРµР»СЊРЅР°СЏ РІСЃС‚Р°РІРєР° РЅРµРѕР¶РёРґР°РЅРЅРѕ С†РµРїР»СЏРµС‚ РІР°Р». РњР°С€РёРЅР° РєР°С€Р»СЏРµС‚, РЅРѕ Р·Р°РІРѕРґРёС‚СЃСЏ.",
                    "РњРµС…Р°РЅРёРє РјРѕР¶РµС‚ РѕСЃС‚Р°РІРёС‚СЊ С‚РµР±СЏ РІ РґРѕР»РіСѓ РёР»Рё РѕС‚СЃС‹РїР°С‚СЊ РјРµР»РѕС‡Рё СЃСЂР°Р·Сѓ."
                ],
                tags: ["СѓРґР°С‡Р°", "РіСЂСЏР·РЅР°СЏ СЂР°Р±РѕС‚Р°", "С‚РµРїР»С‹Р№ РјРµС‚Р°Р»Р»"],
                choices: [
                    { id: "take-cash", label: "Р’Р·СЏС‚СЊ РѕРїР»Р°С‚Сѓ СЃСЂР°Р·Сѓ", note: "РќРµР±РѕР»СЊС€Р°СЏ, РЅРѕ Р±С‹СЃС‚СЂР°СЏ РЅР°РіСЂР°РґР°.", rewardMoney: 18, successText: "РќР°С…РѕРґРєР° РІ Р»Р°РґРѕРЅРё: +18в‚Ѕ Р·Р° Р±С‹СЃС‚СЂС‹Р№ СЂРµРјРѕРЅС‚.", complete: true },
                    { id: "ask-favor", label: "РџРѕРїСЂРѕСЃРёС‚СЊ СѓСЃР»СѓРіСѓ РїРѕР·Р¶Рµ", note: "РњР°СЃС‚РµСЂСЃРєР°СЏ РѕС‚РґР°РµС‚ РєР°СЂС‚Сѓ Р»СЊРґР°.", rewardItem: "scrapMap", successText: "РЈСЃРїРµС…. Р’РјРµСЃС‚Рѕ РґРµРЅРµРі С‚С‹ РїРѕР»СѓС‡Р°РµС€СЊ РјСЏС‚СѓСЋ РєР°СЂС‚Сѓ Р»СЊРґР°.", complete: true }
                ]
            }
        },
        signalE3: {
            start: {
                subtitle: "РќР° Р»СЊРґСѓ РјРёРіР°РµС‚ СЃС‚Р°СЂС‹Р№ РјР°СЏРє",
                text: [
                    "РЎРёРіРЅР°Р» E3 РїСЂРѕСЂС‹РІР°РµС‚СЃСЏ С‡РµСЂРµР· РІРµС‚РµСЂ РєРѕСЂРѕС‚РєРёРјРё СЂС‹РІРєР°РјРё. Р“РґРµ-С‚Рѕ РІРїРµСЂРµРґРё Р»РµР¶РёС‚ РєРѕРЅС‚РµР№РЅРµСЂ РёР»Рё С‡СЊСЏ-С‚Рѕ Р»РѕРІСѓС€РєР°.",
                    "РњРѕР¶РЅРѕ РёРґС‚Рё РїСЂСЏРјРѕ РЅР° С€СѓРј РёР»Рё РїСЂРёРіР»СѓС€РёС‚СЊ С€Р°Рі Р°РїС‚РµС‡РєРѕР№ Рё СЃРґРµР»Р°С‚СЊ РІРёРґ, С‡С‚Рѕ РІСЃРµ РїРѕРґ РєРѕРЅС‚СЂРѕР»РµРј."
                ],
                tags: ["С…РѕР»РѕРґ", "СЂРёСЃРє", "С€Р°РЅСЃ"],
                choices: [
                    { id: "go-straight", label: "РРґС‚Рё РЅР° СЃР»Р°Р±С‹Р№ СЃРёРіРЅР°Р»", note: "РЁР°РЅСЃ 65%.", chance: 0.65, successText: "РќР°С…РѕРґРєР°. РџРѕРґ СЃРЅРµРіРѕРј РєРѕРЅС‚РµР№РЅРµСЂ. РЈСЃРїРµС… Рё +34в‚Ѕ.", failText: "РџСЂРѕРІР°Р». РЎРёРіРЅР°Р» СѓРІРѕРґРёС‚ РІ РїСѓСЃС‚РѕР№ РєР°СЂРјР°РЅ Р»СЊРґР°, -5в‚Ѕ РЅР° РґРѕСЂРѕРіСѓ РѕР±СЂР°С‚РЅРѕ.", rewardMoney: 34, penaltyMoney: 5, complete: true },
                    { id: "dash-gap", label: "Р РІР°РЅСѓС‚СЊ С‡РµСЂРµР· РѕС‚РєСЂС‹С‚С‹Р№ Р»С‘Рґ", note: "РќСѓР¶РЅР° СЂРµР°РєС†РёСЏ 1.", requiresStat: "reaction", requiresStatValue: 1, rewardMoney: 16, successText: "Р РµР°РєС†РёСЏ СЃРїР°СЃР°РµС‚ С‚РµРјРї. РўС‹ СѓСЃРїРµРІР°РµС€СЊ Рє СЏС‰РёРєСѓ Рё Р·Р°Р±РёСЂР°РµС€СЊ +16в‚Ѕ.", complete: true },
                    { id: "quiet-steps", label: "РџРѕРґР°РІРёС‚СЊ С€СѓРј Р°РїС‚РµС‡РєРѕР№", note: "Р•СЃР»Рё Р°РїС‚РµС‡РєР° РїРѕРґ СЂСѓРєРѕР№.", requiresItem: "medkit", consumeItem: "medkit", successGoto: "quiet-route" }
                ]
            },
            "quiet-route": {
                subtitle: "РЎРЅРµРі РІРµРґРµС‚ Рє СЃС‚Р°СЂРѕРјСѓ РєР°Р±РµР»СЋ",
                text: [
                    "РЎС‚РёРј РіСЂРµРµС‚ СЂРµР±СЂР°, С€Р°Рі СЃС‚Р°РЅРѕРІРёС‚СЃСЏ СЂРѕРІРЅРµРµ. РџРѕРґ РєРѕСЂРєРѕР№ Р»СЊРґР° РІРёРґРµРЅ РєР°Р±РµР»СЊ, СѓС…РѕРґСЏС‰РёР№ Рє СЃР»СѓР¶РµР±РЅРѕРјСѓ Р»СЋРєСѓ.",
                    "Р›СЋРє РјРѕР¶РЅРѕ РІСЃРєСЂС‹С‚СЊ СЃР°РјРѕРјСѓ РёР»Рё РїСЂРѕСЃС‚Рѕ СЃРЅСЏС‚СЊ РїРѕРєР°Р·Р°РЅРёСЏ Рё СѓР№С‚Рё Р±РµР· С€СѓРјР°."
                ],
                tags: ["СѓРґР°С‡Р°", "С‚РёС€РёРЅР°", "Р»РµРґСЏРЅРѕР№ РїР°СЂ"],
                choices: [
                    { id: "open-hatch", label: "Р’СЃРєСЂС‹С‚СЊ Р»СЋРє", note: "РџРѕР»СѓС‡РёС€СЊ РєР°СЂС‚Сѓ Рё РґРµРЅСЊРіРё.", rewardMoney: 20, rewardItem: "scrapMap", successText: "РЈСЃРїРµС…. Р’РЅСѓС‚СЂРё РєР°СЂС‚Р° Р»СЊРґР° Рё +20в‚Ѕ Р·Р° СЃС‚Р°СЂС‹Рµ Р¶РµС‚РѕРЅС‹.", complete: true },
                    { id: "leave-mark", label: "РЎРЅСЏС‚СЊ РїРѕРєР°Р·Р°РЅРёСЏ Рё СѓР№С‚Рё", note: "Р§СѓС‚СЊ РјРµРЅСЊС€Рµ РЅР°РіСЂР°РґС‹, РјРµРЅСЊС€Рµ С€СѓРјР°.", rewardMoney: 14, successText: "РЎРїРѕРєРѕР№РЅР°СЏ РЅР°С…РѕРґРєР°. +14в‚Ѕ Рё РїРѕС‡С‚Рё РЅРёРєР°РєРѕРіРѕ С€СѓРјР°.", complete: true }
                ]
            }
        },
        frostDebt: {
            start: {
                subtitle: "РќР° РґРІРµСЂРё СЃРєР»Р°РґР° РІРёСЃРёС‚ СЃРІРµР¶Р°СЏ РјРµС‚РєР°",
                text: [
                    "РљС‚Рѕ-С‚Рѕ РѕСЃС‚Р°РІРёР» РЅР° РґРІРµСЂРё СЃРєР»Р°РґР° СЂР¶Р°РІС‹Р№ РіРІРѕР·РґСЊ СЃ Р·Р°РїРёСЃРєРѕР№: В«Р•СЃР»Рё СЃР»С‹С€РёС€СЊ СЃРєСЂРёРї, С‚С‹ СѓР¶Рµ РѕРїРѕР·РґР°Р»В».",
                    "РњРѕР¶РЅРѕ СЃСѓРЅСѓС‚СЊСЃСЏ РІРЅСѓС‚СЂСЊ СЃСЂР°Р·Сѓ РёР»Рё РїРµСЂРµР¶РґР°С‚СЊ, РїРѕРєР° РІРµС‚РµСЂ СЃСЉРµСЃС‚ СЃР»РµРґС‹."
                ],
                tags: ["СЃР»СѓС…Рё", "РјРѕСЂРѕР·", "РЅРµСѓРІРµСЂРµРЅРЅРѕСЃС‚СЊ"],
                choices: [
                    { id: "rush-in", label: "Р—Р°Р№С‚Рё СЃСЂР°Р·Сѓ", note: "РЁР°РЅСЃ 45%.", chance: 0.45, rewardMoney: 29, failText: "РџСЂРѕРІР°Р». Р’РЅСѓС‚СЂРё РїСѓСЃС‚Рѕ, Р° РґРѕР»Рі С‚РѕР»СЊРєРѕ СЂР°СЃС‚РµС‚. -7в‚Ѕ.", penaltyMoney: 7, successText: "РЈСЃРїРµС…. Р’ СѓРіР»Сѓ Р»РµР¶РёС‚ С‡СѓР¶РѕР№ С‚Р°Р№РЅРёРє. +29в‚Ѕ.", complete: true },
                    { id: "break-door", label: "Р’С‹Р»РѕРјР°С‚СЊ РґРІРµСЂСЊ СЃРёР»РѕР№", note: "РќСѓР¶РЅР° СЃРёР»Р° 1.", requiresStat: "strength", requiresStatValue: 1, rewardMoney: 24, successText: "РЎРёР»Р° СЂРµС€Р°РµС‚ РІРѕРїСЂРѕСЃ Р±С‹СЃС‚СЂРѕ. Р”РІРµСЂСЊ СЃРґР°С‘С‚СЃСЏ, Р° РІ С‚Р°Р№РЅРёРєРµ Р»РµР¶Р°С‚ +24в‚Ѕ.", complete: true },
                    { id: "find-key", label: "РћСЃРјРѕС‚СЂРµС‚СЊ РјРµС‚РєСѓ Рё РЅР°Р№С‚Рё РєР»СЋС‡", note: "РќСѓР¶РµРЅ Р°РЅР°Р»РёР· 1.", requiresStat: "analysis", requiresStatValue: 1, rewardItem: "iceToken", successText: "РђРЅР°Р»РёР· С†РµРїР»СЏРµС‚ РјРµР»РѕС‡СЊ РЅР° РєРѕСЃСЏРєРµ. РЎРїСЂСЏС‚Р°РЅРЅС‹Р№ РєР»СЋС‡ РІРµРґРµС‚ Рє Р¶РµС‚РѕРЅСѓ.", complete: true },
                    { id: "wait-out", label: "РџРµСЂРµР¶РґР°С‚СЊ РІРµС‚РµСЂ", note: "Р‘РµР·РѕРїР°СЃРЅРµРµ, РЅРѕ РјРµРґР»РµРЅРЅРµРµ.", rewardMoney: 11, successText: "РЎРїРѕРєРѕР№РЅС‹Р№ С…РѕРґ. Р’РµС‚РµСЂ СѓРЅРѕСЃРёС‚ С€СѓРј, Рё С‚С‹ Р·Р°Р±РёСЂР°РµС€СЊ +11в‚Ѕ.", complete: true }
                ]
            }
        }
    };
    const DUEL_WEAPONS = {
        PISTOLS: { label: "РџРёСЃС‚РѕР»СЊ Рё С‰РёС‚", damage: 18, blockChance: 0.30 },
        RIFLE: { label: "Р’РёРЅС‚РѕРІРєР°", damage: 30, blockChance: 0 },
        SHOTGUN: { label: "Р”СЂРѕР±РѕРІРёРє", damage: 25, blockChance: 0 }
    };
    const AUGMENT_SLOTS = [
        { id: "weapon", title: "РћСЂСѓР¶РµР№РЅР°СЏ", hint: "Р”Р°С‘С‚ Р±РѕРЅСѓСЃ Рє С‚РѕС‡РЅРѕСЃС‚Рё РёР»Рё СѓСЂРѕРЅСѓ." },
        { id: "defense", title: "Р—Р°С‰РёС‚РЅР°СЏ", hint: "РЎРЅРёР¶Р°РµС‚ РІС…РѕРґСЏС‰РёР№ СѓСЂРѕРЅ Рё СѓСЃРёР»РёРІР°РµС‚ РІС‹Р¶РёРІР°РЅРёРµ." },
        { id: "support", title: "Р’СЃРїРѕРјРѕРіР°С‚РµР»СЊРЅР°СЏ", hint: "Р”Р°С‘С‚ СѓРІРѕСЂРѕС‚, СЂРµРіРµРЅ РёР»Рё С‚Р°РєС‚РёС‡РµСЃРєРёР№ Р±РѕРЅСѓСЃ." }
    ];
    const AUGMENT_LIBRARY = {
        weaponBrassSights: {
            id: "weaponBrassSights",
            slot: "weapon",
            name: "Р›Р°С‚СѓРЅРЅС‹Р№ РїСЂРёС†РµР»",
            description: "РўРµРїР»Р°СЏ РјСѓС€РєР° РЅРµ РіСѓР»СЏРµС‚ РЅР° РјРѕСЂРѕР·Рµ Рё РґРµСЂР¶РёС‚ Р»РёРЅРёСЋ СЂРѕРІРЅРµРµ.",
            effectLabel: "-8% Рє С€Р°РЅСЃСѓ Р±Р»РѕРєР° С‰РёС‚РѕРј",
            hitChanceBonus: 0.08,
            weapons: ["PISTOLS", "RIFLE"]
        },
        weaponDoubleTap: {
            id: "weaponDoubleTap",
            slot: "weapon",
            name: "РЈСЃРёР»РµРЅРЅС‹Р№ СѓРґР°СЂРЅРёРє",
            description: "РџР»РѕС‚РЅС‹Р№ СѓРґР°СЂ РґРµР»Р°РµС‚ РїРёСЃС‚РѕР»СЊ Р·Р»РµРµ РІ РїСЂСЏРјРѕР№ Р»РёРЅРёРё.",
            effectLabel: "+4 СѓСЂРѕРЅР° РґР»СЏ РїРёСЃС‚РѕР»СЏ",
            damageBonus: 4,
            weapons: ["PISTOLS"]
        },
        weaponPiercingCore: {
            id: "weaponPiercingCore",
            slot: "weapon",
            name: "Р‘СЂРѕРЅРµР±РѕР№РЅС‹Р№ СЃРµСЂРґРµС‡РЅРёРє",
            description: "РџСЂРѕС€РёРІР°РµС‚ С‰РёС‚РѕРІРѕР№ Р±Р»РѕРє Рё РґР°РІРёС‚ Р»РёРЅРёСЋ РЅР°РїСЂРѕР»РѕРј.",
            effectLabel: "РРіРЅРѕСЂРёСЂСѓРµС‚ Р±Р»РѕРєРёСЂРѕРІР°РЅРёРµ С‰РёС‚РѕРј",
            ignoreBlocking: true,
            weapons: ["PISTOLS", "RIFLE", "SHOTGUN"]
        },
        weaponScatterNozzle: {
            id: "weaponScatterNozzle",
            slot: "weapon",
            name: "Р Р°СЃС€РёСЂРёС‚РµР»СЊ РґСЂРѕР±Рё",
            description: "Р”СЂРѕР±РѕРІРёРє С†РµРїР»СЏРµС‚ РїРѕ РєСЂР°СЋ С‡Р°С‰Рµ, РѕСЃРѕР±РµРЅРЅРѕ РЅР° Р±Р»РёР¶РЅРµР№ Р»РёРЅРёРё.",
            effectLabel: "+12% Рє С€Р°РЅСЃСѓ Р·Р°С†РµРїР° РґСЂРѕР±РѕРІРёРєР°",
            grazeChanceBonus: 0.12,
            weapons: ["SHOTGUN"]
        },
        defensePlating: {
            id: "defensePlating",
            slot: "defense",
            name: "Р›Р°С‚СѓРЅРЅС‹Рµ РїР»Р°СЃС‚РёРЅС‹",
            description: "РЎС‚Р°РІРєР° РЅР° РјР°СЃСЃСѓ: Р±СЂРѕРЅСЏ РіР°СЃРёС‚ С‡Р°СЃС‚СЊ РїСЂСЏРјРѕРіРѕ РїРѕРїР°РґР°РЅРёСЏ.",
            effectLabel: "-4 РІС…РѕРґСЏС‰РµРіРѕ СѓСЂРѕРЅР°",
            damageReduction: 4
        },
        defenseHeatSink: {
            id: "defenseHeatSink",
            slot: "defense",
            name: "РўРµРїР»РѕРѕС‚РІРѕРґ",
            description: "РџРµСЂРµРЅРѕСЃРёС‚ Р¶Р°СЂ РїРѕРґ РєСѓСЂС‚РєСѓ Рё РґР°С‘С‚ РґРµСЂР¶Р°С‚СЊ РґР»РёРЅРЅС‹Р№ Р±РѕР№.",
            effectLabel: "+10 СЃС‚Р°СЂС‚РѕРІРѕРіРѕ HP",
            startHpBonus: 10
        },
        defenseColdMesh: {
            id: "defenseColdMesh",
            slot: "defense",
            name: "РҐР»Р°РґРѕСЃС‚РѕР№РєР°СЏ СЃРµС‚РєР°",
            description: "РЈРїСЂСѓРіР°СЏ РїСЂРѕСЃР»РѕР№РєР° СЃСЉРµРґР°РµС‚ СЃРєРѕР»СЊР·СЏС‰РёРµ РїРѕРїР°РґР°РЅРёСЏ Рё РјРµР»РєРёРµ РѕСЃРєРѕР»РєРё.",
            effectLabel: "-2 СѓСЂРѕРЅР° РґР°Р¶Рµ РѕС‚ Р·Р°С†РµРїР°",
            damageReduction: 2,
            grazeReduction: 2
        },
        supportSidestep: {
            id: "supportSidestep",
            slot: "support",
            name: "РЎРµСЂРІРѕРїСЂРёРІРѕРґ СѓРІРѕСЂРѕС‚Р°",
            description: "РџСЂСѓР¶РёРЅР° РїРѕРґ РєРѕР»РµРЅРѕРј РёРЅРѕРіРґР° СЃСЂС‹РІР°РµС‚ СѓР¶Рµ РїРѕР№РјР°РЅРЅСѓСЋ Р»РёРЅРёСЋ.",
            effectLabel: "10% С€Р°РЅСЃ СЃРѕСЂРІР°С‚СЊ РїСЂСЏРјРѕРµ РїРѕРїР°РґР°РЅРёРµ",
            evadeChance: 0.1
        },
        supportStimLoop: {
            id: "supportStimLoop",
            slot: "support",
            name: "РЎС‚РёРј-РєРѕРЅС‚СѓСЂ",
            description: "Р—Р°РјРєРЅСѓС‚С‹Р№ РІРїСЂС‹СЃРє РІРѕР·РІСЂР°С‰Р°РµС‚ РґС‹С…Р°РЅРёРµ РїРѕСЃР»Рµ РєР°Р¶РґРѕРіРѕ СЂР°СѓРЅРґР°.",
            effectLabel: "+4 HP РїРѕСЃР»Рµ РєР°Р¶РґРѕРіРѕ СЂР°СѓРЅРґР°",
            regenPerRound: 4
        },
        supportTargetLink: {
            id: "supportTargetLink",
            slot: "support",
            name: "РЎРІСЏР·РєР° РјРµС‚РѕРє",
            description: "Р¦РµРЅС‚СЂР°Р»СЊРЅР°СЏ Р»РёРЅРёСЏ С‡РёС‚Р°РµС‚СЃСЏ Р±С‹СЃС‚СЂРµРµ, РµСЃР»Рё РґРѕРІРµСЂРёС‚СЊСЃСЏ РґР°С‚С‡РёРєР°Рј.",
            effectLabel: "-4% Рє Р±Р»РѕРєСѓ РїРѕ С†РµРЅС‚СЂСѓ",
            centerHitBonus: 0.04
        }
    };
    const POSITIVE_MARKERS = [/\+\d+\sРјРѕРЅРµС‚/gi, /\+\d+\sHP/gi];
    const NEGATIVE_MARKERS = [/-\d+\sРјРѕРЅРµС‚/gi, /РїСЂРѕРјР°С…/gi, /РїСЂРѕРІР°Р»/gi, /РїРѕСЂР°Р¶РµРЅРё[РµСЏ]/gi, /РЅРµ С…РІР°С‚Р°РµС‚/gi, /РёСЃС‚[РµС‘]Рє/gi, /РїРѕС‚РµСЂ[СЏРё]/gi, /Р·Р°Рј[РµС‘]СЂР·/gi, /СЂР°РЅ[Р°Рµ]РЅ/gi, /С€СѓРј/gi, /СЃРѕСЂРІР°РЅ/gi, /РїСѓСЃС‚Рѕ/gi];
    const elements = {};
    let state = hydrateState(loadState());
    let toastTimer = null;
    let liveSyncPending = false;
    let friendSyncPending = false;
    const RUBLE_SIGN = "\u20BD";
    const DUEL_DEFAULT_NOTE = "РџСЂР°РІРёР»Рѕ: РїРѕРїР°РґР°РЅРёРµ РїСЂРѕС…РѕРґРёС‚, РµСЃР»Рё Р»РёРЅРёСЏ РІС‹СЃС‚СЂРµР»Р° СЃРѕРІРїР°Р»Р° СЃ Р»РёРЅРёРµР№ СѓРІРѕСЂРѕС‚Р° СЃРѕРїРµСЂРЅРёРєР°.";

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    async function init() {
        try {
            cacheElements();
            bindEvents();
            exposeGlobalActions();
            hydrateTelegram();
            await initializeSession();
            renderAll();
            window.setInterval(onTick, TICK_MS);
        } catch (error) {
            console.error("Polus init failed", error);
            const toast = document.getElementById("toast");
            if (toast) {
                toast.textContent = "РћС€РёР±РєР° РёРЅРёС†РёР°Р»РёР·Р°С†РёРё РёРЅС‚РµСЂС„РµР№СЃР°. РћР±РЅРѕРІРё Mini App.";
                toast.classList.remove("hidden");
            }
        }
    }

    function cacheElements() {
        elements.profileAvatar = document.getElementById("profile-avatar");
        elements.profileName = document.getElementById("profile-name");
        elements.profileLevel = document.getElementById("profile-level");
        elements.profileLevelProgressFill = document.getElementById("profile-level-progress-fill");
        elements.profileLevelProgressText = document.getElementById("profile-level-progress-text");
        elements.profileMoney = document.getElementById("profile-money");
        elements.statPointsBadge = document.getElementById("stat-points-badge");
        elements.heroStats = document.getElementById("hero-stats");
        elements.queueStatusCard = document.getElementById("queue-status-card");
        elements.queueStatusTime = document.getElementById("queue-status-time");
        elements.queueStatusNote = document.getElementById("queue-status-note");
        elements.queueCancelButton = document.getElementById("queue-cancel-button");
        elements.questBadge = document.getElementById("quest-badge");
        elements.questCounter = document.getElementById("quest-counter");
        elements.shopMoney = document.getElementById("shop-money");
        elements.registrationModal = document.getElementById("registration-modal");
        elements.registrationCopy = document.getElementById("registration-copy");
        elements.registrationForm = document.getElementById("registration-form");
        elements.registrationNickname = document.getElementById("registration-nickname");
        elements.registrationError = document.getElementById("registration-error");
        elements.registrationSubmit = document.getElementById("registration-submit");
        elements.journalList = document.getElementById("journal-list");
        elements.journalZone = document.getElementById("journal-zone");
        elements.questList = document.getElementById("quest-list");
        elements.questDetailTitle = document.getElementById("quest-detail-title");
        elements.questDetailSubtitle = document.getElementById("quest-detail-subtitle");
        elements.questStoryText = document.getElementById("quest-story-text");
        elements.questChoiceList = document.getElementById("quest-choice-list");
        elements.questStateTags = document.getElementById("quest-state-tags");
        elements.questStateCount = document.getElementById("quest-state-count");
        elements.questPocketList = document.getElementById("quest-pocket-list");
        elements.questPocketCount = document.getElementById("quest-pocket-count");
        elements.inventoryPlaceholder = document.getElementById("inventory-placeholder");
        elements.friendList = document.getElementById("friend-list");
        elements.friendRequestBadge = document.getElementById("friend-request-badge");
        elements.friendSearchForm = document.getElementById("friend-search-form");
        elements.friendSearchInput = document.getElementById("friend-search-input");
        elements.friendRequestPanel = document.getElementById("friend-request-panel");
        elements.socialChatFab = document.getElementById("social-chat-fab");
        elements.socialChatFabBadge = document.getElementById("social-chat-fab-badge");
        elements.socialChatPanel = document.getElementById("social-chat-panel");
        elements.socialChatThreadList = document.getElementById("social-chat-thread-list");
        elements.socialChatThreadTitle = document.getElementById("social-chat-thread-title");
        elements.socialChatMessages = document.getElementById("social-chat-messages");
        elements.socialChatForm = document.getElementById("social-chat-form");
        elements.socialChatInput = document.getElementById("social-chat-input");
        elements.socialChatSend = document.getElementById("social-chat-send");
        elements.shopList = document.getElementById("shop-list");
        elements.premiumWorkBanner = document.getElementById("premium-work-banner");
        elements.shopTabs = document.getElementById("shop-tabs");
        elements.shopTabButtons = Array.from(document.querySelectorAll("[data-shop-section]"));
        elements.toast = document.getElementById("toast");
        elements.augmentModal = document.getElementById("augment-modal");
        elements.augmentModalTitle = document.getElementById("augment-modal-title");
        elements.augmentModalList = document.getElementById("augment-modal-list");
        elements.duelExitModal = document.getElementById("duel-exit-modal");
        elements.startDuelModal = document.getElementById("start-duel-modal");
        elements.startDuelTitle = document.getElementById("start-duel-title");
        elements.startDuelCopy = document.getElementById("start-duel-copy");
        elements.startDuelCancelButton = document.getElementById("start-duel-cancel");
        elements.startDuelConfirmButton = document.getElementById("start-duel-confirm");
        elements.duelExitCancelButton = document.getElementById("duel-exit-cancel");
        elements.duelExitConfirmButton = document.getElementById("duel-exit-confirm");
        elements.duelResultModal = document.getElementById("duel-result-modal");
        elements.duelResultTitle = document.getElementById("duel-result-title");
        elements.duelResultCopy = document.getElementById("duel-result-copy");
        elements.duelResultExp = document.getElementById("duel-result-exp");
        elements.duelResultMoney = document.getElementById("duel-result-money");
        elements.duelOverlay = document.getElementById("duel-overlay");
        elements.duelTitle = document.getElementById("duel-title");
        elements.duelRoundPill = document.getElementById("duel-round-pill");
        elements.duelRoundTimer = document.getElementById("duel-round-timer");
        elements.duelYouName = document.getElementById("duel-you-name");
        elements.duelYouMeta = document.getElementById("duel-you-meta");
        elements.duelYouAvatar = document.getElementById("duel-you-avatar");
        elements.duelOpponentName = document.getElementById("duel-opponent-name");
        elements.duelOpponentMeta = document.getElementById("duel-opponent-meta");
        elements.duelOpponentAvatar = document.getElementById("duel-opponent-avatar");
        elements.duelYouFill = document.getElementById("duel-you-fill");
        elements.duelOpponentFill = document.getElementById("duel-opponent-fill");
        elements.duelYouHp = document.getElementById("duel-you-hp");
        elements.duelOpponentHp = document.getElementById("duel-opponent-hp");
        elements.duelRoundStatus = document.getElementById("duel-round-status");
        elements.duelLogList = document.getElementById("duel-log-list");
        elements.duelLogsPane = document.getElementById("duel-logs-pane");
        elements.duelChatPane = document.getElementById("duel-chat-pane");
        elements.duelTabLogs = document.getElementById("duel-tab-logs");
        elements.duelTabChat = document.getElementById("duel-tab-chat");
        elements.duelChatList = document.getElementById("duel-chat-list");
        elements.duelChatForm = document.getElementById("duel-chat-form");
        elements.duelChatInput = document.getElementById("duel-chat-input");
        elements.duelChatSendButton = document.getElementById("duel-chat-send-button");
        elements.duelChatError = document.getElementById("duel-chat-error");
        elements.duelForm = document.getElementById("duel-form");
        elements.duelWeaponSelect = document.getElementById("duel-weapon-select");
        elements.duelShotSelect = document.getElementById("duel-shot-select");
        elements.duelDodgeSelect = document.getElementById("duel-dodge-select");
        elements.duelSubmitButton = document.getElementById("duel-submit-button");
        elements.duelAutoToggle = document.getElementById("duel-auto-toggle");
        elements.duelAutoNote = document.getElementById("duel-auto-note");
        elements.duelAutoCover = document.getElementById("duel-auto-cover");
        elements.duelControlStack = document.getElementById("duel-control-stack");
        elements.duelClearLogButton = document.getElementById("duel-clear-log-button");
        elements.duelWeaponButtons = Array.from(document.querySelectorAll('.weapon-option[data-duel-select="weapon"]'));
        elements.duelShotButtons = Array.from(document.querySelectorAll('.duel-toggle[data-duel-select="shot"]'));
        elements.duelDodgeButtons = Array.from(document.querySelectorAll('.duel-toggle[data-duel-select="dodge"]'));
        elements.bottomNav = document.getElementById("bottom-nav");
        elements.screens = Array.from(document.querySelectorAll(".screen"));
        elements.navButtons = Array.from(document.querySelectorAll("[data-nav-target]"));
        elements.bottomNavButtons = Array.from(document.querySelectorAll(".nav-button[data-nav-target]"));
    }

    function bindEvents() {
        document.addEventListener("click", onDocumentClick);
        document.addEventListener("submit", onDocumentSubmit);
    }

    function exposeGlobalActions() {
        window.PolusApp = {
            navigate: navigateTo,
            startQueueDuel: startQueueDuel,
            startBotDuel: startBotDuel,
            cancelQueue: cancelQueue,
            triggerJournalEvent: triggerRandomJournalEvent,
            openQuest: openQuest,
            delayQuest: delayQuest,
            chooseQuestAction: executeQuestChoice,
            useItem: useBackpackItem,
            changeAugment: openAugmentPicker,
            closeAugmentPicker: closeAugmentPicker,
            selectAugment: selectAugment,
            setShopSection: setShopSection,
            viewFriendProfile: viewFriendProfile,
            openFriendChat: openFriendChat,
            openSocialInbox: openSocialInbox,
            closeSocialInbox: closeSocialInbox,
            selectDuelOption: updateDuelSelection,
            submitDuelTurn: submitCurrentDuelTurn,
            setDuelPanel: setDuelPanel,
            duelFriend: function (friendId) {
                const friend = getFriendById(friendId);
                if (friend) {
                    requestStartDuel({
                        mode: "friend",
                        title: "Р’С‹Р·РѕРІ РЅР° РґСѓСЌР»СЊ",
                        copy: "РџРѕРґС‚РІРµСЂРґРё, С‡С‚Рѕ С…РѕС‡РµС€СЊ РІС‹Р·РІР°С‚СЊ " + friend.name + " РЅР° Р±РѕР№. РџРѕРєР° СЌС‚Рѕ Р·Р°РїСѓСЃРєР°РµС‚ РѕР±С‰РёР№ РїРѕРёСЃРє СЃРѕРїРµСЂРЅРёРєР°.",
                        execute: function () {
                            startQueueDuel(true);
                        }
                    });
                }
            },
            buy: buyShopItem,
            clearDuelLog: clearDuelLog,
            closeDuel: closeDuel,
            cancelDuelExit: cancelDuelExit,
            confirmDuelExit: confirmDuelExit,
            submitDuelChat: submitDuelChat,
            submitRegistration: submitRegistration,
            allocateStat: allocateStat,
            sendFriendRequest: submitFriendSearch,
            acceptFriendRequest: acceptFriendRequest,
            rejectFriendRequest: rejectFriendRequest,
            cancelStartDuel: cancelStartDuel,
            confirmStartDuel: confirmStartDuel,
            toggleAutoBattle: toggleAutoBattle,
            closeDuelResult: closeDuelResult
        };
    }

    function hydrateTelegram() {
        const webApp = getTelegramWebApp();
        if (!webApp) {
            return;
        }
        webApp.ready();
        webApp.expand();
    }

    function getTelegramWebApp() {
        return window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
    }

    async function initializeSession() {
        const webApp = getTelegramWebApp();
        const hasTelegramIdentity = Boolean(webApp && webApp.initData);
        try {
            const response = await fetch("/api/player/session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(buildSessionRequest())
            });
            if (!response.ok) {
                throw new Error(await readApiError(response));
            }
            applySession(await response.json());
            await loadFriendsOverview();
        } catch (error) {
            console.error("Polus session init failed", error);
            if (hasTelegramIdentity) {
                state.auth = Object.assign({}, state.auth, {
                    sessionToken: null,
                    playerId: null,
                    telegramUserId: null,
                    nickname: "",
                    registered: false,
                    demoMode: false,
                    initError: error && error.message ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ СЃРµСЃСЃРёСЋ"
                });
                state.player.name = "РќРѕРІС‹Р№ РёРіСЂРѕРє";
                state.player.money = 0;
                saveState();
            } else {
                fallbackToDemoSession(error);
            }
        }
    }

    function buildSessionRequest() {
        const webApp = getTelegramWebApp();
        if (webApp && webApp.initData) {
            return {
                initData: webApp.initData
            };
        }
        return {
            fallbackUser: {
                guestId: getBrowserGuestId(),
                firstName: "Р“РѕСЃС‚СЊ",
                lastName: null,
                username: null,
                languageCode: navigator.language || "ru",
                telegramUserId: null
            }
        };
    }

    function getBrowserGuestId() {
        try {
            const existing = window.localStorage.getItem(GUEST_ID_KEY);
            if (existing) {
                return existing;
            }
            const next = uid("guest");
            window.localStorage.setItem(GUEST_ID_KEY, next);
            return next;
        } catch (error) {
            return uid("guest");
        }
    }

    function applySession(session) {
        const player = session && session.player ? session.player : null;
        if (!player) {
            throw new Error("РџСѓСЃС‚РѕР№ РѕС‚РІРµС‚ СЃРµСЃСЃРёРё");
        }
        const previousPlayerId = state.auth && state.auth.playerId ? state.auth.playerId : null;
        const accountChanged = previousPlayerId !== player.id;
        if (accountChanged) {
            const freshState = hydrateState(buildInitialState());
            freshState.auth = state.auth || {};
            state = freshState;
        }
        state.auth = Object.assign({}, state.auth, {
            sessionToken: session.sessionToken || null,
            playerId: player.id,
            telegramUserId: player.telegramUserId || null,
            nickname: player.nickname || "",
            registered: Boolean(player.registered),
            demoMode: false,
            initError: ""
        });
        syncPlayerFromServer(player, accountChanged || !player.registered);
        saveState();
    }

    function syncPlayerFromServer(player, resetEconomy) {
        state.player.id = player.id;
        state.player.name = player.nickname || player.displayName || state.player.name || "РќРѕРІС‹Р№ РёРіСЂРѕРє";
        state.player.level = typeof player.level === "number" ? player.level : state.player.level || 1;
        state.player.wins = typeof player.wins === "number" ? player.wins : state.player.wins;
        state.player.losses = typeof player.losses === "number" ? player.losses : state.player.losses;
        state.player.telegramUserId = player.telegramUserId || null;
        if (typeof player.experience === "number") {
            state.player.experience = player.experience;
        }
        if (typeof player.levelProgressCurrent === "number") {
            state.player.levelProgressCurrent = player.levelProgressCurrent;
        }
        if (typeof player.levelProgressTarget === "number") {
            state.player.levelProgressTarget = player.levelProgressTarget;
        }
        if (typeof player.strength === "number") {
            state.player.strength = player.strength;
        }
        if (typeof player.reaction === "number") {
            state.player.reaction = player.reaction;
        }
        if (typeof player.analysis === "number") {
            state.player.analysis = player.analysis;
        }
        if (typeof player.availableStatPoints === "number") {
            state.player.availableStatPoints = player.availableStatPoints;
        }
        if (resetEconomy || typeof state.player.money !== "number" || typeof player.coins === "number") {
            state.player.money = typeof player.coins === "number" ? player.coins : 0;
        }
        const snapshot = getLevelProgressSnapshot(typeof state.player.experience === "number" ? state.player.experience : 0);
        state.player.level = typeof state.player.level === "number" ? state.player.level : snapshot.level;
        state.player.levelProgressCurrent = typeof state.player.levelProgressCurrent === "number" ? state.player.levelProgressCurrent : snapshot.current;
        state.player.levelProgressTarget = typeof state.player.levelProgressTarget === "number" ? state.player.levelProgressTarget : snapshot.target;
        if (typeof player.availableStatPoints !== "number") {
            state.player.availableStatPoints = Math.max(0, (state.player.level - 1) - ((state.player.strength || 0) + (state.player.reaction || 0) + (state.player.analysis || 0)));
        }
    }

    async function syncPlayerProfileFromApi() {
        if (!state.auth || !state.auth.sessionToken || state.auth.demoMode) {
            return;
        }
        const response = await apiFetch("/api/player/me");
        const player = await response.json();
        syncPlayerFromServer(player, true);
        saveState();
    }

    async function loadFriendsOverview() {
        if (!state.auth || !state.auth.sessionToken || state.auth.demoMode || !state.auth.registered) {
            state.friends = [];
            state.friendRequests = [];
            return;
        }
        try {
            const response = await apiFetch("/api/friends");
            applyFriendsOverview(await response.json());
        } catch (error) {
            console.error("Failed to load friends", error);
        }
    }

    function applyFriendsOverview(payload) {
        state.friends = Array.isArray(payload && payload.friends) ? payload.friends.map(function (entry) {
            return {
                id: entry.playerId,
                name: entry.displayName,
                level: entry.level,
                status: entry.online ? "online" : "offline"
            };
        }) : [];
        state.friendRequests = Array.isArray(payload && payload.incomingRequests) ? payload.incomingRequests.map(function (entry) {
            return {
                id: entry.requestId,
                playerId: entry.playerId,
                name: entry.displayName,
                level: entry.level,
                status: entry.online ? "online" : "offline"
            };
        }) : [];
        syncSocialThreadsWithFriends();
        saveState();
    }

    function fallbackToDemoSession(error) {
        state.auth = Object.assign({}, state.auth, {
            sessionToken: null,
            playerId: "demo-player",
            telegramUserId: null,
            nickname: "",
            registered: false,
            demoMode: true,
            initError: error && error.message ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ СЃРµСЃСЃРёСЋ"
        });
        state.player.name = "РќРѕРІС‹Р№ РёРіСЂРѕРє";
        state.player.money = 0;
        state.friends = [];
        state.friendRequests = [];
        saveState();
    }

    async function submitRegistration() {
        const nickname = elements.registrationNickname.value.trim();
        elements.registrationError.textContent = "";
        elements.registrationError.classList.add("hidden");
        if (!nickname) {
            showRegistrationError("Р’РІРµРґРё РЅРёРєРЅРµР№Рј.");
            return;
        }
        if (nickname.length < 3 || nickname.length > 20) {
            showRegistrationError("РќРёРє РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РґР»РёРЅРѕР№ РѕС‚ 3 РґРѕ 20 СЃРёРјРІРѕР»РѕРІ.");
            return;
        }
        if (!/^[\p{L}\p{N}_-]+$/u.test(nickname)) {
            showRegistrationError("РќРёРє РјРѕР¶РµС‚ СЃРѕРґРµСЂР¶Р°С‚СЊ С‚РѕР»СЊРєРѕ Р±СѓРєРІС‹, С†РёС„СЂС‹, _ Рё -.");
            return;
        }
        elements.registrationSubmit.disabled = true;
        try {
            if (state.auth && state.auth.demoMode) {
                state.auth.nickname = nickname;
                state.auth.registered = true;
                state.player.name = nickname;
                state.player.money = 0;
                addJournal("РќРёРє \"" + nickname + "\" СЃРѕС…СЂР°РЅРµРЅ РІ Р»РѕРєР°Р»СЊРЅРѕРј СЂРµР¶РёРјРµ.");
                saveState();
                renderAll();
                showToast("РќРёРє СЃРѕС…СЂР°РЅРµРЅ.");
                return;
            }
            if (!state.auth || !state.auth.sessionToken) {
                throw new Error("РћС‚РєСЂРѕР№ Mini App С‡РµСЂРµР· Telegram, С‡С‚РѕР±С‹ Р·Р°РєСЂРµРїРёС‚СЊ РЅРёРє.");
            }
            const response = await fetch("/api/player/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Session-Token": state.auth.sessionToken
                },
                body: JSON.stringify({ nickname: nickname })
            });
            if (!response.ok) {
                throw new Error(await readApiError(response));
            }
            const player = await response.json();
            state.auth.nickname = player.nickname || nickname;
            state.auth.registered = Boolean(player.registered);
            syncPlayerFromServer(player, true);
            await loadFriendsOverview();
            addJournal("РђРєРєР°СѓРЅС‚ Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ РїРѕРґ РЅРёРєРѕРј \"" + (player.nickname || nickname) + "\".");
            saveState();
            renderAll();
            showToast("РђРєРєР°СѓРЅС‚ Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ.");
        } catch (error) {
            showRegistrationError(error && error.message ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊ Р°РєРєР°СѓРЅС‚.");
        } finally {
            elements.registrationSubmit.disabled = false;
        }
    }

    function showRegistrationError(message) {
        elements.registrationError.textContent = message;
        elements.registrationError.classList.remove("hidden");
    }

    async function readApiError(response) {
        try {
            const payload = await response.json();
            return payload && payload.message ? payload.message : "РћС€РёР±РєР° Р·Р°РїСЂРѕСЃР°";
        } catch (error) {
            return "РћС€РёР±РєР° Р·Р°РїСЂРѕСЃР°";
        }
    }

    async function apiFetch(path, options) {
        const requestOptions = Object.assign({}, options || {});
        requestOptions.headers = Object.assign({}, requestOptions.headers || {});
        if (state.auth && state.auth.sessionToken) {
            requestOptions.headers["X-Session-Token"] = state.auth.sessionToken;
        }
        const response = await fetch(path, requestOptions);
        if (!response.ok) {
            throw new Error(await readApiError(response));
        }
        return response;
    }

    function applyMatchmakingStatus(statusPayload) {
        state.matchmaking.status = statusPayload && statusPayload.status ? statusPayload.status : "IDLE";
        state.matchmaking.duelId = statusPayload ? statusPayload.duelId || null : null;
        state.matchmaking.message = statusPayload ? statusPayload.message || "" : "";
        state.matchmaking.queuedAt = statusPayload && statusPayload.status === "QUEUED" && statusPayload.queuedAt
            ? new Date(statusPayload.queuedAt).getTime()
            : null;
        saveState();
    }

    async function syncRemotePvp() {
        const shouldSync = state.auth
            && state.auth.sessionToken
            && !state.auth.demoMode
            && (state.matchmaking.status === "QUEUED"
                || state.matchmaking.status === "IN_DUEL"
                || (state.duel && state.duel.mode === "pvp-live"));
        if (!shouldSync || liveSyncPending) {
            return;
        }
        liveSyncPending = true;
        try {
            const statusResponse = await apiFetch("/api/matchmaking/status");
            const statusPayload = await statusResponse.json();
            applyMatchmakingStatus(statusPayload);
            if ((statusPayload.status === "IN_DUEL" || statusPayload.status === "COMPLETED") && statusPayload.duelId) {
                await refreshLiveDuel(statusPayload.duelId);
            }
            if (statusPayload.status === "IDLE" && state.duel && state.duel.mode === "pvp-live") {
                closeDuelSilently();
                state.ui.duelExitConfirmOpen = false;
                state.duel = null;
                saveState();
            }
        } catch (error) {
            console.warn("Polus remote PvP sync skipped", error);
        } finally {
            liveSyncPending = false;
        }
    }

    async function syncFriendsIfNeeded() {
        const shouldSync = state.auth && state.auth.sessionToken && !state.auth.demoMode && state.auth.registered;
        if (!shouldSync || friendSyncPending) {
            return;
        }
        const lastSyncAt = state.world.lastFriendSyncAt || 0;
        if (Date.now() - lastSyncAt < FRIEND_SYNC_MS) {
            return;
        }
        friendSyncPending = true;
        state.world.lastFriendSyncAt = Date.now();
        try {
            await loadFriendsOverview();
            if (state.ui.screen === "friends") {
                renderFriends();
            }
        } finally {
            friendSyncPending = false;
        }
    }

    async function refreshLiveDuel(duelId) {
        const duelResponse = await apiFetch("/api/duel/" + encodeURIComponent(duelId));
        const payload = await duelResponse.json();
        const current = state.duel && state.duel.mode === "pvp-live" ? state.duel : null;
        const justFinished = Boolean(current && !current.finished && payload.status === "FINISHED");
        const sameRound = Boolean(current && current.duelId === payload.duelId && current.round === payload.roundNumber && !current.finished);
        const submittedAction = normalizeSubmittedAction(payload.yourSubmittedAction);
        const preservedSelection = resolveLiveSelectionDraft(current, submittedAction, sameRound, Boolean(payload.autoBattleEnabled));
        const roundStartedAt = payload.roundStartedAt ? new Date(payload.roundStartedAt).getTime() : (sameRound && current && current.roundStartedAt ? current.roundStartedAt : Date.now());
        const roundDeadlineAt = payload.roundDeadlineAt ? new Date(payload.roundDeadlineAt).getTime() : (roundStartedAt + DUEL_ROUND_TIMEOUT_MS);
        state.duel = {
            mode: "pvp-live",
            duelId: payload.duelId,
            title: "РќР°Р№РґРµРЅРЅС‹Р№ РјР°С‚С‡",
            modeLabel: "PvP",
            playerName: payload.you.displayName,
            opponentName: payload.opponent.displayName,
            playerHp: payload.you.hp,
            opponentHp: payload.opponent.hp,
            round: payload.roundNumber,
            finished: payload.status === "FINISHED",
            resultText: buildLiveResultText(payload),
            logs: payload.logs || [],
            chatMessages: payload.chatMessages || [],
            selectedWeapon: preservedSelection.weapon,
            selectedShot: preservedSelection.shot,
            selectedDodge: preservedSelection.dodge,
            submittedAction: submittedAction,
            lastPlayerWeapon: submittedAction && submittedAction.weapon ? submittedAction.weapon : (current ? current.lastPlayerWeapon : "PISTOLS"),
            lastOpponentWeapon: current ? current.lastOpponentWeapon : "RIFLE",
            activePanel: current && current.activePanel ? current.activePanel : "logs",
            chatError: current && current.chatError ? current.chatError : "",
            yourActionSubmitted: Boolean(payload.yourActionSubmitted),
            opponentActionSubmitted: Boolean(payload.opponentActionSubmitted),
            canSubmitAction: Boolean(payload.canSubmitAction),
            resultLabel: payload.resultLabel || "",
            roundStartedAt: roundStartedAt,
            roundDeadlineAt: roundDeadlineAt,
            autoBattleEnabled: Boolean(payload.autoBattleEnabled),
            autoBattlePendingEnabled: typeof payload.autoBattlePendingEnabled === "boolean" ? payload.autoBattlePendingEnabled : null,
            autoResolutionAt: null
        };
        if (justFinished) {
            await syncPlayerProfileFromApi();
            openLiveDuelResult(payload);
        }
        if (!elements.duelOverlay.classList.contains("hidden") || state.matchmaking.status === "IN_DUEL") {
            elements.duelOverlay.classList.remove("hidden");
            elements.duelOverlay.setAttribute("aria-hidden", "false");
            document.body.classList.add("duel-open");
        }
        saveState();
        renderDuel();
    }

    function buildLiveResultText(payload) {
        if (payload.status === "FINISHED") {
            if (payload.resultLabel === "VICTORY") {
                return "РџРѕР±РµРґР°. РЎРѕРїРµСЂРЅРёРє СЃР»РѕРјР°Р» С‚РµРјРї.";
            }
            if (payload.resultLabel === "DEFEAT") {
                return "РџРѕСЂР°Р¶РµРЅРёРµ. РџСЂРёРґРµС‚СЃСЏ СЃРѕР±РёСЂР°С‚СЊСЃСЏ Р·Р°РЅРѕРІРѕ.";
            }
            return "РќРёС‡СЊСЏ. РћР±РѕРёС… СѓРЅРµСЃР»Рѕ РІ Р»РµРґСЏРЅСѓСЋ С‚РёС€РёРЅСѓ.";
        }
        if (payload.yourActionSubmitted && !payload.opponentActionSubmitted) {
            return "РҐРѕРґ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ. Р–РґРµРј РѕС‚РІРµС‚ СЃРѕРїРµСЂРЅРёРєР°.";
        }
        if (payload.yourActionSubmitted && payload.opponentActionSubmitted) {
            return "РћР±Р° С…РѕРґР° Р·Р°РїРµСЂС‚С‹. Р Р°СѓРЅРґ СЃРµР№С‡Р°СЃ СЂР°СЃРєСЂРѕРµС‚СЃСЏ.";
        }
        return "Р’С‹Р±РµСЂРё С…РѕРґ РЅР° СЂР°СѓРЅРґ.";
    }

    function openLiveDuelResult(payload) {
        const isVictory = payload.resultLabel === "VICTORY";
        const isDefeat = payload.resultLabel === "DEFEAT";
        const winnerName = isVictory
            ? (payload.you && payload.you.displayName ? payload.you.displayName : state.player.name)
            : (payload.opponent && payload.opponent.displayName ? payload.opponent.displayName : "РЎРѕРїРµСЂРЅРёРє");
        const rewardMoney = isVictory ? BATTLE_VICTORY_COINS : 0;
        const rewardExperience = BATTLE_REWARD_EXPERIENCE;

        if (isVictory) {
            addJournal("РџРѕР±РµРґР° РІ PvP. +100 РјРѕРЅРµС‚ Рё +10 РѕРїС‹С‚Р°.");
        } else if (isDefeat) {
            addJournal("РџРѕСЂР°Р¶РµРЅРёРµ РІ PvP. РќР° СЌС‚РѕС‚ СЂР°Р· Р±РµР· РЅР°РіСЂР°РґС‹.");
        } else {
            addJournal("РњР°С‚С‡ Р·Р°РІРµСЂС€РёР»СЃСЏ РЅРёС‡СЊРµР№.");
        }

        openDuelResultModal({
            title: isVictory ? "РўС‹ РїРѕР±РµРґРёР»" : (isDefeat ? "РўС‹ РїСЂРѕРёРіСЂР°Р»" : "РќРёС‡СЊСЏ"),
            copy: isVictory
                ? "РџРѕР±РµР¶РґРµРЅ " + (payload.opponent && payload.opponent.displayName ? payload.opponent.displayName : "СЃРѕРїРµСЂРЅРёРє") + "."
                : (isDefeat ? "РџРѕР±РµРґРёР» " + winnerName + "." : "РћР±Р° Р±РѕР№С†Р° СѓРґРµСЂР¶Р°Р»Рё Р»РёРЅРёСЋ РґРѕ РєРѕРЅС†Р°."),
            experience: rewardExperience,
            money: rewardMoney
        });
    }

    function normalizeSubmittedAction(action) {
        if (!action) {
            return null;
        }
        return {
            weapon: action.weapon || null,
            shot: action.shot || action.shotDirection || null,
            dodge: action.dodge || action.dodgeDirection || null,
            source: action.source || "MANUAL",
            submittedAt: action.submittedAt || null
        };
    }

    function resolveLiveSelectionDraft(current, submittedAction, sameRound, autoBattleEnabled) {
        if (autoBattleEnabled) {
            return submittedAction || { weapon: null, shot: null, dodge: null };
        }
        if (!sameRound || !current) {
            return submittedAction || { weapon: null, shot: null, dodge: null };
        }
        const currentDraft = {
            weapon: current.selectedWeapon || null,
            shot: current.selectedShot || null,
            dodge: current.selectedDodge || null
        };
        if (!submittedAction) {
            return currentDraft;
        }
        if (isCompleteAction(currentDraft) && !actionsMatch(currentDraft, submittedAction)) {
            return currentDraft;
        }
        return submittedAction;
    }

    function triggerScheduledJournalEvent() {
        return;
    }

    function onTick() {
        triggerScheduledJournalEvent();
        syncRemotePvp();
        syncFriendsIfNeeded();
        syncLocalDuelState();
        renderQueueStatus();
        if (state.duel && !elements.duelOverlay.classList.contains("hidden")) {
            renderDuel();
        }
    }

    function onDocumentClick(event) {
        const target = event.target.closest("button");
        if (!target) {
            return;
        }

        if (target.hasAttribute("onclick")) {
            return;
        }

        if (target.id === "find-match-button") {
            return;
        }

        if (target.id === "bot-duel-button") {
            return;
        }

        if (target.id === "duel-close-button") {
            closeDuel();
            return;
        }

        if (target.id === "duel-clear-log-button") {
            clearDuelLog();
            return;
        }

        if (target.hasAttribute("data-augment-slot")) {
            openAugmentPicker(target.getAttribute("data-augment-slot"));
            return;
        }

        if (target.id === "augment-modal-close") {
            closeAugmentPicker();
            return;
        }

        if (target.hasAttribute("data-augment-id")) {
            selectAugment(target.getAttribute("data-augment-id"));
            return;
        }

        if (target.hasAttribute("data-shop-section")) {
            setShopSection(target.getAttribute("data-shop-section"));
            return;
        }

        if (target.hasAttribute("data-duel-select")) {
            updateDuelSelection(target.getAttribute("data-duel-select"), target.getAttribute("data-value"));
            return;
        }

        if (target.hasAttribute("data-nav-target")) {
            navigateTo(target.getAttribute("data-nav-target"));
            return;
        }

        if (target.getAttribute("data-item-action") === "use" && target.hasAttribute("data-item-id")) {
            useBackpackItem(target.getAttribute("data-item-id"));
            return;
        }

        if (target.hasAttribute("data-stat")) {
            allocateStat(target.getAttribute("data-stat"));
            return;
        }

        if (target.hasAttribute("data-friend-id")) {
            const friend = getFriendById(target.getAttribute("data-friend-id"));
            if (friend) {
                requestStartDuel({
                    mode: "friend",
                    title: "Р’С‹Р·РІР°С‚СЊ РґСЂСѓРіР° РЅР° РґСѓСЌР»СЊ?",
                    copy: "РџРѕРґС‚РІРµСЂРґРё, С‡С‚Рѕ С…РѕС‡РµС€СЊ РІС‹Р·РІР°С‚СЊ " + friend.name + ". РџРѕРєР° РїСЂСЏРјРѕР№ РІС‹Р·РѕРІ РІРµРґРµС‚ РІ РѕР±С‰РёР№ PvP-РїРѕРёСЃРє.",
                    execute: function () {
                        startQueueDuel(true);
                    }
                });
            }
            return;
        }

        if (target.hasAttribute("data-friend-profile-id")) {
            viewFriendProfile(target.getAttribute("data-friend-profile-id"));
            return;
        }

        if (target.hasAttribute("data-friend-chat-id")) {
            openFriendChat(target.getAttribute("data-friend-chat-id"));
            return;
        }

        if (target.hasAttribute("data-social-thread-id")) {
            openSocialInbox(target.getAttribute("data-social-thread-id"));
            return;
        }

        if (target.hasAttribute("data-request-accept-id")) {
            acceptFriendRequest(target.getAttribute("data-request-accept-id"));
            return;
        }

        if (target.hasAttribute("data-request-reject-id")) {
            rejectFriendRequest(target.getAttribute("data-request-reject-id"));
            return;
        }

        if (target.hasAttribute("data-shop-id")) {
            buyShopItem(target.getAttribute("data-shop-id"));
        }
    }

    function onDocumentSubmit(event) {
        if (event.target === elements.registrationForm) {
            event.preventDefault();
            submitRegistration();
            return;
        }
        if (event.target === elements.friendSearchForm) {
            event.preventDefault();
            submitFriendSearch();
            return;
        }
        if (event.target === elements.duelChatForm) {
            event.preventDefault();
            submitDuelChat();
            return;
        }
        if (event.target === elements.socialChatForm) {
            event.preventDefault();
            submitSocialChat();
            return;
        }
        if (event.target !== elements.duelForm) {
            return;
        }
        event.preventDefault();
        if (!state.duel || state.duel.finished) {
            return;
        }
        if (state.duel.mode === "pvp-live") {
            submitLiveDuelAction();
            return;
        }
        if (!isDuelSelectionComplete(state.duel)) {
            showToast("РЎРЅР°С‡Р°Р»Р° РІС‹Р±РµСЂРё РѕСЂСѓР¶РёРµ, РІС‹СЃС‚СЂРµР» Рё СѓРІРѕСЂРѕС‚.");
            return;
        }
        resolveDuelRound(
            getCurrentDuelAction(state.duel),
            buildOpponentAction()
        );
    }

    function navigateTo(screen) {
        state.ui.screen = screen;
        state.ui.augmentPickerSlot = null;
        if (screen !== "quest-detail") {
            state.ui.activeQuestId = null;
        }
        saveState();
        renderAll();
    }

    function openQuest(questId) {
        const quest = getQuest(questId);
        if (!quest || quest.status === "expired" || quest.status === "completed") {
            showToast("Р­С‚РѕС‚ РєРІРµСЃС‚ СѓР¶Рµ РЅРµРґРѕСЃС‚СѓРїРµРЅ.");
            return;
        }
        if (quest.status === "new") {
            quest.status = "inProgress";
            addJournal("РљРІРµСЃС‚ \"" + quest.title + "\" РїРµСЂРµС€РµР» РІ СЂРµР¶РёРј РџСЂРѕРґРѕР»Р¶РёС‚СЊ.");
        }
        state.ui.activeQuestId = questId;
        state.ui.screen = "quest-detail";
        saveState();
        renderAll();
    }

    function delayQuest(questId) {
        const quest = getQuest(questId);
        if (!quest || quest.status === "completed" || quest.status === "expired") {
            return;
        }
        quest.expiresAt += 15 * 60 * 1000;
        addJournal("РљРІРµСЃС‚ \"" + quest.title + "\" РѕС‚Р»РѕР¶РµРЅ. РўР°Р№РјРµСЂ СЃР»РµРіРєР° РѕС‚СЃС‚СѓРїРёР».");
        showToast("РўР°Р№РјРµСЂ РєРІРµСЃС‚Р° СЃРґРІРёРЅСѓС‚ РЅР° 15 РјРёРЅСѓС‚.");
        saveState();
        renderAll();
    }

    function executeQuestChoice(questId, choiceId) {
        const quest = getQuest(questId);
        const scene = quest ? getQuestScene(quest) : null;
        const choice = scene ? scene.choices.find(function (entry) { return entry.id === choiceId; }) : null;
        if (!choice) {
            return;
        }
        if (choice.requiresItem && !hasItem(choice.requiresItem)) {
            const missingName = ITEM_LIBRARY[choice.requiresItem].name;
            const warning = "РќРµ С…РІР°С‚Р°РµС‚ РїСЂРµРґРјРµС‚Р°: " + missingName + ".";
            addJournal(warning);
            showToast(warning);
            renderAll();
            return;
        }
        if (choice.requiresStat && !meetsChoiceStat(choice)) {
            const warning = "РќРµ С…РІР°С‚Р°РµС‚ С…Р°СЂР°РєС‚РµСЂРёСЃС‚РёРєРё: " + getStatLabel(choice.requiresStat) + " " + choice.requiresStatValue + ".";
            addJournal(warning);
            showToast(warning);
            renderAll();
            return;
        }
        if (choice.consumeItem) {
            consumeItem(choice.consumeItem, 1);
        }
        let succeeded = true;
        if (typeof choice.chance === "number") {
            succeeded = Math.random() < choice.chance;
        }
        if (!succeeded) {
            if (choice.penaltyMoney) {
                state.player.money = Math.max(0, state.player.money - choice.penaltyMoney);
            }
            addJournal(choice.failText || "РџСЂРѕРІР°Р».");
            showToast(choice.failText || "РџСЂРѕРІР°Р».");
            saveState();
            renderAll();
            return;
        }
        if (choice.rewardMoney) {
            state.player.money += choice.rewardMoney;
        }
        if (choice.rewardItem) {
            addItem(choice.rewardItem, 1);
        }
        addJournal(choice.successText || "РЈСЃРїРµС….");
        showToast(choice.successText || "РЈСЃРїРµС….");
        if (choice.successGoto) {
            quest.nodeId = choice.successGoto;
        } else if (choice.complete) {
            quest.status = "completed";
            quest.completedAt = Date.now();
            state.ui.screen = "quests";
            state.ui.activeQuestId = null;
        }
        saveState();
        renderAll();
    }

    function useBackpackItem(itemId) {
        if (itemId !== "medkit") {
            showToast("Р­С‚РѕС‚ РїСЂРµРґРјРµС‚ Р»СѓС‡С€Рµ РїРѕР±РµСЂРµС‡СЊ РґР»СЏ РёСЃС‚РѕСЂРёРё.");
            return;
        }
        if (!hasItem("medkit")) {
            showToast("РќРµ С…РІР°С‚Р°РµС‚ РїСЂРµРґРјРµС‚Р°: РђРїС‚РµС‡РєР°.");
            return;
        }
        consumeItem("medkit", 1);
        addJournal("РђРїС‚РµС‡РєР° РёСЃРїРѕР»СЊР·РѕРІР°РЅР°. РҐРѕР»РѕРґ РѕС‚СЃС‚СѓРїР°РµС‚, СЂСѓРєРё СЃРЅРѕРІР° СЃР»СѓС€Р°СЋС‚СЃСЏ.");
        showToast("РђРїС‚РµС‡РєР° РёСЃРїРѕР»СЊР·РѕРІР°РЅР°.");
        saveState();
        renderAll();
    }

    function buyShopItem(shopId) {
        const item = state.shop.find(function (entry) { return entry.id === shopId; });
        if (!item) {
            return;
        }
        if (item.section === "premium") {
            showToast("РџСЂРµРјРёР°Р»СЊРЅС‹Р№ СЂР°Р·РґРµР» РІСЂРµРјРµРЅРЅРѕ РІ СЂР°Р±РѕС‚Рµ.");
            return;
        }

        if (state.player.money < item.price) {
            const warning = "РќРµ С…РІР°С‚Р°РµС‚ РјРѕРЅРµС‚: -" + item.price + " СЃРµР№С‡Р°СЃ РЅРµ РїРѕС‚СЏРЅСѓС‚СЊ.";
            addJournal(warning);
            showToast(warning);
            renderAll();
            return;
        }

        state.player.money -= item.price;
        addItem(item.itemId, 1);
        addJournal('РљСѓРїР»РµРЅ РїСЂРµРґРјРµС‚ "' + item.name + '". -' + item.price + " РјРѕРЅРµС‚.");
        showToast("РљСѓРїР»РµРЅРѕ: " + item.name + ".");
        saveState();
        renderAll();
    }

    function requestStartDuel(config) {
        state.ui.duelResult = null;
        state.ui.startDuelConfirm = {
            mode: config.mode,
            title: config.title,
            copy: config.copy
        };
        state.ui.startDuelAction = config.execute;
        saveState();
        renderStartDuelModal();
    }

    function cancelStartDuel() {
        state.ui.startDuelConfirm = null;
        state.ui.startDuelAction = null;
        saveState();
        renderStartDuelModal();
    }

    function confirmStartDuel() {
        const action = state.ui.startDuelAction;
        cancelStartDuel();
        if (typeof action === "function") {
            action();
        }
    }

    function startBotDuel(skipConfirm) {
        if (!skipConfirm) {
            requestStartDuel({
                mode: "bot",
                title: "РќР°С‡Р°С‚СЊ С‚СЂРµРЅРёСЂРѕРІРѕС‡РЅСѓСЋ РґСѓСЌР»СЊ?",
                copy: "РџРѕРґС‚РІРµСЂРґРё, С‡С‚Рѕ С…РѕС‡РµС€СЊ СЃСЂР°Р·Сѓ РІРѕР№С‚Рё РІ Р±РѕР№ СЃ С‚СЂРµРЅРёСЂРѕРІРѕС‡РЅС‹Рј СЃРѕРїРµСЂРЅРёРєРѕРј.",
                execute: function () {
                    startBotDuel(true);
                }
            });
            return;
        }
        openDuel({ mode: "bot", title: "РўСЂРµРЅРёСЂРѕРІРѕС‡РЅР°СЏ РґСѓСЌР»СЊ", modeLabel: "Р‘РѕС‚", opponentName: "РўСЂРµРЅРёСЂРѕРІС‰РёРє", opponentWeapon: "RIFLE" });
    }

    async function startQueueDuel(skipConfirm) {
        if (!state.auth.registered) {
            showToast("РЎРЅР°С‡Р°Р»Р° Р·Р°СЂРµРіРёСЃС‚СЂРёСЂСѓР№ Р°РєРєР°СѓРЅС‚.");
            return;
        }
        if (!skipConfirm) {
            requestStartDuel({
                mode: "queue",
                title: "РќР°С‡Р°С‚СЊ РїРѕРёСЃРє РјР°С‚С‡Р°?",
                copy: "РџРѕРґС‚РІРµСЂРґРё, С‡С‚Рѕ С…РѕС‡РµС€СЊ РІСЃС‚Р°С‚СЊ РІ РѕС‡РµСЂРµРґСЊ. РЎР»СѓС‡Р°Р№РЅС‹Рµ РЅР°Р¶Р°С‚РёСЏ С‚РѕР¶Рµ РѕС‚РїСЂР°РІР»СЏСЋС‚ С‚РµР±СЏ РІ РїРѕРёСЃРє.",
                execute: function () {
                    startQueueDuel(true);
                }
            });
            return;
        }
        if (state.matchmaking.status === "QUEUED") {
            showToast("РћС‡РµСЂРµРґСЊ СѓР¶Рµ Р°РєС‚РёРІРЅР°. РС‰РµРј СЃРѕРїРµСЂРЅРёРєР°.");
            return;
        }
        if (!state.auth.sessionToken || state.auth.demoMode) {
            showToast("Р’РЅРµ Telegram РґРѕСЃС‚СѓРїРЅР° Р»РѕРєР°Р»СЊРЅР°СЏ РґСѓСЌР»СЊ.");
            openDuel({ mode: "pvp", title: "РќР°Р№РґРµРЅРЅС‹Р№ РјР°С‚С‡", modeLabel: "PvP", opponentName: randomFrom(["Р РµР№РґРµСЂ СЃ РїРµСЂРµРІР°Р»Р°", "РљРѕРЅС‚СЂР°Р±Р°РЅРґРёСЃС‚ Сѓ РїСЂРѕРІРѕРґРѕРІ", "РњРѕР»С‡Р°Р»РёРІС‹Р№ СЃС‚СЂРµР»РѕРє", "Р§Р°СЃРѕРІРѕР№ РёР· Р±РµР»РѕР№ РїС‹Р»Рё"]), opponentWeapon: randomFrom(["PISTOLS", "RIFLE", "SHOTGUN"]) });
            return;
        }
        try {
            const response = await apiFetch("/api/matchmaking/join", { method: "POST" });
            const payload = await response.json();
            applyMatchmakingStatus(payload);
            if (payload.status === "IN_DUEL" && payload.duelId) {
                await refreshLiveDuel(payload.duelId);
                showToast("РЎРѕРїРµСЂРЅРёРє РЅР°Р№РґРµРЅ.");
            } else {
                showToast(payload.message || "РС‰РµРј СЃРѕРїРµСЂРЅРёРєР°.");
            }
        } catch (error) {
            showToast(error && error.message ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ РІРѕР№С‚Рё РІ РѕС‡РµСЂРµРґСЊ.");
        }
    }

    async function cancelQueue() {
        if (state.matchmaking.status !== "QUEUED") {
            return;
        }
        if (!state.auth.sessionToken || state.auth.demoMode) {
            state.matchmaking.status = "IDLE";
            state.matchmaking.duelId = null;
            state.matchmaking.message = "";
            state.matchmaking.queuedAt = null;
            saveState();
            renderAll();
            showToast("РџРѕРёСЃРє РґСѓСЌР»Рё РѕС‚РјРµРЅС‘РЅ.");
            return;
        }
        if (elements.queueCancelButton) {
            elements.queueCancelButton.disabled = true;
        }
        try {
            const response = await apiFetch("/api/matchmaking/cancel", { method: "POST" });
            applyMatchmakingStatus(await response.json());
            renderAll();
            showToast("РџРѕРёСЃРє РґСѓСЌР»Рё РѕС‚РјРµРЅС‘РЅ.");
        } catch (error) {
            showToast(error && error.message ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РјРµРЅРёС‚СЊ РїРѕРёСЃРє.");
        } finally {
            if (elements.queueCancelButton) {
                elements.queueCancelButton.disabled = false;
            }
        }
    }

    async function allocateStat(stat) {
        if (!state.auth.registered) {
            showToast("РЎРЅР°С‡Р°Р»Р° Р·Р°СЂРµРіРёСЃС‚СЂРёСЂСѓР№ Р°РєРєР°СѓРЅС‚.");
            return;
        }
        if ((state.player.availableStatPoints || 0) <= 0) {
            showToast("РЎРІРѕР±РѕРґРЅС‹С… РѕС‡РєРѕРІ РїРѕРєР° РЅРµС‚.");
            return;
        }
        if (!state.auth.sessionToken || state.auth.demoMode) {
            state.player[stat] = (state.player[stat] || 0) + 1;
            state.player.availableStatPoints = Math.max(0, (state.player.availableStatPoints || 0) - 1);
            saveState();
            renderAll();
            showToast("РҐР°СЂР°РєС‚РµСЂРёСЃС‚РёРєР° СѓСЃРёР»РµРЅР°.");
            return;
        }
        try {
            const response = await apiFetch("/api/player/stats", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ stat: stat })
            });
            syncPlayerFromServer(await response.json(), false);
            saveState();
            renderAll();
            showToast("РҐР°СЂР°РєС‚РµСЂРёСЃС‚РёРєР° СѓСЃРёР»РµРЅР°.");
        } catch (error) {
            showToast(error && error.message ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ СЂР°СЃРїСЂРµРґРµР»РёС‚СЊ РѕС‡РєРѕ.");
        }
    }

    async function submitFriendSearch() {
        if (!state.auth.registered) {
            showToast("РЎРЅР°С‡Р°Р»Р° Р·Р°СЂРµРіРёСЃС‚СЂРёСЂСѓР№ Р°РєРєР°СѓРЅС‚.");
            return;
        }
        const nickname = elements.friendSearchInput ? elements.friendSearchInput.value.trim() : "";
        if (!nickname) {
            showToast("Р’РІРµРґРё РЅРёРє РёРіСЂРѕРєР°.");
            return;
        }
        if (!state.auth.sessionToken || state.auth.demoMode) {
            showToast("Р”РѕР±Р°РІР»РµРЅРёРµ РґСЂСѓР·РµР№ РґРѕСЃС‚СѓРїРЅРѕ С‚РѕР»СЊРєРѕ РІ Telegram-Р°РєРєР°СѓРЅС‚Рµ.");
            return;
        }
        try {
            const response = await apiFetch("/api/friends/request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ nickname: nickname })
            });
            applyFriendsOverview(await response.json());
            if (elements.friendSearchInput) {
                elements.friendSearchInput.value = "";
            }
            renderFriends();
            showToast("Р—Р°РїСЂРѕСЃ РІ РґСЂСѓР·СЊСЏ РѕС‚РїСЂР°РІР»РµРЅ.");
        } catch (error) {
            showToast(error && error.message ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ Р·Р°РїСЂРѕСЃ.");
        }
    }

    async function acceptFriendRequest(requestId) {
        if (!state.auth.sessionToken || state.auth.demoMode) {
            return;
        }
        try {
            const response = await apiFetch("/api/friends/request/" + encodeURIComponent(requestId) + "/accept", {
                method: "POST"
            });
            applyFriendsOverview(await response.json());
            renderFriends();
            showToast("Р”СЂСѓРі РґРѕР±Р°РІР»РµРЅ.");
        } catch (error) {
            showToast(error && error.message ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ РїСЂРёРЅСЏС‚СЊ Р·Р°РїСЂРѕСЃ.");
        }
    }

    async function rejectFriendRequest(requestId) {
        if (!state.auth.sessionToken || state.auth.demoMode) {
            return;
        }
        try {
            const response = await apiFetch("/api/friends/request/" + encodeURIComponent(requestId) + "/reject", {
                method: "POST"
            });
            applyFriendsOverview(await response.json());
            renderFriends();
            showToast("Р—Р°РїСЂРѕСЃ РѕС‚РєР»РѕРЅРµРЅ.");
        } catch (error) {
            showToast(error && error.message ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєР»РѕРЅРёС‚СЊ Р·Р°РїСЂРѕСЃ.");
        }
    }

    function openDuel(config) {
        if (state.auth && !state.auth.registered) {
            showToast("РЎРЅР°С‡Р°Р»Р° Р·Р°СЂРµРіРёСЃС‚СЂРёСЂСѓР№ Р°РєРєР°СѓРЅС‚.");
            return;
        }
        state.ui.duelResult = null;
        state.duel = {
            title: config.title,
            mode: config.mode,
            modeLabel: config.modeLabel,
            playerName: state.player.name,
            opponentName: config.opponentName,
            playerHp: getPlayerMaxHp(),
            opponentHp: 100,
            round: 1,
            finished: false,
            resultText: "РЎРѕР±РµСЂРё С…РѕРґ РЅР° СЂР°СѓРЅРґ.",
            logs: [],
            chatMessages: [],
            activePanel: "logs",
            chatError: "",
            selectedWeapon: null,
            selectedShot: null,
            selectedDodge: null,
            submittedAction: null,
            yourActionSubmitted: false,
            opponentActionSubmitted: false,
            canSubmitAction: true,
            autoBattleEnabled: false,
            autoBattlePendingEnabled: null,
            autoResolutionAt: null,
            lastPlayerWeapon: "PISTOLS",
            lastOpponentWeapon: config.opponentWeapon || (config.mode === "bot" ? "RIFLE" : randomFrom(["PISTOLS", "RIFLE", "SHOTGUN"])),
            roundStartedAt: Date.now(),
            roundDeadlineAt: Date.now() + DUEL_ROUND_TIMEOUT_MS,
            resultLabel: ""
        };
        startLocalRound(state.duel, true);
        state.ui.duelExitConfirmOpen = false;
        saveState();
        renderAll();
        elements.duelOverlay.classList.remove("hidden");
        elements.duelOverlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("duel-open");
    }

    async function submitLiveDuelAction() {
        if (!state.duel || state.duel.mode !== "pvp-live" || !state.duel.duelId) {
            return;
        }
        if (state.duel.autoBattleEnabled) {
            showToast("Р­С‚РѕС‚ СЂР°СѓРЅРґ СѓР¶Рµ РІРµРґРµС‚ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёР№ Р±РѕР№.");
            return;
        }
        if (!state.duel.canSubmitAction) {
            showToast("РЎРµР№С‡Р°СЃ С…РѕРґ РЅРµРґРѕСЃС‚СѓРїРµРЅ.");
            return;
        }
        if (!isDuelSelectionComplete(state.duel)) {
            showToast("РЎРЅР°С‡Р°Р»Р° РІС‹Р±РµСЂРё РѕСЂСѓР¶РёРµ, РІС‹СЃС‚СЂРµР» Рё СѓРІРѕСЂРѕС‚.");
            return;
        }
        const actionPayload = getCurrentDuelAction(state.duel);
        elements.duelSubmitButton.disabled = true;
        try {
            const response = await apiFetch("/api/duel/" + encodeURIComponent(state.duel.duelId) + "/action", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    weapon: actionPayload.weapon,
                    shotDirection: actionPayload.shot,
                    dodgeDirection: actionPayload.dodge
                })
            });
            const payload = await response.json();
            state.matchmaking.status = payload.status === "FINISHED" ? "COMPLETED" : "IN_DUEL";
            await refreshLiveDuel(payload.duelId);
            showToast(state.duel && state.duel.yourActionSubmitted ? "РҐРѕРґ РїСЂРёРЅСЏС‚." : "Р Р°СѓРЅРґ РѕР±РЅРѕРІР»РµРЅ.");
        } catch (error) {
            showToast(error && error.message ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ С…РѕРґ.");
        } finally {
            elements.duelSubmitButton.disabled = false;
        }
    }

    async function toggleAutoBattle() {
        const duel = state.duel;
        if (!duel || duel.finished) {
            return;
        }
        const currentEnabled = Boolean(duel.autoBattleEnabled);
        const pendingEnabled = typeof duel.autoBattlePendingEnabled === "boolean" ? duel.autoBattlePendingEnabled : null;
        const desiredEnabled = pendingEnabled === null ? !currentEnabled : !pendingEnabled;
        const nextPending = desiredEnabled === currentEnabled ? null : desiredEnabled;
        if (duel.mode === "pvp-live" && duel.duelId) {
            elements.duelAutoToggle.disabled = true;
            try {
                const response = await apiFetch("/api/duel/" + encodeURIComponent(duel.duelId) + "/automation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ enabled: desiredEnabled })
                });
                const payload = await response.json();
                await refreshLiveDuel(payload.duelId);
                showToast(nextPending === null
                    ? "РР·РјРµРЅРµРЅРёРµ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРѕРіРѕ Р±РѕСЏ РѕС‚РјРµРЅРµРЅРѕ."
                    : (nextPending ? "РђРІС‚РѕР±РѕР№ РІРєР»СЋС‡РёС‚СЃСЏ СЃРѕ СЃР»РµРґСѓСЋС‰РµРіРѕ СЂР°СѓРЅРґР°." : "РђРІС‚РѕР±РѕР№ РѕС‚РєР»СЋС‡РёС‚СЃСЏ СЃРѕ СЃР»РµРґСѓСЋС‰РµРіРѕ СЂР°СѓРЅРґР°."));
            } catch (error) {
                showToast(error && error.message ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ РїРµСЂРµРєР»СЋС‡РёС‚СЊ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёР№ Р±РѕР№.");
            } finally {
                elements.duelAutoToggle.disabled = false;
            }
            return;
        }
        duel.autoBattlePendingEnabled = nextPending;
        saveState();
        renderDuel();
        showToast(nextPending === null
            ? "РР·РјРµРЅРµРЅРёРµ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРѕРіРѕ Р±РѕСЏ РѕС‚РјРµРЅРµРЅРѕ."
            : (nextPending ? "РђРІС‚РѕР±РѕР№ РІРєР»СЋС‡РёС‚СЃСЏ СЃРѕ СЃР»РµРґСѓСЋС‰РµРіРѕ СЂР°СѓРЅРґР°." : "РђРІС‚РѕР±РѕР№ РѕС‚РєР»СЋС‡РёС‚СЃСЏ СЃРѕ СЃР»РµРґСѓСЋС‰РµРіРѕ СЂР°СѓРЅРґР°."));
    }

    function buildOpponentAction() {
        return {
            weapon: randomFrom(["PISTOLS", "RIFLE", "SHOTGUN"]),
            shot: randomFrom(["LEFT", "CENTER", "RIGHT"]),
            dodge: randomFrom(["LEFT", "STAY", "RIGHT"]),
            source: "MANUAL"
        };
    }

    function buildAutoBattleAction() {
        return {
            weapon: randomFrom(["PISTOLS", "RIFLE", "SHOTGUN"]),
            shot: randomFrom(["LEFT", "CENTER", "RIGHT"]),
            dodge: randomFrom(["LEFT", "STAY", "RIGHT"]),
            source: "AUTO_BATTLE"
        };
    }

    function buildTimeoutDefaultAction() {
        return {
            weapon: "PISTOLS",
            shot: "CENTER",
            dodge: "STAY",
            source: "TIMEOUT_DEFAULT"
        };
    }

    function appendLocalSystemLog(text) {
        if (!state.duel) {
            return;
        }
        state.duel.logs.push({
            round: state.duel.round,
            lines: [text]
        });
        if (state.duel.logs.length > 24) {
            state.duel.logs = state.duel.logs.slice(-24);
        }
    }

    function startLocalRound(duel, isInitial) {
        if (!duel || duel.finished) {
            return;
        }
        if (!isInitial && typeof duel.autoBattlePendingEnabled === "boolean") {
            duel.autoBattleEnabled = duel.autoBattlePendingEnabled;
            duel.autoBattlePendingEnabled = null;
            appendLocalSystemLog(
                duel.autoBattleEnabled
                    ? "РЎ СЌС‚РѕРіРѕ СЂР°СѓРЅРґР° С…РѕРґС‹ РёРіСЂРѕРєР° " + (duel.playerName || "РРіСЂРѕРє") + " Р±СѓРґСѓС‚ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёРјРё."
                    : "РЎ СЌС‚РѕРіРѕ СЂР°СѓРЅРґР° Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёРµ С…РѕРґС‹ РёРіСЂРѕРєР° " + (duel.playerName || "РРіСЂРѕРє") + " РѕС‚РєР»СЋС‡РµРЅС‹."
            );
        }
        duel.roundStartedAt = Date.now();
        duel.roundDeadlineAt = duel.roundStartedAt + DUEL_ROUND_TIMEOUT_MS;
        duel.selectedWeapon = null;
        duel.selectedShot = null;
        duel.selectedDodge = null;
        duel.submittedAction = null;
        duel.yourActionSubmitted = false;
        duel.opponentActionSubmitted = false;
        duel.autoResolutionAt = null;
        duel.canSubmitAction = !duel.autoBattleEnabled;
        duel.resultText = duel.autoBattleEnabled ? "Р­С‚РѕС‚ СЂР°СѓРЅРґ РїСЂРѕР№РґРµС‚ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё." : "РЎРѕР±РµСЂРё С…РѕРґ РЅР° СЂР°СѓРЅРґ.";
        if (duel.autoBattleEnabled) {
            const autoAction = buildAutoBattleAction();
            duel.submittedAction = autoAction;
            duel.selectedWeapon = autoAction.weapon;
            duel.selectedShot = autoAction.shot;
            duel.selectedDodge = autoAction.dodge;
            duel.yourActionSubmitted = true;
            duel.autoResolutionAt = Date.now() + 1000;
        }
    }

    function syncLocalDuelState() {
        const duel = state.duel;
        if (!duel || duel.finished || duel.mode === "pvp-live") {
            return false;
        }
        if (!duel.roundStartedAt || !duel.roundDeadlineAt) {
            startLocalRound(duel, true);
            return true;
        }
        if (duel.autoBattleEnabled && duel.yourActionSubmitted && duel.autoResolutionAt && Date.now() >= duel.autoResolutionAt) {
            resolveDuelRound(duel.submittedAction || buildAutoBattleAction(), buildOpponentAction());
            return true;
        }
        if (Date.now() >= duel.roundDeadlineAt) {
            resolveDuelRound(duel.submittedAction || buildTimeoutDefaultAction(), buildOpponentAction());
            return true;
        }
        return false;
    }

    function resolveDuelRound(playerAction, opponentAction) {
        const duel = state.duel;
        if (!duel) {
            return;
        }
        const playerName = duel.playerName || "РРіСЂРѕРє";
        const opponentName = duel.opponentName || "РџСЂРѕС‚РёРІРЅРёРє";
        duel.selectedWeapon = playerAction.weapon;
        duel.selectedShot = playerAction.shot;
        duel.selectedDodge = playerAction.dodge;
        duel.submittedAction = playerAction;
        duel.yourActionSubmitted = true;
        duel.lastPlayerWeapon = playerAction.weapon;
        duel.lastOpponentWeapon = opponentAction.weapon;
        const lines = [
            buildDuelIntentLine(playerName, playerAction),
            buildDuelIntentLine(opponentName, opponentAction)
        ];
        const playerResult = resolveAttack(playerName, opponentName, playerAction, opponentAction, "player");
        const opponentResult = resolveAttack(opponentName, playerName, opponentAction, playerAction, "opponent");
        lines.push.apply(lines, playerResult.lines);
        lines.push.apply(lines, opponentResult.lines);
        duel.opponentHp = Math.max(0, duel.opponentHp - playerResult.damage);
        duel.playerHp = Math.max(0, duel.playerHp - opponentResult.damage);
        applySupportRegen(duel, lines);
        duel.logs.push({ round: duel.round, lines: lines });
        if (duel.playerHp === 0 && duel.opponentHp === 0) {
            duel.finished = true;
            applyLocalExperienceGain(BATTLE_REWARD_EXPERIENCE);
            duel.resultText = "РќРёС‡СЊСЏ. РћР±Р° РѕСЃС‚Р°СЋС‚СЃСЏ РЅР° Р»РёРЅРёРё.";
            addJournal("РќРёС‡СЊСЏ РІ Р±РѕСЋ. РћР±Рµ СЃС‚РѕСЂРѕРЅС‹ РІС‹РґС‹С…Р°СЋС‚ Рё СЂР°СЃС…РѕРґСЏС‚СЃСЏ РїРѕ СЃРЅРµРіСѓ.");
            openDuelResultModal({
                title: "РќРёС‡СЊСЏ",
                copy: "РќРёРєС‚Рѕ РЅРµ СЃРјРѕРі РґРѕР¶Р°С‚СЊ СЂР°СѓРЅРґ РґРѕ РїРѕР±РµРґС‹.",
                experience: BATTLE_REWARD_EXPERIENCE,
                money: 0
            });
        } else if (duel.opponentHp === 0) {
            duel.finished = true;
            duel.resultText = "РџРѕР±РµРґР°. РџСЂРѕС‚РёРІРЅРёРє РїР°РґР°РµС‚ РІ СЃРЅРµРі.";
            state.player.wins += 1;
            const rewardMoney = BATTLE_VICTORY_COINS;
            const rewardExperience = BATTLE_REWARD_EXPERIENCE;
            state.player.money += rewardMoney;
            applyLocalExperienceGain(rewardExperience);
            addJournal("РџРѕР±РµРґР° РІ Р±РѕСЋ. +" + rewardMoney + " РјРѕРЅРµС‚ Рё +" + rewardExperience + " РѕРїС‹С‚Р°.");
            openDuelResultModal({
                title: "РўС‹ РїРѕР±РµРґРёР»",
                copy: "РџРѕР±РµР¶РґРµРЅ " + opponentName + ".",
                experience: rewardExperience,
                money: rewardMoney
            });
        } else if (duel.playerHp === 0) {
            duel.finished = true;
            duel.resultText = "РџРѕСЂР°Р¶РµРЅРёРµ. РџСЂРёС…РѕРґРёС‚СЃСЏ РѕС‚СЃС‚СѓРїР°С‚СЊ РІ С‚РµРјРЅРѕС‚Сѓ.";
            state.player.losses += 1;
            applyLocalExperienceGain(BATTLE_REWARD_EXPERIENCE);
            addJournal("РџРѕСЂР°Р¶РµРЅРёРµ РІ Р±РѕСЋ. РџСЂРёРґРµС‚СЃСЏ РїРµСЂРµРіСЂСѓРїРїРёСЂРѕРІР°С‚СЊСЃСЏ Рё РІРµСЂРЅСѓС‚СЊСЃСЏ РїРѕР·Р¶Рµ.");
            openDuelResultModal({
                title: "РўС‹ РїСЂРѕРёРіСЂР°Р»",
                copy: "РџРѕР±РµРґРёР» " + opponentName + ".",
                experience: BATTLE_REWARD_EXPERIENCE,
                money: 0
            });
        } else {
            duel.round += 1;
            startLocalRound(duel, false);
        }
        saveState();
        renderAll();
    }

    function resolveAttack(attackerName, defenderName, attackerAction, defenderAction, attackerSide) {
        const lines = [];
        const lineMatched = attackerAction.shot === defenderAction.dodge;
        if (!lineMatched && attackerAction.weapon !== "SHOTGUN") {
            lines.push(attackerName + " СѓРІРѕРґРёС‚ РІС‹СЃС‚СЂРµР» РјРёРјРѕ Р»РёРЅРёРё.");
            return { damage: 0, lines: lines };
        }
        if (lineMatched && shouldSupportEvade(attackerSide === "player" ? "opponent" : "player")) {
            lines.push(defenderName + " СѓС…РѕРґРёС‚ РѕС‚ СѓСЂРѕРЅР°.");
            return { damage: 0, lines: lines };
        }
        if (attackerAction.weapon === "PISTOLS") {
            if (projectileBlocked(attackerSide, defenderAction.weapon, attackerAction.weapon, attackerAction.shot)) {
                lines.push(defenderName + " Р·Р°РєСЂС‹РІР°РµС‚СЃСЏ С‰РёС‚РѕРј Рё Р±Р»РѕРєРёСЂСѓРµС‚ РїСѓР»СЋ.");
                return { damage: 0, lines: lines };
            }
            let damage = 18 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
            damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, false, lines, attackerSide === "player" ? "СЃРѕРїРµСЂРЅРёРє" : "С‚С‹");
            lines.push(attackerName + " РїРѕРїР°РґР°РµС‚ РёР· РїРёСЃС‚РѕР»СЏ Рё РЅР°РЅРѕСЃРёС‚ " + damage + " СѓСЂРѕРЅР°.");
            return { damage: damage, lines: lines };
        }
        if (attackerAction.weapon === "RIFLE") {
            let damage = 30 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
            damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, false, lines, attackerSide === "player" ? "СЃРѕРїРµСЂРЅРёРє" : "С‚С‹");
            lines.push(attackerName + " РїРѕРїР°РґР°РµС‚ РёР· РІРёРЅС‚РѕРІРєРё Рё СЃСЂРµР·Р°РµС‚ С‰РёС‚РѕРІРѕР№ Р±Р»РѕРє.");
            return { damage: damage, lines: lines };
        }
        let pelletsHit = 0;
        let pelletsBlocked = 0;
        if (!lineMatched) {
            if (Math.random() < SHOTGUN_EDGE_GRAZE_CHANCE + getWeaponGrazeBonus(attackerSide, attackerAction.weapon)) {
                let edgeDamage = SHOTGUN_EDGE_DAMAGE + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
                edgeDamage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", edgeDamage, true, lines, attackerSide === "player" ? "СЃРѕРїРµСЂРЅРёРє" : "С‚С‹");
                lines.push(attackerName + " С†РµРїР»СЏРµС‚ РєСЂР°РµРј Рё РЅР°РЅРѕСЃРёС‚ " + edgeDamage + " СѓСЂРѕРЅР°.");
                return { damage: edgeDamage, lines: lines };
            }
            lines.push(attackerName + " РЅРµ С†РµРїР»СЏРµС‚ С†РµР»СЊ РґСЂРѕР±СЊСЋ.");
            return { damage: 0, lines: lines };
        }
        for (let pellet = 0; pellet < 5; pellet++) {
            if (projectileBlocked(attackerSide, defenderAction.weapon, attackerAction.weapon, attackerAction.shot)) {
                pelletsBlocked++;
            } else {
                pelletsHit++;
            }
        }
        if (!pelletsHit) {
            lines.push(defenderName + " РїРѕР»РЅРѕСЃС‚СЊСЋ РїРµСЂРµРєСЂС‹РІР°РµС‚ РґСЂРѕР±СЊ С‰РёС‚РѕРј.");
            return { damage: 0, lines: lines };
        }
        let damage = pelletsHit * 5 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
        damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, pelletsHit < 3, lines, attackerSide === "player" ? "СЃРѕРїРµСЂРЅРёРє" : "С‚С‹");
        let summary = attackerName + " РїРѕРїР°РґР°РµС‚ " + pelletsHit + " РґСЂРѕР±РёРЅР°РјРё Рё РЅР°РЅРѕСЃРёС‚ " + damage + " СѓСЂРѕРЅР°.";
        if (pelletsBlocked) {
            summary += " Р©РёС‚ СЃРЅРёРјР°РµС‚ " + pelletsBlocked + " РґСЂРѕР±РёРЅ.";
        }
        lines.push(summary);
        return { damage: damage, lines: lines };
    }

    function applySupportRegen(duel, lines) {
        return;
    }

    function shouldSupportEvade(side) {
        return side === "player" && hasAugment("defense-evasion") && Math.random() < 0.05;
    }

    function projectileBlocked(attackerSide, defenderWeapon, weaponCode, shotCode) {
        const defenderSide = attackerSide === "player" ? "opponent" : "player";
        if (defenderSide === "player" && hasAugment("support-block") && Math.random() < 0.05) {
            return true;
        }
        if (weaponCode === "RIFLE" || defenderWeapon !== "PISTOLS" || ignoresBlocking(attackerSide)) {
            return false;
        }
        const blockChance = Math.max(0, SHIELD_BLOCK_CHANCE - getWeaponHitBonus(attackerSide, weaponCode, shotCode));
        return Math.random() < blockChance;
    }

    function ignoresBlocking(side) {
        return false;
    }

    function getWeaponHitBonus(side, weaponCode, shotCode) {
        return 0;
    }

    function getWeaponGrazeBonus(side, weaponCode) {
        return side === "player" && hasAugment("weapon-graze") ? 0.25 : 0;
    }

    function getWeaponDamageBonus(side, weaponCode) {
        return side === "player" && hasAugment("weapon-overdrive") ? 5 : 0;
    }

    function applyDefenseReduction(side, damage, isGraze, lines, defenderName) {
        const reduction = side === "player" && hasAugment("defense-plate") ? 3 : 0;
        if (reduction <= 0) {
            return damage;
        }
        const minimum = isGraze ? 1 : 0;
        const reducedDamage = Math.max(minimum, damage - reduction);
        if (reducedDamage < damage) {
            lines.push(defenderName + " снижает урон на " + (damage - reducedDamage) + ".");
        }
        return reducedDamage;
    }

    function getPlayerMaxHp() {
        return hasAugment("support-hp") ? 115 : 100;
    }

    function triggerRandomJournalEvent() {
        return;
    }

    function expireQuestsIfNeeded() {
        return;
    }

    function renderAll() {
        renderScreens();
        renderProfile();
        renderHeroStats();
        renderRegistrationModal();
        renderQueueStatus();
        renderInventory();
        renderFriends();
        decorateFriendCards();
        renderSocialInbox();
        renderShop();
        renderDuel();
        renderStartDuelModal();
        renderDuelExitModal();
        renderDuelResultModal();
    }

    function renderScreens() {
        const active = state.ui.screen;
        elements.screens.forEach(function (screen) {
            screen.classList.toggle("is-active", screen.getAttribute("data-screen") === active);
        });
        const nav = active === "quests" || active === "quest-detail" ? "home" : active;
        elements.bottomNavButtons.forEach(function (button) {
            button.classList.toggle("is-active", button.getAttribute("data-nav-target") === nav);
        });
    }

    function renderProfile() {
        elements.profileName.textContent = state.player.name;
        elements.profileLevel.textContent = String(state.player.level);
        elements.profileMoney.textContent = formatMoney(state.player.money);
        elements.shopMoney.textContent = state.player.money + " РјРѕРЅРµС‚";
        elements.profileAvatar.textContent = state.player.name.slice(0, 1).toUpperCase();
        const progressTarget = Math.max(1, state.player.levelProgressTarget || 100);
        const progressCurrent = Math.max(0, Math.min(progressTarget, state.player.levelProgressCurrent || 0));
        elements.profileLevelProgressFill.style.width = Math.round((progressCurrent / progressTarget) * 100) + "%";
        elements.profileLevelProgressText.textContent = progressCurrent + " / " + progressTarget;
    }

    function renderQueueStatus() {
        const queued = state.matchmaking && state.matchmaking.status === "QUEUED";
        elements.queueStatusCard.classList.toggle("hidden", !queued);
        if (!queued) {
            return;
        }
        const queuedAt = state.matchmaking.queuedAt || Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - queuedAt) / 1000));
        elements.queueStatusTime.textContent = formatQueueElapsed(elapsedSeconds);
        elements.queueStatusNote.textContent = state.matchmaking.message || "Р–РґС‘Рј СЃРѕРїРµСЂРЅРёРєР° РІ РѕС‡РµСЂРµРґРё.";
        elements.queueCancelButton.disabled = false;
    }

    function renderHeroStats() {
        if (!elements.heroStats || !elements.statPointsBadge) {
            return;
        }
        const stats = [
            { id: "strength", label: "РЎРёР»Р°", value: state.player.strength || 0 },
            { id: "reaction", label: "Р РµР°РєС†РёСЏ", value: state.player.reaction || 0 },
            { id: "analysis", label: "РђРЅР°Р»РёР·", value: state.player.analysis || 0 }
        ];
        const available = Math.max(0, state.player.availableStatPoints || 0);
        elements.statPointsBadge.textContent = String(available);
        elements.heroStats.innerHTML = stats.map(function (stat) {
            return [
                '<article class="hero-stat-card">',
                '<div class="hero-stat-head">',
                '<div class="hero-stat-line">',
                '<span class="hero-stat-name">' + escapeHtml(stat.label) + "</span>",
                '<strong class="hero-stat-value">' + escapeHtml(String(stat.value)) + "</strong>",
                available > 0 ? '<button class="hero-stat-button" type="button" data-stat="' + escapeHtml(stat.id) + '">+1</button>' : "",
                "</div>",
                "</div>",
                "</article>"
            ].join("");
        }).join("");
    }

    function renderRegistrationModal() {
        const auth = state.auth || {};
        const shouldOpen = !auth.registered;
        elements.registrationModal.classList.toggle("hidden", !shouldOpen);
        elements.registrationModal.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
        if (!shouldOpen) {
            return;
        }
        const isDemo = Boolean(auth.demoMode);
        elements.registrationCopy.textContent = isDemo
            ? "Р’РІРµРґРё РЅРёРєРЅРµР№Рј. Р’РЅРµ Telegram РѕРЅ СЃРѕС…СЂР°РЅРёС‚СЃСЏ С‚РѕР»СЊРєРѕ РІ СЌС‚РѕРј Р±СЂР°СѓР·РµСЂРµ."
            : "Р’РІРµРґРё РЅРёРєРЅРµР№Рј. РђРєРєР°СѓРЅС‚ Р±СѓРґРµС‚ Р·Р°РєСЂРµРїР»РµРЅ Р·Р° С‚РІРѕРёРј Telegram ID.";
        if (!elements.registrationNickname.value) {
            elements.registrationNickname.value = auth.nickname || "";
        }
        if (auth.initError && !isDemo) {
            showRegistrationError(auth.initError);
        } else {
            elements.registrationError.textContent = "";
            elements.registrationError.classList.add("hidden");
        }
    }

    function renderQuestCounters() {
        if (!elements.questBadge || !elements.questCounter) {
            return;
        }
        const label = String(Math.min(9, getActiveQuests().length));
        elements.questBadge.textContent = label;
        elements.questCounter.textContent = label;
    }

    function renderJournal() {
        if (!elements.journalList) {
            return;
        }
        if (!state.journal.length) {
            elements.journalList.innerHTML = "";
            return;
        }
        elements.journalList.innerHTML = state.journal.slice(0, 6).map(function (entry) {
            return '<article class="journal-entry"><p>' + decorateText(entry.text) + '</p><small>' + escapeHtml(formatTimestamp(entry.createdAt)) + "</small></article>";
        }).join("");
    }

    function renderQuestList() {
        if (!elements.questList) {
            return;
        }
        const quests = getActiveQuests();
        if (!quests.length) {
            elements.questList.innerHTML = '<article class="quest-card"><p>РђРєС‚РёРІРЅС‹С… РєРІРµСЃС‚РѕРІ РЅРµС‚. Р”РЅРµРІРЅРёРє СЃРєРѕСЂРѕ РїРѕРґР±СЂРѕСЃРёС‚ РЅРѕРІСѓСЋ РЅР°РІРѕРґРєСѓ.</p></article>';
            return;
        }
        elements.questList.innerHTML = quests.map(function (quest) {
            return [
                '<article class="quest-card">',
                "<h3>" + escapeHtml(quest.title) + "</h3>",
                "<p>" + escapeHtml(quest.description) + "</p>",
                '<div class="quest-chip-row"><span class="chip">' + escapeHtml(quest.location) + '</span><span class="timer-chip">' + escapeHtml(formatDuration(quest.expiresAt - Date.now())) + "</span></div>",
                '<div class="quest-actions"><button class="primary-button" data-action="open" data-quest-id="' + escapeHtml(quest.id) + '" type="button" onclick="window.PolusApp && window.PolusApp.openQuest(\'' + escapeJs(quest.id) + '\')">' + (quest.status === "inProgress" ? "РџСЂРѕРґРѕР»Р¶РёС‚СЊ" : "Р’С‹РїРѕР»РЅРёС‚СЊ") + '</button><button class="secondary-button" data-action="delay" data-quest-id="' + escapeHtml(quest.id) + '" type="button" onclick="window.PolusApp && window.PolusApp.delayQuest(\'' + escapeJs(quest.id) + '\')">РћС‚Р»РѕР¶РёС‚СЊ</button></div>',
                "</article>"
            ].join("");
        }).join("");
    }

    function renderQuestDetail() {
        if (!elements.questDetailTitle || !elements.questDetailSubtitle || !elements.questStoryText || !elements.questChoiceList || !elements.questStateTags || !elements.questStateCount || !elements.questPocketList || !elements.questPocketCount) {
            return;
        }
        const quest = getQuest(state.ui.activeQuestId);
        if (!quest) {
            elements.questDetailTitle.textContent = "РўРµРєСЃС‚РѕРІС‹Р№ РєРІРµСЃС‚";
            elements.questDetailSubtitle.textContent = "Р’С‹Р±РµСЂРё РёСЃС‚РѕСЂРёСЋ РёР· СЃРїРёСЃРєР°";
            elements.questStoryText.innerHTML = "<p>РћС‚РєСЂРѕР№ РєРІРµСЃС‚, С‡С‚РѕР±С‹ СѓРІРёРґРµС‚СЊ СЃС†РµРЅСѓ, РІС‹Р±РѕСЂС‹ Рё РєР°СЂРјР°РЅРЅС‹Р№ РёРЅРІРµРЅС‚Р°СЂСЊ.</p>";
            elements.questChoiceList.innerHTML = "";
            elements.questStateTags.innerHTML = "";
            elements.questStateCount.textContent = "0";
            elements.questPocketList.innerHTML = "";
            elements.questPocketCount.textContent = "0";
            return;
        }
        const scene = getQuestScene(quest);
        elements.questDetailTitle.textContent = quest.title;
        elements.questDetailSubtitle.textContent = scene.subtitle;
        elements.questStoryText.innerHTML = scene.text.map(function (paragraph) {
            return "<p>" + decorateText(paragraph) + "</p>";
        }).join("");
        elements.questChoiceList.innerHTML = scene.choices.map(function (choice) {
            const missingItem = choice.requiresItem && !hasItem(choice.requiresItem);
            const missingStat = choice.requiresStat && !meetsChoiceStat(choice);
            const disabled = missingItem || missingStat;
            const missingNote = missingItem
                ? '<span class="text-negative">РќРµ С…РІР°С‚Р°РµС‚ РїСЂРµРґРјРµС‚Р°.</span>'
                : missingStat
                    ? '<span class="text-negative">РќСѓР¶РЅРѕ: ' + escapeHtml(getStatLabel(choice.requiresStat)) + " " + escapeHtml(String(choice.requiresStatValue)) + ".</span>"
                    : "";
            return [
                '<button class="choice-button" type="button" data-quest-id="' + escapeHtml(quest.id) + '" data-choice-id="' + escapeHtml(choice.id) + '" onclick="window.PolusApp && window.PolusApp.chooseQuestAction(\'' + escapeJs(quest.id) + '\', \'' + escapeJs(choice.id) + '\')"' + (disabled ? " disabled" : "") + ">",
                "<strong>" + escapeHtml(choice.label) + "</strong>",
                '<span class="choice-note">' + decorateText(choice.note || "") + (missingNote ? " " + missingNote : "") + "</span>",
                "</button>"
            ].join("");
        }).join("");
        elements.questStateTags.innerHTML = scene.tags.map(function (tag) {
            return '<span class="tag">' + escapeHtml(tag) + "</span>";
        }).join("");
        elements.questStateCount.textContent = String(scene.tags.length);
        const pocketItems = getPocketInventory();
        elements.questPocketList.innerHTML = pocketItems.map(function (item) {
            return '<article class="pocket-card"><div><strong>' + escapeHtml(item.name) + "</strong><p>" + escapeHtml(item.description) + "</p></div><strong>x" + escapeHtml(String(item.quantity)) + "</strong></article>";
        }).join("");
        elements.questPocketCount.textContent = String(pocketItems.length);
    }

    function renderInventory() {
        if (elements.inventoryPlaceholder) {
            elements.inventoryPlaceholder.innerHTML = "<h3>Р Р°Р·РґРµР» РІ РїРµСЂРµСЂР°Р±РѕС‚РєРµ</h3><p>РРЅРІРµРЅС‚Р°СЂСЊ Рё Р°СѓРіРјРµРЅС‚Р°С†РёРё РІСЂРµРјРµРЅРЅРѕ СЃРєСЂС‹С‚С‹ РґРѕ СЃР»РµРґСѓСЋС‰РµР№ РІРµСЂСЃРёРё.</p>";
        }
    }

    function renderFriends() {
        const requests = Array.isArray(state.friendRequests) ? state.friendRequests : [];
        const friends = getDisplayFriends();
        elements.friendRequestBadge.textContent = String(Math.min(9, requests.length));
        elements.friendRequestPanel.innerHTML = requests.length ? [
            '<section class="friend-request-stack">',
            '<div class="panel-header friend-subheader"><h3 class="panel-title panel-title-small">Приглашения</h3></div>',
            requests.map(function (request) {
                const online = request.status === "online";
                return [
                    '<article class="friend-card friend-request-card">',
                    '<h3>' + escapeHtml(request.name) + '</h3>',
                    '<div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'Онлайн' : 'Оффлайн') + '</span><span class="timer-chip">Уровень ' + escapeHtml(String(request.level)) + '</span></div>',
                    '<div class="friend-actions">',
                    '<button class="primary-button full-width" type="button" data-request-accept-id="' + escapeHtml(request.id) + '">Принять</button>',
                    '<button class="secondary-button full-width" type="button" data-request-reject-id="' + escapeHtml(request.id) + '">Отклонить</button>',
                    '</div>',
                    '</article>'
                ].join('');
            }).join(''),
            '</section>'
        ].join('') : '';
        elements.friendList.innerHTML = friends.length ? friends.map(function (friend) {
            const online = friend.status === 'online';
            return [
                '<article class="friend-card">',
                '<h3>' + escapeHtml(friend.name) + '</h3>',
                '<div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'Онлайн' : 'Оффлайн') + '</span><span class="timer-chip">Уровень ' + escapeHtml(String(friend.level)) + '</span></div>',
                '<div class="friend-actions">',
                '<button class="secondary-button full-width" data-friend-chat-id="' + escapeHtml(friend.id) + '" type="button">Написать сообщение</button>',
                '<button class="secondary-button full-width friend-action-profile" data-friend-profile-id="' + escapeHtml(friend.id) + '" type="button">Посмотреть профиль</button>',
                '</div>',
                '</article>'
            ].join('');
        }).join('') : '<article class="friend-card"><p>Пока никого нет в друзьях. Найди игрока по никнейму и отправь запрос.</p></article>';
    }

    function decorateFriendCards() {
        return;
    }

    function ensureSocialThread(friend) {
        state.social = state.social || {};
        state.social.threads = Array.isArray(state.social.threads) ? state.social.threads : [];
        const existing = state.social.threads.find(function (thread) { return thread.friendId === friend.id; });
        if (existing) {
            existing.friendName = friend.name;
            existing.level = friend.level;
            existing.status = friend.status;
            return existing;
        }
        const thread = {
            id: uid('social-thread'),
            friendId: friend.id,
            friendName: friend.name,
            level: friend.level,
            status: friend.status,
            messages: []
        };
        state.social.threads.unshift(thread);
        return thread;
    }

    function syncSocialThreadsWithFriends() {
        if (!state.social || !Array.isArray(state.social.threads)) {
            return;
        }
        state.social.threads.forEach(function (thread) {
            const friend = getFriendById(thread.friendId);
            if (friend) {
                thread.friendName = friend.name;
                thread.level = friend.level;
                thread.status = friend.status;
            }
        });
    }

    function openFriendChat(friendId) {
        const friend = getFriendById(friendId);
        if (!friend) {
            return;
        }
        const thread = ensureSocialThread(friend);
        state.social.isOpen = true;
        state.social.activeThreadId = thread.id;
        saveState();
        renderSocialInbox();
    }

    function openSocialInbox(threadId) {
        state.social = state.social || {};
        state.social.isOpen = true;
        if (threadId) {
            state.social.activeThreadId = threadId;
        } else if (!state.social.activeThreadId && Array.isArray(state.social.threads) && state.social.threads.length) {
            state.social.activeThreadId = state.social.threads[0].id;
        }
        saveState();
        renderSocialInbox();
    }

    function closeSocialInbox() {
        if (!state.social) {
            return;
        }
        state.social.isOpen = false;
        saveState();
        renderSocialInbox();
    }

    function submitSocialChat() {
        if (!state.social || !Array.isArray(state.social.threads)) {
            return;
        }
        const activeThread = state.social.threads.find(function (thread) {
            return thread.id === state.social.activeThreadId;
        });
        const text = elements.socialChatInput.value.trim();
        if (!activeThread || !text) {
            return;
        }
        activeThread.messages = Array.isArray(activeThread.messages) ? activeThread.messages : [];
        activeThread.messages.push({
            id: uid('social-message'),
            author: 'you',
            text: text,
            createdAt: Date.now()
        });
        elements.socialChatInput.value = '';
        saveState();
        renderSocialInbox();
    }

    function renderSocialInbox() {
        if (!elements.socialChatPanel) {
            return;
        }
        state.social = state.social || {};
        state.social.threads = Array.isArray(state.social.threads) ? state.social.threads : [];
        const threads = state.social.threads;
        const activeThread = threads.find(function (thread) { return thread.id === state.social.activeThreadId; }) || null;

        elements.socialChatFabBadge.textContent = String(Math.min(9, threads.length));
        elements.socialChatFabBadge.classList.toggle('hidden', threads.length === 0);
        elements.socialChatPanel.classList.toggle('hidden', !state.social.isOpen);
        elements.socialChatPanel.setAttribute('aria-hidden', state.social.isOpen ? 'false' : 'true');
        document.body.classList.toggle('social-open', Boolean(state.social.isOpen));

        if (!threads.length) {
            elements.socialChatThreadList.innerHTML = '<article class="social-chat-empty">Чаты появятся здесь после первого диалога с другом.</article>';
            elements.socialChatThreadTitle.textContent = 'Выбери чат';
            elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Открой чат через карточку друга.</div>';
            elements.socialChatInput.disabled = true;
            elements.socialChatSend.disabled = true;
            return;
        }

        elements.socialChatThreadList.innerHTML = threads.map(function (thread) {
            return [
                '<button class="social-chat-thread-card' + (activeThread && activeThread.id === thread.id ? ' is-active' : '') + '" type="button" data-social-thread-id="' + escapeHtml(thread.id) + '">',
                '<strong>' + escapeHtml(thread.friendName || 'Друг') + '</strong>',
                '<span>' + escapeHtml((thread.status === 'online' ? 'Онлайн' : 'Оффлайн') + ' · Ур. ' + (thread.level || 1)) + '</span>',
                '</button>'
            ].join('');
        }).join('');

        if (!activeThread) {
            elements.socialChatThreadTitle.textContent = 'Выбери чат';
            elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Выбери диалог слева.</div>';
            elements.socialChatInput.disabled = true;
            elements.socialChatSend.disabled = true;
            return;
        }

        elements.socialChatThreadTitle.textContent = activeThread.friendName || 'Друг';
        elements.socialChatMessages.innerHTML = (activeThread.messages || []).map(function (message) {
            const own = message.author === 'you';
            return [
                '<div class="social-chat-message' + (own ? ' social-chat-message-own' : '') + '">',
                '<div class="social-chat-message-bubble">',
                '<strong>' + escapeHtml(own ? state.player.name : (activeThread.friendName || 'Друг')) + '</strong>',
                '<p>' + escapeHtml(message.text || '') + '</p>',
                '<small>' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</small>',
                '</div>',
                '</div>'
            ].join('');
        }).join('');
        elements.socialChatInput.disabled = false;
        elements.socialChatSend.disabled = false;
        elements.socialChatMessages.scrollTop = elements.socialChatMessages.scrollHeight;
    }

    function renderShop() {
        const activeSection = state.ui.shopSection || "standard";
        elements.shopTabButtons.forEach(function (button) {
            button.classList.toggle("is-active", button.getAttribute("data-shop-section") === activeSection);
        });
        if (elements.premiumWorkBanner) {
            elements.premiumWorkBanner.classList.toggle("hidden", activeSection !== "premium");
        }
        elements.shopList.innerHTML = renderShopSection(activeSection);
    }

    function renderShopSection(section) {
        const isPremium = section === "premium";
        const items = state.shop.filter(function (item) { return item.section === section; });
        return [
            '<section class="shop-section">',
            items.map(function (item) {
                const ownedPremium = item.section === "premium" && state.premium.owned.indexOf(item.id) >= 0;
                const alreadyOwned = ownedPremium || item.section === "premium";
                const priceLabel = item.section === "premium" ? item.price + " " + RUBLE_SIGN : item.price + " РјРѕРЅРµС‚";
                const buttonLabel = item.section === "premium" ? "РЎРєРѕСЂРѕ" : "РљСѓРїРёС‚СЊ";
                return '<article class="shop-card' + (item.section === "premium" ? " shop-card-premium" : "") + '">' + renderShopPreview(item) + '<h3>' + escapeHtml(item.name) + '</h3><div class="shop-price-row"><strong>' + escapeHtml(priceLabel) + '</strong></div><div class="shop-actions"><button class="' + (item.section === "premium" ? "secondary-button" : "primary-button") + '" data-shop-id="' + escapeHtml(item.id) + '" type="button" onclick="window.PolusApp && window.PolusApp.buy(\'' + escapeJs(item.id) + '\')"' + (alreadyOwned ? " disabled" : "") + '>' + escapeHtml(buttonLabel) + "</button></div></article>";
            }).join(""),
            "</section>"
        ].join("");
    }

    function renderShopPreview(item) {
        if (item.section !== "premium") {
            return "";
        }
        if (item.previewType === "skin") {
            return '<div class="shop-preview shop-preview-skin shop-preview-' + escapeHtml(item.previewTone || "crimson") + '"><div class="shop-preview-avatar">Р В</div></div>';
        }
        return '<div class="shop-preview shop-preview-backdrop shop-preview-' + escapeHtml(item.previewTone || "polar") + '"></div>';
    }

    function openAugmentPicker(slot) {
        showToast("РђСѓРіРјРµРЅС‚Р°С†РёРё РІСЂРµРјРµРЅРЅРѕ СЃРєСЂС‹С‚С‹ РґРѕ РїРµСЂРµСЂР°Р±РѕС‚РєРё.");
    }

    function closeAugmentPicker() {
        state.ui.augmentPickerSlot = null;
    }

    function selectAugment(augmentId) {
        showToast("РђСѓРіРјРµРЅС‚Р°С†РёРё РІСЂРµРјРµРЅРЅРѕ СЃРєСЂС‹С‚С‹ РґРѕ РїРµСЂРµСЂР°Р±РѕС‚РєРё.");
    }

    function setShopSection(section) {
        state.ui.shopSection = ["weapon", "defense", "support"].indexOf(section) >= 0 ? section : "weapon";
        saveState();
        renderShop();
    }

    function viewFriendProfile(friendId) {
        const friend = getFriendById(friendId);
        if (!friend) {
            return;
        }
        showToast(friend.name + " В· СѓСЂРѕРІРµРЅСЊ " + friend.level + " В· " + (friend.status === "online" ? "РѕРЅР»Р°Р№РЅ" : "РѕС„С„Р»Р°Р№РЅ") + ".");
    }

    function getOwnedAugments(slot) {
        const normalizedSlot = slot || "";
        return state.shop.filter(function (item) {
            return item.kind === "augment"
                && item.slot === normalizedSlot
                && hasAugment(item.augmentId);
        });
    }

    function getActiveAugment(slot) {
        const owned = getOwnedAugments(slot);
        return owned.length ? owned[0] : null;
    }

    function getAugmentSlotConfig(slot) {
        return AUGMENT_SLOTS.find(function (entry) { return entry.id === slot; }) || AUGMENT_SLOTS[0];
    }

    function renderAugmentModal() {
        if (elements.augmentModal) {
            elements.augmentModal.classList.add("hidden");
            elements.augmentModal.setAttribute("aria-hidden", "true");
        }
    }

    function hasAugment(augmentId) {
        return state.inventory.unlockedAugments.indexOf(augmentId) >= 0;
    }

    function unlockAugment(augmentId) {
        if (!augmentId || hasAugment(augmentId)) {
            return false;
        }
        state.inventory.unlockedAugments.push(augmentId);
        return true;
    }

    function renderDuel() {
        const duel = state.duel;
        if (!duel) {
            closeDuelSilently();
            return;
        }
        duel.activePanel = duel.activePanel || "logs";
        duel.chatMessages = Array.isArray(duel.chatMessages) ? duel.chatMessages : [];
        duel.chatError = duel.chatError || "";
        syncDuelInputs(duel);
        elements.duelTitle.textContent = "Р”СѓСЌР»СЊ";
        elements.duelRoundPill.textContent = "Р В Р В°РЎС“Р Р…Р Т‘ " + duel.round;
        elements.duelRoundTimer.textContent = formatDuration(getRoundTimeRemainingMs(duel));
        elements.duelYouName.textContent = duel.playerName || "РРіСЂРѕРє";
        elements.duelYouMeta.textContent = "";
        elements.duelYouAvatar.textContent = (duel.playerName || "РўС‹").slice(0, 1).toUpperCase();
        elements.duelOpponentName.textContent = duel.opponentName;
        elements.duelOpponentMeta.textContent = "";
        elements.duelOpponentAvatar.textContent = duel.opponentName.slice(0, 1).toUpperCase();
        elements.duelYouHp.textContent = duel.playerHp + " HP";
        elements.duelOpponentHp.textContent = duel.opponentHp + " HP";
        elements.duelYouFill.style.width = Math.max(0, Math.min(100, Math.round((duel.playerHp / getPlayerMaxHp()) * 100))) + "%";
        elements.duelOpponentFill.style.width = Math.max(0, Math.min(100, duel.opponentHp)) + "%";
        elements.duelRoundStatus.innerHTML = decorateText(buildDuelStatusText(duel));
        const duelSelectionComplete = isDuelSelectionComplete(duel);
        const duelHasPendingChanges = hasPendingDuelChanges(duel);
        const submitButtonLabel = duel.finished
            ? "Р‘РѕР№ Р·Р°РІРµСЂС€РµРЅ"
            : duel.yourActionSubmitted
                ? (duelHasPendingChanges ? "РР·РјРµРЅРёС‚СЊ С…РѕРґ" : "РҐРѕРґ СЃРґРµР»Р°РЅ")
                : "РЎРґРµР»Р°С‚СЊ С…РѕРґ";
        elements.duelSubmitButton.textContent = submitButtonLabel;
        elements.duelSubmitButton.disabled = duel.finished
            || duel.autoBattleEnabled
            || !duel.canSubmitAction
            || !duelSelectionComplete
            || (duel.yourActionSubmitted && !duelHasPendingChanges);
        renderDuelControls();
        if (!duel.logs.length) {
            elements.duelLogList.innerHTML = '<div class="duel-log-round"><p class="duel-log-round-title">Р›С‘Рґ РјРѕР»С‡РёС‚. РџРµСЂРІС‹Р№ СЂР°Р·РјРµРЅ РµС‰Рµ РЅРµ РїСЂРѕРёР·РѕС€РµР».</p></div>';
        } else {
            elements.duelLogList.innerHTML = duel.logs.slice().reverse().map(function (entry) {
                const roundNumber = typeof entry.round === "number" ? entry.round : entry.roundNumber;
                const lines = Array.isArray(entry.lines) ? entry.lines : [];
                const title = lines.length ? lines[0] : "Р В Р В°РЎС“Р Р…Р Т‘ " + roundNumber;
                const detailLines = lines.slice(1);
                return '<div class="duel-log-round"><p class="duel-log-round-title">' + decorateText(title) + '</p>' + detailLines.map(function (line) {
                    return '<p class="duel-log-line">' + decorateText(line) + "</p>";
                }).join("") + "</div>";
            }).join("");
        }
        renderDuelChat(duel);
        elements.duelTabLogs.classList.toggle("is-active", duel.activePanel === "logs");
        elements.duelTabLogs.setAttribute("aria-selected", duel.activePanel === "logs" ? "true" : "false");
        elements.duelTabChat.classList.toggle("is-active", duel.activePanel === "chat");
        elements.duelTabChat.setAttribute("aria-selected", duel.activePanel === "chat" ? "true" : "false");
        elements.duelLogsPane.classList.toggle("hidden", duel.activePanel !== "logs");
        elements.duelChatPane.classList.toggle("hidden", duel.activePanel !== "chat");
        elements.duelClearLogButton.classList.toggle("hidden", duel.activePanel !== "logs");
        elements.duelOverlay.classList.remove("hidden");
        elements.duelOverlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("duel-open");
    }

    function updateDuelSelection(kind, value) {
        const duel = state.duel;
        if (!duel || duel.finished) {
            return;
        }
        if (duel.autoBattleEnabled) {
            return;
        }
        if (kind === "weapon") {
            duel.selectedWeapon = value;
        }
        if (kind === "shot") {
            duel.selectedShot = value;
        }
        if (kind === "dodge") {
            duel.selectedDodge = value;
        }
        syncDuelInputs(duel);
        saveState();
        renderDuel();
    }

    function clearDuelLog() {
        if (!state.duel) {
            return;
        }
        state.duel.logs = [];
        if (!state.duel.finished) {
            state.duel.resultText = "РЎРѕР±РµСЂРё С…РѕРґ РЅР° СЂР°СѓРЅРґ Рё РїСЂРѕРґР°РІРё Р»РёРЅРёСЋ СЃРѕРїРµСЂРЅРёРєР°.";
        }
        saveState();
        renderDuel();
    }

    function syncDuelInputs(duel) {
        duel.lastPlayerWeapon = duel.lastPlayerWeapon || "PISTOLS";
        duel.lastOpponentWeapon = duel.lastOpponentWeapon || "RIFLE";
        elements.duelWeaponSelect.value = duel.selectedWeapon || "";
        elements.duelShotSelect.value = duel.selectedShot || "";
        elements.duelDodgeSelect.value = duel.selectedDodge || "";
    }

    function renderDuelControls() {
        const duel = state.duel;
        const controlsDisabled = !duel || duel.finished || duel.autoBattleEnabled;
        toggleDuelButtonGroup(elements.duelWeaponButtons, duel ? duel.selectedWeapon : "");
        toggleDuelButtonGroup(elements.duelShotButtons, duel ? duel.selectedShot : "");
        toggleDuelButtonGroup(elements.duelDodgeButtons, duel ? duel.selectedDodge : "");
        [].concat(elements.duelWeaponButtons, elements.duelShotButtons, elements.duelDodgeButtons).forEach(function (button) {
            button.disabled = controlsDisabled;
        });
        elements.duelClearLogButton.disabled = !duel || !duel.logs.length || duel.mode === "pvp-live";
        if (!duel) {
            elements.duelAutoToggle.classList.remove("is-active", "is-pending");
            elements.duelAutoToggle.disabled = true;
            elements.duelAutoToggle.textContent = "Р’РєР»СЋС‡РёС‚СЊ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёР№ Р±РѕР№";
            elements.duelAutoNote.textContent = "";
            elements.duelAutoNote.classList.add("hidden");
            elements.duelAutoCover.classList.add("hidden");
            return;
        }
        const currentEnabled = Boolean(duel.autoBattleEnabled);
        const pendingEnabled = typeof duel.autoBattlePendingEnabled === "boolean" ? duel.autoBattlePendingEnabled : null;
        elements.duelAutoToggle.disabled = duel.finished;
        elements.duelAutoToggle.classList.toggle("is-active", currentEnabled);
        elements.duelAutoToggle.classList.toggle("is-pending", pendingEnabled !== null && pendingEnabled !== currentEnabled);
        elements.duelAutoToggle.textContent = currentEnabled ? "Р’С‹РєР»СЋС‡РёС‚СЊ Р°РІС‚РѕР±РѕР№" : "Р’РєР»СЋС‡РёС‚СЊ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёР№ Р±РѕР№";
        const note = currentEnabled
            ? (pendingEnabled === false ? "РЎРѕ СЃР»РµРґСѓСЋС‰РµРіРѕ СЂР°СѓРЅРґР° Р°РІС‚РѕР±РѕР№ РѕС‚РєР»СЋС‡РёС‚СЃСЏ." : "РђРІС‚РѕР±РѕР№ РІРєР»СЋС‡РµРЅ.")
            : (pendingEnabled === true ? "РЎРѕ СЃР»РµРґСѓСЋС‰РµРіРѕ СЂР°СѓРЅРґР° С…РѕРґС‹ Р±СѓРґСѓС‚ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёРјРё." : "");
        elements.duelAutoNote.textContent = note;
        elements.duelAutoNote.classList.toggle("hidden", !note);
        elements.duelAutoCover.classList.toggle("hidden", !currentEnabled || duel.finished);
    }

    function renderDuelChat(duel) {
        const isLiveChat = duel.mode === "pvp-live";
        const canWrite = isLiveChat && !duel.finished;
        const messages = duel.chatMessages || [];
        if (!messages.length) {
            elements.duelChatList.innerHTML = '<div class="duel-chat-entry"><p class="duel-chat-text">' + (isLiveChat ? "Р§Р°С‚ РїРѕРєР° РјРѕР»С‡РёС‚. РџРµСЂРІС‹Р№ С…РѕРґ РёР»Рё РїРµСЂРІРѕРµ СЃР»РѕРІРѕ вЂ” Р·Р° РІР°РјРё." : "Р§Р°С‚ РґРѕСЃС‚СѓРїРµРЅ С‚РѕР»СЊРєРѕ РІ PvP-РјР°С‚С‡Рµ РјРµР¶РґСѓ РґРІСѓРјСЏ РёРіСЂРѕРєР°РјРё.") + "</p></div>";
        } else {
            elements.duelChatList.innerHTML = messages.map(function (message) {
                const own = message.playerId && state.auth && message.playerId === state.auth.playerId;
                const systemMessage = Boolean(message.systemMessage);
                const infoMessage = systemMessage && /Р°РІС‚РѕРјР°С‚/i.test(String(message.text || ""));
                const extraClass = systemMessage ? (infoMessage ? " duel-chat-entry-info" : " duel-chat-entry-system") : (own ? " duel-chat-entry-own" : "");
                return '<div class="duel-chat-entry' + extraClass + '"><p class="duel-chat-meta">' + escapeHtml(message.displayName || "РРіСЂРѕРє") + " В· " + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</p><p class="duel-chat-text">' + escapeHtml(message.text || "") + "</p></div>";
            }).join("");
        }
        elements.duelChatInput.disabled = !canWrite;
        elements.duelChatSendButton.disabled = !canWrite;
        elements.duelChatInput.placeholder = canWrite ? "РќР°РїРёС€Рё СЃРѕРѕР±С‰РµРЅРёРµ СЃРѕРїРµСЂРЅРёРєСѓ" : "Р§Р°С‚ РЅРµРґРѕСЃС‚СѓРїРµРЅ";
        elements.duelChatError.textContent = duel.chatError || "";
        elements.duelChatError.classList.toggle("hidden", !duel.chatError);
        elements.duelChatList.scrollTop = elements.duelChatList.scrollHeight;
    }

    function setDuelPanel(panel) {
        if (!state.duel) {
            return;
        }
        state.duel.activePanel = panel === "chat" ? "chat" : "logs";
        saveState();
        renderDuel();
    }

    async function submitDuelChat() {
        if (!state.duel) {
            return;
        }
        const rawMessage = elements.duelChatInput.value.trim();
        if (!rawMessage) {
            return;
        }
        if (hasForbiddenLink(rawMessage)) {
            state.duel.chatError = "РЎСЃС‹Р»РєР° Р·Р°РїСЂРµС‰РµРЅР° РІ Р±РѕРµРІРѕРј С‡Р°С‚Рµ.";
            renderDuel();
            return;
        }
        if (state.duel.mode !== "pvp-live" || !state.duel.duelId) {
            state.duel.chatError = "Р§Р°С‚ РґРѕСЃС‚СѓРїРµРЅ С‚РѕР»СЊРєРѕ РІ PvP-РјР°С‚С‡Рµ.";
            renderDuel();
            return;
        }
        elements.duelChatSendButton.disabled = true;
        state.duel.chatError = "";
        try {
            const response = await apiFetch("/api/duel/" + encodeURIComponent(state.duel.duelId) + "/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message: rawMessage })
            });
            const payload = await response.json();
            elements.duelChatInput.value = "";
            await refreshLiveDuel(payload.duelId);
        } catch (error) {
            state.duel.chatError = error && error.message ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ СЃРѕРѕР±С‰РµРЅРёРµ.";
            renderDuel();
        } finally {
            elements.duelChatSendButton.disabled = false;
        }
    }

    function toggleDuelButtonGroup(buttons, activeValue) {
        buttons.forEach(function (button) {
            const isActive = button.getAttribute("data-value") === activeValue;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
    }

    function buildDuelMeta() {
        return "";
    }

    function buildDuelStatusText(duel) {
        if (duel.finished) {
            return duel.resultText;
        }
        if (duel.autoBattleEnabled) {
            return "Р­С‚РѕС‚ СЂР°СѓРЅРґ РёРґРµС‚ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё.";
        }
        if (duel.mode === "pvp-live") {
            if (duel.yourActionSubmitted) {
                return hasPendingDuelChanges(duel)
                    ? "РҐРѕРґ СЃРѕС…СЂР°РЅРµРЅ. РњРѕР¶РЅРѕ РёР·РјРµРЅРёС‚СЊ РµРіРѕ, РїРѕРєР° РЅРµ РёСЃС‚РµРє С‚Р°Р№РјРµСЂ СЂР°СѓРЅРґР°."
                    : "РҐРѕРґ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ. Р–РґРµРј РїСЂРѕС‚РёРІРЅРёРєР°.";
            }
            if (typeof duel.autoBattlePendingEnabled === "boolean") {
                return duel.autoBattlePendingEnabled
                    ? "РђРІС‚РѕР±РѕР№ РІРєР»СЋС‡РёС‚СЃСЏ СЃРѕ СЃР»РµРґСѓСЋС‰РµРіРѕ СЂР°СѓРЅРґР°."
                    : "РђРІС‚РѕР±РѕР№ РѕС‚РєР»СЋС‡РёС‚СЃСЏ СЃРѕ СЃР»РµРґСѓСЋС‰РµРіРѕ СЂР°СѓРЅРґР°.";
            }
        }
        if (duel.logs.length) {
            return duel.resultText + " " + DUEL_DEFAULT_NOTE;
        }
        return duel.resultText || DUEL_DEFAULT_NOTE;
    }

    function closeDuelSilently() {
        elements.duelOverlay.classList.add("hidden");
        elements.duelOverlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("duel-open");
    }

    function closeCurrentDuelToMenu() {
        state.ui.duelExitConfirmOpen = false;
        state.ui.duelResult = null;
        state.ui.screen = "home";
        state.matchmaking.queuedAt = null;
        state.duel = null;
        saveState();
        renderAll();
    }

    function hasActiveBattle() {
        return Boolean(state.duel && !state.duel.finished);
    }

    function renderStartDuelModal() {
        const config = state.ui.startDuelConfirm;
        const shouldOpen = Boolean(config);
        elements.startDuelModal.classList.toggle("hidden", !shouldOpen);
        elements.startDuelModal.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
        if (!shouldOpen) {
            return;
        }
        elements.startDuelTitle.textContent = config.title || "РќР°С‡Р°С‚СЊ Р±РѕР№?";
        elements.startDuelCopy.textContent = config.copy || "РџРѕРґС‚РІРµСЂРґРё, С‡С‚Рѕ С…РѕС‡РµС€СЊ РЅР°С‡Р°С‚СЊ Р±РѕР№.";
    }

    function renderDuelExitModal() {
        const shouldOpen = Boolean(state.duel && !state.duel.finished && state.ui.duelExitConfirmOpen);
        if (!shouldOpen) {
            elements.duelExitModal.classList.add("hidden");
            elements.duelExitModal.setAttribute("aria-hidden", "true");
            return;
        }
        elements.duelExitModal.classList.remove("hidden");
        elements.duelExitModal.setAttribute("aria-hidden", "false");
    }

    function renderDuelResultModal() {
        const result = state.ui.duelResult;
        const shouldOpen = Boolean(result);
        if (!elements.duelResultModal) {
            return;
        }
        elements.duelResultModal.classList.toggle("hidden", !shouldOpen);
        elements.duelResultModal.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
        if (!shouldOpen) {
            return;
        }
        elements.duelResultTitle.textContent = result.title || "Р‘РѕР№ Р·Р°РІРµСЂС€РµРЅ";
        elements.duelResultCopy.textContent = result.copy || "";
        elements.duelResultExp.textContent = formatSignedReward(result.experience || 0, " РѕРїС‹С‚Р°");
        elements.duelResultMoney.textContent = formatSignedReward(result.money || 0, " РјРѕРЅРµС‚");
    }

    function openDuelResultModal(config) {
        state.ui.duelExitConfirmOpen = false;
        state.ui.duelResult = {
            title: config.title || "Р‘РѕР№ Р·Р°РІРµСЂС€РµРЅ",
            copy: config.copy || "",
            experience: Number(config.experience) || 0,
            money: Number(config.money) || 0
        };
        saveState();
        renderDuelResultModal();
    }

    function submitCurrentDuelTurn() {
        if (!state.duel || state.duel.finished) {
            return;
        }
        if (state.duel.mode === "pvp-live") {
            submitLiveDuelAction();
            return;
        }
        if (!isDuelSelectionComplete(state.duel)) {
            showToast("Сначала выбери оружие, выстрел и уворот.");
            return;
        }
        resolveDuelRound(
            getCurrentDuelAction(state.duel),
            buildOpponentAction()
        );
    }

    function closeDuelResult() {
        state.matchmaking.status = "COMPLETED";
        state.matchmaking.duelId = null;
        closeCurrentDuelToMenu();
    }

    function closeDuel() {
        if (!state.duel) {
            return;
        }
        if (state.duel.finished) {
            state.matchmaking.status = "COMPLETED";
            state.matchmaking.duelId = null;
            closeCurrentDuelToMenu();
            return;
        }
        state.ui.duelExitConfirmOpen = true;
        saveState();
        renderDuelExitModal();
    }

    function cancelDuelExit() {
        state.ui.duelExitConfirmOpen = false;
        saveState();
        renderDuelExitModal();
    }

    async function confirmDuelExit() {
        if (!state.duel) {
            cancelDuelExit();
            return;
        }
        if (elements.duelExitCancelButton) {
            elements.duelExitCancelButton.disabled = true;
        }
        if (elements.duelExitConfirmButton) {
            elements.duelExitConfirmButton.disabled = true;
        }
        try {
            if (state.duel.mode === "pvp-live" && !state.duel.finished && state.duel.duelId) {
                const duelId = state.duel.duelId;
                await apiFetch("/api/duel/" + encodeURIComponent(duelId) + "/forfeit", { method: "POST" });
                addJournal("РўС‹ РїРѕРєРёРЅСѓР» Р±РѕР№. Р—Р°СЃС‡РёС‚Р°РЅРѕ Р°РІС‚РѕРїРѕСЂР°Р¶РµРЅРёРµ.");
                state.matchmaking.status = "COMPLETED";
                state.matchmaking.duelId = null;
                await refreshLiveDuel(duelId);
                return;
            }

            const duel = state.duel;
            const opponentName = duel.opponentName || "РЎРѕРїРµСЂРЅРёРє";
            duel.finished = true;
            duel.playerHp = 0;
            duel.resultText = "РџРѕСЂР°Р¶РµРЅРёРµ. Р‘РѕР№ РѕСЃС‚Р°РЅРѕРІР»РµРЅ РґРѕ СЃР»РµРґСѓСЋС‰РµРіРѕ РІС‹С…РѕРґР°.";
            state.player.losses += 1;
            applyLocalExperienceGain(BATTLE_REWARD_EXPERIENCE);
            duel.logs.push({
                round: duel.round,
                lines: [
                    "Р Р°СѓРЅРґ " + duel.round + ": " + (duel.playerName || "РРіСЂРѕРє") + " РїРѕРєРёРґР°РµС‚ Р±РѕР№.",
                    "РС‚РѕРі: " + opponentName + " РїРѕР»СѓС‡Р°РµС‚ Р°РІС‚РѕРїРѕР±РµРґСѓ."
                ]
            });
            addJournal("РђРІС‚РѕРїРѕСЂР°Р¶РµРЅРёРµ РІ РґСѓСЌР»Рё Р·Р°СЃС‡РёС‚Р°РЅРѕ.");
            openDuelResultModal({
                title: "РўС‹ РїСЂРѕРёРіСЂР°Р»",
                copy: "РџРѕР±РµРґРёР» " + opponentName + ".",
                experience: BATTLE_REWARD_EXPERIENCE,
                money: 0
            });
            saveState();
            renderAll();
        } catch (error) {
            showToast(error && error.message ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕРєРёРЅСѓС‚СЊ Р±РѕР№.");
        } finally {
            if (elements.duelExitCancelButton) {
                elements.duelExitCancelButton.disabled = false;
            }
            if (elements.duelExitConfirmButton) {
                elements.duelExitConfirmButton.disabled = false;
            }
        }
    }

    function getQuest(questId) {
        return state.quests.find(function (quest) { return quest.id === questId; }) || null;
    }

    function getQuestScene(quest) {
        const story = QUEST_SCENES[quest.storyId];
        return story ? story[quest.nodeId] : null;
    }

    function getActiveQuests() {
        return state.quests.filter(function (quest) {
            return quest.status === "new" || quest.status === "inProgress";
        });
    }

    function getPocketInventory() {
        return state.inventory.backpack.filter(function (entry) {
            return ITEM_LIBRARY[entry.id] && ITEM_LIBRARY[entry.id].pocket;
        }).map(function (entry) {
            const definition = ITEM_LIBRARY[entry.id];
            return { name: definition.name, description: definition.description, quantity: entry.quantity };
        });
    }

    function addJournal(text, meta) {
        const details = meta && typeof meta === "object" ? meta : {};
        state.journal.unshift({
            id: uid("journal"),
            text: text,
            createdAt: Date.now(),
            sourceEventId: details.sourceEventId || null,
            location: details.location || null,
            locationLabel: details.locationLabel || null
        });
        state.journal = state.journal.slice(0, 20);
    }

    function hasItem(itemId) {
        return state.inventory.backpack.some(function (item) {
            return item.id === itemId && item.quantity > 0;
        });
    }

    function addItem(itemId, quantity) {
        const existing = state.inventory.backpack.find(function (item) { return item.id === itemId; });
        if (existing) {
            existing.quantity += quantity;
            return;
        }
        state.inventory.backpack.push({ id: itemId, quantity: quantity });
    }

    function consumeItem(itemId, quantity) {
        const item = state.inventory.backpack.find(function (entry) { return entry.id === itemId; });
        if (!item) {
            return false;
        }
        item.quantity = Math.max(0, item.quantity - quantity);
        state.inventory.backpack = state.inventory.backpack.filter(function (entry) { return entry.quantity > 0; });
        return true;
    }

    function showToast(text) {
        elements.toast.textContent = text;
        elements.toast.classList.remove("hidden");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(function () {
            elements.toast.classList.add("hidden");
        }, 2600);
    }

    function buildQuest(storyId, durationMs) {
        const template = {
            familyRelic: { title: "РЎРµРјРµР№РЅР°СЏ СЂРµР»РёРєРІРёСЏ", description: "РўСЂР°РєС‚РёСЂС‰РёРє РїСЂРѕСЃРёС‚ РІРµСЂРЅСѓС‚СЊ Р·Р°РїРµСЂС‚СѓСЋ С€РєР°С‚СѓР»РєСѓ РёР· РєР»Р°РґРѕРІРѕР№. Р’РЅСѓС‚СЂРё С‡С‚Рѕ-С‚Рѕ РІР°Р¶РЅРѕРµ.", location: "РўСЂР°РєС‚РёСЂ В«РЎРµРІРµСЂРЅС‹Р№ Р’РµС‚РµСЂВ»" },
            brassDisease: { title: "Р›Р°С‚СѓРЅРЅР°СЏ Р±РѕР»РµР·РЅСЊ", description: "РњРµС…Р°РЅРёРє РїСЂРѕСЃРёС‚ РїСЂРёРЅРµСЃС‚Рё С€РµСЃС‚РµСЂРЅСЋ. Р•РіРѕ Р°РІС‚РѕРјР°С‚ Р·Р°РµРґР°РµС‚, Р° РјР°СЃС‚РµСЂСЃРєР°СЏ СЃС‚С‹РЅРµС‚.", location: "РњР°СЃС‚РµСЂСЃРєР°СЏ РЅР° Р»СЊРґСѓ" },
            signalE3: { title: "РЎРёРіРЅР°Р» E3", description: "РЎР»Р°Р±С‹Р№ Р°РІР°СЂРёР№РЅС‹Р№ РјР°СЏРє РјРёРіР°РµС‚ Р·Р° Р»РёРЅРёРµР№ РїСЂРѕРІРѕРґРѕРІ. РўР°Рј РёР»Рё РєРѕРЅС‚РµР№РЅРµСЂ, РёР»Рё Р»РѕРІСѓС€РєР°.", location: "Р›РµРґСЏРЅРѕР№ РєРѕСЂРёРґРѕСЂ" },
            frostDebt: { title: "РЎРЅРµРіРѕРІРѕР№ РґРѕР»Рі", description: "РЎРІРµР¶Р°СЏ РјРµС‚РєР° РЅР° РґРІРµСЂРё СЃРєР»Р°РґР° РѕР±РµС‰Р°РµС‚ С‚Р°Р№РЅРёРє Рё РЅРµРїСЂРёСЏС‚РЅРѕСЃС‚Рё.", location: "РЎРєР»Р°Рґ Сѓ С‚РѕСЂРѕСЃРѕРІ" }
        }[storyId];
        return { id: uid("quest"), storyId: storyId, nodeId: "start", title: template.title, description: template.description, location: template.location, status: "new", expiresAt: Date.now() + durationMs };
    }

    function buildShopCatalog() {
        return [
            { id: "shop-medkit", section: "standard", kind: "item", itemId: "medkit", name: "РђРїС‚РµС‡РєР°", description: "Р‘РёРЅС‚С‹, СЃС‚РёРј Рё Р·Р°РїР°СЃ РїСЂРѕС‡РЅРѕСЃС‚Рё РЅР° РѕРґРёРЅ РіСЂСЏР·РЅС‹Р№ Р±РѕР№.", price: 20 },
            { id: "shop-gear", section: "standard", kind: "item", itemId: "brassGear", name: "Р›Р°С‚СѓРЅРЅР°СЏ С€РµСЃС‚РµСЂРЅСЏ", description: "Р РµРґРєР°СЏ РґРµС‚Р°Р»СЊ РґР»СЏ РєРІРµСЃС‚РѕРІ, СЂРµРјРѕРЅС‚Р° Рё С‚РµС…, РєС‚Рѕ РІРµС‡РЅРѕ С‡С‚Рѕ-С‚Рѕ С‡РёРЅРёС‚.", price: 18 },
            { id: "shop-ammo", section: "standard", kind: "item", itemId: "cartridges38", name: "РџР°С‚СЂРѕРЅС‹ .38", description: "РЎСѓС…РёРµ, С‡РёСЃС‚С‹Рµ Рё РїРѕРєР° РµС‰Рµ С‚РµРїР»С‹Рµ.", price: 9 },
            { id: "premium-skin-crimson", section: "premium", kind: "premium", name: "РЎРєРёРЅ В«Р‘Р°РіСЂСЏРЅС‹Р№ РєРѕР±Р°Р»СЊС‚В»", description: "РџСЂРµРјРёР°Р»СЊРЅС‹Р№ СЃРєРёРЅ РєР°СЂС‚РѕС‡РєРё РґСѓСЌР»СЏРЅС‚Р° СЃ СЂСѓР±РёРЅРѕРІС‹Рј СЃРІРµС‡РµРЅРёРµРј.", price: 149, previewType: "skin", previewTone: "crimson" },
            { id: "premium-backdrop-polar", section: "premium", kind: "premium", name: "Р¤РѕРЅ В«РџРѕР»СЏСЂРЅР°СЏ Р»Р°С‚СѓРЅСЊВ»", description: "РџСЂРµРјРёР°Р»СЊРЅС‹Р№ С„РѕРЅ С…Р°Р±Р° СЃ С…РѕР»РѕРґРЅРѕР№ Р»Р°С‚СѓРЅСЊСЋ Рё РјСЏРіРєРёРј СЃРЅРµРіРѕРІС‹Рј СЃРІРµС‡РµРЅРёРµРј.", price: 199, previewType: "backdrop", previewTone: "polar" }
        ];
    }

    function hydrateState(source) {
        const next = source && typeof source === "object" ? source : buildInitialState();
        next.version = 15;
        next.player = Object.assign({ name: "Новый игрок", level: 1, experience: 0, levelProgressCurrent: 0, levelProgressTarget: 100, money: 0, wins: 0, losses: 0, strength: 0, reaction: 0, analysis: 0, availableStatPoints: 0 }, next.player || {});
        const progressSnapshot = getLevelProgressSnapshot(typeof next.player.experience === "number" ? next.player.experience : 0);
        next.player.level = progressSnapshot.level;
        next.player.levelProgressCurrent = progressSnapshot.current;
        next.player.levelProgressTarget = progressSnapshot.target;
        next.player.availableStatPoints = Math.max(0, (next.player.level - 1) - ((next.player.strength || 0) + (next.player.reaction || 0) + (next.player.analysis || 0)));
        next.auth = Object.assign({ sessionToken: null, playerId: null, telegramUserId: null, nickname: "", registered: false, demoMode: false, initError: "" }, next.auth || {});
        next.matchmaking = Object.assign({ status: "IDLE", duelId: null, message: "", queuedAt: null }, next.matchmaking || {});
        next.world = Object.assign({ lastJournalEventAt: Date.now(), lastFriendSyncAt: 0 }, next.world || {});
        next.ui = Object.assign({ screen: "home", activeQuestId: null, shopSection: "standard", augmentPickerSlot: null, duelExitConfirmOpen: false, startDuelConfirm: null, duelResult: null }, next.ui || {});
        next.ui.startDuelAction = null;
        next.ui.duelResult = next.ui.duelResult || null;
        next.inventory = next.inventory || {};
        next.inventory.backpack = [];
        next.inventory.equipped = [];
        next.inventory.unlockedAugments = [];
        next.inventory.augmentSlots = {};
        next.premium = next.premium || { owned: [] };
        next.friends = Array.isArray(next.friends) ? next.friends : [];
        next.friendRequests = Array.isArray(next.friendRequests) ? next.friendRequests : [];
        next.social = Object.assign({ isOpen: false, activeThreadId: null, threads: [] }, next.social || {});
        next.social.threads = Array.isArray(next.social.threads) ? next.social.threads : [];
        next.shop = buildShopCatalog();
        next.journal = [];
        next.quests = [];
        return next;
    }

    function buildInitialState() {
        return {
            version: 15,
            auth: { sessionToken: null, playerId: null, telegramUserId: null, nickname: "", registered: false, demoMode: false, initError: "" },
            matchmaking: { status: "IDLE", duelId: null, message: "", queuedAt: null },
            player: { name: "Новый игрок", level: 1, experience: 0, levelProgressCurrent: 0, levelProgressTarget: 100, money: 0, wins: 0, losses: 0, strength: 0, reaction: 0, analysis: 0, availableStatPoints: 0 },
            world: { lastJournalEventAt: Date.now(), lastFriendSyncAt: 0 },
            ui: { screen: "home", activeQuestId: null, shopSection: "standard", augmentPickerSlot: null, duelExitConfirmOpen: false, startDuelConfirm: null, startDuelAction: null, duelResult: null },
            journal: [],
            inventory: { equipped: [], augmentSlots: {}, unlockedAugments: [], backpack: [] },
            friends: [],
            friendRequests: [],
            social: { isOpen: false, activeThreadId: null, threads: [] },
            premium: { owned: [] },
            shop: buildShopCatalog(),
            quests: [],
            duel: null
        };
    }

    function getDisplayFriends() {
        return Array.isArray(state.friends) ? state.friends.slice() : [];
    }

    function getFriendById(friendId) {
        return getDisplayFriends().find(function (entry) { return entry.id === friendId; }) || null;
    }

    function loadState() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return buildInitialState();
            }
            const parsed = JSON.parse(raw);
            return parsed && (parsed.version === 4 || parsed.version === 5 || parsed.version === 6 || parsed.version === 7 || parsed.version === 8 || parsed.version === 9 || parsed.version === 10 || parsed.version === 11 || parsed.version === 12 || parsed.version === 13 || parsed.version === 14 || parsed.version === 15) ? parsed : buildInitialState();
        } catch (error) {
            console.error(error);
            return buildInitialState();
        }
    }

    function saveState() {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn("Polus state persistence skipped", error);
        }
    }

    function weaponLabel(code) {
        return DUEL_WEAPONS[code].label;
    }

    function weaponInstrumentLabel(code) {
        return {
            PISTOLS: "РёР· РїРёСЃС‚РѕР»СЏ Рё С‰РёС‚Р°",
            RIFLE: "РёР· РІРёРЅС‚РѕРІРєРё",
            SHOTGUN: "РёР· РґСЂРѕР±РѕРІРёРєР°"
        }[code] || "";
    }

    function directionLabel(code) {
        return { LEFT: "РІР»РµРІРѕ", CENTER: "РїРѕ С†РµРЅС‚СЂСѓ", RIGHT: "РІРїСЂР°РІРѕ" }[code] || code;
    }

    function dodgeLabel(code) {
        return { LEFT: "СЃРјРµС‰Р°РµС‚СЃСЏ РІР»РµРІРѕ", STAY: "РѕСЃС‚Р°РµС‚СЃСЏ РїРѕ С†РµРЅС‚СЂСѓ", RIGHT: "СЃРјРµС‰Р°РµС‚СЃСЏ РІРїСЂР°РІРѕ" }[code] || code;
    }

    function buildDuelIntentLine(name, action) {
        return name + " СЃС‚СЂРµР»СЏРµС‚ " + directionLabel(action.shot) + " " + weaponInstrumentLabel(action.weapon) + " Рё " + dodgeLabel(action.dodge) + ".";
    }

    function isCompleteAction(action) {
        return Boolean(action && action.weapon && action.shot && action.dodge);
    }

    function actionsMatch(left, right) {
        if (!left && !right) {
            return true;
        }
        if (!left || !right) {
            return false;
        }
        return left.weapon === right.weapon && left.shot === right.shot && left.dodge === right.dodge;
    }

    function isDuelSelectionComplete(duel) {
        return isCompleteAction(getCurrentDuelAction(duel));
    }

    function getCurrentDuelAction(duel) {
        if (!duel) {
            return { weapon: null, shot: null, dodge: null };
        }
        return {
            weapon: duel.selectedWeapon || null,
            shot: duel.selectedShot || null,
            dodge: duel.selectedDodge || null
        };
    }

    function hasPendingDuelChanges(duel) {
        if (!duel || !duel.yourActionSubmitted || !duel.submittedAction) {
            return false;
        }
        return isCompleteAction(getCurrentDuelAction(duel)) && !actionsMatch(getCurrentDuelAction(duel), duel.submittedAction);
    }

    function getRoundTimeRemainingMs(duel) {
        if (!duel || duel.finished || !duel.roundDeadlineAt) {
            return 0;
        }
        return Math.max(0, duel.roundDeadlineAt - Date.now());
    }

    function pluralizeHits(count) {
        const remainderTen = count % 10;
        const remainderHundred = count % 100;
        if (remainderTen === 1 && remainderHundred !== 11) {
            return count + " РЎР‚Р В°Р В·";
        }
        if (remainderTen >= 2 && remainderTen <= 4 && (remainderHundred < 12 || remainderHundred > 14)) {
            return count + " РЎР‚Р В°Р В·Р В°";
        }
        return count + " РЎР‚Р В°Р В·";
    }

    function getLevelProgressSnapshot(experience) {
        const totalExperience = Math.max(0, Number(experience) || 0);
        let previousThreshold = 0;
        for (let index = 0; index < LEVEL_THRESHOLDS.length; index += 1) {
            const threshold = LEVEL_THRESHOLDS[index];
            if (totalExperience < threshold) {
                return {
                    level: index + 1,
                    current: totalExperience - previousThreshold,
                    target: threshold - previousThreshold
                };
            }
            previousThreshold = threshold;
        }
        return {
            level: LEVEL_THRESHOLDS.length + 1,
            current: Math.min(LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] - LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 2], totalExperience - LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 2]),
            target: 150
        };
    }

    function applyLocalExperienceGain(amount) {
        const gain = Math.max(0, Number(amount) || 0);
        if (!gain) {
            return;
        }
        const previousLevel = Number(state.player.level) || 1;
        state.player.experience = Math.max(0, Number(state.player.experience) || 0) + gain;
        const snapshot = getLevelProgressSnapshot(state.player.experience);
        state.player.level = snapshot.level;
        state.player.levelProgressCurrent = snapshot.current;
        state.player.levelProgressTarget = snapshot.target;
        if (snapshot.level > previousLevel) {
            state.player.availableStatPoints = Math.max(0, (state.player.availableStatPoints || 0) + (snapshot.level - previousLevel));
        }
    }

    function formatMoney(amount) {
        return String(amount);
    }

    function formatSignedReward(amount, suffix) {
        const value = Number(amount) || 0;
        return (value > 0 ? "+" : "") + value + suffix;
    }

    function formatDuration(milliseconds) {
        const safeMs = Math.max(0, milliseconds);
        const totalSeconds = Math.floor(safeMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return hours > 0 ? pad(hours) + ":" + pad(minutes) + ":" + pad(seconds) : pad(minutes) + ":" + pad(seconds);
    }

    function formatQueueElapsed(totalSeconds) {
        if (totalSeconds < 60) {
            return totalSeconds + " СЃРµРє";
        }
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return minutes + " РјРёРЅ " + pad(seconds) + " СЃРµРє";
    }

    function formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    }

    function hasForbiddenLink(text) {
        return CHAT_LINK_PATTERN.test(String(text || ""));
    }

    function getStatLabel(stat) {
        return {
            strength: "РЎРёР»Р°",
            reaction: "Р РµР°РєС†РёСЏ",
            analysis: "РђРЅР°Р»РёР·"
        }[stat] || stat;
    }

    function getStatValue(stat) {
        return Number(state.player && state.player[stat]) || 0;
    }

    function meetsChoiceStat(choice) {
        return getStatValue(choice.requiresStat) >= (choice.requiresStatValue || 0);
    }

    function decorateText(text) {
        let html = escapeHtml(normalizeResourceText(text));
        POSITIVE_MARKERS.forEach(function (pattern) {
            html = html.replace(new RegExp(pattern.source, pattern.flags), '<span class="text-positive">$&</span>');
        });
        NEGATIVE_MARKERS.forEach(function (pattern) {
            html = wrapContainingWordMatches(html, pattern, "text-negative");
        });
        DIRECTION_TERMS.forEach(function (term) {
            html = html.replace(new RegExp(escapeRegExp(term), "g"), '<span class="text-direction">$&</span>');
        });
        getRewardTerms().forEach(function (term) {
            html = html.replace(new RegExp(escapeRegExp(term), "g"), '<span class="text-positive">$&</span>');
        });
        return html;
    }

    function normalizeResourceText(text) {
        return String(text)
            .replace(new RegExp("([+-]?\\d+)\\s*" + escapeRegExp(RUBLE_SIGN), "g"), "$1 РјРѕРЅРµС‚")
            .replace(/([+-]?\d+)\s*РІвЂљР…/g, "$1 РјРѕРЅРµС‚");
    }

    function getRewardTerms() {
        return Object.keys(ITEM_LIBRARY).map(function (key) { return ITEM_LIBRARY[key].name; })
            .concat((state.shop || []).map(function (item) { return item.name; }));
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeJs(value) {
        return String(value)
            .replace(/\\/g, "\\\\")
            .replace(/'/g, "\\'");
    }

    function escapeRegExp(value) {
        return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function wrapContainingWordMatches(html, pattern, className) {
        const expression = new RegExp("(^|[^\\p{L}\\p{N}_-])([\\p{L}\\p{N}_-]*?(?:" + pattern.source + ")[\\p{L}\\p{N}_-]*)(?=$|[^\\p{L}\\p{N}_-])", "giu");
        return html.replace(expression, function (_, prefix, word) {
            return prefix + '<span class="' + className + '">' + word + "</span>";
        });
    }

    function uid(prefix) {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return prefix + "-" + crypto.randomUUID();
        }
        return prefix + "-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
    }

    function randomFrom(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    function buildInitialState() {
        return {
            version: 18,
            auth: { sessionToken: null, playerId: null, telegramUserId: null, nickname: "", registered: false, demoMode: false, initError: "" },
            matchmaking: { status: "IDLE", duelId: null, message: "", queuedAt: null },
            player: { name: "Новый игрок", money: 0, rating: 0, wins: 0, losses: 0 },
            world: { lastJournalEventAt: Date.now(), lastFriendSyncAt: 0 },
            ui: { screen: "home", activeQuestId: null, shopSection: "standard", augmentPickerSlot: null, duelExitConfirmOpen: false, startDuelConfirm: null, startDuelAction: null, duelResult: null },
            journal: [],
            inventory: { equipped: [], augmentSlots: {}, unlockedAugments: [], backpack: [] },
            friends: [],
            friendRequests: [],
            social: { isOpen: false, activeThreadId: null, threads: [] },
            premium: { owned: [] },
            shop: buildShopCatalog(),
            quests: [],
            duel: null
        };
    }

    function hydrateState(source) {
        const base = buildInitialState();
        const next = source && typeof source === "object" ? Object.assign({}, base, source) : base;
        next.version = 18;
        next.ui = Object.assign({}, base.ui, next.ui || {});
        next.inventory = { equipped: [], augmentSlots: {}, unlockedAugments: [], backpack: [] };
        next.premium = next.premium || { owned: [] };
        next.friends = Array.isArray(next.friends) ? next.friends : [];
        next.friendRequests = Array.isArray(next.friendRequests) ? next.friendRequests : [];
        next.social = Object.assign({ isOpen: false, activeThreadId: null, threads: [] }, next.social || {});
        next.social.threads = Array.isArray(next.social.threads) ? next.social.threads.filter(function (thread) {
            return next.friends.some(function (friend) { return friend.id === thread.friendId; });
        }) : [];
        next.shop = buildShopCatalog();
        next.journal = [];
        next.quests = [];
        return next;
    }

    function loadState() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return buildInitialState();
            }
            const parsed = JSON.parse(raw);
            return parsed && parsed.version === 18 ? parsed : buildInitialState();
        } catch (error) {
            console.error(error);
            return buildInitialState();
        }
    }

    function formatQueueElapsed(totalSeconds) {
        if (totalSeconds < 60) {
            return totalSeconds + " сек";
        }
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return minutes + " мин " + pad(seconds) + " сек";
    }

    function getStatLabel(stat) {
        return {
            strength: "Сила",
            reaction: "Реакция",
            analysis: "Анализ"
        }[stat] || stat;
    }

    function normalizeResourceText(text) {
        return String(text)
            .replace(new RegExp("([+-]?\\d+)\\s*" + escapeRegExp(RUBLE_SIGN), "g"), "$1 монет")
            .replace(/([+-]?\d+)\s*₽/g, "$1 монет");
    }

    function renderProfile() {
        elements.profileName.textContent = state.player.name;
        elements.profileLevel.textContent = String(state.player.level);
        elements.profileMoney.textContent = formatMoney(state.player.money);
        elements.shopMoney.textContent = state.player.money + " монет";
        elements.profileAvatar.textContent = (state.player.name || "И").slice(0, 1).toUpperCase();
        const progressTarget = Math.max(1, state.player.levelProgressTarget || 100);
        const progressCurrent = Math.max(0, Math.min(progressTarget, state.player.levelProgressCurrent || 0));
        elements.profileLevelProgressFill.style.width = Math.round((progressCurrent / progressTarget) * 100) + "%";
        elements.profileLevelProgressText.textContent = progressCurrent + " / " + progressTarget;
    }

    function renderQueueStatus() {
        const queued = state.matchmaking && state.matchmaking.status === "QUEUED";
        elements.queueStatusCard.classList.toggle("hidden", !queued);
        if (!queued) {
            return;
        }
        const queuedAt = state.matchmaking.queuedAt || Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - queuedAt) / 1000));
        elements.queueStatusTime.textContent = formatQueueElapsed(elapsedSeconds);
        elements.queueStatusNote.textContent = state.matchmaking.message || "Ждём соперника в очереди.";
        elements.queueCancelButton.disabled = false;
    }

    function renderHeroStats() {
        if (!elements.heroStats || !elements.statPointsBadge) {
            return;
        }
        const stats = [
            { id: "strength", label: "Сила", value: state.player.strength || 0 },
            { id: "reaction", label: "Реакция", value: state.player.reaction || 0 },
            { id: "analysis", label: "Анализ", value: state.player.analysis || 0 }
        ];
        const available = Math.max(0, state.player.availableStatPoints || 0);
        elements.statPointsBadge.textContent = String(available);
        elements.heroStats.innerHTML = stats.map(function (stat) {
            return [
                '<article class="hero-stat-card">',
                '<div class="hero-stat-head">',
                '<div class="hero-stat-line">',
                '<span class="hero-stat-name">' + escapeHtml(stat.label) + "</span>",
                '<strong class="hero-stat-value">' + escapeHtml(String(stat.value)) + "</strong>",
                available > 0
                    ? '<button class="hero-stat-button" type="button" data-stat="' + escapeHtml(stat.id) + '" onclick="window.PolusApp && window.PolusApp.allocateStat(\'' + escapeJs(stat.id) + '\')">+1</button>'
                    : "",
                "</div>",
                "</div>",
                "</article>"
            ].join("");
        }).join("");
    }

    function renderInventory() {
        if (elements.inventoryPlaceholder) {
            elements.inventoryPlaceholder.innerHTML = "<h3>Раздел в переработке</h3><p>Инвентарь и аугментации временно скрыты. Мы соберем их заново с новой структурой.</p>";
        }
    }

    function showRegistrationError(message) {
        elements.registrationError.textContent = message;
        elements.registrationError.classList.remove("hidden");
    }

    function renderRegistrationModal() {
        const auth = state.auth || {};
        const shouldOpen = !auth.registered;
        elements.registrationModal.classList.toggle("hidden", !shouldOpen);
        elements.registrationModal.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
        if (!shouldOpen) {
            return;
        }
        elements.registrationCopy.textContent = auth.demoMode
            ? "Введи никнейм. Вне Telegram он сохранится только в этом браузере."
            : "Введи никнейм. Аккаунт будет закреплен за твоим Telegram ID.";
        if (!elements.registrationNickname.value) {
            elements.registrationNickname.value = auth.nickname || "";
        }
        if (auth.initError && !auth.demoMode) {
            showRegistrationError(auth.initError);
        } else {
            elements.registrationError.textContent = "";
            elements.registrationError.classList.add("hidden");
        }
    }

    async function submitRegistration() {
        const nickname = elements.registrationNickname.value.trim();
        elements.registrationError.textContent = "";
        elements.registrationError.classList.add("hidden");
        if (!nickname) {
            showRegistrationError("Введи никнейм.");
            return;
        }
        if (nickname.length < 3 || nickname.length > 20) {
            showRegistrationError("Ник должен быть длиной от 3 до 20 символов.");
            return;
        }
        if (!/^[\p{L}\p{N}_-]+$/u.test(nickname)) {
            showRegistrationError("Ник может содержать только буквы, цифры, _ и -.");
            return;
        }
        elements.registrationSubmit.disabled = true;
        try {
            if (state.auth && state.auth.demoMode) {
                state.auth.nickname = nickname;
                state.auth.registered = true;
                state.player.name = nickname;
                state.player.money = 0;
                saveState();
                renderAll();
                showToast("Ник сохранен.");
                return;
            }
            if (!state.auth || !state.auth.sessionToken) {
                throw new Error("Открой Mini App через Telegram, чтобы зарегистрировать ник.");
            }
            const response = await fetch("/api/player/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Session-Token": state.auth.sessionToken
                },
                body: JSON.stringify({ nickname: nickname })
            });
            if (!response.ok) {
                throw new Error(await readApiError(response));
            }
            const player = await response.json();
            state.auth.nickname = player.nickname || nickname;
            state.auth.registered = Boolean(player.registered);
            syncPlayerFromServer(player, true);
            await loadFriendsOverview();
            saveState();
            renderAll();
            showToast("Аккаунт зарегистрирован.");
        } catch (error) {
            showRegistrationError(error && error.message ? error.message : "Не удалось зарегистрировать аккаунт.");
        } finally {
            elements.registrationSubmit.disabled = false;
        }
    }

    async function allocateStat(stat) {
        if (!state.auth.registered) {
            showToast("Сначала зарегистрируй аккаунт.");
            return;
        }
        if ((state.player.availableStatPoints || 0) <= 0) {
            showToast("Свободных очков пока нет.");
            return;
        }
        if (!state.auth.sessionToken || state.auth.demoMode) {
            state.player[stat] = (state.player[stat] || 0) + 1;
            state.player.availableStatPoints = Math.max(0, (state.player.availableStatPoints || 0) - 1);
            saveState();
            renderAll();
            showToast("Характеристика усилена.");
            return;
        }
        try {
            const response = await apiFetch("/api/player/stats", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ stat: stat })
            });
            syncPlayerFromServer(await response.json(), false);
            saveState();
            renderAll();
            showToast("Характеристика усилена.");
        } catch (error) {
            showToast(error && error.message ? error.message : "Не удалось распределить очко.");
        }
    }

    async function submitFriendSearch() {
        if (!state.auth.registered) {
            showToast("Сначала зарегистрируй аккаунт.");
            return;
        }
        const nickname = elements.friendSearchInput ? elements.friendSearchInput.value.trim() : "";
        if (!nickname) {
            showToast("Введи ник игрока.");
            return;
        }
        if (!state.auth.sessionToken || state.auth.demoMode) {
            showToast("Добавление друзей доступно только в Telegram-аккаунте.");
            return;
        }
        try {
            const response = await apiFetch("/api/friends/request", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ nickname: nickname })
            });
            applyFriendsOverview(await response.json());
            if (elements.friendSearchInput) {
                elements.friendSearchInput.value = "";
            }
            renderFriends();
            showToast("Запрос в друзья отправлен.");
        } catch (error) {
            showToast(error && error.message ? error.message : "Не удалось отправить запрос.");
        }
    }

    async function acceptFriendRequest(requestId) {
        if (!state.auth.sessionToken || state.auth.demoMode) {
            return;
        }
        try {
            const response = await apiFetch("/api/friends/request/" + encodeURIComponent(requestId) + "/accept", {
                method: "POST"
            });
            applyFriendsOverview(await response.json());
            renderFriends();
            showToast("Друг добавлен.");
        } catch (error) {
            showToast(error && error.message ? error.message : "Не удалось принять запрос.");
        }
    }

    async function rejectFriendRequest(requestId) {
        if (!state.auth.sessionToken || state.auth.demoMode) {
            return;
        }
        try {
            const response = await apiFetch("/api/friends/request/" + encodeURIComponent(requestId) + "/reject", {
                method: "POST"
            });
            applyFriendsOverview(await response.json());
            renderFriends();
            showToast("Запрос отклонен.");
        } catch (error) {
            showToast(error && error.message ? error.message : "Не удалось отклонить запрос.");
        }
    }

    function renderFriends() {
        const requests = Array.isArray(state.friendRequests) ? state.friendRequests : [];
        const friends = getDisplayFriends();
        elements.friendRequestBadge.textContent = String(Math.min(9, requests.length));
        elements.friendRequestPanel.innerHTML = requests.length ? [
            '<section class="friend-request-stack">',
            '<div class="panel-header friend-subheader"><h3 class="panel-title panel-title-small">Приглашения</h3></div>',
            requests.map(function (request) {
                const online = request.status === "online";
                return [
                    '<article class="friend-card friend-request-card">',
                    '<h3>' + escapeHtml(request.name) + '</h3>',
                    '<div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'Онлайн' : 'Оффлайн') + '</span><span class="timer-chip">Уровень ' + escapeHtml(String(request.level)) + '</span></div>',
                    '<div class="friend-actions">',
                    '<button class="primary-button full-width" type="button" data-request-accept-id="' + escapeHtml(request.id) + '">Принять</button>',
                    '<button class="secondary-button full-width" type="button" data-request-reject-id="' + escapeHtml(request.id) + '">Отклонить</button>',
                    '</div>',
                    '</article>'
                ].join("");
            }).join(""),
            '</section>'
        ].join("") : "";
        elements.friendList.innerHTML = friends.length ? friends.map(function (friend) {
            const online = friend.status === "online";
            return [
                '<article class="friend-card">',
                '<h3>' + escapeHtml(friend.name) + '</h3>',
                '<div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'Онлайн' : 'Оффлайн') + '</span><span class="timer-chip">Уровень ' + escapeHtml(String(friend.level)) + '</span></div>',
                '<div class="friend-actions">',
                '<button class="secondary-button full-width" data-friend-chat-id="' + escapeHtml(friend.id) + '" type="button">Написать сообщение</button>',
                '<button class="secondary-button full-width friend-action-profile" data-friend-profile-id="' + escapeHtml(friend.id) + '" type="button">Посмотреть профиль</button>',
                '</div>',
                '</article>'
            ].join("");
        }).join("") : '<article class="friend-card"><p>Пока друзей нет. Найди игрока по никнейму и отправь запрос.</p></article>';
    }

    function syncSocialThreadsWithFriends() {
        if (!state.social || !Array.isArray(state.social.threads)) {
            return;
        }
        const knownIds = new Set(getDisplayFriends().map(function (friend) { return friend.id; }));
        state.social.threads = state.social.threads.filter(function (thread) {
            return knownIds.has(thread.friendId);
        });
        state.social.threads.forEach(function (thread) {
            const friend = getFriendById(thread.friendId);
            if (friend) {
                thread.friendName = friend.name;
                thread.level = friend.level;
                thread.status = friend.status;
            }
        });
        if (state.social.activeThreadId && !state.social.threads.some(function (thread) { return thread.id === state.social.activeThreadId; })) {
            state.social.activeThreadId = state.social.threads.length ? state.social.threads[0].id : null;
        }
    }

    function submitSocialChat() {
        if (!state.social || !Array.isArray(state.social.threads)) {
            return;
        }
        const activeThread = state.social.threads.find(function (thread) {
            return thread.id === state.social.activeThreadId;
        });
        const text = elements.socialChatInput.value.trim();
        if (!activeThread || !text) {
            return;
        }
        activeThread.messages = Array.isArray(activeThread.messages) ? activeThread.messages : [];
        activeThread.messages.push({
            id: uid("social-message"),
            author: "you",
            text: text,
            createdAt: Date.now()
        });
        elements.socialChatInput.value = "";
        saveState();
        renderSocialInbox();
    }

    function renderSocialInbox() {
        if (!elements.socialChatPanel) {
            return;
        }
        state.social = state.social || {};
        state.social.threads = Array.isArray(state.social.threads) ? state.social.threads : [];
        const threads = state.social.threads;
        const activeThread = threads.find(function (thread) { return thread.id === state.social.activeThreadId; }) || null;

        elements.socialChatFabBadge.textContent = String(Math.min(9, threads.length));
        elements.socialChatFabBadge.classList.toggle("hidden", threads.length === 0);
        elements.socialChatPanel.classList.toggle("hidden", !state.social.isOpen);
        elements.socialChatPanel.setAttribute("aria-hidden", state.social.isOpen ? "false" : "true");

        if (!threads.length) {
            elements.socialChatThreadList.innerHTML = '<article class="social-chat-empty">Открытые диалоги появятся здесь после первого сообщения другу.</article>';
            elements.socialChatThreadTitle.textContent = "Выбери чат";
            elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Выбери друга и начни переписку.</div>';
            elements.socialChatInput.disabled = true;
            elements.socialChatSend.disabled = true;
            return;
        }

        elements.socialChatThreadList.innerHTML = threads.map(function (thread) {
            return [
                '<button class="social-chat-thread-card' + (activeThread && activeThread.id === thread.id ? ' is-active' : '') + '" type="button" data-social-thread-id="' + escapeHtml(thread.id) + '">',
                '<strong>' + escapeHtml(thread.friendName || 'Друг') + '</strong>',
                '<span>' + escapeHtml(thread.status === "online" ? "Онлайн" : "Оффлайн") + " · Уровень " + escapeHtml(String(thread.level || 1)) + '</span>',
                '</button>'
            ].join("");
        }).join("");

        if (!activeThread) {
            elements.socialChatThreadTitle.textContent = "Выбери чат";
            elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Выбери диалог слева.</div>';
            elements.socialChatInput.disabled = true;
            elements.socialChatSend.disabled = true;
            return;
        }

        elements.socialChatThreadTitle.textContent = activeThread.friendName || "Друг";
        elements.socialChatMessages.innerHTML = (activeThread.messages || []).length ? (activeThread.messages || []).map(function (message) {
            const own = message.author === "you";
            return [
                '<div class="social-chat-message' + (own ? ' social-chat-message-own' : '') + '">',
                '<div class="social-chat-message-bubble">',
                '<strong>' + escapeHtml(own ? state.player.name : activeThread.friendName || "Друг") + '</strong>',
                '<p>' + escapeHtml(message.text || "") + '</p>',
                '<small>' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</small>',
                '</div>',
                '</div>'
            ].join("");
        }).join("") : '<div class="social-chat-empty">Пока сообщений нет. Напиши первым.</div>';
        elements.socialChatInput.disabled = false;
        elements.socialChatSend.disabled = false;
        elements.socialChatMessages.scrollTop = elements.socialChatMessages.scrollHeight;
    }

    function viewFriendProfile(friendId) {
        const friend = getFriendById(friendId);
        if (!friend) {
            return;
        }
        showToast(friend.name + " · уровень " + friend.level + " · " + (friend.status === "online" ? "онлайн" : "оффлайн"));
    }

    function renderDuel() {
        const duel = state.duel;
        if (!duel) {
            closeDuelSilently();
            return;
        }
        duel.activePanel = duel.activePanel || "logs";
        duel.chatMessages = Array.isArray(duel.chatMessages) ? duel.chatMessages : [];
        duel.chatError = duel.chatError || "";
        syncDuelInputs(duel);
        elements.duelTitle.textContent = "Дуэль";
        elements.duelRoundPill.textContent = "Раунд " + duel.round;
        elements.duelRoundTimer.textContent = formatDuration(getRoundTimeRemainingMs(duel));
        elements.duelYouName.textContent = duel.playerName || "Игрок";
        elements.duelYouMeta.textContent = "";
        elements.duelYouAvatar.textContent = (duel.playerName || "И").slice(0, 1).toUpperCase();
        elements.duelOpponentName.textContent = duel.opponentName || "Соперник";
        elements.duelOpponentMeta.textContent = "";
        elements.duelOpponentAvatar.textContent = (duel.opponentName || "РЎ").slice(0, 1).toUpperCase();
        elements.duelYouHp.textContent = duel.playerHp + " HP";
        elements.duelOpponentHp.textContent = duel.opponentHp + " HP";
        elements.duelYouFill.style.width = Math.max(0, Math.min(100, Math.round((duel.playerHp / getPlayerMaxHp()) * 100))) + "%";
        elements.duelOpponentFill.style.width = Math.max(0, Math.min(100, Math.round((duel.opponentHp / getPlayerMaxHp()) * 100))) + "%";
        const duelStatus = buildDuelStatusText(duel);
        elements.duelRoundStatus.innerHTML = duelStatus ? decorateText(duelStatus) : "";
        elements.duelRoundStatus.classList.toggle("hidden", !duelStatus);
        const duelSelectionComplete = isDuelSelectionComplete(duel);
        const duelHasPendingChanges = hasPendingDuelChanges(duel);
        const submitButtonLabel = duel.finished
            ? "Бой завершен"
            : duel.yourActionSubmitted
                ? (duelHasPendingChanges ? "Изменить ход" : "Ход сделан")
                : "Сделать ход";
        elements.duelSubmitButton.textContent = submitButtonLabel;
        elements.duelSubmitButton.disabled = duel.finished
            || duel.autoBattleEnabled
            || !duel.canSubmitAction
            || !duelSelectionComplete
            || (duel.yourActionSubmitted && !duelHasPendingChanges);
        renderDuelControls();
        if (!duel.logs.length) {
            elements.duelLogList.innerHTML = '<div class="duel-log-round"><p class="duel-log-round-title">Логов пока нет. Первый обмен ходами появится здесь.</p></div>';
        } else {
            elements.duelLogList.innerHTML = duel.logs.slice().reverse().map(function (entry) {
                const roundNumber = typeof entry.round === "number" ? entry.round : entry.roundNumber;
                const lines = Array.isArray(entry.lines) ? entry.lines : [];
                const title = lines.length ? lines[0] : "Раунд " + roundNumber;
                const detailLines = lines.slice(1);
                return '<div class="duel-log-round"><p class="duel-log-round-title">' + decorateText(title) + '</p>' + detailLines.map(function (line) {
                    return '<p class="duel-log-line">' + decorateText(line) + "</p>";
                }).join("") + "</div>";
            }).join("");
        }
        renderDuelChat(duel);
        elements.duelTabLogs.classList.toggle("is-active", duel.activePanel === "logs");
        elements.duelTabLogs.setAttribute("aria-selected", duel.activePanel === "logs" ? "true" : "false");
        elements.duelTabChat.classList.toggle("is-active", duel.activePanel === "chat");
        elements.duelTabChat.setAttribute("aria-selected", duel.activePanel === "chat" ? "true" : "false");
        elements.duelLogsPane.classList.toggle("hidden", duel.activePanel !== "logs");
        elements.duelChatPane.classList.toggle("hidden", duel.activePanel !== "chat");
        elements.duelClearLogButton.classList.toggle("hidden", duel.activePanel !== "logs");
        elements.duelOverlay.classList.remove("hidden");
        elements.duelOverlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("duel-open");
    }

    function renderDuelControls() {
        const duel = state.duel;
        const controlsDisabled = !duel || duel.finished || duel.autoBattleEnabled;
        toggleDuelButtonGroup(elements.duelWeaponButtons, duel ? duel.selectedWeapon : "");
        toggleDuelButtonGroup(elements.duelShotButtons, duel ? duel.selectedShot : "");
        toggleDuelButtonGroup(elements.duelDodgeButtons, duel ? duel.selectedDodge : "");
        [].concat(elements.duelWeaponButtons, elements.duelShotButtons, elements.duelDodgeButtons).forEach(function (button) {
            button.disabled = controlsDisabled;
        });
        elements.duelClearLogButton.disabled = !duel || !duel.logs.length || duel.mode === "pvp-live";
        if (!duel) {
            elements.duelAutoToggle.classList.remove("is-active", "is-pending");
            elements.duelAutoToggle.disabled = true;
            elements.duelAutoToggle.textContent = "Включить автоматический бой";
            elements.duelAutoNote.textContent = "";
            elements.duelAutoNote.classList.add("hidden");
            elements.duelAutoCover.classList.add("hidden");
            return;
        }
        const currentEnabled = Boolean(duel.autoBattleEnabled);
        const pendingEnabled = typeof duel.autoBattlePendingEnabled === "boolean" ? duel.autoBattlePendingEnabled : null;
        elements.duelAutoToggle.disabled = duel.finished;
        elements.duelAutoToggle.classList.toggle("is-active", currentEnabled);
        elements.duelAutoToggle.classList.toggle("is-pending", pendingEnabled !== null && pendingEnabled !== currentEnabled);
        elements.duelAutoToggle.textContent = currentEnabled ? "Выключить автоматический бой" : "Включить автоматический бой";
        const note = currentEnabled
            ? (pendingEnabled === false ? "Автобой отключится со следующего раунда." : "Автобой активен.")
            : (pendingEnabled === true ? "Автобой включится со следующего раунда." : "");
        elements.duelAutoNote.textContent = note;
        elements.duelAutoNote.classList.toggle("hidden", !note);
        elements.duelAutoCover.classList.toggle("hidden", !currentEnabled || duel.finished);
    }

    function renderDuelChat(duel) {
        const isLiveChat = duel.mode === "pvp-live";
        const canWrite = isLiveChat && !duel.finished;
        const messages = duel.chatMessages || [];
        if (!messages.length) {
            elements.duelChatList.innerHTML = '<div class="duel-chat-entry"><p class="duel-chat-text">' + (isLiveChat ? "Чат пока пуст. Напиши сопернику первое сообщение." : "Чат доступен только в PvP-матче между двумя игроками.") + "</p></div>";
        } else {
            elements.duelChatList.innerHTML = messages.map(function (message) {
                const own = message.playerId && state.auth && message.playerId === state.auth.playerId;
                const systemMessage = Boolean(message.systemMessage);
                const infoMessage = systemMessage && /авто/i.test(String(message.text || ""));
                const extraClass = systemMessage ? (infoMessage ? " duel-chat-entry-info" : " duel-chat-entry-system") : (own ? " duel-chat-entry-own" : "");
                return '<div class="duel-chat-entry' + extraClass + '"><p class="duel-chat-meta">' + escapeHtml(message.displayName || "Игрок") + " · " + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</p><p class="duel-chat-text">' + escapeHtml(message.text || "") + "</p></div>";
            }).join("");
        }
        elements.duelChatInput.disabled = !canWrite;
        elements.duelChatSendButton.disabled = !canWrite;
        elements.duelChatInput.placeholder = canWrite ? "Напиши сообщение сопернику" : "Чат недоступен";
        elements.duelChatError.textContent = duel.chatError || "";
        elements.duelChatError.classList.toggle("hidden", !duel.chatError);
        elements.duelChatList.scrollTop = elements.duelChatList.scrollHeight;
    }

    function buildDuelStatusText(duel) {
        if (duel.finished) {
            return duel.resultText || "";
        }
        if (duel.autoBattleEnabled) {
            return "С этого раунда ход идет автоматически.";
        }
        if (duel.mode === "pvp-live") {
            if (duel.yourActionSubmitted) {
                return hasPendingDuelChanges(duel)
                    ? "Ты изменил выбор. Нажми «Изменить ход», чтобы обновить решение."
                    : "Ход зафиксирован. Ждём соперника.";
            }
            if (typeof duel.autoBattlePendingEnabled === "boolean") {
                return duel.autoBattlePendingEnabled
                    ? "Автобой включится со следующего раунда."
                    : "Автобой отключится со следующего раунда.";
            }
        }
        return "";
    }

    function renderDuelResultModal() {
        const result = state.ui.duelResult;
        const shouldOpen = Boolean(result);
        if (!elements.duelResultModal) {
            return;
        }
        elements.duelResultModal.classList.toggle("hidden", !shouldOpen);
        elements.duelResultModal.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
        if (!shouldOpen) {
            return;
        }
        elements.duelResultTitle.textContent = result.title || "Бой завершен";
        elements.duelResultCopy.textContent = result.copy || "";
        elements.duelResultExp.textContent = formatSignedReward(result.experience || 0, " опыта");
        elements.duelResultMoney.textContent = formatSignedReward(result.money || 0, " монет");
    }

    function openDuelResultModal(config) {
        state.ui.duelExitConfirmOpen = false;
        state.ui.duelResult = {
            title: config.title || "Бой завершен",
            copy: config.copy || "",
            experience: Number(config.experience) || 0,
            money: Number(config.money) || 0
        };
        saveState();
        renderDuelResultModal();
    }

    function weaponLabel(code) {
        return {
            PISTOLS: "Пистоль и щит",
            RIFLE: "Винтовка",
            SHOTGUN: "Дробовик"
        }[code] || code;
    }

    function weaponInstrumentLabel(code) {
        return {
            PISTOLS: "из пистоля и щита",
            RIFLE: "из винтовки",
            SHOTGUN: "из дробовика"
        }[code] || "";
    }

    function directionLabel(code) {
        return { LEFT: "влево", CENTER: "по центру", RIGHT: "вправо" }[code] || code;
    }

    function dodgeLabel(code) {
        return {
            LEFT: "уходит влево",
            STAY: "остается по центру",
            RIGHT: "уходит вправо"
        }[code] || code;
    }

    function buildDuelIntentLine(name, action) {
        return name + " стреляет " + directionLabel(action.shot) + " " + weaponInstrumentLabel(action.weapon) + " и " + dodgeLabel(action.dodge) + ".";
    }

    function pluralizeHits(count) {
        const remainderTen = count % 10;
        const remainderHundred = count % 100;
        if (remainderTen === 1 && remainderHundred !== 11) {
            return count + " раз";
        }
        if (remainderTen >= 2 && remainderTen <= 4 && (remainderHundred < 12 || remainderHundred > 14)) {
            return count + " раза";
        }
        return count + " раз";
    }

    function resolveAttack(attackerName, defenderName, attackerAction, defenderAction, attackerSide) {
        const lines = [];
        const lineMatched = attackerAction.shot === defenderAction.dodge;
        if (!lineMatched && attackerAction.weapon !== "SHOTGUN") {
            if (getWeaponGrazeBonus(attackerSide, attackerAction.weapon) > 0 && Math.random() < getWeaponGrazeBonus(attackerSide, attackerAction.weapon)) {
                let grazeDamage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", 2, true, lines, defenderName);
                lines.push(attackerName + " цепляет краем и наносит " + grazeDamage + " урона.");
                return { damage: grazeDamage, lines: lines };
            }
            lines.push(attackerName + " промахивается мимо линии.");
            return { damage: 0, lines: lines };
        }
        if (lineMatched && shouldSupportEvade(attackerSide === "player" ? "opponent" : "player")) {
            lines.push(defenderName + " уходит от урона.");
            return { damage: 0, lines: lines };
        }
        if (attackerAction.weapon === "PISTOLS") {
            if (projectileBlocked(attackerSide, defenderAction.weapon, attackerAction.weapon, attackerAction.shot)) {
                lines.push(defenderName + " блокирует выстрел щитом.");
                return { damage: 0, lines: lines };
            }
            let damage = 18 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
            damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, false, lines, defenderName);
            lines.push(attackerName + " попадает " + weaponInstrumentLabel(attackerAction.weapon) + " и наносит " + damage + " урона.");
            return { damage: damage, lines: lines };
        }
        if (attackerAction.weapon === "RIFLE") {
            let damage = 30 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
            damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, false, lines, defenderName);
            lines.push(attackerName + " попадает " + weaponInstrumentLabel(attackerAction.weapon) + " и наносит " + damage + " урона.");
            return { damage: damage, lines: lines };
        }
        let pelletsHit = 0;
        let pelletsBlocked = 0;
        if (!lineMatched) {
            if (Math.random() < SHOTGUN_EDGE_GRAZE_CHANCE + getWeaponGrazeBonus(attackerSide, attackerAction.weapon)) {
                let edgeDamage = SHOTGUN_EDGE_DAMAGE + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
                edgeDamage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", edgeDamage, true, lines, defenderName);
                lines.push(attackerName + " цепляет краем и наносит " + edgeDamage + " урона.");
                return { damage: edgeDamage, lines: lines };
            }
            lines.push(attackerName + " промахивается дробью.");
            return { damage: 0, lines: lines };
        }
        for (let pellet = 0; pellet < 5; pellet++) {
            if (projectileBlocked(attackerSide, defenderAction.weapon, attackerAction.weapon, attackerAction.shot)) {
                pelletsBlocked++;
            } else {
                pelletsHit++;
            }
        }
        if (!pelletsHit) {
            lines.push(defenderName + " полностью блокирует заряд.");
            return { damage: 0, lines: lines };
        }
        let damage = pelletsHit * 5 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
        damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, pelletsHit < 3, lines, defenderName);
        let summary = attackerName + " попадает " + pluralizeHits(pelletsHit) + " и наносит " + damage + " урона.";
        if (pelletsBlocked) {
            summary += " " + defenderName + " блокирует " + pluralizeHits(pelletsBlocked) + ".";
        }
        lines.push(summary);
        return { damage: damage, lines: lines };
    }

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function startBotDuel(skipConfirm) {
        if (!skipConfirm) {
            requestStartDuel({
                mode: "bot",
                title: "Начать бой с ботом?",
                copy: "Подтверди, что хочешь сразу войти в бой с тренировочным соперником.",
                execute: function () {
                    startBotDuel(true);
                }
            });
            return;
        }
        openDuel({
            mode: "bot",
            title: "Дуэль",
            modeLabel: "Бот",
            opponentName: "Тренировщик",
            opponentWeapon: "RIFLE"
        });
    }

    async function startQueueDuel(skipConfirm) {
        if (!state.auth.registered) {
            showToast("Сначала зарегистрируй аккаунт.");
            return;
        }
        if (!skipConfirm) {
            requestStartDuel({
                mode: "queue",
                title: "Начать поиск матча?",
                copy: "Подтверди, что хочешь встать в очередь на PvP-матч.",
                execute: function () {
                    startQueueDuel(true);
                }
            });
            return;
        }
        if (state.matchmaking.status === "QUEUED") {
            showToast("Очередь уже активна. Ищем соперника.");
            return;
        }
        if (!state.auth.sessionToken || state.auth.demoMode) {
            showToast("Вне Telegram доступен локальный бой.");
            openDuel({
                mode: "pvp",
                title: "Дуэль",
                modeLabel: "PvP",
                opponentName: randomFrom(["Рейдер", "Снайпер", "Контрабандист", "Северянин"]),
                opponentWeapon: randomFrom(["PISTOLS", "RIFLE", "SHOTGUN"])
            });
            return;
        }
        try {
            const response = await apiFetch("/api/matchmaking/join", { method: "POST" });
            const payload = await response.json();
            applyMatchmakingStatus(payload);
            if (payload.status === "IN_DUEL" && payload.duelId) {
                await refreshLiveDuel(payload.duelId);
                showToast("Соперник найден.");
            } else {
                showToast(payload.message || "Ищем соперника.");
            }
        } catch (error) {
            showToast(error && error.message ? error.message : "Не удалось войти в очередь.");
        }
    }

    async function cancelQueue() {
        if (state.matchmaking.status !== "QUEUED") {
            return;
        }
        if (!state.auth.sessionToken || state.auth.demoMode) {
            state.matchmaking.status = "IDLE";
            state.matchmaking.duelId = null;
            state.matchmaking.message = "";
            state.matchmaking.queuedAt = null;
            saveState();
            renderAll();
            showToast("Поиск дуэли отменен.");
            return;
        }
        if (elements.queueCancelButton) {
            elements.queueCancelButton.disabled = true;
        }
        try {
            const response = await apiFetch("/api/matchmaking/cancel", { method: "POST" });
            applyMatchmakingStatus(await response.json());
            renderAll();
            showToast("Поиск дуэли отменен.");
        } catch (error) {
            showToast(error && error.message ? error.message : "Не удалось отменить поиск.");
        } finally {
            if (elements.queueCancelButton) {
                elements.queueCancelButton.disabled = false;
            }
        }
    }

    function buildLiveResultText(payload) {
        if (payload.status === "FINISHED") {
            if (payload.resultLabel === "VICTORY") {
                return "Победа. Ты удержал темп до конца.";
            }
            if (payload.resultLabel === "DEFEAT") {
                return "Поражение. Этот бой остался за соперником.";
            }
            return "Ничья. Оба бойца удержали линию.";
        }
        if (payload.yourActionSubmitted && !payload.opponentActionSubmitted) {
            return "Ход зафиксирован. Ждём ответ соперника.";
        }
        if (payload.yourActionSubmitted && payload.opponentActionSubmitted) {
            return "Оба хода зафиксированы. Раунд сейчас раскроется.";
        }
        return "";
    }

    function openLiveDuelResult(payload) {
        const isVictory = payload.resultLabel === "VICTORY";
        const isDefeat = payload.resultLabel === "DEFEAT";
        const winnerName = isVictory
            ? (payload.you && payload.you.displayName ? payload.you.displayName : state.player.name)
            : (payload.opponent && payload.opponent.displayName ? payload.opponent.displayName : "Соперник");
        const rewardMoney = isVictory ? BATTLE_VICTORY_COINS : 0;
        const rewardExperience = BATTLE_REWARD_EXPERIENCE;

        openDuelResultModal({
            title: isVictory ? "Ты победил" : (isDefeat ? "Ты проиграл" : "Ничья"),
            copy: isVictory
                ? "Побежден " + (payload.opponent && payload.opponent.displayName ? payload.opponent.displayName : "соперник") + "."
                : (isDefeat ? "Победил " + winnerName + "." : "Оба бойца удержали линию до конца."),
            experience: rewardExperience,
            money: rewardMoney
        });
    }

    function renderDuel() {
        const duel = state.duel;
        if (!duel) {
            closeDuelSilently();
            return;
        }
        duel.activePanel = duel.activePanel || "logs";
        duel.chatMessages = Array.isArray(duel.chatMessages) ? duel.chatMessages : [];
        duel.chatError = duel.chatError || "";
        syncDuelInputs(duel);
        elements.duelTitle.textContent = "Дуэль";
        elements.duelRoundPill.textContent = "Раунд " + duel.round;
        elements.duelRoundTimer.textContent = formatDuration(getRoundTimeRemainingMs(duel));
        elements.duelYouName.textContent = duel.playerName || "Игрок";
        elements.duelYouMeta.textContent = "";
        elements.duelYouAvatar.textContent = (duel.playerName || "И").slice(0, 1).toUpperCase();
        elements.duelOpponentName.textContent = duel.opponentName || "Соперник";
        elements.duelOpponentMeta.textContent = "";
        elements.duelOpponentAvatar.textContent = (duel.opponentName || "РЎ").slice(0, 1).toUpperCase();
        elements.duelYouHp.textContent = duel.playerHp + " HP";
        elements.duelOpponentHp.textContent = duel.opponentHp + " HP";
        elements.duelYouFill.style.width = Math.max(0, Math.min(100, Math.round((duel.playerHp / getPlayerMaxHp()) * 100))) + "%";
        elements.duelOpponentFill.style.width = Math.max(0, Math.min(100, Math.round((duel.opponentHp / getPlayerMaxHp()) * 100))) + "%";
        const duelStatus = buildDuelStatusText(duel);
        elements.duelRoundStatus.innerHTML = duelStatus ? decorateText(duelStatus) : "";
        elements.duelRoundStatus.classList.toggle("hidden", !duelStatus);
        const duelSelectionComplete = isDuelSelectionComplete(duel);
        const duelHasPendingChanges = hasPendingDuelChanges(duel);
        const submitButtonLabel = duel.finished
            ? "Бой завершен"
            : duel.yourActionSubmitted
                ? (duelHasPendingChanges ? "Изменить ход" : "Ход сделан")
                : "Сделать ход";
        elements.duelSubmitButton.textContent = submitButtonLabel;
        elements.duelSubmitButton.disabled = duel.finished
            || duel.autoBattleEnabled
            || !duel.canSubmitAction
            || !duelSelectionComplete
            || (duel.yourActionSubmitted && !duelHasPendingChanges);
        renderDuelControls();
        if (!duel.logs.length) {
            elements.duelLogList.innerHTML = '<div class="duel-log-round"><p class="duel-log-round-title">Логов пока нет. Первый обмен ходами появится здесь.</p></div>';
        } else {
            elements.duelLogList.innerHTML = duel.logs.slice().reverse().map(function (entry) {
                const roundNumber = typeof entry.round === "number" ? entry.round : entry.roundNumber;
                const lines = Array.isArray(entry.lines) ? entry.lines : [];
                const title = lines.length ? lines[0] : "Раунд " + roundNumber;
                const detailLines = lines.slice(1);
                return '<div class="duel-log-round"><p class="duel-log-round-title">' + decorateText(title) + '</p>' + detailLines.map(function (line) {
                    return '<p class="duel-log-line">' + decorateText(line) + "</p>";
                }).join("") + "</div>";
            }).join("");
        }
        renderDuelChat(duel);
        elements.duelTabLogs.classList.toggle("is-active", duel.activePanel === "logs");
        elements.duelTabLogs.setAttribute("aria-selected", duel.activePanel === "logs" ? "true" : "false");
        elements.duelTabChat.classList.toggle("is-active", duel.activePanel === "chat");
        elements.duelTabChat.setAttribute("aria-selected", duel.activePanel === "chat" ? "true" : "false");
        elements.duelLogsPane.classList.toggle("hidden", duel.activePanel !== "logs");
        elements.duelChatPane.classList.toggle("hidden", duel.activePanel !== "chat");
        elements.duelClearLogButton.classList.toggle("hidden", duel.activePanel !== "logs");
        elements.duelOverlay.classList.remove("hidden");
        elements.duelOverlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("duel-open");
    }
    function refreshStaticCopy() {
        document.title = "Полюс";
        safeSetText(".panel-kicker", "Профиль");
        safeSetText("#find-match-button", "Найти матч");
        safeSetText("#bot-duel-button", "Быстрая дуэль (бот)");
        safeSetText(".queue-status-label", "Поиск дуэли");
        safeSetText("#queue-cancel-button", "Отменить");
        safeSetText("#screen-inventory .panel-title", "Инвентарь");
        safeSetText("#inventory-placeholder h3", "Раздел в переработке");
        safeSetText("#inventory-placeholder p", "Инвентарь временно скрыт до следующей версии.");
        safeSetText("#screen-friends .panel-title", "Друзья");
        safeSetText("#friend-search-input", null, "placeholder", "Найти игрока по никнейму");
        safeSetText("#friend-search-form .primary-button", "Добавить");
        safeSetText("#screen-shop .panel-title", "Магазин");
        safeSetText("#premium-work-banner", "Временно в работе");
        safeSetText(".nav-button[data-nav-target='home'] .nav-title", "Хаб");
        safeSetText(".nav-button[data-nav-target='inventory'] .nav-title", "Инвентарь");
        safeSetText(".nav-button[data-nav-target='friends'] .nav-title", "Друзья");
        safeSetText(".nav-button[data-nav-target='shop'] .nav-title", "Магазин");
        safeSetText("#social-chat-fab .social-chat-fab-label", "Чаты");
        safeSetText("#social-chat-panel .panel-title-small", "Чаты");
        safeSetText("#social-chat-close", "Закрыть");
        safeSetText("#social-chat-thread-title", "Выбери чат");
        safeSetText("#social-chat-input", null, "placeholder", "Напиши сообщение");
        safeSetText("#social-chat-send", "Отправить");
        safeSetText("#registration-modal .panel-title-small", "Регистрация игрока");
        safeSetText("#registration-copy", "Введи никнейм. Аккаунт будет закреплен за твоим Telegram ID.");
        safeSetText("label[for='registration-nickname']", "Никнейм");
        safeSetText("#registration-nickname", null, "placeholder", "Например, СеверныйВолк");
        safeSetText("#registration-submit", "Создать аккаунт");
    }

    function safeSetText(selector, text, attribute, attributeValue) {
        const element = document.querySelector(selector);
        if (!element) {
            return;
        }
        if (attribute) {
            element.setAttribute(attribute, attributeValue);
            return;
        }
        element.textContent = text;
    }

    function buildInitialState() {
        return {
            version: 19,
            auth: { sessionToken: null, playerId: null, telegramUserId: null, nickname: "", registered: false, demoMode: false, initError: "" },
            matchmaking: { status: "IDLE", duelId: null, message: "", queuedAt: null },
            player: { id: null, name: "Новый игрок", money: 0, rating: 0, wins: 0, losses: 0, telegramUserId: null },
            world: { lastJournalEventAt: Date.now(), lastFriendSyncAt: 0 },
            ui: { screen: "home", activeQuestId: null, shopSection: "standard", augmentPickerSlot: null, duelExitConfirmOpen: false, startDuelConfirm: null, startDuelAction: null, duelResult: null },
            journal: [],
            inventory: { equipped: [], augmentSlots: {}, unlockedAugments: [], backpack: [] },
            friends: [],
            friendRequests: [],
            social: { isOpen: false, activeThreadId: null, threads: [] },
            premium: { owned: [] },
            shop: buildShopCatalog(),
            quests: [],
            duel: null
        };
    }

    function hydrateState(source) {
        const next = source && typeof source === "object" ? source : buildInitialState();
        next.version = 19;
        next.auth = Object.assign({ sessionToken: null, playerId: null, telegramUserId: null, nickname: "", registered: false, demoMode: false, initError: "" }, next.auth || {});
        next.matchmaking = Object.assign({ status: "IDLE", duelId: null, message: "", queuedAt: null }, next.matchmaking || {});
        next.player = Object.assign({ id: null, name: "Новый игрок", money: 0, rating: 0, wins: 0, losses: 0, telegramUserId: null }, next.player || {});
        delete next.player.level;
        delete next.player.experience;
        delete next.player.levelProgressCurrent;
        delete next.player.levelProgressTarget;
        delete next.player.availableStatPoints;
        delete next.player.strength;
        delete next.player.reaction;
        delete next.player.analysis;
        next.world = Object.assign({ lastJournalEventAt: Date.now(), lastFriendSyncAt: 0 }, next.world || {});
        next.ui = Object.assign({ screen: "home", activeQuestId: null, shopSection: "standard", augmentPickerSlot: null, duelExitConfirmOpen: false, startDuelConfirm: null, duelResult: null }, next.ui || {});
        next.ui.startDuelAction = null;
        next.inventory = next.inventory || { equipped: [], augmentSlots: {}, unlockedAugments: [], backpack: [] };
        next.friends = Array.isArray(next.friends) ? next.friends : [];
        next.friendRequests = Array.isArray(next.friendRequests) ? next.friendRequests : [];
        next.social = Object.assign({ isOpen: false, activeThreadId: null, threads: [] }, next.social || {});
        next.social.threads = Array.isArray(next.social.threads) ? next.social.threads : [];
        next.premium = next.premium || { owned: [] };
        next.shop = buildShopCatalog();
        next.journal = Array.isArray(next.journal) ? next.journal : [];
        next.quests = Array.isArray(next.quests) ? next.quests : [];
        return next;
    }

    function loadState() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return buildInitialState();
            }
            const parsed = JSON.parse(raw);
            return parsed && parsed.version === 19 ? parsed : buildInitialState();
        } catch (error) {
            console.error(error);
            return buildInitialState();
        }
    }

    function syncPlayerFromServer(player, resetEconomy) {
        state.player.id = player.id || state.player.id || null;
        state.player.name = player.nickname || player.displayName || state.player.name || "Новый игрок";
        state.player.telegramUserId = player.telegramUserId || state.player.telegramUserId || null;
        state.player.wins = typeof player.wins === "number" ? player.wins : (state.player.wins || 0);
        state.player.losses = typeof player.losses === "number" ? player.losses : (state.player.losses || 0);
        if (resetEconomy || typeof player.coins === "number") {
            state.player.money = typeof player.coins === "number" ? player.coins : (state.player.money || 0);
        }
        if (typeof player.rating === "number") {
            state.player.rating = player.rating;
        } else if (typeof state.player.rating !== "number") {
            state.player.rating = 0;
        }
    }

    function renderProfile() {
        refreshStaticCopy();
        if (elements.profileName) {
            elements.profileName.textContent = state.player.name || "Новый игрок";
        }
        if (elements.profileMoney) {
            elements.profileMoney.textContent = formatMoney(state.player.money || 0);
        }
        const profileRating = document.getElementById("profile-rating");
        if (profileRating) {
            profileRating.textContent = String(state.player.rating || 0);
        }
        if (elements.shopMoney) {
            elements.shopMoney.textContent = (state.player.money || 0) + " монет";
        }
        if (elements.profileAvatar) {
            elements.profileAvatar.textContent = (state.player.name || "И").slice(0, 1).toUpperCase();
        }
    }

    function renderHeroStats() {
        if (elements.statPointsBadge) {
            elements.statPointsBadge.classList.add("hidden");
        }
        if (elements.heroStats) {
            elements.heroStats.classList.add("hidden");
            elements.heroStats.innerHTML = "";
        }
    }

    function renderInventory() {
        if (elements.inventoryPlaceholder) {
            elements.inventoryPlaceholder.innerHTML = "<h3>Раздел в переработке</h3><p>Инвентарь временно скрыт до следующей версии.</p>";
        }
    }
    function showRegistrationError(message) {
        if (!elements.registrationError) {
            return;
        }
        elements.registrationError.textContent = message;
        elements.registrationError.classList.remove("hidden");
    }

    function renderRegistrationModal() {
        refreshStaticCopy();
        const auth = state.auth || {};
        const shouldOpen = !auth.registered;
        elements.registrationModal.classList.toggle("hidden", !shouldOpen);
        elements.registrationModal.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
        if (!shouldOpen) {
            return;
        }
        elements.registrationCopy.textContent = auth.demoMode
            ? "Введи никнейм. Вне Telegram он сохранится только в этом браузере."
            : "Введи никнейм. Аккаунт будет закреплен за твоим Telegram ID.";
        if (!elements.registrationNickname.value) {
            elements.registrationNickname.value = auth.nickname || "";
        }
        if (auth.initError && !auth.demoMode) {
            showRegistrationError(auth.initError);
        } else {
            elements.registrationError.textContent = "";
            elements.registrationError.classList.add("hidden");
        }
    }

    async function submitRegistration() {
        const nickname = elements.registrationNickname.value.trim();
        elements.registrationError.textContent = "";
        elements.registrationError.classList.add("hidden");
        if (!nickname) {
            showRegistrationError("Введи никнейм.");
            return;
        }
        if (nickname.length < 3 || nickname.length > 20) {
            showRegistrationError("Ник должен быть длиной от 3 до 20 символов.");
            return;
        }
        if (!/^[\p{L}\p{N}_-]+$/u.test(nickname)) {
            showRegistrationError("Ник может содержать только буквы, цифры, _ и -.");
            return;
        }
        elements.registrationSubmit.disabled = true;
        try {
            if (state.auth && state.auth.demoMode) {
                state.auth.nickname = nickname;
                state.auth.registered = true;
                state.player.name = nickname;
                state.player.money = 0;
                state.player.rating = 0;
                saveState();
                renderAll();
                showToast("Ник сохранен.");
                return;
            }
            if (!state.auth || !state.auth.sessionToken) {
                throw new Error("Открой Mini App через Telegram, чтобы зарегистрировать ник.");
            }
            const response = await fetch("/api/player/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Session-Token": state.auth.sessionToken
                },
                body: JSON.stringify({ nickname: nickname })
            });
            if (!response.ok) {
                throw new Error(await readApiError(response));
            }
            const player = await response.json();
            state.auth.nickname = player.nickname || nickname;
            state.auth.registered = Boolean(player.registered);
            syncPlayerFromServer(player, true);
            await loadFriendsOverview();
            saveState();
            renderAll();
            showToast("Аккаунт зарегистрирован.");
        } catch (error) {
            showRegistrationError(error && error.message ? error.message : "Не удалось зарегистрировать аккаунт.");
        } finally {
            elements.registrationSubmit.disabled = false;
        }
    }

    async function allocateStat() {
        return;
    }

    function formatQueueElapsed(totalSeconds) {
        if (totalSeconds < 60) {
            return totalSeconds + " сек";
        }
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return minutes + " мин " + pad(seconds) + " сек";
    }

    function normalizeResourceText(text) {
        return String(text)
            .replace(new RegExp("([+-]?\\d+)\\s*" + escapeRegExp(RUBLE_SIGN), "g"), "$1 монет")
            .replace(/([+-]?\d+)\s*в‚Ѕ/g, "$1 монет");
    }

    function renderQueueStatus() {
        const queued = state.matchmaking && state.matchmaking.status === "QUEUED";
        elements.queueStatusCard.classList.toggle("hidden", !queued);
        if (!queued) {
            return;
        }
        const queuedAt = state.matchmaking.queuedAt || Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - queuedAt) / 1000));
        elements.queueStatusTime.textContent = formatQueueElapsed(elapsedSeconds);
        elements.queueStatusNote.textContent = state.matchmaking.message || "Ждем соперника в очереди.";
        elements.queueCancelButton.disabled = false;
    }

    function renderFriends() {
        refreshStaticCopy();
        const requests = Array.isArray(state.friendRequests) ? state.friendRequests : [];
        const friends = getDisplayFriends();
        elements.friendRequestBadge.textContent = String(Math.min(9, requests.length));
        elements.friendRequestPanel.innerHTML = requests.length ? [
            '<section class="friend-request-stack">',
            '<div class="panel-header friend-subheader"><h3 class="panel-title panel-title-small">Приглашения</h3></div>',
            requests.map(function (request) {
                const online = request.status === "online";
                return [
                    '<article class="friend-card friend-request-card">',
                    '<h3>' + escapeHtml(request.name) + '</h3>',
                    '<div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'Онлайн' : 'Оффлайн') + '</span><span class="timer-chip">Рейтинг ' + escapeHtml(String(request.rating || 0)) + '</span></div>',
                    '<div class="friend-actions">',
                    '<button class="primary-button full-width" type="button" data-request-accept-id="' + escapeHtml(request.id) + '">Принять</button>',
                    '<button class="secondary-button full-width" type="button" data-request-reject-id="' + escapeHtml(request.id) + '">Отклонить</button>',
                    '</div>',
                    '</article>'
                ].join("");
            }).join(""),
            '</section>'
        ].join("") : "";
        elements.friendList.innerHTML = friends.length ? friends.map(function (friend) {
            const online = friend.status === "online";
            return [
                '<article class="friend-card">',
                '<h3>' + escapeHtml(friend.name) + '</h3>',
                '<div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'Онлайн' : 'Оффлайн') + '</span><span class="timer-chip">Рейтинг ' + escapeHtml(String(friend.rating || 0)) + '</span></div>',
                '<div class="friend-actions">',
                '<button class="secondary-button full-width" data-friend-chat-id="' + escapeHtml(friend.id) + '" type="button">Написать сообщение</button>',
                '<button class="secondary-button full-width friend-action-profile" data-friend-profile-id="' + escapeHtml(friend.id) + '" type="button">Посмотреть профиль</button>',
                '</div>',
                '</article>'
            ].join("");
        }).join("") : '<article class="friend-card"><p>Пока друзей нет. Найди игрока по никнейму и отправь запрос.</p></article>';
    }

    function syncSocialThreadsWithFriends() {
        if (!state.social || !Array.isArray(state.social.threads)) {
            return;
        }
        const knownIds = new Set(getDisplayFriends().map(function (friend) { return friend.id; }));
        state.social.threads = state.social.threads.filter(function (thread) {
            return knownIds.has(thread.friendId);
        });
        state.social.threads.forEach(function (thread) {
            const friend = getFriendById(thread.friendId);
            if (friend) {
                thread.friendName = friend.name;
                thread.rating = friend.rating || 0;
                thread.status = friend.status;
            }
        });
        if (state.social.activeThreadId && !state.social.threads.some(function (thread) { return thread.id === state.social.activeThreadId; })) {
            state.social.activeThreadId = state.social.threads.length ? state.social.threads[0].id : null;
        }
    }

    function renderSocialInbox() {
        refreshStaticCopy();
        if (!elements.socialChatPanel) {
            return;
        }
        state.social = state.social || {};
        state.social.threads = Array.isArray(state.social.threads) ? state.social.threads : [];
        const threads = state.social.threads;
        const activeThread = threads.find(function (thread) { return thread.id === state.social.activeThreadId; }) || null;

        elements.socialChatFabBadge.textContent = String(Math.min(9, threads.length));
        elements.socialChatFabBadge.classList.toggle("hidden", threads.length === 0);
        elements.socialChatPanel.classList.toggle("hidden", !state.social.isOpen);
        elements.socialChatPanel.setAttribute("aria-hidden", state.social.isOpen ? "false" : "true");

        if (!threads.length) {
            elements.socialChatThreadList.innerHTML = '<article class="social-chat-empty">Открытые диалоги появятся здесь после первого сообщения другу.</article>';
            elements.socialChatThreadTitle.textContent = "Выбери чат";
            elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Выбери друга и начни переписку.</div>';
            elements.socialChatInput.disabled = true;
            elements.socialChatSend.disabled = true;
            return;
        }

        elements.socialChatThreadList.innerHTML = threads.map(function (thread) {
            return [
                '<button class="social-chat-thread-card' + (activeThread && activeThread.id === thread.id ? ' is-active' : '') + '" type="button" data-social-thread-id="' + escapeHtml(thread.id) + '">',
                '<strong>' + escapeHtml(thread.friendName || 'Друг') + '</strong>',
                '<span>' + escapeHtml(thread.status === "online" ? "Онлайн" : "Оффлайн") + ' · Рейтинг ' + escapeHtml(String(thread.rating || 0)) + '</span>',
                '</button>'
            ].join("");
        }).join("");

        if (!activeThread) {
            elements.socialChatThreadTitle.textContent = "Выбери чат";
            elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Выбери диалог слева.</div>';
            elements.socialChatInput.disabled = true;
            elements.socialChatSend.disabled = true;
            return;
        }

        elements.socialChatThreadTitle.textContent = activeThread.friendName || "Друг";
        elements.socialChatMessages.innerHTML = (activeThread.messages || []).length ? (activeThread.messages || []).map(function (message) {
            const own = message.author === "you";
            return [
                '<div class="social-chat-message' + (own ? ' social-chat-message-own' : '') + '">',
                '<div class="social-chat-message-bubble">',
                '<strong>' + escapeHtml(own ? state.player.name : activeThread.friendName || "Друг") + '</strong>',
                '<p>' + escapeHtml(message.text || "") + '</p>',
                '<small>' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</small>',
                '</div>',
                '</div>'
            ].join("");
        }).join("") : '<div class="social-chat-empty">Пока сообщений нет. Напиши первым.</div>';
        elements.socialChatInput.disabled = false;
        elements.socialChatSend.disabled = false;
        elements.socialChatMessages.scrollTop = elements.socialChatMessages.scrollHeight;
    }

    function viewFriendProfile(friendId) {
        const friend = getFriendById(friendId);
        if (!friend) {
            return;
        }
        showToast(friend.name + " · рейтинг " + (friend.rating || 0) + " · " + (friend.status === "online" ? "онлайн" : "оффлайн"));
    }
    function buildLiveResultText(payload) {
        if (payload.status === "FINISHED") {
            if (payload.resultLabel === "VICTORY") {
                return "Победа. Раунд остался за тобой.";
            }
            if (payload.resultLabel === "DEFEAT") {
                return "Поражение. Этот бой остался за соперником.";
            }
            return "Ничья. Оба бойца удержали линию.";
        }
        if (payload.yourActionSubmitted && !payload.opponentActionSubmitted) {
            return "Ход зафиксирован. Ждем ответ соперника.";
        }
        if (payload.yourActionSubmitted && payload.opponentActionSubmitted) {
            return "Оба хода зафиксированы. Раунд раскрывается.";
        }
        return "";
    }

    function openLiveDuelResult(payload) {
        const isVictory = payload.resultLabel === "VICTORY";
        const isDefeat = payload.resultLabel === "DEFEAT";
        const rewardMoney = isVictory ? BATTLE_VICTORY_COINS : (isDefeat ? BATTLE_DEFEAT_COINS : 0);
        const rewardRating = isVictory ? PVP_RATING_DELTA : (isDefeat ? -PVP_RATING_DELTA : 0);
        openDuelResultModal({
            title: isVictory ? "Ты победил" : (isDefeat ? "Ты проиграл" : "Ничья"),
            copy: isVictory
                ? "Побежден " + (payload.opponent && payload.opponent.displayName ? payload.opponent.displayName : "соперник") + "."
                : (isDefeat
                    ? "Победил " + (payload.opponent && payload.opponent.displayName ? payload.opponent.displayName : "соперник") + "."
                    : "Оба бойца удержали линию до конца."),
            rating: rewardRating,
            money: rewardMoney
        });
    }

    function renderDuelResultModal() {
        const result = state.ui.duelResult;
        const shouldOpen = Boolean(result);
        if (!elements.duelResultModal) {
            return;
        }
        elements.duelResultModal.classList.toggle("hidden", !shouldOpen);
        elements.duelResultModal.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
        if (!shouldOpen) {
            return;
        }
        elements.duelResultTitle.textContent = result.title || "Бой завершен";
        elements.duelResultCopy.textContent = result.copy || "";
        elements.duelResultExp.textContent = formatSignedReward(result.rating || 0, " рейтинга");
        elements.duelResultMoney.textContent = formatSignedReward(result.money || 0, " монет");
    }

    function openDuelResultModal(config) {
        state.ui.duelExitConfirmOpen = false;
        state.ui.duelResult = {
            title: config.title || "Бой завершен",
            copy: config.copy || "",
            rating: Number(config.rating) || 0,
            money: Number(config.money) || 0
        };
        saveState();
        renderDuelResultModal();
    }

    function applyLocalExperienceGain() {
        return;
    }

    function weaponLabel(code) {
        return {
            PISTOLS: "Пистоль и щит",
            RIFLE: "Винтовка",
            SHOTGUN: "Дробовик"
        }[code] || code;
    }

    function weaponInstrumentLabel(code) {
        return {
            PISTOLS: "из пистоля и щита",
            RIFLE: "из винтовки",
            SHOTGUN: "из дробовика"
        }[code] || "";
    }

    function directionLabel(code) {
        return { LEFT: "влево", CENTER: "по центру", RIGHT: "вправо" }[code] || code;
    }

    function dodgeLabel(code) {
        return {
            LEFT: "смещается влево",
            STAY: "остается по центру",
            RIGHT: "смещается вправо"
        }[code] || code;
    }

    function buildDuelIntentLine(name, action) {
        return name + " стреляет " + directionLabel(action.shot) + " " + weaponInstrumentLabel(action.weapon) + " и " + dodgeLabel(action.dodge) + ".";
    }

    function pluralizeHits(count) {
        const remainderTen = count % 10;
        const remainderHundred = count % 100;
        if (remainderTen === 1 && remainderHundred !== 11) {
            return count + " раз";
        }
        if (remainderTen >= 2 && remainderTen <= 4 && (remainderHundred < 12 || remainderHundred > 14)) {
            return count + " раза";
        }
        return count + " раз";
    }

    function applyDefenseReduction(defenderSide, damage, glancing, lines, defenderName) {
        const reduction = getDefenseReduction(defenderSide, glancing);
        if (reduction <= 0) {
            return damage;
        }
        const minimum = glancing ? 1 : 0;
        const reducedDamage = Math.max(minimum, damage - reduction);
        if (reducedDamage < damage) {
            lines.push(defenderName + " снижает урон на " + (damage - reducedDamage) + ".");
        }
        return reducedDamage;
    }

    function resolveAttack(attackerName, defenderName, attackerAction, defenderAction, attackerSide) {
        const lines = [];
        const lineMatched = attackerAction.shot === defenderAction.dodge;
        if (!lineMatched && attackerAction.weapon !== "SHOTGUN") {
            lines.push(attackerName + " промахивается мимо линии.");
            return { damage: 0, lines: lines };
        }
        if (lineMatched && shouldSupportEvade(attackerSide === "player" ? "opponent" : "player")) {
            lines.push(defenderName + " уходит от урона.");
            return { damage: 0, lines: lines };
        }
        if (attackerAction.weapon === "PISTOLS") {
            if (projectileBlocked(attackerSide, defenderAction.weapon, attackerAction.weapon, attackerAction.shot)) {
                lines.push(defenderName + " блокирует выстрел щитом.");
                return { damage: 0, lines: lines };
            }
            let damage = 18 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
            damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, false, lines, defenderName);
            lines.push(attackerName + " попадает " + weaponInstrumentLabel(attackerAction.weapon) + " и наносит " + damage + " урона.");
            return { damage: damage, lines: lines };
        }
        if (attackerAction.weapon === "RIFLE") {
            let damage = 30 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
            damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, false, lines, defenderName);
            lines.push(attackerName + " попадает " + weaponInstrumentLabel(attackerAction.weapon) + " и наносит " + damage + " урона.");
            return { damage: damage, lines: lines };
        }
        let pelletsHit = 0;
        let pelletsBlocked = 0;
        if (!lineMatched) {
            if (Math.random() < SHOTGUN_EDGE_GRAZE_CHANCE + getWeaponGrazeBonus(attackerSide, attackerAction.weapon)) {
                let edgeDamage = SHOTGUN_EDGE_DAMAGE + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
                edgeDamage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", edgeDamage, true, lines, defenderName);
                lines.push(attackerName + " цепляет краем и наносит " + edgeDamage + " урона.");
                return { damage: edgeDamage, lines: lines };
            }
            lines.push(attackerName + " промахивается дробью.");
            return { damage: 0, lines: lines };
        }
        for (let pellet = 0; pellet < 5; pellet++) {
            if (projectileBlocked(attackerSide, defenderAction.weapon, attackerAction.weapon, attackerAction.shot)) {
                pelletsBlocked++;
            } else {
                pelletsHit++;
            }
        }
        if (!pelletsHit) {
            lines.push(defenderName + " полностью блокирует заряд.");
            return { damage: 0, lines: lines };
        }
        let damage = pelletsHit * 5 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
        damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, pelletsHit < 3, lines, defenderName);
        let summary = attackerName + " попадает " + pluralizeHits(pelletsHit) + " и наносит " + damage + " урона.";
        if (pelletsBlocked) {
            summary += " " + defenderName + " блокирует " + pluralizeHits(pelletsBlocked) + ".";
        }
        lines.push(summary);
        return { damage: damage, lines: lines };
    }

    function startBotDuel(skipConfirm) {
        if (!skipConfirm) {
            requestStartDuel({
                mode: "bot",
                title: "Начать бой с ботом?",
                copy: "Подтверди, что хочешь сразу войти в бой с тренировочным соперником.",
                execute: function () {
                    startBotDuel(true);
                }
            });
            return;
        }
        openDuel({
            mode: "bot",
            title: "Дуэль",
            modeLabel: "Бот",
            opponentName: "Тренировщик",
            opponentWeapon: "RIFLE"
        });
    }

    async function startQueueDuel(skipConfirm) {
        if (!state.auth.registered) {
            showToast("Сначала зарегистрируй аккаунт.");
            return;
        }
        if (!skipConfirm) {
            requestStartDuel({
                mode: "queue",
                title: "Начать поиск матча?",
                copy: "Подтверди, что хочешь встать в очередь на PvP-матч.",
                execute: function () {
                    startQueueDuel(true);
                }
            });
            return;
        }
        if (state.matchmaking.status === "QUEUED") {
            showToast("Очередь уже активна. Ищем соперника.");
            return;
        }
        if (!state.auth.sessionToken || state.auth.demoMode) {
            showToast("Вне Telegram доступен локальный бой.");
            openDuel({
                mode: "pvp",
                title: "Дуэль",
                modeLabel: "PvP",
                opponentName: randomFrom(["Рейдер", "Снайпер", "Контрабандист", "Северянин"]),
                opponentWeapon: randomFrom(["PISTOLS", "RIFLE", "SHOTGUN"])
            });
            return;
        }
        try {
            const response = await apiFetch("/api/matchmaking/join", { method: "POST" });
            const payload = await response.json();
            applyMatchmakingStatus(payload);
            if (payload.status === "IN_DUEL" && payload.duelId) {
                await refreshLiveDuel(payload.duelId);
                showToast("Соперник найден.");
            } else {
                showToast(payload.message || "Ищем соперника.");
            }
        } catch (error) {
            showToast(error && error.message ? error.message : "Не удалось войти в очередь.");
        }
    }

    async function cancelQueue() {
        if (state.matchmaking.status !== "QUEUED") {
            return;
        }
        if (!state.auth.sessionToken || state.auth.demoMode) {
            state.matchmaking.status = "IDLE";
            state.matchmaking.duelId = null;
            state.matchmaking.message = "";
            state.matchmaking.queuedAt = null;
            saveState();
            renderAll();
            showToast("Поиск дуэли отменен.");
            return;
        }
        if (elements.queueCancelButton) {
            elements.queueCancelButton.disabled = true;
        }
        try {
            const response = await apiFetch("/api/matchmaking/cancel", { method: "POST" });
            applyMatchmakingStatus(await response.json());
            renderAll();
            showToast("Поиск дуэли отменен.");
        } catch (error) {
            showToast(error && error.message ? error.message : "Не удалось отменить поиск.");
        } finally {
            if (elements.queueCancelButton) {
                elements.queueCancelButton.disabled = false;
            }
        }
    }
    function renderDuel() {
        refreshStaticCopy();
        const duel = state.duel;
        if (!duel) {
            closeDuelSilently();
            return;
        }
        duel.activePanel = duel.activePanel || "logs";
        duel.chatMessages = Array.isArray(duel.chatMessages) ? duel.chatMessages : [];
        duel.chatError = duel.chatError || "";
        syncDuelInputs(duel);
        elements.duelTitle.textContent = "Дуэль";
        elements.duelRoundPill.textContent = "Раунд " + duel.round;
        elements.duelRoundTimer.textContent = formatDuration(getRoundTimeRemainingMs(duel));
        elements.duelYouName.textContent = duel.playerName || "Игрок";
        elements.duelYouMeta.textContent = "";
        elements.duelYouAvatar.textContent = (duel.playerName || "И").slice(0, 1).toUpperCase();
        elements.duelOpponentName.textContent = duel.opponentName || "Соперник";
        elements.duelOpponentMeta.textContent = "";
        elements.duelOpponentAvatar.textContent = (duel.opponentName || "РЎ").slice(0, 1).toUpperCase();
        elements.duelYouHp.textContent = duel.playerHp + " HP";
        elements.duelOpponentHp.textContent = duel.opponentHp + " HP";
        elements.duelYouFill.style.width = Math.max(0, Math.min(100, Math.round((duel.playerHp / getPlayerMaxHp()) * 100))) + "%";
        elements.duelOpponentFill.style.width = Math.max(0, Math.min(100, Math.round((duel.opponentHp / getPlayerMaxHp()) * 100))) + "%";
        const duelStatus = buildDuelStatusText(duel);
        elements.duelRoundStatus.innerHTML = duelStatus ? decorateText(duelStatus) : "";
        elements.duelRoundStatus.classList.toggle("hidden", !duelStatus);
        const duelSelectionComplete = isDuelSelectionComplete(duel);
        const duelHasPendingChanges = hasPendingDuelChanges(duel);
        const submitButtonLabel = duel.finished
            ? "Бой завершен"
            : duel.yourActionSubmitted
                ? (duelHasPendingChanges ? "Изменить ход" : "Ход сделан")
                : "Сделать ход";
        elements.duelSubmitButton.textContent = submitButtonLabel;
        elements.duelSubmitButton.disabled = duel.finished
            || duel.autoBattleEnabled
            || !duel.canSubmitAction
            || !duelSelectionComplete
            || (duel.yourActionSubmitted && !duelHasPendingChanges);
        renderDuelControls();
        if (!duel.logs.length) {
            elements.duelLogList.innerHTML = '<div class="duel-log-round"><p class="duel-log-round-title">Логов пока нет. Первый обмен ходами появится здесь.</p></div>';
        } else {
            elements.duelLogList.innerHTML = duel.logs.slice().reverse().map(function (entry) {
                const roundNumber = typeof entry.round === "number" ? entry.round : entry.roundNumber;
                const lines = Array.isArray(entry.lines) ? entry.lines : [];
                const title = lines.length ? lines[0] : "Раунд " + roundNumber;
                const detailLines = lines.slice(1);
                return '<div class="duel-log-round"><p class="duel-log-round-title">' + decorateText(title) + '</p>' + detailLines.map(function (line) {
                    return '<p class="duel-log-line">' + decorateText(line) + "</p>";
                }).join("") + "</div>";
            }).join("");
        }
        renderDuelChat(duel);
        elements.duelTabLogs.classList.toggle("is-active", duel.activePanel === "logs");
        elements.duelTabLogs.setAttribute("aria-selected", duel.activePanel === "logs" ? "true" : "false");
        elements.duelTabChat.classList.toggle("is-active", duel.activePanel === "chat");
        elements.duelTabChat.setAttribute("aria-selected", duel.activePanel === "chat" ? "true" : "false");
        elements.duelLogsPane.classList.toggle("hidden", duel.activePanel !== "logs");
        elements.duelChatPane.classList.toggle("hidden", duel.activePanel !== "chat");
        elements.duelClearLogButton.classList.toggle("hidden", duel.activePanel !== "logs");
        elements.duelOverlay.classList.remove("hidden");
        elements.duelOverlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("duel-open");
    }

    function resolveDuelRound(playerAction, opponentAction) {
        const duel = state.duel;
        if (!duel) {
            return;
        }
        const playerName = duel.playerName || "Игрок";
        const opponentName = duel.opponentName || "Соперник";
        duel.selectedWeapon = playerAction.weapon;
        duel.selectedShot = playerAction.shot;
        duel.selectedDodge = playerAction.dodge;
        duel.submittedAction = playerAction;
        duel.yourActionSubmitted = true;
        duel.lastPlayerWeapon = playerAction.weapon;
        duel.lastOpponentWeapon = opponentAction.weapon;
        const lines = [
            buildDuelIntentLine(playerName, playerAction),
            buildDuelIntentLine(opponentName, opponentAction)
        ];
        const playerResult = resolveAttack(playerName, opponentName, playerAction, opponentAction, "player");
        const opponentResult = resolveAttack(opponentName, playerName, opponentAction, playerAction, "opponent");
        lines.push.apply(lines, playerResult.lines);
        lines.push.apply(lines, opponentResult.lines);
        duel.opponentHp = Math.max(0, duel.opponentHp - playerResult.damage);
        duel.playerHp = Math.max(0, duel.playerHp - opponentResult.damage);
        applySupportRegen(duel, lines);
        duel.logs.push({ round: duel.round, lines: lines });
        if (duel.playerHp === 0 && duel.opponentHp === 0) {
            duel.finished = true;
            duel.resultText = "Ничья. Оба остались на линии.";
            openDuelResultModal({
                title: "Ничья",
                copy: "Никто не смог дожать раунд до победы.",
                rating: 0,
                money: 0
            });
        } else if (duel.opponentHp === 0) {
            duel.finished = true;
            duel.resultText = "Победа. Соперник падает в снег.";
            state.player.wins = (state.player.wins || 0) + 1;
            state.player.money = (state.player.money || 0) + BATTLE_VICTORY_COINS;
            openDuelResultModal({
                title: "Ты победил",
                copy: "Побежден " + opponentName + ".",
                rating: 0,
                money: BATTLE_VICTORY_COINS
            });
        } else if (duel.playerHp === 0) {
            duel.finished = true;
            duel.resultText = "Поражение. В этот раз темп ушел сопернику.";
            state.player.losses = (state.player.losses || 0) + 1;
            state.player.money = (state.player.money || 0) + BATTLE_DEFEAT_COINS;
            openDuelResultModal({
                title: "Ты проиграл",
                copy: "Победил " + opponentName + ".",
                rating: 0,
                money: BATTLE_DEFEAT_COINS
            });
        } else {
            duel.round += 1;
            startLocalRound(duel, false);
        }
        saveState();
        renderAll();
    }
    function renderAll() {
        renderScreens();
        renderProfile();
        renderHeroStats();
        renderRegistrationModal();
        renderQueueStatus();
        renderJournal();
        renderQuestCounters();
        renderInventory();
        renderFriends();
        decorateFriendCards();
        renderSocialInbox();
        renderShop();
        renderDuel();
        renderStartDuelModal();
        renderDuelExitModal();
        renderDuelResultModal();
    }

    function refreshStaticCopy() {
        document.title = "Полюс";
        safeSetText(".panel-kicker", "Профиль");
        safeSetText("#find-match-button", "Найти матч");
        safeSetText("#bot-duel-button", "Быстрая дуэль (бот)");
        safeSetText(".queue-status-label", "Поиск дуэли");
        safeSetText("#queue-cancel-button", "Отменить");
        safeSetText("#home-journal-panel .panel-title-small", "Дневник");
        safeSetText(".journal-zone-label", "Зона");
        safeSetText("#screen-inventory .panel-title", "Доступные аугментации");
        safeSetText("#screen-friends .panel-title", "Друзья");
        safeSetText("#friend-search-input", null, "placeholder", "Найти игрока по никнейму");
        safeSetText("#friend-search-form .primary-button", "Добавить");
        safeSetText("#screen-shop .panel-title", "Магазин");
        safeSetText(".shop-tab[data-shop-section='weapon']", "Оружейная");
        safeSetText(".shop-tab[data-shop-section='defense']", "Защитная");
        safeSetText(".shop-tab[data-shop-section='support']", "Вспомогательная");
        safeSetText(".nav-button[data-nav-target='home'] .nav-title", "Хаб");
        safeSetText(".nav-button[data-nav-target='inventory'] .nav-title", "Инвентарь");
        safeSetText(".nav-button[data-nav-target='friends'] .nav-title", "Друзья");
        safeSetText(".nav-button[data-nav-target='shop'] .nav-title", "Магазин");
        safeSetText("#social-chat-fab .social-chat-fab-label", "Чаты");
        safeSetText("#social-chat-panel .panel-title-small", "Чаты");
        safeSetText("#social-chat-close", "Закрыть");
        safeSetText("#social-chat-thread-title", "Выбери чат");
        safeSetText("#social-chat-input", null, "placeholder", "Напиши сообщение");
        safeSetText("#social-chat-send", "Отправить");
        safeSetText("#registration-modal .panel-title-small", "Регистрация игрока");
        safeSetText("#registration-copy", "Ник будет привязан к твоему Telegram ID.");
        safeSetText("label[for='registration-nickname']", "Никнейм");
        safeSetText("#registration-nickname", null, "placeholder", "Например, Бакунин");
        safeSetText("#registration-submit", "Создать аккаунт");
        safeSetText("#start-duel-title", "Начать бой?");
        safeSetText("#start-duel-copy", "Подтверди, что хочешь войти в бой.");
        safeSetText("#start-duel-cancel", "Нет, вернуться в хаб");
        safeSetText("#start-duel-confirm", "Да, начать бой");
        safeSetText("#duel-exit-cancel", "Нет, остаться");
        safeSetText("#duel-exit-confirm", "Да, выйти");
        safeSetText("#duel-tab-logs", "Логи");
        safeSetText("#duel-tab-chat", "Чат");
        safeSetText("#duel-clear-log-button", "Очистить");
        safeSetText("#duel-chat-input", null, "placeholder", "Напиши сообщение сопернику");
        safeSetText("#duel-chat-send-button", "Отправить");
        safeSetText("#duel-result-title", "Бой завершен");
        safeSetText("#duel-result-close", "В хаб");
    }
    function buildShopCatalog() {
        return [
            {
                id: "augment-weapon-overdrive",
                section: "weapon",
                kind: "augment",
                augmentId: "weapon-overdrive",
                slot: "weapon",
                name: "Разгонный контур",
                effect: "+5 к урону",
                copy: "Увеличивает урон любого оружия на 5.",
                price: 500
            },
            {
                id: "augment-weapon-graze",
                section: "weapon",
                kind: "augment",
                augmentId: "weapon-graze",
                slot: "weapon",
                name: "Смещённый резонатор",
                effect: "Зацеп 2 урона",
                copy: "Любое оружие получает 25% шанс зацепить на 2 урона.",
                price: 500
            },
            {
                id: "augment-defense-plate",
                section: "defense",
                kind: "augment",
                augmentId: "defense-plate",
                slot: "defense",
                name: "Северная бронепластина",
                effect: "-3 входящего урона",
                copy: "Уменьшает входящий урон на 3.",
                price: 500
            },
            {
                id: "augment-defense-evasion",
                section: "defense",
                kind: "augment",
                augmentId: "defense-evasion",
                slot: "defense",
                name: "Инерционный кожух",
                effect: "5% шанс избежать пули",
                copy: "Добавляет 5% шанс избежать любого пулевого попадания.",
                price: 500
            },
            {
                id: "augment-support-hp",
                section: "support",
                kind: "augment",
                augmentId: "support-hp",
                slot: "support",
                name: "Стим-петля",
                effect: "+15 здоровья",
                copy: "Повышает запас здоровья на 15.",
                price: 500
            },
            {
                id: "augment-support-block",
                section: "support",
                kind: "augment",
                augmentId: "support-block",
                slot: "support",
                name: "Фазовый экран",
                effect: "5% шанс блока",
                copy: "С вероятностью 5% блокирует любой выстрел.",
                price: 500
            }
        ];
    }

    function buildInitialState() {
        return {
            version: 27,
            auth: { sessionToken: null, playerId: null, telegramUserId: null, nickname: "", registered: false, demoMode: false, initError: "" },
            matchmaking: { status: "IDLE", duelId: null, message: "", queuedAt: null },
            player: { id: null, name: "Новый игрок", money: 0, rating: 0, wins: 0, losses: 0, telegramUserId: null },
            world: { lastJournalEventAt: Date.now(), lastFriendSyncAt: 0, lastJournalEventId: null, journalEventHistory: {}, currentJournalArea: "street", areaEventCount: 0 },
            ui: { screen: "home", activeQuestId: null, shopSection: "weapon", augmentPickerSlot: null, duelExitConfirmOpen: false, startDuelConfirm: null, startDuelAction: null, duelResult: null },
            journal: [],
            inventory: { equipped: [], augmentSlots: {}, unlockedAugments: [], backpack: [] },
            friends: [],
            friendRequests: [],
            social: { isOpen: false, activeThreadId: null, threads: [] },
            premium: { owned: [] },
            shop: buildShopCatalog(),
            quests: [],
            duel: null
        };
    }

    function hydrateState(source) {
        const next = source && typeof source === "object" ? source : buildInitialState();
        next.version = 27;
        next.auth = Object.assign({ sessionToken: null, playerId: null, telegramUserId: null, nickname: "", registered: false, demoMode: false, initError: "" }, next.auth || {});
        next.matchmaking = Object.assign({ status: "IDLE", duelId: null, message: "", queuedAt: null }, next.matchmaking || {});
        next.player = Object.assign({ id: null, name: "Новый игрок", money: 0, rating: 0, wins: 0, losses: 0, telegramUserId: null }, next.player || {});
        delete next.player.level;
        delete next.player.experience;
        delete next.player.levelProgressCurrent;
        delete next.player.levelProgressTarget;
        delete next.player.availableStatPoints;
        delete next.player.strength;
        delete next.player.reaction;
        delete next.player.analysis;
        next.world = Object.assign({ lastJournalEventAt: Date.now(), lastFriendSyncAt: 0, lastJournalEventId: null, journalEventHistory: {}, currentJournalArea: "street", areaEventCount: 0 }, next.world || {});
        next.world.lastJournalEventId = next.world.lastJournalEventId || null;
        next.world.journalEventHistory = next.world.journalEventHistory && typeof next.world.journalEventHistory === "object"
            ? next.world.journalEventHistory
            : {};
        next.world.currentJournalArea = next.world.currentJournalArea || "street";
        next.world.areaEventCount = Number(next.world.areaEventCount || 0);
        next.ui = Object.assign({ screen: "home", activeQuestId: null, shopSection: "weapon", augmentPickerSlot: null, duelExitConfirmOpen: false, startDuelConfirm: null, duelResult: null }, next.ui || {});
        next.ui.startDuelAction = null;
        next.inventory = next.inventory || { equipped: [], augmentSlots: {}, unlockedAugments: [], backpack: [] };
        next.inventory.unlockedAugments = Array.isArray(next.inventory.unlockedAugments) ? next.inventory.unlockedAugments : [];
        next.inventory.backpack = [];
        next.friends = Array.isArray(next.friends) ? next.friends.map(function (friend) {
            return Object.assign({}, friend, { rating: Number(friend.rating != null ? friend.rating : friend.level) || 0 });
        }) : [];
        next.friendRequests = Array.isArray(next.friendRequests) ? next.friendRequests.map(function (request) {
            return Object.assign({}, request, { rating: Number(request.rating != null ? request.rating : request.level) || 0 });
        }) : [];
        next.social = Object.assign({ isOpen: false, activeThreadId: null, threads: [] }, next.social || {});
        next.social.threads = Array.isArray(next.social.threads) ? next.social.threads.map(function (thread) {
            return Object.assign({}, thread, { rating: Number(thread.rating != null ? thread.rating : thread.level) || 0 });
        }) : [];
        next.premium = next.premium || { owned: [] };
        next.shop = buildShopCatalog();
        next.journal = Array.isArray(next.journal) ? next.journal.filter(Boolean).slice(0, 20) : [];
        next.quests = Array.isArray(next.quests) ? next.quests : [];
        return next;
    }

    function loadState() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return buildInitialState();
            }
            const parsed = JSON.parse(raw);
            return parsed && parsed.version === 27 ? parsed : buildInitialState();
        } catch (error) {
            console.error(error);
            return buildInitialState();
        }
    }

    function normalizeJournalEventCatalog(rawEvents) {
        if (!Array.isArray(rawEvents)) {
            return [];
        }
        return rawEvents.map(function (entry) {
            return {
                id: normalizeJournalString(entry.id),
                text: normalizeJournalString(entry.text),
                location: (normalizeJournalString(entry.location) || "street").toLowerCase(),
                locationLabel: normalizeJournalString(entry.locationLabel || entry.location_label),
                frequency: (normalizeJournalString(entry.frequency) || "COMMON").toUpperCase(),
                weight: Math.max(1, Number(entry.weight) || 1),
                timeTag: (normalizeJournalString(entry.time_tag != null ? entry.time_tag : entry.timeTag) || "any").toLowerCase(),
                mood: normalizeJournalString(entry.mood),
                category: normalizeJournalString(entry.category),
                uniqueDaily: normalizeJournalBoolean(entry.unique_daily != null ? entry.unique_daily : entry.is_unique_daily),
                minDaysGap: Math.max(0, Number(entry.min_days_gap != null ? entry.min_days_gap : entry.minDaysGap) || 0),
                enabled: normalizeJournalBoolean(entry.enabled),
                effect: normalizeJournalNullableString(entry.effect)
            };
        }).filter(function (eventEntry) {
            return Boolean(eventEntry.id && eventEntry.text && eventEntry.enabled);
        });
    }

    function normalizeJournalString(value) {
        if (value == null) {
            return "";
        }
        return String(value).trim();
    }

    function normalizeJournalNullableString(value) {
        const normalized = normalizeJournalString(value);
        if (!normalized || normalized.toUpperCase() === "NULL") {
            return null;
        }
        return normalized;
    }

    function normalizeJournalBoolean(value) {
        const normalized = normalizeJournalString(value).toUpperCase();
        return normalized === "TRUE"
            || normalized === "1"
            || normalized === "YES"
            || normalized === "ДА"
            || normalized === "ИСТИНА";
    }

    function getJournalDayStamp(timestamp) {
        const date = new Date(timestamp);
        return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
    }

    function getJournalDayDistance(fromTimestamp, toTimestamp) {
        const from = new Date(fromTimestamp);
        const to = new Date(toTimestamp);
        const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
        const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
        return Math.floor((toMidnight - fromMidnight) / 86400000);
    }

    function getCurrentJournalTimeTag(now) {
        const hour = new Date(now).getHours();
        if (hour >= 5 && hour < 11) {
            return "morning";
        }
        if (hour >= 11 && hour < 17) {
            return "day";
        }
        if (hour >= 17 && hour < 23) {
            return "evening";
        }
        return "night";
    }

    function getJournalEventHistoryMap() {
        if (!state.world) {
            state.world = {
                lastJournalEventAt: Date.now(),
                lastFriendSyncAt: 0,
                lastJournalEventId: null,
                journalEventHistory: {},
                currentJournalArea: "street",
                areaEventCount: 0
            };
        }
        if (!state.world.journalEventHistory || typeof state.world.journalEventHistory !== "object") {
            state.world.journalEventHistory = {};
        }
        return state.world.journalEventHistory;
    }

    function isJournalEventEligible(eventEntry, now, matchTimeTag) {
        const history = getJournalEventHistoryMap();
        const previous = history[eventEntry.id];
        const currentDay = getJournalDayStamp(now);
        if (matchTimeTag) {
            const currentTimeTag = getCurrentJournalTimeTag(now);
            if (eventEntry.timeTag !== "any" && eventEntry.timeTag !== currentTimeTag) {
                return false;
            }
        }
        if (state.world && state.world.lastJournalEventId && JOURNAL_EVENT_CATALOG.length > 1 && state.world.lastJournalEventId === eventEntry.id) {
            return false;
        }
        if (!previous) {
            return true;
        }
        if ((eventEntry.uniqueDaily || eventEntry.frequency === "DAILY") && previous.dayStamp === currentDay) {
            return false;
        }
        if (eventEntry.minDaysGap > 0 && getJournalDayDistance(previous.lastShownAt, now) < eventEntry.minDaysGap) {
            return false;
        }
        return true;
    }

    function chooseWeightedJournalEvent(candidates) {
        if (!candidates.length) {
            return null;
        }
        const totalWeight = candidates.reduce(function (sum, eventEntry) {
            return sum + Math.max(1, eventEntry.weight * (JOURNAL_FREQUENCY_WEIGHTS[eventEntry.frequency] || 1));
        }, 0);
        let cursor = Math.random() * totalWeight;
        for (let index = 0; index < candidates.length; index += 1) {
            const eventEntry = candidates[index];
            cursor -= Math.max(1, eventEntry.weight * (JOURNAL_FREQUENCY_WEIGHTS[eventEntry.frequency] || 1));
            if (cursor <= 0) {
                return eventEntry;
            }
        }
        return candidates[candidates.length - 1];
    }

    function getJournalAreas() {
        const fromCatalog = JOURNAL_EVENT_CATALOG
            .map(function (eventEntry) { return eventEntry.location; })
            .filter(Boolean);
        const uniqueAreas = Array.from(new Set(fromCatalog));
        return uniqueAreas.length ? uniqueAreas : ["street"];
    }

    function chooseNextJournalArea() {
        const areas = getJournalAreas();
        const currentArea = state.world && state.world.currentJournalArea ? state.world.currentJournalArea : null;
        const candidates = areas.filter(function (area) {
            return area !== currentArea;
        });
        const pool = candidates.length ? candidates : areas;
        return pool[Math.floor(Math.random() * pool.length)] || "street";
    }

    function getCurrentJournalArea() {
        if (!state.world) {
            state.world = { lastJournalEventAt: Date.now(), lastFriendSyncAt: 0, lastJournalEventId: null, journalEventHistory: {}, currentJournalArea: "street", areaEventCount: 0 };
        }
        if (!state.world.currentJournalArea) {
            state.world.currentJournalArea = chooseNextJournalArea();
        }
        return state.world.currentJournalArea;
    }

    function pickJournalEvent(now) {
        if (state.world && Number(state.world.areaEventCount || 0) >= 4) {
            state.world.currentJournalArea = chooseNextJournalArea();
            state.world.areaEventCount = 0;
        }
        const currentArea = getCurrentJournalArea();
        const strictCandidates = JOURNAL_EVENT_CATALOG.filter(function (eventEntry) {
            return eventEntry.location === currentArea && isJournalEventEligible(eventEntry, now, true);
        });
        if (strictCandidates.length) {
            return chooseWeightedJournalEvent(strictCandidates);
        }
        const relaxedCandidates = JOURNAL_EVENT_CATALOG.filter(function (eventEntry) {
            return eventEntry.location === currentArea && isJournalEventEligible(eventEntry, now, false);
        });
        if (relaxedCandidates.length) {
            return chooseWeightedJournalEvent(relaxedCandidates);
        }
        const fallbackStrict = JOURNAL_EVENT_CATALOG.filter(function (eventEntry) {
            return isJournalEventEligible(eventEntry, now, true);
        });
        if (fallbackStrict.length) {
            return chooseWeightedJournalEvent(fallbackStrict);
        }
        const fallbackRelaxed = JOURNAL_EVENT_CATALOG.filter(function (eventEntry) {
            return isJournalEventEligible(eventEntry, now, false);
        });
        return chooseWeightedJournalEvent(fallbackRelaxed);
    }

    function rememberJournalEvent(eventEntry, now) {
        const history = getJournalEventHistoryMap();
        history[eventEntry.id] = {
            lastShownAt: now,
            dayStamp: getJournalDayStamp(now),
            location: eventEntry.location,
            locationLabel: eventEntry.locationLabel || JOURNAL_LOCATION_LABELS[eventEntry.location] || "Город",
            frequency: eventEntry.frequency
        };
        state.world.lastJournalEventId = eventEntry.id;
        state.world.currentJournalArea = eventEntry.location || getCurrentJournalArea();
        state.world.areaEventCount = Number(state.world.areaEventCount || 0) + 1;
    }

    function renderJournal() {
        if (!elements.journalList) {
            return;
        }
        const latestLocation = state.world && state.world.currentJournalArea
            ? state.world.currentJournalArea
            : (state.journal.length && state.journal[0].location ? state.journal[0].location : "street");
        if (elements.journalZone) {
            elements.journalZone.textContent = JOURNAL_LOCATION_LABELS[latestLocation] || "Город";
        }
        if (!state.journal.length) {
            elements.journalList.innerHTML = '<article class="journal-entry"><p>Записей пока нет.</p><small>Новые заметки появятся здесь автоматически.</small></article>';
            return;
        }
        elements.journalList.innerHTML = state.journal.slice(0, 20).map(function (entry) {
            const zoneLabel = entry.locationLabel || JOURNAL_LOCATION_LABELS[entry.location] || "Город";
            return '<article class="journal-entry"><p>' + decorateText(entry.text) + '</p><small>' + escapeHtml(zoneLabel + " · " + formatTimestamp(entry.createdAt)) + '</small></article>';
        }).join("");
    }
    function getDisplayFriends() {
        const actual = Array.isArray(state.friends) ? state.friends.slice() : [];
        const placeholderFriends = [
            { id: "demo-friend-1", name: "Ледовый Пульс", status: "online", rating: 120 },
            { id: "demo-friend-2", name: "Северный Узел", status: "offline", rating: 95 }
        ];
        const takenIds = new Set(actual.map(function (friend) { return friend.id; }));
        return actual.concat(placeholderFriends.filter(function (friend) {
            return !takenIds.has(friend.id);
        }));
    }
    function renderFriends() {
        refreshStaticCopy();
        const requests = Array.isArray(state.friendRequests) ? state.friendRequests : [];
        const friends = getDisplayFriends();
        elements.friendRequestBadge.textContent = String(Math.min(9, requests.length));
        elements.friendRequestPanel.innerHTML = requests.length ? [
            '<section class="friend-request-stack">',
            '<div class="panel-header friend-subheader"><h3 class="panel-title panel-title-small">Приглашения</h3></div>',
            requests.map(function (request) {
                const online = request.status === "online";
                return [
                    '<article class="friend-card friend-request-card">',
                    '<h3>' + escapeHtml(request.name) + '</h3>',
                    '<div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'Онлайн' : 'Оффлайн') + '</span><span class="timer-chip">Рейтинг ' + escapeHtml(String(request.rating || 0)) + '</span></div>',
                    '<div class="friend-actions">',
                    '<button class="primary-button full-width" type="button" data-request-accept-id="' + escapeHtml(request.id) + '">Принять</button>',
                    '<button class="secondary-button full-width" type="button" data-request-reject-id="' + escapeHtml(request.id) + '">Отклонить</button>',
                    '</div>',
                    '</article>'
                ].join('');
            }).join(''),
            '</section>'
        ].join('') : '';
        elements.friendList.innerHTML = friends.length ? friends.map(function (friend) {
            const online = friend.status === 'online';
            return [
                '<article class="friend-card">',
                '<h3>' + escapeHtml(friend.name) + '</h3>',
                '<div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'Онлайн' : 'Оффлайн') + '</span><span class="timer-chip">Рейтинг ' + escapeHtml(String(friend.rating || 0)) + '</span></div>',
                '<div class="friend-actions">',
                '<button class="secondary-button full-width" data-friend-chat-id="' + escapeHtml(friend.id) + '" type="button">Написать сообщение</button>',
                '<button class="secondary-button full-width friend-action-profile" data-friend-profile-id="' + escapeHtml(friend.id) + '" type="button">Посмотреть профиль</button>',
                '</div>',
                '</article>'
            ].join('');
        }).join('') : '<article class="friend-card"><p>Пока друзей нет. Найди игрока по никнейму и отправь запрос.</p></article>';
    }
    function renderSocialInbox() {
        refreshStaticCopy();
        if (!elements.socialChatPanel) {
            return;
        }
        state.social = state.social || {};
        state.social.threads = Array.isArray(state.social.threads) ? state.social.threads : [];
        const threads = state.social.threads;
        const activeThread = threads.find(function (thread) { return thread.id === state.social.activeThreadId; }) || null;
        elements.socialChatFabBadge.textContent = String(Math.min(9, threads.length));
        elements.socialChatFabBadge.classList.toggle("hidden", threads.length === 0);
        elements.socialChatPanel.classList.toggle("hidden", !state.social.isOpen);
        elements.socialChatPanel.setAttribute("aria-hidden", state.social.isOpen ? "false" : "true");
        if (!threads.length) {
            elements.socialChatThreadList.innerHTML = '<article class="social-chat-empty">Открытые диалоги появятся здесь после первого сообщения другу.</article>';
            elements.socialChatThreadTitle.textContent = "Выбери чат";
            elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Выбери друга и начни переписку.</div>';
            elements.socialChatInput.disabled = true;
            elements.socialChatSend.disabled = true;
            return;
        }
        elements.socialChatThreadList.innerHTML = threads.map(function (thread) {
            return [
                '<button class="social-chat-thread-card' + (activeThread && activeThread.id === thread.id ? ' is-active' : '') + '" type="button" data-social-thread-id="' + escapeHtml(thread.id) + '">',
                '<strong>' + escapeHtml(thread.friendName || 'Друг') + '</strong>',
                '<span>' + escapeHtml(thread.status === "online" ? "Онлайн" : "Оффлайн") + ' · Рейтинг ' + escapeHtml(String(thread.rating || 0)) + '</span>',
                '</button>'
            ].join("");
        }).join("");
        if (!activeThread) {
            elements.socialChatThreadTitle.textContent = "Выбери чат";
            elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Выбери диалог слева.</div>';
            elements.socialChatInput.disabled = true;
            elements.socialChatSend.disabled = true;
            return;
        }
        elements.socialChatThreadTitle.textContent = activeThread.friendName || "Друг";
        elements.socialChatMessages.innerHTML = (activeThread.messages || []).length ? (activeThread.messages || []).map(function (message) {
            const own = message.author === "you";
            return [
                '<div class="social-chat-message' + (own ? ' social-chat-message-own' : '') + '">',
                '<div class="social-chat-message-bubble">',
                '<strong>' + escapeHtml(own ? state.player.name : activeThread.friendName || "Друг") + '</strong>',
                '<p>' + escapeHtml(message.text || "") + '</p>',
                '<small>' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</small>',
                '</div>',
                '</div>'
            ].join("");
        }).join("") : '<div class="social-chat-empty">Пока сообщений нет. Напиши первым.</div>';
        elements.socialChatInput.disabled = false;
        elements.socialChatSend.disabled = false;
        elements.socialChatMessages.scrollTop = elements.socialChatMessages.scrollHeight;
    }

    function renderInventory() {
        if (!elements.inventoryPlaceholder) {
            return;
        }
        const sections = [
            { id: "weapon", title: "Оружейная аугментация", empty: "Купленные оружейные модули появятся здесь." },
            { id: "defense", title: "Защитная аугментация", empty: "Купленные защитные модули появятся здесь." },
            { id: "support", title: "Вспомогательная аугментация", empty: "Купленные вспомогательные модули появятся здесь." }
        ];
        elements.inventoryPlaceholder.innerHTML = sections.map(function (section) {
            const owned = getOwnedAugments(section.id);
            const cards = owned.length
                ? owned.map(function (item) {
                    return [
                        '<article class="inventory-card augment-card is-passive">',
                        '<span class="augment-type">' + escapeHtml(section.title) + '</span>',
                        '<h3>' + escapeHtml(item.name) + '</h3>',
                        '<p class="augment-effect">' + escapeHtml(item.effect) + '</p>',
                        '<p class="augment-footnote">' + escapeHtml(item.copy) + '</p>',
                        '</article>'
                    ].join("");
                }).join("")
                : '<article class="inventory-card is-passive"><h3>' + escapeHtml(section.title) + '</h3><p>' + escapeHtml(section.empty) + '</p></article>';
            return '<section class="inventory-list">' + cards + '</section>';
        }).join("");
    }
    function renderShop() {
        const activeSection = state.ui.shopSection || "weapon";
        elements.shopTabButtons.forEach(function (button) {
            button.classList.toggle("is-active", button.getAttribute("data-shop-section") === activeSection);
        });
        elements.shopList.innerHTML = renderShopSection(activeSection);
    }

    function renderShopSection(section) {
        const items = state.shop.filter(function (item) { return item.section === section; });
        if (!items.length) {
            return '<section class="shop-section"><article class="shop-card is-passive"><h3>Пусто</h3><p>Тут скоро появятся новые аугментации.</p></article></section>';
        }
        return ['<section class="shop-section">', items.map(function (item) {
            const alreadyOwned = hasAugment(item.augmentId);
            const buttonLabel = alreadyOwned ? "Куплено" : "Купить";
            return [
                '<article class="shop-card">',
                '<h3>' + escapeHtml(item.name) + '</h3>',
                '<p class="shop-meta">' + escapeHtml(item.effect) + '</p>',
                '<p>' + escapeHtml(item.copy) + '</p>',
                '<div class="shop-price-row"><strong>' + escapeHtml(item.price + " монет") + '</strong></div>',
                '<div class="shop-actions"><button class="primary-button" data-shop-id="' + escapeHtml(item.id) + '" type="button" onclick="window.PolusApp && window.PolusApp.buy(\'' + escapeJs(item.id) + '\')"' + (alreadyOwned ? ' disabled' : '') + '>' + escapeHtml(buttonLabel) + '</button></div>',
                '</article>'
            ].join("");
        }).join(""), '</section>'].join("");
    }

    function viewFriendProfile(friendId) {
        const friend = getFriendById(friendId);
        if (!friend) {
            return;
        }
        showToast(friend.name + " · рейтинг " + (friend.rating || 0) + " · " + (friend.status === "online" ? "онлайн" : "оффлайн"));
    }
    function buildLiveResultText(payload) {
        if (payload.status === "FINISHED") {
            if (payload.resultLabel === "VICTORY") {
                return "Победа. Бой завершен в твою пользу.";
            }
            if (payload.resultLabel === "DEFEAT") {
                return "Поражение. В этом бою верх взял соперник.";
            }
            return "Ничья. Оба бойца пережили размен.";
        }
        if (payload.yourActionSubmitted && !payload.opponentActionSubmitted) {
            return "Ход отправлен. Ждем решение соперника.";
        }
        if (payload.yourActionSubmitted && payload.opponentActionSubmitted) {
            return "Оба хода отправлены. Раунд разрешается.";
        }
        return "";
    }

    function openLiveDuelResult(payload) {
        const isVictory = payload.resultLabel === "VICTORY";
        const isDefeat = payload.resultLabel === "DEFEAT";
        const rewardMoney = isVictory ? BATTLE_VICTORY_COINS : (isDefeat ? BATTLE_DEFEAT_COINS : 0);
        const rewardRating = isVictory ? PVP_RATING_DELTA : (isDefeat ? -PVP_RATING_DELTA : 0);
        if (isVictory) {
            addJournal("Победа в PvP. +100 монет и +10 рейтинга.");
        } else if (isDefeat) {
            addJournal("Поражение в PvP. +25 монет и -10 рейтинга.");
        } else {
            addJournal("Ничья в бою. Рейтинг без изменений.");
        }
        openDuelResultModal({
            title: isVictory ? "Ты победил" : (isDefeat ? "Ты проиграл" : "Ничья"),
            copy: isVictory
                ? "Побежден " + (payload.opponent && payload.opponent.displayName ? payload.opponent.displayName : "соперник") + "."
                : (isDefeat
                    ? "Победил " + (payload.opponent && payload.opponent.displayName ? payload.opponent.displayName : "соперник") + "."
                    : "Оба бойца пережили размен."),
            rating: rewardRating,
            money: rewardMoney
        });
    }

    function renderDuelResultModal() {
        const result = state.ui.duelResult;
        const shouldOpen = Boolean(result);
        if (!elements.duelResultModal) {
            return;
        }
        elements.duelResultModal.classList.toggle("hidden", !shouldOpen);
        elements.duelResultModal.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
        if (!shouldOpen) {
            return;
        }
        elements.duelResultTitle.textContent = result.title || "Бой завершен";
        elements.duelResultCopy.textContent = result.copy || "";
        elements.duelResultExp.textContent = formatSignedReward(result.rating || 0, " рейтинга");
        elements.duelResultMoney.textContent = formatSignedReward(result.money || 0, " монет");
    }

    function openDuelResultModal(config) {
        state.ui.duelExitConfirmOpen = false;
        state.ui.duelResult = {
            title: config.title || "Бой завершен",
            copy: config.copy || "",
            rating: Number(config.rating) || 0,
            money: Number(config.money) || 0
        };
        saveState();
        renderDuelResultModal();
    }

    function weaponLabel(code) {
        return {
            PISTOLS: "Пистоль и щит",
            RIFLE: "Винтовка",
            SHOTGUN: "Дробовик"
        }[code] || code;
    }

    function weaponInstrumentLabel(code) {
        return {
            PISTOLS: "из пистоля и щита",
            RIFLE: "из винтовки",
            SHOTGUN: "из дробовика"
        }[code] || "";
    }

    function directionLabel(code) {
        return { LEFT: "влево", CENTER: "по центру", RIGHT: "вправо" }[code] || code;
    }

    function dodgeLabel(code) {
        return {
            LEFT: "смещается влево",
            STAY: "остается по центру",
            RIGHT: "смещается вправо"
        }[code] || code;
    }

    function buildDuelIntentLine(name, action) {
        return name + " стреляет " + directionLabel(action.shot) + " " + weaponInstrumentLabel(action.weapon) + " и " + dodgeLabel(action.dodge) + ".";
    }

    function resolveAttack(attackerName, defenderName, attackerAction, defenderAction, attackerSide) {
        const lines = [];
        const lineMatched = attackerAction.shot === defenderAction.dodge;
        if (!lineMatched && attackerAction.weapon !== "SHOTGUN") {
            lines.push(attackerName + " промахивается мимо линии.");
            return { damage: 0, lines: lines };
        }
        if (lineMatched && shouldSupportEvade(attackerSide === "player" ? "opponent" : "player")) {
            lines.push(defenderName + " уходит от урона.");
            return { damage: 0, lines: lines };
        }
        if (attackerAction.weapon === "PISTOLS") {
            if (projectileBlocked(attackerSide, defenderAction.weapon, attackerAction.weapon, attackerAction.shot)) {
                lines.push(defenderName + " блокирует выстрел щитом.");
                return { damage: 0, lines: lines };
            }
            let damage = 18 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
            damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, false, lines, defenderName);
            lines.push(attackerName + " попадает " + weaponInstrumentLabel(attackerAction.weapon) + " и наносит " + damage + " урона.");
            return { damage: damage, lines: lines };
        }
        if (attackerAction.weapon === "RIFLE") {
            let damage = 30 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
            damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, false, lines, defenderName);
            lines.push(attackerName + " попадает " + weaponInstrumentLabel(attackerAction.weapon) + " и наносит " + damage + " урона.");
            return { damage: damage, lines: lines };
        }
        let pelletsHit = 0;
        let pelletsBlocked = 0;
        if (!lineMatched) {
            if (Math.random() < SHOTGUN_EDGE_GRAZE_CHANCE + getWeaponGrazeBonus(attackerSide, attackerAction.weapon)) {
                let edgeDamage = SHOTGUN_EDGE_DAMAGE + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
                edgeDamage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", edgeDamage, true, lines, defenderName);
                lines.push(attackerName + " цепляет краем и наносит " + edgeDamage + " урона.");
                return { damage: edgeDamage, lines: lines };
            }
            lines.push(attackerName + " промахивается мимо силуэта.");
            return { damage: 0, lines: lines };
        }
        for (let pellet = 0; pellet < 5; pellet++) {
            if (projectileBlocked(attackerSide, defenderAction.weapon, attackerAction.weapon, attackerAction.shot)) {
                pelletsBlocked++;
            } else {
                pelletsHit++;
            }
        }
        if (!pelletsHit) {
            lines.push(defenderName + " блокирует дробовой размен.");
            return { damage: 0, lines: lines };
        }
        let damage = pelletsHit * 5 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
        damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, pelletsHit < 3, lines, defenderName);
        let summary = attackerName + " попадает " + pluralizeHits(pelletsHit) + " и наносит " + damage + " урона.";
        if (pelletsBlocked) {
            summary += " " + defenderName + " блокирует " + pluralizeHits(pelletsBlocked) + ".";
        }
        lines.push(summary);
        return { damage: damage, lines: lines };
    }

    async function confirmDuelExit() {
        if (!state.duel) {
            cancelDuelExit();
            return;
        }
        if (elements.duelExitCancelButton) {
            elements.duelExitCancelButton.disabled = true;
        }
        if (elements.duelExitConfirmButton) {
            elements.duelExitConfirmButton.disabled = true;
        }
        try {
            if (state.duel.mode === "pvp-live" && !state.duel.finished && state.duel.duelId) {
                const duelId = state.duel.duelId;
                await apiFetch("/api/duel/" + encodeURIComponent(duelId) + "/forfeit", { method: "POST" });
                addJournal("Ты покинул бой. Засчитано автопоражение.");
                state.matchmaking.status = "COMPLETED";
                state.matchmaking.duelId = null;
                await refreshLiveDuel(duelId);
                return;
            }

            const duel = state.duel;
            const opponentName = duel.opponentName || "соперник";
            duel.finished = true;
            duel.playerHp = 0;
            duel.resultText = "Поражение. Бой завершен из-за выхода.";
            state.player.losses += 1;
            state.player.money = (state.player.money || 0) + BATTLE_DEFEAT_COINS;
            duel.logs.push({
                round: duel.round,
                lines: [
                    "Раунд " + duel.round + ": " + (duel.playerName || "игрок") + " покидает бой.",
                    "Итог: " + opponentName + " получает автопобеду."
                ]
            });
            addJournal("Автопоражение в бою. +" + BATTLE_DEFEAT_COINS + " монет.");
            openDuelResultModal({
                title: "Ты проиграл",
                copy: "Победил " + opponentName + ".",
                rating: 0,
                money: BATTLE_DEFEAT_COINS
            });
            saveState();
            renderAll();
        } catch (error) {
            showToast(error && error.message ? error.message : "Не удалось завершить бой.");
        } finally {
            if (elements.duelExitCancelButton) {
                elements.duelExitCancelButton.disabled = false;
            }
            if (elements.duelExitConfirmButton) {
                elements.duelExitConfirmButton.disabled = false;
            }
        }
    }

    function renderDuel() {
        refreshStaticCopy();
        const duel = state.duel;
        if (!duel) {
            closeDuelSilently();
            return;
        }
        duel.activePanel = duel.activePanel || "logs";
        duel.chatMessages = Array.isArray(duel.chatMessages) ? duel.chatMessages : [];
        duel.chatError = duel.chatError || "";
        syncDuelInputs(duel);
        elements.duelTitle.textContent = "Дуэль";
        elements.duelRoundPill.textContent = "Раунд " + duel.round;
        elements.duelRoundTimer.textContent = formatDuration(getRoundTimeRemainingMs(duel));
        elements.duelYouName.textContent = duel.playerName || "Игрок";
        elements.duelYouMeta.textContent = "";
        elements.duelYouAvatar.textContent = (duel.playerName || "И").slice(0, 1).toUpperCase();
        elements.duelOpponentName.textContent = duel.opponentName || "Соперник";
        elements.duelOpponentMeta.textContent = "";
        elements.duelOpponentAvatar.textContent = (duel.opponentName || "С").slice(0, 1).toUpperCase();
        elements.duelYouHp.textContent = duel.playerHp + " HP";
        elements.duelOpponentHp.textContent = duel.opponentHp + " HP";
        elements.duelYouFill.style.width = Math.max(0, Math.min(100, Math.round((duel.playerHp / getPlayerMaxHp()) * 100))) + "%";
        elements.duelOpponentFill.style.width = Math.max(0, Math.min(100, Math.round((duel.opponentHp / getPlayerMaxHp()) * 100))) + "%";
        const duelStatus = buildDuelStatusText(duel);
        elements.duelRoundStatus.innerHTML = duelStatus ? decorateText(duelStatus) : "";
        elements.duelRoundStatus.classList.toggle("hidden", !duelStatus);
        const duelSelectionComplete = isDuelSelectionComplete(duel);
        const duelHasPendingChanges = hasPendingDuelChanges(duel);
        const submitButtonLabel = duel.finished
            ? "Бой завершен"
            : duel.yourActionSubmitted
                ? (duelHasPendingChanges ? "Изменить ход" : "Ход сделан")
                : "Сделать ход";
        elements.duelSubmitButton.textContent = submitButtonLabel;
        elements.duelSubmitButton.disabled = duel.finished
            || duel.autoBattleEnabled
            || !duel.canSubmitAction
            || !duelSelectionComplete
            || (duel.yourActionSubmitted && !duelHasPendingChanges);
        renderDuelControls();
        if (!duel.logs.length) {
            elements.duelLogList.innerHTML = '<div class="duel-log-round"><p class="duel-log-round-title">Логов пока нет. Первый обмен ходами появится здесь.</p></div>';
        } else {
            elements.duelLogList.innerHTML = duel.logs.slice().reverse().map(function (entry) {
                const roundNumber = typeof entry.round === "number" ? entry.round : entry.roundNumber;
                const lines = Array.isArray(entry.lines) ? entry.lines : [];
                const title = lines.length ? lines[0] : "Раунд " + roundNumber;
                const detailLines = lines.slice(1);
                return '<div class="duel-log-round"><p class="duel-log-round-title">' + decorateText(title) + '</p>' + detailLines.map(function (line) {
                    return '<p class="duel-log-line">' + decorateText(line) + '</p>';
                }).join("") + '</div>';
            }).join("");
        }
        renderDuelChat(duel);
        elements.duelTabLogs.classList.toggle("is-active", duel.activePanel === "logs");
        elements.duelTabLogs.setAttribute("aria-selected", duel.activePanel === "logs" ? "true" : "false");
        elements.duelTabChat.classList.toggle("is-active", duel.activePanel === "chat");
        elements.duelTabChat.setAttribute("aria-selected", duel.activePanel === "chat" ? "true" : "false");
        elements.duelLogsPane.classList.toggle("hidden", duel.activePanel !== "logs");
        elements.duelChatPane.classList.toggle("hidden", duel.activePanel !== "chat");
        elements.duelClearLogButton.classList.toggle("hidden", duel.activePanel !== "logs");
        elements.duelOverlay.classList.remove("hidden");
        elements.duelOverlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("duel-open");
    }

    async function toggleAutoBattle() {
        const duel = state.duel;
        if (!duel || duel.finished) {
            return;
        }
        const currentEnabled = Boolean(duel.autoBattleEnabled);
        const pendingEnabled = typeof duel.autoBattlePendingEnabled === "boolean" ? duel.autoBattlePendingEnabled : null;
        const desiredEnabled = pendingEnabled === null ? !currentEnabled : !pendingEnabled;
        const nextPending = desiredEnabled === currentEnabled ? null : desiredEnabled;
        if (duel.mode === "pvp-live" && duel.duelId) {
            elements.duelAutoToggle.disabled = true;
            try {
                const response = await apiFetch("/api/duel/" + encodeURIComponent(duel.duelId) + "/automation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ enabled: desiredEnabled })
                });
                const payload = await response.json();
                await refreshLiveDuel(payload.duelId);
            } catch (error) {
                showToast(error && error.message ? error.message : "Не удалось переключить автоматический бой.");
            } finally {
                if (elements.duelAutoToggle) {
                    elements.duelAutoToggle.disabled = false;
                }
            }
            return;
        }
        duel.autoBattlePendingEnabled = nextPending;
        saveState();
        renderDuel();
    }

    function renderDuelControls() {
        const duel = state.duel;
        const controlsDisabled = !duel || duel.finished || duel.autoBattleEnabled;
        toggleDuelButtonGroup(elements.duelWeaponButtons, duel ? duel.selectedWeapon : "");
        toggleDuelButtonGroup(elements.duelShotButtons, duel ? duel.selectedShot : "");
        toggleDuelButtonGroup(elements.duelDodgeButtons, duel ? duel.selectedDodge : "");
        [].concat(elements.duelWeaponButtons, elements.duelShotButtons, elements.duelDodgeButtons).forEach(function (button) {
            button.disabled = controlsDisabled;
        });
        elements.duelClearLogButton.disabled = !duel || !duel.logs.length || duel.mode === "pvp-live";
        if (!duel) {
            elements.duelAutoToggle.classList.remove("is-active", "is-pending");
            elements.duelAutoToggle.disabled = true;
            elements.duelAutoToggle.textContent = "Включить автоматический бой";
            elements.duelAutoNote.textContent = "";
            elements.duelAutoNote.classList.add("hidden");
            elements.duelAutoCover.classList.add("hidden");
            return;
        }
        const currentEnabled = Boolean(duel.autoBattleEnabled);
        const pendingEnabled = typeof duel.autoBattlePendingEnabled === "boolean" ? duel.autoBattlePendingEnabled : null;
        elements.duelAutoToggle.disabled = duel.finished;
        elements.duelAutoToggle.classList.toggle("is-active", currentEnabled);
        elements.duelAutoToggle.classList.toggle("is-pending", pendingEnabled !== null && pendingEnabled !== currentEnabled);
        elements.duelAutoToggle.textContent = currentEnabled ? "Выключить автоматический бой" : "Включить автоматический бой";
        elements.duelAutoNote.textContent = "Автобой включится со следующего хода.";
        elements.duelAutoNote.classList.remove("hidden");
        elements.duelAutoCover.classList.toggle("hidden", !currentEnabled || duel.finished);
    }

    function startLocalRound(duel, isInitial) {
        if (!duel || duel.finished) {
            return;
        }
        if (!isInitial && typeof duel.autoBattlePendingEnabled === "boolean") {
            duel.autoBattleEnabled = duel.autoBattlePendingEnabled;
            duel.autoBattlePendingEnabled = null;
            appendLocalSystemLog(
                duel.autoBattleEnabled
                    ? "С этого раунда ходы " + (duel.playerName || "игрока") + " автоматизированы."
                    : "С этого раунда автоматические ходы " + (duel.playerName || "игрока") + " отключены."
            );
        }
        duel.roundStartedAt = Date.now();
        duel.roundDeadlineAt = duel.roundStartedAt + DUEL_ROUND_TIMEOUT_MS;
        duel.selectedWeapon = null;
        duel.selectedShot = null;
        duel.selectedDodge = null;
        duel.submittedAction = null;
        duel.yourActionSubmitted = false;
        duel.opponentActionSubmitted = false;
        duel.autoResolutionAt = null;
        duel.canSubmitAction = !duel.autoBattleEnabled;
        duel.resultText = duel.autoBattleEnabled ? "С этого раунда ход будет собран автоматически." : "";
        if (duel.autoBattleEnabled) {
            const autoAction = buildAutoBattleAction();
            duel.submittedAction = autoAction;
            duel.selectedWeapon = autoAction.weapon;
            duel.selectedShot = autoAction.shot;
            duel.selectedDodge = autoAction.dodge;
            duel.yourActionSubmitted = true;
            duel.autoResolutionAt = Date.now() + 1000;
        }
    }

    function buyShopItem(shopId) {
        const item = state.shop.find(function (entry) { return entry.id === shopId; });
        if (!item) {
            return;
        }
        if (hasAugment(item.augmentId)) {
            showToast("Эта аугментация уже куплена.");
            return;
        }
        if (state.player.money < item.price) {
            const warning = "Не хватает монет: " + item.price + ".";
            addJournal(warning);
            showToast(warning);
            renderAll();
            return;
        }

        state.player.money -= item.price;
        unlockAugment(item.augmentId);
        addJournal("Покупка аугментации: «" + item.name + "». -" + item.price + " монет.");
        showToast("Куплено: " + item.name + ".");
        saveState();
        renderAll();
    }

    function renderSocialInbox() {
        refreshStaticCopy();
        if (!elements.socialChatPanel) {
            return;
        }
        state.social = state.social || {};
        state.social.threads = Array.isArray(state.social.threads) ? state.social.threads : [];
        const threads = state.social.threads;
        const activeThread = threads.find(function (thread) { return thread.id === state.social.activeThreadId; }) || null;
        elements.socialChatFabBadge.textContent = String(Math.min(9, threads.length));
        elements.socialChatFabBadge.classList.toggle("hidden", threads.length === 0);
        elements.socialChatPanel.classList.toggle("hidden", !state.social.isOpen);
        elements.socialChatPanel.setAttribute("aria-hidden", state.social.isOpen ? "false" : "true");
        document.body.classList.toggle("social-open", Boolean(state.social.isOpen));
        if (!threads.length) {
            elements.socialChatThreadList.innerHTML = '<article class="social-chat-empty">Открытые диалоги появятся здесь после первого сообщения другу.</article>';
            elements.socialChatThreadTitle.textContent = "Выбери чат";
            elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Выбери друга и начни переписку.</div>';
            elements.socialChatInput.disabled = true;
            elements.socialChatSend.disabled = true;
            return;
        }
        elements.socialChatThreadList.innerHTML = threads.map(function (thread) {
            return [
                '<button class="social-chat-thread-card' + (activeThread && activeThread.id === thread.id ? ' is-active' : '') + '" type="button" data-social-thread-id="' + escapeHtml(thread.id) + '">',
                '<strong>' + escapeHtml(thread.friendName || "Друг") + '</strong>',
                '<span>' + escapeHtml((thread.status === "online" ? "Онлайн" : "Оффлайн") + " · Рейтинг " + (thread.rating || 0)) + '</span>',
                '</button>'
            ].join("");
        }).join("");
        if (!activeThread) {
            elements.socialChatThreadTitle.textContent = "Выбери чат";
            elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Открой чат через карточку друга.</div>';
            elements.socialChatInput.disabled = true;
            elements.socialChatSend.disabled = true;
            return;
        }
        elements.socialChatThreadTitle.textContent = activeThread.friendName || "Друг";
        elements.socialChatMessages.innerHTML = (activeThread.messages || []).length
            ? (activeThread.messages || []).map(function (message) {
                const own = message.author === "you";
                return [
                    '<div class="social-chat-message' + (own ? " social-chat-message-own" : "") + '">',
                    '<div class="social-chat-message-bubble">',
                    '<strong>' + escapeHtml(own ? state.player.name : (activeThread.friendName || "Друг")) + '</strong>',
                    '<p>' + escapeHtml(message.text || "") + '</p>',
                    '<small>' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</small>',
                    '</div>',
                    '</div>'
                ].join("");
            }).join("")
            : '<div class="social-chat-empty">Пока сообщений нет. Напиши первым.</div>';
        elements.socialChatInput.disabled = false;
        elements.socialChatSend.disabled = false;
        elements.socialChatMessages.scrollTop = elements.socialChatMessages.scrollHeight;
    }
    function triggerScheduledJournalEvent() {
        if (!state.world) {
            state.world = {
                lastJournalEventAt: Date.now(),
                lastFriendSyncAt: 0,
                lastJournalEventId: null,
                journalEventHistory: {},
                currentJournalArea: "street",
                areaEventCount: 0
            };
        }
        const now = Date.now();
        const lastJournalEventAt = Number(state.world.lastJournalEventAt || 0);
        const elapsed = now - lastJournalEventAt;
        if (elapsed < JOURNAL_EVENT_MS) {
            return;
        }
        const pendingCount = Math.min(20, Math.floor(elapsed / JOURNAL_EVENT_MS));
        let pointer = lastJournalEventAt;
        for (let index = 0; index < pendingCount; index += 1) {
            pointer += JOURNAL_EVENT_MS;
            const eventEntry = pickJournalEvent(pointer);
            if (eventEntry) {
                rememberJournalEvent(eventEntry, pointer);
                addJournal(eventEntry.text, {
                    sourceEventId: eventEntry.id,
                    location: eventEntry.location,
                    locationLabel: eventEntry.locationLabel || JOURNAL_LOCATION_LABELS[eventEntry.location] || "Город"
                });
            }
        }
        state.world.lastJournalEventAt = now;
        saveState();
        if (state.ui && state.ui.screen === "home") {
            renderJournal();
        }
    }
    function submitCurrentDuelTurn() {
        if (!state.duel || state.duel.finished) {
            return;
        }
        if (state.duel.mode === "pvp-live") {
            submitLiveDuelAction();
            return;
        }
        if (!isDuelSelectionComplete(state.duel)) {
            showToast("Сначала выбери оружие, выстрел и уворот.");
            return;
        }
        resolveDuelRound(
            getCurrentDuelAction(state.duel),
            buildOpponentAction()
        );
    }
})();
