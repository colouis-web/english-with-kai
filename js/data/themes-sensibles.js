/* Données — thèmes et mots « sensibles » pour un enfant (Ludo, 30/10/2026, analyse UX I-03, bug « mots du jour »).
   Script classique : à charger AVANT js/app-usage.js (lvOkWord s'en sert).

   Règle : jusqu'au niveau SENSITIVE.maxLevel inclus (0 = Beginner, 1 = Elementary), un mot sensible n'est
   JAMAIS proposé automatiquement : ni en mot du jour (nouveau ou à revoir), ni dans un quiz « All … »,
   ni comme mauvaise réponse (distracteur), ni en dictée. Il reste consultable dans les dictionnaires et dans
   un quiz dont l'élève choisit lui-même le thème (ex. « War »).

   Un mot est sensible si :
   1. son thème (cat, ou un des thèmes de « also ») est dans SENSITIVE.themes[nature]
      ET le mot n'est pas dans SENSITIVE.keep (mots du thème sans danger pour un enfant : money, peace, police…) ;
   2. OU le mot est dans SENSITIVE.words[nature] (mots sensibles rangés dans un thème neutre, surtout des verbes).

   Pour modifier : ajouter / retirer un mot dans la bonne liste (orthographe exacte du champ w, ou v pour un verbe).
   Aucune donnée d'élève n'est touchée : un mot exclu reste dans sa mémoire et revient dès le niveau 2. */
"use strict";
const SENSITIVE = {
    maxLevel: 1,
    /* thèmes entiers : mort, guerre, crime et justice pénale, argent « adulte » (impôts, dettes, assurances) */
    themes: {
        nouns: ["endoflife", "war", "justice", "finance"],
        adjectives: ["endoflife", "justice", "money"]
    },
    /* exceptions : mots de ces thèmes qui font partie de la vie d'un enfant de 11 ans (programme de 6e) */
    keep: {
        nouns: [
            /* war */ "medal", "uniform", "peace", "flag", "hero", "helmet", "victory", "defeat", "shield", "armour",
            /* finance */ "bank", "money", "coin", "banknote", "cash", "price", "cost", "bill", "receipt", "wallet", "purse",
            "piggy bank", "pocket money", "savings", "change", "euro", "pound", "dollar", "penny", "cent", "discount",
            "sale", "customer", "bargain", "cashier", "safe",
            /* endoflife : Halloween et vie quotidienne */ "church", "candle", "life", "birth", "memory", "angel", "ghost",
            "skeleton", "illness", "priest",
            /* justice : règles, police, vérité */ "police station", "police officer", "police", "detective", "rule", "law",
            "right", "duty", "citizen", "truth", "lie", "permission", "ban", "government", "justice", "lawyer", "judge"
        ],
        adjectives: [
            /* money */ "rich", "poor", "free", "affordable", "valuable", "priceless", "greedy", "costly",
            /* endoflife */ "alive", "elderly", "lonely", "unhappy", "heartbroken", "peaceful",
            /* justice */ "fair", "unfair", "honest", "dishonest", "strict", "safe", "serious", "responsible", "legal", "illegal"
        ]
    },
    /* mots sensibles rangés dans un thème neutre */
    words: {
        verbs: ["die", "steal", "shoot", "attack", "invade", "conquer", "surrender", "bleed", "threaten", "bury", "mourn",
            "pray", "inherit", "arrest", "accuse", "punish", "sentence", "confess", "rob", "sue", "endanger", "jeopardize"],
        nouns: [],
        adjectives: []
    }
};
/* index pour un test rapide (construit une fois) */
SENSITIVE._t = {};
SENSITIVE._k = {};
SENSITIVE._w = {};
for (const k of Object.keys(SENSITIVE.themes))
    SENSITIVE._t[k] = new Set(SENSITIVE.themes[k]);
for (const k of Object.keys(SENSITIVE.keep))
    SENSITIVE._k[k] = new Set(SENSITIVE.keep[k]);
for (const k of Object.keys(SENSITIVE.words))
    SENSITIVE._w[k] = new Set(SENSITIVE.words[k]);
/* vrai si le mot ne doit pas être proposé automatiquement à un jeune élève */
function isSensitive(kind, d) {
    if (!d)
        return false;
    const w = d.v || d.w;
    if (SENSITIVE._w[kind] && SENSITIVE._w[kind].has(w))
        return true;
    const T = SENSITIVE._t[kind];
    if (!T || (SENSITIVE._k[kind] && SENSITIVE._k[kind].has(w)))
        return false;
    return T.has(d.cat) || (d.also || []).some(c => T.has(c));
}
/* vrai si le mot peut être proposé automatiquement à un élève de ce niveau */
const sensOk = (kind, d, lv) => lv > SENSITIVE.maxLevel || !isSensitive(kind, d);
