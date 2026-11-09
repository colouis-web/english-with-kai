# US4 — Leçons rangées par classe (sprint 3, 09/11/2026)

**Demande du PO** : classer les leçons de grammaire et de conjugaison par classe (6e, 5e, 4e, 3e…), d'après les programmes du collège et du lycée.

**Ce qui est livré dans l'aperçu**
- Pages Grammar et Conjugation : les leçons sont groupées sous des titres « 6e · A1 · Sixième », « 5e · A1–A2 », « 4e · A2 », « 3e · A2–B1 », « Lycée · B1 ». Des raccourcis 6e · 5e · 4e · 3e · Lycée en haut de chaque page mènent à la bonne section.
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
