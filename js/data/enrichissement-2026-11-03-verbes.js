/* Enrichissement du 03/11/2026 (demande du PO) — verbes « respirer », « suer » et le sens « mentir » de lie.
   Chargé juste après enrichissement-2026-10-30-verbes.js et avant verbes-themes.js (qui pose les thèmes).
   Les nouveaux verbes vont en fin de DICT : les index des verbes déjà appris ne bougent pas.
   « lie » = s'allonger (lie, lay, lain) existe déjà ; « lie » = mentir (lie, lied, lied) est un autre verbe qui s'écrit pareil.
   Comme l'app identifie un verbe par son nom (DMAP, fiches ouvertes), « mentir » est ajouté sur la même fiche,
   dans un encadré « alt » avec ses propres formes et exemples ; la recherche « mentir » ou « lied » trouve la fiche. */
"use strict";
const D0_ENR2 = DICT.length;
DICT.push(...[
{"v":"breathe","fr":"respirer","ipa":"briːð","pr":"brîz (th doux)","pt":"breathed","pp":"breathed","irr":false,"ex":[["*Breathe* slowly and relax.","*Respire* lentement et détends-toi."],["We *breathed* the fresh air in the mountains.","Nous *avons respiré* l'air frais à la montagne."]],"q":1},
{"v":"sweat","fr":"suer, transpirer","ipa":"swet","pr":"souètt","pt":"sweated","pp":"sweated","irr":false,"ex":[["I *sweat* a lot when I play football.","Je *transpire* beaucoup quand je joue au foot."],["We *sweated* in the sun all afternoon.","Nous *avons sué* au soleil tout l'après-midi."]],"q":1}
]);
DICT.slice(D0_ENR2).forEach((d, k) => indexVerb(d, D0_ENR2 + k));
(function () {
    const d = DMAP.lie;
    if (!d)
        return;
    d.alt = {"fr":"mentir","pt":"lied","pp":"lied","ex":[["Don't *lie* to me!","Ne me *mens* pas !"],["He *lied* about his homework.","Il *a menti* à propos de ses devoirs."]]};
    d.keys.push(...["mentir", "lied"].map(norm));
})();
