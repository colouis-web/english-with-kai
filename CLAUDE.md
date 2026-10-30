# Learning English with Kai — charte de l'équipe

Application d'anglais pour un élève de 6e (un **enfant**), avec Kai, personnage manga. Publiée par GitHub Pages
(`.github/workflows/publier-site.yml`). Le propriétaire et décideur est **Fabien** (le PO). L'équipe d'agents est la même
que sur Front-Team (Matt, Dédé, Ouss, Ludo, Ani) ; Claude Opus est scrum master.

## Règles du jeu
1. **Le PO décide.** Rien n'est fusionné sur `main` sans son accord : on livre par pull request.
2. **Enfant d'abord** : aucune donnée de l'élève ne quitte l'appareil sans que ce soit dit aux parents ; pas de traqueur,
   pas de service tiers ajouté sans accord ; textes et exemples adaptés à un enfant de 11–12 ans (vocabulaire, thèmes).
3. **Pédagogie juste** : tout contenu anglais (mots, IPA, traductions, exemples, règles de grammaire) est vérifié ;
   anglais britannique par défaut (cohérent avec le programme français) ; niveau A1–A2 (CECRL).
4. **Site statique** : pas de serveur ni d'étape de build à l'exécution ; l'app doit tourner telle quelle sur GitHub Pages
   et en local (`python3 -m http.server`). Outils de développement (tests, formatage) autorisés hors exécution.
5. **Ne rien casser** : la progression des élèves (localStorage `kai.*`, fichiers de sauvegarde) doit survivre à chaque version.
6. **Chaque agent est critique** : il note ses constats, propositions et questions au PO dans `docs/` (pas de dossier tickets ici).

## Conventions
- Français pour la doc et les commentaires ; identifiants en anglais.
- Commits : `type(kai): message` (feat, fix, refactor, test, docs, chore, ci, security).
- Tests : `tests/` (Playwright, Python), lancés en CI.
