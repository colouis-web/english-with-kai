# Données : thèmes sensibles, doublons C4, IPA C5 — Ludo, 30/10/2026 (branche kai/ludo-2)

## 1. Thèmes sensibles exclus des mots du jour (I-03, Q-02 ; décision du scrum master en attendant le PO)

- **Liste** : `js/data/themes-sensibles.js` (chargé avant `js/app-usage.js`). Thèmes entiers (noms : End of life, War,
  Justice, Finance ; adjectifs : End of life, Justice, Money), **exceptions** sans danger (money, pocket money, peace,
  flag, medal, police officer, rule, truth, ghost, skeleton…), et mots isolés (verbes die, steal, shoot, attack, bury,
  arrest, rob…). Modifier = ajouter / retirer un mot dans une liste ; règle en tête du fichier.
- **Effet aux niveaux 0–1 (Beginner, Elementary)** : jamais proposé automatiquement : nouveaux mots du jour, mots à revoir,
  repli quand une nature est épuisée, « Words you often miss », quiz « All … », distracteurs, dictée.
  **Inchangé** : dictionnaires, recherche, quiz d'un thème choisi par l'élève (ex. War), niveaux 2–3.
- **Branchement** (5 petits points) : `lvOkWord` (`app-usage.js`), `pickMix` (`app-daily.js`), `pickWords`
  (`app-quiz.js`), `wPool` (`app-v51-sauvegarde.js`), `memStats` et `wrongs` (`app-v54-v62.js`), `index.html` (1 ligne).
  Aucun fichier modifié par Ouss (app-talk*, app-voix-menu, app-lecons, app.css). `index.html` : une ligne, à signaler à la fusion.
- **Progression** : aucune clé `kai.*` modifiée. Un mot sensible déjà vu reste dans la mémoire de l'élève, ne revient
  pas en révision tant qu'il est au niveau 0–1, puis revient normalement au niveau 2.
- **Vérifié (Playwright, profil simulé, 30 jours × 3 tours, horloge décalée)** : avant, Beginner = *death, coffin,
  murder, tax, die* dès le 1er jour ; après, **0 mot sensible sur 750 (Beginner) et 660 (Elementary)**, y compris
  avec *death / coffin / murder / tax / die* déjà dans la mémoire ; 0 dans 120 quiz « All » et leurs distracteurs ;
  62 thèmes toujours couverts (la rotation est intacte) ; niveau 2 = témoin, les mots sensibles reviennent. 0 erreur console.

## 2. C4 : questions en double

- **Doublons exacts (même énoncé + mêmes options)** : 4, tous entre `LESSONS[id].practice` et `LBANK[id]` :
  articles « I love ___ chocolate. », « My cousin goes to ___ university in London. », order « ___ are three apples
  on the table. », have « I ___ a cat. ». **Supprimés de `LBANK`** (la version de `practice`, chargée en premier, reste).
- **Clés de progression** : `kai.pq.*` et `kai.tq.*` stockent un **hachage du contenu** (`q|o[0]`, `pqHash`), pas un
  index : rien n'est décalé. De plus `lessonBank()` dédoublonnait déjà sur `q|o[0]` : la banque vue par l'élève est
  identique avant / après (articles 98, order 103, have 99 questions). TTYPE : 0 doublon (clé = `q`).
- **Les exemples du bug ne sont pas des doublons** : « She has a ___. » ×5, « I have three ___. » ×5, « We want a ___. »
  ×4 (`order`) ont des réponses différentes (black dog, little bag…) ; « Tom and Lily ___ in the kitchen. » (`be`) =
  une affirmative et une négative ; `cond#64/#66` = build / make. Rien supprimé : ce sont des questions distinctes.

## 3. C5 : IPA des connecteurs

68 connecteurs complétés (`ipa` + `pr`), 69/69 affichent la ligne de prononciation. Doutes listés dans
`relecture-ipa-connecteurs.md` (relecture du scrum master).

## Critiques & propositions

- **C4, la vraie gêne est le même énoncé avec une autre réponse** : proposer au tirage (`pickPractice`, `pickRot`)
  « pas deux fois le même `q` dans une série », sauf pour les consignes génériques (« Quelle phrase est correcte ? »).
  0,1 dj, sans toucher aux données ni aux clés. Option B : réécrire les 15 énoncés répétés de `order` (contenu, Matt, 0,25 dj).
- **`cond#66`** « My cousin would ___ a snowman. » (make) est quasi identique à #64 (build) : le réécrire
  (« … ___ a cake. ») coûte 1 minute ; la clé change mais l'effet est seulement « une question redevient nouvelle ».
- **Liste sensible plutôt que « cœur 6e »** (S-12 de Matt) : j'ai pris la liste noire demandée, plus rapide et sans
  risque de vider les mots du jour. La liste blanche « programme 6e » (`NCAT[c].lv`) reste la bonne cible pour le lot L5 ;
  les deux se combinent.
- **Mots non couverts** : phrasal verbs et idioms ne sont pas dans les mots du jour, donc pas filtrés ; les **exemples**
  de mots neutres peuvent parler de thèmes adultes (non audité, ~2 400 phrases : proposition 0,5 dj).

## Questions au PO

| # | Question | Hypothèse retenue | Impact |
|---|---|---|---|
| L-01 | Le filtre doit-il s'arrêter à Elementary (niveau 1) ou couvrir aussi Intermediate (11–12 ans peuvent y arriver vite) ? | Niveaux 0–1, comme demandé (`maxLevel: 1`, une valeur à changer). | 0 dj |
| L-02 | Halloween (*ghost, skeleton*) et religion (*church, priest, angel*) : gardés pour un Beginner ? | Gardés (programme de 6e) ; *skull, heaven, soul, prayer* exclus. | 0 dj, liste à éditer |
| L-03 | Les exemples de phrases doivent-ils être audités pour les thèmes sensibles ? | Non ce sprint. | 0,5 dj |
