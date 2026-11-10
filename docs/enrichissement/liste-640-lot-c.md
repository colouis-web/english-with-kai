# Liste 640 du PO, lot C : compte rendu (Ouss, 10/11/2026)

Source : `docs/enrichissement/liste-640-lot-c.csv` (54 lignes). Fichiers écrits : `js/data/liste-640-c.js`, `js/data/liste-640-c-verbes.js`.

## Chiffres

54 lignes, dont 2 écartées (sweet balm, trump). **52 fiches ajoutées** (une par ligne retenue) :

| Lexique | Avant | Après | Ajouts |
|---|---|---|---|
| Connecteurs (CON) | 69 | 79 | 10 : given that, additionally, by the same token, thus, inasmuch as, insofar as, when it comes to, in the wake of, by dint of, last but not least |
| Prépositions (PREP) | 68 | 72 | 4 : on behalf of, at the core of, at the expense of, for want of |
| Adverbes (ADV) | 115 | 116 | 1 : gradually |
| Adjectifs (ADJ) | 206 | 212 | 6 : ominous, paramount, rife, soon-to-be, would-be, myriad |
| Noms (NDICT) | 1290 | 1296 | 6 : gist, upshot, asset, hike, headway, spate |
| Idioms (IDI) | 27 | 50 | 23 (voir ci-dessous) |
| Verbes (DICT) | 517 | 519 | 2 : surge, soar (`q:1`, thème « Essay verbs ») |

Idioms : on the verge of, time and again, in the pipeline, in the offing, without the shadow of a doubt, the same goes for, much remains to be done, in droves, at the drop of a hat, out of hand, across the pond, as a rule of thumb, in the best-case scenario, in the worst-case scenario, be poles apart, make great strides, a sea change, a wedge issue, the pros and cons, a slew of, a case in point, a downward spiral, Achilles' heel.

## Termes écartés

- **sweet balm** : n'existe pas au sens de « pain béni » (décision du scrum master). Pour « pain béni », l'expression existante est *a blessing in disguise* (déjà dans IDI) ou *a godsend*.
- **trump** (atout) : écarté, *asset* suffit (décision du scrum master).
- **a spate of / a slew of / a myriad of** : pas de fiche triple. *spate* devient un nom (série, vague : usage fréquent en dissertation), *myriad* un adjectif (innombrable ; la forme « a myriad of » est expliquée dans la traduction), *a slew of* reste une expression (familier, surtout américain).
- Aucun doublon créé (vérifié par script sur ADJ, ADV, CON, PREP, IDI, PHR, NDICT, DICT).

## Corrections de la source

- *by rule of thumb* → **as a rule of thumb** (décision du PO).
- *pros and cons* : fiche **the pros and cons** (= le pour et le contre).
- *the gist* : fiche nom **gist** (l'essentiel d'un texte, d'une idée).
- *in the best case scenario / in the worst case scenario* → trait d'union : **in the best-case / worst-case scenario** (adjectif composé devant un nom).
- *great strides* → **make great strides** (l'expression s'emploie avec *make*) ; *be poles apart* gardé avec *be*.
- *a wedge issue* : mot surtout américain, étiqueté US (`r` = "ea"). *across the pond* : familier, étiqueté Informal.
- Les exemples de la source (politiques) n'ont pas été repris : tous les exemples sont neutres (école, sport, sciences, environnement, histoire ancienne, Kai).

## Rangement : choix

- *last but not least* : dans CON (Concluding), décision du PO.
- *on behalf of, at the core of, at the expense of, for want of* : locutions prépositionnelles, rangées dans PREP (thème Other), comme *according to*. À valider par le PO si préféré dans CON (en CON existent déjà *because of, due to, thanks to*, aussi présents en PREP).
- *in the wake of* et *by dint of* : en CON (thème Cause & result), comme *due to*.
- *the same goes for* : dans IDI (demande du scrum master), niveau 2.
- *soon-to-be, would-be* : adjectifs (thème Opinion) ; *myriad* : thème « Size & shape ». *hike* (hausse brutale / randonnée) a deux sens, donnés tous les deux.

## Niveau

Tout le lot : `lv` 3 (B2-C1), `f` 1. Exceptions `lv` 2 : *gradually* (f 2), *last but not least* (f 2), *the same goes for* (f 2), *the pros and cons* (f 2, déjà vu en collège). *when it comes to* : lv 3, f 2.
Registre : `e` (dissertation) pour la plupart ; `f` (soutenu) pour *thus, by the same token, inasmuch as, insofar as, by dint of, for want of, on behalf of, paramount, rife, in the offing* ; `i` pour *at the drop of a hat, across the pond, a slew of*.

## Point technique à connaître

`IDI` est créé dans `js/app-phrasal-aide.js`, chargé **après** `liste-640-c.js` (et ses données `IDID` dans `phrasal-idioms.js` aussi). Les idioms sont donc ajoutés à `DOMContentLoaded` avec la même indexation que `makeLex` (i, keys, lkeys), en fin de tableau. Si l'ordre des `<script>` change un jour (ex. charger les lots 640 après `app-phrasal-aide.js`), le code fonctionne aussi (il teste `document.readyState`). Les lots A et B devront faire de même s'ils ont des idioms.

## Vérification (Playwright, Chromium)

Aucune erreur JS ; compteurs augmentés (connecteurs 79, prépositions 72, adverbes 116, adjectifs 212, noms 1296, idioms 50) ; les index existants sont inchangés (comparaison avec un chargement sans les deux fichiers : mêmes mots aux mêmes positions) ; aucun doublon ; chaque fiche trouvée par la recherche de sa page ; *surge* et *soar* classés dans « Essay verbs ».

## Relecture Ani (10/11/2026)
13 fiches corrigées (champs lv, f, r, ordre et mécanisme d'ajout inchangés). Playwright : aucune erreur JS ni console ; fiches corrigées trouvées par la recherche « Words ».
- **without the shadow of a doubt → without a shadow of a doubt** : forme usuelle de l'idiome (mot vedette et exemples).
- **last but not least** : « dernier point, mais pas le moindre » (calque) → « enfin et surtout / le dernier, mais non le moindre » ; exemples traduits par « enfin et surtout ».
- **given that** : IPA /ˈɡɪvn ðət/ (accent sur given, that faible) au lieu de /ˌɡɪvn ˈðæt/ ; pr « GUIVN dheut ».
- **when it comes to** : « to » faible devant consonne, /tə/, pr « teu ».
- **insofar as** : exemple « Insofar as I know » (rare, la forme usuelle est as far as I know) → « I'll help you insofar as I can ».
- **rife** : s'emploie surtout pour des choses négatives ; « rife with legends » → « rife with spelling mistakes ».
- **would-be** : « aspirants chanteurs », « l'aspirant champion » (peu français) → « chanteurs en herbe », « le prétendant au titre » ; fr « en herbe / aspirant / prétendu ».
- **a downward spiral** : exemple triste (village, fermeture d'usine) → équipe de sport qui enchaîne les défaites.
- **thus** : ordre des mots en français (« et a ainsi progressé »). **gradually** : « est peu à peu devenu rose ».
- **headway** : fr précise l'emploi *make headway* (progresser, avancer).
- **surge, soar** : séparateur « / » dans fr (comme le reste de DICT), sens principal en premier.
- **Au PO** : *a wedge issue* est par nature un terme de politique (américain) ; les exemples sont neutres, mais la fiche pourrait être retirée si le lot doit rester sans politique.
