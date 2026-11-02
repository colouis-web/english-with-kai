# Petits iPhone et WebKit — constats de cadrage (02/11/2026, Dédé)

Demande du PO (R2 et T5, 30/10) : sur l'iPhone plus petit du fils, des images sont mal cadrées. Ce document dit **quel écran, quelle image,
de combien**, pour que Ouss corrige (`css/app.css`) et que le test passe ensuite en bloquant.
Version testée : `kai/dede` (voir le dernier commit poussé), sur la base `sprint-kai-2` @ `03d25bd` (v1.0, aucun changement d'application).

## Ce qui est testé

Suite `tests/test_appareils.py` (jouée par `python3 tests/run_all.py`), à partir des descripteurs d'appareils de Playwright :

| Passe | Taille (points CSS) | Remarque |
|---|---|---|
| iPhone SE | 375×667 | écran plein |
| iPhone mini | 375×812 | écran plein |
| iPhone mini sous les barres de Safari | 375×629 | ce que le fils voit réellement dans Safari |
| iPhone 13/14 | 390×844 | référence : sert à savoir si le défaut est propre aux petits écrans |
| WebKit (Safari) | SE et mini | **non jouée ici, voir plus bas** |

Sur chaque passe, une trentaine d'écrans sont parcourus comme un élève (accueil, prénom, My daily work haut et bas, calendrier, menu, Words, verbes,
noms, leçons, conjugaison, grammaire, mes tests, quiz avec question et deux fins, Do it yourself, Let's talk, contrôles de 6e, Me, fin de leçon,
« Congrats! »). **Sur chacun**, la page mesure (rien n'est comparé au pixel) :

1. défilement horizontal et éléments qui dépassent le bord droit de l'écran ;
2. chaque image de Kai (`kai-*`), de scène (`sc-*`) ou de récompense (`rw-*`), `<img>` comme `<image>` des SVG : quelle part de la partie **réellement dessinée**
   (`object-fit`, `preserveAspectRatio` compris) est cachée par son cadre, un parent qui rogne ou le bord de l'écran ;
3. texte ou bouton dont le contenu dépasse son cadre ;
4. accueil : le bouton « Start » est visible sans défiler.

Une capture annotée (cadre rouge sur l'image fautive) est écrite à chaque défaut. Les **vignettes rondes** (petits visages d'humeur de My daily work,
vignettes du calendrier) sont exclues : y recadrer sur le visage est voulu.

## Résultat : aucun débordement, mais deux écrans où Kai est coupé

**Aucun défilement horizontal, aucun élément qui dépasse l'écran, aucun texte ni bouton coupé, « Start » toujours visible sans défiler, 0 erreur console,
toutes les images se chargent : sur les trois petits formats et sur 390 px.** Le défaut du fils ne vient donc pas d'un débordement général mais de deux écrans
où une image est recadrée (`object-fit: cover`) dans un cadre qui n'a pas sa proportion.

### Défaut 1 — « Let's talk English » : 45 images sur 46 sont rognées, parfois la tête de Kai (le plus répandu)

- **Écran** : Test yourself › Let's talk English (l'image à décrire en anglais, puis « New picture »).
- **Images** : **45 des 46 images** de `TKPICS` perdent de la matière, de 4 à 37 %. Les pires : `sc-jog`, `sc-farm`, `sc-burger`, `sc-bakery` (37 %), `sc-rugby`, `sc-lions`,
  `sc-breakdance` (34 %), `sc-tennis` (33 %), `sc-bike` (32 %)… Seule `sc-chill` est quasi intacte (4 %). Sur `sc-jog`, **la tête de Kai est hors cadre** alors que la question est
  « What is Kai doing? » (capture : `docs/tests/captures-petits-iphone/se-lets-talk-sc-jog.png`). Autre exemple : `se-lets-talk.png` (`kai-cat`, 19 %, la chaussure touche le bord).
- **Identique sur toutes les tailles testées** (SE, mini, mini sous Safari, 390 px) : le cadre est un carré de 294 à 300 px dans tous les cas. Ce n'est pas propre aux petits écrans,
  mais c'est bien l'écran où l'enfant voit Kai « mal cadré ».
- **Cause** (`css/app.css`, lignes 690-691) : `.tkpic{aspect-ratio:1 …}` et `.tkpic img{width:100%;height:100%;object-fit:cover}`. Les images sont presque toutes **en portrait ou en paysage**
  (par exemple 138×204 pour `sc-bike`, 265×228 pour `sc-ski`) : `cover` dans un carré rogne le côté le plus long, au centre. Une tête en haut d'image disparaît.
- **Correctif proposé** : `object-fit: contain` (le fond `#f4f5f8` est déjà prévu sur `.tkpic`) : image entière, avec de petites bandes sur le côté le plus court.
  Ou, pour garder le carré plein : `aspect-ratio` propre à chaque image. À éviter : un `object-position` global (il décale le problème d'une image à l'autre).
  Quel que soit le choix, le test les repasse **toutes** (46 écrans) : `--cadrage-strict`.

### Défaut 2 — « Congrats! » : Kai est coupé (le plus visible)

- **Écran** : la fenêtre « Congrats! » qui apparaît quand l'objectif du jour est atteint (fin d'un tour de mots du jour ; aussi au passage de niveau).
- **Image** : `img/kai-congrats.webp` (Kai pouce levé). **Part coupée : 38 % sur iPhone SE, 27 % sur iPhone mini, 42 % sous les barres de Safari, 30 % sur 390×844.**
  Plus l'écran est court, pire c'est.
- **Cause** (`css/app.css`, `.cgbox img`, ligne 785) : l'image est en portrait (400×716) mais affichée dans un cadre `width:100%; height:min(56vh,440px); object-fit:cover`, donc plus large
  que haut. `cover` recadre : on voit le visage, le pouce et le haut du torse, jamais le bas du corps. Sous les barres de Safari (375×629), la hauteur est de 352 px pour une image qui en demanderait 600.
- **Capture** : `docs/tests/captures-petits-iphone/mini-safari-congrats.png` (aussi `se-congrats.png`).
- **Correctif proposé** : `object-fit: contain` sur fond bleu ciel (couleur du ciel de l'image), la hauteur restant `min(56vh,440px)` : Kai entier, avec une bande de chaque côté.
  Un simple `object-position` ne suffirait pas à 38 %. Ou une image « Congrats! » refaite en 4:3 (dessin, hors périmètre).

### Rien à signaler (vérifié)

Humeurs de My daily work (vignettes rondes, recadrage voulu), menu, mots, quiz et leurs fins, leçons, tests, Me, contrôles de 6e, calendrier : images entières, rien ne dépasse.

**Limite de la mesure** : seuil de 97 % de la partie dessinée visible. Les écrans qui ne tirent pas leur image au hasard sont tous mesurés ; « Let's talk » est mesuré image par image. Les fins de quiz (`kai-v`, `kai-knee`, `kai-dyn`, `kai-profile`) et les images de mots du jour dépendent du score : seules les fins « ratée » et « parfaite » sont jouées.

## Comment ça se comporte dans la suite de tests

- Tant que la correction d'Ouss n'est pas fusionnée, ces défauts sont des **notes « ATTENDU APRÈS CORRECTION D'OUSS »** (identifiants `AP-cad-images-congrats@…` et
  `AP-cad-images-lets-talk-<image>@…`, une par image) : la suite reste verte.
- **Après la fusion** : lancer `python3 tests/run_all.py --cadrage-strict`. Les contrôles de cadrage deviennent des KO ; s'il n'y en a plus, remplacer ce réglage par défaut dans
  `tests/test_appareils.py` (le paramètre `--cadrage-strict` devient implicite).
- Seuil : une image est « coupée » si moins de 97 % de sa partie dessinée est visible.

## Ce qui n'a PAS pu être fait ici : WebKit (Safari)

Le moteur WebKit de Playwright **n'a pas pu être installé sur la machine de test** : le téléchargement est refusé par la politique réseau de l'environnement
(`playwright.download.prss.microsoft.com`, HTTP 403). Les passes WebKit (suite `appareils` et parcours court `wk-se`) sont **écrites et prêtes** : sans le moteur, elles sont notées
« moteur non installé » et ne font pas échouer la suite ; avec `--require-webkit` elles deviendraient des KO.

- **Pour les activer** : sur une machine qui a accès au réseau, `python3 -m playwright install --with-deps webkit` puis `python3 tests/run_all.py`. Rien d'autre à changer.
- **Le workflow GitHub** (`.github/workflows/publier-site.yml`) doit alors installer WebKit à son tour : ce fichier n'est pas dans mon périmètre (`tests/`, `docs/tests/`),
  à ajouter par le scrum master (une ligne `python3 -m playwright install --with-deps chromium webkit`).
- **Limite à connaître** : l'émulation d'iPhone de Chromium reproduit la taille, la densité et le tactile, **pas** le moteur de Safari (rendu des polices,
  `100vh` sous la barre d'adresse, comportement des SVG, son). Ce que Safari fait autrement n'est vérifié que par WebKit et, au final, par la fiche
  `docs/tests/verification-iphone.md` sur le vrai iPhone du fils.

## Point d'attention pour Ouss (sans lien avec le cadrage)

`.cgbox` et `.mbox` utilisent `100vh` (lignes 508 et 784) ; `100svh`/`dvh` serait plus sûr dans Safari, dont la barre d'adresse mange 40 à 100 px. Je n'ai pas pu le prouver sans WebKit :
à vérifier sur le vrai iPhone (point 9 de la fiche).
