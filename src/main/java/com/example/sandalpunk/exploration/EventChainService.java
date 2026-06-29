package com.example.sandalpunk.exploration;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.stereotype.Service;

@Service
public class EventChainService {

    private final ContentBalance balance;
    private final List<EventChain> chains;
    private final Map<String, Encounter> encountersByStep;

    public EventChainService(ContentBalance balance) {
        this.balance = balance;
        this.chains = buildChains();
        this.encountersByStep = buildStepEncounters();
    }

    public List<EventChain> catalog() {
        return chains;
    }

    public Optional<EventChain> find(String chainId) {
        return chains.stream()
                .filter(chain -> chain.chainId().equals(chainId))
                .findFirst();
    }

    public Optional<Encounter> maybeStartChain(ExplorationState state) {
        if (state.getActiveChainId() != null || ThreadLocalRandom.current().nextDouble() >= balance.chainStartChance()) {
            return Optional.empty();
        }
        List<EventChain> eligible = chains.stream()
                .filter(chain -> chain.mode() == state.getVisibilityMode())
                .filter(chain -> chain.isRepeatable()
                        || (!state.getCompletedChainIds().contains(chain.chainId())
                        && !state.getFailedChainIds().contains(chain.chainId())))
                .toList();
        if (eligible.isEmpty()) {
            return Optional.empty();
        }
        EventChain chain = eligible.get(ThreadLocalRandom.current().nextInt(eligible.size()));
        EventChainStep firstStep = firstStep(chain);
        state.setActiveChainId(chain.chainId());
        state.setActiveChainStep(firstStep.stepId());
        return nextChainEncounter(state);
    }

    public Optional<Encounter> nextChainEncounter(ExplorationState state) {
        if (state.getActiveChainId() == null || state.getActiveChainStep() == null) {
            return Optional.empty();
        }
        EventChainStep step = findStep(state.getActiveChainId(), state.getActiveChainStep()).orElse(null);
        if (step == null) {
            state.clearActiveChain();
            return Optional.empty();
        }
        Encounter template = encountersByStep.get(key(state.getActiveChainId(), step.stepId()));
        if (template == null) {
            return Optional.empty();
        }
        return Optional.of(new Encounter(
                UUID.randomUUID().toString(),
                template.contentId(),
                template.type(),
                template.title(),
                template.text(),
                template.choices(),
                template.reward(),
                template.risk(),
                template.chainId(),
                template.chainStepId(),
                template.tags()
        ));
    }

    public ChainResolution resolveChoice(
            ExplorationState state,
            Encounter encounter,
            EncounterChoice choice
    ) {
        if (encounter.chainId() == null || encounter.chainStepId() == null) {
            return ChainResolution.none();
        }
        Optional<EventChain> chainOptional = find(encounter.chainId());
        Optional<EventChainStep> stepOptional = findStep(encounter.chainId(), encounter.chainStepId());
        if (chainOptional.isEmpty() || stepOptional.isEmpty()) {
            state.clearActiveChain();
            return ChainResolution.none();
        }

        EventChain chain = chainOptional.get();
        EventChainStep step = stepOptional.get();
        boolean success = isSuccess(choice);
        String nextStep = success ? step.nextStepOnSuccess() : step.nextStepOnFailure();
        if (nextStep != null && !nextStep.isBlank()) {
            state.setActiveChainId(chain.chainId());
            state.setActiveChainStep(nextStep);
            return new ChainResolution(
                    ChainResolutionStatus.ADVANCED,
                    chain,
                    PlayerResources.empty(),
                    0,
                    "Цепочка «" + chain.title() + "» продолжается."
            );
        }

        state.clearActiveChain();
        if (success) {
            state.markChainCompleted(chain.chainId());
            return new ChainResolution(
                    ChainResolutionStatus.COMPLETED,
                    chain,
                    chain.completionReward(),
                    0,
                    "Цепочка «" + chain.title() + "» завершена. Лодка получила новую зацепку."
            );
        }

        state.markChainFailed(chain.chainId());
        return new ChainResolution(
                ChainResolutionStatus.FAILED,
                chain,
                PlayerResources.empty(),
                -Math.max(0, chain.failurePenalty()),
                "Цепочка «" + chain.title() + "» оборвалась. Большая вода забрала силы."
        );
    }

    public String title(String chainId) {
        return find(chainId)
                .map(EventChain::title)
                .orElse(chainId);
    }

    private boolean isSuccess(EncounterChoice choice) {
        return choice.resultType() != ChoiceResultType.AVOID
                && choice.resultType() != ChoiceResultType.LOSE_HP
                && !"avoid".equals(choice.id());
    }

    private Optional<EventChainStep> findStep(String chainId, String stepId) {
        return find(chainId).flatMap(chain -> chain.steps().stream()
                .filter(step -> step.stepId().equals(stepId))
                .findFirst());
    }

    private EventChainStep firstStep(EventChain chain) {
        return chain.steps().stream()
                .min(Comparator.comparing(EventChainStep::order))
                .orElseThrow();
    }

    private Map<String, Encounter> buildStepEncounters() {
        Map<String, Encounter> encounters = new LinkedHashMap<>();
        put(encounters, chainEncounter(
                "chain_underwater_sign",
                "sign",
                "chain_sign_underwater",
                EncounterType.OBJECT,
                "Знак под водой",
                "Под мутной водой светится старый знак. Стрелка на нем не совпадает ни с одним курсом карты.",
                RiskLevel.MEDIUM,
                List.of("chain", "sign", "water"),
                choice("read", "Снять ил и прочитать", ChoiceResultType.FIND_OBJECT, RiskLevel.LOW,
                        PlayerResources.empty(), 0, "На металле проступает номер северной линии."),
                choice("lift", "Вытащить знак", ChoiceResultType.LOSE_HP, RiskLevel.HIGH,
                        new PlayerResources(1, 0, 0), -5, "Металл режет ладонь, но знак поддается."),
                avoid()
        ));
        put(encounters, chainEncounter(
                "chain_underwater_sign",
                "mark",
                "chain_sign_marker",
                EncounterType.MAP_FRAGMENT,
                "Стрелка на кальке",
                "Запомненное направление совпадает с мокрой калькой из старого планшета.",
                RiskLevel.LOW,
                List.of("chain", "map_fragment"),
                choice("copy", "Перенести стрелку на карту", ChoiceResultType.FIND_OBJECT, RiskLevel.LOW,
                        new PlayerResources(1, 0, 0), 0, "На карте появляется короткий безопасный обход."),
                choice("skip", "Не тратить время", ChoiceResultType.AVOID, RiskLevel.LOW,
                        PlayerResources.empty(), 0, "Калька снова темнеет и направление теряется.")
        ));

        put(encounters, chainEncounter(
                "chain_walkway_trace",
                "trace",
                "chain_walkway_trace",
                EncounterType.PVP_TRACE,
                "След вдоль платформы",
                "Свежая полоса на мокрой доске идет рядом с твоими следами, будто кто-то шел на полшага позади.",
                RiskLevel.HIGH,
                List.of("chain", "pvp_trace", "walkway"),
                choice("follow", "Проверить след", ChoiceResultType.FIND_OBJECT, RiskLevel.MEDIUM,
                        PlayerResources.empty(), 0, "След выводит к чужой засаде, но ты замечаешь ее первым."),
                choice("cut", "Срезать через воду", ChoiceResultType.LOSE_HP, RiskLevel.HIGH,
                        PlayerResources.empty(), -6, "Вода скрывает тебя, но вытягивает тепло из ног."),
                avoid()
        ));
        put(encounters, chainEncounter(
                "chain_walkway_trace",
                "ambush",
                "chain_walkway_ambush",
                EncounterType.PVP_ENCOUNTER,
                "Тихая засада",
                "За поворотом протоки лежит пустой ящик-приманка. Ствол в тумане еще не поднят.",
                RiskLevel.HIGH,
                List.of("chain", "pvp_encounter", "ambush"),
                choice("signal", "Дать знак и разойтись", ChoiceResultType.GAIN_RESOURCE, RiskLevel.MEDIUM,
                        new PlayerResources(1, 1, 0), 0, "Другой капитан отступает, оставив часть приманки."),
                choice("fight", "Принять стычку", ChoiceResultType.START_PVP_DUEL, RiskLevel.HIGH,
                        new PlayerResources(2, 0, 0), 0, "Ты поднимаешь оружие. Стычка неизбежна.")
        ));

        put(encounters, chainEncounter(
                "chain_breathing_planks",
                "planks",
                "chain_planks_breathe",
                EncounterType.MONSTER,
                "Доски дышат",
                "Настил под ногами поднимается и опускается, будто под ним лежит грудная клетка.",
                RiskLevel.HIGH,
                List.of("chain", "monster_trace", "walkway"),
                choice("freeze", "Замереть на вдохе", ChoiceResultType.AVOID, RiskLevel.LOW,
                        PlayerResources.empty(), 0, "Дыхание под досками успокаивается."),
                choice("run", "Пробежать", ChoiceResultType.LOSE_HP, RiskLevel.HIGH,
                        PlayerResources.empty(), -8, "Доски бьют по ногам, но ты перескакиваешь провал."),
                choice("listen", "Выслушать ритм", ChoiceResultType.FIND_OBJECT, RiskLevel.MEDIUM,
                        PlayerResources.empty(), 0, "Ритм складывается в старую аварийную азбуку.")
        ));
        put(encounters, chainEncounter(
                "chain_breathing_planks",
                "code",
                "chain_planks_code",
                EncounterType.BASE_MEMORY,
                "Азбука настила",
                "Доски передают короткую фразу: «не чинить южный пролет».",
                RiskLevel.MEDIUM,
                List.of("chain", "base_memory"),
                choice("record", "Записать для лодки", ChoiceResultType.FIND_OBJECT, RiskLevel.LOW,
                        new PlayerResources(0, 1, 0), 0, "Запись поможет обходить живые пролеты."),
                choice("ignore", "Стереть из головы", ChoiceResultType.AVOID, RiskLevel.LOW,
                        PlayerResources.empty(), 0, "Фраза рассыпается в шум воды.")
        ));

        put(encounters, chainEncounter(
                "chain_old_cordon",
                "wire",
                "chain_cordon_wire",
                EncounterType.RISK_REWARD,
                "Линия старых буев",
                "В тумане натянута почти невидимая проволока. На ней висит чужой жетон.",
                RiskLevel.HIGH,
                List.of("chain", "cordon", "risk_reward"),
                choice("disarm", "Снять проволоку", ChoiceResultType.GAIN_RESOURCE, RiskLevel.MEDIUM,
                        new PlayerResources(2, 0, 0), 0, "Проволока идет в палубный ящик, а жетон указывает на старую линию буев."),
                choice("step_over", "Перешагнуть", ChoiceResultType.LOSE_HP, RiskLevel.HIGH,
                        PlayerResources.empty(), -7, "Проволока цепляет броню и звенит над всей водой."),
                avoid()
        ));
        put(encounters, chainEncounter(
                "chain_old_cordon",
                "post",
                "chain_cordon_post",
                EncounterType.PVP_AFTERMATH,
                "Пустой пост",
                "У линии старых буев остались свежие гильзы, обломок маски и записка без подписи.",
                RiskLevel.MEDIUM,
                List.of("chain", "pvp_aftermath", "cordon"),
                choice("search", "Разобрать пост", ChoiceResultType.FIND_OBJECT, RiskLevel.MEDIUM,
                        new PlayerResources(1, 1, 1), 0, "Ты находишь схему обхода и чужую отметку."),
                choice("burn", "Сжечь следы", ChoiceResultType.AVOID, RiskLevel.LOW,
                        PlayerResources.empty(), 0, "Дым скрывает линию буев, но схема пропадает.")
        ));

        put(encounters, chainEncounter(
                "chain_journal_voice",
                "voice",
                "chain_journal_voice",
                EncounterType.BASE_MEMORY,
                "Голос из бортового журнала",
                "Старая запись в бортовом журнале произносит твое имя голосом человека, которого у причала не знают.",
                RiskLevel.MEDIUM,
                List.of("chain", "note", "base_memory"),
                choice("answer", "Ответить в диктофон", ChoiceResultType.FIND_OBJECT, RiskLevel.MEDIUM,
                        PlayerResources.empty(), 0, "Голос просит принести ему метку с воды."),
                choice("erase", "Стереть запись", ChoiceResultType.AVOID, RiskLevel.LOW,
                        PlayerResources.empty(), 0, "Пленка очищается, но в бортовом журнале остается пустая страница.")
        ));
        put(encounters, chainEncounter(
                "chain_journal_voice",
                "token",
                "chain_journal_token",
                EncounterType.ANOMALY,
                "Метка без владельца",
                "На воде плавает сухая бирка с тем же номером, что прозвучал в бортовом журнале.",
                RiskLevel.HIGH,
                List.of("chain", "anomaly_mark", "note"),
                choice("take", "Взять бирку", ChoiceResultType.FIND_OBJECT, RiskLevel.MEDIUM,
                        new PlayerResources(0, 0, 1), -3, "Бирка становится теплой. Голос в бортовом журнале замолкает."),
                choice("sink", "Утопить бирку", ChoiceResultType.LOSE_HP, RiskLevel.HIGH,
                        PlayerResources.empty(), -8, "Вода вспыхивает холодом и стирает номер.")
        ));
        return encounters;
    }

    private void put(Map<String, Encounter> encounters, Encounter encounter) {
        encounters.put(key(encounter.chainId(), encounter.chainStepId()), encounter);
    }

    private String key(String chainId, String stepId) {
        return chainId + ":" + stepId;
    }

    private List<EventChain> buildChains() {
        return List.of(
                new EventChain(
                        "chain_underwater_sign",
                        "Знак под водой",
                        "Короткая скрытая цепочка о курсе, который появляется только в мутной воде.",
                        ExplorationVisibilityMode.HIDDEN,
                        List.of("map_fragment", "water"),
                        List.of(
                                new EventChainStep("sign", "chain_sign_underwater", 1, null, "mark", null),
                                new EventChainStep("mark", "chain_sign_marker", 2, "read", null, null)
                        ),
                        new PlayerResources(1, 1, 0),
                        balance.monsterHpLossLow(),
                        false
                ),
                new EventChain(
                        "chain_walkway_trace",
                        "След вдоль платформы",
                        "Открытая PvP-цепочка: чужой курс, засада и шанс разойтись без полноценной стычки.",
                        ExplorationVisibilityMode.OPEN_PVP,
                        List.of("pvp_trace", "walkway"),
                        List.of(
                                new EventChainStep("trace", "chain_walkway_trace", 1, null, "ambush", null),
                                new EventChainStep("ambush", "chain_walkway_ambush", 2, "follow", null, null)
                        ),
                        new PlayerResources(2, 1, 0),
                        balance.monsterHpLossMedium(),
                        true
                ),
                new EventChain(
                        "chain_breathing_planks",
                        "Доски дышат",
                        "Монстр-событие под платформой, которое раскрывает старую аварийную память лодки.",
                        ExplorationVisibilityMode.HIDDEN,
                        List.of("monster_trace", "base_memory"),
                        List.of(
                                new EventChainStep("planks", "chain_planks_breathe", 1, null, "code", null),
                                new EventChainStep("code", "chain_planks_code", 2, "listen", null, null)
                        ),
                        new PlayerResources(0, 2, 0),
                        balance.monsterHpLossMedium(),
                        false
                ),
                new EventChain(
                        "chain_old_cordon",
                        "Линия старых буев",
                        "Рискованный открытый курс: чужие ловушки, следы стрельбы и награда за аккуратность.",
                        ExplorationVisibilityMode.OPEN_PVP,
                        List.of("cordon", "risk_reward"),
                        List.of(
                                new EventChainStep("wire", "chain_cordon_wire", 1, null, "post", null),
                                new EventChainStep("post", "chain_cordon_post", 2, "disarm", null, null)
                        ),
                        new PlayerResources(2, 1, 1),
                        balance.monsterHpLossMedium(),
                        true
                ),
                new EventChain(
                        "chain_journal_voice",
                        "Голос из бортового журнала",
                        "Аномальная цепочка о записи, которая отвечает игроку и оставляет постоянную находку.",
                        ExplorationVisibilityMode.HIDDEN,
                        List.of("note", "anomaly_mark"),
                        List.of(
                                new EventChainStep("voice", "chain_journal_voice", 1, null, "token", null),
                                new EventChainStep("token", "chain_journal_token", 2, "answer", null, null)
                        ),
                        new PlayerResources(0, 0, 1),
                        balance.monsterHpLossHigh(),
                        false
                )
        );
    }

    private Encounter chainEncounter(
            String chainId,
            String stepId,
            String contentId,
            EncounterType type,
            String title,
            String text,
            RiskLevel risk,
            List<String> tags,
            EncounterChoice... choices
    ) {
        return new Encounter(
                "template-" + contentId,
                contentId,
                type,
                title,
                text,
                List.of(choices),
                PlayerResources.empty(),
                risk,
                chainId,
                stepId,
                tags
        );
    }

    private static EncounterChoice choice(
            String id,
            String text,
            ChoiceResultType resultType,
            RiskLevel riskLevel,
            PlayerResources reward,
            int hpDelta,
            String resultText
    ) {
        return new EncounterChoice(id, text, resultType, riskLevel, reward, hpDelta, resultText);
    }

    private static EncounterChoice avoid() {
        return choice(
                "avoid",
                "Обойти",
                ChoiceResultType.AVOID,
                RiskLevel.LOW,
                PlayerResources.empty(),
                0,
                "Ты оставляешь след воды позади и продолжаешь путь."
        );
    }

    public record ChainResolution(
            ChainResolutionStatus status,
            EventChain chain,
            PlayerResources reward,
            int hpDelta,
            String journalMessage
    ) {
        static ChainResolution none() {
            return new ChainResolution(
                    ChainResolutionStatus.NONE,
                    null,
                    PlayerResources.empty(),
                    0,
                    ""
            );
        }
    }

    public enum ChainResolutionStatus {
        NONE,
        ADVANCED,
        COMPLETED,
        FAILED
    }
}
