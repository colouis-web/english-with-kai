/* Liste 640 du PO (09/11/2026), lot A : verbes (click, confer, steer + debug). Compte rendu : docs/enrichissement/liste-640-lot-a.md
   Chargé après enrichissement-2026-11-09-verbes.js et avant verbes-themes.js. Ajouts en fin de DICT : les index existants ne bougent pas.
   Un verbe absent de VTHEMES (verbes-themes.js) tombe dans « Everyday verbs ». */
"use strict";
const D0_L640A = DICT.length;
DICT.push(...[
{"v":"click","fr":"cliquer","ipa":"klɪk","pr":"klik","pt":"clicked","pp":"clicked","irr":false,"ex":[["*Click* on the icon to open the game.","*Clique* sur l'icône pour ouvrir le jeu."],["She *clicked* the wrong button by mistake.","Elle *a cliqué* sur le mauvais bouton par erreur."]],"q":1,"f":3},
{"v":"confer","lv":3,"fr":"s'entretenir / se consulter ; conférer (un titre)","ipa":"kənˈfɜː","pr":"keunn-FEUR","pt":"conferred","pp":"conferred","irr":false,"ex":[["I need to *confer* with my parents before I answer.","Je dois *m'entretenir* avec mes parents avant de répondre."],["The coaches *conferred* for a few minutes before choosing the team.","Les entraîneurs *se sont consultés* quelques minutes avant de choisir l'équipe."]],"q":1,"f":1,"r":"f"},
{"v":"steer","lv":2,"fr":"diriger / piloter / orienter","ipa":"stɪə","pr":"stieur","pt":"steered","pp":"steered","irr":false,"ex":[["Can you *steer* the boat towards the harbour?","Peux-tu *diriger* le bateau vers le port ?"],["She *steered* her bike round the puddle.","Elle *a dirigé* son vélo pour contourner la flaque."]],"q":1,"f":2},
{"v":"debug","lv":2,"fr":"déboguer","ipa":"ˌdiːˈbʌɡ","pr":"di-BEUG","pt":"debugged","pp":"debugged","irr":false,"ex":[["Kai tried to *debug* his game.","Kai a essayé de *déboguer* son jeu."],["It took an hour to *debug* the program.","Il a fallu une heure pour *déboguer* le programme."]],"q":1,"f":1}
]);
DICT.slice(D0_L640A).forEach((d, k) => indexVerb(d, D0_L640A + k));
