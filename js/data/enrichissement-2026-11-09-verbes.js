/* Enrichissement du 09/11/2026 (demande du PO) — verbes du vocabulaire de lycée (trade, protest).
   Chargé juste après enrichissement-2026-11-03-verbes.js et avant verbes-themes.js (qui pose les thèmes : r "e" → « Essay verbs »).
   Les nouveaux verbes vont en fin de DICT : les index des verbes déjà appris ne bougent pas.
   « influence » (verbe) existe déjà (DICT, « influencer ») : seul le nom est ajouté dans enrichissement-2026-11-09.js.
   Niveau : f 1 et r "e" → proposés à partir du niveau Intermediate seulement (js/app-usage.js, lvOkWord). */
"use strict";
const D0_ENR3 = DICT.length;
DICT.push(...[
{"v":"trade","lv":2,"fr":"échanger, faire du commerce","ipa":"treɪd","pr":"tréïd","pt":"traded","pp":"traded","irr":false,"ex":[["We *trade* football cards at break time.","Nous *échangeons* des cartes de foot à la récré."],["In the Middle Ages, Venice *traded* with many countries.","Au Moyen Âge, Venise *faisait du commerce* avec de nombreux pays."]],"q":1,"f":1,"r":"e"},
{"v":"protest","lv":3,"fr":"protester, manifester","ipa":"prəˈtest","pr":"preu-TÈST","pt":"protested","pp":"protested","irr":false,"ex":[["Kai always *protests* when he has to tidy his room.","Kai *proteste* toujours quand il doit ranger sa chambre."],["Local people *protested* against the plan to cut down the old trees in the park.","Les habitants *ont manifesté* contre le projet d'abattre les vieux arbres du parc."]],"q":1,"f":1,"r":"e"}
]);
DICT.slice(D0_ENR3).forEach((d, k) => indexVerb(d, D0_ENR3 + k));
