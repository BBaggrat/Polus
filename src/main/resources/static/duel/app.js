(function () {
    const STORAGE_KEY = "polus_frontend_prototype_v13";
    const GUEST_ID_KEY = "polus_browser_guest_id";
    const TICK_MS = 1000;
    const FRIEND_SYNC_MS = 15000;
    const JOURNAL_EVENT_MS = 90000;
    const DUEL_ROUND_TIMEOUT_MS = 2 * 60 * 1000;
    const LEVEL_THRESHOLDS = [100, 200, 350, 500];
    const SHIELD_BLOCK_CHANCE = 0.30;
    const SHOTGUN_EDGE_GRAZE_CHANCE = 0.35;
    const SHOTGUN_EDGE_DAMAGE = 5;
    const BATTLE_REWARD_EXPERIENCE = 10;
    const BATTLE_VICTORY_COINS = 100;
    const CHAT_LINK_PATTERN = /(?:https?:\/\/|www\.|t\.me\/|telegram\.me\/|[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/|\b))/i;
    const DIRECTION_TERMS = ["по центру", "влево", "вправо"];
    const PLACEHOLDER_FRIEND_POOL = [
        { id: "mock-friend-ice-1", name: "ЛедовыйПульс", level: 3, status: "online", mock: true },
        { id: "mock-friend-ice-2", name: "ПроводникТумана", level: 2, status: "online", mock: true },
        { id: "mock-friend-ice-3", name: "СеверныйНож", level: 4, status: "online", mock: true }
    ];
    const ITEM_LIBRARY = {
        cartridges38: { id: "cartridges38", name: "Патроны .38", description: "Держатся в кармане. Теплые от ладони.", pocket: true },
        medkit: { id: "medkit", name: "Аптечка", description: "Бинты и стим. +30 HP в бою.", pocket: true, usable: true },
        brassGear: { id: "brassGear", name: "Латунная шестерня", description: "Тяжелая, зубастая, пахнет маслом." },
        relicBox: { id: "relicBox", name: "Шкатулка с гравировкой", description: "Семейная вещь из трактира. За нее много спорят." },
        iceToken: { id: "iceToken", name: "Ледяной жетон", description: "Открывает старые камеры и чужие разговоры.", pocket: true },
        scrapMap: { id: "scrapMap", name: "Мятая карта льда", description: "На полях отмечены безопасные тропы.", pocket: true }
    };
    const QUEST_SCENES = {
        familyRelic: {
            start: {
                subtitle: "Трактирщик просит вернуть запертую шкатулку",
                text: [
                    "Трактирщик из «Северного Ветра» мнет фартук и шепчет, что фамильная реликвия снова ушла не в те руки.",
                    "Если вернешь шкатулку без лишнего шума, будет награда. Если полезешь внутрь сам, риск и холод останутся с тобой."
                ],
                tags: ["долг", "холод", "слухи"],
                choices: [
                    { id: "return-box", label: "Вернуть шкатулку трактирщику", note: "Если шкатулка под рукой.", requiresItem: "relicBox", consumeItem: "relicBox", rewardMoney: 38, successText: "Успех. Трактирщик молча кивает. +38₽ и новая наводка на склад.", complete: true },
                    { id: "open-box", label: "Вскрыть шкатулку монетой", note: "Шанс 50%.", chance: 0.5, successGoto: "opened", failText: "Провал. Замок хрустит слишком громко, шум поднимается, -6₽ на отмычки.", penaltyMoney: 6 }
                ]
            },
            opened: {
                subtitle: "Внутри стучит что-то металлическое",
                text: [
                    "Крышка поддается, и из бархата выкатывается ледяной жетон. На обратной стороне выбит номер склада.",
                    "Можно забрать находку себе или все-таки отнести ее хозяину и сыграть в долгую."
                ],
                tags: ["удача", "жадность", "тихий скрип"],
                choices: [
                    { id: "keep-token", label: "Забрать жетон себе", note: "Получишь новый предмет и немного денег.", rewardMoney: 12, rewardItem: "iceToken", successText: "Находка. +12₽ и ледяной жетон уходит в карман.", complete: true },
                    { id: "bring-token", label: "Отнести находку трактирщику", note: "Меньше риска, больше доверия.", rewardMoney: 26, successText: "Успех. Трактирщик выдает +26₽ и обещает помнить услугу.", complete: true }
                ]
            }
        },
        brassDisease: {
            start: {
                subtitle: "Механик просит принести шестерню",
                text: [
                    "Механик трет пальцами латунную пыль. Его автомат щелкает и глохнет.",
                    "Принеси шестерню. Или найди, чем заменить. Тут важны предметы, риск и быстрые решения."
                ],
                tags: ["риск", "шум", "латунь"],
                choices: [
                    { id: "give-gear", label: "Отдать шестерню", note: "Если есть латунная шестерня.", requiresItem: "brassGear", consumeItem: "brassGear", rewardMoney: 27, successText: "Успех. Автомат оживает, а мастерская платит +27₽.", complete: true },
                    { id: "coin-fix", label: "Попробовать «колхоз» из монеты", note: "Шанс 50%.", chance: 0.5, successGoto: "jury-rigged", failText: "Провал. Искра режет пальцы, механизм плюется, -8₽ на бинты.", penaltyMoney: 8 }
                ]
            },
            "jury-rigged": {
                subtitle: "Монета держит зубцы на честном слове",
                text: [
                    "Самодельная вставка неожиданно цепляет вал. Машина кашляет, но заводится.",
                    "Механик может оставить тебя в долгу или отсыпать мелочи сразу."
                ],
                tags: ["удача", "грязная работа", "теплый металл"],
                choices: [
                    { id: "take-cash", label: "Взять оплату сразу", note: "Небольшая, но быстрая награда.", rewardMoney: 18, successText: "Находка в ладони: +18₽ за быстрый ремонт.", complete: true },
                    { id: "ask-favor", label: "Попросить услугу позже", note: "Мастерская отдает карту льда.", rewardItem: "scrapMap", successText: "Успех. Вместо денег ты получаешь мятую карту льда.", complete: true }
                ]
            }
        },
        signalE3: {
            start: {
                subtitle: "На льду мигает старый маяк",
                text: [
                    "Сигнал E3 прорывается через ветер короткими рывками. Где-то впереди лежит контейнер или чья-то ловушка.",
                    "Можно идти прямо на шум или приглушить шаг аптечкой и сделать вид, что все под контролем."
                ],
                tags: ["холод", "риск", "шанс"],
                choices: [
                    { id: "go-straight", label: "Идти на слабый сигнал", note: "Шанс 65%.", chance: 0.65, successText: "Находка. Под снегом контейнер. Успех и +34₽.", failText: "Провал. Сигнал уводит в пустой карман льда, -5₽ на дорогу обратно.", rewardMoney: 34, penaltyMoney: 5, complete: true },
                    { id: "dash-gap", label: "Рвануть через открытый лёд", note: "Нужна реакция 1.", requiresStat: "reaction", requiresStatValue: 1, rewardMoney: 16, successText: "Реакция спасает темп. Ты успеваешь к ящику и забираешь +16₽.", complete: true },
                    { id: "quiet-steps", label: "Подавить шум аптечкой", note: "Если аптечка под рукой.", requiresItem: "medkit", consumeItem: "medkit", successGoto: "quiet-route" }
                ]
            },
            "quiet-route": {
                subtitle: "Снег ведет к старому кабелю",
                text: [
                    "Стим греет ребра, шаг становится ровнее. Под коркой льда виден кабель, уходящий к служебному люку.",
                    "Люк можно вскрыть самому или просто снять показания и уйти без шума."
                ],
                tags: ["удача", "тишина", "ледяной пар"],
                choices: [
                    { id: "open-hatch", label: "Вскрыть люк", note: "Получишь карту и деньги.", rewardMoney: 20, rewardItem: "scrapMap", successText: "Успех. Внутри карта льда и +20₽ за старые жетоны.", complete: true },
                    { id: "leave-mark", label: "Снять показания и уйти", note: "Чуть меньше награды, меньше шума.", rewardMoney: 14, successText: "Спокойная находка. +14₽ и почти никакого шума.", complete: true }
                ]
            }
        },
        frostDebt: {
            start: {
                subtitle: "На двери склада висит свежая метка",
                text: [
                    "Кто-то оставил на двери склада ржавый гвоздь с запиской: «Если слышишь скрип, ты уже опоздал».",
                    "Можно сунуться внутрь сразу или переждать, пока ветер съест следы."
                ],
                tags: ["слухи", "мороз", "неуверенность"],
                choices: [
                    { id: "rush-in", label: "Зайти сразу", note: "Шанс 45%.", chance: 0.45, rewardMoney: 29, failText: "Провал. Внутри пусто, а долг только растет. -7₽.", penaltyMoney: 7, successText: "Успех. В углу лежит чужой тайник. +29₽.", complete: true },
                    { id: "break-door", label: "Выломать дверь силой", note: "Нужна сила 1.", requiresStat: "strength", requiresStatValue: 1, rewardMoney: 24, successText: "Сила решает вопрос быстро. Дверь сдаётся, а в тайнике лежат +24₽.", complete: true },
                    { id: "find-key", label: "Осмотреть метку и найти ключ", note: "Нужен анализ 1.", requiresStat: "analysis", requiresStatValue: 1, rewardItem: "iceToken", successText: "Анализ цепляет мелочь на косяке. Спрятанный ключ ведет к жетону.", complete: true },
                    { id: "wait-out", label: "Переждать ветер", note: "Безопаснее, но медленнее.", rewardMoney: 11, successText: "Спокойный ход. Ветер уносит шум, и ты забираешь +11₽.", complete: true }
                ]
            }
        }
    };
    const DUEL_WEAPONS = {
        PISTOLS: { label: "Пистоль и щит", damage: 18, blockChance: 0.30 },
        RIFLE: { label: "Винтовка", damage: 30, blockChance: 0 },
        SHOTGUN: { label: "Дробовик", damage: 25, blockChance: 0 }
    };
    const AUGMENT_SLOTS = [
        { id: "weapon", title: "Оружейная", hint: "Даёт бонус к точности или урону." },
        { id: "defense", title: "Защитная", hint: "Снижает входящий урон и усиливает выживание." },
        { id: "support", title: "Вспомогательная", hint: "Даёт уворот, реген или тактический бонус." }
    ];
    const AUGMENT_LIBRARY = {
        weaponBrassSights: {
            id: "weaponBrassSights",
            slot: "weapon",
            name: "Латунный прицел",
            description: "Теплая мушка не гуляет на морозе и держит линию ровнее.",
            effectLabel: "-8% к шансу блока щитом",
            hitChanceBonus: 0.08,
            weapons: ["PISTOLS", "RIFLE"]
        },
        weaponDoubleTap: {
            id: "weaponDoubleTap",
            slot: "weapon",
            name: "Усиленный ударник",
            description: "Плотный удар делает пистоль злее в прямой линии.",
            effectLabel: "+4 урона для пистоля",
            damageBonus: 4,
            weapons: ["PISTOLS"]
        },
        weaponPiercingCore: {
            id: "weaponPiercingCore",
            slot: "weapon",
            name: "Бронебойный сердечник",
            description: "Прошивает щитовой блок и давит линию напролом.",
            effectLabel: "Игнорирует блокирование щитом",
            ignoreBlocking: true,
            weapons: ["PISTOLS", "RIFLE", "SHOTGUN"]
        },
        weaponScatterNozzle: {
            id: "weaponScatterNozzle",
            slot: "weapon",
            name: "Расширитель дроби",
            description: "Дробовик цепляет по краю чаще, особенно на ближней линии.",
            effectLabel: "+12% к шансу зацепа дробовика",
            grazeChanceBonus: 0.12,
            weapons: ["SHOTGUN"]
        },
        defensePlating: {
            id: "defensePlating",
            slot: "defense",
            name: "Латунные пластины",
            description: "Ставка на массу: броня гасит часть прямого попадания.",
            effectLabel: "-4 входящего урона",
            damageReduction: 4
        },
        defenseHeatSink: {
            id: "defenseHeatSink",
            slot: "defense",
            name: "Теплоотвод",
            description: "Переносит жар под куртку и даёт держать длинный бой.",
            effectLabel: "+10 стартового HP",
            startHpBonus: 10
        },
        defenseColdMesh: {
            id: "defenseColdMesh",
            slot: "defense",
            name: "Хладостойкая сетка",
            description: "Упругая прослойка съедает скользящие попадания и мелкие осколки.",
            effectLabel: "-2 урона даже от зацепа",
            damageReduction: 2,
            grazeReduction: 2
        },
        supportSidestep: {
            id: "supportSidestep",
            slot: "support",
            name: "Сервопривод уворота",
            description: "Пружина под коленом иногда срывает уже пойманную линию.",
            effectLabel: "10% шанс сорвать прямое попадание",
            evadeChance: 0.1
        },
        supportStimLoop: {
            id: "supportStimLoop",
            slot: "support",
            name: "Стим-контур",
            description: "Замкнутый впрыск возвращает дыхание после каждого раунда.",
            effectLabel: "+4 HP после каждого раунда",
            regenPerRound: 4
        },
        supportTargetLink: {
            id: "supportTargetLink",
            slot: "support",
            name: "Связка меток",
            description: "Центральная линия читается быстрее, если довериться датчикам.",
            effectLabel: "-4% к блоку по центру",
            centerHitBonus: 0.04
        }
    };
    const POSITIVE_MARKERS = [/\+\d+\sмонет/gi, /\+\d+\sHP/gi];
    const NEGATIVE_MARKERS = [/-\d+\sмонет/gi, /промах/gi, /провал/gi, /поражени[ея]/gi, /не хватает/gi, /ист[её]к/gi, /потер[яи]/gi, /зам[её]рз/gi, /ран[ае]н/gi, /шум/gi, /сорван/gi, /пусто/gi];
    const elements = {};
    let state = hydrateState(loadState());
    let toastTimer = null;
    let liveSyncPending = false;
    let friendSyncPending = false;
    const RUBLE_SIGN = "\u20BD";
    const DUEL_DEFAULT_NOTE = "Правило: попадание проходит, если линия выстрела совпала с линией уворота соперника.";

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
                toast.textContent = "Ошибка инициализации интерфейса. Обнови Mini App.";
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
            setDuelPanel: setDuelPanel,
            duelFriend: function (friendId) {
                const friend = getFriendById(friendId);
                if (friend) {
                    requestStartDuel({
                        mode: "friend",
                        title: "Вызов на дуэль",
                        copy: "Подтверди, что хочешь вызвать " + friend.name + " на бой. Пока это запускает общий поиск соперника.",
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
                    initError: error && error.message ? error.message : "Не удалось создать сессию"
                });
                state.player.name = "Новый игрок";
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
                firstName: "Гость",
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
            throw new Error("Пустой ответ сессии");
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
        state.player.name = player.nickname || player.displayName || state.player.name || "Новый игрок";
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
            initError: error && error.message ? error.message : "Не удалось создать сессию"
        });
        state.player.name = "Новый игрок";
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
                addJournal("Ник \"" + nickname + "\" сохранен в локальном режиме.");
                saveState();
                renderAll();
                showToast("Ник сохранен.");
                return;
            }
            if (!state.auth || !state.auth.sessionToken) {
                throw new Error("Открой Mini App через Telegram, чтобы закрепить ник.");
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
            addJournal("Аккаунт зарегистрирован под ником \"" + (player.nickname || nickname) + "\".");
            saveState();
            renderAll();
            showToast("Аккаунт зарегистрирован.");
        } catch (error) {
            showRegistrationError(error && error.message ? error.message : "Не удалось зарегистрировать аккаунт.");
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
            return payload && payload.message ? payload.message : "Ошибка запроса";
        } catch (error) {
            return "Ошибка запроса";
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
            title: "Найденный матч",
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
                return "Победа. Соперник сломал темп.";
            }
            if (payload.resultLabel === "DEFEAT") {
                return "Поражение. Придется собираться заново.";
            }
            return "Ничья. Обоих унесло в ледяную тишину.";
        }
        if (payload.yourActionSubmitted && !payload.opponentActionSubmitted) {
            return "Ход зафиксирован. Ждем ответ соперника.";
        }
        if (payload.yourActionSubmitted && payload.opponentActionSubmitted) {
            return "Оба хода заперты. Раунд сейчас раскроется.";
        }
        return "Выбери ход на раунд.";
    }

    function openLiveDuelResult(payload) {
        const isVictory = payload.resultLabel === "VICTORY";
        const isDefeat = payload.resultLabel === "DEFEAT";
        const winnerName = isVictory
            ? (payload.you && payload.you.displayName ? payload.you.displayName : state.player.name)
            : (payload.opponent && payload.opponent.displayName ? payload.opponent.displayName : "Соперник");
        const rewardMoney = isVictory ? BATTLE_VICTORY_COINS : 0;
        const rewardExperience = BATTLE_REWARD_EXPERIENCE;

        if (isVictory) {
            addJournal("Победа в PvP. +100 монет и +10 опыта.");
        } else if (isDefeat) {
            addJournal("Поражение в PvP. На этот раз без награды.");
        } else {
            addJournal("Матч завершился ничьей.");
        }

        openDuelResultModal({
            title: isVictory ? "Ты победил" : (isDefeat ? "Ты проиграл" : "Ничья"),
            copy: isVictory
                ? "Побежден " + (payload.opponent && payload.opponent.displayName ? payload.opponent.displayName : "соперник") + "."
                : (isDefeat ? "Победил " + winnerName + "." : "Оба бойца удержали линию до конца."),
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
        if (!state.world || !state.world.lastJournalEventAt) {
            state.world = state.world || {};
            state.world.lastJournalEventAt = Date.now();
        }
        if (hasActiveBattle()) {
            state.world.lastJournalEventAt = Date.now();
            return;
        }
        if (Date.now() - state.world.lastJournalEventAt < JOURNAL_EVENT_MS) {
            return;
        }
        triggerRandomJournalEvent(true);
    }

    function onTick() {
        triggerScheduledJournalEvent();
        syncRemotePvp();
        syncFriendsIfNeeded();
        syncLocalDuelState();
        expireQuestsIfNeeded();
        renderQueueStatus();
        renderQuestCounters();
        if (state.ui.screen === "home") {
            renderJournal();
        }
        if (state.ui.screen === "quests") {
            renderQuestList();
        }
        if (state.ui.screen === "quest-detail") {
            renderQuestDetail();
        }
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

        if (target.id === "quest-teaser") {
            navigateTo("quests");
            return;
        }

        if (target.id === "quest-back-button") {
            navigateTo("quests");
            return;
        }

        if (target.id === "find-match-button") {
            return;
        }

        if (target.id === "bot-duel-button") {
            return;
        }

        if (target.id === "journal-event-button") {
            triggerRandomJournalEvent();
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

        if (target.hasAttribute("data-quest-id") && target.hasAttribute("data-choice-id")) {
            executeQuestChoice(target.getAttribute("data-quest-id"), target.getAttribute("data-choice-id"));
            return;
        }

        if (target.getAttribute("data-action") === "open" && target.hasAttribute("data-quest-id")) {
            openQuest(target.getAttribute("data-quest-id"));
            return;
        }

        if (target.getAttribute("data-action") === "delay" && target.hasAttribute("data-quest-id")) {
            delayQuest(target.getAttribute("data-quest-id"));
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
                    title: "Вызвать друга на дуэль?",
                    copy: "Подтверди, что хочешь вызвать " + friend.name + ". Пока прямой вызов ведет в общий PvP-поиск.",
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
            showToast("Сначала выбери оружие, выстрел и уворот.");
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
            showToast("Этот квест уже недоступен.");
            return;
        }
        if (quest.status === "new") {
            quest.status = "inProgress";
            addJournal("Квест \"" + quest.title + "\" перешел в режим Продолжить.");
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
        addJournal("Квест \"" + quest.title + "\" отложен. Таймер слегка отступил.");
        showToast("Таймер квеста сдвинут на 15 минут.");
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
            const warning = "Не хватает предмета: " + missingName + ".";
            addJournal(warning);
            showToast(warning);
            renderAll();
            return;
        }
        if (choice.requiresStat && !meetsChoiceStat(choice)) {
            const warning = "Не хватает характеристики: " + getStatLabel(choice.requiresStat) + " " + choice.requiresStatValue + ".";
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
            addJournal(choice.failText || "Провал.");
            showToast(choice.failText || "Провал.");
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
        addJournal(choice.successText || "Успех.");
        showToast(choice.successText || "Успех.");
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
            showToast("Этот предмет лучше поберечь для истории.");
            return;
        }
        if (!hasItem("medkit")) {
            showToast("Не хватает предмета: Аптечка.");
            return;
        }
        consumeItem("medkit", 1);
        addJournal("Аптечка использована. Холод отступает, руки снова слушаются.");
        showToast("Аптечка использована.");
        saveState();
        renderAll();
    }

    function buyShopItem(shopId) {
        const item = state.shop.find(function (entry) { return entry.id === shopId; });
        if (!item) {
            return;
        }
        if (item.section === "premium") {
            showToast("Премиальный раздел временно в работе.");
            return;
        }

        if (state.player.money < item.price) {
            const warning = "Не хватает монет: -" + item.price + " сейчас не потянуть.";
            addJournal(warning);
            showToast(warning);
            renderAll();
            return;
        }

        state.player.money -= item.price;
        addItem(item.itemId, 1);
        addJournal('Куплен предмет "' + item.name + '". -' + item.price + " монет.");
        showToast("Куплено: " + item.name + ".");
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
                title: "Начать тренировочную дуэль?",
                copy: "Подтверди, что хочешь сразу войти в бой с тренировочным соперником.",
                execute: function () {
                    startBotDuel(true);
                }
            });
            return;
        }
        openDuel({ mode: "bot", title: "Тренировочная дуэль", modeLabel: "Бот", opponentName: "Тренировщик", opponentWeapon: "RIFLE" });
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
                copy: "Подтверди, что хочешь встать в очередь. Случайные нажатия тоже отправляют тебя в поиск.",
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
            showToast("Вне Telegram доступна локальная дуэль.");
            openDuel({ mode: "pvp", title: "Найденный матч", modeLabel: "PvP", opponentName: randomFrom(["Рейдер с перевала", "Контрабандист у проводов", "Молчаливый стрелок", "Часовой из белой пыли"]), opponentWeapon: randomFrom(["PISTOLS", "RIFLE", "SHOTGUN"]) });
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
            showToast("Поиск дуэли отменён.");
            return;
        }
        if (elements.queueCancelButton) {
            elements.queueCancelButton.disabled = true;
        }
        try {
            const response = await apiFetch("/api/matchmaking/cancel", { method: "POST" });
            applyMatchmakingStatus(await response.json());
            renderAll();
            showToast("Поиск дуэли отменён.");
        } catch (error) {
            showToast(error && error.message ? error.message : "Не удалось отменить поиск.");
        } finally {
            if (elements.queueCancelButton) {
                elements.queueCancelButton.disabled = false;
            }
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

    function openDuel(config) {
        if (state.auth && !state.auth.registered) {
            showToast("Сначала зарегистрируй аккаунт.");
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
            resultText: "Собери ход на раунд.",
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
            showToast("Этот раунд уже ведет автоматический бой.");
            return;
        }
        if (!state.duel.canSubmitAction) {
            showToast("Сейчас ход недоступен.");
            return;
        }
        if (!isDuelSelectionComplete(state.duel)) {
            showToast("Сначала выбери оружие, выстрел и уворот.");
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
            showToast(state.duel && state.duel.yourActionSubmitted ? "Ход принят." : "Раунд обновлен.");
        } catch (error) {
            showToast(error && error.message ? error.message : "Не удалось отправить ход.");
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
                    ? "Изменение автоматического боя отменено."
                    : (nextPending ? "Автобой включится со следующего раунда." : "Автобой отключится со следующего раунда."));
            } catch (error) {
                showToast(error && error.message ? error.message : "Не удалось переключить автоматический бой.");
            } finally {
                elements.duelAutoToggle.disabled = false;
            }
            return;
        }
        duel.autoBattlePendingEnabled = nextPending;
        saveState();
        renderDuel();
        showToast(nextPending === null
            ? "Изменение автоматического боя отменено."
            : (nextPending ? "Автобой включится со следующего раунда." : "Автобой отключится со следующего раунда."));
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
                    ? "С этого раунда ходы игрока " + (duel.playerName || "Игрок") + " будут автоматическими."
                    : "С этого раунда автоматические ходы игрока " + (duel.playerName || "Игрок") + " отключены."
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
        duel.resultText = duel.autoBattleEnabled ? "Этот раунд пройдет автоматически." : "Собери ход на раунд.";
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
        const playerName = duel.playerName || "Игрок";
        const opponentName = duel.opponentName || "Противник";
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
            duel.resultText = "Ничья. Оба остаются на линии.";
            addJournal("Ничья в бою. Обе стороны выдыхают и расходятся по снегу.");
            openDuelResultModal({
                title: "Ничья",
                copy: "Никто не смог дожать раунд до победы.",
                experience: BATTLE_REWARD_EXPERIENCE,
                money: 0
            });
        } else if (duel.opponentHp === 0) {
            duel.finished = true;
            duel.resultText = "Победа. Противник падает в снег.";
            state.player.wins += 1;
            const rewardMoney = BATTLE_VICTORY_COINS;
            const rewardExperience = BATTLE_REWARD_EXPERIENCE;
            state.player.money += rewardMoney;
            applyLocalExperienceGain(rewardExperience);
            addJournal("Победа в бою. +" + rewardMoney + " монет и +" + rewardExperience + " опыта.");
            openDuelResultModal({
                title: "Ты победил",
                copy: "Побежден " + opponentName + ".",
                experience: rewardExperience,
                money: rewardMoney
            });
        } else if (duel.playerHp === 0) {
            duel.finished = true;
            duel.resultText = "Поражение. Приходится отступать в темноту.";
            state.player.losses += 1;
            applyLocalExperienceGain(BATTLE_REWARD_EXPERIENCE);
            addJournal("Поражение в бою. Придется перегруппироваться и вернуться позже.");
            openDuelResultModal({
                title: "Ты проиграл",
                copy: "Победил " + opponentName + ".",
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
            lines.push(attackerName + " уводит выстрел мимо линии.");
            return { damage: 0, lines: lines };
        }
        if (lineMatched && shouldSupportEvade(attackerSide === "player" ? "opponent" : "player")) {
            lines.push(defenderName + " уходит от урона.");
            return { damage: 0, lines: lines };
        }
        if (attackerAction.weapon === "PISTOLS") {
            if (projectileBlocked(attackerSide, defenderAction.weapon, attackerAction.weapon, attackerAction.shot)) {
                lines.push(defenderName + " закрывается щитом и блокирует пулю.");
                return { damage: 0, lines: lines };
            }
            let damage = 18 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
            damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, false, lines, attackerSide === "player" ? "соперник" : "ты");
            lines.push(attackerName + " попадает из пистоля и наносит " + damage + " урона.");
            return { damage: damage, lines: lines };
        }
        if (attackerAction.weapon === "RIFLE") {
            let damage = 30 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
            damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, false, lines, attackerSide === "player" ? "соперник" : "ты");
            lines.push(attackerName + " попадает из винтовки и срезает щитовой блок.");
            return { damage: damage, lines: lines };
        }
        let pelletsHit = 0;
        let pelletsBlocked = 0;
        if (!lineMatched) {
            if (Math.random() < SHOTGUN_EDGE_GRAZE_CHANCE + getWeaponGrazeBonus(attackerSide, attackerAction.weapon)) {
                let edgeDamage = SHOTGUN_EDGE_DAMAGE + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
                edgeDamage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", edgeDamage, true, lines, attackerSide === "player" ? "соперник" : "ты");
                lines.push(attackerName + " цепляет краем и наносит " + edgeDamage + " урона.");
                return { damage: edgeDamage, lines: lines };
            }
            lines.push(attackerName + " не цепляет цель дробью.");
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
            lines.push(defenderName + " полностью перекрывает дробь щитом.");
            return { damage: 0, lines: lines };
        }
        let damage = pelletsHit * 5 + getWeaponDamageBonus(attackerSide, attackerAction.weapon);
        damage = applyDefenseReduction(attackerSide === "player" ? "opponent" : "player", damage, pelletsHit < 3, lines, attackerSide === "player" ? "соперник" : "ты");
        let summary = attackerName + " попадает " + pelletsHit + " дробинами и наносит " + damage + " урона.";
        if (pelletsBlocked) {
            summary += " Щит снимает " + pelletsBlocked + " дробин.";
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
        if (defenderWeapon !== "PISTOLS" || ignoresBlocking(attackerSide)) {
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
        return 0;
    }

    function applyDefenseReduction(side, damage, isGraze, lines, defenderName) {
        return damage;
    }

    function getPlayerMaxHp() {
        return 100;
    }

    function triggerRandomJournalEvent(isAutomatic) {
        if (hasActiveBattle()) {
            if (!isAutomatic) {
                showToast("Во время боя дневник молчит.");
            }
            return;
        }
        const events = [
            { text: "На проводах висит новый слух. Успех для внимательных: +6₽ за подсказку.", money: 6 },
            { text: "Слишком сильный ветер. Провал для спешащих: -4₽ на топливо.", money: -4 },
            { text: "В проулке найден тайник. Находка приносит +1 аптечку.", itemId: "medkit" },
            { text: "Лавочник ворчит, но уступает коробку патронов. Получена находка.", itemId: "cartridges38" },
            { text: "Старый технарь возвращает долг. +9₽ падают в ладонь.", money: 9 },
            { text: "На морозе лопается ремень, -3₽ уходят на починку.", money: -3 },
            { text: "Под снегом находится ледяной жетон. Находка уходит в карман.", itemId: "iceToken" },
            { text: "Сигнальный ящик открыт. Внутри мятая карта льда.", itemId: "scrapMap" },
            { text: "Схрон у проводов приносит +1 латунную шестерню.", itemId: "brassGear" },
            { text: "Тихий обмен у лавки добавляет +5₽ без лишних вопросов.", money: 5 },
            { text: "Ночной холод добирается до запасов, -2₽ уходят на керосин.", money: -2 },
            { text: "Новый слух ведет к истории «Снеговой долг».", addQuest: "frostDebt" },
            { text: "Северный коридор снова мигает. Получен квест «Сигнал E3».", addQuest: "signalE3" },
            { text: "Мастерская зовет обратно. Получен квест «Латунная болезнь».", addQuest: "brassDisease" },
            { text: "Трактирщик оставляет записку. Получен квест «Семейная реликвия».", addQuest: "familyRelic" },
            { text: "Под слоем инея находится +1 аптечка и короткая передышка.", itemId: "medkit" },
            { text: "Короткий рейд приносит +7₽ и пачку новостей.", money: 7 }
        ];
        const questPool = ["familyRelic", "brassDisease", "signalE3", "frostDebt"];
        const eligibleEvents = events.filter(function (event) {
            if (!event.addQuest) {
                return true;
            }
            return getActiveQuests().length < 4 && !state.quests.some(function (quest) {
                return quest.storyId === event.addQuest && (quest.status === "new" || quest.status === "inProgress");
            });
        });
        const event = randomFrom(eligibleEvents.length ? eligibleEvents : events.filter(function (entry) { return !entry.addQuest; }));
        if (typeof event.money === "number") {
            state.player.money = Math.max(0, state.player.money + event.money);
        }
        if (event.itemId) {
            addItem(event.itemId, 1);
        }
        if (event.addQuest) {
            state.quests.push(buildQuest(event.addQuest, 6 * 60 * 60 * 1000));
            const missingQuest = questPool.find(function (storyId) {
                return !state.quests.some(function (quest) {
                    return quest.storyId === storyId && (quest.status === "new" || quest.status === "inProgress");
                });
            });
            if (missingQuest && Math.random() < 0.18) {
                state.quests.push(buildQuest(missingQuest, 6 * 60 * 60 * 1000));
            }
        }
        state.world.lastJournalEventAt = Date.now();
        addJournal(event.text);
        if (!isAutomatic) {
            showToast("Дневник обновлен.");
        }
        saveState();
        renderAll();
    }

    function expireQuestsIfNeeded() {
        let changed = false;
        state.quests.forEach(function (quest) {
            if ((quest.status === "new" || quest.status === "inProgress") && quest.expiresAt <= Date.now()) {
                quest.status = "expired";
                addJournal("Квест \"" + quest.title + "\" истек. Мороз оказался быстрее.");
                if (state.ui.activeQuestId === quest.id) {
                    state.ui.activeQuestId = null;
                    state.ui.screen = "quests";
                }
                changed = true;
            }
        });
        if (changed) {
            saveState();
            renderAll();
        }
    }

    function renderAll() {
        renderScreens();
        renderProfile();
        renderHeroStats();
        renderRegistrationModal();
        renderQueueStatus();
        renderQuestCounters();
        renderJournal();
        renderQuestList();
        renderQuestDetail();
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
        elements.shopMoney.textContent = state.player.money + " монет";
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
        elements.queueStatusNote.textContent = state.matchmaking.message || "Ждём соперника в очереди.";
        elements.queueCancelButton.disabled = false;
    }

    function renderHeroStats() {
        const stats = [
            { id: "strength", label: "Сила", value: state.player.strength || 0, hint: "Ломает преграды и продавливает сцены." },
            { id: "reaction", label: "Реакция", value: state.player.reaction || 0, hint: "Помогает быстро читать угрозу и темп." },
            { id: "analysis", label: "Анализ", value: state.player.analysis || 0, hint: "Открывает внимательные и хитрые решения." }
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
                "</div>",
                available > 0 ? '<button class="hero-stat-button" type="button" data-stat="' + escapeHtml(stat.id) + '">+1</button>' : "",
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
            ? "Введи никнейм. Вне Telegram он сохранится только в этом браузере."
            : "Введи никнейм. Аккаунт будет закреплен за твоим Telegram ID.";
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
        const label = String(Math.min(9, getActiveQuests().length));
        elements.questBadge.textContent = label;
        elements.questCounter.textContent = label;
    }

    function renderJournal() {
        if (!state.journal.length) {
            elements.journalList.innerHTML = "";
            return;
        }
        elements.journalList.innerHTML = state.journal.slice(0, 6).map(function (entry) {
            return '<article class="journal-entry"><p>' + decorateText(entry.text) + '</p><small>' + escapeHtml(formatTimestamp(entry.createdAt)) + "</small></article>";
        }).join("");
    }

    function renderQuestList() {
        const quests = getActiveQuests();
        if (!quests.length) {
            elements.questList.innerHTML = '<article class="quest-card"><p>Активных квестов нет. Дневник скоро подбросит новую наводку.</p></article>';
            return;
        }
        elements.questList.innerHTML = quests.map(function (quest) {
            return [
                '<article class="quest-card">',
                "<h3>" + escapeHtml(quest.title) + "</h3>",
                "<p>" + escapeHtml(quest.description) + "</p>",
                '<div class="quest-chip-row"><span class="chip">' + escapeHtml(quest.location) + '</span><span class="timer-chip">' + escapeHtml(formatDuration(quest.expiresAt - Date.now())) + "</span></div>",
                '<div class="quest-actions"><button class="primary-button" data-action="open" data-quest-id="' + escapeHtml(quest.id) + '" type="button" onclick="window.PolusApp && window.PolusApp.openQuest(\'' + escapeJs(quest.id) + '\')">' + (quest.status === "inProgress" ? "Продолжить" : "Выполнить") + '</button><button class="secondary-button" data-action="delay" data-quest-id="' + escapeHtml(quest.id) + '" type="button" onclick="window.PolusApp && window.PolusApp.delayQuest(\'' + escapeJs(quest.id) + '\')">Отложить</button></div>',
                "</article>"
            ].join("");
        }).join("");
    }

    function renderQuestDetail() {
        const quest = getQuest(state.ui.activeQuestId);
        if (!quest) {
            elements.questDetailTitle.textContent = "Текстовый квест";
            elements.questDetailSubtitle.textContent = "Выбери историю из списка";
            elements.questStoryText.innerHTML = "<p>Открой квест, чтобы увидеть сцену, выборы и карманный инвентарь.</p>";
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
                ? '<span class="text-negative">Не хватает предмета.</span>'
                : missingStat
                    ? '<span class="text-negative">Нужно: ' + escapeHtml(getStatLabel(choice.requiresStat)) + " " + escapeHtml(String(choice.requiresStatValue)) + ".</span>"
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
            elements.inventoryPlaceholder.innerHTML = "<h3>Раздел в переработке</h3><p>Инвентарь и аугментации временно скрыты до следующей версии.</p>";
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
                    "<h3>" + escapeHtml(request.name) + "</h3>",
                    '<div class="friend-status-row"><span class="status-chip ' + (online ? "is-online" : "is-offline") + '">' + (online ? "Онлайн" : "Оффлайн") + '</span><span class="timer-chip">Уровень ' + escapeHtml(String(request.level)) + "</span></div>",
                    '<div class="friend-actions">',
                    '<button class="primary-button full-width" type="button" data-request-accept-id="' + escapeHtml(request.id) + '">Принять</button>',
                    '<button class="secondary-button full-width" type="button" data-request-reject-id="' + escapeHtml(request.id) + '">Отклонить</button>',
                    "</div>",
                    "</article>"
                ].join("");
            }).join(""),
            "</section>"
        ].join("") : "";
        elements.friendList.innerHTML = friends.length ? friends.map(function (friend) {
            const online = friend.status === "online";
            return [
                '<article class="friend-card">',
                "<h3>" + escapeHtml(friend.name) + "</h3>",
                '<div class="friend-status-row"><span class="status-chip ' + (online ? "is-online" : "is-offline") + '">' + (online ? "Онлайн" : "Оффлайн") + '</span><span class="timer-chip">Уровень ' + escapeHtml(String(friend.level)) + "</span></div>",
                '<div class="friend-actions">',
                '<button class="primary-button full-width" data-friend-id="' + escapeHtml(friend.id) + '" type="button"' + (online ? "" : " disabled") + '>Вызвать на дуэль</button>',
                '<button class="secondary-button full-width" data-friend-profile-id="' + escapeHtml(friend.id) + '" type="button">Посмотреть профиль</button>',
                "</div>",
                "</article>"
            ].join("");
        }).join("") : '<article class="friend-card"><p>Пока никого нет в друзьях. Найди игрока по никнейму и отправь запрос.</p></article>';
    }

    function decorateFriendCards() {
        if (!elements.friendList) {
            return;
        }
        elements.friendList.querySelectorAll("[data-friend-profile-id]").forEach(function (button) {
            button.classList.add("friend-action-profile");
            const actions = button.closest(".friend-actions");
            if (!actions || actions.querySelector("[data-friend-chat-id]")) {
                return;
            }
            const friendId = button.getAttribute("data-friend-profile-id");
            const chatButton = document.createElement("button");
            chatButton.type = "button";
            chatButton.className = "secondary-button full-width";
            chatButton.setAttribute("data-friend-chat-id", friendId);
            chatButton.textContent = "Р§Р°С‚";
            button.before(chatButton);
        });
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
            id: uid("social-thread"),
            friendId: friend.id,
            friendName: friend.name,
            level: friend.level,
            status: friend.status,
            messages: [
                {
                    id: uid("social-message"),
                    author: "friend",
                    text: "РљР°РЅР°Р» РѕС‚РєСЂС‹С‚. РњРѕР¶РµРј СЃРІРµСЂРёС‚СЊ РїР»Р°РЅС‹ РёР»Рё РѕР±СЃСѓРґРёС‚СЊ РґСѓСЌР»СЊ.",
                    createdAt: Date.now()
                }
            ]
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
            id: uid("social-message"),
            author: "you",
            text: text,
            createdAt: Date.now()
        });
        elements.socialChatInput.value = "";
        const friend = getFriendById(activeThread.friendId);
        if (friend && friend.mock) {
            activeThread.messages.push({
                id: uid("social-message"),
                author: "friend",
                text: randomFrom([
                    "РџРѕРЅСЏР», РґРµСЂР¶Сѓ СЃРІСЏР·СЊ.",
                    "Р’РёР¶Сѓ. Р•СЃР»Рё С‡С‚Рѕ, Р±СЂРѕСЃСЊ РІС‹Р·РѕРІ.",
                    "РџСЂРёРЅСЏС‚Рѕ. Р‘СѓРґСѓ РЅР° Р»РёРЅРёРё."
                ]),
                createdAt: Date.now() + 100
            });
        }
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
            elements.socialChatThreadList.innerHTML = '<article class="social-chat-empty">Р§Р°С‚С‹ РїРѕСЏРІСЏС‚СЃСЏ Р·РґРµСЃСЊ РїРѕСЃР»Рµ РїРµСЂРІРѕРіРѕ РґРёР°Р»РѕРіР° СЃ РґСЂСѓРіРѕРј.</article>';
            elements.socialChatThreadTitle.textContent = "Р’С‹Р±РµСЂРё С‡Р°С‚";
            elements.socialChatMessages.innerHTML = '<div class="social-chat-empty">РћС‚РєСЂРѕР№ С‡Р°С‚ С‡РµСЂРµР· РєР°СЂС‚РѕС‡РєСѓ РґСЂСѓРіР°.</div>';
            elements.socialChatInput.disabled = true;
            elements.socialChatSend.disabled = true;
            return;
        }

        elements.socialChatThreadList.innerHTML = threads.map(function (thread) {
            return [
                '<button class="social-chat-thread-card' + (activeThread && activeThread.id === thread.id ? ' is-active' : '') + '" type="button" data-social-thread-id="' + escapeHtml(thread.id) + '">',
                '<strong>' + escapeHtml(thread.friendName || "Р”СЂСѓРі") + '</strong>',
                '<span>' + escapeHtml((thread.status === "online" ? "РћРЅР»Р°Р№РЅ" : "РћС„С„Р»Р°Р№РЅ") + " В· СѓСЂ. " + (thread.level || 1)) + '</span>',
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
        elements.socialChatMessages.innerHTML = (activeThread.messages || []).map(function (message) {
            const own = message.author === "you";
            return [
                '<div class="social-chat-message' + (own ? ' social-chat-message-own' : '') + '">',
                '<div class="social-chat-message-bubble">',
                '<strong>' + escapeHtml(own ? state.player.name : (activeThread.friendName || "Р”СЂСѓРі")) + '</strong>',
                '<p>' + escapeHtml(message.text || "") + '</p>',
                '<small>' + escapeHtml(formatTimestamp(message.createdAt || Date.now())) + '</small>',
                '</div>',
                '</div>'
            ].join("");
        }).join("");
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
                const priceLabel = item.section === "premium" ? item.price + " " + RUBLE_SIGN : item.price + " монет";
                const buttonLabel = item.section === "premium" ? "Скоро" : "Купить";
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
            return '<div class="shop-preview shop-preview-skin shop-preview-' + escapeHtml(item.previewTone || "crimson") + '"><div class="shop-preview-avatar">И</div></div>';
        }
        return '<div class="shop-preview shop-preview-backdrop shop-preview-' + escapeHtml(item.previewTone || "polar") + '"></div>';
    }

    function openAugmentPicker(slot) {
        showToast("Аугментации временно скрыты до переработки.");
    }

    function closeAugmentPicker() {
        state.ui.augmentPickerSlot = null;
    }

    function selectAugment(augmentId) {
        showToast("Аугментации временно скрыты до переработки.");
    }

    function setShopSection(section) {
        state.ui.shopSection = section === "premium" ? "premium" : "standard";
        saveState();
        renderShop();
    }

    function viewFriendProfile(friendId) {
        const friend = getFriendById(friendId);
        if (!friend) {
            return;
        }
        showToast(friend.name + " · уровень " + friend.level + " · " + (friend.status === "online" ? "онлайн" : "оффлайн") + ".");
    }

    function getOwnedAugments(slot) {
        return [];
    }

    function getActiveAugment(slot) {
        return null;
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
        return;
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
        elements.duelYouAvatar.textContent = (duel.playerName || "Ты").slice(0, 1).toUpperCase();
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
            elements.duelLogList.innerHTML = '<div class="duel-log-round"><p class="duel-log-round-title">Лёд молчит. Первый размен еще не произошел.</p></div>';
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
            state.duel.resultText = "Собери ход на раунд и продави линию соперника.";
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
        elements.duelAutoToggle.textContent = currentEnabled ? "Выключить автобой" : "Включить автоматический бой";
        const note = currentEnabled
            ? (pendingEnabled === false ? "Со следующего раунда автобой отключится." : "Автобой включен.")
            : (pendingEnabled === true ? "Со следующего раунда ходы будут автоматическими." : "");
        elements.duelAutoNote.textContent = note;
        elements.duelAutoNote.classList.toggle("hidden", !note);
        elements.duelAutoCover.classList.toggle("hidden", !currentEnabled || duel.finished);
    }

    function renderDuelChat(duel) {
        const isLiveChat = duel.mode === "pvp-live";
        const canWrite = isLiveChat && !duel.finished;
        const messages = duel.chatMessages || [];
        if (!messages.length) {
            elements.duelChatList.innerHTML = '<div class="duel-chat-entry"><p class="duel-chat-text">' + (isLiveChat ? "Чат пока молчит. Первый ход или первое слово — за вами." : "Чат доступен только в PvP-матче между двумя игроками.") + "</p></div>";
        } else {
            elements.duelChatList.innerHTML = messages.map(function (message) {
                const own = message.playerId && state.auth && message.playerId === state.auth.playerId;
                const systemMessage = Boolean(message.systemMessage);
                const infoMessage = systemMessage && /автомат/i.test(String(message.text || ""));
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
            state.duel.chatError = "Ссылка запрещена в боевом чате.";
            renderDuel();
            return;
        }
        if (state.duel.mode !== "pvp-live" || !state.duel.duelId) {
            state.duel.chatError = "Чат доступен только в PvP-матче.";
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
            state.duel.chatError = error && error.message ? error.message : "Не удалось отправить сообщение.";
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
            return "Этот раунд идет автоматически.";
        }
        if (duel.mode === "pvp-live") {
            if (duel.yourActionSubmitted) {
                return hasPendingDuelChanges(duel)
                    ? "Ход сохранен. Можно изменить его, пока не истек таймер раунда."
                    : "Ход зафиксирован. Ждем противника.";
            }
            if (typeof duel.autoBattlePendingEnabled === "boolean") {
                return duel.autoBattlePendingEnabled
                    ? "Автобой включится со следующего раунда."
                    : "Автобой отключится со следующего раунда.";
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
        elements.startDuelTitle.textContent = config.title || "Начать бой?";
        elements.startDuelCopy.textContent = config.copy || "Подтверди, что хочешь начать бой.";
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
                addJournal("Ты покинул бой. Засчитано автопоражение.");
                state.matchmaking.status = "COMPLETED";
                state.matchmaking.duelId = null;
                await refreshLiveDuel(duelId);
                return;
            }

            const duel = state.duel;
            const opponentName = duel.opponentName || "Соперник";
            duel.finished = true;
            duel.playerHp = 0;
            duel.resultText = "Поражение. Бой остановлен до следующего выхода.";
            state.player.losses += 1;
            applyLocalExperienceGain(BATTLE_REWARD_EXPERIENCE);
            duel.logs.push({
                round: duel.round,
                lines: [
                    "Раунд " + duel.round + ": " + (duel.playerName || "Игрок") + " покидает бой.",
                    "Итог: " + opponentName + " получает автопобеду."
                ]
            });
            addJournal("Автопоражение в дуэли засчитано.");
            openDuelResultModal({
                title: "Ты проиграл",
                copy: "Победил " + opponentName + ".",
                experience: BATTLE_REWARD_EXPERIENCE,
                money: 0
            });
            saveState();
            renderAll();
        } catch (error) {
            showToast(error && error.message ? error.message : "Не удалось покинуть бой.");
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

    function addJournal(text) {
        state.journal.unshift({ id: uid("journal"), text: text, createdAt: Date.now() });
        state.journal = state.journal.slice(0, 12);
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
            familyRelic: { title: "Семейная реликвия", description: "Трактирщик просит вернуть запертую шкатулку из кладовой. Внутри что-то важное.", location: "Трактир «Северный Ветер»" },
            brassDisease: { title: "Латунная болезнь", description: "Механик просит принести шестерню. Его автомат заедает, а мастерская стынет.", location: "Мастерская на льду" },
            signalE3: { title: "Сигнал E3", description: "Слабый аварийный маяк мигает за линией проводов. Там или контейнер, или ловушка.", location: "Ледяной коридор" },
            frostDebt: { title: "Снеговой долг", description: "Свежая метка на двери склада обещает тайник и неприятности.", location: "Склад у торосов" }
        }[storyId];
        return { id: uid("quest"), storyId: storyId, nodeId: "start", title: template.title, description: template.description, location: template.location, status: "new", expiresAt: Date.now() + durationMs };
    }

    function buildShopCatalog() {
        return [
            { id: "shop-medkit", section: "standard", kind: "item", itemId: "medkit", name: "Аптечка", description: "Бинты, стим и запас прочности на один грязный бой.", price: 20 },
            { id: "shop-gear", section: "standard", kind: "item", itemId: "brassGear", name: "Латунная шестерня", description: "Редкая деталь для квестов, ремонта и тех, кто вечно что-то чинит.", price: 18 },
            { id: "shop-ammo", section: "standard", kind: "item", itemId: "cartridges38", name: "Патроны .38", description: "Сухие, чистые и пока еще теплые.", price: 9 },
            { id: "premium-skin-crimson", section: "premium", kind: "premium", name: "Скин «Багряный кобальт»", description: "Премиальный скин карточки дуэлянта с рубиновым свечением.", price: 149, previewType: "skin", previewTone: "crimson" },
            { id: "premium-backdrop-polar", section: "premium", kind: "premium", name: "Фон «Полярная латунь»", description: "Премиальный фон хаба с холодной латунью и мягким снеговым свечением.", price: 199, previewType: "backdrop", previewTone: "polar" }
        ];
    }

    function hydrateState(source) {
        const next = source && typeof source === "object" ? source : buildInitialState();
        next.version = 13;
        next.player = Object.assign({ name: "Новый игрок", level: 1, experience: 0, levelProgressCurrent: 0, levelProgressTarget: 100, money: 0, wins: 0, losses: 0, strength: 0, reaction: 0, analysis: 0, availableStatPoints: 0 }, next.player || {});
        const progressSnapshot = getLevelProgressSnapshot(typeof next.player.experience === "number" ? next.player.experience : 0);
        next.player.level = progressSnapshot.level;
        next.player.levelProgressCurrent = progressSnapshot.current;
        next.player.levelProgressTarget = progressSnapshot.target;
        next.player.availableStatPoints = Math.max(0, (next.player.level - 1) - ((next.player.strength || 0) + (next.player.reaction || 0) + (next.player.analysis || 0)));
        next.auth = Object.assign({
            sessionToken: null,
            playerId: null,
            telegramUserId: null,
            nickname: "",
            registered: false,
            demoMode: false,
            initError: ""
        }, next.auth || {});
        next.matchmaking = Object.assign({
            status: "IDLE",
            duelId: null,
            message: "",
            queuedAt: null
        }, next.matchmaking || {});
        next.world = Object.assign({
            lastJournalEventAt: Date.now(),
            lastFriendSyncAt: 0
        }, next.world || {});
        next.ui = Object.assign({ screen: "home", activeQuestId: null, shopSection: "standard", augmentPickerSlot: null, duelExitConfirmOpen: false, startDuelConfirm: null, duelResult: null }, next.ui || {});
        next.ui.startDuelAction = null;
        next.ui.duelResult = next.ui.duelResult || null;
        next.inventory = next.inventory || {};
        next.inventory.backpack = Array.isArray(next.inventory.backpack) ? next.inventory.backpack : [];
        next.inventory.equipped = [];
        next.inventory.unlockedAugments = [];
        next.inventory.augmentSlots = {};
        next.premium = next.premium || { owned: [] };
        next.friends = Array.isArray(next.friends) ? next.friends : [];
        next.friendRequests = Array.isArray(next.friendRequests) ? next.friendRequests : [];
        next.social = Object.assign({
            isOpen: false,
            activeThreadId: null,
            threads: [],
            placeholderFriend: buildPlaceholderFriend()
        }, next.social || {});
        next.social.threads = Array.isArray(next.social.threads) ? next.social.threads : [];
        next.social.placeholderFriend = next.social.placeholderFriend || buildPlaceholderFriend();
        next.shop = buildShopCatalog();
        return next;
    }

    function buildInitialState() {
        return {
            version: 13,
            auth: {
                sessionToken: null,
                playerId: null,
                telegramUserId: null,
                nickname: "",
                registered: false,
                demoMode: false,
                initError: ""
            },
            matchmaking: {
                status: "IDLE",
                duelId: null,
                message: "",
                queuedAt: null
            },
            player: { name: "Новый игрок", level: 1, experience: 0, levelProgressCurrent: 0, levelProgressTarget: 100, money: 0, wins: 0, losses: 0, strength: 0, reaction: 0, analysis: 0, availableStatPoints: 0 },
            world: {
                lastJournalEventAt: Date.now(),
                lastFriendSyncAt: 0
            },
            ui: { screen: "home", activeQuestId: null, shopSection: "standard", augmentPickerSlot: null, duelExitConfirmOpen: false, startDuelConfirm: null, startDuelAction: null, duelResult: null },
            journal: [],
            inventory: {
                equipped: [],
                augmentSlots: {},
                unlockedAugments: [],
                backpack: [
                    { id: "cartridges38", quantity: 12 },
                    { id: "medkit", quantity: 1 },
                    { id: "brassGear", quantity: 1 },
                    { id: "relicBox", quantity: 1 }
                ]
            },
            friends: [],
            friendRequests: [],
            social: {
                isOpen: false,
                activeThreadId: null,
                threads: [],
                placeholderFriend: buildPlaceholderFriend()
            },
            premium: { owned: [] },
            shop: buildShopCatalog(),
            quests: [
                buildQuest("familyRelic", 24 * 60 * 60 * 1000),
                buildQuest("brassDisease", 6 * 60 * 60 * 1000),
                buildQuest("signalE3", 4 * 60 * 60 * 1000)
            ],
            duel: null
        };
    }

    function buildPlaceholderFriend() {
        const template = randomFrom(PLACEHOLDER_FRIEND_POOL);
        return Object.assign({}, template);
    }

    function getDisplayFriends() {
        if (Array.isArray(state.friends) && state.friends.length) {
            return state.friends.slice();
        }
        return state.social && state.social.placeholderFriend ? [state.social.placeholderFriend] : [];
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
            return parsed && (parsed.version === 4 || parsed.version === 5 || parsed.version === 6 || parsed.version === 7 || parsed.version === 8 || parsed.version === 9 || parsed.version === 10 || parsed.version === 11 || parsed.version === 12 || parsed.version === 13) ? parsed : buildInitialState();
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
            PISTOLS: "из пистоля и щита",
            RIFLE: "из винтовки",
            SHOTGUN: "из дробовика"
        }[code] || "";
    }

    function directionLabel(code) {
        return { LEFT: "влево", CENTER: "по центру", RIGHT: "вправо" }[code] || code;
    }

    function dodgeLabel(code) {
        return { LEFT: "смещается влево", STAY: "остается по центру", RIGHT: "смещается вправо" }[code] || code;
    }

    function buildDuelIntentLine(name, action) {
        return name + " стреляет " + directionLabel(action.shot) + " " + weaponInstrumentLabel(action.weapon) + " и " + dodgeLabel(action.dodge) + ".";
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
            return count + " раз";
        }
        if (remainderTen >= 2 && remainderTen <= 4 && (remainderHundred < 12 || remainderHundred > 14)) {
            return count + " раза";
        }
        return count + " раз";
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
            return totalSeconds + " сек";
        }
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return minutes + " мин " + pad(seconds) + " сек";
    }

    function formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    }

    function hasForbiddenLink(text) {
        return CHAT_LINK_PATTERN.test(String(text || ""));
    }

    function getStatLabel(stat) {
        return {
            strength: "Сила",
            reaction: "Реакция",
            analysis: "Анализ"
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
            .replace(new RegExp("([+-]?\\d+)\\s*" + escapeRegExp(RUBLE_SIGN), "g"), "$1 монет")
            .replace(/([+-]?\d+)\s*в‚Ѕ/g, "$1 монет");
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

    function pad(value) {
        return String(value).padStart(2, "0");
    }
})();
