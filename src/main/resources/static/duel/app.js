(function () {
    const STORAGE_KEY = "polus_frontend_prototype_v45";
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
    const BATTLE_REWARD_EXPERIENCE = 0;
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
        "Случайное событие: соседний генератор пережил ещё один морозный цикл.",
        "Случайное событие: кто-то оставил ящик с пустыми гильзами у склада.",
        "Случайное событие: в трактире спорят, кто держит лучшую линию огня.",
        "Случайное событие: механик обещает скоро открыть тёплую мастерскую.",
        "Случайное событие: курьер привёз свежие вести с южного коридора.",
        "Случайное событие: сторож заметил свет в заброшенном ангаре."
    ];
    const DIRECTION_TERMS = ["по центру", "влево", "вправо"];
    const ITEM_LIBRARY = {
        cartridges38: { id: "cartridges38", name: "РџР°С‚СЂРѕРЅС‹ .38", description: "РЎС‚Р°РЅРґР°СЂС‚РЅС‹Р№ Р±РѕРµР·Р°РїР°СЃ РґР»СЏ РєРѕСЂРѕС‚РєРѕР№ Р»РёРЅРёРё.", pocket: true },
        medkit: { id: "medkit", name: "РђРїС‚РµС‡РєР°", description: "РџРѕР»РµРІРѕР№ РЅР°Р±РѕСЂ РґР»СЏ Р±С‹СЃС‚СЂРѕРіРѕ РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёСЏ.", pocket: true, usable: true },
        brassGear: { id: "brassGear", name: "Р›Р°С‚СѓРЅРЅР°СЏ С€РµСЃС‚РµСЂРЅСЏ", description: "РўСЏР¶РµР»Р°СЏ РґРµС‚Р°Р»СЊ РґР»СЏ РјР°СЃС‚РµСЂСЃРєРёС… Р·Р°РєР°Р·РѕРІ." },
        relicBox: { id: "relicBox", name: "Р РµР»РёРєРІР°СЂРёР№", description: "РЎС‚Р°СЂР°СЏ РєРѕСЂРѕР±РєР° СЃ РїСЂРёРјРµС‚Р°РјРё РїСЂРµР¶РЅРµРіРѕ С…РѕР·СЏРёРЅР°." },
        iceToken: { id: "iceToken", name: "Р›РµРґСЏРЅРѕР№ Р¶РµС‚РѕРЅ", description: "РҐРѕР»РѕРґРЅС‹Р№ Р·РЅР°Рє РґРѕСЃС‚СѓРїР° Рє СЃС‚Р°СЂС‹Рј СЃРµРєС‚РѕСЂР°Рј.", pocket: true },
        scrapMap: { id: "scrapMap", name: "РЎС…РµРјР° С‚РѕРЅРЅРµР»РµР№", description: "РЎРјСЏС‚Р°СЏ РєР°СЂС‚Р° СЃ Р±РµР·РѕРїР°СЃРЅС‹РјРё РѕР±С…РѕРґР°РјРё.", pocket: true }
    };
    const QUEST_SCENES = {
        familyRelic: {
            start: {
                subtitle: "Р СћРЎР‚Р В°Р С”РЎвЂљР С‘РЎР‚РЎвЂ°Р С‘Р С” Р С—РЎР‚Р С•РЎРѓР С‘РЎвЂљ Р Р†Р ВµРЎР‚Р Р…РЎС“РЎвЂљРЎРЉ Р В·Р В°Р С—Р ВµРЎР‚РЎвЂљРЎС“РЎР‹ РЎв‚¬Р С”Р В°РЎвЂљРЎС“Р В»Р С”РЎС“",
                text: [
                    "Р СћРЎР‚Р В°Р С”РЎвЂљР С‘РЎР‚РЎвЂ°Р С‘Р С” Р С‘Р В· Р’В«Р РЋР ВµР Р†Р ВµРЎР‚Р Р…Р С•Р С–Р С• Р вЂ™Р ВµРЎвЂљРЎР‚Р В°Р’В» Р СР Р…Р ВµРЎвЂљ РЎвЂћР В°РЎР‚РЎвЂљРЎС“Р С” Р С‘ РЎв‚¬Р ВµР С—РЎвЂЎР ВµРЎвЂљ, РЎвЂЎРЎвЂљР С• РЎвЂћР В°Р СР С‘Р В»РЎРЉР Р…Р В°РЎРЏ РЎР‚Р ВµР В»Р С‘Р С”Р Р†Р С‘РЎРЏ РЎРѓР Р…Р С•Р Р†Р В° РЎС“РЎв‚¬Р В»Р В° Р Р…Р Вµ Р Р† РЎвЂљР Вµ РЎР‚РЎС“Р С”Р С‘.",
                    "Р вЂўРЎРѓР В»Р С‘ Р Р†Р ВµРЎР‚Р Р…Р ВµРЎв‚¬РЎРЉ РЎв‚¬Р С”Р В°РЎвЂљРЎС“Р В»Р С”РЎС“ Р В±Р ВµР В· Р В»Р С‘РЎв‚¬Р Р…Р ВµР С–Р С• РЎв‚¬РЎС“Р СР В°, Р В±РЎС“Р Т‘Р ВµРЎвЂљ Р Р…Р В°Р С–РЎР‚Р В°Р Т‘Р В°. Р вЂўРЎРѓР В»Р С‘ Р С—Р С•Р В»Р ВµР В·Р ВµРЎв‚¬РЎРЉ Р Р†Р Р…РЎС“РЎвЂљРЎР‚РЎРЉ РЎРѓР В°Р С, РЎР‚Р С‘РЎРѓР С” Р С‘ РЎвЂ¦Р С•Р В»Р С•Р Т‘ Р С•РЎРѓРЎвЂљР В°Р Р…РЎС“РЎвЂљРЎРѓРЎРЏ РЎРѓ РЎвЂљР С•Р В±Р С•Р в„–."
                ],
                tags: ["Р Т‘Р С•Р В»Р С–", "РЎвЂ¦Р С•Р В»Р С•Р Т‘", "РЎРѓР В»РЎС“РЎвЂ¦Р С‘"],
                choices: [
                    { id: "return-box", label: "Р вЂ™Р ВµРЎР‚Р Р…РЎС“РЎвЂљРЎРЉ РЎв‚¬Р С”Р В°РЎвЂљРЎС“Р В»Р С”РЎС“ РЎвЂљРЎР‚Р В°Р С”РЎвЂљР С‘РЎР‚РЎвЂ°Р С‘Р С”РЎС“", note: "Р вЂўРЎРѓР В»Р С‘ РЎв‚¬Р С”Р В°РЎвЂљРЎС“Р В»Р С”Р В° Р С—Р С•Р Т‘ РЎР‚РЎС“Р С”Р С•Р в„–.", requiresItem: "relicBox", consumeItem: "relicBox", rewardMoney: 38, successText: "Р Р€РЎРѓР С—Р ВµРЎвЂ¦. Р СћРЎР‚Р В°Р С”РЎвЂљР С‘РЎР‚РЎвЂ°Р С‘Р С” Р СР С•Р В»РЎвЂЎР В° Р С”Р С‘Р Р†Р В°Р ВµРЎвЂљ. +38РІвЂљР… Р С‘ Р Р…Р С•Р Р†Р В°РЎРЏ Р Р…Р В°Р Р†Р С•Р Т‘Р С”Р В° Р Р…Р В° РЎРѓР С”Р В»Р В°Р Т‘.", complete: true },
                    { id: "open-box", label: "Р вЂ™РЎРѓР С”РЎР‚РЎвЂ№РЎвЂљРЎРЉ РЎв‚¬Р С”Р В°РЎвЂљРЎС“Р В»Р С”РЎС“ Р СР С•Р Р…Р ВµРЎвЂљР С•Р в„–", note: "Р РЃР В°Р Р…РЎРѓ 50%.", chance: 0.5, successGoto: "opened", failText: "Р СџРЎР‚Р С•Р Р†Р В°Р В». Р вЂ”Р В°Р СР С•Р С” РЎвЂ¦РЎР‚РЎС“РЎРѓРЎвЂљР С‘РЎвЂљ РЎРѓР В»Р С‘РЎв‚¬Р С”Р С•Р С Р С–РЎР‚Р С•Р СР С”Р С•, РЎв‚¬РЎС“Р С Р С—Р С•Р Т‘Р Р…Р С‘Р СР В°Р ВµРЎвЂљРЎРѓРЎРЏ, -6РІвЂљР… Р Р…Р В° Р С•РЎвЂљР СРЎвЂ№РЎвЂЎР С”Р С‘.", penaltyMoney: 6 }
                ]
            },
            opened: {
                subtitle: "Р вЂ™Р Р…РЎС“РЎвЂљРЎР‚Р С‘ РЎРѓРЎвЂљРЎС“РЎвЂЎР С‘РЎвЂљ РЎвЂЎРЎвЂљР С•-РЎвЂљР С• Р СР ВµРЎвЂљР В°Р В»Р В»Р С‘РЎвЂЎР ВµРЎРѓР С”Р С•Р Вµ",
                text: [
                    "Р С™РЎР‚РЎвЂ№РЎв‚¬Р С”Р В° Р С—Р С•Р Т‘Р Т‘Р В°Р ВµРЎвЂљРЎРѓРЎРЏ, Р С‘ Р С‘Р В· Р В±Р В°РЎР‚РЎвЂ¦Р В°РЎвЂљР В° Р Р†РЎвЂ№Р С”Р В°РЎвЂљРЎвЂ№Р Р†Р В°Р ВµРЎвЂљРЎРѓРЎРЏ Р В»Р ВµР Т‘РЎРЏР Р…Р С•Р в„– Р В¶Р ВµРЎвЂљР С•Р Р…. Р СњР В° Р С•Р В±РЎР‚Р В°РЎвЂљР Р…Р С•Р в„– РЎРѓРЎвЂљР С•РЎР‚Р С•Р Р…Р Вµ Р Р†РЎвЂ№Р В±Р С‘РЎвЂљ Р Р…Р С•Р СР ВµРЎР‚ РЎРѓР С”Р В»Р В°Р Т‘Р В°.",
                    "Р СљР С•Р В¶Р Р…Р С• Р В·Р В°Р В±РЎР‚Р В°РЎвЂљРЎРЉ Р Р…Р В°РЎвЂ¦Р С•Р Т‘Р С”РЎС“ РЎРѓР ВµР В±Р Вµ Р С‘Р В»Р С‘ Р Р†РЎРѓР Вµ-РЎвЂљР В°Р С”Р С‘ Р С•РЎвЂљР Р…Р ВµРЎРѓРЎвЂљР С‘ Р ВµР Вµ РЎвЂ¦Р С•Р В·РЎРЏР С‘Р Р…РЎС“ Р С‘ РЎРѓРЎвЂ№Р С–РЎР‚Р В°РЎвЂљРЎРЉ Р Р† Р Т‘Р С•Р В»Р С–РЎС“РЎР‹."
                ],
                tags: ["РЎС“Р Т‘Р В°РЎвЂЎР В°", "Р В¶Р В°Р Т‘Р Р…Р С•РЎРѓРЎвЂљРЎРЉ", "РЎвЂљР С‘РЎвЂ¦Р С‘Р в„– РЎРѓР С”РЎР‚Р С‘Р С—"],
                choices: [
                    { id: "keep-token", label: "Р вЂ”Р В°Р В±РЎР‚Р В°РЎвЂљРЎРЉ Р В¶Р ВµРЎвЂљР С•Р Р… РЎРѓР ВµР В±Р Вµ", note: "Р СџР С•Р В»РЎС“РЎвЂЎР С‘РЎв‚¬РЎРЉ Р Р…Р С•Р Р†РЎвЂ№Р в„– Р С—РЎР‚Р ВµР Т‘Р СР ВµРЎвЂљ Р С‘ Р Р…Р ВµР СР Р…Р С•Р С–Р С• Р Т‘Р ВµР Р…Р ВµР С–.", rewardMoney: 12, rewardItem: "iceToken", successText: "Р СњР В°РЎвЂ¦Р С•Р Т‘Р С”Р В°. +12РІвЂљР… Р С‘ Р В»Р ВµР Т‘РЎРЏР Р…Р С•Р в„– Р В¶Р ВµРЎвЂљР С•Р Р… РЎС“РЎвЂ¦Р С•Р Т‘Р С‘РЎвЂљ Р Р† Р С”Р В°РЎР‚Р СР В°Р Р….", complete: true },
                    { id: "bring-token", label: "Р С›РЎвЂљР Р…Р ВµРЎРѓРЎвЂљР С‘ Р Р…Р В°РЎвЂ¦Р С•Р Т‘Р С”РЎС“ РЎвЂљРЎР‚Р В°Р С”РЎвЂљР С‘РЎР‚РЎвЂ°Р С‘Р С”РЎС“", note: "Р СљР ВµР Р…РЎРЉРЎв‚¬Р Вµ РЎР‚Р С‘РЎРѓР С”Р В°, Р В±Р С•Р В»РЎРЉРЎв‚¬Р Вµ Р Т‘Р С•Р Р†Р ВµРЎР‚Р С‘РЎРЏ.", rewardMoney: 26, successText: "Р Р€РЎРѓР С—Р ВµРЎвЂ¦. Р СћРЎР‚Р В°Р С”РЎвЂљР С‘РЎР‚РЎвЂ°Р С‘Р С” Р Р†РЎвЂ№Р Т‘Р В°Р ВµРЎвЂљ +26РІвЂљР… Р С‘ Р С•Р В±Р ВµРЎвЂ°Р В°Р ВµРЎвЂљ Р С—Р С•Р СР Р…Р С‘РЎвЂљРЎРЉ РЎС“РЎРѓР В»РЎС“Р С–РЎС“.", complete: true }
                ]
            }
        },
        brassDisease: {
            start: {
                subtitle: "Р СљР ВµРЎвЂ¦Р В°Р Р…Р С‘Р С” Р С—РЎР‚Р С•РЎРѓР С‘РЎвЂљ Р С—РЎР‚Р С‘Р Р…Р ВµРЎРѓРЎвЂљР С‘ РЎв‚¬Р ВµРЎРѓРЎвЂљР ВµРЎР‚Р Р…РЎР‹",
                text: [
                    "Р СљР ВµРЎвЂ¦Р В°Р Р…Р С‘Р С” РЎвЂљРЎР‚Р ВµРЎвЂљ Р С—Р В°Р В»РЎРЉРЎвЂ Р В°Р СР С‘ Р В»Р В°РЎвЂљРЎС“Р Р…Р Р…РЎС“РЎР‹ Р С—РЎвЂ№Р В»РЎРЉ. Р вЂўР С–Р С• Р В°Р Р†РЎвЂљР С•Р СР В°РЎвЂљ РЎвЂ°Р ВµР В»Р С”Р В°Р ВµРЎвЂљ Р С‘ Р С–Р В»Р С•РЎвЂ¦Р Р…Р ВµРЎвЂљ.",
                    "Р СџРЎР‚Р С‘Р Р…Р ВµРЎРѓР С‘ РЎв‚¬Р ВµРЎРѓРЎвЂљР ВµРЎР‚Р Р…РЎР‹. Р ВР В»Р С‘ Р Р…Р В°Р в„–Р Т‘Р С‘, РЎвЂЎР ВµР С Р В·Р В°Р СР ВµР Р…Р С‘РЎвЂљРЎРЉ. Р СћРЎС“РЎвЂљ Р Р†Р В°Р В¶Р Р…РЎвЂ№ Р С—РЎР‚Р ВµР Т‘Р СР ВµРЎвЂљРЎвЂ№, РЎР‚Р С‘РЎРѓР С” Р С‘ Р В±РЎвЂ№РЎРѓРЎвЂљРЎР‚РЎвЂ№Р Вµ РЎР‚Р ВµРЎв‚¬Р ВµР Р…Р С‘РЎРЏ."
                ],
                tags: ["РЎР‚Р С‘РЎРѓР С”", "РЎв‚¬РЎС“Р С", "Р В»Р В°РЎвЂљРЎС“Р Р…РЎРЉ"],
                choices: [
                    { id: "give-gear", label: "Р С›РЎвЂљР Т‘Р В°РЎвЂљРЎРЉ РЎв‚¬Р ВµРЎРѓРЎвЂљР ВµРЎР‚Р Р…РЎР‹", note: "Р вЂўРЎРѓР В»Р С‘ Р ВµРЎРѓРЎвЂљРЎРЉ Р В»Р В°РЎвЂљРЎС“Р Р…Р Р…Р В°РЎРЏ РЎв‚¬Р ВµРЎРѓРЎвЂљР ВµРЎР‚Р Р…РЎРЏ.", requiresItem: "brassGear", consumeItem: "brassGear", rewardMoney: 27, successText: "Р Р€РЎРѓР С—Р ВµРЎвЂ¦. Р С’Р Р†РЎвЂљР С•Р СР В°РЎвЂљ Р С•Р В¶Р С‘Р Р†Р В°Р ВµРЎвЂљ, Р В° Р СР В°РЎРѓРЎвЂљР ВµРЎР‚РЎРѓР С”Р В°РЎРЏ Р С—Р В»Р В°РЎвЂљР С‘РЎвЂљ +27РІвЂљР….", complete: true },
                    { id: "coin-fix", label: "Р СџР С•Р С—РЎР‚Р С•Р В±Р С•Р Р†Р В°РЎвЂљРЎРЉ Р’В«Р С”Р С•Р В»РЎвЂ¦Р С•Р В·Р’В» Р С‘Р В· Р СР С•Р Р…Р ВµРЎвЂљРЎвЂ№", note: "Р РЃР В°Р Р…РЎРѓ 50%.", chance: 0.5, successGoto: "jury-rigged", failText: "Р СџРЎР‚Р С•Р Р†Р В°Р В». Р ВРЎРѓР С”РЎР‚Р В° РЎР‚Р ВµР В¶Р ВµРЎвЂљ Р С—Р В°Р В»РЎРЉРЎвЂ РЎвЂ№, Р СР ВµРЎвЂ¦Р В°Р Р…Р С‘Р В·Р С Р С—Р В»РЎР‹Р ВµРЎвЂљРЎРѓРЎРЏ, -8РІвЂљР… Р Р…Р В° Р В±Р С‘Р Р…РЎвЂљРЎвЂ№.", penaltyMoney: 8 }
                ]
            },
            "jury-rigged": {
                subtitle: "Р СљР С•Р Р…Р ВµРЎвЂљР В° Р Т‘Р ВµРЎР‚Р В¶Р С‘РЎвЂљ Р В·РЎС“Р В±РЎвЂ РЎвЂ№ Р Р…Р В° РЎвЂЎР ВµРЎРѓРЎвЂљР Р…Р С•Р С РЎРѓР В»Р С•Р Р†Р Вµ",
                text: [
                    "Р РЋР В°Р СР С•Р Т‘Р ВµР В»РЎРЉР Р…Р В°РЎРЏ Р Р†РЎРѓРЎвЂљР В°Р Р†Р С”Р В° Р Р…Р ВµР С•Р В¶Р С‘Р Т‘Р В°Р Р…Р Р…Р С• РЎвЂ Р ВµР С—Р В»РЎРЏР ВµРЎвЂљ Р Р†Р В°Р В». Р СљР В°РЎв‚¬Р С‘Р Р…Р В° Р С”Р В°РЎв‚¬Р В»РЎРЏР ВµРЎвЂљ, Р Р…Р С• Р В·Р В°Р Р†Р С•Р Т‘Р С‘РЎвЂљРЎРѓРЎРЏ.",
                    "Р СљР ВµРЎвЂ¦Р В°Р Р…Р С‘Р С” Р СР С•Р В¶Р ВµРЎвЂљ Р С•РЎРѓРЎвЂљР В°Р Р†Р С‘РЎвЂљРЎРЉ РЎвЂљР ВµР В±РЎРЏ Р Р† Р Т‘Р С•Р В»Р С–РЎС“ Р С‘Р В»Р С‘ Р С•РЎвЂљРЎРѓРЎвЂ№Р С—Р В°РЎвЂљРЎРЉ Р СР ВµР В»Р С•РЎвЂЎР С‘ РЎРѓРЎР‚Р В°Р В·РЎС“."
                ],
                tags: ["РЎС“Р Т‘Р В°РЎвЂЎР В°", "Р С–РЎР‚РЎРЏР В·Р Р…Р В°РЎРЏ РЎР‚Р В°Р В±Р С•РЎвЂљР В°", "РЎвЂљР ВµР С—Р В»РЎвЂ№Р в„– Р СР ВµРЎвЂљР В°Р В»Р В»"],
                choices: [
                    { id: "take-cash", label: "Р вЂ™Р В·РЎРЏРЎвЂљРЎРЉ Р С•Р С—Р В»Р В°РЎвЂљРЎС“ РЎРѓРЎР‚Р В°Р В·РЎС“", note: "Р СњР ВµР В±Р С•Р В»РЎРЉРЎв‚¬Р В°РЎРЏ, Р Р…Р С• Р В±РЎвЂ№РЎРѓРЎвЂљРЎР‚Р В°РЎРЏ Р Р…Р В°Р С–РЎР‚Р В°Р Т‘Р В°.", rewardMoney: 18, successText: "Р СњР В°РЎвЂ¦Р С•Р Т‘Р С”Р В° Р Р† Р В»Р В°Р Т‘Р С•Р Р…Р С‘: +18РІвЂљР… Р В·Р В° Р В±РЎвЂ№РЎРѓРЎвЂљРЎР‚РЎвЂ№Р в„– РЎР‚Р ВµР СР С•Р Р…РЎвЂљ.", complete: true },
                    { id: "ask-favor", label: "Р СџР С•Р С—РЎР‚Р С•РЎРѓР С‘РЎвЂљРЎРЉ РЎС“РЎРѓР В»РЎС“Р С–РЎС“ Р С—Р С•Р В·Р В¶Р Вµ", note: "Р СљР В°РЎРѓРЎвЂљР ВµРЎР‚РЎРѓР С”Р В°РЎРЏ Р С•РЎвЂљР Т‘Р В°Р ВµРЎвЂљ Р С”Р В°РЎР‚РЎвЂљРЎС“ Р В»РЎРЉР Т‘Р В°.", rewardItem: "scrapMap", successText: "Р Р€РЎРѓР С—Р ВµРЎвЂ¦. Р вЂ™Р СР ВµРЎРѓРЎвЂљР С• Р Т‘Р ВµР Р…Р ВµР С– РЎвЂљРЎвЂ№ Р С—Р С•Р В»РЎС“РЎвЂЎР В°Р ВµРЎв‚¬РЎРЉ Р СРЎРЏРЎвЂљРЎС“РЎР‹ Р С”Р В°РЎР‚РЎвЂљРЎС“ Р В»РЎРЉР Т‘Р В°.", complete: true }
                ]
            }
        },
        signalE3: {
            start: {
                subtitle: "Р СњР В° Р В»РЎРЉР Т‘РЎС“ Р СР С‘Р С–Р В°Р ВµРЎвЂљ РЎРѓРЎвЂљР В°РЎР‚РЎвЂ№Р в„– Р СР В°РЎРЏР С”",
                text: [
                    "Р РЋР С‘Р С–Р Р…Р В°Р В» E3 Р С—РЎР‚Р С•РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљРЎРѓРЎРЏ РЎвЂЎР ВµРЎР‚Р ВµР В· Р Р†Р ВµРЎвЂљР ВµРЎР‚ Р С”Р С•РЎР‚Р С•РЎвЂљР С”Р С‘Р СР С‘ РЎР‚РЎвЂ№Р Р†Р С”Р В°Р СР С‘. Р вЂњР Т‘Р Вµ-РЎвЂљР С• Р Р†Р С—Р ВµРЎР‚Р ВµР Т‘Р С‘ Р В»Р ВµР В¶Р С‘РЎвЂљ Р С”Р С•Р Р…РЎвЂљР ВµР в„–Р Р…Р ВµРЎР‚ Р С‘Р В»Р С‘ РЎвЂЎРЎРЉРЎРЏ-РЎвЂљР С• Р В»Р С•Р Р†РЎС“РЎв‚¬Р С”Р В°.",
                    "Р СљР С•Р В¶Р Р…Р С• Р С‘Р Т‘РЎвЂљР С‘ Р С—РЎР‚РЎРЏР СР С• Р Р…Р В° РЎв‚¬РЎС“Р С Р С‘Р В»Р С‘ Р С—РЎР‚Р С‘Р С–Р В»РЎС“РЎв‚¬Р С‘РЎвЂљРЎРЉ РЎв‚¬Р В°Р С– Р В°Р С—РЎвЂљР ВµРЎвЂЎР С”Р С•Р в„– Р С‘ РЎРѓР Т‘Р ВµР В»Р В°РЎвЂљРЎРЉ Р Р†Р С‘Р Т‘, РЎвЂЎРЎвЂљР С• Р Р†РЎРѓР Вµ Р С—Р С•Р Т‘ Р С”Р С•Р Р…РЎвЂљРЎР‚Р С•Р В»Р ВµР С."
                ],
                tags: ["РЎвЂ¦Р С•Р В»Р С•Р Т‘", "РЎР‚Р С‘РЎРѓР С”", "РЎв‚¬Р В°Р Р…РЎРѓ"],
                choices: [
                    { id: "go-straight", label: "Р ВР Т‘РЎвЂљР С‘ Р Р…Р В° РЎРѓР В»Р В°Р В±РЎвЂ№Р в„– РЎРѓР С‘Р С–Р Р…Р В°Р В»", note: "Р РЃР В°Р Р…РЎРѓ 65%.", chance: 0.65, successText: "Р СњР В°РЎвЂ¦Р С•Р Т‘Р С”Р В°. Р СџР С•Р Т‘ РЎРѓР Р…Р ВµР С–Р С•Р С Р С”Р С•Р Р…РЎвЂљР ВµР в„–Р Р…Р ВµРЎР‚. Р Р€РЎРѓР С—Р ВµРЎвЂ¦ Р С‘ +34РІвЂљР….", failText: "Р СџРЎР‚Р С•Р Р†Р В°Р В». Р РЋР С‘Р С–Р Р…Р В°Р В» РЎС“Р Р†Р С•Р Т‘Р С‘РЎвЂљ Р Р† Р С—РЎС“РЎРѓРЎвЂљР С•Р в„– Р С”Р В°РЎР‚Р СР В°Р Р… Р В»РЎРЉР Т‘Р В°, -5РІвЂљР… Р Р…Р В° Р Т‘Р С•РЎР‚Р С•Р С–РЎС“ Р С•Р В±РЎР‚Р В°РЎвЂљР Р…Р С•.", rewardMoney: 34, penaltyMoney: 5, complete: true },
                    { id: "dash-gap", label: "Р В Р Р†Р В°Р Р…РЎС“РЎвЂљРЎРЉ РЎвЂЎР ВµРЎР‚Р ВµР В· Р С•РЎвЂљР С”РЎР‚РЎвЂ№РЎвЂљРЎвЂ№Р в„– Р В»РЎвЂР Т‘", note: "Р СњРЎС“Р В¶Р Р…Р В° РЎР‚Р ВµР В°Р С”РЎвЂ Р С‘РЎРЏ 1.", requiresStat: "reaction", requiresStatValue: 1, rewardMoney: 16, successText: "Р В Р ВµР В°Р С”РЎвЂ Р С‘РЎРЏ РЎРѓР С—Р В°РЎРѓР В°Р ВµРЎвЂљ РЎвЂљР ВµР СР С—. Р СћРЎвЂ№ РЎС“РЎРѓР С—Р ВµР Р†Р В°Р ВµРЎв‚¬РЎРЉ Р С” РЎРЏРЎвЂ°Р С‘Р С”РЎС“ Р С‘ Р В·Р В°Р В±Р С‘РЎР‚Р В°Р ВµРЎв‚¬РЎРЉ +16РІвЂљР….", complete: true },
                    { id: "quiet-steps", label: "Р СџР С•Р Т‘Р В°Р Р†Р С‘РЎвЂљРЎРЉ РЎв‚¬РЎС“Р С Р В°Р С—РЎвЂљР ВµРЎвЂЎР С”Р С•Р в„–", note: "Р вЂўРЎРѓР В»Р С‘ Р В°Р С—РЎвЂљР ВµРЎвЂЎР С”Р В° Р С—Р С•Р Т‘ РЎР‚РЎС“Р С”Р С•Р в„–.", requiresItem: "medkit", consumeItem: "medkit", successGoto: "quiet-route" }
                ]
            },
            "quiet-route": {
                subtitle: "Р РЋР Р…Р ВµР С– Р Р†Р ВµР Т‘Р ВµРЎвЂљ Р С” РЎРѓРЎвЂљР В°РЎР‚Р С•Р СРЎС“ Р С”Р В°Р В±Р ВµР В»РЎР‹",
                text: [
                    "Р РЋРЎвЂљР С‘Р С Р С–РЎР‚Р ВµР ВµРЎвЂљ РЎР‚Р ВµР В±РЎР‚Р В°, РЎв‚¬Р В°Р С– РЎРѓРЎвЂљР В°Р Р…Р С•Р Р†Р С‘РЎвЂљРЎРѓРЎРЏ РЎР‚Р С•Р Р†Р Р…Р ВµР Вµ. Р СџР С•Р Т‘ Р С”Р С•РЎР‚Р С”Р С•Р в„– Р В»РЎРЉР Т‘Р В° Р Р†Р С‘Р Т‘Р ВµР Р… Р С”Р В°Р В±Р ВµР В»РЎРЉ, РЎС“РЎвЂ¦Р С•Р Т‘РЎРЏРЎвЂ°Р С‘Р в„– Р С” РЎРѓР В»РЎС“Р В¶Р ВµР В±Р Р…Р С•Р СРЎС“ Р В»РЎР‹Р С”РЎС“.",
                    "Р вЂєРЎР‹Р С” Р СР С•Р В¶Р Р…Р С• Р Р†РЎРѓР С”РЎР‚РЎвЂ№РЎвЂљРЎРЉ РЎРѓР В°Р СР С•Р СРЎС“ Р С‘Р В»Р С‘ Р С—РЎР‚Р С•РЎРѓРЎвЂљР С• РЎРѓР Р…РЎРЏРЎвЂљРЎРЉ Р С—Р С•Р С”Р В°Р В·Р В°Р Р…Р С‘РЎРЏ Р С‘ РЎС“Р в„–РЎвЂљР С‘ Р В±Р ВµР В· РЎв‚¬РЎС“Р СР В°."
                ],
                tags: ["РЎС“Р Т‘Р В°РЎвЂЎР В°", "РЎвЂљР С‘РЎв‚¬Р С‘Р Р…Р В°", "Р В»Р ВµР Т‘РЎРЏР Р…Р С•Р в„– Р С—Р В°РЎР‚"],
                choices: [
                    { id: "open-hatch", label: "Р вЂ™РЎРѓР С”РЎР‚РЎвЂ№РЎвЂљРЎРЉ Р В»РЎР‹Р С”", note: "Р СџР С•Р В»РЎС“РЎвЂЎР С‘РЎв‚¬РЎРЉ Р С”Р В°РЎР‚РЎвЂљРЎС“ Р С‘ Р Т‘Р ВµР Р…РЎРЉР С–Р С‘.", rewardMoney: 20, rewardItem: "scrapMap", successText: "Р Р€РЎРѓР С—Р ВµРЎвЂ¦. Р вЂ™Р Р…РЎС“РЎвЂљРЎР‚Р С‘ Р С”Р В°РЎР‚РЎвЂљР В° Р В»РЎРЉР Т‘Р В° Р С‘ +20РІвЂљР… Р В·Р В° РЎРѓРЎвЂљР В°РЎР‚РЎвЂ№Р Вµ Р В¶Р ВµРЎвЂљР С•Р Р…РЎвЂ№.", complete: true },
                    { id: "leave-mark", label: "Р РЋР Р…РЎРЏРЎвЂљРЎРЉ Р С—Р С•Р С”Р В°Р В·Р В°Р Р…Р С‘РЎРЏ Р С‘ РЎС“Р в„–РЎвЂљР С‘", note: "Р В§РЎС“РЎвЂљРЎРЉ Р СР ВµР Р…РЎРЉРЎв‚¬Р Вµ Р Р…Р В°Р С–РЎР‚Р В°Р Т‘РЎвЂ№, Р СР ВµР Р…РЎРЉРЎв‚¬Р Вµ РЎв‚¬РЎС“Р СР В°.", rewardMoney: 14, successText: "Р РЋР С—Р С•Р С”Р С•Р в„–Р Р…Р В°РЎРЏ Р Р…Р В°РЎвЂ¦Р С•Р Т‘Р С”Р В°. +14РІвЂљР… Р С‘ Р С—Р С•РЎвЂЎРЎвЂљР С‘ Р Р…Р С‘Р С”Р В°Р С”Р С•Р С–Р С• РЎв‚¬РЎС“Р СР В°.", complete: true }
                ]
            }
        },
        frostDebt: {
            start: {
                subtitle: "Р СњР В° Р Т‘Р Р†Р ВµРЎР‚Р С‘ РЎРѓР С”Р В»Р В°Р Т‘Р В° Р Р†Р С‘РЎРѓР С‘РЎвЂљ РЎРѓР Р†Р ВµР В¶Р В°РЎРЏ Р СР ВµРЎвЂљР С”Р В°",
                text: [
                    "Р С™РЎвЂљР С•-РЎвЂљР С• Р С•РЎРѓРЎвЂљР В°Р Р†Р С‘Р В» Р Р…Р В° Р Т‘Р Р†Р ВµРЎР‚Р С‘ РЎРѓР С”Р В»Р В°Р Т‘Р В° РЎР‚Р В¶Р В°Р Р†РЎвЂ№Р в„– Р С–Р Р†Р С•Р В·Р Т‘РЎРЉ РЎРѓ Р В·Р В°Р С—Р С‘РЎРѓР С”Р С•Р в„–: Р’В«Р вЂўРЎРѓР В»Р С‘ РЎРѓР В»РЎвЂ№РЎв‚¬Р С‘РЎв‚¬РЎРЉ РЎРѓР С”РЎР‚Р С‘Р С—, РЎвЂљРЎвЂ№ РЎС“Р В¶Р Вµ Р С•Р С—Р С•Р В·Р Т‘Р В°Р В»Р’В».",
                    "Р СљР С•Р В¶Р Р…Р С• РЎРѓРЎС“Р Р…РЎС“РЎвЂљРЎРЉРЎРѓРЎРЏ Р Р†Р Р…РЎС“РЎвЂљРЎР‚РЎРЉ РЎРѓРЎР‚Р В°Р В·РЎС“ Р С‘Р В»Р С‘ Р С—Р ВµРЎР‚Р ВµР В¶Р Т‘Р В°РЎвЂљРЎРЉ, Р С—Р С•Р С”Р В° Р Р†Р ВµРЎвЂљР ВµРЎР‚ РЎРѓРЎР‰Р ВµРЎРѓРЎвЂљ РЎРѓР В»Р ВµР Т‘РЎвЂ№."
                ],
                tags: ["РЎРѓР В»РЎС“РЎвЂ¦Р С‘", "Р СР С•РЎР‚Р С•Р В·", "Р Р…Р ВµРЎС“Р Р†Р ВµРЎР‚Р ВµР Р…Р Р…Р С•РЎРѓРЎвЂљРЎРЉ"],
                choices: [
                    { id: "rush-in", label: "Р вЂ”Р В°Р в„–РЎвЂљР С‘ РЎРѓРЎР‚Р В°Р В·РЎС“", note: "Р РЃР В°Р Р…РЎРѓ 45%.", chance: 0.45, rewardMoney: 29, failText: "Р СџРЎР‚Р С•Р Р†Р В°Р В». Р вЂ™Р Р…РЎС“РЎвЂљРЎР‚Р С‘ Р С—РЎС“РЎРѓРЎвЂљР С•, Р В° Р Т‘Р С•Р В»Р С– РЎвЂљР С•Р В»РЎРЉР С”Р С• РЎР‚Р В°РЎРѓРЎвЂљР ВµРЎвЂљ. -7РІвЂљР….", penaltyMoney: 7, successText: "Р Р€РЎРѓР С—Р ВµРЎвЂ¦. Р вЂ™ РЎС“Р С–Р В»РЎС“ Р В»Р ВµР В¶Р С‘РЎвЂљ РЎвЂЎРЎС“Р В¶Р С•Р в„– РЎвЂљР В°Р в„–Р Р…Р С‘Р С”. +29РІвЂљР….", complete: true },
                    { id: "break-door", label: "Р вЂ™РЎвЂ№Р В»Р С•Р СР В°РЎвЂљРЎРЉ Р Т‘Р Р†Р ВµРЎР‚РЎРЉ РЎРѓР С‘Р В»Р С•Р в„–", note: "Р СњРЎС“Р В¶Р Р…Р В° РЎРѓР С‘Р В»Р В° 1.", requiresStat: "strength", requiresStatValue: 1, rewardMoney: 24, successText: "Р РЋР С‘Р В»Р В° РЎР‚Р ВµРЎв‚¬Р В°Р ВµРЎвЂљ Р Р†Р С•Р С—РЎР‚Р С•РЎРѓ Р В±РЎвЂ№РЎРѓРЎвЂљРЎР‚Р С•. Р вЂќР Р†Р ВµРЎР‚РЎРЉ РЎРѓР Т‘Р В°РЎвЂРЎвЂљРЎРѓРЎРЏ, Р В° Р Р† РЎвЂљР В°Р в„–Р Р…Р С‘Р С”Р Вµ Р В»Р ВµР В¶Р В°РЎвЂљ +24РІвЂљР….", complete: true },
                    { id: "find-key", label: "Р С›РЎРѓР СР С•РЎвЂљРЎР‚Р ВµРЎвЂљРЎРЉ Р СР ВµРЎвЂљР С”РЎС“ Р С‘ Р Р…Р В°Р в„–РЎвЂљР С‘ Р С”Р В»РЎР‹РЎвЂЎ", note: "Р СњРЎС“Р В¶Р ВµР Р… Р В°Р Р…Р В°Р В»Р С‘Р В· 1.", requiresStat: "analysis", requiresStatValue: 1, rewardItem: "iceToken", successText: "Р С’Р Р…Р В°Р В»Р С‘Р В· РЎвЂ Р ВµР С—Р В»РЎРЏР ВµРЎвЂљ Р СР ВµР В»Р С•РЎвЂЎРЎРЉ Р Р…Р В° Р С”Р С•РЎРѓРЎРЏР С”Р Вµ. Р РЋР С—РЎР‚РЎРЏРЎвЂљР В°Р Р…Р Р…РЎвЂ№Р в„– Р С”Р В»РЎР‹РЎвЂЎ Р Р†Р ВµР Т‘Р ВµРЎвЂљ Р С” Р В¶Р ВµРЎвЂљР С•Р Р…РЎС“.", complete: true },
                    { id: "wait-out", label: "Р СџР ВµРЎР‚Р ВµР В¶Р Т‘Р В°РЎвЂљРЎРЉ Р Р†Р ВµРЎвЂљР ВµРЎР‚", note: "Р вЂР ВµР В·Р С•Р С—Р В°РЎРѓР Р…Р ВµР Вµ, Р Р…Р С• Р СР ВµР Т‘Р В»Р ВµР Р…Р Р…Р ВµР Вµ.", rewardMoney: 11, successText: "Р РЋР С—Р С•Р С”Р С•Р в„–Р Р…РЎвЂ№Р в„– РЎвЂ¦Р С•Р Т‘. Р вЂ™Р ВµРЎвЂљР ВµРЎР‚ РЎС“Р Р…Р С•РЎРѓР С‘РЎвЂљ РЎв‚¬РЎС“Р С, Р С‘ РЎвЂљРЎвЂ№ Р В·Р В°Р В±Р С‘РЎР‚Р В°Р ВµРЎв‚¬РЎРЉ +11РІвЂљР….", complete: true }
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
        { id: "weapon", title: "Р С›РЎР‚РЎС“Р В¶Р ВµР в„–Р Р…Р В°РЎРЏ", hint: "Р вЂќР В°РЎвЂРЎвЂљ Р В±Р С•Р Р…РЎС“РЎРѓ Р С” РЎвЂљР С•РЎвЂЎР Р…Р С•РЎРѓРЎвЂљР С‘ Р С‘Р В»Р С‘ РЎС“РЎР‚Р С•Р Р…РЎС“." },
        { id: "defense", title: "Р вЂ”Р В°РЎвЂ°Р С‘РЎвЂљР Р…Р В°РЎРЏ", hint: "Р РЋР Р…Р С‘Р В¶Р В°Р ВµРЎвЂљ Р Р†РЎвЂ¦Р С•Р Т‘РЎРЏРЎвЂ°Р С‘Р в„– РЎС“РЎР‚Р С•Р Р… Р С‘ РЎС“РЎРѓР С‘Р В»Р С‘Р Р†Р В°Р ВµРЎвЂљ Р Р†РЎвЂ№Р В¶Р С‘Р Р†Р В°Р Р…Р С‘Р Вµ." },
        { id: "support", title: "Р вЂ™РЎРѓР С—Р С•Р СР С•Р С–Р В°РЎвЂљР ВµР В»РЎРЉР Р…Р В°РЎРЏ", hint: "Р вЂќР В°РЎвЂРЎвЂљ РЎС“Р Р†Р С•РЎР‚Р С•РЎвЂљ, РЎР‚Р ВµР С–Р ВµР Р… Р С‘Р В»Р С‘ РЎвЂљР В°Р С”РЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С‘Р в„– Р В±Р С•Р Р…РЎС“РЎРѓ." }
    ];
    const AUGMENT_LIBRARY = {
        weaponBrassSights: {
            id: "weaponBrassSights",
            slot: "weapon",
            name: "Р вЂєР В°РЎвЂљРЎС“Р Р…Р Р…РЎвЂ№Р в„– Р С—РЎР‚Р С‘РЎвЂ Р ВµР В»",
            description: "Р СћР ВµР С—Р В»Р В°РЎРЏ Р СРЎС“РЎв‚¬Р С”Р В° Р Р…Р Вµ Р С–РЎС“Р В»РЎРЏР ВµРЎвЂљ Р Р…Р В° Р СР С•РЎР‚Р С•Р В·Р Вµ Р С‘ Р Т‘Р ВµРЎР‚Р В¶Р С‘РЎвЂљ Р В»Р С‘Р Р…Р С‘РЎР‹ РЎР‚Р С•Р Р†Р Р…Р ВµР Вµ.",
            effectLabel: "-8% Р С” РЎв‚¬Р В°Р Р…РЎРѓРЎС“ Р В±Р В»Р С•Р С”Р В° РЎвЂ°Р С‘РЎвЂљР С•Р С",
            hitChanceBonus: 0.08,
            weapons: ["PISTOLS", "RIFLE"]
        },
        weaponDoubleTap: {
            id: "weaponDoubleTap",
            slot: "weapon",
            name: "Р Р€РЎРѓР С‘Р В»Р ВµР Р…Р Р…РЎвЂ№Р в„– РЎС“Р Т‘Р В°РЎР‚Р Р…Р С‘Р С”",
            description: "Р СџР В»Р С•РЎвЂљР Р…РЎвЂ№Р в„– РЎС“Р Т‘Р В°РЎР‚ Р Т‘Р ВµР В»Р В°Р ВµРЎвЂљ Р С—Р С‘РЎРѓРЎвЂљР С•Р В»РЎРЉ Р В·Р В»Р ВµР Вµ Р Р† Р С—РЎР‚РЎРЏР СР С•Р в„– Р В»Р С‘Р Р…Р С‘Р С‘.",
            effectLabel: "+4 РЎС“РЎР‚Р С•Р Р…Р В° Р Т‘Р В»РЎРЏ Р С—Р С‘РЎРѓРЎвЂљР С•Р В»РЎРЏ",
            damageBonus: 4,
            weapons: ["PISTOLS"]
        },
        weaponPiercingCore: {
            id: "weaponPiercingCore",
            slot: "weapon",
            name: "Р вЂРЎР‚Р С•Р Р…Р ВµР В±Р С•Р в„–Р Р…РЎвЂ№Р в„– РЎРѓР ВµРЎР‚Р Т‘Р ВµРЎвЂЎР Р…Р С‘Р С”",
            description: "Р СџРЎР‚Р С•РЎв‚¬Р С‘Р Р†Р В°Р ВµРЎвЂљ РЎвЂ°Р С‘РЎвЂљР С•Р Р†Р С•Р в„– Р В±Р В»Р С•Р С” Р С‘ Р Т‘Р В°Р Р†Р С‘РЎвЂљ Р В»Р С‘Р Р…Р С‘РЎР‹ Р Р…Р В°Р С—РЎР‚Р С•Р В»Р С•Р С.",
            effectLabel: "Р ВР С–Р Р…Р С•РЎР‚Р С‘РЎР‚РЎС“Р ВµРЎвЂљ Р В±Р В»Р С•Р С”Р С‘РЎР‚Р С•Р Р†Р В°Р Р…Р С‘Р Вµ РЎвЂ°Р С‘РЎвЂљР С•Р С",
            ignoreBlocking: true,
            weapons: ["PISTOLS", "RIFLE", "SHOTGUN"]
        },
        weaponScatterNozzle: {
            id: "weaponScatterNozzle",
            slot: "weapon",
            name: "Р В Р В°РЎРѓРЎв‚¬Р С‘РЎР‚Р С‘РЎвЂљР ВµР В»РЎРЉ Р Т‘РЎР‚Р С•Р В±Р С‘",
            description: "Р вЂќРЎР‚Р С•Р В±Р С•Р Р†Р С‘Р С” РЎвЂ Р ВµР С—Р В»РЎРЏР ВµРЎвЂљ Р С—Р С• Р С”РЎР‚Р В°РЎР‹ РЎвЂЎР В°РЎвЂ°Р Вµ, Р С•РЎРѓР С•Р В±Р ВµР Р…Р Р…Р С• Р Р…Р В° Р В±Р В»Р С‘Р В¶Р Р…Р ВµР в„– Р В»Р С‘Р Р…Р С‘Р С‘.",
            effectLabel: "+12% Р С” РЎв‚¬Р В°Р Р…РЎРѓРЎС“ Р В·Р В°РЎвЂ Р ВµР С—Р В° Р Т‘РЎР‚Р С•Р В±Р С•Р Р†Р С‘Р С”Р В°",
            grazeChanceBonus: 0.12,
            weapons: ["SHOTGUN"]
        },
        defensePlating: {
            id: "defensePlating",
            slot: "defense",
            name: "Р вЂєР В°РЎвЂљРЎС“Р Р…Р Р…РЎвЂ№Р Вµ Р С—Р В»Р В°РЎРѓРЎвЂљР С‘Р Р…РЎвЂ№",
            description: "Р РЋРЎвЂљР В°Р Р†Р С”Р В° Р Р…Р В° Р СР В°РЎРѓРЎРѓРЎС“: Р В±РЎР‚Р С•Р Р…РЎРЏ Р С–Р В°РЎРѓР С‘РЎвЂљ РЎвЂЎР В°РЎРѓРЎвЂљРЎРЉ Р С—РЎР‚РЎРЏР СР С•Р С–Р С• Р С—Р С•Р С—Р В°Р Т‘Р В°Р Р…Р С‘РЎРЏ.",
            effectLabel: "-4 Р Р†РЎвЂ¦Р С•Р Т‘РЎРЏРЎвЂ°Р ВµР С–Р С• РЎС“РЎР‚Р С•Р Р…Р В°",
            damageReduction: 4
        },
        defenseHeatSink: {
            id: "defenseHeatSink",
            slot: "defense",
            name: "Р СћР ВµР С—Р В»Р С•Р С•РЎвЂљР Р†Р С•Р Т‘",
            description: "Р СџР ВµРЎР‚Р ВµР Р…Р С•РЎРѓР С‘РЎвЂљ Р В¶Р В°РЎР‚ Р С—Р С•Р Т‘ Р С”РЎС“РЎР‚РЎвЂљР С”РЎС“ Р С‘ Р Т‘Р В°РЎвЂРЎвЂљ Р Т‘Р ВµРЎР‚Р В¶Р В°РЎвЂљРЎРЉ Р Т‘Р В»Р С‘Р Р…Р Р…РЎвЂ№Р в„– Р В±Р С•Р в„–.",
            effectLabel: "+10 РЎРѓРЎвЂљР В°РЎР‚РЎвЂљР С•Р Р†Р С•Р С–Р С• HP",
            startHpBonus: 10
        },
        defenseColdMesh: {
            id: "defenseColdMesh",
            slot: "defense",
            name: "Р ТђР В»Р В°Р Т‘Р С•РЎРѓРЎвЂљР С•Р в„–Р С”Р В°РЎРЏ РЎРѓР ВµРЎвЂљР С”Р В°",
            description: "Р Р€Р С—РЎР‚РЎС“Р С–Р В°РЎРЏ Р С—РЎР‚Р С•РЎРѓР В»Р С•Р в„–Р С”Р В° РЎРѓРЎР‰Р ВµР Т‘Р В°Р ВµРЎвЂљ РЎРѓР С”Р С•Р В»РЎРЉР В·РЎРЏРЎвЂ°Р С‘Р Вµ Р С—Р С•Р С—Р В°Р Т‘Р В°Р Р…Р С‘РЎРЏ Р С‘ Р СР ВµР В»Р С”Р С‘Р Вµ Р С•РЎРѓР С”Р С•Р В»Р С”Р С‘.",
            effectLabel: "-2 РЎС“РЎР‚Р С•Р Р…Р В° Р Т‘Р В°Р В¶Р Вµ Р С•РЎвЂљ Р В·Р В°РЎвЂ Р ВµР С—Р В°",
            damageReduction: 2,
            grazeReduction: 2
        },
        supportSidestep: {
            id: "supportSidestep",
            slot: "support",
            name: "Р РЋР ВµРЎР‚Р Р†Р С•Р С—РЎР‚Р С‘Р Р†Р С•Р Т‘ РЎС“Р Р†Р С•РЎР‚Р С•РЎвЂљР В°",
            description: "Р СџРЎР‚РЎС“Р В¶Р С‘Р Р…Р В° Р С—Р С•Р Т‘ Р С”Р С•Р В»Р ВµР Р…Р С•Р С Р С‘Р Р…Р С•Р С–Р Т‘Р В° РЎРѓРЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ РЎС“Р В¶Р Вµ Р С—Р С•Р в„–Р СР В°Р Р…Р Р…РЎС“РЎР‹ Р В»Р С‘Р Р…Р С‘РЎР‹.",
            effectLabel: "10% РЎв‚¬Р В°Р Р…РЎРѓ РЎРѓР С•РЎР‚Р Р†Р В°РЎвЂљРЎРЉ Р С—РЎР‚РЎРЏР СР С•Р Вµ Р С—Р С•Р С—Р В°Р Т‘Р В°Р Р…Р С‘Р Вµ",
            evadeChance: 0.1
        },
        supportStimLoop: {
            id: "supportStimLoop",
            slot: "support",
            name: "Р РЋРЎвЂљР С‘Р С-Р С”Р С•Р Р…РЎвЂљРЎС“РЎР‚",
            description: "Р вЂ”Р В°Р СР С”Р Р…РЎС“РЎвЂљРЎвЂ№Р в„– Р Р†Р С—РЎР‚РЎвЂ№РЎРѓР С” Р Р†Р С•Р В·Р Р†РЎР‚Р В°РЎвЂ°Р В°Р ВµРЎвЂљ Р Т‘РЎвЂ№РЎвЂ¦Р В°Р Р…Р С‘Р Вµ Р С—Р С•РЎРѓР В»Р Вµ Р С”Р В°Р В¶Р Т‘Р С•Р С–Р С• РЎР‚Р В°РЎС“Р Р…Р Т‘Р В°.",
            effectLabel: "+4 HP Р С—Р С•РЎРѓР В»Р Вµ Р С”Р В°Р В¶Р Т‘Р С•Р С–Р С• РЎР‚Р В°РЎС“Р Р…Р Т‘Р В°",
            regenPerRound: 4
        },
        supportTargetLink: {
            id: "supportTargetLink",
            slot: "support",
            name: "Р РЋР Р†РЎРЏР В·Р С”Р В° Р СР ВµРЎвЂљР С•Р С”",
            description: "Р В¦Р ВµР Р…РЎвЂљРЎР‚Р В°Р В»РЎРЉР Р…Р В°РЎРЏ Р В»Р С‘Р Р…Р С‘РЎРЏ РЎвЂЎР С‘РЎвЂљР В°Р ВµРЎвЂљРЎРѓРЎРЏ Р В±РЎвЂ№РЎРѓРЎвЂљРЎР‚Р ВµР Вµ, Р ВµРЎРѓР В»Р С‘ Р Т‘Р С•Р Р†Р ВµРЎР‚Р С‘РЎвЂљРЎРЉРЎРѓРЎРЏ Р Т‘Р В°РЎвЂљРЎвЂЎР С‘Р С”Р В°Р С.",
            effectLabel: "-4% Р С” Р В±Р В»Р С•Р С”РЎС“ Р С—Р С• РЎвЂ Р ВµР Р…РЎвЂљРЎР‚РЎС“",
            centerHitBonus: 0.04
        }
    };
    const POSITIVE_MARKERS = [/\+\d+\sР СР С•Р Р…Р ВµРЎвЂљ/gi, /\+\d+\sHP/gi];
    const NEGATIVE_MARKERS = [/-\d+\sР СР С•Р Р…Р ВµРЎвЂљ/gi, /Р С—РЎР‚Р С•Р СР В°РЎвЂ¦/gi, /Р С—РЎР‚Р С•Р Р†Р В°Р В»/gi, /Р С—Р С•РЎР‚Р В°Р В¶Р ВµР Р…Р С‘[Р ВµРЎРЏ]/gi, /Р Р…Р Вµ РЎвЂ¦Р Р†Р В°РЎвЂљР В°Р ВµРЎвЂљ/gi, /Р С‘РЎРѓРЎвЂљ[Р ВµРЎвЂ]Р С”/gi, /Р С—Р С•РЎвЂљР ВµРЎР‚[РЎРЏР С‘]/gi, /Р В·Р В°Р С[Р ВµРЎвЂ]РЎР‚Р В·/gi, /РЎР‚Р В°Р Р…[Р В°Р Вµ]Р Р…/gi, /РЎв‚¬РЎС“Р С/gi, /РЎРѓР С•РЎР‚Р Р†Р В°Р Р…/gi, /Р С—РЎС“РЎРѓРЎвЂљР С•/gi];
    const elements = {};
    let state = hydrateState(loadState());
    let toastTimer = null;
    let liveSyncPending = false;
    let friendSyncPending = false;
    const RUBLE_SIGN = "\u20BD";
    const DUEL_DEFAULT_NOTE = "РџРѕРїР°РґР°РЅРёРµ РїСЂРѕС…РѕРґРёС‚, РµСЃР»Рё Р»РёРЅРёСЏ РІС‹СЃС‚СЂРµР»Р° СЃРѕРІРїР°Р»Р° СЃ Р»РёРЅРёРµР№ СѓРІРѕСЂРѕС‚Р° СЃРѕРїРµСЂРЅРёРєР°.";

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
        elements.profileRating = document.getElementById("profile-rating");
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

    function stripInlineButtonActions() {
        document.querySelectorAll("button[onclick]").forEach(function (button) {
            button.removeAttribute("onclick");
        });
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
                        title: "Р вЂ™РЎвЂ№Р В·Р С•Р Р† Р Р…Р В° Р Т‘РЎС“РЎРЊР В»РЎРЉ",
                        copy: "Р СџР С•Р Т‘РЎвЂљР Р†Р ВµРЎР‚Р Т‘Р С‘, РЎвЂЎРЎвЂљР С• РЎвЂ¦Р С•РЎвЂЎР ВµРЎв‚¬РЎРЉ Р Р†РЎвЂ№Р В·Р Р†Р В°РЎвЂљРЎРЉ " + friend.name + " Р Р…Р В° Р В±Р С•Р в„–. Р СџР С•Р С”Р В° РЎРЊРЎвЂљР С• Р В·Р В°Р С—РЎС“РЎРѓР С”Р В°Р ВµРЎвЂљ Р С•Р В±РЎвЂ°Р С‘Р в„– Р С—Р С•Р С‘РЎРѓР С” РЎРѓР С•Р С—Р ВµРЎР‚Р Р…Р С‘Р С”Р В°.",
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
                    initError: error && error.message ? error.message : "Р СњР Вµ РЎС“Р Т‘Р В°Р В»Р С•РЎРѓРЎРЉ РЎРѓР С•Р В·Р Т‘Р В°РЎвЂљРЎРЉ РЎРѓР ВµРЎРѓРЎРѓР С‘РЎР‹"
                });
                state.player.name = "Р СњР С•Р Р†РЎвЂ№Р в„– Р С‘Р С–РЎР‚Р С•Р С”";
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
                firstName: "Р вЂњР С•РЎРѓРЎвЂљРЎРЉ",
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
            throw new Error("Р СџРЎС“РЎРѓРЎвЂљР С•Р в„– Р С•РЎвЂљР Р†Р ВµРЎвЂљ РЎРѓР ВµРЎРѓРЎРѓР С‘Р С‘");
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
            journalStyle: player.journalStyle || "",
            registered: Boolean(player.registered),
            demoMode: false,
            initError: ""
        });
        syncPlayerFromServer(player, accountChanged || !player.registered);
        saveState();
    }

    function syncPlayerFromServer(player, resetEconomy) {
        state.player.id = player.id;
        state.player.name = player.nickname || player.displayName || state.player.name || "Р СњР С•Р Р†РЎвЂ№Р в„– Р С‘Р С–РЎР‚Р С•Р С”";
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
            initError: error && error.message ? error.message : "Р СњР Вµ РЎС“Р Т‘Р В°Р В»Р С•РЎРѓРЎРЉ РЎРѓР С•Р В·Р Т‘Р В°РЎвЂљРЎРЉ РЎРѓР ВµРЎРѓРЎРѓР С‘РЎР‹"
        });
        state.player.name = "Р СњР С•Р Р†РЎвЂ№Р в„– Р С‘Р С–РЎР‚Р С•Р С”";
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
            showRegistrationError("Р вЂ™Р Р†Р ВµР Т‘Р С‘ Р Р…Р С‘Р С”Р Р…Р ВµР в„–Р С.");
            return;
        }
        if (nickname.length < 3 || nickname.length > 20) {
            showRegistrationError("Р СњР С‘Р С” Р Т‘Р С•Р В»Р В¶Р ВµР Р… Р В±РЎвЂ№РЎвЂљРЎРЉ Р Т‘Р В»Р С‘Р Р…Р С•Р в„– Р С•РЎвЂљ 3 Р Т‘Р С• 20 РЎРѓР С‘Р СР Р†Р С•Р В»Р С•Р Р†.");
            return;
        }
        if (!/^[\p{L}\p{N}_-]+$/u.test(nickname)) {
            showRegistrationError("Р СњР С‘Р С” Р СР С•Р В¶Р ВµРЎвЂљ РЎРѓР С•Р Т‘Р ВµРЎР‚Р В¶Р В°РЎвЂљРЎРЉ РЎвЂљР С•Р В»РЎРЉР С”Р С• Р В±РЎС“Р С”Р Р†РЎвЂ№, РЎвЂ Р С‘РЎвЂћРЎР‚РЎвЂ№, _ Р С‘ -.");
            return;
        }
        elements.registrationSubmit.disabled = true;
        try {
            if (state.auth && state.auth.demoMode) {
                state.auth.nickname = nickname;
                state.auth.registered = true;
                state.player.name = nickname;
                state.player.money = 0;
                addJournal("Р СњР С‘Р С” \"" + nickname + "\" РЎРѓР С•РЎвЂ¦РЎР‚Р В°Р Р…Р ВµР Р… Р Р† Р В»Р С•Р С”Р В°Р В»РЎРЉР Р…Р С•Р С РЎР‚Р ВµР В¶Р С‘Р СР Вµ.");
                saveState();
                renderAll();
                showToast("Р СњР С‘Р С” РЎРѓР С•РЎвЂ¦РЎР‚Р В°Р Р…Р ВµР Р….");
                return;
            }
            if (!state.auth || !state.auth.sessionToken) {
                throw new Error("Р С›РЎвЂљР С”РЎР‚Р С•Р в„– Mini App РЎвЂЎР ВµРЎР‚Р ВµР В· Telegram, РЎвЂЎРЎвЂљР С•Р В±РЎвЂ№ Р В·Р В°Р С”РЎР‚Р ВµР С—Р С‘РЎвЂљРЎРЉ Р Р…Р С‘Р С”.");
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
            addJournal("Р С’Р С”Р С”Р В°РЎС“Р Р…РЎвЂљ Р В·Р В°РЎР‚Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р С‘РЎР‚Р С•Р Р†Р В°Р Р… Р С—Р С•Р Т‘ Р Р…Р С‘Р С”Р С•Р С \"" + (player.nickname || nickname) + "\".");
            saveState();
            renderAll();
            showToast("Р С’Р С”Р С”Р В°РЎС“Р Р…РЎвЂљ Р В·Р В°РЎР‚Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р С‘РЎР‚Р С•Р Р†Р В°Р Р….");
        } catch (error) {
            showRegistrationError(error && error.message ? error.message : "Р СњР Вµ РЎС“Р Т‘Р В°Р В»Р С•РЎРѓРЎРЉ Р В·Р В°РЎР‚Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р С‘РЎР‚Р С•Р Р†Р В°РЎвЂљРЎРЉ Р В°Р С”Р С”Р В°РЎС“Р Р…РЎвЂљ.");
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
            return payload && payload.message ? payload.message : "Р С›РЎв‚¬Р С‘Р В±Р С”Р В° Р В·Р В°Р С—РЎР‚Р С•РЎРѓР В°";
        } catch (error) {
            return "Р С›РЎв‚¬Р С‘Р В±Р С”Р В° Р В·Р В°Р С—РЎР‚Р С•РЎРѓР В°";
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
            title: "Р СњР В°Р в„–Р Т‘Р ВµР Р…Р Р…РЎвЂ№Р в„– Р СР В°РЎвЂљРЎвЂЎ",
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
                return "Р СџР С•Р В±Р ВµР Т‘Р В°. Р РЋР С•Р С—Р ВµРЎР‚Р Р…Р С‘Р С” РЎРѓР В»Р С•Р СР В°Р В» РЎвЂљР ВµР СР С—.";
            }
            if (payload.resultLabel === "DEFEAT") {
                return "Р СџР С•РЎР‚Р В°Р В¶Р ВµР Р…Р С‘Р Вµ. Р СџРЎР‚Р С‘Р Т‘Р ВµРЎвЂљРЎРѓРЎРЏ РЎРѓР С•Р В±Р С‘РЎР‚Р В°РЎвЂљРЎРЉРЎРѓРЎРЏ Р В·Р В°Р Р…Р С•Р Р†Р С•.";
            }
            return "Р СњР С‘РЎвЂЎРЎРЉРЎРЏ. Р С›Р В±Р С•Р С‘РЎвЂ¦ РЎС“Р Р…Р ВµРЎРѓР В»Р С• Р Р† Р В»Р ВµР Т‘РЎРЏР Р…РЎС“РЎР‹ РЎвЂљР С‘РЎв‚¬Р С‘Р Р…РЎС“.";
        }
        if (payload.yourActionSubmitted && !payload.opponentActionSubmitted) {
            return "Р ТђР С•Р Т‘ Р В·Р В°РЎвЂћР С‘Р С”РЎРѓР С‘РЎР‚Р С•Р Р†Р В°Р Р…. Р вЂ“Р Т‘Р ВµР С Р С•РЎвЂљР Р†Р ВµРЎвЂљ РЎРѓР С•Р С—Р ВµРЎР‚Р Р…Р С‘Р С”Р В°.";
        }
        if (payload.yourActionSubmitted && payload.opponentActionSubmitted) {
            return "Р С›Р В±Р В° РЎвЂ¦Р С•Р Т‘Р В° Р В·Р В°Р С—Р ВµРЎР‚РЎвЂљРЎвЂ№. Р В Р В°РЎС“Р Р…Р Т‘ РЎРѓР ВµР в„–РЎвЂЎР В°РЎРѓ РЎР‚Р В°РЎРѓР С”РЎР‚Р С•Р ВµРЎвЂљРЎРѓРЎРЏ.";
        }
        return "Р вЂ™РЎвЂ№Р В±Р ВµРЎР‚Р С‘ РЎвЂ¦Р С•Р Т‘ Р Р…Р В° РЎР‚Р В°РЎС“Р Р…Р Т‘.";
    }

    function openLiveDuelResult(payload) {
        const isVictory = payload.resultLabel === "VICTORY";
        const isDefeat = payload.resultLabel === "DEFEAT";
        const winnerName = isVictory
            ? (payload.you && payload.you.displayName ? payload.you.displayName : state.player.name)
            : (payload.opponent && payload.opponent.displayName ? payload.opponent.displayName : "Р РЋР С•Р С—Р ВµРЎР‚Р Р…Р С‘Р С”");
        const rewardMoney = isVictory ? BATTLE_VICTORY_COINS : 0;
        const rewardExperience = BATTLE_REWARD_EXPERIENCE;

        if (isVictory) {
            addJournal("Р СџР С•Р В±Р ВµР Т‘Р В° Р Р† PvP. +100 Р СР С•Р Р…Р ВµРЎвЂљ Р С‘ +10 Р С•Р С—РЎвЂ№РЎвЂљР В°.");
        } else if (isDefeat) {
            addJournal("Р СџР С•РЎР‚Р В°Р В¶Р ВµР Р…Р С‘Р Вµ Р Р† PvP. Р СњР В° РЎРЊРЎвЂљР С•РЎвЂљ РЎР‚Р В°Р В· Р В±Р ВµР В· Р Р…Р В°Р С–РЎР‚Р В°Р Т‘РЎвЂ№.");
        } else {
            addJournal("Р СљР В°РЎвЂљРЎвЂЎ Р В·Р В°Р Р†Р ВµРЎР‚РЎв‚¬Р С‘Р В»РЎРѓРЎРЏ Р Р…Р С‘РЎвЂЎРЎРЉР ВµР в„–.");
        }

        openDuelResultModal({
            title: isVictory ? "Р СћРЎвЂ№ Р С—Р С•Р В±Р ВµР Т‘Р С‘Р В»" : (isDefeat ? "Р СћРЎвЂ№ Р С—РЎР‚Р С•Р С‘Р С–РЎР‚Р В°Р В»" : "Р СњР С‘РЎвЂЎРЎРЉРЎРЏ"),
            copy: isVictory
                ? "Р СџР С•Р В±Р ВµР В¶Р Т‘Р ВµР Р… " + (payload.opponent && payload.opponent.displayName ? payload.opponent.displayName : "РЎРѓР С•Р С—Р ВµРЎР‚Р Р…Р С‘Р С”") + "."
                : (isDefeat ? "Р СџР С•Р В±Р ВµР Т‘Р С‘Р В» " + winnerName + "." : "Р С›Р В±Р В° Р В±Р С•Р в„–РЎвЂ Р В° РЎС“Р Т‘Р ВµРЎР‚Р В¶Р В°Р В»Р С‘ Р В»Р С‘Р Р…Р С‘РЎР‹ Р Т‘Р С• Р С”Р С•Р Р…РЎвЂ Р В°."),
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

        if (target.id === "find-match-button") {
            startQueueDuel();
            return;
        }

        if (target.id === "bot-duel-button") {
            startBotDuel();
            return;
        }

        if (target.id === "social-chat-fab") {
            openSocialInbox();
            return;
        }

        if (target.id === "social-chat-close") {
            closeSocialInbox();
            return;
        }

        if (target.id === "start-duel-cancel") {
            cancelStartDuel();
            return;
        }

        if (target.id === "start-duel-confirm") {
            confirmStartDuel();
            return;
        }

        if (target.id === "duel-exit-cancel") {
            cancelDuelExit();
            return;
        }

        if (target.id === "duel-exit-confirm") {
            confirmDuelExit();
            return;
        }

        if (target.id === "duel-result-close") {
            closeDuelResult();
            return;
        }

        if (target.id === "duel-submit-button") {
            submitCurrentDuelTurn();
            return;
        }

        if (target.id === "duel-tab-logs") {
            setDuelPanel("logs");
            return;
        }

        if (target.id === "duel-tab-chat") {
            setDuelPanel("chat");
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
                    title: "Р вЂ™РЎвЂ№Р В·Р Р†Р В°РЎвЂљРЎРЉ Р Т‘РЎР‚РЎС“Р С–Р В° Р Р…Р В° Р Т‘РЎС“РЎРЊР В»РЎРЉ?",
                    copy: "Р СџР С•Р Т‘РЎвЂљР Р†Р ВµРЎР‚Р Т‘Р С‘, РЎвЂЎРЎвЂљР С• РЎвЂ¦Р С•РЎвЂЎР ВµРЎв‚¬РЎРЉ Р Р†РЎвЂ№Р В·Р Р†Р В°РЎвЂљРЎРЉ " + friend.name + ". Р СџР С•Р С”Р В° Р С—РЎР‚РЎРЏР СР С•Р в„– Р Р†РЎвЂ№Р В·Р С•Р Р† Р Р†Р ВµР Т‘Р ВµРЎвЂљ Р Р† Р С•Р В±РЎвЂ°Р С‘Р в„– PvP-Р С—Р С•Р С‘РЎРѓР С”.",
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
            showToast("Р РЋР Р…Р В°РЎвЂЎР В°Р В»Р В° Р Р†РЎвЂ№Р В±Р ВµРЎР‚Р С‘ Р С•РЎР‚РЎС“Р В¶Р С‘Р Вµ, Р Р†РЎвЂ№РЎРѓРЎвЂљРЎР‚Р ВµР В» Р С‘ РЎС“Р Р†Р С•РЎР‚Р С•РЎвЂљ.");
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
            showToast("Р В­РЎвЂљР С•РЎвЂљ Р С”Р Р†Р ВµРЎРѓРЎвЂљ РЎС“Р В¶Р Вµ Р Р…Р ВµР Т‘Р С•РЎРѓРЎвЂљРЎС“Р С—Р ВµР Р….");
            return;
        }
        if (quest.status === "new") {
            quest.status = "inProgress";
            addJournal("Р С™Р Р†Р ВµРЎРѓРЎвЂљ \"" + quest.title + "\" Р С—Р ВµРЎР‚Р ВµРЎв‚¬Р ВµР В» Р Р† РЎР‚Р ВµР В¶Р С‘Р С Р СџРЎР‚Р С•Р Т‘Р С•Р В»Р В¶Р С‘РЎвЂљРЎРЉ.");
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
        addJournal("Р С™Р Р†Р ВµРЎРѓРЎвЂљ \"" + quest.title + "\" Р С•РЎвЂљР В»Р С•Р В¶Р ВµР Р…. Р СћР В°Р в„–Р СР ВµРЎР‚ РЎРѓР В»Р ВµР С–Р С”Р В° Р С•РЎвЂљРЎРѓРЎвЂљРЎС“Р С—Р С‘Р В».");
        showToast("Р СћР В°Р в„–Р СР ВµРЎР‚ Р С”Р Р†Р ВµРЎРѓРЎвЂљР В° РЎРѓР Т‘Р Р†Р С‘Р Р…РЎС“РЎвЂљ Р Р…Р В° 15 Р СР С‘Р Р…РЎС“РЎвЂљ.");
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
            const warning = "Р СњР Вµ РЎвЂ¦Р Р†Р В°РЎвЂљР В°Р ВµРЎвЂљ Р С—РЎР‚Р ВµР Т‘Р СР ВµРЎвЂљР В°: " + missingName + ".";
            addJournal(warning);
            showToast(warning);
            renderAll();
            return;
        }
        if (choice.requiresStat && !meetsChoiceStat(choice)) {
            const warning = "Р СњР Вµ РЎвЂ¦Р Р†Р В°РЎвЂљР В°Р ВµРЎвЂљ РЎвЂ¦Р В°РЎР‚Р В°Р С”РЎвЂљР ВµРЎР‚Р С‘РЎРѓРЎвЂљР С‘Р С”Р С‘: " + getStatLabel(choice.requiresStat) + " " + choice.requiresStatValue + ".";
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
            addJournal(choice.failText || "Р СџРЎР‚Р С•Р Р†Р В°Р В».");
            showToast(choice.failText || "Р СџРЎР‚Р С•Р Р†Р В°Р В».");
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
        addJournal(choice.successText || "Р Р€РЎРѓР С—Р ВµРЎвЂ¦.");
        showToast(choice.successText || "Р Р€РЎРѓР С—Р ВµРЎвЂ¦.");
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
            showToast("Р В­РЎвЂљР С•РЎвЂљ Р С—РЎР‚Р ВµР Т‘Р СР ВµРЎвЂљ Р В»РЎС“РЎвЂЎРЎв‚¬Р Вµ Р С—Р С•Р В±Р ВµРЎР‚Р ВµРЎвЂЎРЎРЉ Р Т‘Р В»РЎРЏ Р С‘РЎРѓРЎвЂљР С•РЎР‚Р С‘Р С‘.");
            return;
        }
        if (!hasItem("medkit")) {
            showToast("Р СњР Вµ РЎвЂ¦Р Р†Р В°РЎвЂљР В°Р ВµРЎвЂљ Р С—РЎР‚Р ВµР Т‘Р СР ВµРЎвЂљР В°: Р С’Р С—РЎвЂљР ВµРЎвЂЎР С”Р В°.");
            return;
        }
        consumeItem("medkit", 1);
        addJournal("Р С’Р С—РЎвЂљР ВµРЎвЂЎР С”Р В° Р С‘РЎРѓР С—Р С•Р В»РЎРЉР В·Р С•Р Р†Р В°Р Р…Р В°. Р ТђР С•Р В»Р С•Р Т‘ Р С•РЎвЂљРЎРѓРЎвЂљРЎС“Р С—Р В°Р ВµРЎвЂљ, РЎР‚РЎС“Р С”Р С‘ РЎРѓР Р…Р С•Р Р†Р В° РЎРѓР В»РЎС“РЎв‚¬Р В°РЎР‹РЎвЂљРЎРѓРЎРЏ.");
        showToast("Р С’Р С—РЎвЂљР ВµРЎвЂЎР С”Р В° Р С‘РЎРѓР С—Р С•Р В»РЎРЉР В·Р С•Р Р†Р В°Р Р…Р В°.");
        saveState();
        renderAll();
    }

    function buyShopItem(shopId) {
        const item = state.shop.find(function (entry) { return entry.id === shopId; });
        if (!item) {
            return;
        }
        if (item.section === "premium") {
            showToast("Р СџРЎР‚Р ВµР СР С‘Р В°Р В»РЎРЉР Р…РЎвЂ№Р в„– РЎР‚Р В°Р В·Р Т‘Р ВµР В» Р Р†РЎР‚Р ВµР СР ВµР Р…Р Р…Р С• Р Р† РЎР‚Р В°Р В±Р С•РЎвЂљР Вµ.");
            return;
        }

        if (state.player.money < item.price) {
            const warning = "Р СњР Вµ РЎвЂ¦Р Р†Р В°РЎвЂљР В°Р ВµРЎвЂљ Р СР С•Р Р…Р ВµРЎвЂљ: -" + item.price + " РЎРѓР ВµР в„–РЎвЂЎР В°РЎРѓ Р Р…Р Вµ Р С—Р С•РЎвЂљРЎРЏР Р…РЎС“РЎвЂљРЎРЉ.";
            addJournal(warning);
            showToast(warning);
            renderAll();
            return;
        }

        state.player.money -= item.price;
        addItem(item.itemId, 1);
        addJournal('Р С™РЎС“Р С—Р В»Р ВµР Р… Р С—РЎР‚Р ВµР Т‘Р СР ВµРЎвЂљ "' + item.name + '". -' + item.price + " Р СР С•Р Р…Р ВµРЎвЂљ.");
        showToast("Р С™РЎС“Р С—Р В»Р ВµР Р…Р С•: " + item.name + ".");
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
                title: "Р СњР В°РЎвЂЎР В°РЎвЂљРЎРЉ РЎвЂљРЎР‚Р ВµР Р…Р С‘РЎР‚Р С•Р Р†Р С•РЎвЂЎР Р…РЎС“РЎР‹ Р Т‘РЎС“РЎРЊР В»РЎРЉ?",
                copy: "Р СџР С•Р Т‘РЎвЂљР Р†Р ВµРЎР‚Р Т‘Р С‘, РЎвЂЎРЎвЂљР С• РЎвЂ¦Р С•РЎвЂЎР ВµРЎв‚¬РЎРЉ РЎРѓРЎР‚Р В°Р В·РЎС“ Р Р†Р С•Р в„–РЎвЂљР С‘ Р Р† Р В±Р С•Р в„– РЎРѓ РЎвЂљРЎР‚Р ВµР Р…Р С‘РЎР‚Р С•Р Р†Р С•РЎвЂЎР Р…РЎвЂ№Р С РЎРѓР С•Р С—Р ВµРЎР‚Р Р…Р С‘Р С”Р С•Р С.",
                execute: function () {
                    startBotDuel(true);
                }
            });
            return;
        }
        openDuel({ mode: "bot", title: "Р СћРЎР‚Р ВµР Р…Р С‘РЎР‚Р С•Р Р†Р С•РЎвЂЎР Р…Р В°РЎРЏ Р Т‘РЎС“РЎРЊР В»РЎРЉ", modeLabel: "Р вЂР С•РЎвЂљ", opponentName: "Р СћРЎР‚Р ВµР Р…Р С‘РЎР‚Р С•Р Р†РЎвЂ°Р С‘Р С”", opponentWeapon: "RIFLE" });
    }

    async function startQueueDuel(skipConfirm) {
        if (!state.auth.registered) {
            showToast("Р РЋР Р…Р В°РЎвЂЎР В°Р В»Р В° Р В·Р В°РЎР‚Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р С‘РЎР‚РЎС“Р в„– Р В°Р С”Р С”Р В°РЎС“Р Р…РЎвЂљ.");
            return;
        }
        if (!skipConfirm) {
            requestStartDuel({
                mode: "queue",
                title: "Р СњР В°РЎвЂЎР В°РЎвЂљРЎРЉ Р С—Р С•Р С‘РЎРѓР С” Р СР В°РЎвЂљРЎвЂЎР В°?",
                copy: "Р СџР С•Р Т‘РЎвЂљР Р†Р ВµРЎР‚Р Т‘Р С‘, РЎвЂЎРЎвЂљР С• РЎвЂ¦Р С•РЎвЂЎР ВµРЎв‚¬РЎРЉ Р Р†РЎРѓРЎвЂљР В°РЎвЂљРЎРЉ Р Р† Р С•РЎвЂЎР ВµРЎР‚Р ВµР Т‘РЎРЉ. Р РЋР В»РЎС“РЎвЂЎР В°Р в„–Р Р…РЎвЂ№Р Вµ Р Р…Р В°Р В¶Р В°РЎвЂљР С‘РЎРЏ РЎвЂљР С•Р В¶Р Вµ Р С•РЎвЂљР С—РЎР‚Р В°Р Р†Р В»РЎРЏРЎР‹РЎвЂљ РЎвЂљР ВµР В±РЎРЏ Р Р† Р С—Р С•Р С‘РЎРѓР С”.",
                execute: function () {
                    startQueueDuel(true);
                }
            });
            return;
        }
        if (state.matchmaking.status === "QUEUED") {
            showToast("Р С›РЎвЂЎР ВµРЎР‚Р ВµР Т‘РЎРЉ РЎС“Р В¶Р Вµ Р В°Р С”РЎвЂљР С‘Р Р†Р Р…Р В°. Р ВРЎвЂ°Р ВµР С РЎРѓР С•Р С—Р ВµРЎР‚Р Р…Р С‘Р С”Р В°.");
            return;
        }
        if (!state.auth.sessionToken || state.auth.demoMode) {
            showToast("Р вЂ™Р Р…Р Вµ Telegram Р Т‘Р С•РЎРѓРЎвЂљРЎС“Р С—Р Р…Р В° Р В»Р С•Р С”Р В°Р В»РЎРЉР Р…Р В°РЎРЏ Р Т‘РЎС“РЎРЊР В»РЎРЉ.");
            openDuel({ mode: "pvp", title: "Р СњР В°Р в„–Р Т‘Р ВµР Р…Р Р…РЎвЂ№Р в„– Р СР В°РЎвЂљРЎвЂЎ", modeLabel: "PvP", opponentName: randomFrom(["Р В Р ВµР в„–Р Т‘Р ВµРЎР‚ РЎРѓ Р С—Р ВµРЎР‚Р ВµР Р†Р В°Р В»Р В°", "Р С™Р С•Р Р…РЎвЂљРЎР‚Р В°Р В±Р В°Р Р…Р Т‘Р С‘РЎРѓРЎвЂљ РЎС“ Р С—РЎР‚Р С•Р Р†Р С•Р Т‘Р С•Р Р†", "Р СљР С•Р В»РЎвЂЎР В°Р В»Р С‘Р Р†РЎвЂ№Р в„– РЎРѓРЎвЂљРЎР‚Р ВµР В»Р С•Р С”", "Р В§Р В°РЎРѓР С•Р Р†Р С•Р в„– Р С‘Р В· Р В±Р ВµР В»Р С•Р в„– Р С—РЎвЂ№Р В»Р С‘"]), opponentWeapon: randomFrom(["PISTOLS", "RIFLE", "SHOTGUN"]) });
            return;
        }
        try {
            const response = await apiFetch("/api/matchmaking/join", { method: "POST" });
            const payload = await response.json();
            applyMatchmakingStatus(payload);
            if (payload.status === "IN_DUEL" && payload.duelId) {
                await refreshLiveDuel(payload.duelId);
                showToast("Р РЋР С•Р С—Р ВµРЎР‚Р Р…Р С‘Р С” Р Р…Р В°Р в„–Р Т‘Р ВµР Р….");
            } else {
                showToast(payload.message || "Р ВРЎвЂ°Р ВµР С РЎРѓР С•Р С—Р ВµРЎР‚Р Р…Р С‘Р С”Р В°.");
            }
        } catch (error) {
            showToast(error && error.message ? error.message : "Р СњР Вµ РЎС“Р Т‘Р В°Р В»Р С•РЎРѓРЎРЉ Р Р†Р С•Р в„–РЎвЂљР С‘ Р Р† Р С•РЎвЂЎР ВµРЎР‚Р ВµР Т‘РЎРЉ.");
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
            showToast("Р СџР С•Р С‘РЎРѓР С” Р Т‘РЎС“РЎРЊР В»Р С‘ Р С•РЎвЂљР СР ВµР Р…РЎвЂР Р….");
            return;
        }
        if (elements.queueCancelButton) {
            elements.queueCancelButton.disabled = true;
        }
        try {
            const response = await apiFetch("/api/matchmaking/cancel", { method: "POST" });
            applyMatchmakingStatus(await response.json());
            renderAll();
            showToast("Р СџР С•Р С‘РЎРѓР С” Р Т‘РЎС“РЎРЊР В»Р С‘ Р С•РЎвЂљР СР ВµР Р…РЎвЂР Р….");
        } catch (error) {
            showToast(error && error.message ? error.message : "Р СњР Вµ РЎС“Р Т‘Р В°Р В»Р С•РЎРѓРЎРЉ Р С•РЎвЂљР СР ВµР Р…Р С‘РЎвЂљРЎРЉ Р С—Р С•Р С‘РЎРѓР С”.");
        } finally {
            if (elements.queueCancelButton) {
                elements.queueCancelButton.disabled = false;
            }
        }
    }

    async function allocateStat(stat) {
        if (!state.auth.registered) {
            showToast("Р РЋР Р…Р В°РЎвЂЎР В°Р В»Р В° Р В·Р В°РЎР‚Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р С‘РЎР‚РЎС“Р в„– Р В°Р С”Р С”Р В°РЎС“Р Р…РЎвЂљ.");
            return;
        }
        if ((state.player.availableStatPoints || 0) <= 0) {
            showToast("Р РЋР Р†Р С•Р В±Р С•Р Т‘Р Р…РЎвЂ№РЎвЂ¦ Р С•РЎвЂЎР С”Р С•Р Р† Р С—Р С•Р С”Р В° Р Р…Р ВµРЎвЂљ.");
            return;
        }
        if (!state.auth.sessionToken || state.auth.demoMode) {
            state.player[stat] = (state.player[stat] || 0) + 1;
            state.player.availableStatPoints = Math.max(0, (state.player.availableStatPoints || 0) - 1);
            saveState();
            renderAll();
            showToast("Р ТђР В°РЎР‚Р В°Р С”РЎвЂљР ВµРЎР‚Р С‘РЎРѓРЎвЂљР С‘Р С”Р В° РЎС“РЎРѓР С‘Р В»Р ВµР Р…Р В°.");
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
            showToast("Р ТђР В°РЎР‚Р В°Р С”РЎвЂљР ВµРЎР‚Р С‘РЎРѓРЎвЂљР С‘Р С”Р В° РЎС“РЎРѓР С‘Р В»Р ВµР Р…Р В°.");
        } catch (error) {
            showToast(error && error.message ? error.message : "Р СњР Вµ РЎС“Р Т‘Р В°Р В»Р С•РЎРѓРЎРЉ РЎР‚Р В°РЎРѓР С—РЎР‚Р ВµР Т‘Р ВµР В»Р С‘РЎвЂљРЎРЉ Р С•РЎвЂЎР С”Р С•.");
        }
    }

    async function submitFriendSearch() {
        if (!state.auth.registered) {
            showToast("Р РЋР Р…Р В°РЎвЂЎР В°Р В»Р В° Р В·Р В°РЎР‚Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р С‘РЎР‚РЎС“Р в„– Р В°Р С”Р С”Р В°РЎС“Р Р…РЎвЂљ.");
            return;
        }
        const nickname = elements.friendSearchInput ? elements.friendSearchInput.value.trim() : "";
        if (!nickname) {
            showToast("Р вЂ™Р Р†Р ВµР Т‘Р С‘ Р Р…Р С‘Р С” Р С‘Р С–РЎР‚Р С•Р С”Р В°.");
            return;
        }
        if (!state.auth.sessionToken || state.auth.demoMode) {
            showToast("Р вЂќР С•Р В±Р В°Р Р†Р В»Р ВµР Р…Р С‘Р Вµ Р Т‘РЎР‚РЎС“Р В·Р ВµР в„– Р Т‘Р С•РЎРѓРЎвЂљРЎС“Р С—Р Р…Р С• РЎвЂљР С•Р В»РЎРЉР С”Р С• Р Р† Telegram-Р В°Р С”Р С”Р В°РЎС“Р Р…РЎвЂљР Вµ.");
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
            showToast("Р вЂ”Р В°Р С—РЎР‚Р С•РЎРѓ Р Р† Р Т‘РЎР‚РЎС“Р В·РЎРЉРЎРЏ Р С•РЎвЂљР С—РЎР‚Р В°Р Р†Р В»Р ВµР Р….");
        } catch (error) {
            showToast(error && error.message ? error.message : "Р СњР Вµ РЎС“Р Т‘Р В°Р В»Р С•РЎРѓРЎРЉ Р С•РЎвЂљР С—РЎР‚Р В°Р Р†Р С‘РЎвЂљРЎРЉ Р В·Р В°Р С—РЎР‚Р С•РЎРѓ.");
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
            showToast("Р вЂќРЎР‚РЎС“Р С– Р Т‘Р С•Р В±Р В°Р Р†Р В»Р ВµР Р….");
        } catch (error) {
            showToast(error && error.message ? error.message : "Р СњР Вµ РЎС“Р Т‘Р В°Р В»Р С•РЎРѓРЎРЉ Р С—РЎР‚Р С‘Р Р…РЎРЏРЎвЂљРЎРЉ Р В·Р В°Р С—РЎР‚Р С•РЎРѓ.");
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
            showToast("Р вЂ”Р В°Р С—РЎР‚Р С•РЎРѓ Р С•РЎвЂљР С”Р В»Р С•Р Р…Р ВµР Р….");
        } catch (error) {
            showToast(error && error.message ? error.message : "Р СњР Вµ РЎС“Р Т‘Р В°Р В»Р С•РЎРѓРЎРЉ Р С•РЎвЂљР С”Р В»Р С•Р Р…Р С‘РЎвЂљРЎРЉ Р В·Р В°Р С—РЎР‚Р С•РЎРѓ.");
        }
    }

    function openDuel(config) {
        if (state.auth && !state.auth.registered) {
            showToast("Р РЋР Р…Р В°РЎвЂЎР В°Р В»Р В° Р В·Р В°РЎР‚Р ВµР С–Р С‘РЎРѓРЎвЂљРЎР‚Р С‘РЎР‚РЎС“Р в„– Р В°Р С”Р С”Р В°РЎС“Р Р…РЎвЂљ.");
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
            resultText: "Р РЋР С•Р В±Р ВµРЎР‚Р С‘ РЎвЂ¦Р С•Р Т‘ Р Р…Р В° РЎР‚Р В°РЎС“Р Р…Р Т‘.",
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
            showToast("Р В­РЎвЂљР С•РЎвЂљ РЎР‚Р В°РЎС“Р Р…Р Т‘ РЎС“Р В¶Р Вµ Р Р†Р ВµР Т‘Р ВµРЎвЂљ Р В°Р Р†РЎвЂљР С•Р СР В°РЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С‘Р в„– Р В±Р С•Р в„–.");
            return;
        }
        if (!state.duel.canSubmitAction) {
            showToast("Р РЋР ВµР в„–РЎвЂЎР В°РЎРѓ РЎвЂ¦Р С•Р Т‘ Р Р…Р ВµР Т‘Р С•РЎРѓРЎвЂљРЎС“Р С—Р ВµР Р….");
            return;
        }
        if (!isDuelSelectionComplete(state.duel)) {
            showToast("Р РЋР Р…Р В°РЎвЂЎР В°Р В»Р В° Р Р†РЎвЂ№Р В±Р ВµРЎР‚Р С‘ Р С•РЎР‚РЎС“Р В¶Р С‘Р Вµ, Р Р†РЎвЂ№РЎРѓРЎвЂљРЎР‚Р ВµР В» Р С‘ РЎС“Р Р†Р С•РЎР‚Р С•РЎвЂљ.");
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
            showToast(state.duel && state.duel.yourActionSubmitted ? "Р ТђР С•Р Т‘ Р С—РЎР‚Р С‘Р Р…РЎРЏРЎвЂљ." : "Р В Р В°РЎС“Р Р…Р Т‘ Р С•Р В±Р Р…Р С•Р Р†Р В»Р ВµР Р….");
        } catch (error) {
            showToast(error && error.message ? error.message : "Р СњР Вµ РЎС“Р Т‘Р В°Р В»Р С•РЎРѓРЎРЉ Р С•РЎвЂљР С—РЎР‚Р В°Р Р†Р С‘РЎвЂљРЎРЉ РЎвЂ¦Р С•Р Т‘.");
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
                    ? "Р ВР В·Р СР ВµР Р…Р ВµР Р…Р С‘Р Вµ Р В°Р Р†РЎвЂљР С•Р СР В°РЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С•Р С–Р С• Р В±Р С•РЎРЏ Р С•РЎвЂљР СР ВµР Р…Р ВµР Р…Р С•."
                    : (nextPending ? "Р С’Р Р†РЎвЂљР С•Р В±Р С•Р в„– Р Р†Р С”Р В»РЎР‹РЎвЂЎР С‘РЎвЂљРЎРѓРЎРЏ РЎРѓР С• РЎРѓР В»Р ВµР Т‘РЎС“РЎР‹РЎвЂ°Р ВµР С–Р С• РЎР‚Р В°РЎС“Р Р…Р Т‘Р В°." : "Р С’Р Р†РЎвЂљР С•Р В±Р С•Р в„– Р С•РЎвЂљР С”Р В»РЎР‹РЎвЂЎР С‘РЎвЂљРЎРѓРЎРЏ РЎРѓР С• РЎРѓР В»Р ВµР Т‘РЎС“РЎР‹РЎвЂ°Р ВµР С–Р С• РЎР‚Р В°РЎС“Р Р…Р Т‘Р В°."));
            } catch (error) {
                showToast(error && error.message ? error.message : "Р СњР Вµ РЎС“Р Т‘Р В°Р В»Р С•РЎРѓРЎРЉ Р С—Р ВµРЎР‚Р ВµР С”Р В»РЎР‹РЎвЂЎР С‘РЎвЂљРЎРЉ Р В°Р Р†РЎвЂљР С•Р СР В°РЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С‘Р в„– Р В±Р С•Р в„–.");
            } finally {
                elements.duelAutoToggle.disabled = false;
            }
            return;
        }
        duel.autoBattlePendingEnabled = nextPending;
        saveState();
        renderDuel();
        showToast(nextPending === null
            ? "Р ВР В·Р СР ВµР Р…Р ВµР Р…Р С‘Р Вµ Р В°Р Р†РЎвЂљР С•Р СР В°РЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С•Р С–Р С• Р В±Р С•РЎРЏ Р С•РЎвЂљР СР ВµР Р…Р ВµР Р…Р С•."
            : (nextPending ? "Р С’Р Р†РЎвЂљР С•Р В±Р С•Р в„– Р Р†Р С”Р В»РЎР‹РЎвЂЎР С‘РЎвЂљРЎРѓРЎРЏ РЎРѓР С• РЎРѓР В»Р ВµР Т‘РЎС“РЎР‹РЎвЂ°Р ВµР С–Р С• РЎР‚Р В°РЎС“Р Р…Р Т‘Р В°." : "Р С’Р Р†РЎвЂљР С•Р В±Р С•Р в„– Р С•РЎвЂљР С”Р В»РЎР‹РЎвЂЎР С‘РЎвЂљРЎРѓРЎРЏ РЎРѓР С• РЎРѓР В»Р ВµР Т‘РЎС“РЎР‹РЎвЂ°Р ВµР С–Р С• РЎР‚Р В°РЎС“Р Р…Р Т‘Р В°."));
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
                    ? "Р РЋ РЎРЊРЎвЂљР С•Р С–Р С• РЎР‚Р В°РЎС“Р Р…Р Т‘Р В° РЎвЂ¦Р С•Р Т‘РЎвЂ№ Р С‘Р С–РЎР‚Р С•Р С”Р В° " + (duel.playerName || "Р ВР С–РЎР‚Р С•Р С”") + " Р В±РЎС“Р Т‘РЎС“РЎвЂљ Р В°Р Р†РЎвЂљР С•Р СР В°РЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С‘Р СР С‘."
                    : "Р РЋ РЎРЊРЎвЂљР С•Р С–Р С• РЎР‚Р В°РЎС“Р Р…Р Т‘Р В° Р В°Р Р†РЎвЂљР С•Р СР В°РЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С‘Р Вµ РЎвЂ¦Р С•Р Т‘РЎвЂ№ Р С‘Р С–РЎР‚Р С•Р С”Р В° " + (duel.playerName || "Р ВР С–РЎР‚Р С•Р С”") + " Р С•РЎвЂљР С”Р В»РЎР‹РЎвЂЎР ВµР Р…РЎвЂ№."
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
        duel.resultText = duel.autoBattleEnabled ? "Р В­РЎвЂљР С•РЎвЂљ РЎР‚Р В°РЎС“Р Р…Р Т‘ Р С—РЎР‚Р С•Р в„–Р Т‘Р ВµРЎвЂљ Р В°Р Р†РЎвЂљР С•Р СР В°РЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С‘." : "Р РЋР С•Р В±Р ВµРЎР‚Р С‘ РЎвЂ¦Р С•Р Т‘ Р Р…Р В° РЎР‚Р В°РЎС“Р Р…Р Т‘.";
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
        const playerName = duel.playerName || "Р ВР С–РЎР‚Р С•Р С”";
        const opponentName = duel.opponentName || "Р СџРЎР‚Р С•РЎвЂљР С‘Р Р†Р Р…Р С‘Р С”";
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
            duel.resultText = "Р СњР С‘РЎвЂЎРЎРЉРЎРЏ. Р С›Р В±Р В° Р С•РЎРѓРЎвЂљР В°РЎР‹РЎвЂљРЎРѓРЎРЏ Р Р…Р В° Р В»Р С‘Р Р…Р С‘Р С‘.";
            addJournal("Р СњР С‘РЎвЂЎРЎРЉРЎРЏ Р Р† Р В±Р С•РЎР‹. Р С›Р В±Р Вµ РЎРѓРЎвЂљР С•РЎР‚Р С•Р Р…РЎвЂ№ Р Р†РЎвЂ№Р Т‘РЎвЂ№РЎвЂ¦Р В°РЎР‹РЎвЂљ Р С‘ РЎР‚Р В°РЎРѓРЎвЂ¦Р С•Р Т‘РЎРЏРЎвЂљРЎРѓРЎРЏ Р С—Р С• РЎРѓР Р…Р ВµР С–РЎС“.");
            openDuelResultModal({
                title: "Р СњР С‘РЎвЂЎРЎРЉРЎРЏ",
                copy: "Р СњР С‘Р С”РЎвЂљР С• Р Р…Р Вµ РЎРѓР СР С•Р С– Р Т‘Р С•Р В¶Р В°РЎвЂљРЎРЉ РЎР‚Р В°РЎС“Р Р…Р Т‘ Р Т‘Р С• Р С—Р С•Р В±Р ВµР Т‘РЎвЂ№.",
                experience: BATTLE_REWARD_EXPERIENCE,
                money: 0
            });
        } else if (duel.opponentHp === 0) {
            duel.finished = true;
            duel.resultText = "Р СџР С•Р В±Р ВµР Т‘Р В°. Р СџРЎР‚Р С•РЎвЂљР С‘Р Р†Р Р…Р С‘Р С” Р С—Р В°Р Т‘Р В°Р ВµРЎвЂљ Р Р† РЎРѓР Р…Р ВµР С–.";
            state.player.wins += 1;
            const rewardMoney = BATTLE_VICTORY_COINS;
            const rewardExperience = BATTLE_REWARD_EXPERIENCE;
            state.player.money += rewardMoney;
            applyLocalExperienceGain(rewardExperience);
            addJournal("Р СџР С•Р В±Р ВµР Т‘Р В° Р Р† Р В±Р С•РЎР‹. +" + rewardMoney + " Р СР С•Р Р…Р ВµРЎвЂљ Р С‘ +" + rewardExperience + " Р С•Р С—РЎвЂ№РЎвЂљР В°.");
            openDuelResultModal({
                title: "Р СћРЎвЂ№ Р С—Р С•Р В±Р ВµР Т‘Р С‘Р В»",
                copy: "Р СџР С•Р В±Р ВµР В¶Р Т‘Р ВµР Р… " + opponentName + ".",
                experience: rewardExperience,
                money: rewardMoney
            });
        } else if (duel.playerHp === 0) {
            duel.finished = true;
            duel.resultText = "Р СџР С•РЎР‚Р В°Р В¶Р ВµР Р…Р С‘Р Вµ. Р СџРЎР‚Р С‘РЎвЂ¦Р С•Р Т‘Р С‘РЎвЂљРЎРѓРЎРЏ Р С•РЎвЂљРЎРѓРЎвЂљРЎС“Р С—Р В°РЎвЂљРЎРЉ Р Р† РЎвЂљР ВµР СР Р…Р С•РЎвЂљРЎС“.";
            state.player.losses += 1;
            applyLocalExperienceGain(BATTLE_REWARD_EXPERIENCE);
            addJournal("Р СџР С•РЎР‚Р В°Р В¶Р ВµР Р…Р С‘Р Вµ Р Р† Р В±Р С•РЎР‹. Р СџРЎР‚Р С‘Р Т‘Р ВµРЎвЂљРЎРѓРЎРЏ Р С—Р ВµРЎР‚Р ВµР С–РЎР‚РЎС“Р С—Р С—Р С‘РЎР‚Р С•Р Р†Р В°РЎвЂљРЎРЉРЎРѓРЎРЏ Р С‘ Р Р†Р ВµРЎР‚Р Р…РЎС“РЎвЂљРЎРЉРЎРѓРЎРЏ Р С—Р С•Р В·Р В¶Р Вµ.");
            openDuelResultModal({
                title: "Р СћРЎвЂ№ Р С—РЎР‚Р С•Р С‘Р С–РЎР‚Р В°Р В»",
                copy: "Р СџР С•Р В±Р ВµР Т‘Р С‘Р В» " + opponentName + ".",
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
        const lineMatched = shotMatchesDodge(attackerAction.shot, defenderAction.dodge);
        if (!lineMatched && attackerAction.weapon !== "SHOTGUN") {
            lines.push(attackerName + " РЎС“Р Р†Р С•Р Т‘Р С‘РЎвЂљ Р Р†РЎвЂ№РЎРѓРЎвЂљРЎР‚Р ВµР В» Р СР С‘Р СР С• Р В»Р С‘Р Р…Р С‘Р С‘.");
            return { damage: 0, lines: lines };
        }
        if (lineMatched && shouldSupportEvade(attackerSide === "player" ? "opponent" : "player")) {
            lines.push(defenderName + " РЎС“РЎвЂ¦Р С•Р Т‘Р С‘РЎвЂљ Р С•РЎвЂљ РЎС“РЎР‚Р С•Р Р…Р В°.");
            return { damage: 0, lines: lines };
        }
        if (attackerAction.weapon === "PISTOLS") {
            if (projectileBlocked(attackerSide, defenderAction.weapon, attackerAction.weapon, attackerAction.shot)) {
                lines.push(defenderName + " Р В·Р В°Р С”РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљРЎРѓРЎРЏ РЎвЂ°Р С‘РЎвЂљР С•Р С Р С‘ Р В±Р В»Р С•Р С”Р С‘РЎР‚РЎС“Р ВµРЎвЂљ Р С—РЎС“Р В»РЎР‹.");
                return { damage: 0, lines: lines };
            }
            let damage = 18 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
            damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, false, lines, attackerSide === "player" ? "РЎРѓР С•Р С—Р ВµРЎР‚Р Р…Р С‘Р С”" : "РЎвЂљРЎвЂ№");
            lines.push(attackerName + " Р С—Р С•Р С—Р В°Р Т‘Р В°Р ВµРЎвЂљ Р С‘Р В· Р С—Р С‘РЎРѓРЎвЂљР С•Р В»РЎРЏ Р С‘ Р Р…Р В°Р Р…Р С•РЎРѓР С‘РЎвЂљ " + damage + " РЎС“РЎР‚Р С•Р Р…Р В°.");
            return { damage: damage, lines: lines };
        }
        if (attackerAction.weapon === "RIFLE") {
            let damage = 30 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
            damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, false, lines, attackerSide === "player" ? "РЎРѓР С•Р С—Р ВµРЎР‚Р Р…Р С‘Р С”" : "РЎвЂљРЎвЂ№");
            lines.push(attackerName + " Р С—Р С•Р С—Р В°Р Т‘Р В°Р ВµРЎвЂљ Р С‘Р В· Р Р†Р С‘Р Р…РЎвЂљР С•Р Р†Р С”Р С‘ Р С‘ РЎРѓРЎР‚Р ВµР В·Р В°Р ВµРЎвЂљ РЎвЂ°Р С‘РЎвЂљР С•Р Р†Р С•Р в„– Р В±Р В»Р С•Р С”.");
            return { damage: damage, lines: lines };
        }
        let pelletsHit = 0;
        let pelletsBlocked = 0;
        if (!lineMatched) {
            if (Math.random() < SHOTGUN_EDGE_GRAZE_CHANCE + getWeaponGrazeBonus(attackerSide, attackerAction.weapon)) {
                let edgeDamage = SHOTGUN_EDGE_DAMAGE + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
                edgeDamage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", edgeDamage, true, lines, attackerSide === "player" ? "РЎРѓР С•Р С—Р ВµРЎР‚Р Р…Р С‘Р С”" : "РЎвЂљРЎвЂ№");
                lines.push(attackerName + " РЎвЂ Р ВµР С—Р В»РЎРЏР ВµРЎвЂљ Р С”РЎР‚Р В°Р ВµР С Р С‘ Р Р…Р В°Р Р…Р С•РЎРѓР С‘РЎвЂљ " + edgeDamage + " РЎС“РЎР‚Р С•Р Р…Р В°.");
                return { damage: edgeDamage, lines: lines };
            }
            lines.push(attackerName + " Р Р…Р Вµ РЎвЂ Р ВµР С—Р В»РЎРЏР ВµРЎвЂљ РЎвЂ Р ВµР В»РЎРЉ Р Т‘РЎР‚Р С•Р В±РЎРЉРЎР‹.");
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
            lines.push(defenderName + " Р С—Р С•Р В»Р Р…Р С•РЎРѓРЎвЂљРЎРЉРЎР‹ Р С—Р ВµРЎР‚Р ВµР С”РЎР‚РЎвЂ№Р Р†Р В°Р ВµРЎвЂљ Р Т‘РЎР‚Р С•Р В±РЎРЉ РЎвЂ°Р С‘РЎвЂљР С•Р С.");
            return { damage: 0, lines: lines };
        }
        let damage = pelletsHit * 5 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
        damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, pelletsHit < 3, lines, attackerSide === "player" ? "РЎРѓР С•Р С—Р ВµРЎР‚Р Р…Р С‘Р С”" : "РЎвЂљРЎвЂ№");
        let summary = attackerName + " Р С—Р С•Р С—Р В°Р Т‘Р В°Р ВµРЎвЂљ " + pelletsHit + " Р Т‘РЎР‚Р С•Р В±Р С‘Р Р…Р В°Р СР С‘ Р С‘ Р Р…Р В°Р Р…Р С•РЎРѓР С‘РЎвЂљ " + damage + " РЎС“РЎР‚Р С•Р Р…Р В°.";
        if (pelletsBlocked) {
            summary += " Р В©Р С‘РЎвЂљ РЎРѓР Р…Р С‘Р СР В°Р ВµРЎвЂљ " + pelletsBlocked + " Р Т‘РЎР‚Р С•Р В±Р С‘Р Р….";
        }
        lines.push(summary);
        return { damage: damage, lines: lines };
    }

    function applySupportRegen(duel, lines) {
        return;
    }

    function shouldSupportEvade(side) {
        return false;
    }

    function projectileBlocked(attackerSide, defenderWeapon, weaponCode, shotCode) {
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
        return 0;
    }

    function getWeaponDamageBonus(side, weaponCode) {
        return side === "player" && hasAugment("weapon-overdrive") ? 5 : 0;
    }

    function rollWeaponGamble(side) {
        if (side !== "player" || !hasAugment("weapon-gamble")) {
            return { jammed: false, doubleDamage: false };
        }
        const jammed = Math.random() < 0.05;
        const doubleDamage = !jammed && Math.random() < 0.05;
        return { jammed: jammed, doubleDamage: doubleDamage };
    }

    function applyDefenseReduction(side, damage, isGraze, lines, defenderName) {
        const reduction = side === "player" && hasAugment("defense-plate") ? 3 : 0;
        if (reduction <= 0) {
            return damage;
        }
        const minimum = isGraze ? 1 : 0;
        const reducedDamage = Math.max(minimum, damage - reduction);
        if (reducedDamage < damage) {
            lines.push(defenderName + " СЃРЅРёР¶Р°РµС‚ СѓСЂРѕРЅ РЅР° " + (damage - reducedDamage) + ".");
        }
        return reducedDamage;
    }

    function getPlayerMaxHp() {
        return hasAugment("defense-vital") ? 115 : 100;
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
        elements.shopMoney.textContent = state.player.money + " Р СР С•Р Р…Р ВµРЎвЂљ";
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
        elements.queueStatusNote.textContent = state.matchmaking.message || "Р вЂ“Р Т‘РЎвЂР С РЎРѓР С•Р С—Р ВµРЎР‚Р Р…Р С‘Р С”Р В° Р Р† Р С•РЎвЂЎР ВµРЎР‚Р ВµР Т‘Р С‘.";
        elements.queueCancelButton.disabled = false;
    }

    function renderHeroStats() {
        if (!elements.heroStats || !elements.statPointsBadge) {
            return;
        }
        const stats = [
            { id: "strength", label: "Р РЋР С‘Р В»Р В°", value: state.player.strength || 0 },
            { id: "reaction", label: "Р В Р ВµР В°Р С”РЎвЂ Р С‘РЎРЏ", value: state.player.reaction || 0 },
            { id: "analysis", label: "Р С’Р Р…Р В°Р В»Р С‘Р В·", value: state.player.analysis || 0 }
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
            ? "Р вЂ™Р Р†Р ВµР Т‘Р С‘ Р Р…Р С‘Р С”Р Р…Р ВµР в„–Р С. Р вЂ™Р Р…Р Вµ Telegram Р С•Р Р… РЎРѓР С•РЎвЂ¦РЎР‚Р В°Р Р…Р С‘РЎвЂљРЎРѓРЎРЏ РЎвЂљР С•Р В»РЎРЉР С”Р С• Р Р† РЎРЊРЎвЂљР С•Р С Р В±РЎР‚Р В°РЎС“Р В·Р ВµРЎР‚Р Вµ."
            : "Р вЂ™Р Р†Р ВµР Т‘Р С‘ Р Р…Р С‘Р С”Р Р…Р ВµР в„–Р С. Р С’Р С”Р С”Р В°РЎС“Р Р…РЎвЂљ Р В±РЎС“Р Т‘Р ВµРЎвЂљ Р В·Р В°Р С”РЎР‚Р ВµР С—Р В»Р ВµР Р… Р В·Р В° РЎвЂљР Р†Р С•Р С‘Р С Telegram ID.";
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
            elements.questList.innerHTML = '<article class="quest-card"><p>Р С’Р С”РЎвЂљР С‘Р Р†Р Р…РЎвЂ№РЎвЂ¦ Р С”Р Р†Р ВµРЎРѓРЎвЂљР С•Р Р† Р Р…Р ВµРЎвЂљ. Р вЂќР Р…Р ВµР Р†Р Р…Р С‘Р С” РЎРѓР С”Р С•РЎР‚Р С• Р С—Р С•Р Т‘Р В±РЎР‚Р С•РЎРѓР С‘РЎвЂљ Р Р…Р С•Р Р†РЎС“РЎР‹ Р Р…Р В°Р Р†Р С•Р Т‘Р С”РЎС“.</p></article>';
            return;
        }
        elements.questList.innerHTML = quests.map(function (quest) {
            return [
                '<article class="quest-card">',
                "<h3>" + escapeHtml(quest.title) + "</h3>",
                "<p>" + escapeHtml(quest.description) + "</p>",
                '<div class="quest-chip-row"><span class="chip">' + escapeHtml(quest.location) + '</span><span class="timer-chip">' + escapeHtml(formatDuration(quest.expiresAt - Date.now())) + "</span></div>",
                '<div class="quest-actions"><button class="primary-button" data-action="open" data-quest-id="' + escapeHtml(quest.id) + '" type="button" onclick="window.PolusApp && window.PolusApp.openQuest(\'' + escapeJs(quest.id) + '\')">' + (quest.status === "inProgress" ? "Р СџРЎР‚Р С•Р Т‘Р С•Р В»Р В¶Р С‘РЎвЂљРЎРЉ" : "Р вЂ™РЎвЂ№Р С—Р С•Р В»Р Р…Р С‘РЎвЂљРЎРЉ") + '</button><button class="secondary-button" data-action="delay" data-quest-id="' + escapeHtml(quest.id) + '" type="button" onclick="window.PolusApp && window.PolusApp.delayQuest(\'' + escapeJs(quest.id) + '\')">Р С›РЎвЂљР В»Р С•Р В¶Р С‘РЎвЂљРЎРЉ</button></div>',
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
            elements.questDetailTitle.textContent = "Р СћР ВµР С”РЎРѓРЎвЂљР С•Р Р†РЎвЂ№Р в„– Р С”Р Р†Р ВµРЎРѓРЎвЂљ";
            elements.questDetailSubtitle.textContent = "Р вЂ™РЎвЂ№Р В±Р ВµРЎР‚Р С‘ Р С‘РЎРѓРЎвЂљР С•РЎР‚Р С‘РЎР‹ Р С‘Р В· РЎРѓР С—Р С‘РЎРѓР С”Р В°";
            elements.questStoryText.innerHTML = "<p>Р С›РЎвЂљР С”РЎР‚Р С•Р в„– Р С”Р Р†Р ВµРЎРѓРЎвЂљ, РЎвЂЎРЎвЂљР С•Р В±РЎвЂ№ РЎС“Р Р†Р С‘Р Т‘Р ВµРЎвЂљРЎРЉ РЎРѓРЎвЂ Р ВµР Р…РЎС“, Р Р†РЎвЂ№Р В±Р С•РЎР‚РЎвЂ№ Р С‘ Р С”Р В°РЎР‚Р СР В°Р Р…Р Р…РЎвЂ№Р в„– Р С‘Р Р…Р Р†Р ВµР Р…РЎвЂљР В°РЎР‚РЎРЉ.</p>";
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
                ? '<span class="text-negative">Р СњР Вµ РЎвЂ¦Р Р†Р В°РЎвЂљР В°Р ВµРЎвЂљ Р С—РЎР‚Р ВµР Т‘Р СР ВµРЎвЂљР В°.</span>'
                : missingStat
                    ? '<span class="text-negative">Р СњРЎС“Р В¶Р Р…Р С•: ' + escapeHtml(getStatLabel(choice.requiresStat)) + " " + escapeHtml(String(choice.requiresStatValue)) + ".</span>"
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
            elements.inventoryPlaceholder.innerHTML = "<h3>Р В Р В°Р В·Р Т‘Р ВµР В» Р Р† Р С—Р ВµРЎР‚Р ВµРЎР‚Р В°Р В±Р С•РЎвЂљР С”Р Вµ</h3><p>Р ВР Р…Р Р†Р ВµР Р…РЎвЂљР В°РЎР‚РЎРЉ Р С‘ Р В°РЎС“Р С–Р СР ВµР Р…РЎвЂљР В°РЎвЂ Р С‘Р С‘ Р Р†РЎР‚Р ВµР СР ВµР Р…Р Р…Р С• РЎРѓР С”РЎР‚РЎвЂ№РЎвЂљРЎвЂ№ Р Т‘Р С• РЎРѓР В»Р ВµР Т‘РЎС“РЎР‹РЎвЂ°Р ВµР в„– Р Р†Р ВµРЎР‚РЎРѓР С‘Р С‘.</p>";
        }
    }

    function renderFriends() {
        const requests = Array.isArray(state.friendRequests) ? state.friendRequests : [];
        const friends = getDisplayFriends();
        elements.friendRequestBadge.textContent = String(Math.min(9, requests.length));
        elements.friendRequestPanel.innerHTML = requests.length ? [
            '<section class="friend-request-stack">',
            '<div class="panel-header friend-subheader"><h3 class="panel-title panel-title-small">РџСЂРёРіР»Р°С€РµРЅРёСЏ</h3></div>',
            requests.map(function (request) {
                const online = request.status === "online";
                return [
                    '<article class="friend-card friend-request-card">',
                    '<h3>' + escapeHtml(request.name) + '</h3>',
                    '<div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'РћРЅР»Р°Р№РЅ' : 'РћС„С„Р»Р°Р№РЅ') + '</span><span class="timer-chip">РЈСЂРѕРІРµРЅСЊ ' + escapeHtml(String(request.level)) + '</span></div>',
                    '<div class="friend-actions">',
                    '<button class="primary-button full-width" type="button" data-request-accept-id="' + escapeHtml(request.id) + '">РџСЂРёРЅСЏС‚СЊ</button>',
                    '<button class="secondary-button full-width" type="button" data-request-reject-id="' + escapeHtml(request.id) + '">РћС‚РєР»РѕРЅРёС‚СЊ</button>',
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
                '<div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'РћРЅР»Р°Р№РЅ' : 'РћС„С„Р»Р°Р№РЅ') + '</span><span class="timer-chip">РЈСЂРѕРІРµРЅСЊ ' + escapeHtml(String(friend.level)) + '</span></div>',
                '<div class="friend-actions">',
                '<button class="secondary-button full-width" data-friend-chat-id="' + escapeHtml(friend.id) + '" type="button">РќР°РїРёСЃР°С‚СЊ СЃРѕРѕР±С‰РµРЅРёРµ</button>',
                '<button class="secondary-button full-width friend-action-profile" data-friend-profile-id="' + escapeHtml(friend.id) + '" type="button">РџРѕСЃРјРѕС‚СЂРµС‚СЊ РїСЂРѕС„РёР»СЊ</button>',
                '</div>',
                '</article>'
            ].join('');
        }).join('') : '<article class="friend-card"><p>РџРѕРєР° РЅРёРєРѕРіРѕ РЅРµС‚ РІ РґСЂСѓР·СЊСЏС…. РќР°Р№РґРё РёРіСЂРѕРєР° РїРѕ РЅРёРєРЅРµР№РјСѓ Рё РѕС‚РїСЂР°РІСЊ Р·Р°РїСЂРѕСЃ.</p></article>';
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
            elements.socialChatThreadList.innerHTML = '<article class="social-chat-empty">Р§Р°С‚С‹ РїРѕСЏРІСЏС‚СЃСЏ Р·РґРµСЃСЊ РїРѕСЃР»Рµ РїРµСЂРІРѕРіРѕ РґРёР°Р»РѕРіР° СЃ РґСЂСѓРіРѕРј.</article>';
            elements.socialChatThreadTitle.textContent = 'Р’С‹Р±РµСЂРё С‡Р°С‚';
            elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">РћС‚РєСЂРѕР№ С‡Р°С‚ С‡РµСЂРµР· РєР°СЂС‚РѕС‡РєСѓ РґСЂСѓРіР°.</div>';
            elements.socialChatInput.disabled = true;
            elements.socialChatSend.disabled = true;
            return;
        }

        elements.socialChatThreadList.innerHTML = threads.map(function (thread) {
            return [
                '<button class="social-chat-thread-card' + (activeThread && activeThread.id === thread.id ? ' is-active' : '') + '" type="button" data-social-thread-id="' + escapeHtml(thread.id) + '">',
                '<strong>' + escapeHtml(thread.friendName || 'Р”СЂСѓРі') + '</strong>',
                '<span>' + escapeHtml((thread.status === 'online' ? 'РћРЅР»Р°Р№РЅ' : 'РћС„С„Р»Р°Р№РЅ') + ' В· РЈСЂ. ' + (thread.level || 1)) + '</span>',
                '</button>'
            ].join('');
        }).join('');

        if (!activeThread) {
            elements.socialChatThreadTitle.textContent = 'Р’С‹Р±РµСЂРё С‡Р°С‚';
            elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Р’С‹Р±РµСЂРё РґРёР°Р»РѕРі СЃР»РµРІР°.</div>';
            elements.socialChatInput.disabled = true;
            elements.socialChatSend.disabled = true;
            return;
        }

        elements.socialChatThreadTitle.textContent = activeThread.friendName || 'Р”СЂСѓРі';
        elements.socialChatMessages.innerHTML = (activeThread.messages || []).map(function (message) {
            const own = message.author === 'you';
            return [
                '<div class="social-chat-message' + (own ? ' social-chat-message-own' : '') + '">',
                '<div class="social-chat-message-bubble">',
                '<strong>' + escapeHtml(own ? state.player.name : (activeThread.friendName || 'Р”СЂСѓРі')) + '</strong>',
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
                const priceLabel = item.section === "premium" ? item.price + " " + RUBLE_SIGN : item.price + " Р СР С•Р Р…Р ВµРЎвЂљ";
                const buttonLabel = item.section === "premium" ? "Р РЋР С”Р С•РЎР‚Р С•" : "Р С™РЎС“Р С—Р С‘РЎвЂљРЎРЉ";
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
            return '<div class="shop-preview shop-preview-skin shop-preview-' + escapeHtml(item.previewTone || "crimson") + '"><div class="shop-preview-avatar">Р В Р’В</div></div>';
        }
        return '<div class="shop-preview shop-preview-backdrop shop-preview-' + escapeHtml(item.previewTone || "polar") + '"></div>';
    }

    function openAugmentPicker(slot) {
        showToast("Р С’РЎС“Р С–Р СР ВµР Р…РЎвЂљР В°РЎвЂ Р С‘Р С‘ Р Р†РЎР‚Р ВµР СР ВµР Р…Р Р…Р С• РЎРѓР С”РЎР‚РЎвЂ№РЎвЂљРЎвЂ№ Р Т‘Р С• Р С—Р ВµРЎР‚Р ВµРЎР‚Р В°Р В±Р С•РЎвЂљР С”Р С‘.");
    }

    function closeAugmentPicker() {
        state.ui.augmentPickerSlot = null;
    }

    function selectAugment(augmentId) {
        showToast("Р С’РЎС“Р С–Р СР ВµР Р…РЎвЂљР В°РЎвЂ Р С‘Р С‘ Р Р†РЎР‚Р ВµР СР ВµР Р…Р Р…Р С• РЎРѓР С”РЎР‚РЎвЂ№РЎвЂљРЎвЂ№ Р Т‘Р С• Р С—Р ВµРЎР‚Р ВµРЎР‚Р В°Р В±Р С•РЎвЂљР С”Р С‘.");
    }

    function setShopSection(section) {
        state.ui.shopSection = ["weapon", "defense"].indexOf(section) >= 0 ? section : "weapon";
        saveState();
        renderShop();
    }

    function viewFriendProfile(friendId) {
        const friend = getFriendById(friendId);
        if (!friend) {
            return;
        }
        showToast(friend.name + " Р’В· РЎС“РЎР‚Р С•Р Р†Р ВµР Р…РЎРЉ " + friend.level + " Р’В· " + (friend.status === "online" ? "Р С•Р Р…Р В»Р В°Р в„–Р Р…" : "Р С•РЎвЂћРЎвЂћР В»Р В°Р в„–Р Р…") + ".");
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
        elements.duelTitle.textContent = "Р вЂќРЎС“РЎРЊР В»РЎРЉ";
        elements.duelRoundPill.textContent = "Р В Р’В Р В Р’В°Р РЋРЎвЂњР В Р вЂ¦Р В РўвЂ " + duel.round;
        elements.duelRoundTimer.textContent = formatDuration(getRoundTimeRemainingMs(duel));
        elements.duelYouName.textContent = duel.playerName || "Р ВР С–РЎР‚Р С•Р С”";
        elements.duelYouMeta.textContent = "";
        elements.duelYouAvatar.textContent = (duel.playerName || "Р СћРЎвЂ№").slice(0, 1).toUpperCase();
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
            ? "Р вЂР С•Р в„– Р В·Р В°Р Р†Р ВµРЎР‚РЎв‚¬Р ВµР Р…"
            : duel.yourActionSubmitted
                ? (duelHasPendingChanges ? "Р ВР В·Р СР ВµР Р…Р С‘РЎвЂљРЎРЉ РЎвЂ¦Р С•Р Т‘" : "Р ТђР С•Р Т‘ РЎРѓР Т‘Р ВµР В»Р В°Р Р…")
                : "Р РЋР Т‘Р ВµР В»Р В°РЎвЂљРЎРЉ РЎвЂ¦Р С•Р Т‘";
        elements.duelSubmitButton.textContent = submitButtonLabel;
        elements.duelSubmitButton.disabled = duel.finished
            || duel.autoBattleEnabled
            || !duel.canSubmitAction
            || !duelSelectionComplete
            || (duel.yourActionSubmitted && !duelHasPendingChanges);
        renderDuelControls();
        if (!duel.logs.length) {
            elements.duelLogList.innerHTML = '<div class="duel-log-round"><p class="duel-log-round-title">Р вЂєРЎвЂР Т‘ Р СР С•Р В»РЎвЂЎР С‘РЎвЂљ. Р СџР ВµРЎР‚Р Р†РЎвЂ№Р в„– РЎР‚Р В°Р В·Р СР ВµР Р… Р ВµРЎвЂ°Р Вµ Р Р…Р Вµ Р С—РЎР‚Р С•Р С‘Р В·Р С•РЎв‚¬Р ВµР В».</p></div>';
        } else {
            elements.duelLogList.innerHTML = duel.logs.slice().reverse().map(function (entry) {
                const roundNumber = typeof entry.round === "number" ? entry.round : entry.roundNumber;
                const lines = Array.isArray(entry.lines) ? entry.lines : [];
                const title = lines.length ? lines[0] : "Р В Р’В Р В Р’В°Р РЋРЎвЂњР В Р вЂ¦Р В РўвЂ " + roundNumber;
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
            state.duel.resultText = "Р РЋР С•Р В±Р ВµРЎР‚Р С‘ РЎвЂ¦Р С•Р Т‘ Р Р…Р В° РЎР‚Р В°РЎС“Р Р…Р Т‘ Р С‘ Р С—РЎР‚Р С•Р Т‘Р В°Р Р†Р С‘ Р В»Р С‘Р Р…Р С‘РЎР‹ РЎРѓР С•Р С—Р ВµРЎР‚Р Р…Р С‘Р С”Р В°.";
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
            elements.duelAutoToggle.textContent = "Р вЂ™Р С”Р В»РЎР‹РЎвЂЎР С‘РЎвЂљРЎРЉ Р В°Р Р†РЎвЂљР С•Р СР В°РЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С‘Р в„– Р В±Р С•Р в„–";
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
        elements.duelAutoToggle.textContent = currentEnabled ? "Р вЂ™РЎвЂ№Р С”Р В»РЎР‹РЎвЂЎР С‘РЎвЂљРЎРЉ Р В°Р Р†РЎвЂљР С•Р В±Р С•Р в„–" : "Р вЂ™Р С”Р В»РЎР‹РЎвЂЎР С‘РЎвЂљРЎРЉ Р В°Р Р†РЎвЂљР С•Р СР В°РЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С‘Р в„– Р В±Р С•Р в„–";
        const note = currentEnabled
            ? (pendingEnabled === false ? "Р РЋР С• РЎРѓР В»Р ВµР Т‘РЎС“РЎР‹РЎвЂ°Р ВµР С–Р С• РЎР‚Р В°РЎС“Р Р…Р Т‘Р В° Р В°Р Р†РЎвЂљР С•Р В±Р С•Р в„– Р С•РЎвЂљР С”Р В»РЎР‹РЎвЂЎР С‘РЎвЂљРЎРѓРЎРЏ." : "Р С’Р Р†РЎвЂљР С•Р В±Р С•Р в„– Р Р†Р С”Р В»РЎР‹РЎвЂЎР ВµР Р….")
            : (pendingEnabled === true ? "Р РЋР С• РЎРѓР В»Р ВµР Т‘РЎС“РЎР‹РЎвЂ°Р ВµР С–Р С• РЎР‚Р В°РЎС“Р Р…Р Т‘Р В° РЎвЂ¦Р С•Р Т‘РЎвЂ№ Р В±РЎС“Р Т‘РЎС“РЎвЂљ Р В°Р Р†РЎвЂљР С•Р СР В°РЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С‘Р СР С‘." : "");
        elements.duelAutoNote.textContent = note;
        elements.duelAutoNote.classList.toggle("hidden", !note);
        elements.duelAutoCover.classList.toggle("hidden", !currentEnabled || duel.finished);
    }

    function renderDuelChat(duel) {
        const isLiveChat = duel.mode === "pvp-live";
        const canWrite = isLiveChat && !duel.finished;
        const messages = duel.chatMessages || [];
        if (!messages.length) {
            elements.duelChatList.innerHTML = '<div class="duel-chat-entry"><p class="duel-chat-text">' + (isLiveChat ? "Р В§Р В°РЎвЂљ Р С—Р С•Р С”Р В° Р СР С•Р В»РЎвЂЎР С‘РЎвЂљ. Р СџР ВµРЎР‚Р Р†РЎвЂ№Р в„– РЎвЂ¦Р С•Р Т‘ Р С‘Р В»Р С‘ Р С—Р ВµРЎР‚Р Р†Р С•Р Вµ РЎРѓР В»Р С•Р Р†Р С• РІР‚вЂќ Р В·Р В° Р Р†Р В°Р СР С‘." : "Р В§Р В°РЎвЂљ Р Т‘Р С•РЎРѓРЎвЂљРЎС“Р С—Р ВµР Р… РЎвЂљР С•Р В»РЎРЉР С”Р С• Р Р† PvP-Р СР В°РЎвЂљРЎвЂЎР Вµ Р СР ВµР В¶Р Т‘РЎС“ Р Т‘Р Р†РЎС“Р СРЎРЏ Р С‘Р С–РЎР‚Р С•Р С”Р В°Р СР С‘.") + "</p></div>";
        } else {
            elements.duelChatList.innerHTML = messages.map(function (message) {
                const own = message.playerId && state.auth && message.playerId === state.auth.playerId;
                const systemMessage = Boolean(message.systemMessage);
                const infoMessage = systemMessage && /Р В°Р Р†РЎвЂљР С•Р СР В°РЎвЂљ/i.test(String(message.text || ""));
                const extraClass = systemMessage ? (infoMessage ? " duel-chat-entry-info" : " duel-chat-entry-system") : (own ? " duel-chat-entry-own" : "");
                return '<div class="duel-chat-entry' + extraClass + '"><p class="duel-chat-meta">' + escapeHtml(message.displayName || "Р ВР С–РЎР‚Р С•Р С”") + " Р’В· " + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</p><p class="duel-chat-text">' + escapeHtml(message.text || "") + "</p></div>";
            }).join("");
        }
        elements.duelChatInput.disabled = !canWrite;
        elements.duelChatSendButton.disabled = !canWrite;
        elements.duelChatInput.placeholder = canWrite ? "Р СњР В°Р С—Р С‘РЎв‚¬Р С‘ РЎРѓР С•Р С•Р В±РЎвЂ°Р ВµР Р…Р С‘Р Вµ РЎРѓР С•Р С—Р ВµРЎР‚Р Р…Р С‘Р С”РЎС“" : "Р В§Р В°РЎвЂљ Р Р…Р ВµР Т‘Р С•РЎРѓРЎвЂљРЎС“Р С—Р ВµР Р…";
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
            state.duel.chatError = "Р РЋРЎРѓРЎвЂ№Р В»Р С”Р В° Р В·Р В°Р С—РЎР‚Р ВµРЎвЂ°Р ВµР Р…Р В° Р Р† Р В±Р С•Р ВµР Р†Р С•Р С РЎвЂЎР В°РЎвЂљР Вµ.";
            renderDuel();
            return;
        }
        if (state.duel.mode !== "pvp-live" || !state.duel.duelId) {
            state.duel.chatError = "Р В§Р В°РЎвЂљ Р Т‘Р С•РЎРѓРЎвЂљРЎС“Р С—Р ВµР Р… РЎвЂљР С•Р В»РЎРЉР С”Р С• Р Р† PvP-Р СР В°РЎвЂљРЎвЂЎР Вµ.";
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
            state.duel.chatError = error && error.message ? error.message : "Р СњР Вµ РЎС“Р Т‘Р В°Р В»Р С•РЎРѓРЎРЉ Р С•РЎвЂљР С—РЎР‚Р В°Р Р†Р С‘РЎвЂљРЎРЉ РЎРѓР С•Р С•Р В±РЎвЂ°Р ВµР Р…Р С‘Р Вµ.";
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
            return "Р В­РЎвЂљР С•РЎвЂљ РЎР‚Р В°РЎС“Р Р…Р Т‘ Р С‘Р Т‘Р ВµРЎвЂљ Р В°Р Р†РЎвЂљР С•Р СР В°РЎвЂљР С‘РЎвЂЎР ВµРЎРѓР С”Р С‘.";
        }
        if (duel.mode === "pvp-live") {
            if (duel.yourActionSubmitted) {
                return hasPendingDuelChanges(duel)
                    ? "Р ТђР С•Р Т‘ РЎРѓР С•РЎвЂ¦РЎР‚Р В°Р Р…Р ВµР Р…. Р СљР С•Р В¶Р Р…Р С• Р С‘Р В·Р СР ВµР Р…Р С‘РЎвЂљРЎРЉ Р ВµР С–Р С•, Р С—Р С•Р С”Р В° Р Р…Р Вµ Р С‘РЎРѓРЎвЂљР ВµР С” РЎвЂљР В°Р в„–Р СР ВµРЎР‚ РЎР‚Р В°РЎС“Р Р…Р Т‘Р В°."
                    : "Р ТђР С•Р Т‘ Р В·Р В°РЎвЂћР С‘Р С”РЎРѓР С‘РЎР‚Р С•Р Р†Р В°Р Р…. Р вЂ“Р Т‘Р ВµР С Р С—РЎР‚Р С•РЎвЂљР С‘Р Р†Р Р…Р С‘Р С”Р В°.";
            }
            if (typeof duel.autoBattlePendingEnabled === "boolean") {
                return duel.autoBattlePendingEnabled
                    ? "Р С’Р Р†РЎвЂљР С•Р В±Р С•Р в„– Р Р†Р С”Р В»РЎР‹РЎвЂЎР С‘РЎвЂљРЎРѓРЎРЏ РЎРѓР С• РЎРѓР В»Р ВµР Т‘РЎС“РЎР‹РЎвЂ°Р ВµР С–Р С• РЎР‚Р В°РЎС“Р Р…Р Т‘Р В°."
                    : "Р С’Р Р†РЎвЂљР С•Р В±Р С•Р в„– Р С•РЎвЂљР С”Р В»РЎР‹РЎвЂЎР С‘РЎвЂљРЎРѓРЎРЏ РЎРѓР С• РЎРѓР В»Р ВµР Т‘РЎС“РЎР‹РЎвЂ°Р ВµР С–Р С• РЎР‚Р В°РЎС“Р Р…Р Т‘Р В°.";
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
        elements.startDuelTitle.textContent = config.title || "Р СњР В°РЎвЂЎР В°РЎвЂљРЎРЉ Р В±Р С•Р в„–?";
        elements.startDuelCopy.textContent = config.copy || "Р СџР С•Р Т‘РЎвЂљР Р†Р ВµРЎР‚Р Т‘Р С‘, РЎвЂЎРЎвЂљР С• РЎвЂ¦Р С•РЎвЂЎР ВµРЎв‚¬РЎРЉ Р Р…Р В°РЎвЂЎР В°РЎвЂљРЎРЉ Р В±Р С•Р в„–.";
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
        elements.duelResultTitle.textContent = result.title || "Р вЂР С•Р в„– Р В·Р В°Р Р†Р ВµРЎР‚РЎв‚¬Р ВµР Р…";
        elements.duelResultCopy.textContent = result.copy || "";
        elements.duelResultExp.textContent = formatSignedReward(result.experience || 0, " Р С•Р С—РЎвЂ№РЎвЂљР В°");
        elements.duelResultMoney.textContent = formatSignedReward(result.money || 0, " Р СР С•Р Р…Р ВµРЎвЂљ");
    }

    function openDuelResultModal(config) {
        state.ui.duelExitConfirmOpen = false;
        state.ui.duelResult = {
            title: config.title || "Р вЂР С•Р в„– Р В·Р В°Р Р†Р ВµРЎР‚РЎв‚¬Р ВµР Р…",
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
            showToast("РЎРЅР°С‡Р°Р»Р° РІС‹Р±РµСЂРё РѕСЂСѓР¶РёРµ, РІС‹СЃС‚СЂРµР» Рё СѓРІРѕСЂРѕС‚.");
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
                addJournal("Р СћРЎвЂ№ Р С—Р С•Р С”Р С‘Р Р…РЎС“Р В» Р В±Р С•Р в„–. Р вЂ”Р В°РЎРѓРЎвЂЎР С‘РЎвЂљР В°Р Р…Р С• Р В°Р Р†РЎвЂљР С•Р С—Р С•РЎР‚Р В°Р В¶Р ВµР Р…Р С‘Р Вµ.");
                state.matchmaking.status = "COMPLETED";
                state.matchmaking.duelId = null;
                await refreshLiveDuel(duelId);
                return;
            }

            const duel = state.duel;
            const opponentName = duel.opponentName || "Р РЋР С•Р С—Р ВµРЎР‚Р Р…Р С‘Р С”";
            duel.finished = true;
            duel.playerHp = 0;
            duel.resultText = "Р СџР С•РЎР‚Р В°Р В¶Р ВµР Р…Р С‘Р Вµ. Р вЂР С•Р в„– Р С•РЎРѓРЎвЂљР В°Р Р…Р С•Р Р†Р В»Р ВµР Р… Р Т‘Р С• РЎРѓР В»Р ВµР Т‘РЎС“РЎР‹РЎвЂ°Р ВµР С–Р С• Р Р†РЎвЂ№РЎвЂ¦Р С•Р Т‘Р В°.";
            state.player.losses += 1;
            applyLocalExperienceGain(BATTLE_REWARD_EXPERIENCE);
            duel.logs.push({
                round: duel.round,
                lines: [
                    "Р В Р В°РЎС“Р Р…Р Т‘ " + duel.round + ": " + (duel.playerName || "Р ВР С–РЎР‚Р С•Р С”") + " Р С—Р С•Р С”Р С‘Р Т‘Р В°Р ВµРЎвЂљ Р В±Р С•Р в„–.",
                    "Р ВРЎвЂљР С•Р С–: " + opponentName + " Р С—Р С•Р В»РЎС“РЎвЂЎР В°Р ВµРЎвЂљ Р В°Р Р†РЎвЂљР С•Р С—Р С•Р В±Р ВµР Т‘РЎС“."
                ]
            });
            addJournal("Р С’Р Р†РЎвЂљР С•Р С—Р С•РЎР‚Р В°Р В¶Р ВµР Р…Р С‘Р Вµ Р Р† Р Т‘РЎС“РЎРЊР В»Р С‘ Р В·Р В°РЎРѓРЎвЂЎР С‘РЎвЂљР В°Р Р…Р С•.");
            openDuelResultModal({
                title: "Р СћРЎвЂ№ Р С—РЎР‚Р С•Р С‘Р С–РЎР‚Р В°Р В»",
                copy: "Р СџР С•Р В±Р ВµР Т‘Р С‘Р В» " + opponentName + ".",
                experience: BATTLE_REWARD_EXPERIENCE,
                money: 0
            });
            saveState();
            renderAll();
        } catch (error) {
            showToast(error && error.message ? error.message : "Р СњР Вµ РЎС“Р Т‘Р В°Р В»Р С•РЎРѓРЎРЉ Р С—Р С•Р С”Р С‘Р Р…РЎС“РЎвЂљРЎРЉ Р В±Р С•Р в„–.");
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
            familyRelic: { title: "Р РЋР ВµР СР ВµР в„–Р Р…Р В°РЎРЏ РЎР‚Р ВµР В»Р С‘Р С”Р Р†Р С‘РЎРЏ", description: "Р СћРЎР‚Р В°Р С”РЎвЂљР С‘РЎР‚РЎвЂ°Р С‘Р С” Р С—РЎР‚Р С•РЎРѓР С‘РЎвЂљ Р Р†Р ВµРЎР‚Р Р…РЎС“РЎвЂљРЎРЉ Р В·Р В°Р С—Р ВµРЎР‚РЎвЂљРЎС“РЎР‹ РЎв‚¬Р С”Р В°РЎвЂљРЎС“Р В»Р С”РЎС“ Р С‘Р В· Р С”Р В»Р В°Р Т‘Р С•Р Р†Р С•Р в„–. Р вЂ™Р Р…РЎС“РЎвЂљРЎР‚Р С‘ РЎвЂЎРЎвЂљР С•-РЎвЂљР С• Р Р†Р В°Р В¶Р Р…Р С•Р Вµ.", location: "Р СћРЎР‚Р В°Р С”РЎвЂљР С‘РЎР‚ Р’В«Р РЋР ВµР Р†Р ВµРЎР‚Р Р…РЎвЂ№Р в„– Р вЂ™Р ВµРЎвЂљР ВµРЎР‚Р’В»" },
            brassDisease: { title: "Р вЂєР В°РЎвЂљРЎС“Р Р…Р Р…Р В°РЎРЏ Р В±Р С•Р В»Р ВµР В·Р Р…РЎРЉ", description: "Р СљР ВµРЎвЂ¦Р В°Р Р…Р С‘Р С” Р С—РЎР‚Р С•РЎРѓР С‘РЎвЂљ Р С—РЎР‚Р С‘Р Р…Р ВµРЎРѓРЎвЂљР С‘ РЎв‚¬Р ВµРЎРѓРЎвЂљР ВµРЎР‚Р Р…РЎР‹. Р вЂўР С–Р С• Р В°Р Р†РЎвЂљР С•Р СР В°РЎвЂљ Р В·Р В°Р ВµР Т‘Р В°Р ВµРЎвЂљ, Р В° Р СР В°РЎРѓРЎвЂљР ВµРЎР‚РЎРѓР С”Р В°РЎРЏ РЎРѓРЎвЂљРЎвЂ№Р Р…Р ВµРЎвЂљ.", location: "Р СљР В°РЎРѓРЎвЂљР ВµРЎР‚РЎРѓР С”Р В°РЎРЏ Р Р…Р В° Р В»РЎРЉР Т‘РЎС“" },
            signalE3: { title: "Р РЋР С‘Р С–Р Р…Р В°Р В» E3", description: "Р РЋР В»Р В°Р В±РЎвЂ№Р в„– Р В°Р Р†Р В°РЎР‚Р С‘Р в„–Р Р…РЎвЂ№Р в„– Р СР В°РЎРЏР С” Р СР С‘Р С–Р В°Р ВµРЎвЂљ Р В·Р В° Р В»Р С‘Р Р…Р С‘Р ВµР в„– Р С—РЎР‚Р С•Р Р†Р С•Р Т‘Р С•Р Р†. Р СћР В°Р С Р С‘Р В»Р С‘ Р С”Р С•Р Р…РЎвЂљР ВµР в„–Р Р…Р ВµРЎР‚, Р С‘Р В»Р С‘ Р В»Р С•Р Р†РЎС“РЎв‚¬Р С”Р В°.", location: "Р вЂєР ВµР Т‘РЎРЏР Р…Р С•Р в„– Р С”Р С•РЎР‚Р С‘Р Т‘Р С•РЎР‚" },
            frostDebt: { title: "Р РЋР Р…Р ВµР С–Р С•Р Р†Р С•Р в„– Р Т‘Р С•Р В»Р С–", description: "Р РЋР Р†Р ВµР В¶Р В°РЎРЏ Р СР ВµРЎвЂљР С”Р В° Р Р…Р В° Р Т‘Р Р†Р ВµРЎР‚Р С‘ РЎРѓР С”Р В»Р В°Р Т‘Р В° Р С•Р В±Р ВµРЎвЂ°Р В°Р ВµРЎвЂљ РЎвЂљР В°Р в„–Р Р…Р С‘Р С” Р С‘ Р Р…Р ВµР С—РЎР‚Р С‘РЎРЏРЎвЂљР Р…Р С•РЎРѓРЎвЂљР С‘.", location: "Р РЋР С”Р В»Р В°Р Т‘ РЎС“ РЎвЂљР С•РЎР‚Р С•РЎРѓР С•Р Р†" }
        }[storyId];
        return { id: uid("quest"), storyId: storyId, nodeId: "start", title: template.title, description: template.description, location: template.location, status: "new", expiresAt: Date.now() + durationMs };
    }

    function buildShopCatalog() {
        return [
            { id: "shop-medkit", section: "standard", kind: "item", itemId: "medkit", name: "Р С’Р С—РЎвЂљР ВµРЎвЂЎР С”Р В°", description: "Р вЂР С‘Р Р…РЎвЂљРЎвЂ№, РЎРѓРЎвЂљР С‘Р С Р С‘ Р В·Р В°Р С—Р В°РЎРѓ Р С—РЎР‚Р С•РЎвЂЎР Р…Р С•РЎРѓРЎвЂљР С‘ Р Р…Р В° Р С•Р Т‘Р С‘Р Р… Р С–РЎР‚РЎРЏР В·Р Р…РЎвЂ№Р в„– Р В±Р С•Р в„–.", price: 20 },
            { id: "shop-gear", section: "standard", kind: "item", itemId: "brassGear", name: "Р вЂєР В°РЎвЂљРЎС“Р Р…Р Р…Р В°РЎРЏ РЎв‚¬Р ВµРЎРѓРЎвЂљР ВµРЎР‚Р Р…РЎРЏ", description: "Р В Р ВµР Т‘Р С”Р В°РЎРЏ Р Т‘Р ВµРЎвЂљР В°Р В»РЎРЉ Р Т‘Р В»РЎРЏ Р С”Р Р†Р ВµРЎРѓРЎвЂљР С•Р Р†, РЎР‚Р ВµР СР С•Р Р…РЎвЂљР В° Р С‘ РЎвЂљР ВµРЎвЂ¦, Р С”РЎвЂљР С• Р Р†Р ВµРЎвЂЎР Р…Р С• РЎвЂЎРЎвЂљР С•-РЎвЂљР С• РЎвЂЎР С‘Р Р…Р С‘РЎвЂљ.", price: 18 },
            { id: "shop-ammo", section: "standard", kind: "item", itemId: "cartridges38", name: "Р СџР В°РЎвЂљРЎР‚Р С•Р Р…РЎвЂ№ .38", description: "Р РЋРЎС“РЎвЂ¦Р С‘Р Вµ, РЎвЂЎР С‘РЎРѓРЎвЂљРЎвЂ№Р Вµ Р С‘ Р С—Р С•Р С”Р В° Р ВµРЎвЂ°Р Вµ РЎвЂљР ВµР С—Р В»РЎвЂ№Р Вµ.", price: 9 },
            { id: "premium-skin-crimson", section: "premium", kind: "premium", name: "Р РЋР С”Р С‘Р Р… Р’В«Р вЂР В°Р С–РЎР‚РЎРЏР Р…РЎвЂ№Р в„– Р С”Р С•Р В±Р В°Р В»РЎРЉРЎвЂљР’В»", description: "Р СџРЎР‚Р ВµР СР С‘Р В°Р В»РЎРЉР Р…РЎвЂ№Р в„– РЎРѓР С”Р С‘Р Р… Р С”Р В°РЎР‚РЎвЂљР С•РЎвЂЎР С”Р С‘ Р Т‘РЎС“РЎРЊР В»РЎРЏР Р…РЎвЂљР В° РЎРѓ РЎР‚РЎС“Р В±Р С‘Р Р…Р С•Р Р†РЎвЂ№Р С РЎРѓР Р†Р ВµРЎвЂЎР ВµР Р…Р С‘Р ВµР С.", price: 149, previewType: "skin", previewTone: "crimson" },
            { id: "premium-backdrop-polar", section: "premium", kind: "premium", name: "Р В¤Р С•Р Р… Р’В«Р СџР С•Р В»РЎРЏРЎР‚Р Р…Р В°РЎРЏ Р В»Р В°РЎвЂљРЎС“Р Р…РЎРЉР’В»", description: "Р СџРЎР‚Р ВµР СР С‘Р В°Р В»РЎРЉР Р…РЎвЂ№Р в„– РЎвЂћР С•Р Р… РЎвЂ¦Р В°Р В±Р В° РЎРѓ РЎвЂ¦Р С•Р В»Р С•Р Т‘Р Р…Р С•Р в„– Р В»Р В°РЎвЂљРЎС“Р Р…РЎРЉРЎР‹ Р С‘ Р СРЎРЏР С–Р С”Р С‘Р С РЎРѓР Р…Р ВµР С–Р С•Р Р†РЎвЂ№Р С РЎРѓР Р†Р ВµРЎвЂЎР ВµР Р…Р С‘Р ВµР С.", price: 199, previewType: "backdrop", previewTone: "polar" }
        ];
    }

    function hydrateState(source) {
        const next = source && typeof source === "object" ? source : buildInitialState();
        next.version = 15;
        next.player = Object.assign({ name: "РќРѕРІС‹Р№ РёРіСЂРѕРє", level: 1, experience: 0, levelProgressCurrent: 0, levelProgressTarget: 100, money: 0, wins: 0, losses: 0, strength: 0, reaction: 0, analysis: 0, availableStatPoints: 0 }, next.player || {});
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
            player: { name: "РќРѕРІС‹Р№ РёРіСЂРѕРє", level: 1, experience: 0, levelProgressCurrent: 0, levelProgressTarget: 100, money: 0, wins: 0, losses: 0, strength: 0, reaction: 0, analysis: 0, availableStatPoints: 0 },
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
            PISTOLS: "Р С‘Р В· Р С—Р С‘РЎРѓРЎвЂљР С•Р В»РЎРЏ Р С‘ РЎвЂ°Р С‘РЎвЂљР В°",
            RIFLE: "Р С‘Р В· Р Р†Р С‘Р Р…РЎвЂљР С•Р Р†Р С”Р С‘",
            SHOTGUN: "Р С‘Р В· Р Т‘РЎР‚Р С•Р В±Р С•Р Р†Р С‘Р С”Р В°"
        }[code] || "";
    }

    function directionLabel(code) {
        return { LEFT: "Р Р†Р В»Р ВµР Р†Р С•", CENTER: "Р С—Р С• РЎвЂ Р ВµР Р…РЎвЂљРЎР‚РЎС“", RIGHT: "Р Р†Р С—РЎР‚Р В°Р Р†Р С•" }[code] || code;
    }

    function dodgeLabel(code) {
        return { LEFT: "РЎРѓР СР ВµРЎвЂ°Р В°Р ВµРЎвЂљРЎРѓРЎРЏ Р Р†Р В»Р ВµР Р†Р С•", STAY: "Р С•РЎРѓРЎвЂљР В°Р ВµРЎвЂљРЎРѓРЎРЏ Р С—Р С• РЎвЂ Р ВµР Р…РЎвЂљРЎР‚РЎС“", RIGHT: "РЎРѓР СР ВµРЎвЂ°Р В°Р ВµРЎвЂљРЎРѓРЎРЏ Р Р†Р С—РЎР‚Р В°Р Р†Р С•" }[code] || code;
    }

    function shotMatchesDodge(shot, dodge) {
        return shot === (dodge === "STAY" ? "CENTER" : dodge);
    }

    function buildDuelIntentLine(name, action) {
        return name + " РЎРѓРЎвЂљРЎР‚Р ВµР В»РЎРЏР ВµРЎвЂљ " + directionLabel(action.shot) + " " + weaponInstrumentLabel(action.weapon) + " Р С‘ " + dodgeLabel(action.dodge) + ".";
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
            return count + " Р РЋР вЂљР В Р’В°Р В Р’В·";
        }
        if (remainderTen >= 2 && remainderTen <= 4 && (remainderHundred < 12 || remainderHundred > 14)) {
            return count + " Р РЋР вЂљР В Р’В°Р В Р’В·Р В Р’В°";
        }
        return count + " Р РЋР вЂљР В Р’В°Р В Р’В·";
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
            return totalSeconds + " РЎРѓР ВµР С”";
        }
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return minutes + " Р СР С‘Р Р… " + pad(seconds) + " РЎРѓР ВµР С”";
    }

    function formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    }

    function hasForbiddenLink(text) {
        return CHAT_LINK_PATTERN.test(String(text || ""));
    }

    function getStatLabel(stat) {
        return {
            strength: "Р РЋР С‘Р В»Р В°",
            reaction: "Р В Р ВµР В°Р С”РЎвЂ Р С‘РЎРЏ",
            analysis: "Р С’Р Р…Р В°Р В»Р С‘Р В·"
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
            .replace(new RegExp("([+-]?\\d+)\\s*" + escapeRegExp(RUBLE_SIGN), "g"), "$1 Р СР С•Р Р…Р ВµРЎвЂљ")
            .replace(/([+-]?\d+)\s*Р Р†РІР‚С™Р вЂ¦/g, "$1 Р СР С•Р Р…Р ВµРЎвЂљ");
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
            player: { name: "РќРѕРІС‹Р№ РёРіСЂРѕРє", money: 0, rating: 0, wins: 0, losses: 0 },
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
            return totalSeconds + " СЃРµРє";
        }
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return minutes + " РјРёРЅ " + pad(seconds) + " СЃРµРє";
    }

    function getStatLabel(stat) {
        return {
            strength: "РЎРёР»Р°",
            reaction: "Р РµР°РєС†РёСЏ",
            analysis: "РђРЅР°Р»РёР·"
        }[stat] || stat;
    }

    function normalizeResourceText(text) {
        return String(text)
            .replace(new RegExp("([+-]?\\d+)\\s*" + escapeRegExp(RUBLE_SIGN), "g"), "$1 РјРѕРЅРµС‚")
            .replace(/([+-]?\d+)\s*в‚Ѕ/g, "$1 РјРѕРЅРµС‚");
    }

    function renderProfile() {
        elements.profileName.textContent = state.player.name;
        elements.profileLevel.textContent = String(state.player.level);
        elements.profileMoney.textContent = formatMoney(state.player.money);
        elements.shopMoney.textContent = state.player.money + " РјРѕРЅРµС‚";
        elements.profileAvatar.textContent = (state.player.name || "Р").slice(0, 1).toUpperCase();
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
            elements.inventoryPlaceholder.innerHTML = "<h3>Р Р°Р·РґРµР» РІ РїРµСЂРµСЂР°Р±РѕС‚РєРµ</h3><p>РРЅРІРµРЅС‚Р°СЂСЊ Рё Р°СѓРіРјРµРЅС‚Р°С†РёРё РІСЂРµРјРµРЅРЅРѕ СЃРєСЂС‹С‚С‹. РњС‹ СЃРѕР±РµСЂРµРј РёС… Р·Р°РЅРѕРІРѕ СЃ РЅРѕРІРѕР№ СЃС‚СЂСѓРєС‚СѓСЂРѕР№.</p>";
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
            ? "Р’РІРµРґРё РЅРёРєРЅРµР№Рј. Р’РЅРµ Telegram РѕРЅ СЃРѕС…СЂР°РЅРёС‚СЃСЏ С‚РѕР»СЊРєРѕ РІ СЌС‚РѕРј Р±СЂР°СѓР·РµСЂРµ."
            : "Р’РІРµРґРё РЅРёРєРЅРµР№Рј. РђРєРєР°СѓРЅС‚ Р±СѓРґРµС‚ Р·Р°РєСЂРµРїР»РµРЅ Р·Р° С‚РІРѕРёРј Telegram ID.";
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
                saveState();
                renderAll();
                showToast("РќРёРє СЃРѕС…СЂР°РЅРµРЅ.");
                return;
            }
            if (!state.auth || !state.auth.sessionToken) {
                throw new Error("РћС‚РєСЂРѕР№ Mini App С‡РµСЂРµР· Telegram, С‡С‚РѕР±С‹ Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊ РЅРёРє.");
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
            showToast("РђРєРєР°СѓРЅС‚ Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ.");
        } catch (error) {
            showRegistrationError(error && error.message ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊ Р°РєРєР°СѓРЅС‚.");
        } finally {
            elements.registrationSubmit.disabled = false;
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

    function renderFriends() {
        const requests = Array.isArray(state.friendRequests) ? state.friendRequests : [];
        const friends = getDisplayFriends();
        elements.friendRequestBadge.textContent = String(Math.min(9, requests.length));
        elements.friendRequestPanel.innerHTML = requests.length ? [
            '<section class="friend-request-stack">',
            '<div class="panel-header friend-subheader"><h3 class="panel-title panel-title-small">РџСЂРёРіР»Р°С€РµРЅРёСЏ</h3></div>',
            requests.map(function (request) {
                const online = request.status === "online";
                return [
                    '<article class="friend-card friend-request-card">',
                    '<h3>' + escapeHtml(request.name) + '</h3>',
                    '<div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'РћРЅР»Р°Р№РЅ' : 'РћС„С„Р»Р°Р№РЅ') + '</span><span class="timer-chip">РЈСЂРѕРІРµРЅСЊ ' + escapeHtml(String(request.level)) + '</span></div>',
                    '<div class="friend-actions">',
                    '<button class="primary-button full-width" type="button" data-request-accept-id="' + escapeHtml(request.id) + '">РџСЂРёРЅСЏС‚СЊ</button>',
                    '<button class="secondary-button full-width" type="button" data-request-reject-id="' + escapeHtml(request.id) + '">РћС‚РєР»РѕРЅРёС‚СЊ</button>',
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
                '<div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'РћРЅР»Р°Р№РЅ' : 'РћС„С„Р»Р°Р№РЅ') + '</span><span class="timer-chip">РЈСЂРѕРІРµРЅСЊ ' + escapeHtml(String(friend.level)) + '</span></div>',
                '<div class="friend-actions">',
                '<button class="secondary-button full-width" data-friend-chat-id="' + escapeHtml(friend.id) + '" type="button">РќР°РїРёСЃР°С‚СЊ СЃРѕРѕР±С‰РµРЅРёРµ</button>',
                '<button class="secondary-button full-width friend-action-profile" data-friend-profile-id="' + escapeHtml(friend.id) + '" type="button">РџРѕСЃРјРѕС‚СЂРµС‚СЊ РїСЂРѕС„РёР»СЊ</button>',
                '</div>',
                '</article>'
            ].join("");
        }).join("") : '<article class="friend-card"><p>РџРѕРєР° РґСЂСѓР·РµР№ РЅРµС‚. РќР°Р№РґРё РёРіСЂРѕРєР° РїРѕ РЅРёРєРЅРµР№РјСѓ Рё РѕС‚РїСЂР°РІСЊ Р·Р°РїСЂРѕСЃ.</p></article>';
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
            elements.socialChatThreadList.innerHTML = '<article class="social-chat-empty">РћС‚РєСЂС‹С‚С‹Рµ РґРёР°Р»РѕРіРё РїРѕСЏРІСЏС‚СЃСЏ Р·РґРµСЃСЊ РїРѕСЃР»Рµ РїРµСЂРІРѕРіРѕ СЃРѕРѕР±С‰РµРЅРёСЏ РґСЂСѓРіСѓ.</article>';
            elements.socialChatThreadTitle.textContent = "Р’С‹Р±РµСЂРё С‡Р°С‚";
            elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Р’С‹Р±РµСЂРё РґСЂСѓРіР° Рё РЅР°С‡РЅРё РїРµСЂРµРїРёСЃРєСѓ.</div>';
            elements.socialChatInput.disabled = true;
            elements.socialChatSend.disabled = true;
            return;
        }

        elements.socialChatThreadList.innerHTML = threads.map(function (thread) {
            return [
                '<button class="social-chat-thread-card' + (activeThread && activeThread.id === thread.id ? ' is-active' : '') + '" type="button" data-social-thread-id="' + escapeHtml(thread.id) + '">',
                '<strong>' + escapeHtml(thread.friendName || 'Р”СЂСѓРі') + '</strong>',
                '<span>' + escapeHtml(thread.status === "online" ? "РћРЅР»Р°Р№РЅ" : "РћС„С„Р»Р°Р№РЅ") + " В· РЈСЂРѕРІРµРЅСЊ " + escapeHtml(String(thread.level || 1)) + '</span>',
                '</button>'
            ].join("");
        }).join("");

        if (!activeThread) {
            elements.socialChatThreadTitle.textContent = "Р’С‹Р±РµСЂРё С‡Р°С‚";
            elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Р’С‹Р±РµСЂРё РґРёР°Р»РѕРі СЃР»РµРІР°.</div>';
            elements.socialChatInput.disabled = true;
            elements.socialChatSend.disabled = true;
            return;
        }

        elements.socialChatThreadTitle.textContent = activeThread.friendName || "Р”СЂСѓРі";
        elements.socialChatMessages.innerHTML = (activeThread.messages || []).length ? (activeThread.messages || []).map(function (message) {
            const own = message.author === "you";
            return [
                '<div class="social-chat-message' + (own ? ' social-chat-message-own' : '') + '">',
                '<div class="social-chat-message-bubble">',
                '<strong>' + escapeHtml(own ? state.player.name : activeThread.friendName || "Р”СЂСѓРі") + '</strong>',
                '<p>' + escapeHtml(message.text || "") + '</p>',
                '<small>' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</small>',
                '</div>',
                '</div>'
            ].join("");
        }).join("") : '<div class="social-chat-empty">РџРѕРєР° СЃРѕРѕР±С‰РµРЅРёР№ РЅРµС‚. РќР°РїРёС€Рё РїРµСЂРІС‹Рј.</div>';
        elements.socialChatInput.disabled = false;
        elements.socialChatSend.disabled = false;
        elements.socialChatMessages.scrollTop = elements.socialChatMessages.scrollHeight;
    }

    function viewFriendProfile(friendId) {
        const friend = getFriendById(friendId);
        if (!friend) {
            return;
        }
        showToast(friend.name + " В· СѓСЂРѕРІРµРЅСЊ " + friend.level + " В· " + (friend.status === "online" ? "РѕРЅР»Р°Р№РЅ" : "РѕС„С„Р»Р°Р№РЅ"));
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
        elements.duelRoundPill.textContent = "Р Р°СѓРЅРґ " + duel.round;
        elements.duelRoundTimer.textContent = formatDuration(getRoundTimeRemainingMs(duel));
        elements.duelYouName.textContent = duel.playerName || "РРіСЂРѕРє";
        elements.duelYouMeta.textContent = "";
        elements.duelYouAvatar.textContent = (duel.playerName || "Р").slice(0, 1).toUpperCase();
        elements.duelOpponentName.textContent = duel.opponentName || "РЎРѕРїРµСЂРЅРёРє";
        elements.duelOpponentMeta.textContent = "";
        elements.duelOpponentAvatar.textContent = (duel.opponentName || "Р РЋ").slice(0, 1).toUpperCase();
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
            elements.duelLogList.innerHTML = '<div class="duel-log-round"><p class="duel-log-round-title">Р›РѕРіРѕРІ РїРѕРєР° РЅРµС‚. РџРµСЂРІС‹Р№ РѕР±РјРµРЅ С…РѕРґР°РјРё РїРѕСЏРІРёС‚СЃСЏ Р·РґРµСЃСЊ.</p></div>';
        } else {
            elements.duelLogList.innerHTML = duel.logs.slice().reverse().map(function (entry) {
                const roundNumber = typeof entry.round === "number" ? entry.round : entry.roundNumber;
                const lines = Array.isArray(entry.lines) ? entry.lines : [];
                const title = lines.length ? lines[0] : "Р Р°СѓРЅРґ " + roundNumber;
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
        elements.duelAutoToggle.textContent = currentEnabled ? "Р’С‹РєР»СЋС‡РёС‚СЊ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёР№ Р±РѕР№" : "Р’РєР»СЋС‡РёС‚СЊ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёР№ Р±РѕР№";
        const note = currentEnabled
            ? (pendingEnabled === false ? "РђРІС‚РѕР±РѕР№ РѕС‚РєР»СЋС‡РёС‚СЃСЏ СЃРѕ СЃР»РµРґСѓСЋС‰РµРіРѕ СЂР°СѓРЅРґР°." : "РђРІС‚РѕР±РѕР№ Р°РєС‚РёРІРµРЅ.")
            : (pendingEnabled === true ? "РђРІС‚РѕР±РѕР№ РІРєР»СЋС‡РёС‚СЃСЏ СЃРѕ СЃР»РµРґСѓСЋС‰РµРіРѕ СЂР°СѓРЅРґР°." : "");
        elements.duelAutoNote.textContent = note;
        elements.duelAutoNote.classList.toggle("hidden", !note);
        elements.duelAutoCover.classList.toggle("hidden", !currentEnabled || duel.finished);
    }

    function renderDuelChat(duel) {
        const isLiveChat = duel.mode === "pvp-live";
        const canWrite = isLiveChat && !duel.finished;
        const messages = duel.chatMessages || [];
        if (!messages.length) {
            elements.duelChatList.innerHTML = '<div class="duel-chat-entry"><p class="duel-chat-text">' + (isLiveChat ? "Р§Р°С‚ РїРѕРєР° РїСѓСЃС‚. РќР°РїРёС€Рё СЃРѕРїРµСЂРЅРёРєСѓ РїРµСЂРІРѕРµ СЃРѕРѕР±С‰РµРЅРёРµ." : "Р§Р°С‚ РґРѕСЃС‚СѓРїРµРЅ С‚РѕР»СЊРєРѕ РІ PvP-РјР°С‚С‡Рµ РјРµР¶РґСѓ РґРІСѓРјСЏ РёРіСЂРѕРєР°РјРё.") + "</p></div>";
        } else {
            elements.duelChatList.innerHTML = messages.map(function (message) {
                const own = message.playerId && state.auth && message.playerId === state.auth.playerId;
                const systemMessage = Boolean(message.systemMessage);
                const infoMessage = systemMessage && /Р°РІС‚Рѕ/i.test(String(message.text || ""));
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

    function buildDuelStatusText(duel) {
        if (duel.finished) {
            return duel.resultText || "";
        }
        if (duel.autoBattleEnabled) {
            return "РЎ СЌС‚РѕРіРѕ СЂР°СѓРЅРґР° С…РѕРґ РёРґРµС‚ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё.";
        }
        if (duel.mode === "pvp-live") {
            if (duel.yourActionSubmitted) {
                return hasPendingDuelChanges(duel)
                    ? "РўС‹ РёР·РјРµРЅРёР» РІС‹Р±РѕСЂ. РќР°Р¶РјРё В«РР·РјРµРЅРёС‚СЊ С…РѕРґВ», С‡С‚РѕР±С‹ РѕР±РЅРѕРІРёС‚СЊ СЂРµС€РµРЅРёРµ."
                    : "РҐРѕРґ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ. Р–РґС‘Рј СЃРѕРїРµСЂРЅРёРєР°.";
            }
            if (typeof duel.autoBattlePendingEnabled === "boolean") {
                return duel.autoBattlePendingEnabled
                    ? "РђРІС‚РѕР±РѕР№ РІРєР»СЋС‡РёС‚СЃСЏ СЃРѕ СЃР»РµРґСѓСЋС‰РµРіРѕ СЂР°СѓРЅРґР°."
                    : "РђРІС‚РѕР±РѕР№ РѕС‚РєР»СЋС‡РёС‚СЃСЏ СЃРѕ СЃР»РµРґСѓСЋС‰РµРіРѕ СЂР°СѓРЅРґР°.";
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

    function weaponLabel(code) {
        return {
            PISTOLS: "РџРёСЃС‚РѕР»СЊ Рё С‰РёС‚",
            RIFLE: "Р’РёРЅС‚РѕРІРєР°",
            SHOTGUN: "Р”СЂРѕР±РѕРІРёРє"
        }[code] || code;
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
        return {
            LEFT: "СѓС…РѕРґРёС‚ РІР»РµРІРѕ",
            STAY: "РѕСЃС‚Р°РµС‚СЃСЏ РїРѕ С†РµРЅС‚СЂСѓ",
            RIGHT: "СѓС…РѕРґРёС‚ РІРїСЂР°РІРѕ"
        }[code] || code;
    }

    function buildDuelIntentLine(name, action) {
        return name + " СЃС‚СЂРµР»СЏРµС‚ " + directionLabel(action.shot) + " " + weaponInstrumentLabel(action.weapon) + " Рё " + dodgeLabel(action.dodge) + ".";
    }

    function pluralizeHits(count) {
        const remainderTen = count % 10;
        const remainderHundred = count % 100;
        if (remainderTen === 1 && remainderHundred !== 11) {
            return count + " СЂР°Р·";
        }
        if (remainderTen >= 2 && remainderTen <= 4 && (remainderHundred < 12 || remainderHundred > 14)) {
            return count + " СЂР°Р·Р°";
        }
        return count + " СЂР°Р·";
    }

    function resolveAttack(attackerName, defenderName, attackerAction, defenderAction, attackerSide) {
        const lines = [];
        const gamble = rollWeaponGamble(attackerSide);
        if (gamble.jammed) {
            lines.push(attackerName + " РґР°РµС‚ РѕСЃРµС‡РєСѓ Рё РЅРµ СЃС‚СЂРµР»СЏРµС‚.");
            return { damage: 0, lines: lines };
        }
        const lineMatched = attackerAction.shot === defenderAction.dodge;
        if (!lineMatched && attackerAction.weapon !== "SHOTGUN") {
            lines.push(attackerName + " РїСЂРѕРјР°С…РёРІР°РµС‚СЃСЏ РјРёРјРѕ Р»РёРЅРёРё.");
            return { damage: 0, lines: lines };
        }
        if (lineMatched && shouldSupportEvade(attackerSide === "player" ? "opponent" : "player")) {
            lines.push(defenderName + " СѓС…РѕРґРёС‚ РѕС‚ СѓСЂРѕРЅР°.");
            return { damage: 0, lines: lines };
        }
        if (attackerAction.weapon === "PISTOLS") {
            if (projectileBlocked(attackerSide, defenderAction.weapon, attackerAction.weapon, attackerAction.shot)) {
                lines.push(defenderName + " Р±Р»РѕРєРёСЂСѓРµС‚ РІС‹СЃС‚СЂРµР» С‰РёС‚РѕРј.");
                return { damage: 0, lines: lines };
            }
            let damage = 18 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
            damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, false, lines, defenderName);
            lines.push(attackerName + " РїРѕРїР°РґР°РµС‚ " + weaponInstrumentLabel(attackerAction.weapon) + " Рё РЅР°РЅРѕСЃРёС‚ " + damage + " СѓСЂРѕРЅР°.");
            return { damage: damage, lines: lines };
        }
        if (attackerAction.weapon === "RIFLE") {
            let damage = 30 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
            damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, false, lines, defenderName);
            lines.push(attackerName + " РїРѕРїР°РґР°РµС‚ " + weaponInstrumentLabel(attackerAction.weapon) + " Рё РЅР°РЅРѕСЃРёС‚ " + damage + " СѓСЂРѕРЅР°.");
            return { damage: damage, lines: lines };
        }
        let pelletsHit = 0;
        let pelletsBlocked = 0;
        if (!lineMatched) {
            if (Math.random() < SHOTGUN_EDGE_GRAZE_CHANCE + getWeaponGrazeBonus(attackerSide, attackerAction.weapon)) {
                let edgeDamage = SHOTGUN_EDGE_DAMAGE + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
                edgeDamage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", edgeDamage, true, lines, defenderName);
                lines.push(attackerName + " С†РµРїР»СЏРµС‚ РєСЂР°РµРј Рё РЅР°РЅРѕСЃРёС‚ " + edgeDamage + " СѓСЂРѕРЅР°.");
                return { damage: edgeDamage, lines: lines };
            }
            lines.push(attackerName + " РїСЂРѕРјР°С…РёРІР°РµС‚СЃСЏ РґСЂРѕР±СЊСЋ.");
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
            lines.push(defenderName + " РїРѕР»РЅРѕСЃС‚СЊСЋ Р±Р»РѕРєРёСЂСѓРµС‚ Р·Р°СЂСЏРґ.");
            return { damage: 0, lines: lines };
        }
        let damage = pelletsHit * 5 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
        damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, pelletsHit < 3, lines, defenderName);
        let summary = attackerName + " РїРѕРїР°РґР°РµС‚ " + pluralizeHits(pelletsHit) + " Рё РЅР°РЅРѕСЃРёС‚ " + damage + " СѓСЂРѕРЅР°.";
        if (pelletsBlocked) {
            summary += " " + defenderName + " Р±Р»РѕРєРёСЂСѓРµС‚ " + pluralizeHits(pelletsBlocked) + ".";
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
                title: "РќР°С‡Р°С‚СЊ Р±РѕР№ СЃ Р±РѕС‚РѕРј?",
                copy: "РџРѕРґС‚РІРµСЂРґРё, С‡С‚Рѕ С…РѕС‡РµС€СЊ СЃСЂР°Р·Сѓ РІРѕР№С‚Рё РІ Р±РѕР№ СЃ С‚СЂРµРЅРёСЂРѕРІРѕС‡РЅС‹Рј СЃРѕРїРµСЂРЅРёРєРѕРј.",
                execute: function () {
                    startBotDuel(true);
                }
            });
            return;
        }
        openDuel({
            mode: "bot",
            title: "Р”СѓСЌР»СЊ",
            modeLabel: "Р‘РѕС‚",
            opponentName: "РўСЂРµРЅРёСЂРѕРІС‰РёРє",
            opponentWeapon: "RIFLE"
        });
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
                copy: "РџРѕРґС‚РІРµСЂРґРё, С‡С‚Рѕ С…РѕС‡РµС€СЊ РІСЃС‚Р°С‚СЊ РІ РѕС‡РµСЂРµРґСЊ РЅР° PvP-РјР°С‚С‡.",
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
            showToast("Р’РЅРµ Telegram РґРѕСЃС‚СѓРїРµРЅ Р»РѕРєР°Р»СЊРЅС‹Р№ Р±РѕР№.");
            openDuel({
                mode: "pvp",
                title: "Р”СѓСЌР»СЊ",
                modeLabel: "PvP",
                opponentName: randomFrom(["Р РµР№РґРµСЂ", "РЎРЅР°Р№РїРµСЂ", "РљРѕРЅС‚СЂР°Р±Р°РЅРґРёСЃС‚", "РЎРµРІРµСЂСЏРЅРёРЅ"]),
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
            showToast("РџРѕРёСЃРє РґСѓСЌР»Рё РѕС‚РјРµРЅРµРЅ.");
            return;
        }
        if (elements.queueCancelButton) {
            elements.queueCancelButton.disabled = true;
        }
        try {
            const response = await apiFetch("/api/matchmaking/cancel", { method: "POST" });
            applyMatchmakingStatus(await response.json());
            renderAll();
            showToast("РџРѕРёСЃРє РґСѓСЌР»Рё РѕС‚РјРµРЅРµРЅ.");
        } catch (error) {
            showToast(error && error.message ? error.message : "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РјРµРЅРёС‚СЊ РїРѕРёСЃРє.");
        } finally {
            if (elements.queueCancelButton) {
                elements.queueCancelButton.disabled = false;
            }
        }
    }

    function buildLiveResultText(payload) {
        if (payload.status === "FINISHED") {
            if (payload.resultLabel === "VICTORY") {
                return "РџРѕР±РµРґР°. РўС‹ СѓРґРµСЂР¶Р°Р» С‚РµРјРї РґРѕ РєРѕРЅС†Р°.";
            }
            if (payload.resultLabel === "DEFEAT") {
                return "РџРѕСЂР°Р¶РµРЅРёРµ. Р­С‚РѕС‚ Р±РѕР№ РѕСЃС‚Р°Р»СЃСЏ Р·Р° СЃРѕРїРµСЂРЅРёРєРѕРј.";
            }
            return "РќРёС‡СЊСЏ. РћР±Р° Р±РѕР№С†Р° СѓРґРµСЂР¶Р°Р»Рё Р»РёРЅРёСЋ.";
        }
        if (payload.yourActionSubmitted && !payload.opponentActionSubmitted) {
            return "РҐРѕРґ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅ. Р–РґС‘Рј РѕС‚РІРµС‚ СЃРѕРїРµСЂРЅРёРєР°.";
        }
        if (payload.yourActionSubmitted && payload.opponentActionSubmitted) {
            return "РћР±Р° С…РѕРґР° Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹. Р Р°СѓРЅРґ СЃРµР№С‡Р°СЃ СЂР°СЃРєСЂРѕРµС‚СЃСЏ.";
        }
        return "";
    }

    function openLiveDuelResult(payload) {
        const isVictory = payload.resultLabel === "VICTORY";
        const isDefeat = payload.resultLabel === "DEFEAT";
        const winnerName = isVictory
            ? (payload.you && payload.you.displayName ? payload.you.displayName : state.player.name)
            : (payload.opponent && payload.opponent.displayName ? payload.opponent.displayName : "РЎРѕРїРµСЂРЅРёРє");
        const rewardMoney = isVictory ? BATTLE_VICTORY_COINS : 0;
        const rewardExperience = BATTLE_REWARD_EXPERIENCE;

        openDuelResultModal({
            title: isVictory ? "РўС‹ РїРѕР±РµРґРёР»" : (isDefeat ? "РўС‹ РїСЂРѕРёРіСЂР°Р»" : "РќРёС‡СЊСЏ"),
            copy: isVictory
                ? "РџРѕР±РµР¶РґРµРЅ " + (payload.opponent && payload.opponent.displayName ? payload.opponent.displayName : "СЃРѕРїРµСЂРЅРёРє") + "."
                : (isDefeat ? "РџРѕР±РµРґРёР» " + winnerName + "." : "РћР±Р° Р±РѕР№С†Р° СѓРґРµСЂР¶Р°Р»Рё Р»РёРЅРёСЋ РґРѕ РєРѕРЅС†Р°."),
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
        elements.duelTitle.textContent = "Р”СѓСЌР»СЊ";
        elements.duelRoundPill.textContent = "Р Р°СѓРЅРґ " + duel.round;
        elements.duelRoundTimer.textContent = formatDuration(getRoundTimeRemainingMs(duel));
        elements.duelYouName.textContent = duel.playerName || "РРіСЂРѕРє";
        elements.duelYouMeta.textContent = "";
        elements.duelYouAvatar.textContent = (duel.playerName || "Р").slice(0, 1).toUpperCase();
        elements.duelOpponentName.textContent = duel.opponentName || "РЎРѕРїРµСЂРЅРёРє";
        elements.duelOpponentMeta.textContent = "";
        elements.duelOpponentAvatar.textContent = (duel.opponentName || "Р РЋ").slice(0, 1).toUpperCase();
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
            elements.duelLogList.innerHTML = '<div class="duel-log-round"><p class="duel-log-round-title">Р›РѕРіРѕРІ РїРѕРєР° РЅРµС‚. РџРµСЂРІС‹Р№ РѕР±РјРµРЅ С…РѕРґР°РјРё РїРѕСЏРІРёС‚СЃСЏ Р·РґРµСЃСЊ.</p></div>';
        } else {
            elements.duelLogList.innerHTML = duel.logs.slice().reverse().map(function (entry) {
                const roundNumber = typeof entry.round === "number" ? entry.round : entry.roundNumber;
                const lines = Array.isArray(entry.lines) ? entry.lines : [];
                const title = lines.length ? lines[0] : "Р Р°СѓРЅРґ " + roundNumber;
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
function hideAutoBattleUi() {
    if (elements.duelAutoToggle) {
        elements.duelAutoToggle.classList.add("hidden");
        elements.duelAutoToggle.disabled = true;
        elements.duelAutoToggle.textContent = "";
        const autoRow = elements.duelAutoToggle.closest(".duel-auto-row");
        if (autoRow) {
            autoRow.classList.add("hidden");
        }
    }
    if (elements.duelAutoNote) {
        elements.duelAutoNote.classList.add("hidden");
        elements.duelAutoNote.textContent = "";
    }
    if (elements.duelAutoCover) {
        elements.duelAutoCover.classList.add("hidden");
    }
}

function looksLikeMojibake(text) {
    if (typeof text !== "string" || !text) {
        return false;
    }
    const suspiciousPairs = text.match(/[РС][^\s]{1}/g);
    return Boolean(suspiciousPairs && suspiciousPairs.length >= 3);
}

function sanitizeVisibleText(text, fallback) {
    if (text == null) {
        return fallback || "";
    }
    const normalized = String(text).trim();
    if (!normalized) {
        return fallback || "";
    }
    return looksLikeMojibake(normalized) ? (fallback || "") : normalized;
}

function sanitizeLogLines(lines) {
    return (Array.isArray(lines) ? lines : [])
        .map(function (line, index) {
            return sanitizeVisibleText(line, index === 0 ? "Запись журнала обновлена." : "");
        })
        .filter(Boolean);
}

function repairStateAfterLegacyLoad() {
    if (!state || typeof state !== "object") {
        return;
    }

    if (state.duel) {
        state.duel.autoBattleEnabled = false;
        state.duel.autoBattlePendingEnabled = null;
        state.duel.autoResolutionAt = null;
        state.duel.canSubmitAction = !state.duel.finished;
        state.duel.chatError = sanitizeVisibleText(state.duel.chatError, "");
        state.duel.resultText = sanitizeVisibleText(state.duel.resultText, "");
        state.duel.logs = (Array.isArray(state.duel.logs) ? state.duel.logs : []).map(function (entry) {
            return {
                round: entry.round,
                roundNumber: entry.roundNumber,
                lines: sanitizeLogLines(entry.lines)
            };
        }).filter(function (entry) {
            return entry.lines.length > 0;
        });
        state.duel.chatMessages = (Array.isArray(state.duel.chatMessages) ? state.duel.chatMessages : []).map(function (message) {
            const fallbackText = message && message.systemMessage
                ? "Системное сообщение обновлено."
                : "Сообщение из старой версии скрыто.";
            return Object.assign({}, message, {
                displayName: sanitizeVisibleText(message.displayName, message && message.systemMessage ? "Система" : "Игрок"),
                text: sanitizeVisibleText(message.text, fallbackText)
            });
        });
    }

    if (state.social && Array.isArray(state.social.threads)) {
        state.social.threads = state.social.threads.map(function (thread) {
            return Object.assign({}, thread, {
                friendName: sanitizeVisibleText(thread.friendName, "Друг"),
                messages: (Array.isArray(thread.messages) ? thread.messages : []).map(function (message) {
                    return Object.assign({}, message, {
                        text: sanitizeVisibleText(message.text, "Сообщение из старой версии скрыто.")
                    });
                })
            });
        });
    }

    if (state.journal && Array.isArray(state.journal.entries)) {
        state.journal.entries = state.journal.entries.map(function (entry) {
            return Object.assign({}, entry, {
                locationLabel: sanitizeVisibleText(entry.locationLabel, JOURNAL_LOCATION_LABELS[entry.location] || "Город"),
                text: sanitizeVisibleText(entry.text, "Старая запись дневника обновлена.")
            });
        });
    }
}

function refreshStaticCopy() {
    document.title = "Полюс";

    const setText = function (id, value) {
        const node = document.getElementById(id);
        if (node) {
            node.textContent = value;
        }
    };
    const setPlaceholder = function (id, value) {
        const node = document.getElementById(id);
        if (node) {
            node.setAttribute("placeholder", value);
        }
    };

    setText("find-match-button", "Найти матч");
    setText("bot-duel-button", "Быстрая дуэль (бот)");
    setText("queue-cancel-button", "Отменить");
    setText("social-chat-close", "Закрыть");
    setText("social-chat-thread-title", "Выбери чат");
    setText("duel-tab-logs", "Логи");
    setText("duel-tab-chat", "Чат");
    setText("duel-clear-log-button", "Очистить");
    setText("duel-close-button", "Выйти");
    setText("duel-title", "Дуэль");
    setText("start-duel-title", "Начать бой?");
    setText("start-duel-copy", "Подтверди, что хочешь войти в бой.");
    setText("start-duel-cancel", "Нет, вернуться в хаб");
    setText("start-duel-confirm", "Да, начать бой");
    setText("duel-exit-cancel", "Нет, остаться");
    setText("duel-exit-confirm", "Да, выйти");
    setText("duel-result-title", "Бой завершен");
    setText("duel-result-close", "В хаб");
    setText("journal-zone-label", "Зона");
    setText("friend-request-badge", String((state.friendRequests || []).length || 0));
    setPlaceholder("friend-search-input", "Найти игрока по никнейму");
    setPlaceholder("social-chat-input", "Напиши сообщение");
    setPlaceholder("duel-chat-input", "Напиши сообщение сопернику");
    setPlaceholder("registration-nickname", "Например, Бакунин");

    safeSetText(".panel-kicker", "Профиль");
    safeSetText("#profile-name", state.player && state.player.name ? state.player.name : "Новый игрок");
    safeSetText(".queue-status-label", "Поиск дуэли");
    safeSetText("#queue-status-note", "Ищем соперника в очереди.");
    safeSetText("#screen-home .panel-title.panel-title-small", "Дневник");
    safeSetText(".journal-zone-label", "Зона");
    safeSetText("#screen-inventory .panel-title", "Доступные аугментации");
    safeSetText("#inventory-placeholder h3", "Пока аугментаций нет");
    safeSetText("#inventory-placeholder p", "Купленные модули будут появляться здесь и распределяться по типам.");
    safeSetText("#screen-friends .panel-title", "Друзья");
    safeSetText("#friend-search-form button", "Добавить");
    safeSetText("#screen-shop .panel-title", "Магазин");
    safeSetText("#shop-money", (state.player ? Number(state.player.money || 0) : 0) + " монет");
    safeSetText(".shop-tab[data-shop-section='weapon']", "Оружейная");
    safeSetText(".shop-tab[data-shop-section='defense']", "Защитная");
    safeSetText(".nav-button[data-nav-target='home'] .nav-title", "Хаб");
    safeSetText(".nav-button[data-nav-target='inventory'] .nav-title", "Инвентарь");
    safeSetText(".nav-button[data-nav-target='friends'] .nav-title", "Друзья");
    safeSetText(".nav-button[data-nav-target='shop'] .nav-title", "Магазин");
    safeSetText(".social-chat-fab-label", "Чаты");
    safeSetText(".social-chat-panel .panel-title.panel-title-small", "Чаты");
    safeSetText("#registration-modal .panel-title.panel-title-small", "Регистрация игрока");
    safeSetText("#registration-copy", "Ник будет привязан к твоему Telegram ID.");
    safeSetText("label[for='registration-nickname']", "Никнейм");
    safeSetText("#registration-style-label", "В каком стиле вы будете вести дневник?");
    safeSetText(".registration-style-option:nth-of-type(1) .registration-style-copy", "Я прибыл в Полюс.");
    safeSetText(".registration-style-option:nth-of-type(2) .registration-style-copy", "Я прибыла в Полюс.");
    safeSetText("#registration-submit", "Создать аккаунт");

    safeSetText(".duel-block-title", "Оружие");
    safeSetText(".vector-card:nth-of-type(1) h4", "Выстрел");
    safeSetText(".vector-card:nth-of-type(2) h4", "Уворот");
    safeSetText(".weapon-option[data-value='PISTOLS'] strong", "Пистоль и щит");
    safeSetText(".weapon-option[data-value='PISTOLS'] .weapon-stat", "18 урона");
    safeSetText(".weapon-option[data-value='PISTOLS'] .weapon-trait", "Шанс блокировать выстрел 30%");
    safeSetText(".weapon-option[data-value='RIFLE'] strong", "Винтовка");
    safeSetText(".weapon-option[data-value='RIFLE'] .weapon-stat", "30 урона");
    safeSetText(".weapon-option[data-value='RIFLE'] .weapon-trait", "Игнорирует блокирование");
    safeSetText(".weapon-option[data-value='SHOTGUN'] strong", "Дробовик");
    safeSetText(".weapon-option[data-value='SHOTGUN'] .weapon-stat", "5-25 урона");
    safeSetText(".weapon-option[data-value='SHOTGUN'] .weapon-trait", "Вероятность зацепа 35%");
    safeSetText(".duel-toggle[data-duel-select='shot'][data-value='LEFT']", "Лево");
    safeSetText(".duel-toggle[data-duel-select='shot'][data-value='CENTER']", "Центр");
    safeSetText(".duel-toggle[data-duel-select='shot'][data-value='RIGHT']", "Право");
    safeSetText(".duel-toggle[data-duel-select='dodge'][data-value='LEFT']", "Лево");
    safeSetText(".duel-toggle[data-duel-select='dodge'][data-value='STAY']", "Центр");
    safeSetText(".duel-toggle[data-duel-select='dodge'][data-value='RIGHT']", "Право");

    hideAutoBattleUi();
}

async function toggleAutoBattle() {
    return;
}

function buildDuelStatusText(duel) {
    if (!duel) {
        return "";
    }
    if (duel.finished) {
        return duel.resultText || "";
    }
    if (duel.mode === "pvp-live" && duel.yourActionSubmitted) {
        return hasPendingDuelChanges(duel)
            ? "Ты изменил выбор. Нажми «Изменить ход», чтобы обновить решение."
            : "Ход зафиксирован. Ждём соперника.";
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
    elements.duelResultExp.textContent = formatSignedReward(result.rating ?? result.experience ?? 0, " рейтинга");
    elements.duelResultMoney.textContent = formatSignedReward(result.money || 0, " монет");
}

function openDuelResultModal(config) {
    state.ui.duelExitConfirmOpen = false;
    state.ui.duelResult = {
        title: config.title || "Бой завершен",
        copy: config.copy || "",
        rating: Number(config.rating ?? config.experience) || 0,
        money: Number(config.money) || 0
    };
    saveState();
    renderDuelResultModal();
}

function openLiveDuelResult(payload) {
    const isVictory = payload.resultLabel === "VICTORY";
    const isDefeat = payload.resultLabel === "DEFEAT";
    openDuelResultModal({
        title: isVictory ? "Победа" : isDefeat ? "Поражение" : "Бой завершен",
        copy: isVictory
            ? "Ты победил в дуэли."
            : isDefeat
                ? "Ты проиграл в дуэли."
                : "Раундов больше не осталось.",
        rating: isVictory ? PVP_RATING_DELTA : isDefeat ? -PVP_RATING_DELTA : 0,
        money: isVictory ? BATTLE_VICTORY_COINS : isDefeat ? BATTLE_DEFEAT_COINS : 0
    });
}

function closeDuelResult() {
    state.ui.duelResult = null;
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
        STAY: "остаётся по центру",
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

function shouldSupportEvade(side) {
    return Math.random() < 0.05;
}

function projectileBlocked(attackerSide, defenderWeapon) {
    return defenderWeapon === "PISTOLS" && Math.random() < SHIELD_BLOCK_CHANCE;
}

function getWeaponGrazeBonus(side, weaponCode) {
    return 0;
}

function getWeaponDamageBonus(side, weaponCode) {
    return 0;
}

function rollWeaponGamble(side) {
    return { jammed: false, doubled: false };
}

function applyDefenseReduction(side, damage, isGraze, lines, defenderName) {
    return Math.max(0, damage);
}

function resolveAttack(attackerName, defenderName, attackerAction, defenderAction, attackerSide) {
    const lines = [];
    const gamble = rollWeaponGamble(attackerSide);
    if (gamble.jammed) {
        lines.push(attackerName + " даёт осечку и не стреляет.");
        return { damage: 0, lines: lines };
    }

    const defenderLine = defenderAction.dodge === "STAY" ? "CENTER" : defenderAction.dodge;
    const lineMatched = attackerAction.shot === defenderLine;
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
        if (gamble.doubled) {
            damage *= 2;
        }
        damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, false, lines, defenderName);
        lines.push(attackerName + " попадает " + weaponInstrumentLabel(attackerAction.weapon) + " и наносит " + damage + " урона.");
        return { damage: damage, lines: lines };
    }

    if (attackerAction.weapon === "RIFLE") {
        let damage = 30 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
        if (gamble.doubled) {
            damage *= 2;
        }
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
        lines.push(attackerName + " промахивается всем веером дроби.");
        return { damage: 0, lines: lines };
    }

    for (let pellet = 0; pellet < 5; pellet += 1) {
        if (projectileBlocked(attackerSide, defenderAction.weapon, attackerAction.weapon, attackerAction.shot)) {
            pelletsBlocked += 1;
            continue;
        }
        pelletsHit += 1;
    }

    if (!pelletsHit) {
        lines.push(defenderName + " блокирует весь веер дроби.");
        return { damage: 0, lines: lines };
    }

    let damage = pelletsHit * 5 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
    if (gamble.doubled) {
        damage *= 2;
    }
    damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, pelletsHit < 3, lines, defenderName);
    lines.push(attackerName + " попадает дробью " + pluralizeHits(pelletsHit) + " и наносит " + damage + " урона.");
    if (pelletsBlocked) {
        lines.push(defenderName + " блокирует " + pluralizeHits(pelletsBlocked) + ".");
    }
    return { damage: damage, lines: lines };
}

function resolveDuelRound(playerAction, opponentAction) {
    const duel = state.duel;
    if (!duel || duel.finished) {
        return;
    }

    const roundNumber = duel.round;
    const logLines = [
        buildDuelIntentLine(duel.playerName || "Игрок", playerAction),
        buildDuelIntentLine(duel.opponentName || "Соперник", opponentAction)
    ];

    const playerAttack = resolveAttack(duel.playerName || "Игрок", duel.opponentName || "Соперник", playerAction, opponentAction, "player");
    const opponentAttack = resolveAttack(duel.opponentName || "Соперник", duel.playerName || "Игрок", opponentAction, playerAction, "opponent");

    duel.opponentHp = Math.max(0, duel.opponentHp - playerAttack.damage);
    duel.playerHp = Math.max(0, duel.playerHp - opponentAttack.damage);
    logLines.push.apply(logLines, playerAttack.lines);
    logLines.push.apply(logLines, opponentAttack.lines);

    duel.logs = duel.logs || [];
    duel.logs.push({ round: roundNumber, lines: logLines });

    if (duel.playerHp <= 0 || duel.opponentHp <= 0) {
        duel.finished = true;
        const playerWon = duel.opponentHp <= 0 && duel.playerHp > 0;
        const opponentWon = duel.playerHp <= 0 && duel.opponentHp > 0;
        if (playerWon) {
            duel.resultText = "Ты победил.";
            state.player.money = Number(state.player.money || 0) + BATTLE_VICTORY_COINS;
            openDuelResultModal({ title: "Победа", copy: "Ты победил в дуэли.", rating: 0, money: BATTLE_VICTORY_COINS });
        } else if (opponentWon) {
            duel.resultText = "Ты проиграл.";
            state.player.money = Number(state.player.money || 0) + BATTLE_DEFEAT_COINS;
            openDuelResultModal({ title: "Поражение", copy: "Ты проиграл в дуэли.", rating: 0, money: BATTLE_DEFEAT_COINS });
        } else {
            duel.resultText = "Ничья.";
            openDuelResultModal({ title: "Ничья", copy: "Оба бойца выбыли одновременно.", rating: 0, money: 0 });
        }
        saveState();
        renderDuel();
        renderHome();
        return;
    }

    duel.round += 1;
    startLocalRound(duel);
    saveState();
    renderDuel();
}

function startLocalRound(duel) {
    if (!duel || duel.finished) {
        return;
    }
    duel.roundStartedAt = Date.now();
    duel.roundDeadlineAt = duel.roundStartedAt + DUEL_ROUND_TIMEOUT_MS;
    duel.selectedWeapon = "";
    duel.selectedShot = "";
    duel.selectedDodge = "";
    duel.submittedAction = null;
    duel.yourActionSubmitted = false;
    duel.opponentActionSubmitted = false;
    duel.autoBattleEnabled = false;
    duel.autoBattlePendingEnabled = null;
    duel.autoResolutionAt = null;
    duel.canSubmitAction = true;
    duel.resultText = "";
}

function renderDuelControls() {
    const duel = state.duel;
    const controlsDisabled = !duel || duel.finished;
    if (duel) {
        duel.autoBattleEnabled = false;
        duel.autoBattlePendingEnabled = null;
        duel.autoResolutionAt = null;
    }
    toggleDuelButtonGroup(elements.duelWeaponButtons, duel ? duel.selectedWeapon : "");
    toggleDuelButtonGroup(elements.duelShotButtons, duel ? duel.selectedShot : "");
    toggleDuelButtonGroup(elements.duelDodgeButtons, duel ? duel.selectedDodge : "");
    [].concat(elements.duelWeaponButtons, elements.duelShotButtons, elements.duelDodgeButtons).forEach(function (button) {
        button.disabled = controlsDisabled;
    });
    if (elements.duelClearLogButton) {
        elements.duelClearLogButton.disabled = !duel || !duel.logs.length || duel.mode === "pvp-live";
    }
    hideAutoBattleUi();
}

function renderDuelChat(duel) {
    const isLiveChat = duel.mode === "pvp-live";
    const canWrite = isLiveChat && !duel.finished;
    const messages = duel.chatMessages || [];
    if (!messages.length) {
        elements.duelChatList.innerHTML = '<div class="duel-chat-entry"><p class="duel-chat-text">' + (isLiveChat ? "Чат пока пуст. Напиши сопернику первое сообщение." : "Чат доступен только в PvP-матче между двумя игроками.") + '</p></div>';
    } else {
        elements.duelChatList.innerHTML = messages.map(function (message) {
            const own = message.playerId && state.auth && message.playerId === state.auth.playerId;
            const systemMessage = Boolean(message.systemMessage);
            const extraClass = systemMessage ? ' duel-chat-entry-system' : (own ? ' duel-chat-entry-own' : '');
            const displayName = sanitizeVisibleText(message.displayName, systemMessage ? 'Система' : 'Игрок');
            const messageText = sanitizeVisibleText(
                message.text,
                systemMessage ? 'Системное сообщение обновлено.' : 'Сообщение из старой версии скрыто.'
            );
            return '<div class="duel-chat-entry' + extraClass + '"><p class="duel-chat-meta">' + escapeHtml(displayName) + ' · ' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</p><p class="duel-chat-text">' + escapeHtml(messageText) + '</p></div>';
        }).join('');
    }
    elements.duelChatInput.disabled = !canWrite;
    elements.duelChatSendButton.disabled = !canWrite;
    elements.duelChatInput.placeholder = canWrite ? "Напиши сообщение сопернику" : "Чат недоступен";
    elements.duelChatError.textContent = duel.chatError || "";
    elements.duelChatError.classList.toggle("hidden", !duel.chatError);
    elements.duelChatList.scrollTop = elements.duelChatList.scrollHeight;
}

function closeDuelSilently() {
    if (elements.duelOverlay) {
        elements.duelOverlay.classList.add("hidden");
        elements.duelOverlay.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("duel-open");
}

function renderDuel() {
    refreshStaticCopy();
    const duel = state.duel;
    if (!duel) {
        closeDuelSilently();
        return;
    }
    duel.activePanel = duel.activePanel || "logs";
    duel.autoBattleEnabled = false;
    duel.autoBattlePendingEnabled = null;
    duel.chatMessages = Array.isArray(duel.chatMessages) ? duel.chatMessages : [];
    duel.chatError = sanitizeVisibleText(duel.chatError, "");
    duel.resultText = sanitizeVisibleText(duel.resultText, "");
    duel.logs = (Array.isArray(duel.logs) ? duel.logs : []).map(function (entry) {
        return Object.assign({}, entry, { lines: sanitizeLogLines(entry.lines) });
    }).filter(function (entry) {
        return entry.lines.length > 0;
    });
    syncDuelInputs(duel);
    elements.duelTitle.textContent = "Дуэль";
    elements.duelRoundPill.textContent = "Раунд " + duel.round;
    elements.duelRoundTimer.textContent = formatDuration(getRoundTimeRemainingMs(duel));
    elements.duelYouName.textContent = sanitizeVisibleText(duel.playerName, "Игрок");
    elements.duelYouMeta.textContent = "";
    elements.duelYouAvatar.textContent = sanitizeVisibleText(duel.playerName, "И").slice(0, 1).toUpperCase();
    elements.duelOpponentName.textContent = sanitizeVisibleText(duel.opponentName, "Соперник");
    elements.duelOpponentMeta.textContent = "";
    elements.duelOpponentAvatar.textContent = sanitizeVisibleText(duel.opponentName, "С").slice(0, 1).toUpperCase();
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
    elements.duelSubmitButton.disabled = duel.finished || !duelSelectionComplete || (duel.yourActionSubmitted && !duelHasPendingChanges);
    renderDuelControls();
    if (!duel.logs.length) {
        elements.duelLogList.innerHTML = '<div class="duel-log-round"><p class="duel-log-round-title">Логов пока нет. Первый обмен ходами появится здесь.</p></div>';
    } else {
        elements.duelLogList.innerHTML = duel.logs.slice().reverse().map(function (entry) {
            const roundNumber = typeof entry.round === "number" ? entry.round : entry.roundNumber;
            const lines = sanitizeLogLines(entry.lines);
            const title = lines.length ? lines[0] : "Раунд " + roundNumber;
            const detailLines = lines.slice(1);
            return '<div class="duel-log-round"><p class="duel-log-round-title">' + decorateText(title) + '</p>' + detailLines.map(function (line) {
                return '<p class="duel-log-line">' + decorateText(line) + '</p>';
            }).join('') + '</div>';
        }).join('');
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

async function submitLiveDuelAction() {
    const duel = state.duel;
    if (!duel || !duel.duelId || duel.finished) {
        return;
    }
    const actionPayload = getCurrentDuelAction(duel);
    elements.duelSubmitButton.disabled = true;
    try {
        const response = await apiFetch("/api/duel/" + encodeURIComponent(duel.duelId) + "/action", {
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
        showToast(state.duel && state.duel.yourActionSubmitted ? "Ход принят." : "Раунд обновлён.");
    } catch (error) {
        showToast(error && error.message ? error.message : "Не удалось отправить ход.");
    } finally {
        elements.duelSubmitButton.disabled = false;
    }
}

function submitCurrentDuelTurn() {
    if (!state.duel || state.duel.finished) {
        return;
    }
    if (!isDuelSelectionComplete(state.duel)) {
        showToast("Сначала выбери оружие, выстрел и уворот.");
        return;
    }
    if (state.duel.mode === "pvp-live") {
        submitLiveDuelAction();
        return;
    }
    resolveDuelRound(getCurrentDuelAction(state.duel), buildOpponentAction());
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
        const friendName = sanitizeVisibleText(thread.friendName, 'Друг');
        return [
            '<button class="social-chat-thread-card' + (activeThread && activeThread.id === thread.id ? ' is-active' : '') + '" type="button" data-social-thread-id="' + escapeHtml(thread.id) + '">',
            '<strong>' + escapeHtml(friendName) + '</strong>',
            '<span>' + escapeHtml((thread.status === 'online' ? 'Онлайн' : 'Оффлайн') + ' · Рейтинг ' + (thread.rating || 0)) + '</span>',
            '</button>'
        ].join('');
    }).join('');

    if (!activeThread) {
        elements.socialChatThreadTitle.textContent = "Выбери чат";
        elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Открой чат через карточку друга.</div>';
        elements.socialChatInput.disabled = true;
        elements.socialChatSend.disabled = true;
        return;
    }

    elements.socialChatThreadTitle.textContent = sanitizeVisibleText(activeThread.friendName, "Друг");
    elements.socialChatMessages.innerHTML = (activeThread.messages || []).length
        ? (activeThread.messages || []).map(function (message) {
            const own = message.author === 'you';
            const authorName = own ? state.player.name : sanitizeVisibleText(activeThread.friendName, 'Друг');
            const messageText = sanitizeVisibleText(message.text, 'Сообщение из старой версии скрыто.');
            return [
                '<div class="social-chat-message' + (own ? ' social-chat-message-own' : '') + '">',
                '<div class="social-chat-message-bubble">',
                '<strong>' + escapeHtml(authorName) + '</strong>',
                '<p>' + escapeHtml(messageText) + '</p>',
                '<small>' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</small>',
                '</div>',
                '</div>'
            ].join('');
        }).join('')
        : '<div class="social-chat-empty">Пока сообщений нет. Напиши первым.</div>';
    elements.socialChatInput.disabled = false;
    elements.socialChatSend.disabled = false;
    elements.socialChatMessages.scrollTop = elements.socialChatMessages.scrollHeight;
}

async function submitDuelChat() {
    const duel = state.duel;
    if (!duel) {
        return;
    }
    const text = (elements.duelChatInput.value || '').trim();
    if (!text) {
        return;
    }
    if (/(https?:\/\/|www\.|t\.me\/|telegram\.me\/|[a-z0-9-]+\.[a-z0-9-]+)/i.test(text)) {
        duel.chatError = 'Ссылки запрещены в боевом чате.';
        renderDuelChat(duel);
        return;
    }
    if (duel.mode !== 'pvp-live' || !duel.duelId) {
        duel.chatError = 'Чат доступен только в PvP-матче.';
        renderDuelChat(duel);
        return;
    }
    duel.chatError = '';
    renderDuelChat(duel);
    try {
        const response = await apiFetch('/api/duel/' + encodeURIComponent(duel.duelId) + '/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: text })
        });
        const payload = await response.json();
        elements.duelChatInput.value = '';
        await refreshLiveDuel(payload.duelId);
    } catch (error) {
        duel.chatError = 'Сообщение не отправлено.';
        renderDuelChat(duel);
    }
}

function showToast(text) {
    if (!elements.toast) {
        return;
    }
    const visibleText = sanitizeVisibleText(text, "Действие обновлено.");
    elements.toast.textContent = visibleText;
    elements.toast.classList.remove("hidden");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
        elements.toast.classList.add("hidden");
    }, 2600);
}

function safeSetText(selector, value) {
    document.querySelectorAll(selector).forEach(function (node) {
        node.textContent = value;
    });
}

function renderProfile() {
    const playerName = sanitizeVisibleText(state.player && state.player.name, "Новый игрок");
    const playerMoney = Number(state.player && state.player.money || 0);
    const playerRating = Number(state.player && state.player.rating || 0);
    elements.profileName.textContent = playerName;
    elements.profileMoney.textContent = formatMoney(playerMoney);
    if (elements.profileRating) {
        elements.profileRating.textContent = String(playerRating);
    }
    elements.shopMoney.textContent = playerMoney + " монет";
    elements.profileAvatar.textContent = playerName.slice(0, 1).toUpperCase();
}

function renderInventory() {
    if (elements.inventoryPlaceholder) {
        elements.inventoryPlaceholder.innerHTML = "<h3>Пока аугментаций нет</h3><p>Купленные модули будут появляться здесь и распределяться по типам.</p>";
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

function refreshStaticCopy() {
    document.title = "Полюс";

    const setText = function (id, value) {
        const node = document.getElementById(id);
        if (node) {
            node.textContent = value;
        }
    };
    const setPlaceholder = function (id, value) {
        const node = document.getElementById(id);
        if (node) {
            node.setAttribute("placeholder", value);
        }
    };

    setText("find-match-button", "Найти матч");
    setText("bot-duel-button", "Быстрая дуэль (бот)");
    setText("queue-cancel-button", "Отменить");
    setText("social-chat-close", "Закрыть");
    setText("social-chat-thread-title", "Выбери чат");
    setText("duel-tab-logs", "Логи");
    setText("duel-tab-chat", "Чат");
    setText("duel-clear-log-button", "Очистить");
    setText("duel-close-button", "Выйти");
    setText("duel-title", "Дуэль");
    setText("start-duel-title", "Начать бой?");
    setText("start-duel-copy", "Подтверди, что хочешь войти в бой.");
    setText("start-duel-cancel", "Нет, вернуться в хаб");
    setText("start-duel-confirm", "Да, начать бой");
    setText("duel-exit-cancel", "Нет, остаться");
    setText("duel-exit-confirm", "Да, выйти");
    setText("duel-result-title", "Бой завершен");
    setText("duel-result-close", "В хаб");
    setText("journal-zone-label", "Зона");
    setPlaceholder("friend-search-input", "Найти игрока по никнейму");
    setPlaceholder("social-chat-input", "Напиши сообщение");
    setPlaceholder("duel-chat-input", "Напиши сообщение сопернику");
    setPlaceholder("registration-nickname", "Например, Бакунин");

    safeSetText(".panel-kicker", "Профиль");
    safeSetText("#profile-name", state.player && state.player.name ? state.player.name : "Новый игрок");
    safeSetText(".queue-status-label", "Поиск дуэли");
    safeSetText("#queue-status-note", "Ищем соперника в очереди.");
    safeSetText("#screen-home .panel-title.panel-title-small", "Дневник");
    safeSetText(".journal-zone-label", "Зона");
    safeSetText("#screen-inventory .panel-title", "Доступные аугментации");
    safeSetText("#inventory-placeholder h3", "Пока аугментаций нет");
    safeSetText("#inventory-placeholder p", "Купленные модули будут появляться здесь и распределяться по типам.");
    safeSetText("#screen-friends .panel-title", "Друзья");
    safeSetText("#friend-search-form button", "Добавить");
    safeSetText("#screen-shop .panel-title", "Магазин");
    safeSetText("#shop-money", (state.player ? Number(state.player.money || 0) : 0) + " монет");
    safeSetText(".shop-tab[data-shop-section='weapon']", "Оружейная");
    safeSetText(".shop-tab[data-shop-section='defense']", "Защитная");
    safeSetText(".nav-button[data-nav-target='home'] .nav-title", "Хаб");
    safeSetText(".nav-button[data-nav-target='inventory'] .nav-title", "Инвентарь");
    safeSetText(".nav-button[data-nav-target='friends'] .nav-title", "Друзья");
    safeSetText(".nav-button[data-nav-target='shop'] .nav-title", "Магазин");
    safeSetText(".social-chat-fab-label", "Чаты");
    safeSetText(".social-chat-panel .panel-title.panel-title-small", "Чаты");
    safeSetText("#registration-modal .panel-title.panel-title-small", "Регистрация игрока");
    safeSetText("#registration-copy", "Ник будет привязан к твоему Telegram ID.");
    safeSetText("label[for='registration-nickname']", "Никнейм");
    safeSetText("#registration-style-label", "В каком стиле вы будете вести дневник?");
    safeSetText(".registration-style-option:nth-of-type(1) .registration-style-copy", "Я прибыл в Полюс.");
    safeSetText(".registration-style-option:nth-of-type(2) .registration-style-copy", "Я прибыла в Полюс.");
    safeSetText("#registration-submit", "Создать аккаунт");
    safeSetText(".duel-block-title", "Оружие");
    safeSetText(".vector-card:nth-of-type(1) h4", "Выстрел");
    safeSetText(".vector-card:nth-of-type(2) h4", "Уворот");
    safeSetText(".weapon-option[data-value='PISTOLS'] strong", "Пистоль и щит");
    safeSetText(".weapon-option[data-value='PISTOLS'] .weapon-stat", "18 урона");
    safeSetText(".weapon-option[data-value='PISTOLS'] .weapon-trait", "Шанс блокировать выстрел 30%");
    safeSetText(".weapon-option[data-value='RIFLE'] strong", "Винтовка");
    safeSetText(".weapon-option[data-value='RIFLE'] .weapon-stat", "30 урона");
    safeSetText(".weapon-option[data-value='RIFLE'] .weapon-trait", "Игнорирует блокирование");
    safeSetText(".weapon-option[data-value='SHOTGUN'] strong", "Дробовик");
    safeSetText(".weapon-option[data-value='SHOTGUN'] .weapon-stat", "5-25 урона");
    safeSetText(".weapon-option[data-value='SHOTGUN'] .weapon-trait", "Вероятность зацепа 35%");
    safeSetText(".direction-button[data-value='LEFT']", "Лево");
    safeSetText(".direction-button[data-value='CENTER']", "Центр");
    safeSetText(".direction-button[data-value='RIGHT']", "Право");
}

function syncPlayerFromServer(player, resetEconomy) {
    state.player.id = player.id;
    state.player.name = player.nickname || player.displayName || state.player.name || "Новый игрок";
    state.player.telegramUserId = player.telegramUserId || null;
    state.player.rating = typeof player.rating === "number" ? player.rating : (state.player.rating || 0);
    if (resetEconomy || typeof state.player.money !== "number" || typeof player.coins === "number") {
        state.player.money = typeof player.coins === "number" ? player.coins : 0;
    }
    state.player.wins = typeof player.wins === "number" ? player.wins : (state.player.wins || 0);
    state.player.losses = typeof player.losses === "number" ? player.losses : (state.player.losses || 0);
}

function applyFriendsOverview(payload) {
    state.friends = Array.isArray(payload && payload.friends) ? payload.friends.map(function (entry) {
        return {
            id: entry.playerId,
            name: entry.displayName,
            rating: entry.rating || 0,
            status: entry.online ? "online" : "offline"
        };
    }) : [];
    state.friendRequests = Array.isArray(payload && payload.incomingRequests) ? payload.incomingRequests.map(function (entry) {
        return {
            id: entry.requestId,
            playerId: entry.playerId,
            name: entry.displayName,
            rating: entry.rating || 0,
            status: entry.online ? "online" : "offline"
        };
    }) : [];
    syncSocialThreadsWithFriends();
    saveState();
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
        : "Ник будет привязан к твоему Telegram ID.";
    if (!elements.registrationNickname.value) {
        elements.registrationNickname.value = auth.nickname || "";
    }
    const checked = document.querySelector('input[name="registration-journal-style"]:checked');
    if (!checked && auth.journalStyle) {
        const savedOption = document.querySelector('input[name="registration-journal-style"][value="' + auth.journalStyle + '"]');
        if (savedOption) {
            savedOption.checked = true;
        }
    }
    if (auth.initError && !auth.demoMode) {
        showRegistrationError(auth.initError);
    } else {
        elements.registrationError.textContent = "";
        elements.registrationError.classList.add("hidden");
    }
}

async function submitRegistration() {
    const nickname = (elements.registrationNickname.value || "").trim();
    const checkedStyle = document.querySelector('input[name="registration-journal-style"]:checked');
    const journalStyle = checkedStyle ? checkedStyle.value : "";
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
    if (!journalStyle) {
        showRegistrationError("Выбери стиль дневника.");
        return;
    }
    elements.registrationSubmit.disabled = true;
    try {
        if (state.auth && state.auth.demoMode) {
            state.auth.nickname = nickname;
            state.auth.journalStyle = journalStyle;
            state.auth.registered = true;
            state.player.name = nickname;
            state.player.money = 0;
            state.player.rating = 0;
            saveState();
            renderAll();
            showToast("Аккаунт зарегистрирован.");
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
            body: JSON.stringify({
                nickname: nickname,
                journalStyle: journalStyle
            })
        });
        if (!response.ok) {
            throw new Error(await readApiError(response));
        }
        const player = await response.json();
        state.auth.nickname = player.nickname || nickname;
        state.auth.journalStyle = player.journalStyle || journalStyle;
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

function renderProfile() {
    const playerName = sanitizeVisibleText(state.player && state.player.name, "Новый игрок");
    const playerMoney = Number(state.player && state.player.money || 0);
    const playerRating = Number(state.player && state.player.rating || 0);
    elements.profileName.textContent = playerName;
    elements.profileMoney.textContent = formatMoney(playerMoney);
    if (elements.profileRating) {
        elements.profileRating.textContent = String(playerRating);
    }
    elements.shopMoney.textContent = playerMoney + " монет";
    elements.profileAvatar.textContent = playerName.slice(0, 1).toUpperCase();
}

function renderInventory() {
    if (elements.inventoryPlaceholder) {
        elements.inventoryPlaceholder.innerHTML = "<h3>Пока аугментаций нет</h3><p>Купленные модули будут появляться здесь и распределяться по типам.</p>";
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
        elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Открой чат через карточку друга.</div>';
        elements.socialChatInput.disabled = true;
        elements.socialChatSend.disabled = true;
        return;
    }

    elements.socialChatThreadList.innerHTML = threads.map(function (thread) {
        const friendName = sanitizeVisibleText(thread.friendName, "Друг");
        return [
            '<button class="social-chat-thread-card' + (activeThread && activeThread.id === thread.id ? ' is-active' : '') + '" type="button" data-social-thread-id="' + escapeHtml(thread.id) + '">',
            '<strong>' + escapeHtml(friendName) + '</strong>',
            '<span>' + escapeHtml((thread.status === "online" ? "Онлайн" : "Оффлайн") + ' · Рейтинг ' + (thread.rating || 0)) + '</span>',
            '</button>'
        ].join('');
    }).join('');

    if (!activeThread) {
        elements.socialChatThreadTitle.textContent = "Выбери чат";
        elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Открой чат через карточку друга.</div>';
        elements.socialChatInput.disabled = true;
        elements.socialChatSend.disabled = true;
        return;
    }

    elements.socialChatThreadTitle.textContent = sanitizeVisibleText(activeThread.friendName, "Друг");
    elements.socialChatMessages.innerHTML = (activeThread.messages || []).length
        ? (activeThread.messages || []).map(function (message) {
            const own = message.author === "you";
            const authorName = own ? sanitizeVisibleText(state.player.name, "Ты") : sanitizeVisibleText(activeThread.friendName, "Друг");
            const messageText = sanitizeVisibleText(message.text, "Сообщение скрыто.");
            return [
                '<div class="social-chat-message' + (own ? ' social-chat-message-own' : '') + '">',
                '<div class="social-chat-message-bubble">',
                '<strong>' + escapeHtml(authorName) + '</strong>',
                '<p>' + escapeHtml(messageText) + '</p>',
                '<small>' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</small>',
                '</div>',
                '</div>'
            ].join('');
        }).join('')
        : '<div class="social-chat-empty">Пока сообщений нет. Напиши первым.</div>';
    elements.socialChatInput.disabled = false;
    elements.socialChatSend.disabled = false;
    elements.socialChatMessages.scrollTop = elements.socialChatMessages.scrollHeight;
}

const LEGACY_RENDER_DUEL = renderDuel;
const FINAL_CLEAN_AUGMENT_COPY = {
    weaponBrassSights: { name: "Прицельная рамка", description: "+5 к урону", slot: "weapon", price: 100 },
    weaponDoubleTap: { name: "Рискованный затвор", description: "5% двойной урон · 5% осечка", slot: "weapon", price: 100 },
    defensePlating: { name: "Северная бронепластина", description: "-3 входящего урона", slot: "defense", price: 100 },
    defenseHeatSink: { name: "Усиленный каркас", description: "+15 здоровья", slot: "defense", price: 100 }
};

function looksLikeMojibake(text) {
    if (typeof text !== "string" || !text) {
        return false;
    }
    return /Р.|С.|Р |РЎ|Ѓ|‚|„|…|†|‡|€‰|Љ|Њ|Ћ|Џ|љ|њ|ќ|ћ|џ/.test(text);
}

function sanitizeVisibleText(text, fallback) {
    if (text == null) {
        return fallback || "";
    }
    const normalized = String(text).trim();
    if (!normalized) {
        return fallback || "";
    }
    return looksLikeMojibake(normalized) ? (fallback || "") : normalized;
}

function renderHeroStats() {
    if (elements.heroStats) {
        elements.heroStats.innerHTML = "";
        elements.heroStats.classList.add("hidden");
    }
    if (elements.statPointsBadge) {
        elements.statPointsBadge.textContent = "0";
        elements.statPointsBadge.classList.add("hidden");
    }
}

function getPlayerMaxHp() {
    return hasAugment("defenseHeatSink") ? 115 : 100;
}

function getWeaponDamageBonus(side, weaponCode) {
    return hasAugment("weaponBrassSights") ? 5 : 0;
}

function rollWeaponGamble(side) {
    if (!hasAugment("weaponDoubleTap")) {
        return { jammed: false, doubled: false };
    }
    const roll = Math.random();
    if (roll < 0.05) {
        return { jammed: true, doubled: false };
    }
    if (roll < 0.10) {
        return { jammed: false, doubled: true };
    }
    return { jammed: false, doubled: false };
}

function applyDefenseReduction(side, damage, isGraze, lines, defenderName) {
    if (!hasAugment("defensePlating")) {
        return Math.max(0, damage);
    }
    const reduced = Math.max(0, damage - 3);
    if (reduced !== damage && Array.isArray(lines)) {
        lines.push(defenderName + " смягчает урон бронепластиной.");
    }
    return reduced;
}

function repairStateAfterLegacyLoad() {
    if (!state || typeof state !== "object") {
        return;
    }
    state.player = state.player || {};
    state.player.name = sanitizeVisibleText(state.player.name, "Новый игрок");
    state.player.money = Number(state.player.money || 0);
    state.player.rating = Number(state.player.rating || 0);
    state.auth = Object.assign({ sessionToken: null, playerId: null, telegramUserId: null, nickname: "", registered: false, demoMode: false, initError: "", journalStyle: "" }, state.auth || {});
    state.social = Object.assign({ isOpen: false, activeThreadId: null, threads: [] }, state.social || {});
    state.social.threads = (Array.isArray(state.social.threads) ? state.social.threads : []).map(function (thread) {
        return Object.assign({}, thread, {
            friendName: sanitizeVisibleText(thread.friendName, "Друг"),
            messages: (Array.isArray(thread.messages) ? thread.messages : []).map(function (message) {
                return Object.assign({}, message, {
                    text: sanitizeVisibleText(message.text, "Сообщение скрыто.")
                });
            })
        });
    });
    state.friends = (Array.isArray(state.friends) ? state.friends : []).map(function (friend) {
        return Object.assign({}, friend, {
            name: sanitizeVisibleText(friend.name, "Игрок")
        });
    });
    state.friendRequests = (Array.isArray(state.friendRequests) ? state.friendRequests : []).map(function (request) {
        return Object.assign({}, request, {
            name: sanitizeVisibleText(request.name, "Игрок")
        });
    });
    state.journal = Array.isArray(state.journal) ? state.journal.slice(0, 20).map(function (entry) {
        return Object.assign({}, entry, {
            text: sanitizeVisibleText(entry.text, "Запись дневника обновлена.")
        });
    }) : [];
    if (state.duel) {
        state.duel.autoBattleEnabled = false;
        state.duel.autoBattlePendingEnabled = null;
        state.duel.autoResolutionAt = null;
        state.duel.chatError = sanitizeVisibleText(state.duel.chatError, "");
        state.duel.resultText = sanitizeVisibleText(state.duel.resultText, "");
        state.duel.logs = (Array.isArray(state.duel.logs) ? state.duel.logs : []).map(function (entry) {
            return {
                round: entry.round,
                roundNumber: entry.roundNumber,
                lines: (Array.isArray(entry.lines) ? entry.lines : []).map(function (line, index) {
                    return sanitizeVisibleText(line, index === 0 ? "Раунд " + (entry.round || entry.roundNumber || 1) : "");
                }).filter(Boolean)
            };
        }).filter(function (entry) { return entry.lines.length > 0; });
        state.duel.chatMessages = (Array.isArray(state.duel.chatMessages) ? state.duel.chatMessages : []).map(function (message) {
            return Object.assign({}, message, {
                displayName: sanitizeVisibleText(message.displayName, message && message.systemMessage ? "Система" : "Игрок"),
                text: sanitizeVisibleText(message.text, message && message.systemMessage ? "Системное сообщение обновлено." : "Сообщение скрыто.")
            });
        });
    }
}

function refreshStaticCopy() {
    document.title = "Полюс";

    const setText = function (id, value) {
        const node = document.getElementById(id);
        if (node) {
            node.textContent = value;
        }
    };
    const setPlaceholder = function (id, value) {
        const node = document.getElementById(id);
        if (node) {
            node.setAttribute("placeholder", value);
        }
    };

    setText("find-match-button", "Найти матч");
    setText("bot-duel-button", "Быстрая дуэль (бот)");
    setText("queue-cancel-button", "Отменить");
    setText("social-chat-close", "Закрыть");
    setText("social-chat-thread-title", "Выбери чат");
    setText("duel-tab-logs", "Логи");
    setText("duel-tab-chat", "Чат");
    setText("duel-clear-log-button", "Очистить");
    setText("duel-close-button", "Выйти");
    setText("duel-title", "Дуэль");
    setText("start-duel-title", "Начать бой?");
    setText("start-duel-copy", "Подтверди, что хочешь войти в бой.");
    setText("start-duel-cancel", "Нет, вернуться в хаб");
    setText("start-duel-confirm", "Да, начать бой");
    setText("duel-exit-cancel", "Нет, остаться");
    setText("duel-exit-confirm", "Да, выйти");
    setText("duel-result-title", "Бой завершен");
    setText("duel-result-close", "В хаб");
    setText("journal-zone-label", "Зона");
    setText("shop-money", (state.player ? Number(state.player.money || 0) : 0) + " монет");
    setPlaceholder("friend-search-input", "Найти игрока по никнейму");
    setPlaceholder("social-chat-input", "Напиши сообщение");
    setPlaceholder("duel-chat-input", "Напиши сообщение сопернику");
    setPlaceholder("registration-nickname", "Например, Бакунин");

    safeSetText(".panel-kicker", "Профиль");
    safeSetText("#profile-name", state.player && state.player.name ? state.player.name : "Новый игрок");
    safeSetText(".queue-status-label", "Поиск дуэли");
    safeSetText("#queue-status-note", "Ищем соперника в очереди.");
    safeSetText("#screen-home .panel-title.panel-title-small", "Дневник");
    safeSetText(".journal-zone-label", "Зона");
    safeSetText("#screen-inventory .panel-title", "Доступные аугментации");
    safeSetText("#inventory-placeholder h3", "Пока аугментаций нет");
    safeSetText("#inventory-placeholder p", "Купленные модули будут появляться здесь и распределяться по типам.");
    safeSetText("#screen-friends .panel-title", "Друзья");
    safeSetText("#friend-search-form button", "Добавить");
    safeSetText("#screen-shop .panel-title", "Магазин");
    safeSetText(".shop-tab[data-shop-section='weapon']", "Оружейная");
    safeSetText(".shop-tab[data-shop-section='defense']", "Защитная");
    safeSetText(".nav-button[data-nav-target='home'] .nav-title", "Хаб");
    safeSetText(".nav-button[data-nav-target='inventory'] .nav-title", "Инвентарь");
    safeSetText(".nav-button[data-nav-target='friends'] .nav-title", "Друзья");
    safeSetText(".nav-button[data-nav-target='shop'] .nav-title", "Магазин");
    safeSetText(".social-chat-fab-label", "Чаты");
    safeSetText(".social-chat-panel .panel-title.panel-title-small", "Чаты");
    safeSetText("#registration-modal .panel-title.panel-title-small", "Регистрация игрока");
    safeSetText("#registration-copy", "Ник будет привязан к твоему Telegram ID.");
    safeSetText("label[for='registration-nickname']", "Никнейм");
    safeSetText("#registration-style-label", "В каком стиле вы будете вести дневник?");
    safeSetText(".registration-style-option:nth-of-type(1) .registration-style-copy", "Я прибыл в Полюс.");
    safeSetText(".registration-style-option:nth-of-type(2) .registration-style-copy", "Я прибыла в Полюс.");
    safeSetText("#registration-submit", "Создать аккаунт");
    safeSetText(".duel-block-title", "Оружие");
    safeSetText(".vector-card:nth-of-type(1) h4", "Выстрел");
    safeSetText(".vector-card:nth-of-type(2) h4", "Уворот");
    safeSetText(".weapon-option[data-value='PISTOLS'] strong", "Пистоль и щит");
    safeSetText(".weapon-option[data-value='PISTOLS'] .weapon-stat", "18 урона");
    safeSetText(".weapon-option[data-value='PISTOLS'] .weapon-trait", "Шанс блокировать выстрел 30%");
    safeSetText(".weapon-option[data-value='RIFLE'] strong", "Винтовка");
    safeSetText(".weapon-option[data-value='RIFLE'] .weapon-stat", "30 урона");
    safeSetText(".weapon-option[data-value='RIFLE'] .weapon-trait", "Игнорирует блокирование");
    safeSetText(".weapon-option[data-value='SHOTGUN'] strong", "Дробовик");
    safeSetText(".weapon-option[data-value='SHOTGUN'] .weapon-stat", "5-25 урона");
    safeSetText(".weapon-option[data-value='SHOTGUN'] .weapon-trait", "Вероятность зацепа 35%");
    safeSetText(".duel-toggle[data-duel-select='shot'][data-value='LEFT']", "Лево");
    safeSetText(".duel-toggle[data-duel-select='shot'][data-value='CENTER']", "Центр");
    safeSetText(".duel-toggle[data-duel-select='shot'][data-value='RIGHT']", "Право");
    safeSetText(".duel-toggle[data-duel-select='dodge'][data-value='LEFT']", "Лево");
    safeSetText(".duel-toggle[data-duel-select='dodge'][data-value='STAY']", "Центр");
    safeSetText(".duel-toggle[data-duel-select='dodge'][data-value='RIGHT']", "Право");
}

function syncPlayerFromServer(player, resetEconomy) {
    state.player.id = player.id;
    state.player.name = player.nickname || player.displayName || state.auth.nickname || state.player.name || "Новый игрок";
    state.player.telegramUserId = player.telegramUserId || null;
    state.player.rating = typeof player.rating === "number" ? player.rating : (state.player.rating || 0);
    if (resetEconomy || typeof state.player.money !== "number" || typeof player.coins === "number") {
        state.player.money = typeof player.coins === "number" ? player.coins : 0;
    }
    state.player.wins = typeof player.wins === "number" ? player.wins : (state.player.wins || 0);
    state.player.losses = typeof player.losses === "number" ? player.losses : (state.player.losses || 0);
}

function renderProfile() {
    const playerName = sanitizeVisibleText(state.player && state.player.name, "Новый игрок");
    const playerMoney = Number(state.player && state.player.money || 0);
    const playerRating = Number(state.player && state.player.rating || 0);
    elements.profileName.textContent = playerName;
    elements.profileMoney.textContent = String(playerMoney);
    if (elements.profileRating) {
        elements.profileRating.textContent = String(playerRating);
    }
    if (elements.shopMoney) {
        elements.shopMoney.textContent = playerMoney + " монет";
    }
    if (elements.profileAvatar) {
        elements.profileAvatar.textContent = playerName.slice(0, 1).toUpperCase();
    }
}

function renderRegistrationModal() {
    const auth = state.auth || {};
    const shouldOpen = !auth.registered || (!auth.nickname && (!state.player || !state.player.id || state.player.name === "Новый игрок"));
    elements.registrationModal.classList.toggle("hidden", !shouldOpen);
    elements.registrationModal.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
    if (!shouldOpen) {
        return;
    }
    elements.registrationCopy.textContent = auth.demoMode
        ? "Введи никнейм. Вне Telegram он сохранится только в этом браузере."
        : "Ник будет привязан к твоему Telegram ID.";
    if (!elements.registrationNickname.value) {
        elements.registrationNickname.value = auth.nickname || "";
    }
    const checked = document.querySelector('input[name=\"registration-journal-style\"]:checked');
    if (!checked && auth.journalStyle) {
        const savedOption = document.querySelector('input[name=\"registration-journal-style\"][value=\"' + auth.journalStyle + '\"]');
        if (savedOption) {
            savedOption.checked = true;
        }
    }
    if (auth.initError && !auth.demoMode) {
        showRegistrationError(auth.initError);
    } else {
        elements.registrationError.textContent = "";
        elements.registrationError.classList.add("hidden");
    }
}

async function submitRegistration() {
    const nickname = (elements.registrationNickname.value || "").trim();
    const checkedStyle = document.querySelector('input[name="registration-journal-style"]:checked');
    const journalStyle = checkedStyle ? checkedStyle.value : "";
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
    if (!/^[\\p{L}\\p{N}_-]+$/u.test(nickname)) {
        showRegistrationError("Ник может содержать только буквы, цифры, _ и -.");
        return;
    }
    if (!journalStyle) {
        showRegistrationError("Выбери стиль дневника.");
        return;
    }
    elements.registrationSubmit.disabled = true;
    try {
        if (state.auth && state.auth.demoMode) {
            state.auth.nickname = nickname;
            state.auth.journalStyle = journalStyle;
            state.auth.registered = true;
            state.player.name = nickname;
            state.player.money = 0;
            state.player.rating = 0;
            saveState();
            renderAll();
            showToast("Аккаунт зарегистрирован.");
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
            body: JSON.stringify({ nickname: nickname, journalStyle: journalStyle })
        });
        if (!response.ok) {
            throw new Error(await readApiError(response));
        }
        const player = await response.json();
        state.auth.nickname = player.nickname || nickname;
        state.auth.journalStyle = player.journalStyle || journalStyle;
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

function renderInventory() {
    if (!elements.inventoryPlaceholder) {
        return;
    }
    const unlocked = (Array.isArray(state.inventory && state.inventory.unlockedAugments) ? state.inventory.unlockedAugments : []).filter(function (id) {
        return Boolean(CLEAN_AUGMENT_COPY[id]);
    });
    if (!unlocked.length) {
        elements.inventoryPlaceholder.innerHTML = "<h3>Пока аугментаций нет</h3><p>Купленные модули будут появляться здесь и распределяться по типам.</p>";
        return;
    }
    const grouped = {
        weapon: unlocked.filter(function (id) { return CLEAN_AUGMENT_COPY[id].slot === "weapon"; }),
        defense: unlocked.filter(function (id) { return CLEAN_AUGMENT_COPY[id].slot === "defense"; })
    };
    elements.inventoryPlaceholder.innerHTML = [
        grouped.weapon.length ? '<section class="inventory-slot"><h3>Оружейная аугментация</h3>' + grouped.weapon.map(function (id) {
            const item = CLEAN_AUGMENT_COPY[id];
            return '<article class="inventory-card"><strong>' + escapeHtml(item.name) + '</strong><p>' + escapeHtml(item.description) + '</p></article>';
        }).join("") + '</section>' : "",
        grouped.defense.length ? '<section class="inventory-slot"><h3>Защитная аугментация</h3>' + grouped.defense.map(function (id) {
            const item = CLEAN_AUGMENT_COPY[id];
            return '<article class="inventory-card"><strong>' + escapeHtml(item.name) + '</strong><p>' + escapeHtml(item.description) + '</p></article>';
        }).join("") + '</section>' : ""
    ].join("");
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
                '<h3>' + escapeHtml(sanitizeVisibleText(request.name, "Игрок")) + '</h3>',
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
            '<h3>' + escapeHtml(sanitizeVisibleText(friend.name, "Игрок")) + '</h3>',
            '<div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'Онлайн' : 'Оффлайн') + '</span><span class="timer-chip">Рейтинг ' + escapeHtml(String(friend.rating || 0)) + '</span></div>',
            '<div class="friend-actions">',
            '<button class="secondary-button full-width" data-friend-chat-id="' + escapeHtml(friend.id) + '" type="button">Написать сообщение</button>',
            '<button class="secondary-button full-width friend-action-profile" data-friend-profile-id="' + escapeHtml(friend.id) + '" type="button">Посмотреть профиль</button>',
            '</div>',
            '</article>'
        ].join("");
    }).join("") : '<article class="friend-card"><p>Пока друзей нет. Найди игрока по никнейму и отправь запрос.</p></article>';
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
    document.body.classList.toggle("social-open", Boolean(state.social.isOpen));

    if (!threads.length) {
        elements.socialChatThreadList.innerHTML = '<article class="social-chat-empty">Открытые диалоги появятся здесь после первого сообщения другу.</article>';
        elements.socialChatThreadTitle.textContent = "Выбери чат";
        elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Открой чат через карточку друга.</div>';
        elements.socialChatInput.disabled = true;
        elements.socialChatSend.disabled = true;
        return;
    }

    elements.socialChatThreadList.innerHTML = threads.map(function (thread) {
        const friendName = sanitizeVisibleText(thread.friendName, "Друг");
        const statusText = thread.status === "online" ? "Онлайн" : "Оффлайн";
        return [
            '<button class="social-chat-thread-card' + (activeThread && activeThread.id === thread.id ? ' is-active' : '') + '" type="button" data-social-thread-id="' + escapeHtml(thread.id) + '">',
            '<strong>' + escapeHtml(friendName) + '</strong>',
            '<span>' + escapeHtml(statusText + " · Рейтинг " + (thread.rating || 0)) + '</span>',
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

    elements.socialChatThreadTitle.textContent = sanitizeVisibleText(activeThread.friendName, "Друг");
    elements.socialChatMessages.innerHTML = (activeThread.messages || []).length
        ? (activeThread.messages || []).map(function (message) {
            const own = message.author === "you";
            const authorName = own ? sanitizeVisibleText(state.player.name, "Ты") : sanitizeVisibleText(activeThread.friendName, "Друг");
            const messageText = sanitizeVisibleText(message.text, "Сообщение скрыто.");
            return [
                '<div class="social-chat-message' + (own ? ' social-chat-message-own' : '') + '">',
                '<div class="social-chat-message-bubble">',
                '<strong>' + escapeHtml(authorName) + '</strong>',
                '<p>' + escapeHtml(messageText) + '</p>',
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

function renderShop() {
    const activeSection = state.ui.shopSection || "weapon";
    elements.shopTabButtons.forEach(function (button) {
        button.classList.toggle("is-active", button.getAttribute("data-shop-section") === activeSection);
    });
    const items = (Array.isArray(state.shop) ? state.shop : []).filter(function (item) {
        return item.section === activeSection && CLEAN_AUGMENT_COPY[item.id];
    });
    elements.shopList.innerHTML = items.length ? '<section class="shop-section">' + items.map(function (item) {
        const copy = CLEAN_AUGMENT_COPY[item.id];
        const owned = item.kind === "augment" && hasAugment(item.augmentId);
        return '<article class="shop-card"><h3>' + escapeHtml(copy.name) + '</h3><div class="shop-price-row"><strong>' + escapeHtml(String(copy.price) + " монет") + '</strong></div><p class="shop-card-copy">' + escapeHtml(copy.description) + '</p><div class="shop-actions"><button class="primary-button" data-shop-id="' + escapeHtml(item.id) + '" type="button" onclick="window.PolusApp && window.PolusApp.buy(\'' + escapeJs(item.id) + '\')"' + (owned ? " disabled" : "") + '>' + (owned ? 'Куплено' : 'Купить') + '</button></div></article>';
    }).join("") + '</section>' : '<article class="shop-card"><p>Пока товаров в этом разделе нет.</p></article>';
}

function buildDuelStatusText(duel) {
    if (!duel) {
        return "";
    }
    if (duel.finished) {
        return sanitizeVisibleText(duel.resultText, "");
    }
    if (duel.mode === "pvp-live" && duel.yourActionSubmitted) {
        return hasPendingDuelChanges(duel)
            ? "Ты изменил выбор. Нажми «Изменить ход», чтобы обновить решение."
            : "Ход зафиксирован. Ждём соперника.";
    }
    return "";
}

function renderDuelChat(duel) {
    const isLiveChat = duel.mode === "pvp-live";
    const canWrite = isLiveChat && !duel.finished;
    const messages = duel.chatMessages || [];
    if (!messages.length) {
        elements.duelChatList.innerHTML = '<div class="duel-chat-entry"><p class="duel-chat-text">' + (isLiveChat ? "Чат пока пуст. Напиши сопернику первое сообщение." : "Чат доступен только в PvP-матче между двумя игроками.") + '</p></div>';
    } else {
        elements.duelChatList.innerHTML = messages.map(function (message) {
            const own = message.playerId && state.auth && message.playerId === state.auth.playerId;
            const systemMessage = Boolean(message.systemMessage);
            const extraClass = systemMessage ? " duel-chat-entry-system" : (own ? " duel-chat-entry-own" : "");
            const displayName = sanitizeVisibleText(message.displayName, systemMessage ? "Система" : "Игрок");
            const messageText = sanitizeVisibleText(message.text, systemMessage ? "Системное сообщение обновлено." : "Сообщение скрыто.");
            return '<div class="duel-chat-entry' + extraClass + '"><p class="duel-chat-meta">' + escapeHtml(displayName) + ' · ' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</p><p class="duel-chat-text">' + escapeHtml(messageText) + '</p></div>';
        }).join("");
    }
    elements.duelChatInput.disabled = !canWrite;
    elements.duelChatSendButton.disabled = !canWrite;
    elements.duelChatInput.placeholder = canWrite ? "Напиши сообщение сопернику" : "Чат недоступен";
    elements.duelChatError.textContent = sanitizeVisibleText(duel.chatError, "");
    elements.duelChatError.classList.toggle("hidden", !duel.chatError);
    elements.duelChatList.scrollTop = elements.duelChatList.scrollHeight;
}

function renderDuel() {
    LEGACY_RENDER_DUEL();
    const duel = state.duel;
    refreshStaticCopy();
    hideAutoBattleUi();
    if (!duel) {
        return;
    }
    elements.duelTitle.textContent = "Дуэль";
    elements.duelRoundPill.textContent = "Раунд " + duel.round;
    if (elements.duelRoundTimer && duel.roundDeadlineAt) {
        elements.duelRoundTimer.textContent = formatDuration(Math.max(0, duel.roundDeadlineAt - Date.now()));
    }
    if (elements.duelSubmitButton) {
        const hasPending = hasPendingDuelChanges(duel);
        const selectionComplete = isDuelSelectionComplete(duel);
        elements.duelSubmitButton.textContent = duel.finished
            ? "Бой завершен"
            : duel.yourActionSubmitted
                ? (hasPending ? "Изменить ход" : "Ход сделан")
                : "Сделать ход";
        elements.duelSubmitButton.disabled = duel.finished || !duel.canSubmitAction || !selectionComplete || (duel.yourActionSubmitted && !hasPending);
    }
    if (elements.duelLogList && !(duel.logs || []).length) {
        elements.duelLogList.innerHTML = '<div class="duel-log-round"><p class="duel-log-round-title">Логов пока нет. Первый обмен ходами появится здесь.</p></div>';
    }
    if (elements.duelYouName) {
        elements.duelYouName.textContent = sanitizeVisibleText(duel.playerName, sanitizeVisibleText(state.player.name, "Игрок"));
    }
    if (elements.duelOpponentName) {
        elements.duelOpponentName.textContent = sanitizeVisibleText(duel.opponentName, "Соперник");
    }
    if (elements.duelYouMeta) {
        elements.duelYouMeta.textContent = "";
    }
    if (elements.duelOpponentMeta) {
        elements.duelOpponentMeta.textContent = "";
    }
}

function openDuelResultModal(config) {
    const inferredVictory = Number(config.rating || 0) > 0 || Number(config.money || 0) >= BATTLE_VICTORY_COINS;
    const inferredDefeat = Number(config.rating || 0) < 0 || Number(config.money || 0) === BATTLE_DEFEAT_COINS;
    const fallbackTitle = inferredVictory ? "Победа" : (inferredDefeat ? "Поражение" : "Бой завершен");
    const fallbackCopy = inferredVictory ? "Ты победил в дуэли." : inferredDefeat ? "Ты проиграл в дуэли." : "Раундов больше не осталось.";
    state.ui.duelExitConfirmOpen = false;
    state.ui.duelResult = {
        title: sanitizeVisibleText(config.title, fallbackTitle),
        copy: sanitizeVisibleText(config.copy, fallbackCopy),
        rating: Number(config.rating ?? config.experience) || 0,
        money: Number(config.money) || 0
    };
    saveState();
    renderDuelResultModal();
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
    elements.duelResultTitle.textContent = sanitizeVisibleText(result.title, "Бой завершен");
    elements.duelResultCopy.textContent = sanitizeVisibleText(result.copy, "");
    elements.duelResultExp.textContent = formatSignedReward(result.rating || 0, " рейтинга");
    elements.duelResultMoney.textContent = formatSignedReward(result.money || 0, " монет");
}

function openLiveDuelResult(payload) {
    const isVictory = payload.resultLabel === "VICTORY";
    const isDefeat = payload.resultLabel === "DEFEAT";
    openDuelResultModal({
        title: isVictory ? "Победа" : isDefeat ? "Поражение" : "Бой завершен",
        copy: isVictory ? "Ты победил в дуэли." : isDefeat ? "Ты проиграл в дуэли." : "Раундов больше не осталось.",
        rating: isVictory ? PVP_RATING_DELTA : isDefeat ? -PVP_RATING_DELTA : 0,
        money: isVictory ? BATTLE_VICTORY_COINS : isDefeat ? BATTLE_DEFEAT_COINS : 0
    });
}

function renderAll() {
    repairStateAfterLegacyLoad();
    refreshStaticCopy();
    renderScreens();
    renderProfile();
    renderHeroStats();
    renderRegistrationModal();
    renderQueueStatus();
    renderJournal();
    renderInventory();
    renderFriends();
    decorateFriendCards();
    renderSocialInbox();
    renderShop();
    renderDuel();
    renderStartDuelModal();
    renderDuelExitModal();
    renderDuelResultModal();
    stripInlineButtonActions();
}

const FINAL_DUEL_RENDER = renderDuel;
const FINAL_AUGMENT_COPY = {
    weaponBrassSights: { name: "Прицельная рамка", description: "+5 к урону", slot: "weapon", price: 100 },
    weaponDoubleTap: { name: "Рискованный затвор", description: "5% двойной урон · 5% осечка", slot: "weapon", price: 100 },
    defensePlating: { name: "Северная бронепластина", description: "-3 входящего урона", slot: "defense", price: 100 },
    defenseHeatSink: { name: "Усиленный каркас", description: "+15 здоровья", slot: "defense", price: 100 }
};

function looksLikeMojibake(text) {
    if (typeof text !== "string" || !text) {
        return false;
    }
    const suspiciousPairs = text.match(/[РС][^\s]/g);
    return Boolean(suspiciousPairs && suspiciousPairs.length >= 2);
}

function sanitizeVisibleText(text, fallback) {
    if (text == null) {
        return fallback || "";
    }
    const normalized = String(text).trim();
    if (!normalized) {
        return fallback || "";
    }
    return looksLikeMojibake(normalized) ? (fallback || "") : normalized;
}

function getFinalAugmentCopy(id) {
    return FINAL_AUGMENT_COPY[id] || null;
}

function renderHeroStats() {
    if (elements.heroStats) {
        elements.heroStats.innerHTML = "";
        elements.heroStats.classList.add("hidden");
    }
    if (elements.statPointsBadge) {
        elements.statPointsBadge.textContent = "0";
        elements.statPointsBadge.classList.add("hidden");
    }
}

function getPlayerMaxHp() {
    return hasAugment("defenseHeatSink") ? 115 : 100;
}

function getWeaponDamageBonus(side, weaponCode) {
    return hasAugment("weaponBrassSights") ? 5 : 0;
}

function rollWeaponGamble(side) {
    if (!hasAugment("weaponDoubleTap")) {
        return { jammed: false, doubled: false };
    }
    const roll = Math.random();
    if (roll < 0.05) {
        return { jammed: true, doubled: false };
    }
    if (roll < 0.10) {
        return { jammed: false, doubled: true };
    }
    return { jammed: false, doubled: false };
}

function applyDefenseReduction(side, damage, isGraze, lines, defenderName) {
    if (!hasAugment("defensePlating")) {
        return Math.max(0, damage);
    }
    const reduced = Math.max(0, damage - 3);
    if (reduced !== damage && Array.isArray(lines)) {
        lines.push(defenderName + " смягчает урон бронепластиной.");
    }
    return reduced;
}

function repairStateAfterLegacyLoad() {
    if (!state || typeof state !== "object") {
        return;
    }

    state.player = state.player || {};
    state.auth = Object.assign({
        sessionToken: null,
        playerId: null,
        telegramUserId: null,
        nickname: "",
        registered: false,
        demoMode: false,
        initError: "",
        journalStyle: ""
    }, state.auth || {});
    state.ui = Object.assign({
        screen: "home",
        shopSection: "weapon",
        duelExitConfirmOpen: false,
        startDuelConfirm: null,
        startDuelAction: null,
        duelResult: null
    }, state.ui || {});
    state.social = Object.assign({ isOpen: false, activeThreadId: null, threads: [] }, state.social || {});

    const fallbackName = sanitizeVisibleText(state.auth.nickname, "") || "Новый игрок";
    state.player.name = sanitizeVisibleText(state.player.name, fallbackName);
    state.player.money = Number(state.player.money || 0);
    state.player.rating = Number(state.player.rating || 0);

    state.friends = (Array.isArray(state.friends) ? state.friends : []).map(function (friend) {
        return Object.assign({}, friend, {
            name: sanitizeVisibleText(friend.name, "Игрок")
        });
    });
    state.friendRequests = (Array.isArray(state.friendRequests) ? state.friendRequests : []).map(function (request) {
        return Object.assign({}, request, {
            name: sanitizeVisibleText(request.name, "Игрок")
        });
    });
    state.social.threads = (Array.isArray(state.social.threads) ? state.social.threads : []).map(function (thread) {
        return Object.assign({}, thread, {
            friendName: sanitizeVisibleText(thread.friendName, "Друг"),
            messages: (Array.isArray(thread.messages) ? thread.messages : []).map(function (message) {
                const fallbackMessage = message && message.systemMessage ? "Системное сообщение обновлено." : "Сообщение скрыто.";
                return Object.assign({}, message, {
                    displayName: sanitizeVisibleText(message.displayName, message && message.systemMessage ? "Система" : "Игрок"),
                    text: sanitizeVisibleText(message.text, fallbackMessage)
                });
            })
        });
    });

    if (Array.isArray(state.journal)) {
        state.journal = state.journal.slice(0, 20).map(function (entry) {
            return Object.assign({}, entry, {
                text: sanitizeVisibleText(entry.text, "Запись дневника обновлена."),
                locationLabel: sanitizeVisibleText(entry.locationLabel, JOURNAL_LOCATION_LABELS[entry.location] || "Город")
            });
        });
    } else if (state.journal && Array.isArray(state.journal.entries)) {
        state.journal = state.journal.entries.slice(0, 20).map(function (entry) {
            return Object.assign({}, entry, {
                text: sanitizeVisibleText(entry.text, "Запись дневника обновлена."),
                locationLabel: sanitizeVisibleText(entry.locationLabel, JOURNAL_LOCATION_LABELS[entry.location] || "Город")
            });
        });
    } else {
        state.journal = [];
    }

    if (state.duel) {
        state.duel.autoBattleEnabled = false;
        state.duel.autoBattlePendingEnabled = null;
        state.duel.autoResolutionAt = null;
        state.duel.chatError = sanitizeVisibleText(state.duel.chatError, "");
        state.duel.resultText = sanitizeVisibleText(state.duel.resultText, "");
        state.duel.logs = (Array.isArray(state.duel.logs) ? state.duel.logs : []).map(function (entry) {
            return {
                round: entry.round,
                roundNumber: entry.roundNumber,
                lines: (Array.isArray(entry.lines) ? entry.lines : []).map(function (line, index) {
                    return sanitizeVisibleText(line, index === 0 ? "Раунд " + (entry.round || entry.roundNumber || 1) : "");
                }).filter(Boolean)
            };
        }).filter(function (entry) {
            return entry.lines.length > 0;
        });
        state.duel.chatMessages = (Array.isArray(state.duel.chatMessages) ? state.duel.chatMessages : []).map(function (message) {
            const fallbackMessage = message && message.systemMessage ? "Системное сообщение обновлено." : "Сообщение скрыто.";
            return Object.assign({}, message, {
                displayName: sanitizeVisibleText(message.displayName, message && message.systemMessage ? "Система" : "Игрок"),
                text: sanitizeVisibleText(message.text, fallbackMessage)
            });
        });
    }
}

function refreshStaticCopy() {
    document.title = "Полюс";

    const setText = function (id, value) {
        const node = document.getElementById(id);
        if (node) {
            node.textContent = value;
        }
    };
    const setPlaceholder = function (id, value) {
        const node = document.getElementById(id);
        if (node) {
            node.setAttribute("placeholder", value);
        }
    };

    setText("find-match-button", "Найти матч");
    setText("bot-duel-button", "Быстрая дуэль (бот)");
    setText("queue-cancel-button", "Отменить");
    setText("social-chat-close", "Закрыть");
    setText("social-chat-thread-title", "Выбери чат");
    setText("duel-tab-logs", "Логи");
    setText("duel-tab-chat", "Чат");
    setText("duel-clear-log-button", "Очистить");
    setText("duel-close-button", "Выйти");
    setText("duel-title", "Дуэль");
    setText("start-duel-title", "Начать бой?");
    setText("start-duel-copy", "Подтверди, что хочешь войти в бой.");
    setText("start-duel-cancel", "Нет, вернуться в хаб");
    setText("start-duel-confirm", "Да, начать бой");
    setText("duel-exit-cancel", "Нет, остаться");
    setText("duel-exit-confirm", "Да, выйти");
    setText("duel-result-title", "Бой завершен");
    setText("duel-result-close", "В хаб");
    setText("shop-money", String(Number(state.player && state.player.money || 0)) + " монет");

    setPlaceholder("friend-search-input", "Найти игрока по никнейму");
    setPlaceholder("social-chat-input", "Напиши сообщение");
    setPlaceholder("duel-chat-input", "Напиши сообщение сопернику");
    setPlaceholder("registration-nickname", "Например, Бакунин");

    safeSetText(".panel-kicker", "Профиль");
    safeSetText(".queue-status-label", "Поиск дуэли");
    safeSetText("#queue-status-note", "Ищем соперника в очереди.");
    safeSetText("#screen-home .panel-title.panel-title-small", "Дневник");
    safeSetText(".journal-zone-label", "Зона");
    safeSetText("#screen-inventory .panel-title", "Доступные аугментации");
    safeSetText("#screen-friends .panel-title", "Друзья");
    safeSetText("#friend-search-form button", "Добавить");
    safeSetText("#screen-shop .panel-title", "Магазин");
    safeSetText(".shop-tab[data-shop-section='weapon']", "Оружейная");
    safeSetText(".shop-tab[data-shop-section='defense']", "Защитная");
    safeSetText(".social-chat-fab-label", "Чаты");
    safeSetText("#social-chat-panel .panel-title.panel-title-small", "Чаты");
    safeSetText("#registration-modal .panel-title.panel-title-small", "Регистрация игрока");
    safeSetText("#registration-style-label", "В каком стиле вы будете вести дневник?");
    safeSetText(".registration-style-option:nth-of-type(1) .registration-style-copy", "Я прибыл в Полюс.");
    safeSetText(".registration-style-option:nth-of-type(2) .registration-style-copy", "Я прибыла в Полюс.");
    safeSetText("#registration-submit", "Создать аккаунт");
    safeSetText(".duel-result-chip:nth-of-type(1) span", "Рейтинг");
    safeSetText(".duel-result-chip:nth-of-type(2) span", "Монеты");
    safeSetText(".duel-block-title", "Оружие");
    safeSetText(".vector-card:nth-of-type(1) h4", "Выстрел");
    safeSetText(".vector-card:nth-of-type(2) h4", "Уворот");
    safeSetText(".weapon-option[data-value='PISTOLS'] strong", "Пистоль и щит");
    safeSetText(".weapon-option[data-value='PISTOLS'] .weapon-stat", "18 урона");
    safeSetText(".weapon-option[data-value='PISTOLS'] .weapon-trait", "Шанс блокировать выстрел 30%");
    safeSetText(".weapon-option[data-value='RIFLE'] strong", "Винтовка");
    safeSetText(".weapon-option[data-value='RIFLE'] .weapon-stat", "30 урона");
    safeSetText(".weapon-option[data-value='RIFLE'] .weapon-trait", "Игнорирует блокирование");
    safeSetText(".weapon-option[data-value='SHOTGUN'] strong", "Дробовик");
    safeSetText(".weapon-option[data-value='SHOTGUN'] .weapon-stat", "5-25 урона");
    safeSetText(".weapon-option[data-value='SHOTGUN'] .weapon-trait", "Вероятность зацепа 35%");
    safeSetText(".duel-toggle[data-duel-select='shot'][data-value='LEFT']", "Лево");
    safeSetText(".duel-toggle[data-duel-select='shot'][data-value='CENTER']", "Центр");
    safeSetText(".duel-toggle[data-duel-select='shot'][data-value='RIGHT']", "Право");
    safeSetText(".duel-toggle[data-duel-select='dodge'][data-value='LEFT']", "Лево");
    safeSetText(".duel-toggle[data-duel-select='dodge'][data-value='STAY']", "Центр");
    safeSetText(".duel-toggle[data-duel-select='dodge'][data-value='RIGHT']", "Право");
    safeSetText(".nav-button[data-nav-target='home'] .nav-title", "Хаб");
    safeSetText(".nav-button[data-nav-target='inventory'] .nav-title", "Инвентарь");
    safeSetText(".nav-button[data-nav-target='friends'] .nav-title", "Друзья");
    safeSetText(".nav-button[data-nav-target='shop'] .nav-title", "Магазин");
}

function syncPlayerFromServer(player, resetEconomy) {
    state.player.id = player.id;
    state.player.name = sanitizeVisibleText(player.nickname, "")
        || sanitizeVisibleText(player.displayName, "")
        || sanitizeVisibleText(state.auth.nickname, "")
        || sanitizeVisibleText(state.player.name, "Новый игрок")
        || "Новый игрок";
    state.player.telegramUserId = player.telegramUserId || null;
    state.player.rating = typeof player.rating === "number" ? player.rating : Number(state.player.rating || 0);
    if (resetEconomy || typeof state.player.money !== "number" || typeof player.coins === "number") {
        state.player.money = typeof player.coins === "number" ? player.coins : Number(state.player.money || 0);
    }
    state.player.wins = typeof player.wins === "number" ? player.wins : Number(state.player.wins || 0);
    state.player.losses = typeof player.losses === "number" ? player.losses : Number(state.player.losses || 0);
}

function renderProfile() {
    const playerName = sanitizeVisibleText(state.player && state.player.name, sanitizeVisibleText(state.auth && state.auth.nickname, "Новый игрок")) || "Новый игрок";
    const playerMoney = Number(state.player && state.player.money || 0);
    const playerRating = Number(state.player && state.player.rating || 0);
    elements.profileName.textContent = playerName;
    elements.profileMoney.textContent = String(playerMoney);
    if (elements.profileRating) {
        elements.profileRating.textContent = String(playerRating);
    }
    if (elements.shopMoney) {
        elements.shopMoney.textContent = playerMoney + " монет";
    }
    if (elements.profileAvatar) {
        elements.profileAvatar.textContent = playerName.slice(0, 1).toUpperCase();
    }
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
    elements.queueStatusNote.textContent = sanitizeVisibleText(state.matchmaking.message, "Ищем соперника в очереди.");
    elements.queueCancelButton.disabled = false;
}

function renderJournal() {
    if (!elements.journalList) {
        return;
    }
    if (!Array.isArray(state.journal) || !state.journal.length) {
        elements.journalList.innerHTML = '<article class="journal-entry"><p>Записей пока нет.</p></article>';
        return;
    }
    elements.journalList.innerHTML = state.journal.slice(0, 20).map(function (entry) {
        const zoneLabel = sanitizeVisibleText(entry.locationLabel, JOURNAL_LOCATION_LABELS[entry.location] || "Город");
        return '<article class="journal-entry"><p>' + decorateText(sanitizeVisibleText(entry.text, "Запись дневника обновлена.")) + '</p><small>' + escapeHtml(zoneLabel + " · " + formatTimestamp(entry.createdAt || Date.now())) + '</small></article>';
    }).join("");
}

function renderRegistrationModal() {
    const auth = state.auth || {};
    const currentName = sanitizeVisibleText(state.player && state.player.name, "");
    const shouldOpen = !auth.registered || !sanitizeVisibleText(auth.nickname, "") || !currentName || currentName === "Новый игрок";
    elements.registrationModal.classList.toggle("hidden", !shouldOpen);
    elements.registrationModal.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
    if (!shouldOpen) {
        return;
    }
    elements.registrationCopy.textContent = auth.demoMode
        ? "Введи никнейм. Вне Telegram он сохранится только в этом браузере."
        : "Ник будет привязан к твоему Telegram ID.";
    if (!elements.registrationNickname.value) {
        elements.registrationNickname.value = sanitizeVisibleText(auth.nickname, "");
    }
    if (auth.journalStyle) {
        const savedOption = document.querySelector('input[name="registration-journal-style"][value="' + auth.journalStyle + '"]');
        if (savedOption) {
            savedOption.checked = true;
        }
    }
    if (auth.initError && !auth.demoMode) {
        showRegistrationError(auth.initError);
    } else {
        elements.registrationError.textContent = "";
        elements.registrationError.classList.add("hidden");
    }
}

async function submitRegistration() {
    const nickname = (elements.registrationNickname.value || "").trim();
    const checkedStyle = document.querySelector('input[name="registration-journal-style"]:checked');
    const journalStyle = checkedStyle ? checkedStyle.value : "";
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
    if (!journalStyle) {
        showRegistrationError("Выбери стиль дневника.");
        return;
    }

    elements.registrationSubmit.disabled = true;
    try {
        if (state.auth && state.auth.demoMode) {
            state.auth.nickname = nickname;
            state.auth.journalStyle = journalStyle;
            state.auth.registered = true;
            state.player.name = nickname;
            state.player.money = 0;
            state.player.rating = 0;
            saveState();
            renderAll();
            showToast("Аккаунт зарегистрирован.");
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
            body: JSON.stringify({ nickname: nickname, journalStyle: journalStyle })
        });
        if (!response.ok) {
            throw new Error(await readApiError(response));
        }
        const player = await response.json();
        state.auth.nickname = player.nickname || nickname;
        state.auth.journalStyle = player.journalStyle || journalStyle;
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

function renderInventory() {
    if (!elements.inventoryPlaceholder) {
        return;
    }
    const unlocked = (Array.isArray(state.inventory && state.inventory.unlockedAugments) ? state.inventory.unlockedAugments : []).filter(function (id) {
        return Boolean(getFinalAugmentCopy(id));
    });
    if (!unlocked.length) {
        elements.inventoryPlaceholder.innerHTML = "<h3>Пока аугментаций нет</h3><p>Купленные модули будут появляться здесь и распределяться по типам.</p>";
        return;
    }
    const grouped = {
        weapon: unlocked.filter(function (id) { return getFinalAugmentCopy(id).slot === "weapon"; }),
        defense: unlocked.filter(function (id) { return getFinalAugmentCopy(id).slot === "defense"; })
    };
    elements.inventoryPlaceholder.innerHTML = [
        grouped.weapon.length ? '<section class="inventory-slot"><h3>Оружейная аугментация</h3>' + grouped.weapon.map(function (id) {
            const item = getFinalAugmentCopy(id);
            return '<article class="inventory-card"><strong>' + escapeHtml(item.name) + '</strong><p>' + escapeHtml(item.description) + '</p></article>';
        }).join("") + '</section>' : "",
        grouped.defense.length ? '<section class="inventory-slot"><h3>Защитная аугментация</h3>' + grouped.defense.map(function (id) {
            const item = getFinalAugmentCopy(id);
            return '<article class="inventory-card"><strong>' + escapeHtml(item.name) + '</strong><p>' + escapeHtml(item.description) + '</p></article>';
        }).join("") + '</section>' : ""
    ].join("");
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
            const requestName = sanitizeVisibleText(request.name, "Игрок");
            return '<article class="friend-card friend-request-card"><h3>' + escapeHtml(requestName) + '</h3><div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'Онлайн' : 'Оффлайн') + '</span><span class="timer-chip">Рейтинг ' + escapeHtml(String(request.rating || 0)) + '</span></div><div class="friend-actions"><button class="primary-button full-width" type="button" data-request-accept-id="' + escapeHtml(request.id) + '">Принять</button><button class="secondary-button full-width" type="button" data-request-reject-id="' + escapeHtml(request.id) + '">Отклонить</button></div></article>';
        }).join(""),
        '</section>'
    ].join("") : "";
    elements.friendList.innerHTML = friends.length ? friends.map(function (friend) {
        const online = friend.status === "online";
        const friendName = sanitizeVisibleText(friend.name, "Игрок");
        return '<article class="friend-card"><h3>' + escapeHtml(friendName) + '</h3><div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'Онлайн' : 'Оффлайн') + '</span><span class="timer-chip">Рейтинг ' + escapeHtml(String(friend.rating || 0)) + '</span></div><div class="friend-actions"><button class="secondary-button full-width" data-friend-chat-id="' + escapeHtml(friend.id) + '" type="button">Написать сообщение</button><button class="secondary-button full-width friend-action-profile" data-friend-profile-id="' + escapeHtml(friend.id) + '" type="button">Посмотреть профиль</button></div></article>';
    }).join("") : '<article class="friend-card"><p>Пока друзей нет. Найди игрока по никнейму и отправь запрос.</p></article>';
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
    document.body.classList.toggle("social-open", Boolean(state.social.isOpen));

    if (!threads.length) {
        elements.socialChatThreadList.innerHTML = '<article class="social-chat-empty">Открытые диалоги появятся здесь после первого сообщения другу.</article>';
        elements.socialChatThreadTitle.textContent = "Выбери чат";
        elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Открой чат через карточку друга.</div>';
        elements.socialChatInput.disabled = true;
        elements.socialChatSend.disabled = true;
        return;
    }

    elements.socialChatThreadList.innerHTML = threads.map(function (thread) {
        const friendName = sanitizeVisibleText(thread.friendName, "Друг");
        const statusText = thread.status === "online" ? "Онлайн" : "Оффлайн";
        return '<button class="social-chat-thread-card' + (activeThread && activeThread.id === thread.id ? ' is-active' : '') + '" type="button" data-social-thread-id="' + escapeHtml(thread.id) + '"><strong>' + escapeHtml(friendName) + '</strong><span>' + escapeHtml(statusText + " · Рейтинг " + (thread.rating || 0)) + '</span></button>';
    }).join("");

    if (!activeThread) {
        elements.socialChatThreadTitle.textContent = "Выбери чат";
        elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Открой чат через карточку друга.</div>';
        elements.socialChatInput.disabled = true;
        elements.socialChatSend.disabled = true;
        return;
    }

    elements.socialChatThreadTitle.textContent = sanitizeVisibleText(activeThread.friendName, "Друг");
    elements.socialChatMessages.innerHTML = (activeThread.messages || []).length
        ? (activeThread.messages || []).map(function (message) {
            const own = message.author === "you";
            const authorName = own ? sanitizeVisibleText(state.player.name, "Ты") : sanitizeVisibleText(activeThread.friendName, "Друг");
            const messageText = sanitizeVisibleText(message.text, "Сообщение скрыто.");
            return '<div class="social-chat-message' + (own ? ' social-chat-message-own' : '') + '"><div class="social-chat-message-bubble"><strong>' + escapeHtml(authorName) + '</strong><p>' + escapeHtml(messageText) + '</p><small>' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</small></div></div>';
        }).join("")
        : '<div class="social-chat-empty">Пока сообщений нет. Напиши первым.</div>';
    elements.socialChatInput.disabled = false;
    elements.socialChatSend.disabled = false;
    elements.socialChatMessages.scrollTop = elements.socialChatMessages.scrollHeight;
}

function renderShop() {
    const activeSection = state.ui.shopSection || "weapon";
    elements.shopTabButtons.forEach(function (button) {
        button.classList.toggle("is-active", button.getAttribute("data-shop-section") === activeSection);
    });
    const items = (Array.isArray(state.shop) ? state.shop : []).filter(function (item) {
        return item.section === activeSection && getFinalAugmentCopy(item.id);
    });
    elements.shopList.innerHTML = items.length ? '<section class="shop-section">' + items.map(function (item) {
        const copy = getFinalAugmentCopy(item.id);
        const owned = item.kind === "augment" && hasAugment(item.augmentId);
        return '<article class="shop-card"><h3>' + escapeHtml(copy.name) + '</h3><div class="shop-price-row"><strong>' + escapeHtml(String(copy.price) + " монет") + '</strong></div><p class="shop-card-copy">' + escapeHtml(copy.description) + '</p><div class="shop-actions"><button class="primary-button" data-shop-id="' + escapeHtml(item.id) + '" type="button" onclick="window.PolusApp && window.PolusApp.buy(\'' + escapeJs(item.id) + '\')"' + (owned ? ' disabled' : '') + '>' + (owned ? 'Куплено' : 'Купить') + '</button></div></article>';
    }).join("") + '</section>' : '<article class="shop-card"><p>Пока товаров в этом разделе нет.</p></article>';
}

function buildDuelStatusText(duel) {
    if (!duel) {
        return "";
    }
    if (duel.finished) {
        return sanitizeVisibleText(duel.resultText, "");
    }
    if (duel.mode === "pvp-live" && duel.yourActionSubmitted) {
        return hasPendingDuelChanges(duel)
            ? "Ты изменил выбор. Нажми «Изменить ход», чтобы обновить решение."
            : "Ход зафиксирован. Ждём соперника.";
    }
    return "";
}

function renderDuelChat(duel) {
    const isLiveChat = duel.mode === "pvp-live";
    const canWrite = isLiveChat && !duel.finished;
    const messages = duel.chatMessages || [];
    if (!messages.length) {
        elements.duelChatList.innerHTML = '<div class="duel-chat-entry"><p class="duel-chat-text">' + (isLiveChat ? "Чат пока пуст. Напиши сопернику первое сообщение." : "Чат доступен только в PvP-матче между двумя игроками.") + '</p></div>';
    } else {
        elements.duelChatList.innerHTML = messages.map(function (message) {
            const own = message.playerId && state.auth && message.playerId === state.auth.playerId;
            const systemMessage = Boolean(message.systemMessage);
            const extraClass = systemMessage ? " duel-chat-entry-system" : (own ? " duel-chat-entry-own" : "");
            const displayName = sanitizeVisibleText(message.displayName, systemMessage ? "Система" : "Игрок");
            const messageText = sanitizeVisibleText(message.text, systemMessage ? "Системное сообщение обновлено." : "Сообщение скрыто.");
            return '<div class="duel-chat-entry' + extraClass + '"><p class="duel-chat-meta">' + escapeHtml(displayName) + ' · ' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</p><p class="duel-chat-text">' + escapeHtml(messageText) + '</p></div>';
        }).join("");
    }
    elements.duelChatInput.disabled = !canWrite;
    elements.duelChatSendButton.disabled = !canWrite;
    elements.duelChatInput.placeholder = canWrite ? "Напиши сообщение сопернику" : "Чат недоступен";
    elements.duelChatError.textContent = sanitizeVisibleText(duel.chatError, "");
    elements.duelChatError.classList.toggle("hidden", !duel.chatError);
    elements.duelChatList.scrollTop = elements.duelChatList.scrollHeight;
}

function renderDuel() {
    refreshStaticCopy();
    const duel = state.duel;
    if (!duel) {
        closeDuelSilently();
        return;
    }

    duel.activePanel = duel.activePanel || "logs";
    duel.autoBattleEnabled = false;
    duel.autoBattlePendingEnabled = null;
    duel.chatMessages = Array.isArray(duel.chatMessages) ? duel.chatMessages : [];
    duel.chatError = sanitizeVisibleText(duel.chatError, "");
    duel.resultText = sanitizeVisibleText(duel.resultText, "");
    duel.logs = (Array.isArray(duel.logs) ? duel.logs : []).map(function (entry) {
        return Object.assign({}, entry, { lines: sanitizeLogLines(entry.lines) });
    }).filter(function (entry) {
        return entry.lines.length > 0;
    });

    syncDuelInputs(duel);
    renderDuelControls();
    hideAutoBattleUi();

    elements.duelTitle.textContent = "Дуэль";
    elements.duelRoundPill.textContent = "Раунд " + duel.round;
    elements.duelRoundTimer.textContent = formatDuration(getRoundTimeRemainingMs(duel));
    elements.duelYouName.textContent = sanitizeVisibleText(duel.playerName, "Игрок");
    elements.duelYouMeta.textContent = "";
    elements.duelYouAvatar.textContent = sanitizeVisibleText(duel.playerName, "И").slice(0, 1).toUpperCase();
    elements.duelOpponentName.textContent = sanitizeVisibleText(duel.opponentName, "Соперник");
    elements.duelOpponentMeta.textContent = "";
    elements.duelOpponentAvatar.textContent = sanitizeVisibleText(duel.opponentName, "С").slice(0, 1).toUpperCase();
    elements.duelYouHp.textContent = duel.playerHp + " HP";
    elements.duelOpponentHp.textContent = duel.opponentHp + " HP";
    elements.duelYouFill.style.width = Math.max(0, Math.min(100, Math.round((duel.playerHp / getPlayerMaxHp()) * 100))) + "%";
    elements.duelOpponentFill.style.width = Math.max(0, Math.min(100, Math.round((duel.opponentHp / getPlayerMaxHp()) * 100))) + "%";

    const duelStatus = buildDuelStatusText(duel);
    elements.duelRoundStatus.innerHTML = duelStatus ? decorateText(duelStatus) : "";
    elements.duelRoundStatus.classList.toggle("hidden", !duelStatus);

    const duelSelectionComplete = isDuelSelectionComplete(duel);
    const duelHasPendingChanges = hasPendingDuelChanges(duel);
    elements.duelSubmitButton.textContent = duel.finished
        ? "Бой завершен"
        : duel.yourActionSubmitted
            ? (duelHasPendingChanges ? "Изменить ход" : "Ход сделан")
            : "Сделать ход";
    elements.duelSubmitButton.disabled = duel.finished || !duelSelectionComplete || (duel.yourActionSubmitted && !duelHasPendingChanges);

    if (!duel.logs.length) {
        elements.duelLogList.innerHTML = '<div class="duel-log-round"><p class="duel-log-round-title">Логов пока нет. Первый обмен ходами появится здесь.</p></div>';
    } else {
        elements.duelLogList.innerHTML = duel.logs.slice().reverse().map(function (entry) {
            const roundNumber = typeof entry.round === "number" ? entry.round : entry.roundNumber;
            const lines = sanitizeLogLines(entry.lines);
            const title = lines.length ? lines[0] : "Раунд " + roundNumber;
            const detailLines = lines.slice(1);
            return '<div class="duel-log-round"><p class="duel-log-round-title">' + decorateText(title) + '</p>' + detailLines.map(function (line) {
                return '<p class="duel-log-line">' + decorateText(line) + '</p>';
            }).join('') + '</div>';
        }).join('');
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

function openDuelResultModal(config) {
    const inferredVictory = Number(config.rating || 0) > 0 || Number(config.money || 0) >= BATTLE_VICTORY_COINS;
    const inferredDefeat = Number(config.rating || 0) < 0 || Number(config.money || 0) === BATTLE_DEFEAT_COINS;
    const fallbackTitle = inferredVictory ? "Победа" : (inferredDefeat ? "Поражение" : "Бой завершен");
    const fallbackCopy = inferredVictory ? "Ты победил в дуэли." : inferredDefeat ? "Ты проиграл в дуэли." : "Раундов больше не осталось.";
    state.ui.duelExitConfirmOpen = false;
    state.ui.duelResult = {
        title: sanitizeVisibleText(config.title, fallbackTitle),
        copy: sanitizeVisibleText(config.copy, fallbackCopy),
        rating: Number(config.rating ?? config.experience) || 0,
        money: Number(config.money) || 0
    };
    saveState();
    renderDuelResultModal();
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
    elements.duelResultTitle.textContent = sanitizeVisibleText(result.title, "Бой завершен");
    elements.duelResultCopy.textContent = sanitizeVisibleText(result.copy, "");
    elements.duelResultExp.textContent = formatSignedReward(result.rating || 0, " рейтинга");
    elements.duelResultMoney.textContent = formatSignedReward(result.money || 0, " монет");
}

function openLiveDuelResult(payload) {
    const isVictory = payload.resultLabel === "VICTORY";
    const isDefeat = payload.resultLabel === "DEFEAT";
    openDuelResultModal({
        title: isVictory ? "Победа" : isDefeat ? "Поражение" : "Бой завершен",
        copy: isVictory ? "Ты победил в дуэли." : isDefeat ? "Ты проиграл в дуэли." : "Раундов больше не осталось.",
        rating: isVictory ? PVP_RATING_DELTA : isDefeat ? -PVP_RATING_DELTA : 0,
        money: isVictory ? BATTLE_VICTORY_COINS : isDefeat ? BATTLE_DEFEAT_COINS : 0
    });
}

function renderAll() {
    repairStateAfterLegacyLoad();
    refreshStaticCopy();
    renderScreens();
    renderProfile();
    renderHeroStats();
    renderRegistrationModal();
    renderQueueStatus();
    renderJournal();
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

const FINAL_OVERRIDE_AUGMENTS = {
    weaponBrassSights: { name: "Прицельная рамка", description: "+5 к урону", slot: "weapon", price: 100 },
    weaponDoubleTap: { name: "Рискованный затвор", description: "5% двойной урон · 5% осечка", slot: "weapon", price: 100 },
    defensePlating: { name: "Северная бронепластина", description: "-3 входящего урона", slot: "defense", price: 100 },
    defenseHeatSink: { name: "Усиленный каркас", description: "+15 здоровья", slot: "defense", price: 100 }
};

function getOverrideAugment(id) {
    return FINAL_OVERRIDE_AUGMENTS[id] || getFinalAugmentCopy(id);
}

function refreshStaticCopy() {
    document.title = "Полюс";

    const setText = function (id, value) {
        const node = document.getElementById(id);
        if (node) {
            node.textContent = value;
        }
    };
    const setPlaceholder = function (id, value) {
        const node = document.getElementById(id);
        if (node) {
            node.setAttribute("placeholder", value);
        }
    };

    setText("find-match-button", "Найти матч");
    setText("bot-duel-button", "Быстрая дуэль (бот)");
    setText("queue-cancel-button", "Отменить");
    setText("social-chat-close", "Закрыть");
    setText("social-chat-thread-title", "Выбери чат");
    setText("duel-tab-logs", "Логи");
    setText("duel-tab-chat", "Чат");
    setText("duel-clear-log-button", "Очистить");
    setText("duel-close-button", "Выйти");
    setText("duel-title", "Дуэль");
    setText("start-duel-title", "Начать бой?");
    setText("start-duel-copy", "Подтверди, что хочешь войти в бой.");
    setText("start-duel-cancel", "Нет, вернуться в хаб");
    setText("start-duel-confirm", "Да, начать бой");
    setText("duel-exit-cancel", "Нет, остаться");
    setText("duel-exit-confirm", "Да, выйти");
    setText("duel-result-title", "Бой завершен");
    setText("duel-result-close", "В хаб");
    setText("journal-zone-label", "Зона");
    setText("shop-money", String(Number(state.player && state.player.money || 0)) + " монет");

    setPlaceholder("friend-search-input", "Найти игрока по никнейму");
    setPlaceholder("social-chat-input", "Напиши сообщение");
    setPlaceholder("duel-chat-input", "Напиши сообщение сопернику");
    setPlaceholder("registration-nickname", "Например, Бакунин");

    safeSetText(".panel-kicker", "Профиль");
    safeSetText(".queue-status-label", "Поиск дуэли");
    safeSetText("#queue-status-note", "Ищем соперника в очереди.");
    safeSetText("#screen-home .panel-title.panel-title-small", "Дневник");
    safeSetText(".journal-zone-label", "Зона");
    safeSetText("#screen-inventory .panel-title", "Доступные аугментации");
    safeSetText("#screen-friends .panel-title", "Друзья");
    safeSetText("#friend-search-form button", "Добавить");
    safeSetText("#screen-shop .panel-title", "Магазин");
    safeSetText(".shop-tab[data-shop-section='weapon']", "Оружейная");
    safeSetText(".shop-tab[data-shop-section='defense']", "Защитная");
    safeSetText(".social-chat-fab-label", "Чаты");
    safeSetText("#social-chat-panel .panel-title.panel-title-small", "Чаты");
    safeSetText("#registration-modal .panel-title.panel-title-small", "Регистрация игрока");
    safeSetText("#registration-copy", state.auth && state.auth.demoMode
        ? "Введи никнейм. Вне Telegram он сохранится только в этом браузере."
        : "Ник будет привязан к твоему Telegram ID.");
    safeSetText("#registration-style-label", "В каком стиле вы будете вести дневник?");
    safeSetText(".registration-style-option:nth-of-type(1) .registration-style-copy", "Я прибыл в Полюс.");
    safeSetText(".registration-style-option:nth-of-type(2) .registration-style-copy", "Я прибыла в Полюс.");
    safeSetText("#registration-submit", "Создать аккаунт");
    safeSetText(".duel-result-chip:nth-of-type(1) span", "Рейтинг");
    safeSetText(".duel-result-chip:nth-of-type(2) span", "Монеты");
    safeSetText(".duel-block-title", "Оружие");
    safeSetText(".vector-card:nth-of-type(1) h4", "Выстрел");
    safeSetText(".vector-card:nth-of-type(2) h4", "Уворот");
    safeSetText(".weapon-option[data-value='PISTOLS'] strong", "Пистоль и щит");
    safeSetText(".weapon-option[data-value='PISTOLS'] .weapon-stat", "18 урона");
    safeSetText(".weapon-option[data-value='PISTOLS'] .weapon-trait", "Шанс блокировать выстрел 30%");
    safeSetText(".weapon-option[data-value='RIFLE'] strong", "Винтовка");
    safeSetText(".weapon-option[data-value='RIFLE'] .weapon-stat", "30 урона");
    safeSetText(".weapon-option[data-value='RIFLE'] .weapon-trait", "Игнорирует блокирование");
    safeSetText(".weapon-option[data-value='SHOTGUN'] strong", "Дробовик");
    safeSetText(".weapon-option[data-value='SHOTGUN'] .weapon-stat", "5-25 урона");
    safeSetText(".weapon-option[data-value='SHOTGUN'] .weapon-trait", "Вероятность зацепа 35%");
    safeSetText(".duel-toggle[data-duel-select='shot'][data-value='LEFT']", "Лево");
    safeSetText(".duel-toggle[data-duel-select='shot'][data-value='CENTER']", "Центр");
    safeSetText(".duel-toggle[data-duel-select='shot'][data-value='RIGHT']", "Право");
    safeSetText(".duel-toggle[data-duel-select='dodge'][data-value='LEFT']", "Лево");
    safeSetText(".duel-toggle[data-duel-select='dodge'][data-value='STAY']", "Центр");
    safeSetText(".duel-toggle[data-duel-select='dodge'][data-value='RIGHT']", "Право");
    safeSetText(".nav-button[data-nav-target='home'] .nav-title", "Хаб");
    safeSetText(".nav-button[data-nav-target='inventory'] .nav-title", "Инвентарь");
    safeSetText(".nav-button[data-nav-target='friends'] .nav-title", "Друзья");
    safeSetText(".nav-button[data-nav-target='shop'] .nav-title", "Магазин");
}

function syncPlayerFromServer(player, resetEconomy) {
    state.player.id = player.id;
    state.player.name = sanitizeVisibleText(player.nickname, "")
        || sanitizeVisibleText(player.displayName, "")
        || sanitizeVisibleText(state.auth.nickname, "")
        || sanitizeVisibleText(state.player.name, "Новый игрок")
        || "Новый игрок";
    state.player.telegramUserId = player.telegramUserId || null;
    state.player.rating = typeof player.rating === "number" ? player.rating : Number(state.player.rating || 0);
    if (resetEconomy || typeof state.player.money !== "number" || typeof player.coins === "number") {
        state.player.money = typeof player.coins === "number" ? player.coins : Number(state.player.money || 0);
    }
    state.player.wins = typeof player.wins === "number" ? player.wins : Number(state.player.wins || 0);
    state.player.losses = typeof player.losses === "number" ? player.losses : Number(state.player.losses || 0);
}

function renderProfile() {
    const playerName = sanitizeVisibleText(state.player && state.player.name, sanitizeVisibleText(state.auth && state.auth.nickname, "Новый игрок")) || "Новый игрок";
    const playerMoney = Number(state.player && state.player.money || 0);
    const playerRating = Number(state.player && state.player.rating || 0);
    elements.profileName.textContent = playerName;
    elements.profileMoney.textContent = String(playerMoney);
    if (elements.profileRating) {
        elements.profileRating.textContent = String(playerRating);
    }
    if (elements.shopMoney) {
        elements.shopMoney.textContent = playerMoney + " монет";
    }
    if (elements.profileAvatar) {
        elements.profileAvatar.textContent = playerName.slice(0, 1).toUpperCase();
    }
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
    elements.queueStatusNote.textContent = sanitizeVisibleText(state.matchmaking.message, "Ищем соперника в очереди.");
    elements.queueCancelButton.disabled = false;
}

function renderJournal() {
    if (!elements.journalList) {
        return;
    }
    if (!Array.isArray(state.journal) || !state.journal.length) {
        elements.journalList.innerHTML = '<article class="journal-entry"><p>Записей пока нет.</p></article>';
        return;
    }
    elements.journalList.innerHTML = state.journal.slice(0, 20).map(function (entry) {
        const zoneLabel = sanitizeVisibleText(entry.locationLabel, JOURNAL_LOCATION_LABELS[entry.location] || "Город");
        return '<article class="journal-entry"><p>' + decorateText(sanitizeVisibleText(entry.text, "Запись дневника обновлена.")) + '</p><small>' + escapeHtml(zoneLabel + " · " + formatTimestamp(entry.createdAt || Date.now())) + '</small></article>';
    }).join("");
}

function renderRegistrationModal() {
    const auth = state.auth || {};
    const currentName = sanitizeVisibleText(state.player && state.player.name, "");
    const shouldOpen = !auth.registered || !sanitizeVisibleText(auth.nickname, "") || !currentName || currentName === "Новый игрок";
    elements.registrationModal.classList.toggle("hidden", !shouldOpen);
    elements.registrationModal.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
    if (!shouldOpen) {
        return;
    }
    elements.registrationCopy.textContent = auth.demoMode
        ? "Введи никнейм. Вне Telegram он сохранится только в этом браузере."
        : "Ник будет привязан к твоему Telegram ID.";
    if (!elements.registrationNickname.value) {
        elements.registrationNickname.value = sanitizeVisibleText(auth.nickname, "");
    }
    if (auth.journalStyle) {
        const savedOption = document.querySelector('input[name="registration-journal-style"][value="' + auth.journalStyle + '"]');
        if (savedOption) {
            savedOption.checked = true;
        }
    }
    if (auth.initError && !auth.demoMode) {
        showRegistrationError(auth.initError);
    } else {
        elements.registrationError.textContent = "";
        elements.registrationError.classList.add("hidden");
    }
}

async function submitRegistration() {
    const nickname = (elements.registrationNickname.value || "").trim();
    const checkedStyle = document.querySelector('input[name="registration-journal-style"]:checked');
    const journalStyle = checkedStyle ? checkedStyle.value : "";
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
    if (!journalStyle) {
        showRegistrationError("Выбери стиль дневника.");
        return;
    }

    elements.registrationSubmit.disabled = true;
    try {
        if (state.auth && state.auth.demoMode) {
            state.auth.nickname = nickname;
            state.auth.journalStyle = journalStyle;
            state.auth.registered = true;
            state.player.name = nickname;
            state.player.money = 0;
            state.player.rating = 0;
            saveState();
            renderAll();
            showToast("Аккаунт зарегистрирован.");
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
            body: JSON.stringify({ nickname: nickname, journalStyle: journalStyle })
        });
        if (!response.ok) {
            throw new Error(await readApiError(response));
        }
        const player = await response.json();
        state.auth.nickname = player.nickname || nickname;
        state.auth.journalStyle = player.journalStyle || journalStyle;
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

function renderInventory() {
    if (!elements.inventoryPlaceholder) {
        return;
    }
    const unlocked = (Array.isArray(state.inventory && state.inventory.unlockedAugments) ? state.inventory.unlockedAugments : []).filter(function (id) {
        return Boolean(getOverrideAugment(id));
    });
    if (!unlocked.length) {
        elements.inventoryPlaceholder.innerHTML = "<h3>Пока аугментаций нет</h3><p>Купленные модули будут появляться здесь и распределяться по типам.</p>";
        return;
    }
    const grouped = {
        weapon: unlocked.filter(function (id) { return getOverrideAugment(id).slot === "weapon"; }),
        defense: unlocked.filter(function (id) { return getOverrideAugment(id).slot === "defense"; })
    };
    elements.inventoryPlaceholder.innerHTML = [
        grouped.weapon.length ? '<section class="inventory-slot"><h3>Оружейная аугментация</h3>' + grouped.weapon.map(function (id) {
            const item = getOverrideAugment(id);
            return '<article class="inventory-card"><strong>' + escapeHtml(item.name) + '</strong><p>' + escapeHtml(item.description) + '</p></article>';
        }).join("") + '</section>' : "",
        grouped.defense.length ? '<section class="inventory-slot"><h3>Защитная аугментация</h3>' + grouped.defense.map(function (id) {
            const item = getOverrideAugment(id);
            return '<article class="inventory-card"><strong>' + escapeHtml(item.name) + '</strong><p>' + escapeHtml(item.description) + '</p></article>';
        }).join("") + '</section>' : ""
    ].join("");
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
            const requestName = sanitizeVisibleText(request.name, "Игрок");
            return '<article class="friend-card friend-request-card"><h3>' + escapeHtml(requestName) + '</h3><div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'Онлайн' : 'Оффлайн') + '</span><span class="timer-chip">Рейтинг ' + escapeHtml(String(request.rating || 0)) + '</span></div><div class="friend-actions"><button class="primary-button full-width" type="button" data-request-accept-id="' + escapeHtml(request.id) + '">Принять</button><button class="secondary-button full-width" type="button" data-request-reject-id="' + escapeHtml(request.id) + '">Отклонить</button></div></article>';
        }).join(""),
        '</section>'
    ].join("") : "";
    elements.friendList.innerHTML = friends.length ? friends.map(function (friend) {
        const online = friend.status === "online";
        const friendName = sanitizeVisibleText(friend.name, "Игрок");
        return '<article class="friend-card"><h3>' + escapeHtml(friendName) + '</h3><div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'Онлайн' : 'Оффлайн') + '</span><span class="timer-chip">Рейтинг ' + escapeHtml(String(friend.rating || 0)) + '</span></div><div class="friend-actions"><button class="secondary-button full-width" data-friend-chat-id="' + escapeHtml(friend.id) + '" type="button">Написать сообщение</button><button class="secondary-button full-width friend-action-profile" data-friend-profile-id="' + escapeHtml(friend.id) + '" type="button">Посмотреть профиль</button></div></article>';
    }).join("") : '<article class="friend-card"><p>Пока друзей нет. Найди игрока по никнейму и отправь запрос.</p></article>';
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
    document.body.classList.toggle("social-open", Boolean(state.social.isOpen));

    if (!threads.length) {
        elements.socialChatThreadList.innerHTML = '<article class="social-chat-empty">Открытые диалоги появятся здесь после первого сообщения другу.</article>';
        elements.socialChatThreadTitle.textContent = "Выбери чат";
        elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Открой чат через карточку друга.</div>';
        elements.socialChatInput.disabled = true;
        elements.socialChatSend.disabled = true;
        return;
    }

    elements.socialChatThreadList.innerHTML = threads.map(function (thread) {
        const friendName = sanitizeVisibleText(thread.friendName, "Друг");
        const statusText = thread.status === "online" ? "Онлайн" : "Оффлайн";
        return '<button class="social-chat-thread-card' + (activeThread && activeThread.id === thread.id ? ' is-active' : '') + '" type="button" data-social-thread-id="' + escapeHtml(thread.id) + '"><strong>' + escapeHtml(friendName) + '</strong><span>' + escapeHtml(statusText + " · Рейтинг " + (thread.rating || 0)) + '</span></button>';
    }).join("");

    if (!activeThread) {
        elements.socialChatThreadTitle.textContent = "Выбери чат";
        elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Открой чат через карточку друга.</div>';
        elements.socialChatInput.disabled = true;
        elements.socialChatSend.disabled = true;
        return;
    }

    elements.socialChatThreadTitle.textContent = sanitizeVisibleText(activeThread.friendName, "Друг");
    elements.socialChatMessages.innerHTML = (activeThread.messages || []).length
        ? (activeThread.messages || []).map(function (message) {
            const own = message.author === "you";
            const authorName = own ? sanitizeVisibleText(state.player.name, "Ты") : sanitizeVisibleText(activeThread.friendName, "Друг");
            const messageText = sanitizeVisibleText(message.text, "Сообщение скрыто.");
            return '<div class="social-chat-message' + (own ? ' social-chat-message-own' : '') + '"><div class="social-chat-message-bubble"><strong>' + escapeHtml(authorName) + '</strong><p>' + escapeHtml(messageText) + '</p><small>' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</small></div></div>';
        }).join("")
        : '<div class="social-chat-empty">Пока сообщений нет. Напиши первым.</div>';
    elements.socialChatInput.disabled = false;
    elements.socialChatSend.disabled = false;
    elements.socialChatMessages.scrollTop = elements.socialChatMessages.scrollHeight;
}

function renderShop() {
    const activeSection = state.ui.shopSection || "weapon";
    elements.shopTabButtons.forEach(function (button) {
        button.classList.toggle("is-active", button.getAttribute("data-shop-section") === activeSection);
    });
    const items = (Array.isArray(state.shop) ? state.shop : []).filter(function (item) {
        return item.section === activeSection && getOverrideAugment(item.id);
    });
    elements.shopList.innerHTML = items.length ? '<section class="shop-section">' + items.map(function (item) {
        const copy = getOverrideAugment(item.id);
        const owned = item.kind === "augment" && hasAugment(item.augmentId);
        return '<article class="shop-card"><h3>' + escapeHtml(copy.name) + '</h3><div class="shop-price-row"><strong>' + escapeHtml(String(copy.price) + " монет") + '</strong></div><p class="shop-card-copy">' + escapeHtml(copy.description) + '</p><div class="shop-actions"><button class="primary-button" data-shop-id="' + escapeHtml(item.id) + '" type="button" onclick="window.PolusApp && window.PolusApp.buy(\'' + escapeJs(item.id) + '\')"' + (owned ? ' disabled' : '') + '>' + (owned ? 'Куплено' : 'Купить') + '</button></div></article>';
    }).join("") + '</section>' : '<article class="shop-card"><p>Пока товаров в этом разделе нет.</p></article>';
}

function buildDuelStatusText(duel) {
    if (!duel) {
        return "";
    }
    if (duel.finished) {
        return sanitizeVisibleText(duel.resultText, "");
    }
    if (duel.mode === "pvp-live" && duel.yourActionSubmitted) {
        return hasPendingDuelChanges(duel)
            ? "Ты изменил выбор. Нажми «Изменить ход», чтобы обновить решение."
            : "Ход зафиксирован. Ждём соперника.";
    }
    return "";
}

function renderDuelChat(duel) {
    const isLiveChat = duel.mode === "pvp-live";
    const canWrite = isLiveChat && !duel.finished;
    const messages = duel.chatMessages || [];
    if (!messages.length) {
        elements.duelChatList.innerHTML = '<div class="duel-chat-entry"><p class="duel-chat-text">' + (isLiveChat ? "Чат пока пуст. Напиши сопернику первое сообщение." : "Чат доступен только в PvP-матче между двумя игроками.") + '</p></div>';
    } else {
        elements.duelChatList.innerHTML = messages.map(function (message) {
            const own = message.playerId && state.auth && message.playerId === state.auth.playerId;
            const systemMessage = Boolean(message.systemMessage);
            const extraClass = systemMessage ? " duel-chat-entry-system" : (own ? " duel-chat-entry-own" : "");
            const displayName = sanitizeVisibleText(message.displayName, systemMessage ? "Система" : "Игрок");
            const messageText = sanitizeVisibleText(message.text, systemMessage ? "Системное сообщение обновлено." : "Сообщение скрыто.");
            return '<div class="duel-chat-entry' + extraClass + '"><p class="duel-chat-meta">' + escapeHtml(displayName) + ' · ' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</p><p class="duel-chat-text">' + escapeHtml(messageText) + '</p></div>';
        }).join("");
    }
    elements.duelChatInput.disabled = !canWrite;
    elements.duelChatSendButton.disabled = !canWrite;
    elements.duelChatInput.placeholder = canWrite ? "Напиши сообщение сопернику" : "Чат недоступен";
    elements.duelChatError.textContent = sanitizeVisibleText(duel.chatError, "");
    elements.duelChatError.classList.toggle("hidden", !duel.chatError);
    elements.duelChatList.scrollTop = elements.duelChatList.scrollHeight;
}

function renderDuel() {
    FINAL_DUEL_RENDER();
    const duel = state.duel;
    refreshStaticCopy();
    hideAutoBattleUi();
    if (!duel) {
        return;
    }
    elements.duelTitle.textContent = "Дуэль";
    elements.duelRoundPill.textContent = "Раунд " + duel.round;
    if (elements.duelRoundTimer && duel.roundDeadlineAt) {
        elements.duelRoundTimer.textContent = formatDuration(Math.max(0, duel.roundDeadlineAt - Date.now()));
    }
    if (elements.duelSubmitButton) {
        const hasPending = hasPendingDuelChanges(duel);
        const selectionComplete = isDuelSelectionComplete(duel);
        elements.duelSubmitButton.textContent = duel.finished
            ? "Бой завершен"
            : duel.yourActionSubmitted
                ? (hasPending ? "Изменить ход" : "Ход сделан")
                : "Сделать ход";
        elements.duelSubmitButton.disabled = duel.finished || !duel.canSubmitAction || !selectionComplete || (duel.yourActionSubmitted && !hasPending);
    }
    if (elements.duelLogList && !(duel.logs || []).length) {
        elements.duelLogList.innerHTML = '<div class="duel-log-round"><p class="duel-log-round-title">Логов пока нет. Первый обмен ходами появится здесь.</p></div>';
    }
    if (elements.duelYouName) {
        elements.duelYouName.textContent = sanitizeVisibleText(duel.playerName, sanitizeVisibleText(state.player.name, "Игрок"));
    }
    if (elements.duelOpponentName) {
        elements.duelOpponentName.textContent = sanitizeVisibleText(duel.opponentName, "Соперник");
    }
    if (elements.duelYouMeta) {
        elements.duelYouMeta.textContent = "";
    }
    if (elements.duelOpponentMeta) {
        elements.duelOpponentMeta.textContent = "";
    }
}

function openDuelResultModal(config) {
    const inferredVictory = Number(config.rating || 0) > 0 || Number(config.money || 0) >= BATTLE_VICTORY_COINS;
    const inferredDefeat = Number(config.rating || 0) < 0 || Number(config.money || 0) === BATTLE_DEFEAT_COINS;
    const fallbackTitle = inferredVictory ? "Победа" : (inferredDefeat ? "Поражение" : "Бой завершен");
    const fallbackCopy = inferredVictory ? "Ты победил в дуэли." : inferredDefeat ? "Ты проиграл в дуэли." : "Раундов больше не осталось.";
    state.ui.duelExitConfirmOpen = false;
    state.ui.duelResult = {
        title: sanitizeVisibleText(config.title, fallbackTitle),
        copy: sanitizeVisibleText(config.copy, fallbackCopy),
        rating: Number(config.rating ?? config.experience) || 0,
        money: Number(config.money) || 0
    };
    saveState();
    renderDuelResultModal();
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
    elements.duelResultTitle.textContent = sanitizeVisibleText(result.title, "Бой завершен");
    elements.duelResultCopy.textContent = sanitizeVisibleText(result.copy, "");
    elements.duelResultExp.textContent = formatSignedReward(result.rating || 0, " рейтинга");
    elements.duelResultMoney.textContent = formatSignedReward(result.money || 0, " монет");
}

function openLiveDuelResult(payload) {
    const isVictory = payload.resultLabel === "VICTORY";
    const isDefeat = payload.resultLabel === "DEFEAT";
    openDuelResultModal({
        title: isVictory ? "Победа" : isDefeat ? "Поражение" : "Бой завершен",
        copy: isVictory ? "Ты победил в дуэли." : isDefeat ? "Ты проиграл в дуэли." : "Раундов больше не осталось.",
        rating: isVictory ? PVP_RATING_DELTA : isDefeat ? -PVP_RATING_DELTA : 0,
        money: isVictory ? BATTLE_VICTORY_COINS : isDefeat ? BATTLE_DEFEAT_COINS : 0
    });
}

function renderAll() {
    repairStateAfterLegacyLoad();
    refreshStaticCopy();
    renderScreens();
    renderProfile();
    renderHeroStats();
    renderRegistrationModal();
    renderQueueStatus();
    renderJournal();
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

    const setText = function (id, value) {
        const node = document.getElementById(id);
        if (node) {
            node.textContent = value;
        }
    };
    const setPlaceholder = function (id, value) {
        const node = document.getElementById(id);
        if (node) {
            node.setAttribute("placeholder", value);
        }
    };

    setText("find-match-button", "Найти матч");
    setText("bot-duel-button", "Быстрая дуэль (бот)");
    setText("queue-cancel-button", "Отменить");
    setText("social-chat-close", "Закрыть");
    setText("social-chat-thread-title", "Выбери чат");
    setText("duel-tab-logs", "Логи");
    setText("duel-tab-chat", "Чат");
    setText("duel-clear-log-button", "Очистить");
    setText("duel-title", "Дуэль");
    setText("start-duel-title", "Начать бой?");
    setText("start-duel-copy", "Подтверди, что хочешь войти в бой.");
    setText("start-duel-cancel", "Нет, вернуться в хаб");
    setText("start-duel-confirm", "Да, начать бой");
    setText("duel-exit-cancel", "Нет, остаться");
    setText("duel-exit-confirm", "Да, выйти");
    setText("duel-result-title", "Бой завершен");
    setText("duel-result-close", "В хаб");
    setText("journal-zone-label", "Зона");
    setText("shop-money", String(Number(state.player && state.player.money || 0)) + " монет");

    setPlaceholder("friend-search-input", "Найти игрока по никнейму");
    setPlaceholder("social-chat-input", "Напиши сообщение");
    setPlaceholder("duel-chat-input", "Напиши сообщение сопернику");
    setPlaceholder("registration-nickname", "Например, Бакунин");

    safeSetText(".panel-kicker", "Профиль");
    safeSetText(".queue-status-label", "Поиск дуэли");
    safeSetText("#queue-status-note", "Ищем соперника в очереди.");
    safeSetText("#screen-home .panel-title.panel-title-small", "Дневник");
    safeSetText(".journal-zone-label", "Зона");
    safeSetText("#screen-inventory .panel-title", "Доступные аугментации");
    safeSetText("#screen-friends .panel-title", "Друзья");
    safeSetText("#friend-search-form button", "Добавить");
    safeSetText("#screen-shop .panel-title", "Магазин");
    safeSetText(".shop-tab[data-shop-section='weapon']", "Оружейная");
    safeSetText(".shop-tab[data-shop-section='defense']", "Защитная");
    safeSetText(".social-chat-fab-label", "Чаты");
    safeSetText("#social-chat-panel .panel-title.panel-title-small", "Чаты");
    safeSetText("#registration-modal .panel-title.panel-title-small", "Регистрация игрока");
    safeSetText("#registration-copy", state.auth && state.auth.demoMode
        ? "Введи никнейм. Вне Telegram он сохранится только в этом браузере."
        : "Ник будет привязан к твоему Telegram ID.");
    safeSetText("#registration-style-label", "В каком стиле вы будете вести дневник?");
    safeSetText(".registration-style-option:nth-of-type(1) .registration-style-copy", "Я прибыл в Полюс.");
    safeSetText(".registration-style-option:nth-of-type(2) .registration-style-copy", "Я прибыла в Полюс.");
    safeSetText("#registration-submit", "Создать аккаунт");
    safeSetText(".duel-result-chip:nth-of-type(1) span", "Рейтинг");
    safeSetText(".duel-result-chip:nth-of-type(2) span", "Монеты");
    safeSetText(".duel-block-title", "Оружие");
    safeSetText(".vector-card:nth-of-type(1) h4", "Выстрел");
    safeSetText(".vector-card:nth-of-type(2) h4", "Уворот");
    safeSetText(".weapon-option[data-value='PISTOLS'] strong", "Пистоль и щит");
    safeSetText(".weapon-option[data-value='PISTOLS'] .weapon-stat", "18 урона");
    safeSetText(".weapon-option[data-value='PISTOLS'] .weapon-trait", "Шанс блокировать выстрел 30%");
    safeSetText(".weapon-option[data-value='RIFLE'] strong", "Винтовка");
    safeSetText(".weapon-option[data-value='RIFLE'] .weapon-stat", "30 урона");
    safeSetText(".weapon-option[data-value='RIFLE'] .weapon-trait", "Игнорирует блокирование");
    safeSetText(".weapon-option[data-value='SHOTGUN'] strong", "Дробовик");
    safeSetText(".weapon-option[data-value='SHOTGUN'] .weapon-stat", "5-25 урона");
    safeSetText(".weapon-option[data-value='SHOTGUN'] .weapon-trait", "Вероятность зацепа 35%");
    safeSetText(".duel-toggle[data-duel-select='shot'][data-value='LEFT']", "Лево");
    safeSetText(".duel-toggle[data-duel-select='shot'][data-value='CENTER']", "Центр");
    safeSetText(".duel-toggle[data-duel-select='shot'][data-value='RIGHT']", "Право");
    safeSetText(".duel-toggle[data-duel-select='dodge'][data-value='LEFT']", "Лево");
    safeSetText(".duel-toggle[data-duel-select='dodge'][data-value='STAY']", "Центр");
    safeSetText(".duel-toggle[data-duel-select='dodge'][data-value='RIGHT']", "Право");
    safeSetText(".nav-button[data-nav-target='home'] .nav-title", "Хаб");
    safeSetText(".nav-button[data-nav-target='inventory'] .nav-title", "Инвентарь");
    safeSetText(".nav-button[data-nav-target='friends'] .nav-title", "Друзья");
    safeSetText(".nav-button[data-nav-target='shop'] .nav-title", "Магазин");
}

function syncPlayerFromServer(player, resetEconomy) {
    state.player.id = player.id;
    state.player.name = sanitizeVisibleText(player.nickname, "")
        || sanitizeVisibleText(player.displayName, "")
        || sanitizeVisibleText(state.auth.nickname, "")
        || sanitizeVisibleText(state.player.name, "Новый игрок")
        || "Новый игрок";
    state.player.telegramUserId = player.telegramUserId || null;
    state.player.rating = typeof player.rating === "number" ? player.rating : Number(state.player.rating || 0);
    if (resetEconomy || typeof state.player.money !== "number" || typeof player.coins === "number") {
        state.player.money = typeof player.coins === "number" ? player.coins : Number(state.player.money || 0);
    }
    state.player.wins = typeof player.wins === "number" ? player.wins : Number(state.player.wins || 0);
    state.player.losses = typeof player.losses === "number" ? player.losses : Number(state.player.losses || 0);
}

function renderProfile() {
    const playerName = sanitizeVisibleText(state.player && state.player.name, sanitizeVisibleText(state.auth && state.auth.nickname, "Новый игрок")) || "Новый игрок";
    const playerMoney = Number(state.player && state.player.money || 0);
    const playerRating = Number(state.player && state.player.rating || 0);
    elements.profileName.textContent = playerName;
    elements.profileMoney.textContent = String(playerMoney);
    if (elements.profileRating) {
        elements.profileRating.textContent = String(playerRating);
    }
    if (elements.shopMoney) {
        elements.shopMoney.textContent = playerMoney + " монет";
    }
    if (elements.profileAvatar) {
        elements.profileAvatar.textContent = playerName.slice(0, 1).toUpperCase();
    }
}

function renderJournal() {
    if (!elements.journalList) {
        return;
    }
    if (!Array.isArray(state.journal) || !state.journal.length) {
        elements.journalList.innerHTML = '<article class="journal-entry"><p>Записей пока нет.</p></article>';
        return;
    }
    elements.journalList.innerHTML = state.journal.slice(0, 20).map(function (entry) {
        const zoneLabel = sanitizeVisibleText(entry.locationLabel, JOURNAL_LOCATION_LABELS[entry.location] || "Город");
        return '<article class="journal-entry"><p>' + decorateText(sanitizeVisibleText(entry.text, "Запись дневника обновлена.")) + '</p><small>' + escapeHtml(zoneLabel + " · " + formatTimestamp(entry.createdAt || Date.now())) + '</small></article>';
    }).join("");
}

function renderRegistrationModal() {
    const auth = state.auth || {};
    const currentName = sanitizeVisibleText(state.player && state.player.name, "");
    const shouldOpen = !auth.registered || !sanitizeVisibleText(auth.nickname, "") || !currentName || currentName === "Новый игрок";
    elements.registrationModal.classList.toggle("hidden", !shouldOpen);
    elements.registrationModal.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
    if (!shouldOpen) {
        return;
    }
    elements.registrationCopy.textContent = auth.demoMode
        ? "Введи никнейм. Вне Telegram он сохранится только в этом браузере."
        : "Ник будет привязан к твоему Telegram ID.";
    if (!elements.registrationNickname.value) {
        elements.registrationNickname.value = sanitizeVisibleText(auth.nickname, "");
    }
    if (auth.journalStyle) {
        const savedOption = document.querySelector('input[name="registration-journal-style"][value="' + auth.journalStyle + '"]');
        if (savedOption) {
            savedOption.checked = true;
        }
    }
    if (auth.initError && !auth.demoMode) {
        showRegistrationError(auth.initError);
    } else {
        elements.registrationError.textContent = "";
        elements.registrationError.classList.add("hidden");
    }
}

async function submitRegistration() {
    const nickname = (elements.registrationNickname.value || "").trim();
    const checkedStyle = document.querySelector('input[name="registration-journal-style"]:checked');
    const journalStyle = checkedStyle ? checkedStyle.value : "";
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
    if (!journalStyle) {
        showRegistrationError("Выбери стиль дневника.");
        return;
    }

    elements.registrationSubmit.disabled = true;
    try {
        if (state.auth && state.auth.demoMode) {
            state.auth.nickname = nickname;
            state.auth.journalStyle = journalStyle;
            state.auth.registered = true;
            state.player.name = nickname;
            state.player.money = 0;
            state.player.rating = 0;
            saveState();
            renderAll();
            showToast("Аккаунт зарегистрирован.");
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
            body: JSON.stringify({ nickname: nickname, journalStyle: journalStyle })
        });
        if (!response.ok) {
            throw new Error(await readApiError(response));
        }
        const player = await response.json();
        state.auth.nickname = player.nickname || nickname;
        state.auth.journalStyle = player.journalStyle || journalStyle;
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

function renderInventory() {
    if (!elements.inventoryPlaceholder) {
        return;
    }
    const unlocked = (Array.isArray(state.inventory && state.inventory.unlockedAugments) ? state.inventory.unlockedAugments : []).filter(function (id) {
        return Boolean(getOverrideAugment(id));
    });
    if (!unlocked.length) {
        elements.inventoryPlaceholder.innerHTML = "<h3>Пока аугментаций нет</h3><p>Купленные модули будут появляться здесь и распределяться по типам.</p>";
        return;
    }
    const grouped = {
        weapon: unlocked.filter(function (id) { return getOverrideAugment(id).slot === "weapon"; }),
        defense: unlocked.filter(function (id) { return getOverrideAugment(id).slot === "defense"; })
    };
    elements.inventoryPlaceholder.innerHTML = [
        grouped.weapon.length ? '<section class="inventory-slot"><h3>Оружейная аугментация</h3>' + grouped.weapon.map(function (id) {
            const item = getOverrideAugment(id);
            return '<article class="inventory-card"><strong>' + escapeHtml(item.name) + '</strong><p>' + escapeHtml(item.description) + '</p></article>';
        }).join("") + '</section>' : "",
        grouped.defense.length ? '<section class="inventory-slot"><h3>Защитная аугментация</h3>' + grouped.defense.map(function (id) {
            const item = getOverrideAugment(id);
            return '<article class="inventory-card"><strong>' + escapeHtml(item.name) + '</strong><p>' + escapeHtml(item.description) + '</p></article>';
        }).join("") + '</section>' : ""
    ].join("");
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
            const requestName = sanitizeVisibleText(request.name, "Игрок");
            return '<article class="friend-card friend-request-card"><h3>' + escapeHtml(requestName) + '</h3><div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'Онлайн' : 'Оффлайн') + '</span><span class="timer-chip">Рейтинг ' + escapeHtml(String(request.rating || 0)) + '</span></div><div class="friend-actions"><button class="primary-button full-width" type="button" data-request-accept-id="' + escapeHtml(request.id) + '">Принять</button><button class="secondary-button full-width" type="button" data-request-reject-id="' + escapeHtml(request.id) + '">Отклонить</button></div></article>';
        }).join(""),
        '</section>'
    ].join("") : "";
    elements.friendList.innerHTML = friends.length ? friends.map(function (friend) {
        const online = friend.status === "online";
        const friendName = sanitizeVisibleText(friend.name, "Игрок");
        return '<article class="friend-card"><h3>' + escapeHtml(friendName) + '</h3><div class="friend-status-row"><span class="status-chip ' + (online ? 'is-online' : 'is-offline') + '">' + (online ? 'Онлайн' : 'Оффлайн') + '</span><span class="timer-chip">Рейтинг ' + escapeHtml(String(friend.rating || 0)) + '</span></div><div class="friend-actions"><button class="secondary-button full-width" data-friend-chat-id="' + escapeHtml(friend.id) + '" type="button">Написать сообщение</button><button class="secondary-button full-width friend-action-profile" data-friend-profile-id="' + escapeHtml(friend.id) + '" type="button">Посмотреть профиль</button></div></article>';
    }).join("") : '<article class="friend-card"><p>Пока друзей нет. Найди игрока по никнейму и отправь запрос.</p></article>';
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
    document.body.classList.toggle("social-open", Boolean(state.social.isOpen));

    if (!threads.length) {
        elements.socialChatThreadList.innerHTML = '<article class="social-chat-empty">Открытые диалоги появятся здесь после первого сообщения другу.</article>';
        elements.socialChatThreadTitle.textContent = "Выбери чат";
        elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Открой чат через карточку друга.</div>';
        elements.socialChatInput.disabled = true;
        elements.socialChatSend.disabled = true;
        return;
    }

    elements.socialChatThreadList.innerHTML = threads.map(function (thread) {
        const friendName = sanitizeVisibleText(thread.friendName, "Друг");
        const statusText = thread.status === "online" ? "Онлайн" : "Оффлайн";
        return '<button class="social-chat-thread-card' + (activeThread && activeThread.id === thread.id ? ' is-active' : '') + '" type="button" data-social-thread-id="' + escapeHtml(thread.id) + '"><strong>' + escapeHtml(friendName) + '</strong><span>' + escapeHtml(statusText + " · Рейтинг " + (thread.rating || 0)) + '</span></button>';
    }).join("");

    if (!activeThread) {
        elements.socialChatThreadTitle.textContent = "Выбери чат";
        elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Открой чат через карточку друга.</div>';
        elements.socialChatInput.disabled = true;
        elements.socialChatSend.disabled = true;
        return;
    }

    elements.socialChatThreadTitle.textContent = sanitizeVisibleText(activeThread.friendName, "Друг");
    elements.socialChatMessages.innerHTML = (activeThread.messages || []).length
        ? (activeThread.messages || []).map(function (message) {
            const own = message.author === "you";
            const authorName = own ? sanitizeVisibleText(state.player.name, "Ты") : sanitizeVisibleText(activeThread.friendName, "Друг");
            const messageText = sanitizeVisibleText(message.text, "Сообщение скрыто.");
            return '<div class="social-chat-message' + (own ? ' social-chat-message-own' : '') + '"><div class="social-chat-message-bubble"><strong>' + escapeHtml(authorName) + '</strong><p>' + escapeHtml(messageText) + '</p><small>' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</small></div></div>';
        }).join("")
        : '<div class="social-chat-empty">Пока сообщений нет. Напиши первым.</div>';
    elements.socialChatInput.disabled = false;
    elements.socialChatSend.disabled = false;
    elements.socialChatMessages.scrollTop = elements.socialChatMessages.scrollHeight;
}

function renderShop() {
    const activeSection = state.ui.shopSection || "weapon";
    elements.shopTabButtons.forEach(function (button) {
        button.classList.toggle("is-active", button.getAttribute("data-shop-section") === activeSection);
    });
    const items = (Array.isArray(state.shop) ? state.shop : []).filter(function (item) {
        return item.section === activeSection && getOverrideAugment(item.id);
    });
    elements.shopList.innerHTML = items.length ? '<section class="shop-section">' + items.map(function (item) {
        const copy = getOverrideAugment(item.id);
        const owned = item.kind === "augment" && hasAugment(item.augmentId);
        return '<article class="shop-card"><h3>' + escapeHtml(copy.name) + '</h3><div class="shop-price-row"><strong>' + escapeHtml(String(copy.price) + " монет") + '</strong></div><p class="shop-card-copy">' + escapeHtml(copy.description) + '</p><div class="shop-actions"><button class="primary-button" data-shop-id="' + escapeHtml(item.id) + '" type="button"' + (owned ? ' disabled' : '') + '>' + (owned ? 'Куплено' : 'Купить') + '</button></div></article>';
    }).join("") + '</section>' : '<article class="shop-card"><p>Пока товаров в этом разделе нет.</p></article>';
}

function buildDuelStatusText(duel) {
    if (!duel) {
        return "";
    }
    if (duel.finished) {
        return sanitizeVisibleText(duel.resultText, "");
    }
    if (duel.mode === "pvp-live" && duel.yourActionSubmitted) {
        return hasPendingDuelChanges(duel)
            ? "Ты изменил выбор. Нажми «Изменить ход», чтобы обновить решение."
            : "Ход зафиксирован. Ждём соперника.";
    }
    return "";
}

function renderDuelChat(duel) {
    const isLiveChat = duel.mode === "pvp-live";
    const canWrite = isLiveChat && !duel.finished;
    const messages = duel.chatMessages || [];
    if (!messages.length) {
        elements.duelChatList.innerHTML = '<div class="duel-chat-entry"><p class="duel-chat-text">' + (isLiveChat ? "Чат пока пуст. Напиши сопернику первое сообщение." : "Чат доступен только в PvP-матче между двумя игроками.") + '</p></div>';
    } else {
        elements.duelChatList.innerHTML = messages.map(function (message) {
            const own = message.playerId && state.auth && message.playerId === state.auth.playerId;
            const systemMessage = Boolean(message.systemMessage);
            const extraClass = systemMessage ? " duel-chat-entry-system" : (own ? " duel-chat-entry-own" : "");
            const displayName = sanitizeVisibleText(message.displayName, systemMessage ? "Система" : "Игрок");
            const messageText = sanitizeVisibleText(message.text, systemMessage ? "Системное сообщение обновлено." : "Сообщение скрыто.");
            return '<div class="duel-chat-entry' + extraClass + '"><p class="duel-chat-meta">' + escapeHtml(displayName) + ' · ' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</p><p class="duel-chat-text">' + escapeHtml(messageText) + '</p></div>';
        }).join("");
    }
    elements.duelChatInput.disabled = !canWrite;
    elements.duelChatSendButton.disabled = !canWrite;
    elements.duelChatInput.placeholder = canWrite ? "Напиши сообщение сопернику" : "Чат недоступен";
    elements.duelChatError.textContent = sanitizeVisibleText(duel.chatError, "");
    elements.duelChatError.classList.toggle("hidden", !duel.chatError);
    elements.duelChatList.scrollTop = elements.duelChatList.scrollHeight;
}

function renderDuel() {
    refreshStaticCopy();
    const duel = state.duel;
    if (!duel) {
        closeDuelSilently();
        return;
    }

    duel.activePanel = duel.activePanel || "logs";
    duel.autoBattleEnabled = false;
    duel.autoBattlePendingEnabled = null;
    duel.chatMessages = Array.isArray(duel.chatMessages) ? duel.chatMessages : [];
    duel.chatError = sanitizeVisibleText(duel.chatError, "");
    duel.resultText = sanitizeVisibleText(duel.resultText, "");
    duel.logs = (Array.isArray(duel.logs) ? duel.logs : []).map(function (entry) {
        return Object.assign({}, entry, { lines: sanitizeLogLines(entry.lines) });
    }).filter(function (entry) {
        return entry.lines.length > 0;
    });

    syncDuelInputs(duel);
    renderDuelControls();
    hideAutoBattleUi();

    elements.duelTitle.textContent = "Дуэль";
    elements.duelRoundPill.textContent = "Раунд " + duel.round;
    elements.duelRoundTimer.textContent = formatDuration(getRoundTimeRemainingMs(duel));
    elements.duelYouName.textContent = sanitizeVisibleText(duel.playerName, "Игрок");
    elements.duelYouMeta.textContent = "";
    elements.duelYouAvatar.textContent = sanitizeVisibleText(duel.playerName, "И").slice(0, 1).toUpperCase();
    elements.duelOpponentName.textContent = sanitizeVisibleText(duel.opponentName, "Соперник");
    elements.duelOpponentMeta.textContent = "";
    elements.duelOpponentAvatar.textContent = sanitizeVisibleText(duel.opponentName, "С").slice(0, 1).toUpperCase();
    elements.duelYouHp.textContent = duel.playerHp + " HP";
    elements.duelOpponentHp.textContent = duel.opponentHp + " HP";
    elements.duelYouFill.style.width = Math.max(0, Math.min(100, Math.round((duel.playerHp / getPlayerMaxHp()) * 100))) + "%";
    elements.duelOpponentFill.style.width = Math.max(0, Math.min(100, Math.round((duel.opponentHp / getPlayerMaxHp()) * 100))) + "%";

    const duelStatus = buildDuelStatusText(duel);
    elements.duelRoundStatus.innerHTML = duelStatus ? decorateText(duelStatus) : "";
    elements.duelRoundStatus.classList.toggle("hidden", !duelStatus);

    const duelSelectionComplete = isDuelSelectionComplete(duel);
    const duelHasPendingChanges = hasPendingDuelChanges(duel);
    elements.duelSubmitButton.textContent = duel.finished
        ? "Бой завершен"
        : duel.yourActionSubmitted
            ? (duelHasPendingChanges ? "Изменить ход" : "Ход сделан")
            : "Сделать ход";
    elements.duelSubmitButton.disabled = duel.finished || !duelSelectionComplete || (duel.yourActionSubmitted && !duelHasPendingChanges);

    if (!duel.logs.length) {
        elements.duelLogList.innerHTML = '<div class="duel-log-round"><p class="duel-log-round-title">Логов пока нет. Первый обмен ходами появится здесь.</p></div>';
    } else {
        elements.duelLogList.innerHTML = duel.logs.slice().reverse().map(function (entry) {
            const roundNumber = typeof entry.round === "number" ? entry.round : entry.roundNumber;
            const lines = sanitizeLogLines(entry.lines);
            const title = lines.length ? lines[0] : "Раунд " + roundNumber;
            const detailLines = lines.slice(1);
            return '<div class="duel-log-round"><p class="duel-log-round-title">' + decorateText(title) + '</p>' + detailLines.map(function (line) {
                return '<p class="duel-log-line">' + decorateText(line) + '</p>';
            }).join('') + '</div>';
        }).join('');
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

function renderAll() {
    repairStateAfterLegacyLoad();
    refreshStaticCopy();
    renderScreens();
    renderProfile();
    renderHeroStats();
    renderRegistrationModal();
    renderQueueStatus();
    renderJournal();
    renderInventory();
    renderFriends();
    decorateFriendCards();
    renderSocialInbox();
    renderShop();
    renderDuel();
    renderStartDuelModal();
    renderDuelExitModal();
    renderDuelResultModal();
    stripInlineButtonActions();
}

repairStateAfterLegacyLoad();
refreshStaticCopy();
if (window.PolusApp) {
    delete window.PolusApp.toggleAutoBattle;
    window.PolusApp.submitDuelTurn = submitCurrentDuelTurn;
    window.PolusApp.closeDuelResult = closeDuelResult;
}

function stripInlineButtonActions() {
    return;
}

function isPlaceholderPlayerName(value) {
    const normalized = sanitizeVisibleText(value, "").trim().toLowerCase();
    return !normalized || normalized === "новый игрок";
}

function repairStateAfterLegacyLoad() {
    if (!state || typeof state !== "object") {
        return;
    }

    state.player = Object.assign({ name: "Новый игрок", money: 0, rating: 0 }, state.player || {});
    state.auth = Object.assign({
        sessionToken: null,
        playerId: null,
        telegramUserId: null,
        nickname: "",
        registered: false,
        demoMode: false,
        initError: "",
        journalStyle: ""
    }, state.auth || {});
    state.ui = Object.assign({
        screen: "home",
        shopSection: "weapon",
        duelExitConfirmOpen: false,
        startDuelConfirm: null,
        startDuelAction: null,
        duelResult: null
    }, state.ui || {});
    state.social = Object.assign({ isOpen: false, activeThreadId: null, threads: [] }, state.social || {});
    state.inventory = Object.assign({ unlockedAugments: [] }, state.inventory || {});
    state.matchmaking = Object.assign({ status: "IDLE", duelId: null, queuedAt: null, message: "" }, state.matchmaking || {});
    state.journal = Array.isArray(state.journal) ? state.journal : [];
    state.friends = Array.isArray(state.friends) ? state.friends : [];
    state.friendRequests = Array.isArray(state.friendRequests) ? state.friendRequests : [];

    state.player.money = Number(state.player.money || 0);
    state.player.rating = Number(state.player.rating || 0);
    state.player.name = sanitizeVisibleText(state.player.name, "Новый игрок") || "Новый игрок";
    state.auth.nickname = sanitizeVisibleText(state.auth.nickname, "");
    state.auth.journalStyle = state.auth.journalStyle === "W" ? "W" : state.auth.journalStyle === "M" ? "M" : "";
    state.auth.initError = sanitizeVisibleText(state.auth.initError, "");

    if (isPlaceholderPlayerName(state.player.name)) {
        state.player.name = "Новый игрок";
    }
    if (isPlaceholderPlayerName(state.auth.nickname)) {
        state.auth.nickname = "";
    }
    if (!state.auth.nickname || isPlaceholderPlayerName(state.player.name)) {
        state.auth.registered = false;
    }

    state.ui.screen = ["home", "inventory", "friends", "shop"].includes(state.ui.screen) ? state.ui.screen : "home";
    state.ui.shopSection = ["weapon", "defense"].includes(state.ui.shopSection) ? state.ui.shopSection : "weapon";

    state.social.threads = state.social.threads.map(function (thread) {
        return Object.assign({}, thread, {
            friendName: sanitizeVisibleText(thread.friendName, "Друг"),
            status: thread.status === "online" ? "online" : "offline",
            rating: Number(thread.rating || 0),
            messages: (Array.isArray(thread.messages) ? thread.messages : []).map(function (message) {
                return Object.assign({}, message, {
                    text: sanitizeVisibleText(message.text, "Сообщение скрыто."),
                    displayName: sanitizeVisibleText(message.displayName, message.systemMessage ? "Система" : "Игрок")
                });
            })
        });
    });

    state.friends = state.friends.map(function (friend) {
        return Object.assign({}, friend, {
            name: sanitizeVisibleText(friend.name, "Игрок"),
            status: friend.status === "online" ? "online" : "offline",
            rating: Number(friend.rating || 0)
        });
    });

    state.friendRequests = state.friendRequests.map(function (request) {
        return Object.assign({}, request, {
            name: sanitizeVisibleText(request.name, "Игрок"),
            status: request.status === "online" ? "online" : "offline",
            rating: Number(request.rating || 0)
        });
    });

    state.journal = state.journal.map(function (entry) {
        return Object.assign({}, entry, {
            text: sanitizeVisibleText(entry.text, "Запись дневника обновлена."),
            locationLabel: sanitizeVisibleText(entry.locationLabel, JOURNAL_LOCATION_LABELS[entry.location] || "Город")
        });
    }).filter(function (entry) {
        return Boolean(entry.text);
    });

    if (state.duel) {
        state.duel.autoBattleEnabled = false;
        state.duel.autoBattlePendingEnabled = null;
        state.duel.autoResolutionAt = null;
        state.duel.canSubmitAction = !state.duel.finished;
        state.duel.chatError = sanitizeVisibleText(state.duel.chatError, "");
        state.duel.resultText = sanitizeVisibleText(state.duel.resultText, "");
        state.duel.logs = (Array.isArray(state.duel.logs) ? state.duel.logs : []).map(function (entry) {
            return Object.assign({}, entry, { lines: sanitizeLogLines(entry.lines) });
        }).filter(function (entry) {
            return entry.lines.length > 0;
        });
        state.duel.chatMessages = (Array.isArray(state.duel.chatMessages) ? state.duel.chatMessages : []).map(function (message) {
            return Object.assign({}, message, {
                displayName: sanitizeVisibleText(message.displayName, message.systemMessage ? "Система" : "Игрок"),
                text: sanitizeVisibleText(message.text, message.systemMessage ? "Системное сообщение обновлено." : "Сообщение скрыто.")
            });
        });
    }
}

function refreshStaticCopy() {
    document.title = "Полюс";
    if (elements.shopMoney) {
        elements.shopMoney.textContent = String(Number(state.player && state.player.money || 0)) + " монет";
    }
}

function syncPlayerFromServer(player, resetEconomy) {
    state.player.id = player.id;
    state.player.name = sanitizeVisibleText(player.nickname, "")
        || sanitizeVisibleText(player.displayName, "")
        || sanitizeVisibleText(state.auth.nickname, "")
        || "Новый игрок";
    state.player.telegramUserId = player.telegramUserId || null;
    state.player.rating = typeof player.rating === "number" ? player.rating : Number(state.player.rating || 0);
    if (resetEconomy || typeof state.player.money !== "number" || typeof player.coins === "number") {
        state.player.money = typeof player.coins === "number" ? player.coins : Number(state.player.money || 0);
    }
    state.player.wins = typeof player.wins === "number" ? player.wins : Number(state.player.wins || 0);
    state.player.losses = typeof player.losses === "number" ? player.losses : Number(state.player.losses || 0);
    state.auth.nickname = sanitizeVisibleText(player.nickname, state.auth.nickname || "");
    state.auth.journalStyle = player.journalStyle === "W" ? "W" : player.journalStyle === "M" ? "M" : (state.auth.journalStyle || "");
    state.auth.registered = Boolean(player.registered) && !isPlaceholderPlayerName(state.player.name);
}

function renderProfile() {
    const playerName = sanitizeVisibleText(state.player && state.player.name, sanitizeVisibleText(state.auth && state.auth.nickname, "Новый игрок")) || "Новый игрок";
    const playerMoney = Number(state.player && state.player.money || 0);
    const playerRating = Number(state.player && state.player.rating || 0);
    elements.profileName.textContent = playerName;
    elements.profileMoney.textContent = String(playerMoney);
    if (elements.profileRating) {
        elements.profileRating.textContent = String(playerRating);
    }
    if (elements.shopMoney) {
        elements.shopMoney.textContent = playerMoney + " монет";
    }
    if (elements.profileAvatar) {
        elements.profileAvatar.textContent = playerName.slice(0, 1).toUpperCase();
    }
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
    elements.queueStatusNote.textContent = sanitizeVisibleText(state.matchmaking.message, "Ищем соперника в очереди.");
    elements.queueCancelButton.disabled = false;
}

function renderJournal() {
    if (!elements.journalList) {
        return;
    }
    if (!Array.isArray(state.journal) || !state.journal.length) {
        elements.journalList.innerHTML = '<article class="journal-entry"><p>Записей пока нет.</p></article>';
        return;
    }
    elements.journalList.innerHTML = state.journal.slice(0, 20).map(function (entry) {
        const zoneLabel = sanitizeVisibleText(entry.locationLabel, JOURNAL_LOCATION_LABELS[entry.location] || "Город");
        return '<article class="journal-entry"><p>' + decorateText(sanitizeVisibleText(entry.text, "Запись дневника обновлена.")) + '</p><small>' + escapeHtml(zoneLabel + " · " + formatTimestamp(entry.createdAt || Date.now())) + '</small></article>';
    }).join("");
}

function renderRegistrationModal() {
    const auth = state.auth || {};
    const currentName = sanitizeVisibleText(state.player && state.player.name, "");
    const nickname = sanitizeVisibleText(auth.nickname, "");
    const shouldOpen = !auth.registered || isPlaceholderPlayerName(currentName) || isPlaceholderPlayerName(nickname);
    elements.registrationModal.classList.toggle("hidden", !shouldOpen);
    elements.registrationModal.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
    if (!shouldOpen) {
        return;
    }
    elements.registrationCopy.textContent = auth.demoMode
        ? "Введи никнейм. Вне Telegram он сохранится только в этом браузере."
        : "Ник будет привязан к твоему Telegram ID.";
    if (!elements.registrationNickname.value && nickname) {
        elements.registrationNickname.value = nickname;
    }
    if (auth.journalStyle) {
        const savedOption = document.querySelector('input[name="registration-journal-style"][value="' + auth.journalStyle + '"]');
        if (savedOption) {
            savedOption.checked = true;
        }
    }
    if (auth.initError && !auth.demoMode) {
        showRegistrationError(auth.initError);
    } else {
        elements.registrationError.textContent = "";
        elements.registrationError.classList.add("hidden");
    }
}

async function submitRegistration() {
    const nickname = (elements.registrationNickname.value || "").trim();
    const checkedStyle = document.querySelector('input[name="registration-journal-style"]:checked');
    const journalStyle = checkedStyle ? checkedStyle.value : "";
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
    if (!/^[\\p{L}\\p{N}_-]+$/u.test(nickname)) {
        showRegistrationError("Ник может содержать только буквы, цифры, _ и -.");
        return;
    }
    if (!journalStyle) {
        showRegistrationError("Выбери стиль дневника.");
        return;
    }

    elements.registrationSubmit.disabled = true;
    try {
        if (state.auth && state.auth.demoMode) {
            state.auth.nickname = nickname;
            state.auth.journalStyle = journalStyle;
            state.auth.registered = true;
            state.player.name = nickname;
            state.player.money = 0;
            state.player.rating = 0;
            saveState();
            renderAll();
            showToast("Аккаунт зарегистрирован.");
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
            body: JSON.stringify({ nickname: nickname, journalStyle: journalStyle })
        });
        if (!response.ok) {
            throw new Error(await readApiError(response));
        }
        const player = await response.json();
        state.auth.nickname = player.nickname || nickname;
        state.auth.journalStyle = player.journalStyle || journalStyle;
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

function renderInventory() {
    if (!elements.inventoryPlaceholder) {
        return;
    }
    const unlocked = (Array.isArray(state.inventory && state.inventory.unlockedAugments) ? state.inventory.unlockedAugments : []).filter(function (id) {
        return Boolean(getOverrideAugment(id));
    });
    if (!unlocked.length) {
        elements.inventoryPlaceholder.innerHTML = "<h3>Пока аугментаций нет</h3><p>Купленные модули будут появляться здесь и распределяться по типам.</p>";
        return;
    }
    const grouped = {
        weapon: unlocked.filter(function (id) { return getOverrideAugment(id).slot === "weapon"; }),
        defense: unlocked.filter(function (id) { return getOverrideAugment(id).slot === "defense"; })
    };
    elements.inventoryPlaceholder.innerHTML = [
        grouped.weapon.length ? '<section class="inventory-slot"><h3>Оружейная аугментация</h3>' + grouped.weapon.map(function (id) {
            const item = getOverrideAugment(id);
            return '<article class="inventory-card"><strong>' + escapeHtml(item.name) + '</strong><p>' + escapeHtml(item.description) + '</p></article>';
        }).join("") + '</section>' : "",
        grouped.defense.length ? '<section class="inventory-slot"><h3>Защитная аугментация</h3>' + grouped.defense.map(function (id) {
            const item = getOverrideAugment(id);
            return '<article class="inventory-card"><strong>' + escapeHtml(item.name) + '</strong><p>' + escapeHtml(item.description) + '</p></article>';
        }).join("") + '</section>' : ""
    ].join("");
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
            const requestName = sanitizeVisibleText(request.name, "Игрок");
            return '<article class="friend-card friend-request-card"><h3>' + escapeHtml(requestName) + '</h3><div class="friend-status-row"><span class="status-chip ' + (online ? "is-online" : "is-offline") + '">' + (online ? "Онлайн" : "Оффлайн") + '</span><span class="timer-chip">Рейтинг ' + escapeHtml(String(request.rating || 0)) + '</span></div><div class="friend-actions"><button class="primary-button full-width" type="button" data-request-accept-id="' + escapeHtml(request.id) + '">Принять</button><button class="secondary-button full-width" type="button" data-request-reject-id="' + escapeHtml(request.id) + '">Отклонить</button></div></article>';
        }).join(""),
        '</section>'
    ].join("") : "";
    elements.friendList.innerHTML = friends.length ? friends.map(function (friend) {
        const online = friend.status === "online";
        const friendName = sanitizeVisibleText(friend.name, "Игрок");
        return '<article class="friend-card"><h3>' + escapeHtml(friendName) + '</h3><div class="friend-status-row"><span class="status-chip ' + (online ? "is-online" : "is-offline") + '">' + (online ? "Онлайн" : "Оффлайн") + '</span><span class="timer-chip">Рейтинг ' + escapeHtml(String(friend.rating || 0)) + '</span></div><div class="friend-actions"><button class="secondary-button full-width" data-friend-chat-id="' + escapeHtml(friend.id) + '" type="button">Написать сообщение</button><button class="secondary-button full-width friend-action-profile" data-friend-profile-id="' + escapeHtml(friend.id) + '" type="button">Посмотреть профиль</button></div></article>';
    }).join("") : '<article class="friend-card"><p>Пока друзей нет. Найди игрока по никнейму и отправь запрос.</p></article>';
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
    document.body.classList.toggle("social-open", Boolean(state.social.isOpen));

    if (!threads.length) {
        elements.socialChatThreadList.innerHTML = '<article class="social-chat-empty">Открытые диалоги появятся здесь после первого сообщения другу.</article>';
        elements.socialChatThreadTitle.textContent = "Выбери чат";
        elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Открой чат через карточку друга.</div>';
        elements.socialChatInput.disabled = true;
        elements.socialChatSend.disabled = true;
        return;
    }

    elements.socialChatThreadList.innerHTML = threads.map(function (thread) {
        const friendName = sanitizeVisibleText(thread.friendName, "Друг");
        const statusText = thread.status === "online" ? "Онлайн" : "Оффлайн";
        return '<button class="social-chat-thread-card' + (activeThread && activeThread.id === thread.id ? " is-active" : "") + '" type="button" data-social-thread-id="' + escapeHtml(thread.id) + '"><strong>' + escapeHtml(friendName) + '</strong><span>' + escapeHtml(statusText + " · Рейтинг " + (thread.rating || 0)) + '</span></button>';
    }).join("");

    if (!activeThread) {
        elements.socialChatThreadTitle.textContent = "Выбери чат";
        elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Открой чат через карточку друга.</div>';
        elements.socialChatInput.disabled = true;
        elements.socialChatSend.disabled = true;
        return;
    }

    elements.socialChatThreadTitle.textContent = sanitizeVisibleText(activeThread.friendName, "Друг");
    elements.socialChatMessages.innerHTML = (activeThread.messages || []).length
        ? (activeThread.messages || []).map(function (message) {
            const own = message.author === "you";
            const authorName = own ? sanitizeVisibleText(state.player.name, "Ты") : sanitizeVisibleText(activeThread.friendName, "Друг");
            const messageText = sanitizeVisibleText(message.text, "Сообщение скрыто.");
            return '<div class="social-chat-message' + (own ? " social-chat-message-own" : "") + '"><div class="social-chat-message-bubble"><strong>' + escapeHtml(authorName) + '</strong><p>' + escapeHtml(messageText) + '</p><small>' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</small></div></div>';
        }).join("")
        : '<div class="social-chat-empty">Пока сообщений нет. Напиши первым.</div>';
    elements.socialChatInput.disabled = false;
    elements.socialChatSend.disabled = false;
    elements.socialChatMessages.scrollTop = elements.socialChatMessages.scrollHeight;
}

function renderShop() {
    const activeSection = state.ui.shopSection || "weapon";
    elements.shopTabButtons.forEach(function (button) {
        button.classList.toggle("is-active", button.getAttribute("data-shop-section") === activeSection);
    });
    const items = (Array.isArray(state.shop) ? state.shop : []).filter(function (item) {
        return item.section === activeSection && getOverrideAugment(item.id);
    });
    elements.shopList.innerHTML = items.length ? '<section class="shop-section">' + items.map(function (item) {
        const copy = getOverrideAugment(item.id);
        const owned = item.kind === "augment" && hasAugment(item.augmentId);
        return '<article class="shop-card"><h3>' + escapeHtml(copy.name) + '</h3><div class="shop-price-row"><strong>' + escapeHtml(String(copy.price) + " монет") + '</strong></div><p class="shop-card-copy">' + escapeHtml(copy.description) + '</p><div class="shop-actions"><button class="primary-button" data-shop-id="' + escapeHtml(item.id) + '" type="button"' + (owned ? " disabled" : "") + '>' + (owned ? "Куплено" : "Купить") + '</button></div></article>';
    }).join("") + '</section>' : '<article class="shop-card"><p>Пока товаров в этом разделе нет.</p></article>';
}

function buildDuelStatusText(duel) {
    if (!duel) {
        return "";
    }
    if (duel.finished) {
        return sanitizeVisibleText(duel.resultText, "");
    }
    if (duel.mode === "pvp-live" && duel.yourActionSubmitted) {
        return hasPendingDuelChanges(duel)
            ? "Ты изменил выбор. Нажми «Изменить ход», чтобы обновить решение."
            : "Ход зафиксирован. Ждём соперника.";
    }
    return "";
}

function renderDuelChat(duel) {
    const isLiveChat = duel.mode === "pvp-live";
    const canWrite = isLiveChat && !duel.finished;
    const messages = duel.chatMessages || [];
    if (!messages.length) {
        elements.duelChatList.innerHTML = '<div class="duel-chat-entry"><p class="duel-chat-text">' + (isLiveChat ? "Чат пока пуст. Напиши сопернику первое сообщение." : "Чат доступен только в PvP-матче между двумя игроками.") + '</p></div>';
    } else {
        elements.duelChatList.innerHTML = messages.map(function (message) {
            const own = message.playerId && state.auth && message.playerId === state.auth.playerId;
            const systemMessage = Boolean(message.systemMessage);
            const extraClass = systemMessage ? " duel-chat-entry-system" : (own ? " duel-chat-entry-own" : "");
            const displayName = sanitizeVisibleText(message.displayName, systemMessage ? "Система" : "Игрок");
            const messageText = sanitizeVisibleText(message.text, systemMessage ? "Системное сообщение обновлено." : "Сообщение скрыто.");
            return '<div class="duel-chat-entry' + extraClass + '"><p class="duel-chat-meta">' + escapeHtml(displayName) + ' · ' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</p><p class="duel-chat-text">' + escapeHtml(messageText) + '</p></div>';
        }).join("");
    }
    elements.duelChatInput.disabled = !canWrite;
    elements.duelChatSendButton.disabled = !canWrite;
    elements.duelChatInput.placeholder = canWrite ? "Напиши сообщение сопернику" : "Чат недоступен";
    elements.duelChatError.textContent = sanitizeVisibleText(duel.chatError, "");
    elements.duelChatError.classList.toggle("hidden", !duel.chatError);
    elements.duelChatList.scrollTop = elements.duelChatList.scrollHeight;
}

function renderDuel() {
    refreshStaticCopy();
    const duel = state.duel;
    if (!duel) {
        closeDuelSilently();
        return;
    }

    duel.activePanel = duel.activePanel || "logs";
    duel.autoBattleEnabled = false;
    duel.autoBattlePendingEnabled = null;
    duel.chatMessages = Array.isArray(duel.chatMessages) ? duel.chatMessages : [];
    duel.chatError = sanitizeVisibleText(duel.chatError, "");
    duel.resultText = sanitizeVisibleText(duel.resultText, "");
    duel.logs = (Array.isArray(duel.logs) ? duel.logs : []).map(function (entry) {
        return Object.assign({}, entry, { lines: sanitizeLogLines(entry.lines) });
    }).filter(function (entry) {
        return entry.lines.length > 0;
    });

    syncDuelInputs(duel);
    renderDuelControls();
    hideAutoBattleUi();

    elements.duelTitle.textContent = "Дуэль";
    elements.duelRoundPill.textContent = "Раунд " + duel.round;
    elements.duelRoundTimer.textContent = formatDuration(getRoundTimeRemainingMs(duel));
    elements.duelYouName.textContent = sanitizeVisibleText(duel.playerName, "Игрок");
    elements.duelYouMeta.textContent = "";
    elements.duelYouAvatar.textContent = sanitizeVisibleText(duel.playerName, "И").slice(0, 1).toUpperCase();
    elements.duelOpponentName.textContent = sanitizeVisibleText(duel.opponentName, "Соперник");
    elements.duelOpponentMeta.textContent = "";
    elements.duelOpponentAvatar.textContent = sanitizeVisibleText(duel.opponentName, "С").slice(0, 1).toUpperCase();
    elements.duelYouHp.textContent = duel.playerHp + " HP";
    elements.duelOpponentHp.textContent = duel.opponentHp + " HP";
    elements.duelYouFill.style.width = Math.max(0, Math.min(100, Math.round((duel.playerHp / getPlayerMaxHp()) * 100))) + "%";
    elements.duelOpponentFill.style.width = Math.max(0, Math.min(100, Math.round((duel.opponentHp / getPlayerMaxHp()) * 100))) + "%";

    const duelStatus = buildDuelStatusText(duel);
    elements.duelRoundStatus.innerHTML = duelStatus ? decorateText(duelStatus) : "";
    elements.duelRoundStatus.classList.toggle("hidden", !duelStatus);

    const duelSelectionComplete = isDuelSelectionComplete(duel);
    const duelHasPendingChanges = hasPendingDuelChanges(duel);
    elements.duelSubmitButton.textContent = duel.finished
        ? "Бой завершен"
        : duel.yourActionSubmitted
            ? (duelHasPendingChanges ? "Изменить ход" : "Ход сделан")
            : "Сделать ход";
    elements.duelSubmitButton.disabled = duel.finished || !duelSelectionComplete || (duel.yourActionSubmitted && !duelHasPendingChanges);

    if (!duel.logs.length) {
        elements.duelLogList.innerHTML = '<div class="duel-log-round"><p class="duel-log-round-title">Логов пока нет. Первый обмен ходами появится здесь.</p></div>';
    } else {
        elements.duelLogList.innerHTML = duel.logs.slice().reverse().map(function (entry) {
            const roundNumber = typeof entry.round === "number" ? entry.round : entry.roundNumber;
            const lines = sanitizeLogLines(entry.lines);
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

function openDuelResultModal(config) {
    const inferredVictory = Number(config.rating || 0) > 0 || Number(config.money || 0) >= BATTLE_VICTORY_COINS;
    const inferredDefeat = Number(config.rating || 0) < 0 || Number(config.money || 0) === BATTLE_DEFEAT_COINS;
    const fallbackTitle = inferredVictory ? "Победа" : (inferredDefeat ? "Поражение" : "Бой завершен");
    const fallbackCopy = inferredVictory ? "Ты победил в дуэли." : inferredDefeat ? "Ты проиграл в дуэли." : "Раундов больше не осталось.";
    state.ui.duelExitConfirmOpen = false;
    state.ui.duelResult = {
        title: sanitizeVisibleText(config.title, fallbackTitle),
        copy: sanitizeVisibleText(config.copy, fallbackCopy),
        rating: Number(config.rating ?? config.experience) || 0,
        money: Number(config.money) || 0
    };
    saveState();
    renderDuelResultModal();
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
    elements.duelResultTitle.textContent = sanitizeVisibleText(result.title, "Бой завершен");
    elements.duelResultCopy.textContent = sanitizeVisibleText(result.copy, "");
    elements.duelResultExp.textContent = formatSignedReward(result.rating || 0, " рейтинга");
    elements.duelResultMoney.textContent = formatSignedReward(result.money || 0, " монет");
}

function openLiveDuelResult(payload) {
    const isVictory = payload.resultLabel === "VICTORY";
    const isDefeat = payload.resultLabel === "DEFEAT";
    openDuelResultModal({
        title: isVictory ? "Победа" : isDefeat ? "Поражение" : "Бой завершен",
        copy: isVictory ? "Ты победил в дуэли." : isDefeat ? "Ты проиграл в дуэли." : "Раундов больше не осталось.",
        rating: isVictory ? PVP_RATING_DELTA : isDefeat ? -PVP_RATING_DELTA : 0,
        money: isVictory ? BATTLE_VICTORY_COINS : isDefeat ? BATTLE_DEFEAT_COINS : 0
    });
}

function renderAll() {
    repairStateAfterLegacyLoad();
    refreshStaticCopy();
    renderScreens();
    renderProfile();
    renderHeroStats();
    renderRegistrationModal();
    renderQueueStatus();
    renderJournal();
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

repairStateAfterLegacyLoad();
refreshStaticCopy();
if (window.PolusApp) {
    delete window.PolusApp.toggleAutoBattle;
    window.PolusApp.submitDuelTurn = submitCurrentDuelTurn;
    window.PolusApp.closeDuelResult = closeDuelResult;
}

const CLEAN_ZONE_LABELS = {
    street: "Улица",
    tavern: "Трактир",
    arena: "Арена",
    market: "Рынок",
    city: "Город"
};

const CLEAN_AUGMENT_COPY = {
    weaponBrassSights: {
        id: "weaponBrassSights",
        slot: "weapon",
        name: "Прицельная рамка",
        description: "+5 к урону",
        price: 100
    },
    weaponDoubleTap: {
        id: "weaponDoubleTap",
        slot: "weapon",
        name: "Рискованный затвор",
        description: "5% двойной урон · 5% осечка",
        price: 100
    },
    defensePlating: {
        id: "defensePlating",
        slot: "defense",
        name: "Северная бронепластина",
        description: "-3 входящего урона",
        price: 100
    },
    defenseHeatSink: {
        id: "defenseHeatSink",
        slot: "defense",
        name: "Усиленный каркас",
        description: "+15 здоровья",
        price: 100
    }
};

function safeSetText(element, text) {
    if (element) {
        element.textContent = text;
    }
}

function setSelectorText(selector, text) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = text;
    }
}

function setButtonHandler(target, handler) {
    if (!target) {
        return;
    }
    target.onclick = function (event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        handler();
        return false;
    };
}

function setFormHandler(target, handler) {
    if (!target) {
        return;
    }
    target.onsubmit = function (event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        handler();
        return false;
    };
}

function looksLikeMojibake(text) {
    if (typeof text !== "string" || !text) {
        return false;
    }
    return /Р[\u0400-\u04FF]?|С[\u0400-\u04FF]?/.test(text) && /[РС]/.test(text);
}

function sanitizeVisibleText(text, fallback) {
    if (text == null) {
        return fallback || "";
    }
    const normalized = String(text).trim();
    if (!normalized) {
        return fallback || "";
    }
    return looksLikeMojibake(normalized) ? (fallback || "") : normalized;
}

function getOverrideAugment(id) {
    return FINAL_CLEAN_AUGMENT_COPY[id] || null;
}

function isPlaceholderPlayerName(value) {
    const normalized = sanitizeVisibleText(value, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
    if (!normalized) {
        return true;
    }
    const compact = normalized.replace(/\s+/g, "");
    return normalized === "новый игрок" || compact === "новыйигрок";
}

function bindStaticActionHandlers() {
    setButtonHandler(document.getElementById("find-match-button"), function () {
        startQueueDuel();
    });
    setButtonHandler(document.getElementById("bot-duel-button"), function () {
        startBotDuel();
    });
    setButtonHandler(document.getElementById("queue-cancel-button"), function () {
        cancelQueue();
    });
    setButtonHandler(document.getElementById("social-chat-fab"), function () {
        openSocialInbox();
    });
    setButtonHandler(document.getElementById("social-chat-close"), function () {
        closeSocialInbox();
    });
    setButtonHandler(document.getElementById("start-duel-cancel"), function () {
        cancelStartDuel();
    });
    setButtonHandler(document.getElementById("start-duel-confirm"), function () {
        confirmStartDuel();
    });
    setButtonHandler(document.getElementById("duel-exit-cancel"), function () {
        cancelDuelExit();
    });
    setButtonHandler(document.getElementById("duel-exit-confirm"), function () {
        confirmDuelExit();
    });
    setButtonHandler(document.getElementById("duel-result-close"), function () {
        closeDuelResult();
    });
    setButtonHandler(document.getElementById("duel-close-button"), function () {
        closeDuel();
    });
    setButtonHandler(document.getElementById("duel-clear-log-button"), function () {
        clearDuelLog();
    });
    setButtonHandler(document.getElementById("duel-submit-button"), function () {
        submitCurrentDuelTurn();
    });
    setButtonHandler(document.getElementById("duel-tab-logs"), function () {
        setDuelPanel("logs");
    });
    setButtonHandler(document.getElementById("duel-tab-chat"), function () {
        setDuelPanel("chat");
    });
    setFormHandler(elements.registrationForm, function () {
        submitRegistration();
    });
    setFormHandler(elements.friendSearchForm, function () {
        submitFriendSearch();
    });
    setFormHandler(elements.duelChatForm, function () {
        submitDuelChat();
    });
    setFormHandler(elements.socialChatForm, function () {
        submitSocialChat();
    });
    if (elements.duelForm) {
        elements.duelForm.onsubmit = function (event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            submitCurrentDuelTurn();
            return false;
        };
    }

    Array.from(document.querySelectorAll("[data-nav-target]")).forEach(function (button) {
        setButtonHandler(button, function () {
            navigateTo(button.getAttribute("data-nav-target"));
        });
    });
    Array.from(document.querySelectorAll("[data-shop-section]")).forEach(function (button) {
        setButtonHandler(button, function () {
            setShopSection(button.getAttribute("data-shop-section"));
        });
    });
    Array.from(document.querySelectorAll("[data-duel-select]")).forEach(function (button) {
        setButtonHandler(button, function () {
            updateDuelSelection(button.getAttribute("data-duel-select"), button.getAttribute("data-value"));
        });
    });
    Array.from(document.querySelectorAll("[data-shop-id]")).forEach(function (button) {
        setButtonHandler(button, function () {
            buyShopItem(button.getAttribute("data-shop-id"));
        });
    });
    Array.from(document.querySelectorAll("[data-friend-chat-id]")).forEach(function (button) {
        setButtonHandler(button, function () {
            openFriendChat(button.getAttribute("data-friend-chat-id"));
        });
    });
    Array.from(document.querySelectorAll("[data-friend-profile-id]")).forEach(function (button) {
        setButtonHandler(button, function () {
            viewFriendProfile(button.getAttribute("data-friend-profile-id"));
        });
    });
    Array.from(document.querySelectorAll("[data-request-accept-id]")).forEach(function (button) {
        setButtonHandler(button, function () {
            acceptFriendRequest(button.getAttribute("data-request-accept-id"));
        });
    });
    Array.from(document.querySelectorAll("[data-request-reject-id]")).forEach(function (button) {
        setButtonHandler(button, function () {
            rejectFriendRequest(button.getAttribute("data-request-reject-id"));
        });
    });
    Array.from(document.querySelectorAll("[data-social-thread-id]")).forEach(function (button) {
        setButtonHandler(button, function () {
            openSocialInbox(button.getAttribute("data-social-thread-id"));
        });
    });
}

function repairStateAfterLegacyLoad() {
    if (!state || typeof state !== "object") {
        return;
    }

    state.player = Object.assign({ id: null, name: "Новый игрок", money: 0, rating: 0 }, state.player || {});
    state.auth = Object.assign({
        sessionToken: null,
        playerId: null,
        telegramUserId: null,
        nickname: "",
        registered: false,
        demoMode: false,
        initError: "",
        journalStyle: ""
    }, state.auth || {});
    state.ui = Object.assign({
        screen: "home",
        shopSection: "weapon",
        duelExitConfirmOpen: false,
        startDuelConfirm: null,
        startDuelAction: null,
        duelResult: null
    }, state.ui || {});
    state.social = Object.assign({ isOpen: false, activeThreadId: null, threads: [] }, state.social || {});
    state.inventory = Object.assign({ unlockedAugments: [] }, state.inventory || {});
    state.matchmaking = Object.assign({ status: "IDLE", duelId: null, queuedAt: null, message: "" }, state.matchmaking || {});
    state.journal = Array.isArray(state.journal) ? state.journal : [];
    state.friends = Array.isArray(state.friends) ? state.friends : [];
    state.friendRequests = Array.isArray(state.friendRequests) ? state.friendRequests : [];

    state.player.money = Number(state.player.money || 0);
    state.player.rating = Number(state.player.rating || 0);
    state.player.name = sanitizeVisibleText(state.player.name, "Новый игрок") || "Новый игрок";
    state.auth.nickname = sanitizeVisibleText(state.auth.nickname, "");
    state.auth.journalStyle = state.auth.journalStyle === "W" ? "W" : state.auth.journalStyle === "M" ? "M" : "";
    state.auth.initError = sanitizeVisibleText(state.auth.initError, "");

    if (isPlaceholderPlayerName(state.player.name)) {
        state.player.name = "Новый игрок";
    }
    if (isPlaceholderPlayerName(state.auth.nickname)) {
        state.auth.nickname = "";
    }
    if (!state.auth.nickname || isPlaceholderPlayerName(state.player.name) || !state.player.id) {
        state.auth.registered = false;
    }

    state.ui.screen = ["home", "inventory", "friends", "shop"].includes(state.ui.screen) ? state.ui.screen : "home";
    state.ui.shopSection = ["weapon", "defense"].includes(state.ui.shopSection) ? state.ui.shopSection : "weapon";

    state.social.threads = state.social.threads.map(function (thread) {
        return Object.assign({}, thread, {
            friendName: sanitizeVisibleText(thread.friendName, "Друг"),
            status: thread.status === "online" ? "online" : "offline",
            rating: Number(thread.rating || 0),
            messages: (Array.isArray(thread.messages) ? thread.messages : []).map(function (message) {
                return Object.assign({}, message, {
                    text: sanitizeVisibleText(message.text, "Сообщение скрыто."),
                    displayName: sanitizeVisibleText(message.displayName, message.systemMessage ? "Система" : "Игрок")
                });
            })
        });
    });

    state.friends = state.friends.map(function (friend) {
        return Object.assign({}, friend, {
            name: sanitizeVisibleText(friend.name, "Игрок"),
            status: friend.status === "online" ? "online" : "offline",
            rating: Number(friend.rating || 0)
        });
    });

    state.friendRequests = state.friendRequests.map(function (request) {
        return Object.assign({}, request, {
            name: sanitizeVisibleText(request.name, "Игрок"),
            status: request.status === "online" ? "online" : "offline",
            rating: Number(request.rating || 0)
        });
    });

    state.journal = state.journal.map(function (entry) {
        const cleanText = sanitizeVisibleText(entry.text, "");
        return Object.assign({}, entry, {
            text: cleanText || "Запись дневника обновлена.",
            locationLabel: sanitizeVisibleText(entry.locationLabel, CLEAN_ZONE_LABELS[entry.location] || "Город")
        });
    }).filter(function (entry) {
        return Boolean(entry.text);
    });

    if (state.duel) {
        state.duel.autoBattleEnabled = false;
        state.duel.autoBattlePendingEnabled = null;
        state.duel.autoResolutionAt = null;
        state.duel.canSubmitAction = !state.duel.finished;
        state.duel.chatError = sanitizeVisibleText(state.duel.chatError, "");
        state.duel.resultText = sanitizeVisibleText(state.duel.resultText, "");
        state.duel.logs = (Array.isArray(state.duel.logs) ? state.duel.logs : []).map(function (entry) {
            return Object.assign({}, entry, { lines: sanitizeLogLines(entry.lines) });
        }).filter(function (entry) {
            return entry.lines.length > 0;
        });
        state.duel.chatMessages = (Array.isArray(state.duel.chatMessages) ? state.duel.chatMessages : []).map(function (message) {
            return Object.assign({}, message, {
                displayName: sanitizeVisibleText(message.displayName, message.systemMessage ? "Система" : "Игрок"),
                text: sanitizeVisibleText(message.text, message.systemMessage ? "Системное сообщение обновлено." : "Сообщение скрыто.")
            });
        });
    }
}

function refreshStaticCopy() {
    document.title = "Полюс";
    setSelectorText(".panel-kicker", "Профиль");
    setSelectorText("#screen-home .panel-title.panel-title-small", "Дневник");
    setSelectorText(".journal-zone-label", "Зона");
    setSelectorText('#bottom-nav [data-nav-target="home"] .nav-title', "Хаб");
    setSelectorText('#bottom-nav [data-nav-target="inventory"] .nav-title', "Инвентарь");
    setSelectorText('#bottom-nav [data-nav-target="friends"] .nav-title', "Друзья");
    setSelectorText('#bottom-nav [data-nav-target="shop"] .nav-title', "Магазин");
    safeSetText(document.querySelector("#screen-inventory .panel-title"), "Доступные аугментации");
    safeSetText(document.querySelector("#screen-friends .panel-title"), "Друзья");
    safeSetText(document.querySelector("#screen-shop .panel-title"), "Магазин");
    safeSetText(document.querySelector("#friend-search-form button[type='submit']"), "Добавить");
    safeSetText(document.querySelector('#shop-tabs [data-shop-section="weapon"]'), "Оружейная");
    safeSetText(document.querySelector('#shop-tabs [data-shop-section="defense"]'), "Защитная");
    safeSetText(document.querySelector(".social-chat-fab-label"), "Чаты");
    safeSetText(document.querySelector("#social-chat-panel .panel-title.panel-title-small"), "Чаты");
    safeSetText(document.querySelector("#social-chat-close"), "Закрыть");
    safeSetText(document.querySelector("#social-chat-send"), "Отправить");
    safeSetText(document.querySelector("#registration-modal .panel-title.panel-title-small"), "Регистрация игрока");
    safeSetText(document.querySelector("#registration-copy"), "Ник будет привязан к твоему Telegram ID.");
    safeSetText(document.querySelector("#registration-submit"), "Создать аккаунт");
    safeSetText(document.querySelector("#start-duel-title"), "Начать бой?");
    safeSetText(document.querySelector("#start-duel-copy"), "Подтверди, что хочешь войти в бой.");
    safeSetText(document.querySelector("#start-duel-cancel"), "Нет, вернуться в хаб");
    safeSetText(document.querySelector("#start-duel-confirm"), "Да, начать бой");
    safeSetText(document.querySelector("#duel-exit-cancel"), "Нет, остаться");
    safeSetText(document.querySelector("#duel-exit-confirm"), "Да, выйти");
    safeSetText(document.querySelector("#duel-tab-logs"), "Логи");
    safeSetText(document.querySelector("#duel-tab-chat"), "Чат");
    safeSetText(document.querySelector("#duel-clear-log-button"), "Очистить");
    safeSetText(document.querySelector("#duel-close-button"), "Выйти");
    safeSetText(document.querySelector("#find-match-button"), "Найти матч");
    safeSetText(document.querySelector("#bot-duel-button"), "Быстрая дуэль (бот)");
    safeSetText(document.querySelector(".queue-status-label"), "Поиск дуэли");
    safeSetText(document.querySelector("#queue-cancel-button"), "Отменить");
    if (elements.shopMoney) {
        elements.shopMoney.textContent = String(Number(state.player && state.player.money || 0)) + " монет";
    }
    if (elements.journalZone) {
        elements.journalZone.textContent = sanitizeVisibleText(elements.journalZone.textContent, "Город") || "Город";
    }
}

function syncPlayerFromServer(player, resetEconomy) {
    state.player.id = player.id || state.player.id || null;
    state.player.name = sanitizeVisibleText(player.nickname, "")
        || sanitizeVisibleText(player.displayName, "")
        || sanitizeVisibleText(state.auth.nickname, "")
        || "Новый игрок";
    state.player.telegramUserId = player.telegramUserId || null;
    state.player.rating = typeof player.rating === "number" ? player.rating : Number(state.player.rating || 0);
    if (resetEconomy || typeof state.player.money !== "number" || typeof player.coins === "number") {
        state.player.money = typeof player.coins === "number" ? player.coins : Number(state.player.money || 0);
    }
    state.auth.nickname = sanitizeVisibleText(player.nickname, state.auth.nickname || "");
    state.auth.journalStyle = player.journalStyle === "W" ? "W" : player.journalStyle === "M" ? "M" : (state.auth.journalStyle || "");
    state.auth.registered = Boolean(player.registered) && !isPlaceholderPlayerName(state.player.name);
}

function renderProfile() {
    const playerName = sanitizeVisibleText(state.player && state.player.name, sanitizeVisibleText(state.auth && state.auth.nickname, "Новый игрок")) || "Новый игрок";
    const playerMoney = Number(state.player && state.player.money || 0);
    const playerRating = Number(state.player && state.player.rating || 0);
    safeSetText(elements.profileName, playerName);
    safeSetText(elements.profileMoney, String(playerMoney));
    safeSetText(elements.profileRating, String(playerRating));
    if (elements.shopMoney) {
        elements.shopMoney.textContent = playerMoney + " монет";
    }
    if (elements.profileAvatar) {
        elements.profileAvatar.textContent = playerName.slice(0, 1).toUpperCase();
    }
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
    elements.queueStatusNote.textContent = sanitizeVisibleText(state.matchmaking.message, "Ищем соперника в очереди.");
    elements.queueCancelButton.disabled = false;
}

function renderJournal() {
    if (!elements.journalList) {
        return;
    }
    if (!Array.isArray(state.journal) || !state.journal.length) {
        elements.journalList.innerHTML = '<article class="journal-entry"><p>Записей пока нет.</p></article>';
        return;
    }
    elements.journalList.innerHTML = state.journal.slice(0, 20).map(function (entry) {
        const zoneLabel = sanitizeVisibleText(entry.locationLabel, CLEAN_ZONE_LABELS[entry.location] || "Город");
        const journalText = sanitizeVisibleText(entry.text, "Запись дневника обновлена.");
        return '<article class="journal-entry"><p>' + decorateText(journalText) + '</p><small>' + escapeHtml(zoneLabel + " · " + formatTimestamp(entry.createdAt || Date.now())) + '</small></article>';
    }).join("");
}

function renderRegistrationModal() {
    const auth = state.auth || {};
    const currentName = sanitizeVisibleText(state.player && state.player.name, "");
    const nickname = sanitizeVisibleText(auth.nickname, "");
    const shouldOpen = !auth.registered || !state.player.id || isPlaceholderPlayerName(currentName) || isPlaceholderPlayerName(nickname);
    elements.registrationModal.classList.toggle("hidden", !shouldOpen);
    elements.registrationModal.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
    if (!shouldOpen) {
        return;
    }
    elements.registrationCopy.textContent = auth.demoMode
        ? "Введи никнейм. Вне Telegram он сохранится только в этом браузере."
        : "Ник будет привязан к твоему Telegram ID.";
    if (!elements.registrationNickname.value && nickname) {
        elements.registrationNickname.value = nickname;
    }
    if (auth.journalStyle) {
        const savedOption = document.querySelector('input[name="registration-journal-style"][value="' + auth.journalStyle + '"]');
        if (savedOption) {
            savedOption.checked = true;
        }
    }
    if (auth.initError && !auth.demoMode) {
        showRegistrationError(auth.initError);
    } else {
        elements.registrationError.textContent = "";
        elements.registrationError.classList.add("hidden");
    }
}

async function submitRegistration() {
    const nickname = (elements.registrationNickname.value || "").trim();
    const checkedStyle = document.querySelector('input[name="registration-journal-style"]:checked');
    const journalStyle = checkedStyle ? checkedStyle.value : "";
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
    if (!journalStyle) {
        showRegistrationError("Выбери стиль дневника.");
        return;
    }

    elements.registrationSubmit.disabled = true;
    try {
        if (state.auth && state.auth.demoMode) {
            state.auth.nickname = nickname;
            state.auth.journalStyle = journalStyle;
            state.auth.registered = true;
            state.player.name = nickname;
            state.player.money = 0;
            state.player.rating = 0;
            saveState();
            renderAll();
            showToast("Аккаунт зарегистрирован.");
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
            body: JSON.stringify({ nickname: nickname, journalStyle: journalStyle })
        });
        if (!response.ok) {
            throw new Error(await readApiError(response));
        }
        const player = await response.json();
        state.auth.nickname = player.nickname || nickname;
        state.auth.journalStyle = player.journalStyle || journalStyle;
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

function renderInventory() {
    if (!elements.inventoryPlaceholder) {
        return;
    }
    const unlocked = (Array.isArray(state.inventory && state.inventory.unlockedAugments) ? state.inventory.unlockedAugments : []).filter(function (id) {
        return Boolean(getOverrideAugment(id));
    });
    if (!unlocked.length) {
        elements.inventoryPlaceholder.innerHTML = "<h3>Пока аугментаций нет</h3><p>Купленные модули будут появляться здесь и распределяться по типам.</p>";
        return;
    }
    const grouped = {
        weapon: unlocked.filter(function (id) { return getOverrideAugment(id).slot === "weapon"; }),
        defense: unlocked.filter(function (id) { return getOverrideAugment(id).slot === "defense"; })
    };
    elements.inventoryPlaceholder.innerHTML = [
        grouped.weapon.length ? '<section class="inventory-slot"><h3>Оружейная аугментация</h3>' + grouped.weapon.map(function (id) {
            const item = getOverrideAugment(id);
            return '<article class="inventory-card"><strong>' + escapeHtml(item.name) + '</strong><p>' + escapeHtml(item.description) + '</p></article>';
        }).join("") + '</section>' : "",
        grouped.defense.length ? '<section class="inventory-slot"><h3>Защитная аугментация</h3>' + grouped.defense.map(function (id) {
            const item = getOverrideAugment(id);
            return '<article class="inventory-card"><strong>' + escapeHtml(item.name) + '</strong><p>' + escapeHtml(item.description) + '</p></article>';
        }).join("") + '</section>' : ""
    ].join("");
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
            const requestName = sanitizeVisibleText(request.name, "Игрок");
            return '<article class="friend-card friend-request-card"><h3>' + escapeHtml(requestName) + '</h3><div class="friend-status-row"><span class="status-chip ' + (online ? "is-online" : "is-offline") + '">' + (online ? "Онлайн" : "Оффлайн") + '</span><span class="timer-chip">Рейтинг ' + escapeHtml(String(request.rating || 0)) + '</span></div><div class="friend-actions"><button class="primary-button full-width" type="button" data-request-accept-id="' + escapeHtml(request.id) + '">Принять</button><button class="secondary-button full-width" type="button" data-request-reject-id="' + escapeHtml(request.id) + '">Отклонить</button></div></article>';
        }).join(""),
        '</section>'
    ].join("") : "";
    elements.friendList.innerHTML = friends.length ? friends.map(function (friend) {
        const online = friend.status === "online";
        const friendName = sanitizeVisibleText(friend.name, "Игрок");
        return '<article class="friend-card"><h3>' + escapeHtml(friendName) + '</h3><div class="friend-status-row"><span class="status-chip ' + (online ? "is-online" : "is-offline") + '">' + (online ? "Онлайн" : "Оффлайн") + '</span><span class="timer-chip">Рейтинг ' + escapeHtml(String(friend.rating || 0)) + '</span></div><div class="friend-actions"><button class="secondary-button full-width" data-friend-chat-id="' + escapeHtml(friend.id) + '" type="button">Написать сообщение</button><button class="secondary-button full-width friend-action-profile" data-friend-profile-id="' + escapeHtml(friend.id) + '" type="button">Посмотреть профиль</button></div></article>';
    }).join("") : '<article class="friend-card"><p>Пока друзей нет. Найди игрока по никнейму и отправь запрос.</p></article>';
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
    document.body.classList.toggle("social-open", Boolean(state.social.isOpen));

    if (!threads.length) {
        elements.socialChatThreadList.innerHTML = '<article class="social-chat-empty">Открытые диалоги появятся здесь после первого сообщения другу.</article>';
        elements.socialChatThreadTitle.textContent = "Выбери чат";
        elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Открой чат через карточку друга.</div>';
        elements.socialChatInput.disabled = true;
        elements.socialChatSend.disabled = true;
        return;
    }

    elements.socialChatThreadList.innerHTML = threads.map(function (thread) {
        const friendName = sanitizeVisibleText(thread.friendName, "Друг");
        const statusText = thread.status === "online" ? "Онлайн" : "Оффлайн";
        return '<button class="social-chat-thread-card' + (activeThread && activeThread.id === thread.id ? " is-active" : "") + '" type="button" data-social-thread-id="' + escapeHtml(thread.id) + '"><strong>' + escapeHtml(friendName) + '</strong><span>' + escapeHtml(statusText + " · Рейтинг " + (thread.rating || 0)) + '</span></button>';
    }).join("");

    if (!activeThread) {
        elements.socialChatThreadTitle.textContent = "Выбери чат";
        elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">Открой чат через карточку друга.</div>';
        elements.socialChatInput.disabled = true;
        elements.socialChatSend.disabled = true;
        return;
    }

    elements.socialChatThreadTitle.textContent = sanitizeVisibleText(activeThread.friendName, "Друг");
    elements.socialChatMessages.innerHTML = (activeThread.messages || []).length
        ? (activeThread.messages || []).map(function (message) {
            const own = message.author === "you";
            const authorName = own ? sanitizeVisibleText(state.player.name, "Ты") : sanitizeVisibleText(activeThread.friendName, "Друг");
            const messageText = sanitizeVisibleText(message.text, "Сообщение скрыто.");
            return '<div class="social-chat-message' + (own ? " social-chat-message-own" : "") + '"><div class="social-chat-message-bubble"><strong>' + escapeHtml(authorName) + '</strong><p>' + escapeHtml(messageText) + '</p><small>' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</small></div></div>';
        }).join("")
        : '<div class="social-chat-empty">Пока сообщений нет. Напиши первым.</div>';
    elements.socialChatInput.disabled = false;
    elements.socialChatSend.disabled = false;
    elements.socialChatMessages.scrollTop = elements.socialChatMessages.scrollHeight;
}

function renderShop() {
    const activeSection = state.ui.shopSection || "weapon";
    elements.shopTabButtons.forEach(function (button) {
        button.classList.toggle("is-active", button.getAttribute("data-shop-section") === activeSection);
    });
    const items = (Array.isArray(state.shop) ? state.shop : []).filter(function (item) {
        return item.section === activeSection && getOverrideAugment(item.id);
    });
    elements.shopList.innerHTML = items.length ? '<section class="shop-section">' + items.map(function (item) {
        const copy = getOverrideAugment(item.id);
        const owned = item.kind === "augment" && hasAugment(item.augmentId);
        return '<article class="shop-card"><h3>' + escapeHtml(copy.name) + '</h3><div class="shop-price-row"><strong>' + escapeHtml(String(copy.price) + " монет") + '</strong></div><p class="shop-card-copy">' + escapeHtml(copy.description) + '</p><div class="shop-actions"><button class="primary-button" data-shop-id="' + escapeHtml(item.id) + '" type="button"' + (owned ? " disabled" : "") + '>' + (owned ? "Куплено" : "Купить") + '</button></div></article>';
    }).join("") + '</section>' : '<article class="shop-card"><p>Пока товаров в этом разделе нет.</p></article>';
}

function buildDuelStatusText(duel) {
    if (!duel) {
        return "";
    }
    if (duel.finished) {
        return sanitizeVisibleText(duel.resultText, "");
    }
    if (duel.mode === "pvp-live" && duel.yourActionSubmitted) {
        return hasPendingDuelChanges(duel)
            ? "Ты изменил выбор. Нажми «Изменить ход», чтобы обновить решение."
            : "Ход зафиксирован. Ждём соперника.";
    }
    return "";
}

function renderDuelChat(duel) {
    const isLiveChat = duel.mode === "pvp-live";
    const canWrite = isLiveChat && !duel.finished;
    const messages = duel.chatMessages || [];
    if (!messages.length) {
        elements.duelChatList.innerHTML = '<div class="duel-chat-entry"><p class="duel-chat-text">' + (isLiveChat ? "Чат пока пуст. Напиши сопернику первое сообщение." : "Чат доступен только в PvP-матче между двумя игроками.") + '</p></div>';
    } else {
        elements.duelChatList.innerHTML = messages.map(function (message) {
            const own = message.playerId && state.auth && message.playerId === state.auth.playerId;
            const systemMessage = Boolean(message.systemMessage);
            const extraClass = systemMessage ? " duel-chat-entry-system" : (own ? " duel-chat-entry-own" : "");
            const displayName = sanitizeVisibleText(message.displayName, systemMessage ? "Система" : "Игрок");
            const messageText = sanitizeVisibleText(message.text, systemMessage ? "Системное сообщение обновлено." : "Сообщение скрыто.");
            return '<div class="duel-chat-entry' + extraClass + '"><p class="duel-chat-meta">' + escapeHtml(displayName) + ' · ' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</p><p class="duel-chat-text">' + escapeHtml(messageText) + '</p></div>';
        }).join("");
    }
    elements.duelChatInput.disabled = !canWrite;
    elements.duelChatSendButton.disabled = !canWrite;
    elements.duelChatInput.placeholder = canWrite ? "Напиши сообщение сопернику" : "Чат недоступен";
    elements.duelChatError.textContent = sanitizeVisibleText(duel.chatError, "");
    elements.duelChatError.classList.toggle("hidden", !duel.chatError);
    elements.duelChatList.scrollTop = elements.duelChatList.scrollHeight;
}

function renderDuel() {
    refreshStaticCopy();
    const duel = state.duel;
    if (!duel) {
        closeDuelSilently();
        return;
    }

    duel.activePanel = duel.activePanel || "logs";
    duel.autoBattleEnabled = false;
    duel.autoBattlePendingEnabled = null;
    duel.chatMessages = Array.isArray(duel.chatMessages) ? duel.chatMessages : [];
    duel.chatError = sanitizeVisibleText(duel.chatError, "");
    duel.resultText = sanitizeVisibleText(duel.resultText, "");
    duel.logs = (Array.isArray(duel.logs) ? duel.logs : []).map(function (entry) {
        return Object.assign({}, entry, { lines: sanitizeLogLines(entry.lines) });
    }).filter(function (entry) {
        return entry.lines.length > 0;
    });

    syncDuelInputs(duel);
    renderDuelControls();
    hideAutoBattleUi();

    elements.duelTitle.textContent = "Дуэль";
    elements.duelRoundPill.textContent = "Раунд " + duel.round;
    elements.duelRoundTimer.textContent = formatDuration(getRoundTimeRemainingMs(duel));
    elements.duelYouName.textContent = sanitizeVisibleText(duel.playerName, "Игрок");
    elements.duelYouMeta.textContent = "";
    elements.duelYouAvatar.textContent = sanitizeVisibleText(duel.playerName, "И").slice(0, 1).toUpperCase();
    elements.duelOpponentName.textContent = sanitizeVisibleText(duel.opponentName, "Соперник");
    elements.duelOpponentMeta.textContent = "";
    elements.duelOpponentAvatar.textContent = sanitizeVisibleText(duel.opponentName, "С").slice(0, 1).toUpperCase();
    elements.duelYouHp.textContent = duel.playerHp + " HP";
    elements.duelOpponentHp.textContent = duel.opponentHp + " HP";
    elements.duelYouFill.style.width = Math.max(0, Math.min(100, Math.round((duel.playerHp / getPlayerMaxHp()) * 100))) + "%";
    elements.duelOpponentFill.style.width = Math.max(0, Math.min(100, Math.round((duel.opponentHp / getPlayerMaxHp()) * 100))) + "%";

    const duelStatus = buildDuelStatusText(duel);
    elements.duelRoundStatus.innerHTML = duelStatus ? decorateText(duelStatus) : "";
    elements.duelRoundStatus.classList.toggle("hidden", !duelStatus);

    const duelSelectionComplete = isDuelSelectionComplete(duel);
    const duelHasPendingChanges = hasPendingDuelChanges(duel);
    elements.duelSubmitButton.textContent = duel.finished
        ? "Бой завершен"
        : duel.yourActionSubmitted
            ? (duelHasPendingChanges ? "Изменить ход" : "Ход сделан")
            : "Сделать ход";
    elements.duelSubmitButton.disabled = duel.finished || !duelSelectionComplete || (duel.yourActionSubmitted && !duelHasPendingChanges);

    if (!duel.logs.length) {
        elements.duelLogList.innerHTML = '<div class="duel-log-round"><p class="duel-log-round-title">Логов пока нет. Первый обмен ходами появится здесь.</p></div>';
    } else {
        elements.duelLogList.innerHTML = duel.logs.slice().reverse().map(function (entry) {
            const roundNumber = typeof entry.round === "number" ? entry.round : entry.roundNumber;
            const lines = sanitizeLogLines(entry.lines);
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

function openDuelResultModal(config) {
    const inferredVictory = Number(config.rating || 0) > 0 || Number(config.money || 0) >= BATTLE_VICTORY_COINS;
    const inferredDefeat = Number(config.rating || 0) < 0 || Number(config.money || 0) === BATTLE_DEFEAT_COINS;
    const fallbackTitle = inferredVictory ? "Победа" : (inferredDefeat ? "Поражение" : "Бой завершен");
    const fallbackCopy = inferredVictory ? "Ты победил в дуэли." : inferredDefeat ? "Ты проиграл в дуэли." : "Раундов больше не осталось.";
    state.ui.duelExitConfirmOpen = false;
    state.ui.duelResult = {
        title: sanitizeVisibleText(config.title, fallbackTitle),
        copy: sanitizeVisibleText(config.copy, fallbackCopy),
        rating: Number(config.rating ?? config.experience) || 0,
        money: Number(config.money) || 0
    };
    saveState();
    renderDuelResultModal();
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
    elements.duelResultTitle.textContent = sanitizeVisibleText(result.title, "Бой завершен");
    elements.duelResultCopy.textContent = sanitizeVisibleText(result.copy, "");
    elements.duelResultExp.textContent = formatSignedReward(result.rating || 0, " рейтинга");
    elements.duelResultMoney.textContent = formatSignedReward(result.money || 0, " монет");
}

function openLiveDuelResult(payload) {
    const isVictory = payload.resultLabel === "VICTORY";
    const isDefeat = payload.resultLabel === "DEFEAT";
    openDuelResultModal({
        title: isVictory ? "Победа" : isDefeat ? "Поражение" : "Бой завершен",
        copy: isVictory ? "Ты победил в дуэли." : isDefeat ? "Ты проиграл в дуэли." : "Раундов больше не осталось.",
        rating: isVictory ? PVP_RATING_DELTA : isDefeat ? -PVP_RATING_DELTA : 0,
        money: isVictory ? BATTLE_VICTORY_COINS : isDefeat ? BATTLE_DEFEAT_COINS : 0
    });
}

function renderAll() {
    repairStateAfterLegacyLoad();
    refreshStaticCopy();
    renderScreens();
    renderProfile();
    renderHeroStats();
    renderRegistrationModal();
    renderQueueStatus();
    renderJournal();
    renderInventory();
    renderFriends();
    decorateFriendCards();
    renderSocialInbox();
    renderShop();
    renderDuel();
    renderStartDuelModal();
    renderDuelExitModal();
    renderDuelResultModal();
    bindStaticActionHandlers();
}

repairStateAfterLegacyLoad();
refreshStaticCopy();
bindStaticActionHandlers();
if (window.PolusApp) {
    window.PolusApp.navigate = navigateTo;
    window.PolusApp.startQueueDuel = startQueueDuel;
    window.PolusApp.startBotDuel = startBotDuel;
    window.PolusApp.cancelQueue = cancelQueue;
    window.PolusApp.openSocialInbox = openSocialInbox;
    window.PolusApp.closeSocialInbox = closeSocialInbox;
    window.PolusApp.submitRegistration = submitRegistration;
    window.PolusApp.submitDuelTurn = submitCurrentDuelTurn;
    window.PolusApp.setShopSection = setShopSection;
    window.PolusApp.selectDuelOption = updateDuelSelection;
    window.PolusApp.setDuelPanel = setDuelPanel;
    window.PolusApp.clearDuelLog = clearDuelLog;
    window.PolusApp.closeDuel = closeDuel;
    window.PolusApp.cancelStartDuel = cancelStartDuel;
    window.PolusApp.confirmStartDuel = confirmStartDuel;
    window.PolusApp.cancelDuelExit = cancelDuelExit;
    window.PolusApp.confirmDuelExit = confirmDuelExit;
    window.PolusApp.buy = buyShopItem;
    window.PolusApp.openFriendChat = openFriendChat;
    window.PolusApp.sendFriendRequest = submitFriendSearch;
    window.PolusApp.closeDuelResult = closeDuelResult;
    delete window.PolusApp.toggleAutoBattle;
}
})();
