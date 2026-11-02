# Enquête `img/kai-fr.webp` (02/11/2026, Dédé)

Question posée (`docs/bugs.md`, « À investiguer ») : le test DN-61 déduit l'image `img/kai-fr.webp` du code, mais elle
n'existe pas dans `img/`. Quand et où s'affiche-t-elle ? Faut-il l'ajouter ou retirer la référence ?

## Conclusion

**Cette image n'existe pas et n'a jamais été demandée par l'application : c'est un faux positif du test DN-61, pas un bug de l'app.**
Il n'y a rien à ajouter dans `img/` et aucune référence à retirer dans le code. Aucun élève ne voit ni ne peut voir un « trou » à
cause de cette image.

## Preuves

1. **Aucune référence réelle dans le code.** Recherche de `kai-fr` dans tout le dépôt (`index.html`, `js/`, `css/`) : les seules
   occurrences sont des morceaux de **`kai-friend.webp`** (image qui existe : `img/kai-friend.webp`), présente en toutes lettres dans
   `index.html` (tuiles « Quiz connectors » et « Let's talk English ») et dans `js/app-verbes.js` (tables d'images `SCN` et liste de
   visages). Un `grep kai-fr` les attrape parce que « kai-friend » commence par « kai-fr » : c'est sans doute l'origine de l'idée
   « référencée dans `js/app-verbes.js` et `index.html` ».
2. **L'origine exacte du faux positif.** Le test DN-61 (`tests/test_donnees.py`) cherche dans le texte de tous les scripts les appels
   `headSvg("…", "visage")` et en déduit des images `img/kai-<visage>.webp`. Or `js/app-lang-fr.js`, ligne 7, contient seulement un
   **commentaire** : `balisées par headSvg(…, "fr")` (ajouté avec S-10, commit `fb08c96`, 30/10, accessibilité `lang="fr"`). L'expression
   régulière du test lit ce commentaire et prend `"fr"` pour un nom de visage.
3. **Ce que « fr » veut dire vraiment.** Dans `headSvg(sentence, face, mood, lang)` (`js/app-quiz.js`), `"fr"` est le **quatrième paramètre**,
   `lang` : il pose l'attribut `lang="fr"` sur la bulle quand elle contient du français, pour que le lecteur d'écran prononce bien.
   Le visage de Kai est le **deuxième** paramètre (`"head"`, `"smile"`, `nextFace(…)`…). Aucun appel ne passe `"fr"` en deuxième position.
4. **Preuve à l'exécution.** Le test de parcours joue tous les écrans de l'élève (quiz, leçons, tests, mots du jour, calendrier, aide…) avec
   un collecteur qui échoue sur toute requête en HTTP 404 : 0 requête vers `kai-fr.webp` sur toute la suite. De plus DN-61 charge toutes les
   images construites par le code (fins de quiz, humeurs, rotations, leçons, scènes, récompenses) : elles existent toutes.

## Correctif (côté tests, appliqué dans `tests/test_donnees.py`)

- L'analyse des visages **ignore les commentaires** (`/* … */` et `// …`) et ne retient que le **deuxième argument** de `headSvg(…)`
  lorsqu'il est un texte entre guillemets.
- La liste `CONNUES = {"img/kai-fr.webp"}` et la note DN-61b sont supprimées : si une image est référencée et absente, DN-61 échoue
  de nouveau pour de bon.

## À faire côté documentation (hors de mon périmètre)

- Le scrum master peut retirer la ligne « `img/kai-fr.webp` » de la section « À investiguer » de `docs/bugs.md` (je n'ai le droit
  de modifier que `tests/` et `docs/tests/`).
- Option de confort, sans urgence : écrire le commentaire de `js/app-lang-fr.js` sans la forme `headSvg(…, "fr")` n'est plus nécessaire
  une fois le test corrigé.
