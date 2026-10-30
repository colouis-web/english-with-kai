# Sprint Kai 1 — point de synchro (30/10, 13:20, scrum master)

Demande du PO (13:18) : l'équipe passe sur Kai.
- **Matt** : analyse UX, rétro-documentation, suggestions d'amélioration ; enrichissement du dictionnaire et de la grammaire (avec le scrum master pour la relecture).
- **Ouss / Ludo** : correction des petits bugs, mise au propre du code, améliorations proposées par Matt.
- **Dédé** : les tests.
- **Ani** : automatisation CI/CD, patchs de sécurité si nécessaire.

Base : branche `sprint-kai-1` = `main` + PR #1 d'Ani (revue, publication automatique). Livraison : **une pull request vers main**, le PO décide.

## Ordre de passage (un seul fichier `index.html` de 1,7 Mo : on ne s'y marche pas dessus)
**Phase 1 (≈ 6 min)** — Ludo seul modifie le code :
- **Ludo** découpe `index.html` en fichiers, **sans changer aucun comportement** : `css/app.css`, `js/data/*.js` (NDICT, DICT, ADJ, LBANK, TTYPE, FRT, LESSONS, KV… — un fichier par grand jeu de données), `js/app.js` (le code, formaté lisiblement), scripts classiques (pas de modules ES). `index.html` ne garde que la structure.
- En parallèle, **lecture seule / nouveaux fichiers** : Matt (`docs/ux/`, `docs/retro-doc/`, `js/data/enrichissement-*.js` nouveau), Dédé (`tests/` : tests de référence écrits sur le comportement ACTUEL, captures de référence avant découpage), Ouss (chasse aux bugs → `docs/bugs.md` avec reproduction), Ani (`.github/`, `scripts/`, polices auto-hébergées dans `fonts/`, plan de patchs).
**Phase 2** — après fusion du découpage (le scrum master prévient) :
- **Ouss** corrige les bugs de `docs/bugs.md` dans les nouveaux fichiers ; met en place les améliorations « rapides » de Matt validées par le scrum master.
- **Ani** applique ses patchs (polices locales au lieu de Google Fonts, code parent haché) dans les fichiers concernés.
- **Ludo** branche le fichier d'enrichissement de Matt et vérifie que les données sont valides.
- **Dédé** rejoue ses tests sur la version découpée : zéro régression exigée.

## Règles
- Aucune régression : la progression déjà enregistrée par l'élève (localStorage `kai.*`) doit être relue telle quelle.
- Le site doit fonctionner sur GitHub Pages et via `python3 -m http.server` (tests).
- Commits fréquents sur sa branche `kai/<nom>`, auteur Claude (déjà configuré).
