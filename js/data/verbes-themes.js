/* Thèmes des verbes (demande du PO, 03/11/2026) : un thème par verbe, comme les noms (NCAT).
   Script classique, chargé après js/data/dict.js et l'enrichissement des verbes : il pose d.cat sur chaque verbe de DICT.
   Les 97 verbes de dissertation (d.r === "e") vont tous dans « Essay verbs ». Un verbe absent de la liste → « Everyday verbs ». */
"use strict";
const VCAT = {
    basics: { label: "Everyday verbs", icon: "⭐" },
    feelings: { label: "Feelings", icon: "❤" },
    mind: { label: "Thinking", icon: "🧠" },
    talking: { label: "Talking & people", icon: "💬" },
    senses: { label: "Senses", icon: "👀" },
    moving: { label: "Moving & body", icon: "🏃" },
    hands: { label: "Hands & actions", icon: "✋" },
    routine: { label: "Daily routine", icon: "🌅" },
    food: { label: "Food & cooking", icon: "🍽" },
    home: { label: "Home", icon: "🏠" },
    school: { label: "School", icon: "🎓" },
    sports: { label: "Sports & games", icon: "⚽" },
    arts: { label: "Arts & music", icon: "🎨" },
    money: { label: "Shopping & money", icon: "💰" },
    travel: { label: "Travel", icon: "✈" },
    nature: { label: "Nature & weather", icon: "⛅" },
    time: { label: "Time & change", icon: "⏳" },
    work: { label: "Work & tech", icon: "💻" },
    life: { label: "Life events", icon: "🎂" },
    rules: { label: "Rules & justice", icon: "⚖" },
    history: { label: "History & war", icon: "🏰" },
    essay: { label: "Essay verbs", icon: "✍" }
};
const VTHEMES = {
    basics: "be have do make get can let use need want try keep seem help show find include require",
    feelings: "feel like love hate enjoy prefer hope wish worry miss cry laugh smile hug kiss forgive scare",
    mind: "think know believe understand remember forget mean decide choose imagine guess wonder realize dream expect consider compare plan avoid identify discover search seek",
    talking: "say tell ask talk speak call answer reply shout scream whisper explain describe discuss agree disagree accept refuse deny promise joke greet invite introduce mention announce comment complain apologize thank excuse inform remind request ring chat meet join share support name",
    senses: "see look watch hear listen smell taste touch notice observe stink",
    moving: "go come walk run jump climb fall move arrive leave return enter cross follow hurry turn stand sit lie reach slide spin spring swing circle escape hide hurt bite spit bleed",
    hands: "take give put bring hold carry pick drop push pull throw catch lift open close shut lock break cut fold fill hang shake wave clap point knock hit stick tear dig set raise cover remove offer collect build handle",
    routine: "live wake sleep rest relax wash brush dress wear yawn sneeze wait",
    food: "eat drink cook bake boil mix feed serve prepare grind spill spread spoil",
    home: "clean tidy sweep fix light burn recycle",
    school: "learn study read write teach spell count add calculate measure estimate copy correct check practise practice revise repeat review note pass fail present attend analyze evaluate",
    sports: "play win lose score beat kick swim ski sail skate row dive jog fish camp bounce",
    arts: "dance sing draw paint colour create perform act design record juggle",
    money: "buy sell pay spend cost shop save borrow lend owe earn afford purchase refund invest profit order exchange withdraw",
    travel: "travel visit drive ride fly land book board pack explore sink float",
    nature: "rain snow shine freeze blow rise grow",
    time: "begin start stop finish end continue last stay remain become change happen appear occur increase decrease improve develop reduce achieve complete shrink",
    work: "work provide lead produce adjust apply approve attach cancel collaborate connect contact control coordinate deal deliver download edit email export fire forecast format forward hire implement install link maintain manage market message negotiate notify organize post print process promote publish resign schedule ship sign send type",
    life: "die marry date celebrate bury mourn pray inherit",
    rules: "allow forbid obey vote respect judge punish arrest accuse sentence sue release confess investigate rob steal protect prevent rescue",
    history: "attack defend invade conquer surrender march destroy fight kill shoot rule hunt gather invent capture free flee surround"
};
(function () {
    const of = {};
    for (const [c, s] of Object.entries(VTHEMES))
        for (const v of s.split(" "))
            of[v] = c;
    for (const d of DICT)
        d.cat = d.r === "e" ? "essay" : of[d.v] || "basics";
})();
