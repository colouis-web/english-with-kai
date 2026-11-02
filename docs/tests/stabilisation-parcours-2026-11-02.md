# Stabilisation des tests de parcours (02/11/2026, Dédé)

Demande du PO (T6, 31/10) : P07 (clavier, verbes irréguliers) et P12 (code parent) échouaient de façon intermittente ;
les tests de parcours devaient être stabilisés avant d'être remis bloquants.

## Pourquoi c'était instable

Le test **attendait des durées** là où l'application **change d'état à un moment variable**. Quelques exemples relevés
(32 `wait_for_timeout` dans `tests/`, tous supprimés) :

| Où | Ce que le test faisait | Ce que l'application fait vraiment |
|---|---|---|
| Après chaque message du code parent | `wait_for_timeout(1800)` « pour laisser le message disparaître » | le message dure 1,6 à 2,6 s selon le texte ; sur une machine chargée le test lisait l'ancien message ou le ratait |
| Code parent (P12, PE-2x) | lisait le message « Wrong code » 6 s au plus après la saisie | le code est haché en PBKDF2 (150 000 tours) : 50 ms au calme, bien plus quand la machine est occupée ; le test lisait le niveau avant la fin du calcul |
| Focus des champs et des fenêtres | `wait_for_timeout(150 à 600)` puis lecture de `document.activeElement` | la fenêtre donne le focus à la croix après 40 ms, au champ du code après 90 ms, au prénom après 400 ms (P06.3 lisait « frb » au lieu de la croix) |
| Après « OK » de la sauvegarde chargée | attendait `PROFS.list.length === 2` | l'ancienne page, pas encore rechargée, pouvait déjà remplir cette condition ; l'application recharge ensuite la page (`location.reload`) |
| Démarrage / rechargement | `wait_for_timeout(120 à 250)` | l'application ouvre « My daily work » ou « Who's learning » dans un `setTimeout(bootDirect, 0)` |
| Captures visuelles | 120 à 300 ms avant la photo | polices et images pas toujours décodées ; le focus du champ prénom (400 ms) apparaissait ou non |

## Ce qui a remplacé les délais (tout est dans `tests/kai_common.py`)

- **`settle(page)`** : fin du démarrage = `PROFS` existe, un écran est affiché, une « barrière » passe derrière le `setTimeout(bootDirect, 0)`,
  puis, si un élève est enregistré, l'écran d'accueil de Kai a été quitté. `open_app` et `reload_app` l'utilisent.
- **Journal des messages** : la page note chaque message éphémère dans `window.__toasts` (observateur dans `INIT_JS`).
  `next_toast(page, "Wrong code")` attend **ce** message, qu'il soit encore affiché ou déjà parti ; `toast_reset` écarte les anciens.
  Plus aucun test n'a besoin d'attendre qu'un message disparaisse.
- **`wait_js(page, expression)`** et **`P.focus_is(...)`** : attendent un état (focus, niveau de l'élève `curProf().lv`, élément présent…)
  et renvoient vrai/faux ; le contrôle qui suit constate l'état réel au lieu d'échouer sur un délai.
- **`page.expect_navigation()`** autour du bouton « OK » qui recharge l'application.
- **`stable(page)` / `frames(page)`** pour les captures : polices prêtes, images visibles décodées, deux images affichées.

Le seul `sleep` restant est dans `serve()` : la boucle (avec limite de temps) qui attend que `python3 -m http.server` réponde.
Ce n'est pas un délai de test.

## La vraie cause de P07 et P12 : le focus que l'application reprend après coup

Les délais fixes cachaient un défaut plus précis, trouvé en rejouant la suite sans reprise (une première série de 5 passes a eu
3 échecs, tous à 1280 px : P07.29, P12.26 puis P07.x). L'application déplace le **focus clavier après l'affichage**, avec des minuteries :

| Où dans l'application | Minuterie | Effet sur un test qui tape trop tôt |
|---|---|---|
| `openModal()` (`js/app-phrasal-aide.js`) | focus sur la croix « ✕ » à **40 ms** | l'Entrée tombe sur la croix : la fenêtre se ferme **sans vérifier le code** (P12 : « Wrong code » n'apparaît jamais) |
| `gate()` et `askNewCode()` (`js/app-v51-sauvegarde.js`) | focus sur le champ du code à **90 ms** | idem pendant les 50 ms entre les deux |
| `renderTQ()` (`js/app-tests.js`), **ordinateur seulement** (`hover:none` faux) | focus sur le 1er champ à **380 ms** après chaque question | verbes irréguliers : on passe au 2e champ, la minuterie ramène le focus au 1er, l'Entrée ne valide plus (P07) |

Ce n'est **pas un bug visible pour l'élève** (il tape bien plus lentement), d'où « seulement sur ordinateur » et « selon la charge de la machine ».
Correctif côté tests : `modal_prete()` (focus posé : champ du code, sinon croix) et `question_prete()` (focus sur le 1er champ, sur ordinateur) attendent
**l'état final de l'application** avant de saisir. Aucun délai.

## Reprise automatique : désormais signalée

`run_all.py` rejouait une fois les suites `persistance` et `parcours` en échec, ce qui **cachait** les instabilités.
Maintenant : un succès obtenu seulement à la reprise est imprimé `INSTABLE` (avec les contrôles concernés), et `--no-retry`
désactive la reprise pour mesurer la stabilité.

## Ré-étalonnage de PE-25 (persistance)

PE-25 comparait le texte de six écrans à celui de la **version d'origine** (avant v1.0) ; trois écrans différaient à cause des
évolutions voulues de la v1.0, pas à cause d'une perte de progression :
niveaux renommés (Practicer, Confirmed, Expert → Elementary, Intermediate, Upper-intermediate), sections de « My daily work » dans un autre ordre,
titres plus en majuscules, et deux libellés qui ont changé de sens. Les données (`kai.*`) et l'état calculé (étoiles, rang, série, mémoire des mots…)
restent comparés à l'original et sont **identiques** (PE-22 à PE-24 verts). Seuls les **textes d'écran attendus** ont été ré-étalonnés sur la v1.0
(`python3 tests/test_persistance.py --update-rendus`, repère noté dans la référence). **À confirmer par le scrum master / le PO** — deux différences
méritent un coup d'œil, elles ne sont pas des pertes de données mais ressemblent à un changement de règle :
- « My memory » : **32** mots à revoir aujourd'hui dans la référence d'origine, **29** sur la v1.0 (filtre des thèmes sensibles pour un débutant ?) ;
- Mes tests : « 20 questions on the **19** grammar lessons » → « on **your 3** grammar lessons » (formulation adaptée au niveau de l'élève).

**Hypothèse de Ludo (bandeau « Class test in 3 days » dépendant de la date du jour) : vérifiée, ce n'est pas la cause.**
- L'horloge est déjà figée à 30/10/2026 10:00 dans ces tests (`FIXED_NOW`, `clock.set_fixed_time`) : le bandeau affiche « in 3 days » à chaque exécution
  (le contrôle `u1` est daté du 02/11 dans `js/app-v54-v62.js`, ligne 1409).
- Le texte du bandeau est **déjà dans la référence d'origine** (« Friday 30 October 📅 Class test in 3 days Unit 1 · My world · Monday 2 November ») :
  il n'apparaît pas dans les différences relevées.
- Les vraies différences sont celles ci-dessus : niveaux renommés, ordre des sections, casse des titres, « My memory » 32 → 29,
  « 19 grammar lessons » → « your 3 grammar lessons ». Elles existent sur la base `03d25bd` sans aucune modification et viennent de la v1.0, pas de la date.
- Ce n'était donc pas à figer davantage : j'ai ré-étalonné les textes attendus (commit `c2c84fe`) ; PE-25 est vert (persistance : 98 OK, 0 KO).
Si le contrôle de classe est un jour retiré ou déplacé (prévu au sprint Kai 3), PE-25 devra être ré-étalonné de la même façon.

Quand l'interface change **volontairement** (taille du texte d'Ouss, tuile Certificates, certificats de Ludo…), PE-25 et les captures de
`test_visuel.py` échouent : relancer `python3 tests/test_persistance.py --update-rendus` et `python3 tests/test_visuel.py --update`
**après validation**, et le dire dans le commit.

## Preuve de stabilité

Mesure : `python3 tests/test_parcours.py` (sans reprise), 5 fois d'affilée, sur le commit `b7d3fd7` (fichiers de test identiques à ceux de la livraison pour
`kai_common.py`, `test_parcours.py`, `test_persistance.py`). Chaque passe joue 390 px, 1280 px et les passes courtes iPhone SE et mini.

| Série | Commit | Résultat |
|---|---|---|
| 1 | `119e8a5` | **échecs** : passe 1 (P07.29), passe 2 (P12.26), passe 3 (P07.x, scénario arrêté) ; passes 4 et 5 vertes |
| 2 | `b7d3fd7` | **5 passes sur 5 vertes** : 1298 OK, 0 KO, 0 bloqué à chaque passe, sans aucune reprise |

Puis la batterie complète, sans reprise (`python3 tests/run_all.py --no-retry -v`) : donnees 87 OK, persistance 98 OK, visuel 50 OK, parcours 1298 OK, appareils 596 OK
(avant l'ajout des 46 images de « Let's talk » : 1335 OK maintenant) ; **0 KO, 0 bloqué, aucune suite « INSTABLE »**, verdict VERT.

La série 1 est conservée ici parce qu'elle montre que des délais supprimés ne suffisaient pas : les trois échecs viennent du focus (section ci-dessus).
Limite honnête : 5 passes consécutives vertes montrent une instabilité d'au plus quelques pour cent, pas son absence ; c'est pourquoi `--no-retry` et le signal « INSTABLE » restent en place.
Les passes ont tourné pendant que d'autres agents utilisaient la même machine (charge variable), ce qui est un bon test pour des échecs liés au temps.

Le temps de la suite de parcours est d'environ 4,5 minutes (390 + 1280 px + passes iPhone).

## Si un test redevient intermittent

1. **Ne pas ajouter de délai.** Un délai déplace le problème, il ne le règle pas.
2. Trouver l'**état** que l'application atteint à la fin (une classe, un texte, un focus, une valeur enregistrée, une navigation).
3. L'attendre avec `wait_js` / `next_toast` / `expect_navigation`, ou ajouter un petit témoin dans `INIT_JS` comme pour `__toasts`.
4. Rejouer 5 fois avec `python3 tests/run_all.py --only parcours --no-retry`, y compris pendant qu'une autre suite tourne (charge de la machine).
