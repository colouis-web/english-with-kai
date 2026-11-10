/* Liste 640 du PO (09/11/2026), lot C : verbes (surge, soar). Compte rendu : docs/enrichissement/liste-640-lot-c.md
   Chargé après enrichissement-2026-11-09-verbes.js et avant verbes-themes.js (r "e" → thème « Essay verbs »).
   Ajoutés en fin de DICT : les index des verbes déjà appris ne bougent pas. Niveau : lv 3, f 1, r "e". */
"use strict";
const D0_L640C = DICT.length;
DICT.push(...[
{"v":"surge","lv":3,"fr":"augmenter brusquement / déferler","ipa":"sɜːdʒ","pr":"seurdj","pt":"surged","pp":"surged","irr":false,"ex":[["The number of visitors *surges* every summer.","Le nombre de visiteurs *grimpe en flèche* chaque été."],["The sea *surged* over the rocks.","La mer *a déferlé* sur les rochers."]],"q":1,"f":1,"r":"e"},
{"v":"soar","lv":3,"fr":"monter en flèche / planer","ipa":"sɔː","pr":"sôr","pt":"soared","pp":"soared","irr":false,"ex":[["Temperatures *soared* to forty degrees in July.","Les températures *ont grimpé en flèche* jusqu'à quarante degrés en juillet."],["The eagle *soared* above the mountains.","L'aigle *planait* au-dessus des montagnes."]],"q":1,"f":1,"r":"e"}
]);
DICT.slice(D0_L640C).forEach((d, k) => indexVerb(d, D0_L640C + k));
