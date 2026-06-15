package com.example.sandalpunk.exploration;

import java.util.List;
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

    public String nextMovementEntry() {
        return movementEntries.get(nextInt(movementEntries.size()));
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
        List<EncounterTemplate> pool = visibilityMode == ExplorationVisibilityMode.OPEN_PVP
                ? openPvpEncounters
                : hiddenEncounters;
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
        EncounterTemplate template = pool.get(nextInt(pool.size()));
        return new Encounter(
                UUID.randomUUID().toString(),
                template.contentId(),
                template.type(),
                template.title(),
                template.text(),
                template.choices(),
                template.reward(),
                template.risk()
        );
    }

    public int hiddenContentCount() {
        return movementEntries.size() + hiddenEncounters.size();
    }

    public int openPvpContentCount() {
        return openPvpEncounters.size();
    }

    protected int nextInt(int bound) {
        return ThreadLocalRandom.current().nextInt(bound);
    }

    protected double nextDouble() {
        return ThreadLocalRandom.current().nextDouble();
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
