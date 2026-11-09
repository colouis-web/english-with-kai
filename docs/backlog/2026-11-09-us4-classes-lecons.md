# US4 — Leçons rangées par classe (sprint 3, 09/11/2026)

**Demande du PO** : classer les leçons de grammaire et de conjugaison par classe (6e, 5e, 4e, 3e…), d'après les programmes du collège et du lycée.

**Ce qui est livré dans l'aperçu**
- Pages Grammar et Conjugation : les leçons sont groupées sous des titres « 6e · A1 · Sixième », « 5e · A1–A2 », « 4e · A2 », « 3e · A2–B1 », « Lycée · B1 ». Chaque tuile porte aussi une étiquette de classe (6e, 5e…).
- Les raccourcis 6e · 5e · 4e · 3e · Lycée en haut de page ont été retirés à la demande du PO (09/11, 09:27).
- La numérotation des tuiles suit ce nouvel ordre.
- « Lesson of the week » propose la première leçon non réussie dans l'ordre des classes (6e d'abord), et non plus dans l'ancien ordre.
- La progression des élèves n'est pas touchée : elle est enregistrée par identifiant de leçon.
- La table vit dans `js/app-lecons.js` (`LCLASS`). Une leçon nouvelle qui n'y figure pas est rangée au lycée.

**Repères utilisés**
- Programme du cycle 3 (CM1, CM2, 6e), niveau A1 visé. Sa déclinaison linguistique pour l'anglais cite : présent simple, be + -ing, be et have got, impératif, can, articles, pronoms sujets, possessifs, génitif, questions, négation, pluriels, prépositions, l'heure et la date. Le prétérit n'y apparaît qu'en formules toutes faites, et will seulement en initiation.
- Programme du cycle 4 (5e, 4e, 3e), niveau A2 visé en fin de 3e (B1 sur certaines activités). La répartition entre 5e, 4e et 3e n'est pas fixée par les textes officiels. Elle suit la progression habituelle des manuels de collège.
- Lycée : niveau B1 à B2.

**Correspondance proposée**

| Classe | Conjugaison | Grammaire |
|---|---|---|
| 6e | To be, To have, Present simple, Present continuous, Imperative | Articles, Plurals, Personal pronouns, Possessives, This/that…, Questions, Negative sentences, Like + -ing, Prepositions, Time and dates, Genitive 's |
| 5e | Past simple, Future (will, going to) | Quantifiers, Sentence order, Comparatives, Superlatives, Adverb position, Modal verbs |
| 4e | Past continuous, Used to, Present perfect, If + present → will, Conditional (would) | Reflexive pronouns, Relative pronouns |
| 3e | Present perfect continuous, Past perfect | How to say « on », The passive voice, Reported speech |
| Lycée | Future perfect, Conditional perfect | — |

**Points à trancher par le PO**
1. **Passive et Reported speech** : l'analyse UX du 30/10 les plaçait en 2nde. Je les mets en 3e, où ils sont souvent introduits. Lycée possible.
2. **Modal verbs (5e)** : can se voit dès la 6e, mais la leçon couvre aussi must, should, may et have to. D'où la 5e.
3. **Conditional (4e)** : « I would like » se dit dès la 6e comme formule, mais le conditionnel comme temps arrive plutôt en 4e ou en 3e.
4. **Sentence order (5e)** : la leçon va « jusqu'au niveau B1 ». On pourrait la placer en 6e pour la base.

## Vérification : leçons qui manquent (09/11, demande du PO)

J'ai comparé les notions des programmes avec le contenu de nos 38 leçons (recherche dans les explications et les tableaux).

**Cycle 3 (6e), d'après la déclinaison linguistique officielle.** Presque tout est couvert. Manquent ou ne sont traités qu'en passant :

| Notion du programme | Où on la trouve aujourd'hui | Proposition |
|---|---|---|
| There is / there are | quelques exemples dans To be, Sentence order, Quantifiers | **leçon dédiée en 6e** |
| Can / can't (capacité, permission) | dans Modal verbs, rangée en 5e | **leçon dédiée en 6e**, ou Modal verbs coupée en deux (can en 6e, must / should / may en 5e) |
| Mots de liaison and, but, or, because | aucune leçon (le dictionnaire Connectors en a la liste) | **leçon courte en 6e** |
| Exclamation : What a…! How…! | absent | petite leçon 6e, ou une section dans Sentence order |
| Nombres (cardinaux, ordinaux) | seulement dans Time and dates | à voir : peut-être une section en plus |

**Cycle 4 (5e à 3e).** Le texte officiel ne détaille pas la grammaire classe par classe. Je n'ai pas pu ouvrir la déclinaison linguistique du cycle 4 (lien bloqué), donc cette liste suit les manuels courants :

| Notion | Où on la trouve aujourd'hui | Proposition |
|---|---|---|
| Verbe + -ing ou + to (enjoy doing, want to do, stop doing) | seulement « like + -ing » | **leçon en 4e** |
| Want someone to do, make / let someone do | absent | **leçon en 3e** |
| Formation des mots (un-, -ful, -less…) | absent | facultatif, 3e |

**Lycée** (hors niveau A1–A2 de l'app) : so / such, would rather / had better. À garder pour plus tard.

Déjà couverts et bien placés : question tags (Questions), going to (Future), if + prétérit → would (Conditional), both / either / neither (Quantifiers), say / tell (Reported speech), for / since (Present perfect).
