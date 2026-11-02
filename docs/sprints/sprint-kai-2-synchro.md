# Sprint Kai 2 — lancement du sprint A (02/11/2026, 08:30, scrum master)

Référence : `docs/backlog/2026-10-30-retours-po.md` (« Plan de lundi », décision du PO du 31/10, 10:19),
**confirmé par le PO le 02/11 à 08:28**. Base : `sprint-kai-2` @ `2137e53` (= `main` v1.0 + backlog).
Chaque agent travaille sur `kai/<nom>`, le scrum master fusionne dans `sprint-kai-2`.
Livraison finale : pull request `sprint-kai-2` → `main` (v1.1), le PO fusionne.

## Sprint A (en parallèle, une zone par agent)
| Agent | Modèle | Chantier | Fichiers dont il est propriétaire |
|---|---|---|---|
| **Dédé** | Sonnet, effort élevé | Tests de parcours stabilisés (P07, P12 et tous les délais fixes → attentes d'état) ; test « premier lancement » adapté à l'accueil « Start » ; simulation petits iPhone (SE 375×667, mini 375×812) et WebKit ; liste à cocher iPhone (5 min) pour le fils | `tests/`, `docs/tests/` |
| **Ouss** | Sonnet, effort élevé | R1 police des bulles (≥ 18 px, graisse 500, interligne 1,4) ; R2 cadrage des images sur petits iPhone ; R3 désélection d'un thème dans Words ; T3 « Taille du texte : normale / grande / très grande », mémorisée par élève | `css/app.css`, `js/app-words.js`, `js/app-noms-lexiques.js`, réglage de taille dans `js/app-profils.js` (bloc dédié) |
| **Matt** | Opus | Conception des épreuves de certificat (formats sans QCM, mode sans son, banque de questions par thème) ; 2–3 maquettes cliquables de « My daily work » (Jour / Semaine / My level / Rewards, place de la tuile Certificates), **validées par le PO avant tout code** | `docs/certificats/`, `docs/ux/maquettes-daily/` (aucun code de l'app) |
| **Ludo** | Opus | Moteur des certificats : stockage par élève + « Save & move », validité 3 mois (6e) / 6 mois (B1–B2), sortie des mots du jour, renouvellement 8 questions à 80 % pondéré mots rares / ratés | nouveau `js/app-certificats.js`, branchements minimes dans `js/app-daily.js` et `js/app-v51-sauvegarde.js` |

Le scrum master prend les tâches légères d'Ani : page « Crédits » dans l'aide (sprint A), tests de parcours remis
**bloquants** dans le workflow (sprint B, après Dédé).

## Sprint B (après fusion du sprint A et choix de maquette du PO)
Ouss : tuile « Certificates », écrans d'épreuve, badge daté, page imprimable (+ maquette daily choisie si le temps le permet) ;
Ludo : fin du moteur, rappel une semaine avant ; Dédé : tests des certificats, tests remis en bloquant ; Matt : questions des premiers thèmes.
Puis **contrôle a posteriori d'Ani** (Sonnet, ≈ 10 min) avant la PR v1.1.

## Règles
- Progression `kai.*` et fichiers de sauvegarde relus tels quels (zéro régression, `tests/run_all.py`).
- Site statique, `python3 -m http.server`. Commits `type(kai): …`, petits et fréquents.
- Fichiers partagés (`index.html`, `css/app.css`) : uniquement les blocs de son chantier.

## Candidats sprint Kai 3 (exprimés par le PO le 02/11 au matin, à reconfirmer)
Leçons rangées par niveau (S-15) ; espace parent unique + information micro (S-17/S-18) ; mise en page tablette avec
2 maquettes (S-14 — le PO avait dit non le 30/10, oui le 02/11) ; contrôles de classe saisis par le parent (déjà prévu
après les certificats ; le contrôle écrit dans le code est daté du 02/11 : l'écran « Test 6th grade » est vide ensuite).
Délai après mauvais codes parent : oui le 30/10, non le 02/11 → **à trancher**.
