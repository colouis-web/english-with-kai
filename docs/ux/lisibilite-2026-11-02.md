# Lisibilité — R1, R2, R3, T3 (sprint Kai 2, sprint A) — notes d'Ouss, 02/11/2026

Branche `kai/ouss`. Vérifié avec Playwright / Chromium (375×667, 375×548, 375×812, 360×740, 390×844, 430×932, 1280×800),
normal / Large / Extra large. **WebKit (Safari iPhone) non testé** : pas de navigateur WebKit dans l'environnement (voir « Risques »).

## Ce qui est livré

### R1 — police des bulles et des phrases
- Texte des bulles : **graisse 500**, taille en unités du `viewBox` (360 de large) = variable CSS `--bfs` (20 par défaut), interligne **1,4**.
  Mesure faite à l'écran (unités × échelle réelle du SVG) : **18,2 px à 360 px de large, 19,1 à 375, 19,9 à 390, 21,1 à 412, 22,1 à 430**
  (bulle de question, menu, leçon, mot du jour). Avant : 15 px (question), 15,5 px (menu), 18 × 0,93 ≈ 16,8 px d'accueil.
- La mise en lignes de la bulle suit la taille : `headSvg` mesure les mots à la bonne taille, la bulle grandit avec le nombre de lignes.
- Phrases d'exemple (`.ex .en`) 16 → 18 px, traduction 15 → 16 px, `.t3en` / `.psent` interligne 1,4, consigne `.tins` 16 px.
- Contrastes inchangés : encre `#1d1b2e` sur blanc, mots en surbrillance `#0b7f89` (4,9:1) en gras.
- **Accueil sur téléphone court** (le vrai problème de l'iPhone SE) : la scène entière de Kai est dimensionnée par la **hauteur** ;
  à 375×667 l'échelle tombait à 0,65 (texte des bulles ≈ 13 px) et sous Safari, avec ses barres (≈ 548 px de haut), à 0,49 (≈ 10 px !).
  Nouveau mode « compact » (`fit()`, `.stagebox.compact`) : si l'échelle serait < 0,9 sur un écran ≤ 600 px, la scène prend toute la
  largeur et se cadre sur la tête, le buste et les bulles ; les jambes de Kai s'estompent en bas. Le bouton Start reste visible dès 375×548.
  Au-dessus (390×844, iPhone récents) : scène entière comme avant, texte ≥ 18,4 px.

### R2 — cadrage des images
- « Let's talk » : l'image **entière** (plus de recadrage carré qui coupait les têtes : ski, girafe, pyramides, évier…), hauteur ≤ 46 % de l'écran
  visible, centrée sur fond neutre. Les 46 images de `TKPICS` ont été passées en revue à 375×667, avant / après.
- « Congrats! » et « See you tomorrow » : hauteurs relatives à l'écran visible (`svh`), `max-height` + défilement interne : le bouton « Thanks, Kai! » reste atteignable
  (avant : `100vh`, qui dépasse l'écran visible sous Safari iPhone).
- Zones de sécurité : `main` et la fenêtre « Congrats! » respectent aussi `safe-area-inset-left/right` (paysage, encoche).
- Aucun défilement horizontal à 360, 375, 390, 430 px (contrôle automatique sur 22 écrans).

### R3 — Words
- Re-toucher la puce du thème choisi la **désélectionne** (retour à « All themes »), pour les noms **et** les 7 autres listes (adjectifs, adverbes, connecteurs,
  prépositions, quantifieurs, phrasal verbs, idioms : même fonction `makeLex`).
- La puce « All » devient **« All themes »** et reste **collée à gauche** de la rangée qui défile ; la puce choisie porte une **coche** et `aria-pressed="true"`
  (l'état n'est plus seulement une couleur) ; elle défile pour rester visible.

### T3 — « Text size : Normal / Large / Extra large »
- Écran **Me**, juste sous « Learner » : 3 boutons (`role="radio"`, libellés anglais + français « Grande / Très grande »), note en anglais avec traduction française.
- Mémorisé **par élève** : clé `kai.textsize.<id élève>` = `normal` | `large` | `xlarge` (même nommage que `kai.daily.v1.<id>`, `kai.qsave.<id>…`).
  Valeur absente ou inconnue = normal. La sauvegarde en fichier prend déjà toutes les clés `kai.*` : rien à ajouter (testé : aucune clé existante modifiée).
- Appliqué au chargement et à chaque changement d'élève (`renderMenuHead`, appelée par `useProfile`, suppression, renommage) : classe `ts-l` / `ts-xl` sur `<html>`.
- Effet : `zoom` 1,12 (Large) / 1,25 (Extra large) + `--bfs` (22,5 / 25) pour les bulles. La mise en page se recompose sur la largeur restante.
  Réglages CSS pour 375 px et moins : tuiles, cartes de mots, carte « Learner », niveaux, tests de la semaine.
  Contrôle automatique « mot coupé / texte qui déborde / défilement horizontal » : **0 anomalie à 360, 375, 390, 430 px** sur les 22 écrans en Extra large.
- `1svh` / `1vw` sont agrandis par `zoom` : variables `--sv` / `--sw` recalculées par `txMetrics()` (sans quoi chaque page dépasserait l'écran).

## Fichiers touchés hors de ma liste (à valider par le scrum master)
- `js/app-quiz.js` (`headSvg`, `wrapRows`, `measure`, nouveau `bubbleFs`) et `js/app-scene-voix.js` (accueil, `fit()`) : la géométrie des bulles y est calculée en JS,
  la police ne pouvait pas être corrigée en CSS seul. Aucun autre agent n'y travaille ce sprint ; commit séparé (`eede6d0`), facile à écarter.
- `js/app-profils.js` : en plus du bloc T3, la bulle du menu (`renderMenuHead`) suit `--bfs`.

## Restes et propositions
1. **Bulles de fin d'exercice** (`kaiBig` dans `js/app-daily.js`, `renderEnd` dans `app-quiz.js`, `endPractice` dans `app-entrainement.js`) : géométrie fixe, interligne 20
   écrit en dur. Je les ai laissées à **19 unités** (≈ 17,3 px à 360, 18,9 à 390) pour ne pas déborder de l'ellipse ; pour 20 et un interligne 1,4, remplacer
   `j * 20` par `j * 28` et agrandir `END_L[*].r` de ~10 % (`app-daily.js` est à Ludo).
2. `deleteProfile` (`app-daily.js`, Ludo) devrait aussi retirer `kai.textsize.<id>` (clé orpheline sans gravité, quelques octets).
3. Texte de recherche de Words « Search any word: chat, ru… » : tronqué à 375 px en Extra large ; à raccourcir (`index.html`, bloc Words) : « Search any word ».
4. Les **références visuelles** de `tests/reference/` (accueil 390, mots…) vont changer : bulles plus grosses, « All themes ». Évolution voulue : Dédé les régénère après validation.
5. Sur ordinateur (1280 px) le texte des bulles passe de ≈ 18,6 à ≈ 25 px (la colonne de 448 px est agrandie par le SVG) : à revoir avec la mise en page tablette (S-14).

## Risques
- **Safari iPhone / `zoom`** : `zoom` est pris en charge par WebKit depuis des années et par Firefox ≥ 126, mais le comportement de `svh` / `vw` sous `zoom` peut différer
  de Chromium (d'où `--sv` / `--sw` calculés en JS à partir de `innerHeight` : indépendants du moteur). **À vérifier sur un vrai iPhone** (liste à cocher de Dédé) :
  Extra large sur l'accueil, le menu, un quiz, Words.
- Accueil « compact » : la scène est rognée en bas (jambes estompées) sur iPhone SE / Safari avec barres. Choix de design à confirmer par le PO.

## Questions au PO
1. **Tailles** : Large = +12 %, Extra large = +25 % : cela convient-il, ou faut-il un cran plus grand (+40 %, au prix de mises en page plus serrées à 375 px) ?
2. **Accueil sur petit iPhone** : OK pour que Kai soit cadré à mi-corps (jambes qui s'estompent) plutôt que rapetissé en entier avec des bulles illisibles ?
3. Le réglage « Text size » doit-il aussi être accessible **hors de Me** (par exemple un petit « Aa » dans l'en-tête du menu) pour que le fils le trouve sans aller dans les réglages ?
4. Les bulles de fin d'exercice à 19 unités vous gênent-elles ? Sinon, on laisse à Ludo la remise à niveau de `kaiBig` (voir reste n° 1).
