package com.example.sandalpunk.exploration;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.stereotype.Component;

@Component
public class EncounterGenerator {

    private final List<String> movementEntries = List.of(
            "Топь не шумит. Даже вода под ногами будто ждет, когда ты ошибешься.",
            "Доски старого настила уходят под воду. Приходится ступать по корням и ржавому железу.",
            "Туман становится плотнее. База уже не видна, но ее генератор еще слышен за спиной.",
            "Камыш расходится узким коридором. На воде нет ряби, хотя ветер усилился.",
            "Под сапогами хрустит тонкий ледяной налет. Здесь холоднее, чем должно быть."
    );

    private final List<String> stageFourMovementEntries = List.of(
            "За левым плечом скрипит мокрый настил, хотя там нет ни одной доски.",
            "Вода на секунду становится прозрачной и показывает чужие следы под илом.",
            "Камыш ложится вперед, будто пропускает тебя по заранее выбранному коридору.",
            "Старый провод тянется из воды и тихо звенит, когда рядом проходит ветер.",
            "На коре черной ольхи проступает свежая метка, которой не было минуту назад.",
            "Туман открывает сухую кочку и сразу закрывает путь за спиной.",
            "Где-то далеко хлопает ставня, хотя ближайший дом давно ушел под воду.",
            "Северный огонек базы мигает три раза и снова теряется в серой воде."
    );

    private final List<EncounterTemplate> hiddenEncounters = List.of(
            loot(
                    "hidden_loot_rusted_box",
                    "Ржавый ящик",
                    "В корнях черной ольхи застрял ржавый ящик. Крышка держится на одном замке.",
                    choice("take", "Вскрыть и забрать", ChoiceResultType.GAIN_RESOURCE, "низкий",
                            resources(1, 1, 0), 0, "Внутри нашлись сухой бинт и пригодный кусок металла."),
                    choice("inspect", "Проверить ловушки", ChoiceResultType.GAIN_RESOURCE, "низкий",
                            resources(0, 1, 0), 0, "Под крышкой была проволока. Ты снял ее и забрал припасы."),
                    avoid()
            ),
            loot(
                    "hidden_loot_drowned_pack",
                    "Затонувший рюкзак",
                    "Ремень рюкзака виден под темной водой. Что-то внутри еще сохраняет форму.",
                    choice("pull", "Вытащить", ChoiceResultType.GAIN_RESOURCE, "средний",
                            resources(0, 2, 0), -4, "Вода обожгла руку холодом, но часть припасов осталась сухой."),
                    choice("cut", "Срезать внешний карман", ChoiceResultType.GAIN_RESOURCE, "низкий",
                            resources(1, 0, 0), 0, "В кармане оказался складной инструмент, годный на лом."),
                    avoid()
            ),
            loot(
                    "hidden_loot_resin",
                    "Смола на сваях",
                    "На старой свае выступила густая янтарная смола. Она движется против силы тяжести.",
                    choice("collect", "Собрать смолу", ChoiceResultType.GAIN_RESOURCE, "средний",
                            resources(0, 0, 1), -3, "Смола прожгла перчатку, но образец удалось запечатать."),
                    choice("scrape", "Снять тонкий слой", ChoiceResultType.GAIN_RESOURCE, "низкий",
                            resources(0, 0, 1), 0, "Ты взял только холодный внешний слой и не коснулся живой сердцевины."),
                    avoid()
            ),
            loot(
                    "hidden_loot_cable",
                    "Катушка кабеля",
                    "Из ила торчит край медной катушки. Кабель уходит под развалины будки.",
                    choice("cut", "Срезать доступное", ChoiceResultType.GAIN_RESOURCE, "низкий",
                            resources(2, 0, 0), 0, "Несколько метров кабеля легко разбираются на полезный лом."),
                    choice("pull", "Тянуть всю катушку", ChoiceResultType.LOSE_HP, "высокий",
                            resources(3, 0, 0), -8, "Под обломками сорвалась балка. Ты успел отскочить, но получил удар."),
                    avoid()
            ),
            object(
                    "hidden_object_sign",
                    "Знак под водой",
                    "Из воды торчит знак, которого не было на старых картах. Стертая стрелка указывает вглубь.",
                    choice("inspect", "Осмотреть надпись", ChoiceResultType.FIND_OBJECT, "низкий",
                            resources(1, 0, 0), 0, "Под ржавчиной проступило слово «Север-9». Ты запомнил направление."),
                    choice("mark", "Отметить и обойти", ChoiceResultType.NOTHING, "низкий",
                            PlayerResources.empty(), 0, "Метка останется до следующего тумана."),
                    avoid()
            ),
            object(
                    "hidden_object_tower",
                    "Наблюдательная вышка",
                    "Над камышом видна площадка старой вышки. Лестница потеряла половину ступеней.",
                    choice("climb", "Подняться", ChoiceResultType.FIND_OBJECT, "средний",
                            resources(1, 1, 0), -5, "С высоты виден сухой маршрут. На площадке остался аварийный набор."),
                    choice("search", "Осмотреть основание", ChoiceResultType.GAIN_RESOURCE, "низкий",
                            resources(1, 0, 0), 0, "В креплениях сохранились болты и куски провода."),
                    avoid()
            ),
            object(
                    "hidden_object_boat",
                    "Лодка без следов",
                    "У берега стоит алюминиевая лодка. Внутри сухо, но вокруг нет ни одного следа.",
                    choice("board", "Заглянуть внутрь", ChoiceResultType.FIND_OBJECT, "средний",
                            resources(0, 1, 0), 0, "Под сиденьем лежит запечатанный рацион с сегодняшней датой."),
                    choice("push", "Оттолкнуть от берега", ChoiceResultType.NOTHING, "низкий",
                            PlayerResources.empty(), 0, "Лодка уходит в туман против течения."),
                    avoid()
            ),
            object(
                    "hidden_object_hatch",
                    "Герметичный люк",
                    "В бетонной плите найден круглый люк. Изнутри кто-то трижды проводит металлом по металлу.",
                    choice("listen", "Прислушаться", ChoiceResultType.FIND_OBJECT, "средний",
                            PlayerResources.empty(), 0, "Скрежет повторяет ритм твоего дыхания, затем стихает."),
                    choice("open", "Попробовать открыть", ChoiceResultType.LOSE_HP, "высокий",
                            resources(2, 1, 0), -10, "Из щели ударил едкий пар. У края люка остался ремонтный комплект."),
                    avoid()
            ),
            anomaly(
                    "hidden_anomaly_compass",
                    "Компас смотрит на тебя",
                    "Компас крутится, но стрелка каждый раз останавливается на тебе.",
                    choice("wait", "Замереть", ChoiceResultType.NOTHING, "средний",
                            PlayerResources.empty(), 0, "Через минуту стрелка снова находит север, будто ничего не было."),
                    choice("follow", "Идти против стрелки", ChoiceResultType.GAIN_RESOURCE, "высокий",
                            resources(0, 0, 1), -6, "Маршрут выводит к холодному сгустку смолы. В висках долго звенит."),
                    avoid()
            ),
            anomaly(
                    "hidden_anomaly_still_rain",
                    "Неподвижный дождь",
                    "В просвете между деревьями капли дождя висят в воздухе и не падают.",
                    choice("cross", "Пройти сквозь", ChoiceResultType.LOSE_HP, "высокий",
                            resources(0, 0, 2), -12, "Капли режут кожу как стекло. На одежде остается редкая смола."),
                    choice("sample", "Собрать крайнюю каплю", ChoiceResultType.GAIN_RESOURCE, "средний",
                            resources(0, 0, 1), -3, "Капля затвердела в колбе и перестала отражать свет."),
                    avoid()
            ),
            anomaly(
                    "hidden_anomaly_mirror",
                    "Вода без отражения",
                    "В круглом окне воды не отражается ни небо, ни твое лицо.",
                    choice("touch", "Коснуться поверхности", ChoiceResultType.FIND_OBJECT, "средний",
                            resources(0, 1, 0), -4, "Рука на миг исчезает из зрения. На дне обнаруживается закрытая фляга."),
                    choice("observe", "Наблюдать", ChoiceResultType.NOTHING, "низкий",
                            PlayerResources.empty(), 0, "Через несколько вдохов в воде появляется отражение чужой спины."),
                    avoid()
            ),
            monster(
                    "hidden_monster_under_walkway",
                    "Под настилом",
                    "Что-то большое прошло под настилом. Доски выгнулись вверх, а потом медленно легли обратно.",
                    choice("freeze", "Не двигаться", ChoiceResultType.AVOID, "средний",
                            PlayerResources.empty(), 0, "Тяжесть уходит в глубину. Вода снова становится ровной."),
                    choice("run", "Рвануть к суше", ChoiceResultType.LOSE_HP, "высокий",
                            PlayerResources.empty(), -9, "Последняя доска ломается под ногой. Ты выбираешься, оставив кровь на воде."),
                    choice("distract", "Бросить припасы", ChoiceResultType.AVOID, "низкий",
                            PlayerResources.empty(), 0, "Шорох уходит за брошенным пакетом. Ты сохраняешь дистанцию.")
            ),
            monster(
                    "hidden_monster_reed_crawler",
                    "Камышовый ползун",
                    "Между стеблями движется низкий силуэт. Он замирает каждый раз, когда ты смотришь прямо.",
                    choice("back", "Медленно отступить", ChoiceResultType.AVOID, "низкий",
                            PlayerResources.empty(), 0, "Силуэт остается в камыше и не преследует тебя."),
                    choice("scare", "Ударить по металлу", ChoiceResultType.MONSTER_FIGHT_TEXT, "средний",
                            resources(1, 0, 0), -5, "Ползун бросается вперед и тут же уходит. В траве остается металлический жетон."),
                    choice("circle", "Обойти по воде", ChoiceResultType.NOTHING, "средний",
                            PlayerResources.empty(), -2, "Холодная вода скрывает твои шаги, но забирает силы.")
            ),
            monster(
                    "hidden_monster_white_leech",
                    "Белая пиявка",
                    "На сапоге раздувается белая пиявка размером с ладонь. Она уже пробила ткань.",
                    choice("burn", "Прижечь", ChoiceResultType.MONSTER_FIGHT_TEXT, "средний",
                            PlayerResources.empty(), -4, "Запах отпугивает остальных. Рана остается неглубокой."),
                    choice("cut", "Срезать ножом", ChoiceResultType.LOSE_HP, "средний",
                            resources(0, 0, 1), -7, "Пиявка лопается, оставляя вязкую смолу и болезненный порез."),
                    choice("salt", "Потратить припасы", ChoiceResultType.AVOID, "низкий",
                            PlayerResources.empty(), 0, "Соль заставляет существо отпасть. Ты уходишь без новой раны.")
            ),
            quiet(
                    "hidden_system_voices",
                    "Чужая запись",
                    "Радио включается само. Твой голос диктует координаты, которых ты еще не видел.",
                    choice("record", "Записать координаты", ChoiceResultType.FIND_OBJECT, "низкий",
                            PlayerResources.empty(), 0, "Координаты остаются в дневнике. Радио снова молчит."),
                    choice("break", "Выключить питание", ChoiceResultType.NOTHING, "низкий",
                            resources(1, 0, 0), 0, "Ты вынимаешь батарею и сохраняешь пригодные детали."),
                    avoid()
            )
    );

    private final List<EncounterTemplate> stageFourHiddenEncounters = stageFourHiddenEncounters();

    private final List<EncounterTemplate> openPvpEncounters = List.of(
            pvpTrace(
                    "open_trace_boot",
                    "Свежий след",
                    "На грязи свежий след сапога. Не твой. Он идет параллельно твоему маршруту.",
                    choice("track", "Проверить чужие следы", ChoiceResultType.START_PVP_DUEL, "высокий",
                            resources(1, 1, 0), 0, "Ты выходишь к просвету в тумане. Другой выживший уже рядом."),
                    choice("ambush", "Занять позицию", ChoiceResultType.START_PVP_DUEL, "высокий",
                            resources(2, 0, 0), 0, "Ты перестаешь двигаться. Через камыш слышится щелчок предохранителя."),
                    avoid()
            ),
            pvpTrace(
                    "open_trace_smoke",
                    "Дым над камышом",
                    "За серой стеной тумана поднимается тонкая струя дыма от сухого топлива.",
                    choice("approach", "Подойти открыто", ChoiceResultType.START_PVP_DUEL, "высокий",
                            resources(0, 2, 0), 0, "У огня никого нет, но оружие щелкает у тебя за спиной."),
                    choice("search", "Осмотреть край стоянки", ChoiceResultType.GAIN_RESOURCE, "средний",
                            resources(1, 0, 0), -3, "Ты находишь детали, но выдаешь себя хрустом стекла."),
                    avoid()
            ),
            pvpTrace(
                    "open_trace_signal",
                    "Сигнал фонаря",
                    "В тумане трижды мигает фонарь. Ответный сигнал приходит с другой стороны.",
                    choice("answer", "Ответить светом", ChoiceResultType.START_PVP_DUEL, "высокий",
                            resources(1, 1, 0), 0, "Свет гаснет. Чужие шаги начинают обходить тебя по кругу."),
                    choice("wait", "Погасить свет и ждать", ChoiceResultType.NOTHING, "средний",
                            PlayerResources.empty(), 0, "Сигналы приближаются, затем резко уходят к северу."),
                    avoid()
            ),
            pvpEncounter(
                    "open_encounter_safety",
                    "Щелчок предохранителя",
                    "В тумане щелкнул предохранитель. Кто-то увидел тебя раньше, чем ты его.",
                    choice("fight", "Вступить в стычку", ChoiceResultType.START_PVP_DUEL, "высокий",
                            resources(2, 1, 0), 0, "Ты поднимаешь оружие и выходишь к чужому силуэту."),
                    choice("reeds", "Уйти в камыш", ChoiceResultType.AVOID, "средний",
                            PlayerResources.empty(), -4, "Камыш режет руки, но линия огня остается позади.")
            ),
            pvpEncounter(
                    "open_encounter_bridge",
                    "Выживший на мостках",
                    "Другой выживший стоит между тобой и сухим проходом. Отступать он не собирается.",
                    choice("first_shot", "Выстрелить первым", ChoiceResultType.START_PVP_DUEL, "высокий",
                            resources(2, 2, 0), 0, "Первый выстрел отмечает начало стычки."),
                    choice("offer", "Предложить разойтись", ChoiceResultType.NOTHING, "средний",
                            PlayerResources.empty(), 0, "Силуэт медленно уходит с мостков, не опуская оружия."),
                    choice("back", "Отступить", ChoiceResultType.AVOID, "низкий",
                            PlayerResources.empty(), 0, "Ты уступаешь сухой путь и сохраняешь найденное.")
            ),
            loot(
                    "open_reward_cache",
                    "Чужой тайник",
                    "Под красной лентой спрятан чужой запас. Хозяин может быть рядом.",
                    choice("take_all", "Забрать все", ChoiceResultType.GAIN_RESOURCE, "высокий",
                            resources(3, 2, 1), -7, "Ты забираешь тайник, но на обратном пути попадаешь под случайный выстрел."),
                    choice("take_part", "Взять часть", ChoiceResultType.GAIN_RESOURCE, "средний",
                            resources(2, 1, 0), 0, "Ты оставляешь часть запаса и быстро меняешь маршрут."),
                    avoid()
            ),
            quiet(
                    "open_reward_crossing",
                    "Открытая переправа",
                    "Короткий путь проходит по светлой воде. Здесь тебя легко увидеть, зато на сваях блестит смола.",
                    choice("cross", "Идти открыто", ChoiceResultType.GAIN_RESOURCE, "высокий",
                            resources(1, 0, 2), -6, "Ты быстро пересекаешь воду и снимаешь смолу со свай."),
                    choice("long_way", "Обойти по тени", ChoiceResultType.GAIN_RESOURCE, "низкий",
                            resources(0, 1, 0), 0, "Обход занимает время, но в сухом кармане находится рацион."),
                    choice("return", "Вернуться к базе", ChoiceResultType.RETURN_TO_BASE, "низкий",
                            PlayerResources.empty(), 0, "Ты решаешь не проверять удачу еще раз.")
            )
    );

    private final List<EncounterTemplate> stageFourOpenPvpEncounters = stageFourOpenPvpEncounters();

    private final List<String> returnEntries = List.of(
            "База принимает добычу молча: сухой стол, теплый свет, запах железа и смолы.",
            "Дежурный отмечает маршрут в журнале и стирает с твоих сапог серую воду.",
            "Запорные ворота закрываются за спиной. На этот раз топь отпустила тебя.",
            "Ты раскладываешь находки на верстаке. Часть пути уже можно восстановить по памяти."
    );

    private final List<String> failedEntries = List.of(
            "Туман сжимается слишком быстро. Поисковая группа находит тебя у старой сваи.",
            "Последняя запись обрывается на шуме воды. База вытаскивает тебя уже на рассвете.",
            "Камыш закрывает маршрут. Ты возвращаешься не сам, а на чужих плечах.",
            "Топь забирает часть рюкзака, но оставляет достаточно следов, чтобы найти дорогу домой."
    );

    public String nextMovementEntry() {
        List<String> pool = movementPool();
        return pool.get(nextInt(pool.size()));
    }

    public String nextReturnEntry() {
        return returnEntries.get(nextInt(returnEntries.size()));
    }

    public String nextFailedEntry() {
        return failedEntries.get(nextInt(failedEntries.size()));
    }

    public boolean shouldGenerateEncounter() {
        return nextDouble() < 0.72d;
    }

    public Encounter nextEncounter(ExplorationVisibilityMode visibilityMode) {
        return nextEncounter(visibilityMode, Set.of(), 0.0d);
    }

    public Encounter nextEncounter(
            ExplorationVisibilityMode visibilityMode,
            Set<EncounterType> preferredTypes,
            double preferenceChance
    ) {
        return nextEncounter(visibilityMode, preferredTypes, preferenceChance, Set.of());
    }

    public Encounter nextEncounter(
            ExplorationVisibilityMode visibilityMode,
            Set<EncounterType> preferredTypes,
            double preferenceChance,
            Set<String> recentlySeenEventIds
    ) {
        List<EncounterTemplate> pool = encounterPool(visibilityMode);
        if (preferredTypes != null
                && !preferredTypes.isEmpty()
                && nextDouble() < Math.max(0.0d, Math.min(1.0d, preferenceChance))) {
            List<EncounterTemplate> preferredPool = pool.stream()
                    .filter(template -> preferredTypes.contains(template.type()))
                    .toList();
            if (!preferredPool.isEmpty()) {
                pool = preferredPool;
            }
        }
        Set<String> seen = recentlySeenEventIds == null ? Set.of() : recentlySeenEventIds;
        List<EncounterTemplate> unseenPool = pool.stream()
                .filter(template -> !seen.contains(template.contentId()))
                .toList();
        if (!unseenPool.isEmpty()) {
            pool = unseenPool;
        }
        EncounterTemplate template = pool.get(nextInt(pool.size()));
        return new Encounter(
                UUID.randomUUID().toString(),
                template.contentId(),
                template.type(),
                template.title(),
                template.text(),
                template.choices(),
                template.reward(),
                RiskLevel.fromRussian(template.risk()),
                null,
                null,
                List.of(template.type().name().toLowerCase())
        );
    }

    public int hiddenContentCount() {
        return movementPool().size() + hiddenEncounterPool().size() + returnEntries.size() + failedEntries.size();
    }

    public int openPvpContentCount() {
        return openPvpEncounterPool().size();
    }

    public Map<String, Object> catalogSummary() {
        Map<String, Object> summary = new LinkedHashMap<>();
        Map<String, Integer> hiddenByType = countsByType(hiddenEncounterPool());
        Map<String, Integer> openByType = countsByType(openPvpEncounterPool());
        summary.put("hiddenTotal", hiddenContentCount());
        summary.put("hiddenMovement", movementPool().size());
        summary.put("hiddenEncounters", hiddenEncounterPool().size());
        summary.put("openPvpTotal", openPvpContentCount());
        summary.put("returnEntries", returnEntries.size());
        summary.put("failedEntries", failedEntries.size());
        summary.put("hiddenByType", hiddenByType);
        summary.put("openPvpByType", openByType);
        return summary;
    }

    protected int nextInt(int bound) {
        return ThreadLocalRandom.current().nextInt(bound);
    }

    protected double nextDouble() {
        return ThreadLocalRandom.current().nextDouble();
    }

    private List<String> movementPool() {
        List<String> pool = new ArrayList<>(movementEntries);
        pool.addAll(stageFourMovementEntries);
        return pool;
    }

    private List<EncounterTemplate> encounterPool(ExplorationVisibilityMode visibilityMode) {
        return visibilityMode == ExplorationVisibilityMode.OPEN_PVP
                ? openPvpEncounterPool()
                : hiddenEncounterPool();
    }

    private List<EncounterTemplate> hiddenEncounterPool() {
        List<EncounterTemplate> pool = new ArrayList<>(hiddenEncounters);
        pool.addAll(stageFourHiddenEncounters);
        return pool;
    }

    private List<EncounterTemplate> openPvpEncounterPool() {
        List<EncounterTemplate> pool = new ArrayList<>(openPvpEncounters);
        pool.addAll(stageFourOpenPvpEncounters);
        return pool;
    }

    private Map<String, Integer> countsByType(List<EncounterTemplate> templates) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (EncounterTemplate template : templates) {
            counts.merge(template.type().name(), 1, Integer::sum);
        }
        return counts;
    }

    private List<EncounterTemplate> stageFourHiddenEncounters() {
        return List.of(
                loot(
                        "stage4_hidden_loot_still_crate",
                        "Ящик в тихой воде",
                        "Под тонким слоем воды стоит армейский ящик. Вокруг него не расходятся круги.",
                        choice("open", "Открыть крышку", ChoiceResultType.GAIN_RESOURCE, "средний",
                                resources(2, 1, 0), -2, "Внутри сухие крепления и плоский аварийный паек."),
                        choice("mark", "Снять только метку", ChoiceResultType.GAIN_RESOURCE, "низкий",
                                resources(1, 0, 0), 0, "Метка легко отходит и идет в лом."),
                        avoid()
                ),
                loot(
                        "stage4_hidden_loot_dry_pouch",
                        "Сухой подсумок",
                        "На ветке висит подсумок, вокруг которого дождь обходит воздухом.",
                        choice("take", "Снять подсумок", ChoiceResultType.GAIN_RESOURCE, "низкий",
                                resources(0, 2, 0), 0, "Припасы внутри удивительно сухие."),
                        choice("probe", "Проверить палкой", ChoiceResultType.GAIN_RESOURCE, "средний",
                                resources(1, 1, 0), -2, "Палка чернеет, но подсумок падает к ногам."),
                        avoid()
                ),
                loot(
                        "stage4_hidden_loot_copper_teeth",
                        "Медные зубья",
                        "Из ила торчат зубья старого механизма. Один еще теплый.",
                        choice("collect", "Собрать зубья", ChoiceResultType.GAIN_RESOURCE, "низкий",
                                resources(2, 0, 0), 0, "Медь годится для ремонта проводки."),
                        choice("turn", "Провернуть механизм", ChoiceResultType.LOSE_HP, "высокий",
                                resources(3, 0, 0), -7, "Механизм дергает настил и бьет по руке."),
                        avoid()
                ),
                loot(
                        "stage4_hidden_loot_medicine_float",
                        "Плавучая аптечка",
                        "Белый контейнер медленно плывет против течения и стучит о сваю.",
                        choice("catch", "Поймать контейнер", ChoiceResultType.GAIN_RESOURCE, "средний",
                                resources(0, 2, 0), -3, "Холодная вода тянет вниз, но контейнер остается целым."),
                        choice("hook", "Подцепить ремнем", ChoiceResultType.GAIN_RESOURCE, "низкий",
                                resources(0, 1, 0), 0, "Ремень выдерживает, внутри есть бинты."),
                        avoid()
                ),
                loot(
                        "stage4_hidden_loot_resin_nest",
                        "Смоляное гнездо",
                        "В корнях блестит комок смолы, сложенный аккуратными слоями.",
                        choice("slice", "Срезать внешний слой", ChoiceResultType.GAIN_RESOURCE, "средний",
                                resources(0, 0, 1), -2, "Смола липнет к ножу, но слой отделяется."),
                        choice("take_core", "Взять сердцевину", ChoiceResultType.LOSE_HP, "высокий",
                                resources(0, 0, 2), -9, "Сердцевина дергается и жжет ладонь."),
                        avoid()
                ),
                loot(
                        "stage4_hidden_loot_signal_battery",
                        "Сигнальная батарея",
                        "Батарея на ржавом поплавке раз в минуту щелкает разрядом.",
                        choice("disconnect", "Снять контакты", ChoiceResultType.GAIN_RESOURCE, "низкий",
                                resources(1, 1, 0), 0, "Контакты еще рабочие."),
                        choice("charge", "Слить остаток заряда", ChoiceResultType.GAIN_RESOURCE, "средний",
                                resources(2, 0, 0), -4, "Разряд проходит через перчатку, но батарея спасена."),
                        avoid()
                ),
                loot(
                        "stage4_hidden_loot_rope_cache",
                        "Веревочный тайник",
                        "Кусок веревки уходит под настил и возвращается сухим узлом.",
                        choice("pull", "Вытянуть тайник", ChoiceResultType.GAIN_RESOURCE, "средний",
                                resources(1, 2, 0), -3, "Узел застревает, но сдается после рывка."),
                        choice("cut", "Срезать узел", ChoiceResultType.GAIN_RESOURCE, "низкий",
                                resources(1, 0, 0), 0, "В узле спрятан металлический жетон."),
                        avoid()
                ),
                loot(
                        "stage4_hidden_loot_warm_ash",
                        "Теплый пепел",
                        "В старой жестянке лежит пепел, который не намок под дождем.",
                        choice("sift", "Просеять пепел", ChoiceResultType.GAIN_RESOURCE, "низкий",
                                resources(1, 0, 1), 0, "На дне остаются смоляные кристаллы и проволока."),
                        choice("take_tin", "Забрать жестянку целиком", ChoiceResultType.GAIN_RESOURCE, "средний",
                                resources(2, 0, 1), -3, "Жестянка обжигает кожу даже через ткань."),
                        avoid()
                ),
                object(
                        "stage4_hidden_object_flooded_icon",
                        "Икона под стеклом",
                        "В окне затопленного дома висит икона. Стекло сухое изнутри.",
                        choice("inspect", "Осмотреть раму", ChoiceResultType.FIND_OBJECT, "низкий",
                                resources(0, 1, 0), 0, "За рамой спрятан лист с координатами."),
                        choice("open", "Открыть окно", ChoiceResultType.LOSE_HP, "средний",
                                resources(1, 1, 0), -4, "Стекло осыпается внутрь, но тайник открыт."),
                        avoid()
                ),
                object(
                        "stage4_hidden_object_north_bell",
                        "Северный колокол",
                        "Маленький колокол висит на сухой березе и звенит без ветра.",
                        choice("listen", "Посчитать удары", ChoiceResultType.FIND_OBJECT, "низкий",
                                PlayerResources.empty(), 0, "Удары складываются в номер старой просеки."),
                        choice("ring", "Позвонить самому", ChoiceResultType.NOTHING, "средний",
                                PlayerResources.empty(), -2, "Ответный звон приходит из-под воды."),
                        avoid()
                ),
                object(
                        "stage4_hidden_object_half_bridge",
                        "Половина моста",
                        "Мост обрывается ровно на середине, но тень от него идет дальше.",
                        choice("step_shadow", "Наступить на тень", ChoiceResultType.FIND_OBJECT, "средний",
                                PlayerResources.empty(), -3, "Тень держит вес один шаг и показывает скрытую сваю."),
                        choice("search_bank", "Осмотреть берег", ChoiceResultType.GAIN_RESOURCE, "низкий",
                                resources(1, 0, 0), 0, "В берегу остались крепления моста."),
                        avoid()
                ),
                object(
                        "stage4_hidden_object_dead_radio",
                        "Мертвое радио",
                        "Радио без батареи шепчет прогноз погоды на вчера.",
                        choice("record", "Записать частоту", ChoiceResultType.FIND_OBJECT, "низкий",
                                PlayerResources.empty(), 0, "Частота остается в дневнике как зацепка."),
                        choice("strip", "Разобрать корпус", ChoiceResultType.GAIN_RESOURCE, "низкий",
                                resources(1, 0, 0), 0, "Внутри хватает деталей для ремонта."),
                        avoid()
                ),
                object(
                        "stage4_hidden_object_glass_reed",
                        "Стеклянный камыш",
                        "Один стебель камыша прозрачен, внутри него движется темная точка.",
                        choice("cut", "Срезать стебель", ChoiceResultType.FIND_OBJECT, "средний",
                                resources(0, 0, 1), -3, "Стебель рассыпается, оставив смоляной знак."),
                        choice("observe", "Дождаться точки", ChoiceResultType.NOTHING, "низкий",
                                PlayerResources.empty(), 0, "Точка повторяет твой маршрут и исчезает."),
                        avoid()
                ),
                object(
                        "stage4_hidden_object_rail_switch",
                        "Стрелка узкоколейки",
                        "Старая стрелка рельс уходит в воду. Рычаг перемазан свежей смолой.",
                        choice("switch", "Перевести рычаг", ChoiceResultType.FIND_OBJECT, "средний",
                                resources(1, 0, 0), -4, "Под водой звенит рельс, и на карте проявляется линия."),
                        choice("scrape", "Снять смолу", ChoiceResultType.GAIN_RESOURCE, "низкий",
                                resources(0, 0, 1), 0, "Смола легко отходит тонкой пленкой."),
                        avoid()
                ),
                object(
                        "stage4_hidden_object_birch_gate",
                        "Березовые ворота",
                        "Две березы склонились так ровно, будто образуют вход.",
                        choice("enter", "Пройти между ними", ChoiceResultType.FIND_OBJECT, "средний",
                                PlayerResources.empty(), -2, "За воротами слышен короткий голосовой код."),
                        choice("tie", "Повязать метку", ChoiceResultType.NOTHING, "низкий",
                                PlayerResources.empty(), 0, "Метка не намокает и остается видимой."),
                        avoid()
                ),
                object(
                        "stage4_hidden_object_drowned_clock",
                        "Утопленные часы",
                        "Карманные часы лежат на дне и идут в обратную сторону.",
                        choice("take", "Достать часы", ChoiceResultType.FIND_OBJECT, "средний",
                                resources(1, 0, 0), -3, "Стрелки останавливаются на времени твоего выхода."),
                        choice("watch", "Сверить маршрут", ChoiceResultType.NOTHING, "низкий",
                                PlayerResources.empty(), 0, "Через минуту часы показывают обычное время."),
                        avoid()
                ),
                anomaly(
                        "stage4_hidden_anomaly_silent_birds",
                        "Беззвучные птицы",
                        "Над топью кружат птицы без звука и без отражения в воде.",
                        choice("hide", "Спрятаться под настил", ChoiceResultType.AVOID, "низкий",
                                PlayerResources.empty(), 0, "Птицы уходят к северу."),
                        choice("follow_shadow", "Идти за тенью", ChoiceResultType.GAIN_RESOURCE, "высокий",
                                resources(0, 0, 1), -6, "Тень приводит к смоляной капле."),
                        avoid()
                ),
                anomaly(
                        "stage4_hidden_anomaly_warm_snow",
                        "Теплый снег",
                        "На черной воде лежит снег, теплый на вид и тяжелый как зола.",
                        choice("sample", "Взять пробу", ChoiceResultType.GAIN_RESOURCE, "средний",
                                resources(0, 0, 1), -2, "Проба застывает в колбе."),
                        choice("cross", "Перейти по снегу", ChoiceResultType.LOSE_HP, "высокий",
                                resources(1, 0, 1), -8, "Снег держит шаги, но обжигает ступни."),
                        avoid()
                ),
                anomaly(
                        "stage4_hidden_anomaly_return_echo",
                        "Эхо возвращения",
                        "Твой голос отвечает из стороны базы, хотя ты молчал.",
                        choice("answer", "Ответить шепотом", ChoiceResultType.FIND_OBJECT, "средний",
                                PlayerResources.empty(), 0, "Эхо называет безопасный поворот."),
                        choice("shout", "Крикнуть громче", ChoiceResultType.LOSE_HP, "высокий",
                                PlayerResources.empty(), -7, "Ответ бьет по вискам и глушит слух."),
                        avoid()
                ),
                anomaly(
                        "stage4_hidden_anomaly_breathing_mud",
                        "Дышащий ил",
                        "Ил вспучивается ровными вдохами и пахнет озоном.",
                        choice("time_step", "Идти между вдохами", ChoiceResultType.GAIN_RESOURCE, "средний",
                                resources(1, 0, 0), -2, "Между вдохами видны сухие обломки."),
                        choice("dig", "Раскопать центр", ChoiceResultType.LOSE_HP, "высокий",
                                resources(2, 0, 1), -9, "Ил захлопывается вокруг руки."),
                        avoid()
                ),
                anomaly(
                        "stage4_hidden_anomaly_reverse_rain",
                        "Дождь вверх",
                        "Капли срываются с воды и летят в небо, оставляя сухой круг.",
                        choice("stand", "Встать в круг", ChoiceResultType.FIND_OBJECT, "средний",
                                PlayerResources.empty(), -2, "На одежде проступает карта капель."),
                        choice("collect", "Собрать капли", ChoiceResultType.GAIN_RESOURCE, "высокий",
                                resources(0, 0, 2), -8, "Капли тяжелые и режут стекло колбы."),
                        avoid()
                ),
                anomaly(
                        "stage4_hidden_anomaly_wrong_stars",
                        "Неверные звезды",
                        "В воде отражаются звезды, которых нет на небе.",
                        choice("chart", "Сверить с картой", ChoiceResultType.FIND_OBJECT, "низкий",
                                PlayerResources.empty(), 0, "Звезды отмечают старую линию кордона."),
                        choice("touch", "Разбить отражение", ChoiceResultType.LOSE_HP, "средний",
                                resources(0, 0, 1), -5, "Осколки света остаются на ладони."),
                        avoid()
                ),
                monster(
                        "stage4_hidden_monster_toplyak",
                        "Топляк",
                        "Из-под воды поднимается человекообразный ком ила. Он держит в руке чужую веревку.",
                        choice("freeze", "Не двигаться", ChoiceResultType.AVOID, "средний",
                                PlayerResources.empty(), 0, "Топляк теряет тебя среди свай."),
                        choice("cut_rope", "Перерезать веревку", ChoiceResultType.MONSTER_FIGHT_TEXT, "высокий",
                                resources(1, 0, 0), -7, "Существо проваливается, оставив мокрый жетон."),
                        avoid()
                ),
                monster(
                        "stage4_hidden_monster_blind_hunter",
                        "Слепой егерь",
                        "На просеке стоит фигура в старом плаще. Вместо глаз у нее заросшая кора.",
                        choice("silent", "Пройти без звука", ChoiceResultType.AVOID, "низкий",
                                PlayerResources.empty(), 0, "Егерь поворачивается на шум воды, но не на тебя."),
                        choice("decoy", "Бросить металлическую приманку", ChoiceResultType.MONSTER_FIGHT_TEXT, "средний",
                                resources(1, 0, 0), -3, "Плащ уходит за звоном, а у пня остается патронташ."),
                        avoid()
                ),
                monster(
                        "stage4_hidden_monster_bottom_boy",
                        "Донный мальчик",
                        "У края воды сидит ребенок из темного ила и считает твои шаги.",
                        choice("stop_count", "Сбить счет", ChoiceResultType.FIND_OBJECT, "средний",
                                PlayerResources.empty(), 0, "Он забывает число и оставляет знак на воде."),
                        choice("approach", "Подойти ближе", ChoiceResultType.LOSE_HP, "высокий",
                                resources(0, 1, 0), -8, "Ил хватает за сапог и тянет вниз."),
                        avoid()
                ),
                monster(
                        "stage4_hidden_monster_birch_mother",
                        "Берестяная мать",
                        "Березовая кора на стволах складывается в лицо и шепчет имена пропавших.",
                        choice("answer_name", "Назвать чужое имя", ChoiceResultType.AVOID, "средний",
                                PlayerResources.empty(), 0, "Кора закрывает глаза и пропускает тебя."),
                        choice("tear_bark", "Сорвать кусок коры", ChoiceResultType.MONSTER_FIGHT_TEXT, "высокий",
                                resources(0, 0, 1), -7, "Кора режет пальцы, но под ней есть смоляная жилка."),
                        avoid()
                ),
                monster(
                        "stage4_hidden_monster_reed_walker",
                        "Камышовый ходок",
                        "Высокий силуэт перебирает ногами-стеблями и шагает поверх воды.",
                        choice("lie_down", "Лечь в тень", ChoiceResultType.AVOID, "низкий",
                                PlayerResources.empty(), 0, "Ходок проходит мимо, не меняя ритма."),
                        choice("trip", "Сбить стебель крюком", ChoiceResultType.MONSTER_FIGHT_TEXT, "высокий",
                                resources(1, 0, 1), -6, "Существо рассыпается камышом, оставив смолу."),
                        avoid()
                ),
                monster(
                        "stage4_hidden_monster_iron_mosquitoes",
                        "Железный комарник",
                        "Над водой собирается рой с металлическим звоном. Он реагирует на тепло.",
                        choice("cool", "Охладить руки водой", ChoiceResultType.AVOID, "низкий",
                                PlayerResources.empty(), 0, "Рой теряет цель."),
                        choice("smoke", "Потратить сухой дымарь", ChoiceResultType.MONSTER_FIGHT_TEXT, "средний",
                                resources(0, 1, 0), -2, "Дым отгоняет рой и открывает старый пакет."),
                        avoid()
                ),
                mapFragment(
                        "stage4_hidden_map_fragment_leaf",
                        "Карта на листе",
                        "На широком листе черной ольхи проступает схема обхода.",
                        choice("press", "Прижать в дневник", ChoiceResultType.FIND_OBJECT, "низкий",
                                PlayerResources.empty(), 0, "Рисунок переносится на страницу."),
                        choice("copy", "Срисовать линию", ChoiceResultType.NOTHING, "низкий",
                                PlayerResources.empty(), 0, "Линия выходит неровной, но полезной."),
                        avoid()
                ),
                mapFragment(
                        "stage4_hidden_map_fragment_bone",
                        "Костяная метка",
                        "На белой пластине процарапаны три поворота и знак старой дамбы.",
                        choice("take", "Забрать пластину", ChoiceResultType.FIND_OBJECT, "средний",
                                resources(1, 0, 0), -2, "Пластина холоднее воды и оставляет след на карте."),
                        choice("rub", "Снять оттиск", ChoiceResultType.FIND_OBJECT, "низкий",
                                PlayerResources.empty(), 0, "Оттиск ложится в дневник."),
                        avoid()
                ),
                mapFragment(
                        "stage4_hidden_map_fragment_thread",
                        "Красная нить",
                        "Нить идет между сваями и повторяет безопасный поворот.",
                        choice("follow", "Идти по нити", ChoiceResultType.FIND_OBJECT, "средний",
                                PlayerResources.empty(), -2, "Нить приводит к короткому сухому участку."),
                        choice("cut_piece", "Срезать образец", ChoiceResultType.GAIN_RESOURCE, "низкий",
                                resources(1, 0, 0), 0, "Образец пригодится картографическому столу."),
                        avoid()
                ),
                mapFragment(
                        "stage4_hidden_map_fragment_window",
                        "Окно маршрута",
                        "В разбитом окне отражается другой участок топи с четкими ориентирами.",
                        choice("align", "Совместить отражение", ChoiceResultType.FIND_OBJECT, "низкий",
                                PlayerResources.empty(), 0, "Ориентиры записаны в карту."),
                        choice("break_more", "Расширить окно", ChoiceResultType.LOSE_HP, "средний",
                                resources(1, 0, 0), -4, "Стекло режет перчатку, но отражение становится шире."),
                        avoid()
                ),
                baseMemory(
                        "stage4_hidden_base_memory_generator",
                        "Память генератора",
                        "В воде слышен ровный шум генератора базы, хотя до нее слишком далеко.",
                        choice("sync", "Подстроить шаг под шум", ChoiceResultType.FIND_OBJECT, "низкий",
                                PlayerResources.empty(), 0, "Ритм помогает запомнить обратный путь."),
                        choice("ignore", "Не слушать", ChoiceResultType.NOTHING, "низкий",
                                PlayerResources.empty(), 0, "Шум растворяется в тумане.")
                ),
                baseMemory(
                        "stage4_hidden_base_memory_names",
                        "Список смены",
                        "На мокрой двери проступает список людей, которые дежурили здесь до топи.",
                        choice("copy", "Переписать фамилии", ChoiceResultType.FIND_OBJECT, "низкий",
                                PlayerResources.empty(), 0, "Список станет записью для базы."),
                        choice("clean", "Стереть грязь", ChoiceResultType.GAIN_RESOURCE, "средний",
                                resources(1, 0, 0), -2, "Под грязью оказывается металлическая табличка."),
                        avoid()
                ),
                baseMemory(
                        "stage4_hidden_base_memory_bunk",
                        "Сухая койка",
                        "В затопленной комнате одна койка остается сухой и аккуратно застеленной.",
                        choice("inspect", "Осмотреть тумбу", ChoiceResultType.FIND_OBJECT, "низкий",
                                resources(0, 1, 0), 0, "В тумбе лежит старая инструкция по дежурствам."),
                        choice("rest", "Сесть на минуту", ChoiceResultType.NOTHING, "средний",
                                PlayerResources.empty(), 0, "Койка скрипит чужим весом."),
                        avoid()
                ),
                baseMemory(
                        "stage4_hidden_base_memory_photo",
                        "Фотография базы",
                        "В рамке под пленкой лежит фотография убежища до перестройки.",
                        choice("take_photo", "Забрать фото", ChoiceResultType.FIND_OBJECT, "низкий",
                                PlayerResources.empty(), 0, "На обратной стороне отмечен старый склад."),
                        choice("take_frame", "Снять рамку", ChoiceResultType.GAIN_RESOURCE, "низкий",
                                resources(1, 0, 0), 0, "Рамка разбирается на тонкий металл."),
                        avoid()
                )
        );
    }

    private List<EncounterTemplate> stageFourOpenPvpEncounters() {
        return List.of(
                pvpTrace(
                        "stage4_open_trace_fresh_shell",
                        "Свежая гильза",
                        "На мокрой доске лежит теплая гильза. Выстрел был рядом и совсем недавно.",
                        choice("track", "Идти по линии выстрела", ChoiceResultType.START_PVP_DUEL, "высокий",
                                resources(1, 0, 0), 0, "Линия выводит к чужой позиции."),
                        choice("pocket", "Забрать гильзу и уйти", ChoiceResultType.GAIN_RESOURCE, "средний",
                                resources(1, 0, 0), -2, "Гильза обжигает пальцы."),
                        avoid()
                ),
                pvpTrace(
                        "stage4_open_trace_bait_pack",
                        "Рюкзак-приманка",
                        "На сухой кочке лежит открытый рюкзак. Лямка специально выведена на видное место.",
                        choice("spring", "Сорвать приманку", ChoiceResultType.START_PVP_DUEL, "высокий",
                                resources(2, 1, 0), 0, "Камыш рядом отвечает щелчком."),
                        choice("mark", "Пометить место", ChoiceResultType.NOTHING, "низкий",
                                PlayerResources.empty(), 0, "Ты оставляешь знак и обходишь кочку."),
                        avoid()
                ),
                pvpTrace(
                        "stage4_open_trace_cut_reed",
                        "Срезанный камыш",
                        "Камыш срезан ровной линией на высоте плеча. Кто-то делал коридор для прицела.",
                        choice("peek", "Проверить коридор", ChoiceResultType.START_PVP_DUEL, "высокий",
                                resources(1, 0, 0), 0, "В конце коридора шевелится силуэт."),
                        choice("crawl", "Проползти ниже линии", ChoiceResultType.AVOID, "средний",
                                PlayerResources.empty(), -3, "Грязь скрывает тебя от прицела."),
                        avoid()
                ),
                pvpTrace(
                        "stage4_open_trace_coin_line",
                        "Линия монет",
                        "По настилу разложены старые монеты. Они ведут к открытому проходу.",
                        choice("collect", "Собрать монеты", ChoiceResultType.GAIN_RESOURCE, "высокий",
                                resources(2, 0, 0), -5, "Последняя монета привязана к звонку."),
                        choice("follow", "Идти вдоль линии", ChoiceResultType.START_PVP_DUEL, "высокий",
                                PlayerResources.empty(), 0, "Проход заканчивается чужим укрытием."),
                        avoid()
                ),
                pvpTrace(
                        "stage4_open_trace_low_whistle",
                        "Низкий свист",
                        "Три коротких свиста идут с разных сторон. Это не птицы.",
                        choice("answer", "Ответить условным свистом", ChoiceResultType.START_PVP_DUEL, "высокий",
                                resources(1, 1, 0), 0, "Ответ принимают слишком быстро."),
                        choice("mute", "Заткнуть металл тканью", ChoiceResultType.AVOID, "низкий",
                                PlayerResources.empty(), 0, "Свисты проходят мимо."),
                        avoid()
                ),
                pvpTrace(
                        "stage4_open_trace_warm_fire",
                        "Теплый костер",
                        "У воды дымится костер. Следы вокруг свежие, но хозяина нет.",
                        choice("wait", "Ждать хозяина", ChoiceResultType.START_PVP_DUEL, "высокий",
                                resources(0, 1, 0), 0, "Хозяин возвращается не один."),
                        choice("take_coals", "Забрать угли", ChoiceResultType.GAIN_RESOURCE, "средний",
                                resources(0, 1, 0), -2, "Угли пригодятся, но дым выдаёт место."),
                        avoid()
                ),
                pvpEncounter(
                        "stage4_open_encounter_crossfire",
                        "Перекрестный прострел",
                        "Два выстрела ложатся в воду с разных сторон. Кто-то гонит тебя к центру.",
                        choice("push_left", "Рвануть влево", ChoiceResultType.START_PVP_DUEL, "высокий",
                                resources(1, 0, 0), 0, "Слева открывается чужой стрелок."),
                        choice("drop", "Упасть в воду", ChoiceResultType.AVOID, "средний",
                                PlayerResources.empty(), -5, "Вода скрывает силуэт, но забирает тепло.")
                ),
                pvpEncounter(
                        "stage4_open_encounter_shared_cache",
                        "Общий тайник",
                        "Ты и другой выживший одновременно находите один тайник под мостком.",
                        choice("split", "Предложить разделить", ChoiceResultType.GAIN_RESOURCE, "средний",
                                resources(1, 1, 0), 0, "Вы расходитесь без выстрелов."),
                        choice("claim", "Забрать первым", ChoiceResultType.START_PVP_DUEL, "высокий",
                                resources(2, 1, 0), 0, "Чужая рука уже на оружии."),
                        avoid()
                ),
                pvpEncounter(
                        "stage4_open_encounter_masked_survivor",
                        "Выживший в маске",
                        "На сухой полосе стоит человек в старой противогазной маске. Он показывает на твой рюкзак.",
                        choice("pay", "Оставить часть добычи", ChoiceResultType.AVOID, "средний",
                                PlayerResources.empty(), 0, "Он пропускает тебя, не опуская ствол."),
                        choice("refuse", "Отказать", ChoiceResultType.START_PVP_DUEL, "высокий",
                                resources(1, 0, 0), 0, "Маска кивает, и начинается стычка.")
                ),
                pvpEncounter(
                        "stage4_open_encounter_bridge_tax",
                        "Плата за мост",
                        "У короткого моста сидит вооруженный выживший и требует припасы за проход.",
                        choice("trade", "Отдать мелочь и пройти", ChoiceResultType.GAIN_RESOURCE, "средний",
                                resources(0, 1, 0), 0, "Он берет меньше, чем мог, и показывает сухую доску."),
                        choice("fight", "Прорываться", ChoiceResultType.START_PVP_DUEL, "высокий",
                                resources(2, 0, 0), 0, "Мост становится линией боя."),
                        avoid()
                ),
                pvpAftermath(
                        "stage4_open_aftermath_broken_scope",
                        "Разбитый прицел",
                        "В траве лежит прицел с трещиной. Рядом следы короткой стычки.",
                        choice("take", "Забрать детали", ChoiceResultType.GAIN_RESOURCE, "низкий",
                                resources(1, 0, 0), 0, "Оптика уже не работает, но крепления целы."),
                        choice("read_marks", "Прочитать следы", ChoiceResultType.FIND_OBJECT, "низкий",
                                PlayerResources.empty(), 0, "Следы показывают, где уходят победители."),
                        avoid()
                ),
                pvpAftermath(
                        "stage4_open_aftermath_empty_bandage",
                        "Пустой бинт",
                        "Белый бинт висит на ветке и капает темной водой.",
                        choice("follow_blood", "Пойти по следу", ChoiceResultType.START_PVP_DUEL, "высокий",
                                PlayerResources.empty(), 0, "Раненый выживший все еще опасен."),
                        choice("take_cloth", "Снять ткань", ChoiceResultType.GAIN_RESOURCE, "низкий",
                                resources(0, 1, 0), 0, "Чистая часть пригодится на базе."),
                        avoid()
                ),
                pvpAftermath(
                        "stage4_open_aftermath_spent_trap",
                        "Сработавшая ловушка",
                        "Проволочная ловушка уже сработала. В воде остались обломки чужого снаряжения.",
                        choice("salvage", "Разобрать ловушку", ChoiceResultType.GAIN_RESOURCE, "средний",
                                resources(2, 0, 0), -2, "Острый конец все еще натянут."),
                        choice("map", "Отметить ловушку", ChoiceResultType.FIND_OBJECT, "низкий",
                                PlayerResources.empty(), 0, "Отметка поможет обходить опасный коридор."),
                        avoid()
                ),
                riskReward(
                        "stage4_open_risk_reward_loud_cache",
                        "Громкий тайник",
                        "Ящик с припасами обмотан сухими банками. Открыть тихо почти невозможно.",
                        choice("open_fast", "Открыть быстро", ChoiceResultType.GAIN_RESOURCE, "высокий",
                                resources(3, 2, 0), -6, "Банки гремят, но добыча у тебя."),
                        choice("cut_slow", "Срезать банки", ChoiceResultType.GAIN_RESOURCE, "средний",
                                resources(1, 1, 0), 0, "Ты берешь меньше, зато без шума."),
                        avoid()
                ),
                riskReward(
                        "stage4_open_risk_reward_clear_bridge",
                        "Светлый мост",
                        "Прямой мост экономит время, но виден со всех сторон.",
                        choice("dash", "Пробежать мост", ChoiceResultType.GAIN_RESOURCE, "высокий",
                                resources(2, 0, 1), -5, "Ты успеваешь снять смолу на другом конце."),
                        choice("crawl", "Ползти у перил", ChoiceResultType.AVOID, "средний",
                                PlayerResources.empty(), -2, "Мост пройден без добычи, зато без стычки."),
                        avoid()
                ),
                riskReward(
                        "stage4_open_risk_reward_flare_box",
                        "Коробка с ракетами",
                        "Сигнальные ракеты лежат на сухой платформе. Их свет увидит вся топь.",
                        choice("fire", "Выстрелить ракетой", ChoiceResultType.START_PVP_DUEL, "высокий",
                                resources(1, 1, 0), 0, "Свет зовет не только помощь."),
                        choice("pack", "Унести коробку", ChoiceResultType.GAIN_RESOURCE, "средний",
                                resources(1, 2, 0), -3, "Коробка тяжелая и скрипит на ремне."),
                        avoid()
                )
        );
    }

    private static EncounterTemplate loot(String id, String title, String text, EncounterChoice... choices) {
        return template(id, EncounterType.LOOT, title, text, "средний", choices);
    }

    private static EncounterTemplate object(String id, String title, String text, EncounterChoice... choices) {
        return template(id, EncounterType.OBJECT, title, text, "средний", choices);
    }

    private static EncounterTemplate anomaly(String id, String title, String text, EncounterChoice... choices) {
        return template(id, EncounterType.ANOMALY, title, text, "высокий", choices);
    }

    private static EncounterTemplate monster(String id, String title, String text, EncounterChoice... choices) {
        return template(id, EncounterType.MONSTER, title, text, "высокий", choices);
    }

    private static EncounterTemplate quiet(String id, String title, String text, EncounterChoice... choices) {
        return template(id, EncounterType.QUIET_EVENT, title, text, "низкий", choices);
    }

    private static EncounterTemplate pvpTrace(String id, String title, String text, EncounterChoice... choices) {
        return template(id, EncounterType.PVP_TRACE, title, text, "высокий", choices);
    }

    private static EncounterTemplate pvpEncounter(String id, String title, String text, EncounterChoice... choices) {
        return template(id, EncounterType.PVP_ENCOUNTER, title, text, "высокий", choices);
    }

    private static EncounterTemplate mapFragment(String id, String title, String text, EncounterChoice... choices) {
        return template(id, EncounterType.MAP_FRAGMENT, title, text, "средний", choices);
    }

    private static EncounterTemplate baseMemory(String id, String title, String text, EncounterChoice... choices) {
        return template(id, EncounterType.BASE_MEMORY, title, text, "низкий", choices);
    }

    private static EncounterTemplate pvpAftermath(String id, String title, String text, EncounterChoice... choices) {
        return template(id, EncounterType.PVP_AFTERMATH, title, text, "средний", choices);
    }

    private static EncounterTemplate riskReward(String id, String title, String text, EncounterChoice... choices) {
        return template(id, EncounterType.RISK_REWARD, title, text, "высокий", choices);
    }

    private static EncounterTemplate template(
            String id,
            EncounterType type,
            String title,
            String text,
            String risk,
            EncounterChoice... choices
    ) {
        return new EncounterTemplate(
                id,
                type,
                title,
                text,
                List.of(choices),
                PlayerResources.empty(),
                risk
        );
    }

    private static EncounterChoice choice(
            String id,
            String text,
            ChoiceResultType resultType,
            String riskLevel,
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
                "низкий",
                PlayerResources.empty(),
                0,
                "Ты оставляешь находку позади и продолжаешь путь."
        );
    }

    private static PlayerResources resources(int scrap, int supplies, int swampResin) {
        return new PlayerResources(scrap, supplies, swampResin);
    }

    private record EncounterTemplate(
            String contentId,
            EncounterType type,
            String title,
            String text,
            List<EncounterChoice> choices,
            PlayerResources reward,
            String risk
    ) {
    }
}
