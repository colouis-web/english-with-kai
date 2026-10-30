# Patchs de sécurité et vie privée — sprint Kai 1 (Ani, 30/10)

Suite de la revue `docs/revue-ani-2026-10-29.md`. Décision du PO du 30/10 : **on garde le micro**.

## Fait (phase 1, sans toucher à index.html)
| Sujet | Livré | Reste à brancher (phase 2) |
|---|---|---|
| CI | Tâche `tests` : `python3 tests/run_all.py` avec Playwright 1.63.0 (épinglé) + Chromium en cache ; ignorée tant que le fichier n'existe pas. Publication seulement si vérifications ET tests verts. Pull request : contrôles sans publication + un commentaire de résumé (mis à jour à chaque envoi). | rien |
| Vérificateur | `.github/verifier.py` couvre `css/` et `js/` : secrets, taille (code > 5 Mo, police > 2 Mo), `<link>`/`<script>` vers fichiers absents, `url()` des CSS, médias cités dans les JS, **ressource chargée depuis internet** (avertissement pour l'instant). | passer `EXTERNE_BLOQUANT = True` quand index.html n'appelle plus Google |
| Actions | `dependabot.yml` (hebdomadaire). Actions épinglées par SHA : `upload-pages-artifact`, `deploy-pages`, `cache` (v6.1.0). Aucune autre action tierce. | — |
| Polices | `fonts/` : Roboto Condensed (normal + italique, graisses 100–900, sous-ensemble latin, 83 + 94 Ko) et Noto Emoji (graisse 500, emojis de l'app, 533 Ko), WOFF (brotli indisponible ici, donc pas de WOFF2), licences OFL. `css/fonts.css`. | remplacer les `<link>` Google + `preconnect` |
| Code parent | `js/security.js` : PBKDF2-SHA256, sel aléatoire 16 o, 150 000 itérations (WebCrypto) ; migration transparente depuis le code en clair ; repli SHA-256 salé itéré 10 000 fois en JS pur si WebCrypto manque (http non local) ; comparaison en temps constant ; plafond d'itérations contre un champ trafiqué. Testé sous Node (ancien/nouveau format, repli, vecteur SHA-256). | brancher `gate()`, `askNewCode()` et l'affichage (`pcode()`), qui lisent le code en clair et de façon synchrone |

Effet de bord à connaître : après le patch, **plus aucune requête vers Google** au chargement (l'IP de l'enfant n'est plus transmise) et l'appli garde ses polices hors ligne.

## Limites assumées du code parent
- Un code de 4 à 8 chiffres se retrouve par calcul hors ligne par quiconque lit le localStorage. Le haché arrête l'œil curieux (« F12 > Application »), pas un attaquant motivé. Le but reste d'arrêter un enfant, pas de garder un secret.
- Le code protège l'interface ; il ne chiffre pas la progression.
- Le repli JS (10 000 itérations) est plus faible que PBKDF2 ; il ne sert qu'en http non local, jamais sur GitHub Pages.
- Pas de limitation d'essais : un enfant peut essayer 10 000 codes à la main, c'est long mais possible. Proposition : délai croissant après 5 erreurs (petit, à demander au PO).

## Reste à faire / à proposer au PO
1. **Micro** (maintenu) : texte d'information des parents à rédiger (à proposer à Matt pour la relecture) : ce que fait le micro, que la reconnaissance vocale passe par le service du navigateur (Chrome envoie l'audio à Google), qu'on peut le refuser dans le navigateur, qu'aucun son n'est conservé par l'appli. À afficher au premier usage et dans « Me ». Dépend de la phase 2 (index.html).
2. **Double authentification GitHub** sur le compte propriétaire (obligatoire côté sécurité : qui prend le compte publie sur le site de l'enfant). Action du PO, 2 minutes (clé d'accès ou application). Protéger aussi `main` (pull request + contrôles « Vérifier » et « Tests » obligatoires) : réglage du PO dans Settings > Branches.
3. Réglage Pages « Source = GitHub Actions » (déjà demandé dans le workflow).
4. En-têtes HTTP (CSP, etc.) impossibles sur GitHub Pages : mettre une balise `<meta http-equiv="Content-Security-Policy">` restrictive (`default-src 'self'`) une fois les polices locales branchées ; à tester par Dédé. Coût : quelques lignes, risque de casser un `onclick` en ligne.

## Questions au PO
- Délai croissant après erreurs de code parent : oui/non ? (≈ 0,5 demi-journée, hypothèse : non pour l'instant.)
- Balise CSP : oui ? (≈ 0,5 demi-journée avec les tests ; hypothèse : proposée en sprint suivant.)
