# Enrichissement du dictionnaire et de la grammaire — plan (30/10/2026)

- **Auteur** : Matt (BA / UX). **Relecture du contenu anglais** : scrum master (règle 3 de la charte).
  **Branchement** : Ludo (phase 2). **Décision** : le PO.
- **Référence** : programme d'anglais de 6e (cycle 3, A1 → A1+ du CECRL). Thèmes : famille, école, corps,
  maison, nourriture, animaux, loisirs, sports, temps et météo, vêtements, ville, pays et nationalités,
  dates et heures. Grammaire : be / have got, présent simple et en -ing, there is / are, can, pronoms,
  possessifs, génitif 's, pluriels, articles, prépositions de lieu et de temps, questions wh-, impératif,
  prétérit de be.
- **Méthode** : comptage des données réellement chargées dans l'application (Playwright) et recherche de
  ~350 mots attendus en 6e dans tous les dictionnaires (noms, verbes, adjectifs, adverbes, prépositions,
  connecteurs, phrasal verbs), y compris les pluriels et les clés de recherche.

## 1. Constat : le volume est là, le ciblage 6e non

L'application a **plus** de mots qu'il n'en faut pour la 6e (1 224 noms, 510 verbes), mais :
- environ **40 mots très courants en 6e manquent** (voir § 2) alors que des thèmes de lycée sont riches
  (Finance 49 noms, Justice 34, End of life 32, War 26) ;
- rien ne dit quels mots sont « du programme » : un Beginner reçoit *coffin* ou *insurance* aussi souvent que
  *grandma* (voir analyse UX, I-03) ;
- la grammaire couvre **toutes** les notions de 6e, mais certaines sont très peu entraînées.

## 2. Vocabulaire : manques par thème (priorité)

✓ = présent, ✗ = absent avant ce lot, **L1** = ajouté dans le lot 1.

| Thème 6e | Couverture | Manquants relevés | Priorité |
|---|---|---|---|
| Famille | bonne (36 noms) | grandma **L1**, grandpa **L1**, stepmother **L1**, stepfather **L1**, only child **L1**, best friend **L1**, stepbrother ✗, stepsister ✗, grandson ✗, granddaughter ✗ | P1 |
| Identité | faible (7) | nickname **L1** ; « age », « address », « surname » ✓ | P1 |
| École | bonne (46) | corridor **L1**, language **L1**, lunch break ✗, break time ✗, assembly ✗, register ✗ | P1 |
| Corps et santé | bonne pour le corps, **nulle pour « avoir mal »** | tummy **L1**, headache **L1**, toothache **L1**, sore throat **L1**, fever **L1**, stomach ache ✗, earache ✗, plaster ✗ | P1 |
| Maison | bonne (57) | toothbrush **L1**, toothpaste **L1**, cooker **L1**, bookcase **L1**, comb ✗, poster ✗, microwave ✗, dishwasher ✗ | P1 |
| Nourriture | bonne (47 + 45 fruits et légumes) | picnic **L1**, hot chocolate **L1**, pie ✗, muffin ✗, smoothie ✗, lollipop ✗ | P2 |
| Animaux | très bonne (93) | — (guinea pig, hamster, tortoise… ✓) | — |
| Loisirs | moyenne | hobby **L1**, party **L1**, magazine **L1**, reading ✗ (gérondif), roller skates ✗, trampoline ✗, theme park ✗ | P1 |
| Sports | bonne (32) | badminton **L1**, sports centre **L1** ; dancing, horse riding ✓ | P2 |
| Temps / météo | très bonne (29 + adjectifs) | — | — |
| Vêtements | bonne (29) | sweatshirt **L1**, raincoat **L1**, sunglasses **L1**, necklace **L1**, bracelet ✗, earring ✗, swimming costume ✗ | P1 |
| Ville | bonne (38) | zoo **L1**, market **L1**, café **L1**, bookshop ✗, newsagent's ✗, shopping centre ✗ | P1 |
| Pays et nationalités | bonne (21 pays, 32 nationalités) | Great Britain ✗, London ✗ (nom propre), America ✗ | P2 |
| Dates et heures | jours, mois, saisons ✓ ; **heure faible** | quarter **L1**, o'clock ✗, half past / quarter to (expressions) ✗, midday ✗, ordinaux third → thirty-first ✗ (seuls first, second existent) | P1 |
| Objets du quotidien | — | mobile phone **L1** | P2 |
| Verbes | très bonne (510) | practise **L1**, revise **L1**, chat **L1**, text ✗, surf (the Internet) ✗, get dressed (phrasal) ✗ | P1 |

## 3. Grammaire : couverture des notions de 6e

Exercices = QCM de la banque `LBANK` (par étiquette `t`), plus les questions à écrire `TTYPE`.

| Notion 6e | Leçon | Exercices existants | Verdict | Priorité |
|---|---|---|---|---|
| be (présent) | `be` | 80 (aff 25, neg 16, q 16, short 8) | bien couvert | — |
| **there is / there are** | `be` (section « Bonus : il y a ») | **6, tous affirmatifs** ; 0 négatif, 0 question, 0 réponse courte | **trop faible** → **lot 1 : +24** | **P1** |
| have / have got | `have` | 90 (dont `got` 12) | correct | P3 |
| présent simple | `psimple` | 123 | bien couvert | — |
| présent en -ing (+ opposition) | `pcont` | 108 (dont `vs` 18) | bien couvert | — |
| can (capacité, permission) | `modals` | ~23 avec can, mélangés à must / should / might | à isoler pour la 6e | P2 |
| pronoms sujets / compléments | `pronouns` | 65 | correct | — |
| possessifs | `possessive` | 57 | correct | — |
| génitif 's | `genitive` | 52 | correct | — |
| pluriels | `plurals` | 82 | bien couvert | — |
| articles | `articles` | 90 | bien couvert | — |
| prépositions de lieu / de temps | `prepos` | 68 (time 23, **place 18**) | lieu un peu faible (in front of, next to, between, opposite) | P2 |
| questions wh- | `questions` | 83 (dont wh 18) | correct ; « How many / How old / What time » peu présents | P2 |
| impératif | `imperative` | 52 | correct | — |
| prétérit de be | `past` (`be` 18) | 18 ; there was / were : 0 → **lot 1 : +4** | correct | P3 |
| **like / love / hate + -ing** | aucune | 0 (seul *would like* existe) | **manque** : structure phare de 6e (*I like playing football*) | **P1** |
| **l'heure et la date** | aucune | 0 (prépositions de temps seulement) | **manque** : *What time is it? It's half past seven* ; *on 2nd November* | **P1** |

Constat inverse : au moins 8 leçons sur 33 sont au-delà de la 6e (passif, discours indirect, relatives, futur antérieur,
conditionnel passé, present perfect continu…). Les garder, mais les signaler (voir analyse UX, S-15).

## 4. Plan des lots

| Lot | Contenu | Effort (dj) | Dépend de |
|---|---|---|---|
| **L1 (ce sprint)** | 34 noms + 3 verbes (§ 2, marqués **L1**) ; 24 exercices *there is / are* dans `LBANK.be` | fait (0,5) ; relecture 0,25 ; branchement Ludo 0,1 | découpage de Ludo |
| L2 | Leçon **« Telling the time & dates »** : nouvelle entrée `LESSONS` + ~50 QCM + 8 `TTYPE` ; noms o'clock / midday, ordinaux | 1 | décision PO (nouvelle leçon = nouvel ordre `LORDER`) |
| L3 | Leçon **« like / love / hate + -ing »** (ou section dans `psimple`) + ~40 QCM | 0,75 | décision PO |
| L4 | Reste du § 2 (≈ 30 mots P1 / P2) ; prépositions de lieu (+20 QCM `prepos` t `place`) ; *can* isolé (+20 QCM) | 1 | — |
| L5 | Étiquette « programme 6e » sur les thèmes (`NCAT[c].lv`) pour filtrer les mots du jour | 0,5 | décision PO (Q-02 de l'analyse UX) |

## 5. Lot 1 : ce qu'il contient et comment le brancher

Fichier : `js/data/enrichissement-2026-10-30.js` (non branché). Même format, mêmes champs et même ordre que
les entrées existantes ; ajout par `NDICT.push(...[…])`, `DICT.push(...[…])`, `LBANK.be.push(...[…])`.

**Vérifications faites** (script Playwright : fichier injecté dans l'app réelle, index recalculés comme le code
d'origine) : 0 doublon avec l'existant, champs identiques, catégories existantes dans `NCAT`, mot surligné
`*…*` dans chaque exemple EN et FR, 3 options distinctes et un `___` par exercice, traduction présente ;
les 34 noms passent le filtre Beginner ; la recherche « mamie » trouve *grandmother* et *grandma*. Banque de la
leçon *To be* : 90 → 114 questions.

**Pour Ludo** : charger le fichier **après** les données et **avant** le code d'indexation
(`DICT.forEach(… d.keys …)`, `QPOOL=…`, `NDICT.forEach(… n.keys …)`), sinon les mots n'ont pas de clé de
recherche et les verbes n'entrent pas dans les quiz. Rien d'autre à modifier. Aucune donnée d'élève n'est
touchée : les mots sont repérés par `nature:mot` (`nouns:grandma`), nouveaux pour tout le monde.

**Effet sur l'élève** : les nouveaux noms seront proposés **en priorité** dans les mots du jour (l'algorithme
choisit le thème le moins vu et le mot jamais vu) : c'est voulu, ce sont des mots de 6e.

## 6. Entrées à vérifier par le scrum master

| Entrée | Doute | Choix fait |
|---|---|---|
| `toothache` | Comptable ou non ? En anglais britannique *I've got toothache* (indénombrable) est le plus courant ; *a toothache* existe aussi. | `t:"u"`, pluriel « — ». |
| `fever` | Au Royaume-Uni on dit plus souvent *She's got a temperature*. *A fever* est correct mais moins britannique. | Gardé (c'est le mot attendu en 6e) ; ajouter *temperature* au lot 4 ? |
| `tummy` | Registre : `r:"c"` affiche l'étiquette « Childish ». Un élève de 11 ans peut le prendre mal ; `"i"` (Informal) serait peut-être mieux. | `"c"` (c'est un mot d'enfant). |
| `café` | Graphie avec ou sans accent (*cafe* est très courant au Royaume-Uni) ; la recherche « cafe » trouve les deux. | `café`. |
| `only child` | Pluriel *only children* marqué irrégulier (`ipl:true`) : correct, mais vérifier que l'affichage « Irregular! » n'induit pas en erreur. | `ipl:true`. |
| `sports centre` | Accent tonique du composé : premier élément (/ˈspɔːts ˌsentə/) selon Cambridge. | Ainsi. |
| `stepmother` / `stepfather` | Traductions « belle-mère / beau-père » ambiguës en français : précisées entre parenthèses. | Parenthèses (ignorées par la recherche). |
| `pr` (prononciation à la française) | Style repris des entrées existantes (`tooth` → « touth », `grandmother` → « GRANN-meu-zeur »), à relire en bloc. | — |
| Exercice « Look! ___ a spider on your head! » | Le distracteur *It's* donne une phrase bizarre mais pas impossible. | Gardé : le piège « c'est / il y a » est fréquent. |
| Exercice « ___ a computer… » | Distracteur *Theres* (sans apostrophe) : piège d'orthographe plutôt que de grammaire. | Gardé ; à retirer si le scrum master le juge déloyal. |
| Exercice « There ___ no lessons on Sundays. » | Distracteur *aren't* (double négation). | Gardé. |

## 7. Questions au PO

| # | Question | Hypothèse en attendant | Impact |
|---|---|---|---|
| E-1 | Créer deux **nouvelles leçons** 6e (l'heure et la date ; like + -ing) ? Elles changent l'ordre des leçons de la semaine. | Non dans ce sprint ; lots L2 / L3 prêts à écrire. | 1,75 dj |
| E-2 | Réserver les thèmes End of life, War, Justice, Finance aux niveaux Confirmed et plus (mots du jour seulement) ? | Oui (lot L5). | 0,5 dj |
| E-3 | Anglais britannique strict pour les nouveaux mots (*cooker*, *mobile phone*, *sweets*) avec, en note, la variante américaine ? | Britannique seul, comme l'existant. | aucun |
