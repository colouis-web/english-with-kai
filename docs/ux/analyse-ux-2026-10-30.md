# Analyse UX — Learning English with Kai (30/10/2026)

- **Auteur** : Matt (BA / UX), sprint Kai 1. Relecture : scrum master. Décision : le PO.
- **Méthode** : parcours complet comme un élève de 11 ans (« Léo », Beginner) avec Playwright + Chromium,
  en **téléphone 390×844** (usage principal) et **ordinateur / tablette paysage 1280×800**. Captures dans
  `/tmp/kai-matt/` (non versionnées : elles contiennent un prénom de test ; à régénérer avec les scripts de Dédé).
  Préfixe `tel-` = téléphone, `pc-` = 1280×800.
- Références : Duolingo (session courte, une action par écran, progression visible), Babbel (révision espacée
  expliquée), Quizlet (modes d'étude, tolérance aux fautes de frappe), Lingokids (contenu filtré par âge,
  pas de contenu anxiogène), Apple HIG / Material (cibles ≥ 44 pt / 48 dp), WCAG 2.2 AA (contraste 4,5:1,
  cible 24 px min. 2.5.8), recommandations dyslexie (British Dyslexia Association : pas de texte tout en
  majuscules, interligne ≥ 1,5, pas d'italique long).

---

## 1. Ce qui marche bien (à garder)

| Force | Où | Pourquoi c'est bien |
|---|---|---|
| Kai, personnage incarné, voix enregistrée, humeurs | partout | Lien affectif, comme Duo de Duolingo, mais plus « grand frère » que mascotte : bon choix pour un 11-12 ans. |
| Démarrage direct sur **My daily work** pour un élève connu | ouverture | Zéro clic pour arriver au travail du jour. |
| Mots **dans une phrase** avec traduction, audio, 2 sens + écriture | quiz (`tel-09`, `tel-13`) | Pédagogie solide : reconnaissance → production, en contexte. |
| Correction immédiate, bonne réponse en vert, phrase complète | quiz, leçon (`tel-09`, `tel-33`) | Feedback clair et rapide. |
| Reprise d'un tour interrompu | `tel-08-resume-modal` | Un enfant est interrompu tout le temps : rien n'est perdu. |
| Répétition espacée réelle (1→32 jours) et « Words you often miss » | daily | Le cœur d'une appli de vocabulaire efficace, rare chez les concurrents gratuits. |
| Leçons en français avec encadré « pièges des francophones » | `tel-31` | Très bien ciblé pour un élève français. |
| Pas de compte, pas de traqueur, sauvegarde en fichier | Me | Respect de l'enfant (voir aussi la revue d'Ani). |
| Recherche bilingue tolérante aux accents | Words (`tel-22`) | « chat » trouve *cat* et *kitten*. |
| Boutons principaux larges (≥ 54 px), retour 44×44, zoom non bloqué, `prefers-reduced-motion` géré | partout | Bonne base d'accessibilité tactile. |

## 2. Irritants classés

Gravité : **G1 bloquant / trompeur** (l'élève apprend faux ou ne trouve pas), **G2 gênant** (effort ou
confusion récurrents), **G3 confort**.

| # | Gravité | Écran | Constat | Capture |
|---|---|---|---|---|
| I-01 | **G1** | Let's talk English | Pour « kai see elephant big », Kai affiche **« CORRECT SENTENCE : Kai sees elephant big. »** (avec audio) et traduit « Kai voit l'éléphant grand ». L'élève entend et mémorise une phrase fausse (article manquant, ordre de l'adjectif). | `tel-56-talk-check-1-crop.png` |
| I-02 | **G1** | Tests notés | Le **Grammar test** d'un Beginner A1 qui n'a fait qu'une leçon mélange les **20 leçons** : 3e question = *reported speech* (B1). Même logique pour la conjugaison (futur antérieur, conditionnel passé). Note /20 injuste et décourageante. | `tel-43-test-feedback.png` |
| I-03 | **G1** | Mots du jour | Un Beginner reçoit des mots hors programme 6e et parfois sensibles : *death, coffin, funeral, murder, bomb, debt, tax, insurance* (thèmes End of life, War, Justice, Finance). Pire : l'algorithme choisit **le thème le moins vu**, donc pousse ces thèmes en priorité. 1er tour réel : *greedy, coconut, death, nursery school, lavender*. | `tel-14-end-full.png` |
| I-04 | **G2** | My daily work | Écran de **2 900 px** (3,5 écrans de téléphone), 12 blocs. Au 1er lancement, le bouton **Start** est **sous la ligne de flottaison** (bandeau contrôle + humeur au-dessus). | `tel-05-boot-full-part0/1.png` |
| I-05 | **G2** | Récompenses | Trois seuils différents : leçon « passed » à **70 %**, étoile de leçon à **80 %**, objectif de niveau à 80 % de moyenne ; plus étoiles du jour, étoiles de leçon, trophée, médailles, rang, série, niveau. Sur l'écran de fin de leçon : « Lesson passed (70% needed) », « NEW STAR! », « 2 more practices at 80% », « +2 stars ». Trop de monnaies pour un enfant. | `tel-34-practice-end.png` |
| I-06 | **G2** | Accueil | Le gros bouton noir est **Listen to Kai** ; la vraie action (« Tap Kai to start ») est un petit texte gris de 14 px. | `tel-01-home.png` |
| I-07 | **G2** | Partout | Contrastes insuffisants : gris `--mut #8a8fa3` sur blanc **3,2:1**, turquoise `#13a6b3` sur blanc **2,9:1** (mots en surbrillance, titres « Today », date) et blanc sur turquoise 2,9:1 (bouton GO). WCAG AA demande 4,5:1. | toutes |
| I-08 | **G2** | Partout | Texte **tout en majuscules** dans les bulles de Kai, titres, boutons, y compris les phrases françaises à traduire (« CE PONT EST EN FER »). Pénible pour un lecteur débutant ou dyslexique (on lit la silhouette des mots). | `tel-07-quiz-q1.png` |
| I-09 | **G2** | Tablette / ordinateur | Colonne de 448 px au centre, deux tiers de l'écran vides ; tuiles du menu empilées ; sur 1280×800, le bouton « Check my sentence » est sous la ligne de flottaison. | `pc-04`, `pc-05`, `pc-54` |
| I-10 | **G2** | Menu | 6 tuiles de ~185 px : seules 3 sont visibles sans défiler sur téléphone ; « Test yourself » contient lui-même 4 tuiles (dont Quiz qui en contient 9). Le menu « Words » mélange niveau 6e (nouns) et niveau lycée (idioms, phrasal verbs de dissertation). | `tel-20-menu-full.png`, `tel-50-ty.png` |
| I-11 | **G2** | Grammar / Conjugation | Les 20 leçons sont présentées à plat, sans repère de niveau : *Plurals* (6e) à côté de *Passive* et *Reported speech* (2nde). Leçon de 3 400 px avant le bouton Practise. | `tel-30-grammar.png`, `tel-31-lesson-full.png` |
| I-12 | **G2** | Test 6th grade | Les contrôles de la classe sont **écrits dans le code** (un seul, 02/11). Après cette date, l'écran sera vide ; il faut une nouvelle version à chaque contrôle. | `tel-55-t6.png` |
| I-13 | **G2** | Me / niveau | Sans code parent, changer de niveau demande de… taper **son propre prénom** : aucune protection réelle. Le réglage parent est en bas d'une longue page. | `tel-61-me-level-gate.png` |
| I-14 | **G3** | Type it | « nursery schoox » (1 lettre) = faux, alors que Kai dit « ALMOST! ». Quizlet / Duolingo acceptent une coquille avec un avertissement. Le bouton CHECK reste affiché après la réponse. | `tel-13-typeit-1.png` |
| I-15 | **G3** | Fin de tour du jour | Message « Get 100% both ways to unlock new words! » alors qu'en tour du jour, de nouveaux mots arrivent de toute façon (« Next words »). | `tel-14-end-full.png` |
| I-16 | **G3** | Textes | Libellés : « Practicer » n'existe pas en anglais ; « Test 6th grade » est américain (britannique : *Year 7*) ; carte du test « 19 grammar lessons » alors qu'il y en a 20 ; placeholder tronqué « Search a noun in French or in En… ». | `tel-02`, `tel-24` |
| I-17 | **G3** | Mauvaise réponse | Kai **pleure** à chaque erreur (image *kai-cry*). Duolingo a abandonné les réactions négatives fortes : l'erreur doit rester normale. | `tel-09-feedback-wrong.png` |
| I-18 | **G3** | Accessibilité | `<html lang="en">` et aucun `lang="fr"` sur les textes français : un lecteur d'écran lit le français avec l'accent anglais. Cibles < 44 px : puces de thèmes 36 px, bouton d'aide « ? » 34 px, boutons secondaires 40 px. | `tel-24-nouns.png` |
| I-19 | **G3** | Let's talk | Aucune vérification que la phrase parle de l'image (une phrase sur l'éléphant est « GREAT » devant l'image du ski). Le bouton flottant « haut de page » recouvre le texte de la correction. Aucun avertissement sur l'envoi de la voix (revue d'Ani I-1). | `tel-56-*` |
| I-20 | **G3** | Nouns | 34 puces de thèmes en défilement horizontal : on ne voit que 2 thèmes et rien n'indique qu'on peut faire défiler. | `tel-24-nouns.png` |

### Top 5 (à traiter en priorité)
1. **I-01** phrase fausse présentée comme correcte (Let's talk).
2. **I-02** tests notés sur des leçons jamais vues.
3. **I-03** mots du jour hors programme et thèmes sensibles pour un Beginner.
4. **I-04** bouton Start sous la ligne de flottaison, écran du jour trop long.
5. **I-07 / I-08** contraste et majuscules (lisibilité pour un enfant, dyslexie).

## 3. Suggestions d'amélioration

Chiffrage en demi-journées d'agent (dj). **[RAPIDE]** = ≤ 0,25 dj, sans décision de besoin : Ouss peut les
faire ce sprint après validation du scrum master. Les autres sont **à décider par le PO**.

### 3.1 Rapides (Ouss, phase 2)

| # | Suggestion | Irritant | Effort | Critère d'acceptation (testable par Dédé) |
|---|---|---|---|---|
| S-01 | **[RAPIDE]** Let's talk : quand la phrase reconstruite n'est pas sûre (article manquant, adjectif après le nom, mot inconnu), remplacer « Correct sentence » par « **Kai's suggestion** » et ajouter une phrase modèle de la scène (`m[0]`). Ne jamais lire à voix haute une phrase non validée. | I-01 | 0,25 | Étant donné l'image du safari, quand je tape « kai see elephant big », alors le libellé « Correct sentence » n'apparaît pas et une phrase modèle de la scène est proposée. |
| S-02 | **[RAPIDE]** Accueil : faire de **« Start »** (ou « Let's start! ») le bouton principal ; « Listen to Kai » devient un bouton secondaire. | I-06 | 0,1 | Au premier lancement, le bouton le plus visible mène à l'écran Hello. |
| S-03 | **[RAPIDE]** My daily work : remonter **Today's goal** juste sous la date ; le bandeau contrôle et l'humeur passent en dessous (humeur repliée en une ligne une fois choisie, comme aujourd'hui). | I-04 | 0,25 | À 390×844, au premier lancement, le bouton Start est visible sans défiler. |
| S-04 | **[RAPIDE]** Contraste : `--mut` → `#5f6478` (≈ 6:1) ; texte turquoise → `#0b7f89` (≈ 4,9:1) ; bouton GO texte foncé ou fond `#0b7f89`. | I-07 | 0,15 | Tous les couples texte / fond mesurés ≥ 4,5:1 (outil axe ou calcul). |
| S-05 | **[RAPIDE]** Majuscules : retirer `text-transform:uppercase` des bulles de Kai et des phrases d'exercice ; le garder pour les titres courts. | I-08 | 0,15 | La phrase à traduire s'affiche en casse normale (« Ce pont est en fer. »). |
| S-06 | **[RAPIDE]** Libellés : carte du test calculée (`LORDER.grammar.length`), placeholder « Search a noun… » (court), « Practicer » → nom choisi par le PO (Q-05, hypothèse « Improver » ; « Explorer » est déjà un rang) — le texte seul est rapide. | I-16 | 0,1 | La carte du Grammar test affiche le nombre réel de leçons ; aucun placeholder tronqué à 390 px. |
| S-07 | **[RAPIDE]** Fin de tour du jour : remplacer « Get 100% both ways to unlock new words! » par « Next round: new words and the ones you missed! » en mode quotidien. | I-15 | 0,05 | En tour du jour avec un score entre 60 et 99 %, le message ne parle plus de « unlock ». |
| S-08 | **[RAPIDE]** Type it : une faute d'une lettre (distance 1) sur un mot de ≥ 5 lettres = juste avec avertissement « Watch the spelling: *nursery school* » ; masquer CHECK après réponse. | I-14 | 0,2 | « nursery schoox » est compté juste et l'orthographe correcte est affichée. « dog » → « dig » reste faux. |
| S-09 | **[RAPIDE]** Mauvaise réponse : remplacer *kai-cry* par une image neutre (*kai-head* / *kai-think*) ; garder *cry* pour l'humeur « Sad ». | I-17 | 0,05 | Aucune image de Kai qui pleure après une erreur. |
| S-10 | **[RAPIDE]** Accessibilité : `lang="fr"` sur les traductions et textes français (`.fr`, `.t3fr`, intro de leçon) ; puces et bouton « ? » à 44 px de haut. | I-18 | 0,2 | Lighthouse / axe : 0 cible < 24 px, textes FR balisés `lang="fr"`. |

Total rapides : **≈ 1,5 dj** (10 lots indépendants, chacun faisable en 10 minutes de sprint).

### 3.2 À décider par le PO

| # | Suggestion | Irritant | Effort | Ce que ça change / risque |
|---|---|---|---|---|
| S-11 | **Tests notés limités aux leçons déjà réussies** (ou vues) ; au moins 3 leçons pour débloquer le test, sinon « Do 3 lessons first ». | I-02 | 0,5 | Notes justes ; la clé de progression `kai.tq.*` reste compatible. Question Q-01. |
| S-12 | **Mots du jour par programme** : marquer les thèmes « cœur 6e » (famille, école, corps, maison, nourriture, animaux, loisirs, sports, météo, vêtements, ville, pays, temps) ; un Beginner ne reçoit que ces thèmes ; End of life, War, Justice, Finance réservés à Confirmed+ ou à la recherche libre. | I-03 | 0,5 | Donnée `NCAT[c].lv` + 1 ligne dans `lvOkWord`. Ne touche pas la progression existante. Question Q-02. |
| S-13 | **Simplifier les récompenses** : un seul seuil de réussite (80 %) ; étoiles + trophée + série visibles, médailles et rang dans une page « My rewards ». | I-05 | 1 | Changer `PASS` 70 → 80 rend « non réussies » des leçons déjà réussies entre 70 et 79 % : il faut garder l'acquis (migration). Question Q-03. |
| S-14 | **Mise en page tablette / ordinateur** (≥ 900 px) : menu en grille 2 × 3, My daily work en 2 colonnes (objectif + mémoire à gauche, semaine / récompenses à droite), leçon avec Practise toujours visible en colonne latérale. | I-09, I-10 | 2 | CSS uniquement (`@media (min-width:900px)`), pas de changement de comportement. Tests visuels de Dédé à refaire. |
| S-15 | **Leçons par niveau** : badge « 6e » / « 5e » / « Lycée » sur chaque leçon, les leçons au-delà du niveau repliées dans « More lessons » ; bouton **Practise** fixé en bas de la leçon. | I-11 | 1 | Ne supprime rien ; la leçon de la semaine reste dans l'ordre. Je propose l'ordre 6e : be, have, present simple, -ing, imperative, past (be) en conjugaison ; plurals, articles, pronouns, possessive, genitive, questions, prepos, demonstr en grammaire. |
| S-16 | **Contrôles de classe saisis par le parent** (écran Me › Class tests : date, titre, liste de mots collée) au lieu d'être dans le code. | I-12 | 2 | Nouvelle clé `kai.t6list.<élève>` incluse dans la sauvegarde. Évite une publication à chaque contrôle. |
| S-17 | **Espace parent** : regrouper niveau, code parent, sauvegarde, suppression derrière **un seul** code (obligatoire au premier accès, avec la phrase d'Ani « n'utilisez pas le code de votre carte ») ; supprimer le contrôle par le prénom. | I-13 | 1 | Dépend du hachage du code (Ani, I-3). |
| S-18 | **Let's talk : avertissement micro** avant le premier usage (texte d'Ani I-1) + bouton « Type my sentence instead » ; mots-clés de la scène (`k`) utilisés pour dire « Nice sentence! Can you talk about the picture? » quand aucun mot ne correspond. | I-19 | 0,5 | Conformité « enfant d'abord ». |
| S-19 | **Menu à 4 entrées** : *Today* (daily), *Learn* (grammar + conjugation), *Words*, *Practise* (tests, quiz, DIY, talk, class tests) + pastille Me ; tuiles de 110 px. | I-10 | 1 | Change les habitudes de l'élève : à faire avec une démo au PO (2 maquettes). |

Total à décider : **≈ 9,5 dj**.

## 4. Questions au PO

| # | Question | Pourquoi | Hypothèse retenue en attendant | Ce que change la réponse | Impact planning |
|---|---|---|---|---|---|
| Q-01 | Les tests notés doivent-ils porter **seulement sur les leçons faites** ? | I-02 : note injuste | Oui, leçons réussies seulement (S-11). | Non = on garde, mais on affiche « includes lessons you haven't done yet ». | 0,5 dj |
| Q-02 | Faut-il **retirer des mots du jour** d'un 6e les thèmes End of life, War, Justice, Finance (les garder dans le dictionnaire) ? | I-03, règle « enfant d'abord » | Oui pour Beginner et Practicer. | Engage le filtrage de tous les futurs thèmes ajoutés. | 0,5 dj |
| Q-03 | Un seul seuil de réussite (**80 %**) pour tout ? | I-05 | Non tranché : on garde 70 / 80 ce sprint. | Oui = migration des leçons déjà réussies (on garde l'acquis). | 1 dj |
| Q-04 | La tablette / l'ordinateur sont-ils assez utilisés pour une mise en page dédiée ? | I-09 | Non prioritaire ce sprint. | Oui = S-14 (2 dj) avec 2 maquettes au choix. | 2 dj |
| Q-05 | Nom du niveau 2 : « Practicer » (n'existe pas) → **Explorer** (mais c'est déjà un rang), **Improver**, **Intermediate** ? | I-16 | « Improver » (britannique, compréhensible). | Texte seul : le niveau est stocké par numéro, rien ne casse. | 0,05 dj |
| Q-06 | Les contrôles de la classe : le parent veut-il les saisir lui-même (S-16) ? | I-12 | On garde la liste en dur ce sprint. | Oui = nouvel écran parent. | 2 dj |
