# Banque des 3 premiers certificats : relecture (sprint Kai 2, sprint B)

- **Auteur** : Matt (BA / UX), 02/11/2026. **Relecteur** : scrum master (règle 3 de `CLAUDE.md`). **Décision** : le PO.
- **Fichier relu** : `js/data/certificats.js` (globale `CERTBANK`, script classique). Les tableaux ci-dessous sont
  **générés depuis ce fichier** chargé dans Chromium avec les vraies données (`allWords()`) : ce qui est relu est
  exactement ce qui est livré. Format du fichier : commentaire en tête de `js/data/certificats.js`.
- **Pour** : Ludo (moteur : lire la banque, `Cert.pickExam`, `Cert.check`), Ouss (écrans), Dédé (tests).

## 1. Ce qui est livré

| Certificat | Identifiant | Mots | `type-fr-en` | `picture` | `gap` | `order` | `fix` | `dictation` | Lignes du tableau |
|---|---|---|---|---|---|---|---|---|---|
| Colours | `adjectives:colours` | 11 | 10 | 11 | 22 | 22 | 22 | 11 | 98 |
| Family 1 · My family | `nouns:family-1` | 18 | 16 | 10 (arbre) | 36 | 34 | 33 | 18 | 147 |
| Animals 1 · Pets & farm | `nouns:animals-1` | 20 | 20 | 13 | 40 | 32 | 39 | 20 | 164 |
| **Total** | | **49** | **46** | **34** | **98** | **88** | **94** | **49** | **409** |

Chiffres = questions **possibles** (matière). Une épreuve en tire 20 (§5.2 de la conception) : chaque mot au moins
une fois, au plus deux fois, jamais deux fois dans le même format.

- `gap` : les 2 phrases d'exemple des données de chaque mot (aucune réécrite) ; réponse = le mot entre `*…*`, **forme
  exigée** (pluriel compris).
- `order` : 1 à 2 phrases par mot, 4 à 8 étiquettes, sans virgule ni complément de temps déplaçable. Reprises des
  exemples quand elles s'y prêtent (sans `*`), sinon **écrites pour la banque** (signalées dans le tableau).
- `fix` : **toutes écrites à la main** (1 à 2 par mot) : une seule erreur, sur le mot du périmètre, corrigeable en
  remplaçant **un** mot ; la phrase française (juste) est montrée en 6e (Q8) et lève toute autre correction possible.
- `dictation` : Kai dit « mot. phrase. mot. » ; la phrase est une des phrases d'exemple.
- `picture` : voir §2.
- `type-fr-en` : la traduction des données (`fr`), sauf 2 cas précisés dans la banque (*grandmother*, *grandfather* :
  « une grand-mère » au lieu de « une grand-mère / mamie », qui désigne aussi *grandma*) ; **pas de question** pour
  *orange*, *parent*, *cousin* (champ `skip`) : le mot français s'écrit comme l'anglais, la question donnerait la réponse.

## 2. Images (`picture`) : le choix

**Émojis seulement** (aucune image `img/*.webp`) : les images de Kai sont des scènes (Kai avec un chat, un chien…)
qui admettent plusieurs réponses (*Kai*, *boy*, *cat*, *pet*…) ; `kai-cat.webp` et `kai-dog.webp` ont été regardées
et écartées pour cette raison. Un émoji s'affiche partout, sans fichier, en mode hors ligne et sur iPhone.

| Certificat | Règle | Mots avec image | Mots sans image (et pourquoi) |
|---|---|---|---|
| Colours | Un **objet** dont la couleur est connue de tous (pas une tache de couleur : un élève daltonien doit pouvoir répondre). Consigne « What colour is it? ». | 11/11 : 🍓 red, 🌊 blue, 🐸 green, 🍌 yellow, 🥕 orange, 🦩 pink, 🍇 purple, 🐻 brown, 🎩 black, 🥛 white, 🐘 grey | — |
| Family 1 | **Arbre généalogique** (champ `tree`, 10 cases : grands-parents, parents, oncle et tante, toi, frère, sœur, cousin), une case marquée « ? ». Les cases ne montrent **que** leur émoji ; la case de l'élève dit « You ». | 10 cases portées par 10 mots : mother, father, brother, sister, grandmother, grandfather, grandparents, uncle, aunt, cousin | mum, dad, grandma, grandpa (même case que mother, father… : la case accepte les deux mots, une seule question) ; family, parent, son, daughter (l'arbre est vu depuis l'élève : *son* et *daughter* demanderaient de changer de point de vue ; 👪 serait aussi l'icône du thème) |
| Animals 1 | L'émoji des données, **une seule fois** dans le périmètre. Réponses acceptées en plus : les mots que l'émoji montre aussi (🐴 *pony*, 🐑 *lamb*, 🐶 *puppy*, 🐱 *kitten*, 🐢 *turtle*, 🐮 *calf*, 🐰 *bunny*, 🐔 *chicken*). | 13 : dog 🐶, cat 🐱, rabbit 🐰, mouse 🐭, parrot 🦜, tortoise 🐢, horse 🐴, cow 🐮, pig 🐷, sheep 🐑, goat 🐐, hen 🐔, duck 🦆 | puppy, kitten (émojis d'adultes), pony, lamb (même émoji que horse, sheep), pet, donkey (icône du thème 🐾), goldfish (🐠 est un poisson tropical : réponse *fish* tout aussi juste) |

**Si l'écran ne dessine pas l'arbre** (Ouss, ≈ 0,25 dj) : `picture` n'est pas posé pour Family 1 (la conception le
prévoit : questions remplacées par `type-fr-en` et `gap`). L'épreuve garde 5 formats écrits.

**Pour Ouss** : l'émoji 🎩 (black) et 🥛 (white) ont été préférés à 🐈‍⬛ (séquence ZWJ mal affichée sur
d'anciens Android) et ❄️ (fond blanc invisible en thème clair). À vérifier à l'écran : 🌊 (blue) doit se lire
« la mer » (la réponse reste *blue*).

## 3. Correction : ce que la banque ajoute aux règles du §3 de la conception

| Champ | Effet | Exemples |
|---|---|---|
| `ok` | Autres réponses justes, **sans note** | *aunt* : auntie, aunty ; *mum* : mummy, mother ; *grandma* : granny, gran, grandmother ; *hen* : chicken |
| `us` | Américain accepté **avec la note** « In British English: … » (Q9) | *grey* : gray ; *mum*, *mother* : mom |
| `pic.ok` | Réponses justes propres à l'image | 🐴 → pony ; 🐑 → lamb |
| `gap[2]`, `fix.ok` | Autre forme juste dans la phrase | *three goldfish* : goldfishes accepté |
| `ord[2]` | Autre ordre juste | « My cat is white and orange. » |
| `skip` | Format non posé pour ce mot | orange, parent, cousin : pas de `type-fr-en` |

**Paires de registre** (*mother / mum*, *father / dad*, *grandmother / grandma*, *grandfather / grandpa*) : elles
s'acceptent l'une l'autre dans `type-fr-en`, `gap`, `picture`, `dictation` (pas à l'étape 2 de `fix`). Le français des
données ne les sépare pas assez (« une grand-mère / mamie ») pour qu'un écart de registre compte faux. Dans la dictée,
l'élève a entendu le mot : *mother* pour « mum » sera tout de même compté juste (choix de simplicité, voir Q-B3).

**Étape 2 de `fix`** : retaper le mot fautif est **toujours faux**, même à une lettre de la correction ; la tolérance de
frappe (§3, règle 6) ne doit **jamais** accepter `bad` (ex. *grandparent* pour *grandparents* : distance 1, mais c'est
l'erreur à corriger — de toute façon refusé par la règle 5, le nombre). Les autres phrases `fix` ont été choisies
pour qu'aucun `bad` ne soit à distance 1 de `good` hors erreur de nombre (*oncle/uncle*, *cousine/cousin* retirées).

## 4. Contrôles faits

Script de vérification (Chromium, vraies données, banque chargée après l'app) : **0 erreur de page, 0 erreur de banque**.
- les **49 clés existent** dans `allWords()` et appartiennent au thème du certificat (`Cert.themeWords`) ;
- chaque `gap` a une seule cible, qui est le mot ou son pluriel des données (`pl`) ; la phrase française a sa cible ;
- chaque `order` a 4 à 8 étiquettes, contient le mot, sans virgule, deux-points ni complément de temps déplaçable ;
  chaque ordre alternatif a les mêmes étiquettes ;
- chaque `fix` : `bad` présent **une seule fois** dans la phrase, `good` = le mot ou son pluriel, `bad` ≠ `good`,
  traduction et explications présentes ;
- `picture` : aucune image partagée dans un périmètre ; chaque case d'arbre accepte le mot qui la porte ;
- chaque mot a au moins un `gap`, un `order` et un `fix` ;
- 7 avertissements, tous voulus : *purple* et *grey* sont « peu courants » pour le filtre de niveau mais au contrôle
  de la classe (conception §5.5) ; *grandparent → grandparents* (§3 ci-dessus) ; 4 émojis partagés dans le thème
  entier, couverts par `pic.ok` (tortoise/turtle, horse/pony, cow/calf, sheep/lamb).

## 5. Écarts avec la conception

1. **`picture` Colours** : 🥛 (lait) pour *white* et 🎩 (chapeau) pour *black*, au lieu de ❄️ et 🐈‍⬛ (voir §2).
2. **`picture` Family 1** : 10 questions possibles (et non 18) : une case = un mot ; *family* sans image (👪 =
   icône du thème).
3. **`picture` Animals 1** : 13 images (et non 14) : *goldfish* retiré (🐠 ≠ poisson rouge, *fish* serait juste).
4. **Nouveau champ `skip`** (*orange*, *parent*, *cousin* sans `type-fr-en`), non prévu au §4.
5. **`fix`** : 94 phrases (≈ 2 par mot) au lieu de « ≈ 50 » : de quoi ne pas reposer la même phrase au renouvellement.
6. **`alt`** de la conception = `us` (avec note) et `ok` (sans note) : deux champs, car *auntie* ou *mummy* ne
   sont pas de l'américain et ne méritent pas la note « In British English ».
7. Champ `say` (phrase de la dictée) ajouté : la conception disait « la phrase d'exemple » sans dire laquelle ;
   pour *orange* la phrase choisie est « Carrots are orange. » (lève le doute avec le fruit).
8. **🐰 → *bunny* accepté** (la conception le refusait, mot absent du dictionnaire) : c'est le mot qu'un enfant
   anglais dirait devant cet émoji ; le refuser serait injuste. À trancher par le scrum master (Q-B6).

## 6. Pour Ludo (lecture de la banque)

- `CERTBANK.certs[i].id` = identifiant du certificat (moteur §10, point 1) ; `theme` = thème des données ; `words[j].k`
  = clé envoyée à `Cert.record`.
- Le mot attendu se lit dans les données (`allWords().byKey.get(k).d.w`) ; la forme attendue d'un `gap` dans la phrase.
- Ordre de tirage : `skip` d'abord ; `picture` seulement si `pic` (et, pour `{ tree }`, si l'écran sait dessiner `tree`) ;
  `gap` et `order` : une phrase au hasard, jamais deux fois la même ; `fix` : idem ; `dictation` : `say`.
- Contrainte « afficher après produire » (§5.3, point 4) : un `fix` **affiche** le mot du périmètre sous une forme
  fausse (*brother* dans « I have two brother ») et la phrase française ; un `order` affiche le mot. Les deux viennent
  après les questions qui demandent de produire ce mot.

## 7. Questions (scrum master, puis PO si besoin)

| # | Question | Hypothèse appliquée |
|---|---|---|
| Q-B1 | Les phrases `fix` « mot français resté » (*My tante is a nurse*) : bonnes pour un enfant (erreur typique) ou trop faciles ? | **Gardées**, mêlées aux erreurs de pluriel ; à revoir si les épreuves sont réussies à 100 %. |
| Q-B2 | `fix` sur *son / sun* et *aunt / ant* (homophones) : justes et utiles ? | **Gardées** : erreurs réelles d'élèves, la phrase française lève le doute. |
| Q-B3 | Dictée : *mother* accepté quand Kai dit « mum » (paires de registre) ? | **Oui** (simplicité, aucun enfant ne s'en plaindra) ; le moteur peut l'exclure en dictée si le scrum master préfère. |
| Q-B4 | *Animals 1* : *pet* et *donkey* sans image, *goldfish* sans image : d'accord ? | **Oui.** 13 images suffisent (4 questions `picture` par épreuve). |
| Q-B5 | L'arbre de *Family 1* : si Ouss n'a pas le temps, pas de `picture` pour ce certificat ? | **Oui** (conception §2.2). |
| Q-B6 | 🐰 : *bunny* accepté (écart 8) ? | **Oui.** Le retirer = supprimer `ok: ["bunny"]` dans la banque. |

## 8. Tableau de relecture (une ligne par question possible)

Colonnes : n° · mot · format · question telle que l'élève la voit (`_____` = trou, **gras** = mot fautif, étiquettes
`order` triées par ordre alphabétique) · phrase française d'appui (6e) · réponse attendue · autres réponses acceptées
et remarques.

### Colours (`adjectives:colours`) — 98 lignes

| n° | Mot | Format | Question | Français (6e) | Attendu | Accepté aussi / remarques |
|---|---|---|---|---|---|---|
| 1 | red | type-fr-en | rouge |  | red |  |
| 2 | red | picture | What colour is it? 🍓 (une fraise) | De quelle couleur est-ce ? | red |  |
| 3 | red | gap | I have a _____ bike. | J'ai un vélo rouge. | red |  |
| 4 | red | gap | Strawberries are _____. | Les fraises sont rouges. | red |  |
| 5 | red | order | [I] [a] [bike] [have] [red] | J'ai un vélo rouge. | I have a red bike. |  |
| 6 | red | order | [a] [best] [friend] [has] [my] [red] [scooter] | Mon meilleur ami a une trottinette rouge. | My best friend has a red scooter. | phrase écrite pour la banque |
| 7 | red | fix | I have a **rouge** bike. | J'ai un vélo rouge. | rouge → red | rattrapage : Rouge is French. In English: red. |
| 8 | red | fix | I have two **reds** pencils. | J'ai deux crayons rouges. | reds → red | rattrapage : Colours never take -s: two red pencils. |
| 9 | red | dictation | « red. Strawberries are red. red. » |  | red |  |
| 10 | blue | type-fr-en | bleu(e) |  | blue |  |
| 11 | blue | picture | What colour is it? 🌊 (la mer (une vague)) | De quelle couleur est-ce ? | blue |  |
| 12 | blue | gap | The sky is _____ today. | Le ciel est bleu aujourd'hui. | blue |  |
| 13 | blue | gap | Kai has _____ eyes. | Kai a les yeux bleus. | blue |  |
| 14 | blue | order | [Kai] [blue] [eyes] [has] | Kai a les yeux bleus. | Kai has blue eyes. |  |
| 15 | blue | order | [bag] [blue] [is] [my] [school] | Mon cartable est bleu. | My school bag is blue. | phrase écrite pour la banque |
| 16 | blue | fix | Kai has **blues** eyes. | Kai a les yeux bleus. | blues → blue | rattrapage : Colours never take -s: blue eyes. |
| 17 | blue | fix | The sky is **bleu** today. | Le ciel est bleu aujourd'hui. | bleu → blue | rattrapage : Bleu is French. In English: blue. |
| 18 | blue | dictation | « blue. The sky is blue today. blue. » |  | blue |  |
| 19 | green | type-fr-en | vert(e) |  | green |  |
| 20 | green | picture | What colour is it? 🐸 (une grenouille) | De quelle couleur est-ce ? | green |  |
| 21 | green | gap | Frogs are _____. | Les grenouilles sont vertes. | green |  |
| 22 | green | gap | I'm wearing a _____ T-shirt. | Je porte un tee-shirt vert. | green |  |
| 23 | green | order | [I'm] [T-shirt] [a] [green] [wearing] | Je porte un tee-shirt vert. | I'm wearing a green T-shirt. |  |
| 24 | green | order | [a] [car] [grandpa] [green] [has] [my] | Mon papi a une voiture verte. | My grandpa has a green car. | phrase écrite pour la banque |
| 25 | green | fix | Frogs are **vert**. | Les grenouilles sont vertes. | vert → green | rattrapage : Vert is French. In English: green. |
| 26 | green | fix | I'm wearing **greens** trainers. | Je porte des baskets vertes. | greens → green | rattrapage : Colours never take -s: green trainers. |
| 27 | green | dictation | « green. Frogs are green. green. » |  | green |  |
| 28 | yellow | type-fr-en | jaune |  | yellow |  |
| 29 | yellow | picture | What colour is it? 🍌 (une banane) | De quelle couleur est-ce ? | yellow |  |
| 30 | yellow | gap | Bananas are _____. | Les bananes sont jaunes. | yellow |  |
| 31 | yellow | gap | The sun is _____. | Le soleil est jaune. | yellow |  |
| 32 | yellow | order | [is] [sun] [the] [yellow] | Le soleil est jaune. | The sun is yellow. |  |
| 33 | yellow | order | [Kai] [a] [has] [pencil] [yellow] | Kai a un crayon jaune. | Kai has a yellow pencil. | phrase écrite pour la banque |
| 34 | yellow | fix | Bananas are **jaune**. | Les bananes sont jaunes. | jaune → yellow | rattrapage : Jaune is French. In English: yellow. |
| 35 | yellow | fix | I have two **yellows** balloons. | J'ai deux ballons jaunes. | yellows → yellow | rattrapage : Colours never take -s: yellow balloons. |
| 36 | yellow | dictation | « yellow. Bananas are yellow. yellow. » |  | yellow |  |
| 37 | orange | picture | What colour is it? 🥕 (une carotte) | De quelle couleur est-ce ? | orange |  |
| 38 | orange | gap | My cat is _____ and white. | Mon chat est orange et blanc. | orange |  |
| 39 | orange | gap | Carrots are _____. | Les carottes sont orange. | orange |  |
| 40 | orange | order | [and] [cat] [is] [my] [orange] [white] | Mon chat est orange et blanc. | My cat is orange and white. | aussi : My cat is white and orange. |
| 41 | orange | order | [I] [an] [backpack] [have] [orange] | J'ai un sac à dos orange. | I have an orange backpack. | phrase écrite pour la banque |
| 42 | orange | fix | I've got two **oranges** T-shirts. | J'ai deux tee-shirts orange. | oranges → orange | rattrapage : Colours never take -s: orange T-shirts. |
| 43 | orange | fix | She has **oranges** socks. | Elle a des chaussettes orange. | oranges → orange | rattrapage : Colours never take -s: orange socks. |
| 44 | orange | dictation | « orange. Carrots are orange. orange. » |  | orange |  |
| 45 | pink | type-fr-en | rose |  | pink |  |
| 46 | pink | picture | What colour is it? 🦩 (un flamant rose) | De quelle couleur est-ce ? | pink |  |
| 47 | pink | gap | Flamingos are _____. | Les flamants sont roses. | pink |  |
| 48 | pink | gap | My sister loves _____ dresses. | Ma sœur adore les robes roses. | pink |  |
| 49 | pink | order | [dresses] [loves] [my] [pink] [sister] | Ma sœur adore les robes roses. | My sister loves pink dresses. |  |
| 50 | pink | order | [feathers] [flamingo] [has] [pink] [the] | Le flamant a des plumes roses. | The flamingo has pink feathers. | phrase écrite pour la banque |
| 51 | pink | fix | My sister loves **pinks** dresses. | Ma sœur adore les robes roses. | pinks → pink | rattrapage : Colours never take -s: pink dresses. |
| 52 | pink | fix | Look at the **pinks** flowers! | Regarde les fleurs roses ! | pinks → pink | rattrapage : Colours never take -s: pink flowers. |
| 53 | pink | dictation | « pink. Flamingos are pink. pink. » |  | pink |  |
| 54 | purple | type-fr-en | violet / violette |  | purple |  |
| 55 | purple | picture | What colour is it? 🍇 (du raisin) | De quelle couleur est-ce ? | purple |  |
| 56 | purple | gap | Grapes can be _____. | Le raisin peut être violet. | purple |  |
| 57 | purple | gap | I have a _____ pencil case. | J'ai une trousse violette. | purple |  |
| 58 | purple | order | [I] [a] [case] [have] [pencil] [purple] | J'ai une trousse violette. | I have a purple pencil case. |  |
| 59 | purple | order | [be] [can] [grapes] [purple] | Le raisin peut être violet. | Grapes can be purple. |  |
| 60 | purple | fix | She has **purples** shoes. | Elle a des chaussures violettes. | purples → purple | rattrapage : Colours never take -s: purple shoes. |
| 61 | purple | fix | Kai has two **purples** pens. | Kai a deux stylos violets. | purples → purple | rattrapage : Colours never take -s: purple pens. |
| 62 | purple | dictation | « purple. Grapes can be purple. purple. » |  | purple |  |
| 63 | brown | type-fr-en | marron / brun(e) |  | brown |  |
| 64 | brown | picture | What colour is it? 🐻 (un ours) | De quelle couleur est-ce ? | brown |  |
| 65 | brown | gap | Bears are often _____. | Les ours sont souvent bruns. | brown |  |
| 66 | brown | gap | I have _____ eyes. | J'ai les yeux marron. | brown |  |
| 67 | brown | order | [I] [brown] [eyes] [have] | J'ai les yeux marron. | I have brown eyes. |  |
| 68 | brown | order | [brown] [dog] [ears] [has] [my] | Mon chien a les oreilles marron. | My dog has brown ears. | phrase écrite pour la banque |
| 69 | brown | fix | I have **marron** eyes. | J'ai les yeux marron. | marron → brown | rattrapage : Marron is French. In English: brown. |
| 70 | brown | fix | My dog has **browns** ears. | Mon chien a les oreilles marron. | browns → brown | rattrapage : Colours never take -s: brown ears. |
| 71 | brown | dictation | « brown. I have brown eyes. brown. » |  | brown |  |
| 72 | black | type-fr-en | noir(e) |  | black |  |
| 73 | black | picture | What colour is it? 🎩 (un chapeau haut-de-forme) | De quelle couleur est-ce ? | black |  |
| 74 | black | gap | Kai's hoodie is _____. | Le sweat de Kai est noir. | black |  |
| 75 | black | gap | I have a _____ cat. | J'ai un chat noir. | black |  |
| 76 | black | order | [Kai's] [black] [hoodie] [is] | Le sweat de Kai est noir. | Kai's hoodie is black. |  |
| 77 | black | order | [I] [a] [black] [cat] [have] | J'ai un chat noir. | I have a black cat. |  |
| 78 | black | fix | I have a **noir** cat. | J'ai un chat noir. | noir → black | rattrapage : Noir is French. In English: black. |
| 79 | black | fix | My dad has two **blacks** jackets. | Mon papa a deux vestes noires. | blacks → black | rattrapage : Colours never take -s: black jackets. |
| 80 | black | dictation | « black. Kai's hoodie is black. black. » |  | black |  |
| 81 | white | type-fr-en | blanc / blanche |  | white |  |
| 82 | white | picture | What colour is it? 🥛 (un verre de lait) | De quelle couleur est-ce ? | white |  |
| 83 | white | gap | Snow is _____. | La neige est blanche. | white |  |
| 84 | white | gap | My trainers are _____. | Mes baskets sont blanches. | white |  |
| 85 | white | order | [are] [my] [trainers] [white] | Mes baskets sont blanches. | My trainers are white. |  |
| 86 | white | order | [bears] [fur] [have] [polar] [white] | Les ours polaires ont une fourrure blanche. | Polar bears have white fur. | phrase écrite pour la banque |
| 87 | white | fix | Snow is **blanc**. | La neige est blanche. | blanc → white | rattrapage : Blanc is French. In English: white. |
| 88 | white | fix | I've got **whites** trainers. | J'ai des baskets blanches. | whites → white | rattrapage : Colours never take -s: white trainers. |
| 89 | white | dictation | « white. Snow is white. white. » |  | white |  |
| 90 | grey | type-fr-en | gris(e) |  | grey | gray (+ note UK : grey) |
| 91 | grey | picture | What colour is it? 🐘 (un éléphant) | De quelle couleur est-ce ? | grey | gray (+ note UK : grey) |
| 92 | grey | gap | Elephants are _____. | Les éléphants sont gris. | grey |  |
| 93 | grey | gap | The sky is _____ today. | Le ciel est gris aujourd'hui. | grey |  |
| 94 | grey | order | [grandpa] [grey] [hair] [has] [my] | Mon papi a les cheveux gris. | My grandpa has grey hair. | phrase écrite pour la banque |
| 95 | grey | order | [elephants] [grey] [have] [skin] | Les éléphants ont la peau grise. | Elephants have grey skin. | phrase écrite pour la banque |
| 96 | grey | fix | Elephants are **gris**. | Les éléphants sont gris. | gris → grey | rattrapage : Gris is French. In English: grey. |
| 97 | grey | fix | Look at the **greys** clouds. | Regarde les nuages gris. | greys → grey | rattrapage : Colours never take -s: grey clouds. |
| 98 | grey | dictation | « grey. Elephants are grey. grey. » |  | grey | gray (+ note UK : grey) |

### Family 1 · My family (`nouns:family-1`) — 147 lignes

| n° | Mot | Format | Question | Français (6e) | Attendu | Accepté aussi / remarques |
|---|---|---|---|---|---|---|
| 1 | family | type-fr-en | une famille |  | family |  |
| 2 | family | gap | I love my _____. | J'aime ma famille. | family |  |
| 3 | family | gap | Some _____ have lots of children. | Certaines familles ont beaucoup d'enfants. | families |  |
| 4 | family | order | [I] [family] [love] [my] | J'aime ma famille. | I love my family. |  |
| 5 | family | order | [a] [big] [family] [has] [house] [my] | Ma famille a une grande maison. | My family has a big house. | phrase écrite pour la banque |
| 6 | family | fix | Some **familys** have lots of children. | Certaines familles ont beaucoup d'enfants. | familys → families | rattrapage : family → families (y becomes ies). |
| 7 | family | fix | I love my **famille**. | J'aime ma famille. | famille → family | rattrapage : Famille is French. In English: family. |
| 8 | family | dictation | « family. I love my family. family. » |  | family |  |
| 9 | parent | gap | Each _____ must sign the paper. | Chaque parent doit signer le papier. | parent |  |
| 10 | parent | gap | My _____ are at work. | Mes parents sont au travail. | parents |  |
| 11 | parent | order | [are] [at] [my] [parents] [work] | Mes parents sont au travail. | My parents are at work. |  |
| 12 | parent | order | [dancing] [love] [my] [parents] | Mes parents adorent danser. | My parents love dancing. | phrase écrite pour la banque |
| 13 | parent | fix | Both my **parent** are at work. | Mes deux parents sont au travail. | parent → parents | rattrapage : Both = two people: parents (plural). |
| 14 | parent | fix | I live with my two **parent**. | Je vis avec mes deux parents. | parent → parents | rattrapage : Two → plural: two parents. |
| 15 | parent | dictation | « parent. My parents are at work. parent. » |  | parent |  |
| 16 | mother | type-fr-en | une mère |  | mother | mother → mum, mummy ; mothers → mums ; mom (+ note UK : mother) |
| 17 | mother | picture | Who is this? This is your… arbre, case « mum » marquée ? | Qui est-ce ? C'est ton / ta… | mother | mum, mummy ; mother → mum, mummy ; mothers → mums ; mom (+ note UK : mother) |
| 18 | mother | gap | My _____ is a doctor. | Ma mère est médecin. | mother |  |
| 19 | mother | gap | _____ and daughters often look alike. | Les mères et les filles se ressemblent souvent. | Mothers |  |
| 20 | mother | order | [a] [doctor] [is] [mother] [my] | Ma mère est médecin. | My mother is a doctor. |  |
| 21 | mother | order | [English] [mother] [my] [speaks] | Ma mère parle anglais. | My mother speaks English. | phrase écrite pour la banque |
| 22 | mother | fix | My **mère** is a doctor. | Ma mère est médecin. | mère → mother | rattrapage : Mère is French. In English: mother. |
| 23 | mother | fix | The two **mother** are talking at the school gate. | Les deux mères discutent à la porte de l'école. | mother → mothers | rattrapage : Two → plural: two mothers. |
| 24 | mother | dictation | « mother. My mother is a doctor. mother. » |  | mother | mother → mum, mummy ; mothers → mums ; mom (+ note UK : mother) |
| 25 | mum | type-fr-en | maman |  | mum | mum → mummy, mother ; mums → mummies, mothers ; mom (+ note UK : mum) ; moms (+ note UK : mums) |
| 26 | mum | gap | _____, can I have a biscuit? | Maman, je peux avoir un biscuit ? | Mum |  |
| 27 | mum | gap | All the _____ came to the school show. | Toutes les mamans sont venues au spectacle de l'école. | mums |  |
| 28 | mum | order | [in] [is] [kitchen] [mum] [the] | Maman est dans la cuisine. | Mum is in the kitchen. | phrase écrite pour la banque |
| 29 | mum | order | [likes] [mum] [my] [pizza] | Ma maman aime la pizza. | My mum likes pizza. | phrase écrite pour la banque |
| 30 | mum | fix | All the **mum** came to the school show. | Toutes les mamans sont venues au spectacle de l'école. | mum → mums | rattrapage : All the → plural: all the mums. |
| 31 | mum | dictation | « mum. Mum is in the kitchen. mum. » |  | mum | mum → mummy, mother ; mums → mummies, mothers ; mom (+ note UK : mum) ; moms (+ note UK : mums) |
| 32 | father | type-fr-en | un père |  | father | father → dad, daddy ; fathers → dads |
| 33 | father | picture | Who is this? This is your… arbre, case « dad » marquée ? | Qui est-ce ? C'est ton / ta… | father | dad, daddy ; father → dad, daddy ; fathers → dads |
| 34 | father | gap | My _____ is very tall. | Mon père est très grand. | father |  |
| 35 | father | gap | Some _____ stay at home with the children. | Certains pères restent à la maison avec les enfants. | fathers |  |
| 36 | father | order | [father] [is] [my] [tall] [very] | Mon père est très grand. | My father is very tall. |  |
| 37 | father | order | [a] [cook] [father] [good] [is] [my] | Mon père est un bon cuisinier. | My father is a good cook. | phrase écrite pour la banque |
| 38 | father | fix | My **père** is very tall. | Mon père est très grand. | père → father | rattrapage : Père is French. In English: father. |
| 39 | father | fix | Many **father** stay at home with the children. | Beaucoup de pères restent à la maison avec les enfants. | father → fathers | rattrapage : Many → plural: many fathers. |
| 40 | father | dictation | « father. My father is very tall. father. » |  | father | father → dad, daddy ; fathers → dads |
| 41 | dad | type-fr-en | papa |  | dad | dad → daddy, father ; dads → daddies, fathers |
| 42 | dad | gap | _____, where are my shoes? | Papa, où sont mes chaussures ? | Dad |  |
| 43 | dad | gap | The _____ made a cake for the party. | Les papas ont fait un gâteau pour la fête. | dads |  |
| 44 | dad | order | [dad] [guitar] [my] [plays] [the] | Mon papa joue de la guitare. | My dad plays the guitar. | phrase écrite pour la banque |
| 45 | dad | order | [cooking] [dad] [is] [pasta] | Papa fait cuire des pâtes. | Dad is cooking pasta. | phrase écrite pour la banque |
| 46 | dad | fix | All the **dad** came to the school show. | Tous les papas sont venus au spectacle de l'école. | dad → dads | rattrapage : All the → plural: all the dads. |
| 47 | dad | fix | Three **dad** helped at the school fair. | Trois papas ont aidé à la kermesse de l'école. | dad → dads | rattrapage : Three → plural: three dads. |
| 48 | dad | dictation | « dad. Dad is cooking pasta. dad. » |  | dad | dad → daddy, father ; dads → daddies, fathers |
| 49 | brother | type-fr-en | un frère |  | brother |  |
| 50 | brother | picture | Who is this? This is your… arbre, case « brother » marquée ? | Qui est-ce ? C'est ton / ta… | brother |  |
| 51 | brother | gap | My big _____ is 15. | Mon grand frère a 15 ans. | brother |  |
| 52 | brother | gap | I have two _____. | J'ai deux frères. | brothers |  |
| 53 | brother | order | [15] [big] [brother] [is] [my] | Mon grand frère a 15 ans. | My big brother is 15. |  |
| 54 | brother | order | [I] [brothers] [have] [two] | J'ai deux frères. | I have two brothers. |  |
| 55 | brother | fix | I have two **brother**. | J'ai deux frères. | brother → brothers | rattrapage : Two → plural: two brothers. |
| 56 | brother | fix | My big **frère** is 15. | Mon grand frère a 15 ans. | frère → brother | rattrapage : Frère is French. In English: brother. |
| 57 | brother | dictation | « brother. My big brother is 15. brother. » |  | brother |  |
| 58 | sister | type-fr-en | une sœur |  | sister |  |
| 59 | sister | picture | Who is this? This is your… arbre, case « sister » marquée ? | Qui est-ce ? C'est ton / ta… | sister |  |
| 60 | sister | gap | My little _____ is 6. | Ma petite sœur a 6 ans. | sister |  |
| 61 | sister | gap | My friends have _____ at our school. | Mes amis ont des sœurs dans notre collège. | sisters |  |
| 62 | sister | order | [6] [is] [little] [my] [sister] | Ma petite sœur a 6 ans. | My little sister is 6. |  |
| 63 | sister | order | [hair] [has] [long] [my] [sister] | Ma sœur a les cheveux longs. | My sister has long hair. | phrase écrite pour la banque |
| 64 | sister | fix | I have three **sister**. | J'ai trois sœurs. | sister → sisters | rattrapage : Three → plural: three sisters. |
| 65 | sister | fix | My little **sœur** is 6. | Ma petite sœur a 6 ans. | sœur → sister | rattrapage : Sœur is French. In English: sister. |
| 66 | sister | dictation | « sister. My little sister is 6. sister. » |  | sister |  |
| 67 | son | type-fr-en | un fils |  | son |  |
| 68 | son | gap | Their _____ is called Kai. | Leur fils s'appelle Kai. | son |  |
| 69 | son | gap | The king had three _____. | Le roi avait trois fils. | sons |  |
| 70 | son | order | [Kai] [called] [is] [son] [their] | Leur fils s'appelle Kai. | Their son is called Kai. |  |
| 71 | son | order | [had] [king] [sons] [the] [three] | Le roi avait trois fils. | The king had three sons. |  |
| 72 | son | fix | Their **sun** is called Kai. | Leur fils s'appelle Kai. | sun → son | rattrapage : sun = le soleil ; son = le fils. Same sound, different words! |
| 73 | son | fix | The king had three **son**. | Le roi avait trois fils. | son → sons | rattrapage : Three → plural: three sons. |
| 74 | son | dictation | « son. Their son is called Kai. son. » |  | son |  |
| 75 | daughter | type-fr-en | une fille (l'enfant de…) |  | daughter |  |
| 76 | daughter | gap | Their _____ is a good student. | Leur fille est une bonne élève. | daughter |  |
| 77 | daughter | gap | My aunt has two _____. | Ma tante a deux filles. | daughters |  |
| 78 | daughter | order | [a] [daughter] [good] [is] [student] [their] | Leur fille est une bonne élève. | Their daughter is a good student. |  |
| 79 | daughter | order | [aunt] [daughters] [has] [my] [two] | Ma tante a deux filles. | My aunt has two daughters. |  |
| 80 | daughter | fix | My aunt has two **daughter**. | Ma tante a deux filles. | daughter → daughters | rattrapage : Two → plural: two daughters. |
| 81 | daughter | fix | Their **fille** is a good student. | Leur fille est une bonne élève. | fille → daughter | rattrapage : Fille is French. Their child = their daughter. |
| 82 | daughter | dictation | « daughter. Their daughter is a good student. daughter. » |  | daughter |  |
| 83 | grandmother | type-fr-en | une grand-mère |  | grandmother | grandmother → grandma, granny, gran ; grandmothers → grandmas ; fr de la banque (données : une grand-mère / mamie) |
| 84 | grandmother | picture | Who is this? This is your… arbre, case « grandma » marquée ? | Qui est-ce ? C'est ton / ta… | grandmother | grandma, granny, gran ; grandmother → grandma, granny, gran ; grandmothers → grandmas |
| 85 | grandmother | gap | My _____ makes the best cakes. | Ma grand-mère fait les meilleurs gâteaux. | grandmother |  |
| 86 | grandmother | gap | Both my _____ live in Brittany. | Mes deux grands-mères habitent en Bretagne. | grandmothers |  |
| 87 | grandmother | order | [best] [cakes] [grandmother] [makes] [my] [the] | Ma grand-mère fait les meilleurs gâteaux. | My grandmother makes the best cakes. |  |
| 88 | grandmother | fix | Both my **grandmother** live in Brittany. | Mes deux grands-mères habitent en Bretagne. | grandmother → grandmothers | rattrapage : Both → plural: both my grandmothers. |
| 89 | grandmother | dictation | « grandmother. My grandmother makes the best cakes. grandmother. » |  | grandmother | grandmother → grandma, granny, gran ; grandmothers → grandmas |
| 90 | grandfather | type-fr-en | un grand-père |  | grandfather | grandfather → grandpa, grandad, granddad ; grandfathers → grandpas, grandads ; fr de la banque (données : un grand-père / papi) |
| 91 | grandfather | picture | Who is this? This is your… arbre, case « grandpa » marquée ? | Qui est-ce ? C'est ton / ta… | grandfather | grandpa, grandad, granddad ; grandfather → grandpa, grandad, granddad ; grandfathers → grandpas, grandads |
| 92 | grandfather | gap | My _____ tells funny stories. | Mon grand-père raconte des histoires drôles. | grandfather |  |
| 93 | grandfather | gap | My two _____ love fishing. | Mes deux grands-pères adorent la pêche. | grandfathers |  |
| 94 | grandfather | order | [funny] [grandfather] [my] [stories] [tells] | Mon grand-père raconte des histoires drôles. | My grandfather tells funny stories. |  |
| 95 | grandfather | order | [fishing] [grandfathers] [love] [my] [two] | Mes deux grands-pères adorent la pêche. | My two grandfathers love fishing. |  |
| 96 | grandfather | fix | My two **grandfather** love fishing. | Mes deux grands-pères adorent la pêche. | grandfather → grandfathers | rattrapage : Two → plural: two grandfathers. |
| 97 | grandfather | dictation | « grandfather. My grandfather tells funny stories. grandfather. » |  | grandfather | grandfather → grandpa, grandad, granddad ; grandfathers → grandpas, grandads |
| 98 | grandma | type-fr-en | une mamie |  | grandma | grandma → granny, gran, grandmother ; grandmas → grannies, grans, grandmothers |
| 99 | grandma | gap | My _____ makes great pancakes. | Ma mamie fait de super crêpes. | grandma |  |
| 100 | grandma | gap | Both my _____ live in Lyon. | Mes deux mamies habitent à Lyon. | grandmas |  |
| 101 | grandma | order | [grandma] [great] [makes] [my] [pancakes] | Ma mamie fait de super crêpes. | My grandma makes great pancakes. |  |
| 102 | grandma | fix | My **mamie** makes great pancakes. | Ma mamie fait de super crêpes. | mamie → grandma | rattrapage : Mamie is French. In English: grandma. |
| 103 | grandma | fix | Both my **grandma** live in Lyon. | Mes deux mamies habitent à Lyon. | grandma → grandmas | rattrapage : Both → plural: both my grandmas. |
| 104 | grandma | dictation | « grandma. My grandma makes great pancakes. grandma. » |  | grandma | grandma → granny, gran, grandmother ; grandmas → grannies, grans, grandmothers |
| 105 | grandpa | type-fr-en | un papi |  | grandpa | grandpa → grandad, granddad, grandfather ; grandpas → grandads, granddads, grandfathers |
| 106 | grandpa | gap | My _____ takes me fishing. | Mon papi m'emmène à la pêche. | grandpa |  |
| 107 | grandpa | gap | My two _____ love football. | Mes deux papis adorent le foot. | grandpas |  |
| 108 | grandpa | order | [fishing] [grandpa] [me] [my] [takes] | Mon papi m'emmène à la pêche. | My grandpa takes me fishing. |  |
| 109 | grandpa | order | [football] [grandpas] [love] [my] [two] | Mes deux papis adorent le foot. | My two grandpas love football. |  |
| 110 | grandpa | fix | My **papi** takes me fishing. | Mon papi m'emmène à la pêche. | papi → grandpa | rattrapage : Papi is French. In English: grandpa. |
| 111 | grandpa | fix | My two **grandpa** love football. | Mes deux papis adorent le foot. | grandpa → grandpas | rattrapage : Two → plural: two grandpas. |
| 112 | grandpa | dictation | « grandpa. My grandpa takes me fishing. grandpa. » |  | grandpa | grandpa → grandad, granddad, grandfather ; grandpas → grandads, granddads, grandfathers |
| 113 | grandparents | type-fr-en | les grands-parents (m) |  | grandparents |  |
| 114 | grandparents | picture | Who is this? This is your… arbre, case « grandparents » marquée ? | Qui est-ce ? C'est ton / ta… | grandparents |  |
| 115 | grandparents | gap | I spend my holidays at my _____' house. | Je passe mes vacances chez mes grands-parents. | grandparents |  |
| 116 | grandparents | gap | My _____ live in the countryside. | Mes grands-parents habitent à la campagne. | grandparents |  |
| 117 | grandparents | order | [countryside] [grandparents] [in] [live] [my] [the] | Mes grands-parents habitent à la campagne. | My grandparents live in the countryside. |  |
| 118 | grandparents | order | [a] [big] [garden] [grandparents] [have] [my] | Mes grands-parents ont un grand jardin. | My grandparents have a big garden. | phrase écrite pour la banque |
| 119 | grandparents | fix | I love all my **grandparent**. | J'aime tous mes grands-parents. | grandparent → grandparents | rattrapage : All my → plural: all my grandparents. |
| 120 | grandparents | fix | My **grands-parents** live in the countryside. | Mes grands-parents habitent à la campagne. | grands-parents → grandparents | rattrapage : Grands-parents is French. In English: grandparents (one word). |
| 121 | grandparents | dictation | « grandparents. My grandparents live in the countryside. grandparents. » |  | grandparents |  |
| 122 | uncle | type-fr-en | un oncle / tonton |  | uncle |  |
| 123 | uncle | picture | Who is this? This is your… arbre, case « uncle » marquée ? | Qui est-ce ? C'est ton / ta… | uncle |  |
| 124 | uncle | gap | My _____ lives in Canada. | Mon oncle habite au Canada. | uncle |  |
| 125 | uncle | gap | I have three _____. | J'ai trois oncles. | uncles |  |
| 126 | uncle | order | [Canada] [in] [lives] [my] [uncle] | Mon oncle habite au Canada. | My uncle lives in Canada. |  |
| 127 | uncle | order | [I] [have] [three] [uncles] | J'ai trois oncles. | I have three uncles. |  |
| 128 | uncle | fix | Both my **uncle** live in Paris. | Mes deux oncles habitent à Paris. | uncle → uncles | rattrapage : Both → plural: both my uncles. |
| 129 | uncle | fix | I have three **uncle**. | J'ai trois oncles. | uncle → uncles | rattrapage : Three → plural: three uncles. |
| 130 | uncle | dictation | « uncle. My uncle lives in Canada. uncle. » |  | uncle |  |
| 131 | aunt | type-fr-en | une tante / tata |  | aunt | aunt → auntie, aunty ; aunts → aunties |
| 132 | aunt | picture | Who is this? This is your… arbre, case « aunt » marquée ? | Qui est-ce ? C'est ton / ta… | aunt | auntie, aunty ; aunt → auntie, aunty ; aunts → aunties |
| 133 | aunt | gap | My _____ is a nurse. | Ma tante est infirmière. | aunt |  |
| 134 | aunt | gap | My _____ always give me presents. | Mes tantes me font toujours des cadeaux. | aunts |  |
| 135 | aunt | order | [a] [aunt] [is] [my] [nurse] | Ma tante est infirmière. | My aunt is a nurse. |  |
| 136 | aunt | order | [a] [aunt] [big] [dog] [has] [my] | Ma tante a un gros chien. | My aunt has a big dog. | phrase écrite pour la banque |
| 137 | aunt | fix | My **ant** is a nurse. | Ma tante est infirmière. | ant → aunt | rattrapage : ant = une fourmi ; aunt = une tante. |
| 138 | aunt | fix | My **tante** always gives me presents. | Ma tante me fait toujours des cadeaux. | tante → aunt | rattrapage : Tante is French. In English: aunt. |
| 139 | aunt | dictation | « aunt. My aunt is a nurse. aunt. » |  | aunt | aunt → auntie, aunty ; aunts → aunties |
| 140 | cousin | picture | Who is this? This is your… arbre, case « cousin » marquée ? | Qui est-ce ? C'est ton / ta… | cousin |  |
| 141 | cousin | gap | My _____ is the same age as me. | Mon cousin a le même âge que moi. | cousin |  |
| 142 | cousin | gap | I play with my _____ every summer. | Je joue avec mes cousins chaque été. | cousins |  |
| 143 | cousin | order | [age] [as] [cousin] [is] [me] [my] [same] [the] | Mon cousin a le même âge que moi. | My cousin is the same age as me. |  |
| 144 | cousin | order | [I] [cousins] [five] [have] | J'ai cinq cousins. | I have five cousins. | phrase écrite pour la banque |
| 145 | cousin | fix | My **cousins** is the same age as me. | Mon cousin a le même âge que moi. | cousins → cousin | rattrapage : One cousin: singular, my cousin is… |
| 146 | cousin | fix | I play with my two **cousin** every summer. | Je joue avec mes deux cousins chaque été. | cousin → cousins | rattrapage : Two → plural: two cousins. |
| 147 | cousin | dictation | « cousin. My cousin is the same age as me. cousin. » |  | cousin |  |

### Animals 1 · Pets & farm (`nouns:animals-1`) — 164 lignes

| n° | Mot | Format | Question | Français (6e) | Attendu | Accepté aussi / remarques |
|---|---|---|---|---|---|---|
| 1 | pet | type-fr-en | un animal de compagnie |  | pet |  |
| 2 | pet | gap | Do you have a _____? | Tu as un animal de compagnie ? | pet |  |
| 3 | pet | gap | Dogs and cats are popular _____. | Les chiens et les chats sont des animaux de compagnie très appréciés. | pets |  |
| 4 | pet | order | [I] [a] [like] [pet] [would] | J'aimerais avoir un animal de compagnie. | I would like a pet. | phrase écrite pour la banque |
| 5 | pet | order | [funny] [is] [my] [pet] [very] | Mon animal de compagnie est très drôle. | My pet is very funny. | phrase écrite pour la banque |
| 6 | pet | fix | Dogs and cats are popular **pet**. | Les chiens et les chats sont des animaux de compagnie très appréciés. | pet → pets | rattrapage : Dogs and cats = more than one: pets. |
| 7 | pet | fix | I have three **pet** at home. | J'ai trois animaux de compagnie à la maison. | pet → pets | rattrapage : Three → plural: three pets. |
| 8 | pet | dictation | « pet. Do you have a pet? pet. » |  | pet |  |
| 9 | dog | type-fr-en | un chien |  | dog |  |
| 10 | dog | picture | What is it? 🐶 | Qu'est-ce que c'est ? | dog | puppy |
| 11 | dog | gap | My _____ loves to play in the garden. | Mon chien adore jouer dans le jardin. | dog |  |
| 12 | dog | gap | Some _____ are very big. | Certains chiens sont très grands. | dogs |  |
| 13 | dog | order | [big] [dog] [is] [my] [very] | Mon chien est très grand. | My dog is very big. | phrase écrite pour la banque |
| 14 | dog | order | [are] [big] [dogs] [some] [very] | Certains chiens sont très grands. | Some dogs are very big. |  |
| 15 | dog | fix | My **chien** loves to play in the garden. | Mon chien adore jouer dans le jardin. | chien → dog | rattrapage : Chien is French. In English: dog. |
| 16 | dog | fix | I have two **dog**. | J'ai deux chiens. | dog → dogs | rattrapage : Two → plural: two dogs. |
| 17 | dog | dictation | « dog. My dog loves to play in the garden. dog. » |  | dog |  |
| 18 | puppy | type-fr-en | un chiot |  | puppy |  |
| 19 | puppy | gap | Our _____ chews all my shoes! | Notre chiot mâchouille toutes mes chaussures ! | puppy |  |
| 20 | puppy | gap | The _____ are drinking milk. | Les chiots boivent du lait. | puppies |  |
| 21 | puppy | order | [all] [chews] [my] [our] [puppy] [shoes] | Notre chiot mâchouille toutes mes chaussures. | Our puppy chews all my shoes. | phrase écrite pour la banque |
| 22 | puppy | order | [are] [drinking] [milk] [puppies] [the] | Les chiots boivent du lait. | The puppies are drinking milk. |  |
| 23 | puppy | fix | The **puppys** are drinking milk. | Les chiots boivent du lait. | puppys → puppies | rattrapage : puppy → puppies (y becomes ies). |
| 24 | puppy | fix | Our **chiot** chews all my shoes! | Notre chiot mâchouille toutes mes chaussures ! | chiot → puppy | rattrapage : Chiot is French. In English: puppy. |
| 25 | puppy | dictation | « puppy. Our puppy chews all my shoes! puppy. » |  | puppy |  |
| 26 | cat | type-fr-en | un chat |  | cat |  |
| 27 | cat | picture | What is it? 🐱 | Qu'est-ce que c'est ? | cat | kitten |
| 28 | cat | gap | The _____ is sleeping on my bed. | Le chat dort sur mon lit. | cat |  |
| 29 | cat | gap | _____ love to sleep in the sun. | Les chats adorent dormir au soleil. | Cats |  |
| 30 | cat | order | [cat] [eyes] [green] [has] [my] | Mon chat a les yeux verts. | My cat has green eyes. | phrase écrite pour la banque |
| 31 | cat | order | [cats] [in] [love] [sleep] [sun] [the] [to] | Les chats adorent dormir au soleil. | Cats love to sleep in the sun. |  |
| 32 | cat | fix | The **chat** is sleeping on my bed. | Le chat dort sur mon lit. | chat → cat | rattrapage : Chat is French. In English: cat (to chat = to talk). |
| 33 | cat | fix | I have two **cat**. | J'ai deux chats. | cat → cats | rattrapage : Two → plural: two cats. |
| 34 | cat | dictation | « cat. The cat is sleeping on my bed. cat. » |  | cat |  |
| 35 | kitten | type-fr-en | un chaton |  | kitten |  |
| 36 | kitten | gap | The little _____ is playing with a ball of wool. | Le petit chaton joue avec une pelote de laine. | kitten |  |
| 37 | kitten | gap | My cat had four _____. | Ma chatte a eu quatre chatons. | kittens |  |
| 38 | kitten | order | [cat] [four] [had] [kittens] [my] | Ma chatte a eu quatre chatons. | My cat had four kittens. |  |
| 39 | kitten | order | [is] [kitten] [small] [the] [very] | Le chaton est tout petit. | The kitten is very small. | phrase écrite pour la banque |
| 40 | kitten | fix | My cat had four **kitten**. | Ma chatte a eu quatre chatons. | kitten → kittens | rattrapage : Four → plural: four kittens. |
| 41 | kitten | fix | The little **chaton** is playing with a ball of wool. | Le petit chaton joue avec une pelote de laine. | chaton → kitten | rattrapage : Chaton is French. In English: kitten. |
| 42 | kitten | dictation | « kitten. The little kitten is playing with a ball of wool. kitten. » |  | kitten |  |
| 43 | rabbit | type-fr-en | un lapin |  | rabbit |  |
| 44 | rabbit | picture | What is it? 🐰 | Qu'est-ce que c'est ? | rabbit | bunny |
| 45 | rabbit | gap | My _____ eats carrots every day. | Mon lapin mange des carottes tous les jours. | rabbit |  |
| 46 | rabbit | gap | There are a lot of _____ in the field. | Il y a beaucoup de lapins dans le champ. | rabbits |  |
| 47 | rabbit | order | [carrots] [eats] [my] [rabbit] | Mon lapin mange des carottes. | My rabbit eats carrots. | phrase écrite pour la banque |
| 48 | rabbit | order | [ears] [has] [long] [my] [rabbit] | Mon lapin a de longues oreilles. | My rabbit has long ears. | phrase écrite pour la banque |
| 49 | rabbit | fix | My **lapin** eats carrots every day. | Mon lapin mange des carottes tous les jours. | lapin → rabbit | rattrapage : Lapin is French. In English: rabbit. |
| 50 | rabbit | fix | There are a lot of **rabbit** in the field. | Il y a beaucoup de lapins dans le champ. | rabbit → rabbits | rattrapage : A lot of → plural: a lot of rabbits. |
| 51 | rabbit | dictation | « rabbit. My rabbit eats carrots every day. rabbit. » |  | rabbit |  |
| 52 | mouse | type-fr-en | une souris |  | mouse |  |
| 53 | mouse | picture | What is it? 🐭 | Qu'est-ce que c'est ? | mouse |  |
| 54 | mouse | gap | A little _____ is hiding under the table. | Une petite souris se cache sous la table. | mouse |  |
| 55 | mouse | gap | The cat is chasing the _____. | Le chat chasse les souris. | mice |  |
| 56 | mouse | order | [I] [a] [can] [little] [mouse] [see] | Je vois une petite souris. | I can see a little mouse. | phrase écrite pour la banque |
| 57 | mouse | fix | I can see three **mouses**. | Je vois trois souris. | mouses → mice | rattrapage : One mouse, two mice: irregular plural! |
| 58 | mouse | fix | A little **souris** is hiding under the table. | Une petite souris se cache sous la table. | souris → mouse | rattrapage : Souris is French. In English: mouse. |
| 59 | mouse | dictation | « mouse. A little mouse is hiding under the table. mouse. » |  | mouse |  |
| 60 | goldfish | type-fr-en | un poisson rouge |  | goldfish |  |
| 61 | goldfish | gap | My _____ swims round and round. | Mon poisson rouge tourne en rond. | goldfish |  |
| 62 | goldfish | gap | There are three _____ in the bowl. | Il y a trois poissons rouges dans le bocal. | goldfish | goldfishes |
| 63 | goldfish | order | [and] [goldfish] [my] [round] [round] [swims] | Mon poisson rouge tourne en rond. | My goldfish swims round and round. |  |
| 64 | goldfish | fix | There are three **goldfishs** in the bowl. | Il y a trois poissons rouges dans le bocal. | goldfishs → goldfish | aussi : goldfishes ; rattrapage : One goldfish, three goldfish: no -s. |
| 65 | goldfish | dictation | « goldfish. My goldfish swims round and round. goldfish. » |  | goldfish |  |
| 66 | parrot | type-fr-en | un perroquet |  | parrot |  |
| 67 | parrot | picture | What is it? 🦜 | Qu'est-ce que c'est ? | parrot |  |
| 68 | parrot | gap | The _____ can say hello! | Le perroquet sait dire bonjour ! | parrot |  |
| 69 | parrot | gap | _____ have very colourful feathers. | Les perroquets ont des plumes très colorées. | Parrots |  |
| 70 | parrot | order | [can] [hello] [parrot] [say] [the] | Le perroquet sait dire bonjour. | The parrot can say hello. | phrase écrite pour la banque |
| 71 | parrot | order | [colourful] [feathers] [have] [parrots] [very] | Les perroquets ont des plumes très colorées. | Parrots have very colourful feathers. |  |
| 72 | parrot | fix | The **perroquet** can say hello! | Le perroquet sait dire bonjour ! | perroquet → parrot | rattrapage : Perroquet is French. In English: parrot. |
| 73 | parrot | fix | My grandpa has two **parrot**. | Mon papi a deux perroquets. | parrot → parrots | rattrapage : Two → plural: two parrots. |
| 74 | parrot | dictation | « parrot. The parrot can say hello! parrot. » |  | parrot |  |
| 75 | tortoise | type-fr-en | une tortue (de terre) |  | tortoise |  |
| 76 | tortoise | picture | What is it? 🐢 | Qu'est-ce que c'est ? | tortoise | turtle |
| 77 | tortoise | gap | My grandma's _____ is 40 years old. | La tortue de ma grand-mère a 40 ans. | tortoise |  |
| 78 | tortoise | gap | _____ walk very slowly. | Les tortues marchent très lentement. | Tortoises |  |
| 79 | tortoise | order | [40] [grandma's] [is] [my] [old] [tortoise] [years] | La tortue de ma grand-mère a 40 ans. | My grandma's tortoise is 40 years old. |  |
| 80 | tortoise | order | [slowly] [tortoises] [very] [walk] | Les tortues marchent très lentement. | Tortoises walk very slowly. |  |
| 81 | tortoise | fix | My grandma's **tortue** is 40 years old. | La tortue de ma grand-mère a 40 ans. | tortue → tortoise | rattrapage : Tortue is French. In English: tortoise. |
| 82 | tortoise | fix | Look at the two **tortoise**! | Regarde les deux tortues ! | tortoise → tortoises | rattrapage : Two → plural: two tortoises. |
| 83 | tortoise | dictation | « tortoise. My grandma's tortoise is 40 years old. tortoise. » |  | tortoise |  |
| 84 | horse | type-fr-en | un cheval |  | horse |  |
| 85 | horse | picture | What is it? 🐴 | Qu'est-ce que c'est ? | horse | pony |
| 86 | horse | gap | My sister rides a _____ on Saturdays. | Ma sœur monte à cheval le samedi. | horse |  |
| 87 | horse | gap | The _____ are running in the field. | Les chevaux courent dans le champ. | horses |  |
| 88 | horse | order | [a] [horse] [my] [rides] [sister] | Ma sœur monte à cheval. | My sister rides a horse. | phrase écrite pour la banque |
| 89 | horse | order | [are] [field] [horses] [in] [running] [the] [the] | Les chevaux courent dans le champ. | The horses are running in the field. |  |
| 90 | horse | fix | My sister rides a **cheval** on Saturdays. | Ma sœur monte à cheval le samedi. | cheval → horse | rattrapage : Cheval is French. In English: horse. |
| 91 | horse | fix | Two **horse** are running in the field. | Deux chevaux courent dans le champ. | horse → horses | rattrapage : Two → plural: two horses. |
| 92 | horse | dictation | « horse. My sister rides a horse on Saturdays. horse. » |  | horse |  |
| 93 | pony | type-fr-en | un poney |  | pony |  |
| 94 | pony | gap | My little sister has a _____. | Ma petite sœur a un poney. | pony |  |
| 95 | pony | gap | The _____ are eating hay. | Les poneys mangent du foin. | ponies |  |
| 96 | pony | order | [a] [has] [little] [my] [pony] [sister] | Ma petite sœur a un poney. | My little sister has a pony. |  |
| 97 | pony | order | [are] [eating] [hay] [ponies] [the] | Les poneys mangent du foin. | The ponies are eating hay. |  |
| 98 | pony | fix | My little sister has a **poney**. | Ma petite sœur a un poney. | poney → pony | rattrapage : Poney is French. In English: pony. |
| 99 | pony | fix | The **ponys** are eating hay. | Les poneys mangent du foin. | ponys → ponies | rattrapage : pony → ponies (y becomes ies). |
| 100 | pony | dictation | « pony. My little sister has a pony. pony. » |  | pony |  |
| 101 | donkey | type-fr-en | un âne |  | donkey |  |
| 102 | donkey | gap | The _____ carries heavy bags. | L'âne porte des sacs lourds. | donkey |  |
| 103 | donkey | gap | _____ say hee-haw! | Les ânes font hi-han ! | Donkeys |  |
| 104 | donkey | order | [bags] [carries] [donkey] [heavy] [the] | L'âne porte des sacs lourds. | The donkey carries heavy bags. |  |
| 105 | donkey | order | [donkeys] [ears] [have] [long] | Les ânes ont de longues oreilles. | Donkeys have long ears. | phrase écrite pour la banque |
| 106 | donkey | fix | The **âne** carries heavy bags. | L'âne porte des sacs lourds. | âne → donkey | rattrapage : Âne is French. In English: donkey. |
| 107 | donkey | fix | I can see two **donkey** in the field. | Je vois deux ânes dans le champ. | donkey → donkeys | rattrapage : Two → plural: two donkeys. |
| 108 | donkey | dictation | « donkey. The donkey carries heavy bags. donkey. » |  | donkey |  |
| 109 | cow | type-fr-en | une vache |  | cow |  |
| 110 | cow | picture | What is it? 🐮 | Qu'est-ce que c'est ? | cow | calf |
| 111 | cow | gap | The _____ gives us milk. | La vache nous donne du lait. | cow |  |
| 112 | cow | gap | There are black and white _____ on the farm. | Il y a des vaches noires et blanches à la ferme. | cows |  |
| 113 | cow | order | [cow] [gives] [milk] [the] [us] | La vache nous donne du lait. | The cow gives us milk. |  |
| 114 | cow | fix | The **vache** gives us milk. | La vache nous donne du lait. | vache → cow | rattrapage : Vache is French. In English: cow. |
| 115 | cow | fix | There are black and white **cow** on the farm. | Il y a des vaches noires et blanches à la ferme. | cow → cows | rattrapage : There are → plural: cows. |
| 116 | cow | dictation | « cow. The cow gives us milk. cow. » |  | cow |  |
| 117 | pig | type-fr-en | un cochon |  | pig |  |
| 118 | pig | picture | What is it? 🐷 | Qu'est-ce que c'est ? | pig |  |
| 119 | pig | gap | The _____ is rolling in the mud. | Le cochon se roule dans la boue. | pig |  |
| 120 | pig | gap | _____ are very intelligent. | Les cochons sont très intelligents. | Pigs |  |
| 121 | pig | order | [are] [intelligent] [pigs] [very] | Les cochons sont très intelligents. | Pigs are very intelligent. |  |
| 122 | pig | fix | The **cochon** is rolling in the mud. | Le cochon se roule dans la boue. | cochon → pig | rattrapage : Cochon is French. In English: pig. |
| 123 | pig | fix | There are four **pig** on the farm. | Il y a quatre cochons à la ferme. | pig → pigs | rattrapage : Four → plural: four pigs. |
| 124 | pig | dictation | « pig. The pig is rolling in the mud. pig. » |  | pig |  |
| 125 | sheep | type-fr-en | un mouton |  | sheep |  |
| 126 | sheep | picture | What is it? 🐑 | Qu'est-ce que c'est ? | sheep | lamb |
| 127 | sheep | gap | The _____ is eating grass. | Le mouton mange de l'herbe. | sheep |  |
| 128 | sheep | gap | We counted twenty _____ on the hill. | Nous avons compté vingt moutons sur la colline. | sheep |  |
| 129 | sheep | order | [eating] [grass] [is] [sheep] [the] | Le mouton mange de l'herbe. | The sheep is eating grass. |  |
| 130 | sheep | fix | We counted twenty **sheeps** on the hill. | Nous avons compté vingt moutons sur la colline. | sheeps → sheep | rattrapage : One sheep, twenty sheep: no -s. |
| 131 | sheep | fix | The **mouton** is eating grass. | Le mouton mange de l'herbe. | mouton → sheep | rattrapage : Mouton is French. In English: sheep. |
| 132 | sheep | dictation | « sheep. The sheep is eating grass. sheep. » |  | sheep |  |
| 133 | lamb | type-fr-en | un agneau |  | lamb |  |
| 134 | lamb | gap | The _____ is following its mother. | L'agneau suit sa mère. | lamb |  |
| 135 | lamb | gap | Baby sheep are called _____. | Les bébés moutons s'appellent des agneaux. | lambs |  |
| 136 | lamb | order | [following] [is] [its] [lamb] [mother] [the] | L'agneau suit sa mère. | The lamb is following its mother. |  |
| 137 | lamb | order | [are] [baby] [called] [lambs] [sheep] | Les bébés moutons s'appellent des agneaux. | Baby sheep are called lambs. |  |
| 138 | lamb | fix | The **agneau** is following its mother. | L'agneau suit sa mère. | agneau → lamb | rattrapage : Agneau is French. In English: lamb. |
| 139 | lamb | fix | Baby sheep are called **lamb**. | Les bébés moutons s'appellent des agneaux. | lamb → lambs | rattrapage : Baby sheep (more than one) → lambs. |
| 140 | lamb | dictation | « lamb. The lamb is following its mother. lamb. » |  | lamb |  |
| 141 | goat | type-fr-en | une chèvre |  | goat |  |
| 142 | goat | picture | What is it? 🐐 | Qu'est-ce que c'est ? | goat |  |
| 143 | goat | gap | The _____ is climbing on the rocks. | La chèvre grimpe sur les rochers. | goat |  |
| 144 | goat | gap | We make cheese with milk from our _____. | Nous faisons du fromage avec le lait de nos chèvres. | goats |  |
| 145 | goat | order | [goats] [has] [my] [three] [uncle] | Mon oncle a trois chèvres. | My uncle has three goats. | phrase écrite pour la banque |
| 146 | goat | fix | The **chèvre** is climbing on the rocks. | La chèvre grimpe sur les rochers. | chèvre → goat | rattrapage : Chèvre is French. In English: goat. |
| 147 | goat | fix | My uncle has three **goat**. | Mon oncle a trois chèvres. | goat → goats | rattrapage : Three → plural: three goats. |
| 148 | goat | dictation | « goat. The goat is climbing on the rocks. goat. » |  | goat |  |
| 149 | hen | type-fr-en | une poule |  | hen | hen → chicken ; hens → chickens |
| 150 | hen | picture | What is it? 🐔 | Qu'est-ce que c'est ? | hen | hen → chicken ; hens → chickens |
| 151 | hen | gap | The _____ laid an egg this morning. | La poule a pondu un œuf ce matin. | hen |  |
| 152 | hen | gap | Grandpa has six _____ in his garden. | Papi a six poules dans son jardin. | hens |  |
| 153 | hen | order | [an] [egg] [hen] [laid] [the] | La poule a pondu un œuf. | The hen laid an egg. | phrase écrite pour la banque |
| 154 | hen | fix | The **poule** laid an egg this morning. | La poule a pondu un œuf ce matin. | poule → hen | rattrapage : Poule is French. In English: hen. |
| 155 | hen | fix | Grandpa has six **hen** in his garden. | Papi a six poules dans son jardin. | hen → hens | rattrapage : Six → plural: six hens. |
| 156 | hen | dictation | « hen. The hen laid an egg this morning. hen. » |  | hen | hen → chicken ; hens → chickens |
| 157 | duck | type-fr-en | un canard |  | duck |  |
| 158 | duck | picture | What is it? 🦆 | Qu'est-ce que c'est ? | duck |  |
| 159 | duck | gap | A _____ is swimming on the lake. | Un canard nage sur le lac. | duck |  |
| 160 | duck | gap | We gave bread to the _____. | Nous avons donné du pain aux canards. | ducks |  |
| 161 | duck | order | [I] [can] [ducks] [see] [two] | Je vois deux canards. | I can see two ducks. | phrase écrite pour la banque |
| 162 | duck | fix | A **canard** is swimming on the lake. | Un canard nage sur le lac. | canard → duck | rattrapage : Canard is French. In English: duck. |
| 163 | duck | fix | I can see five **duck** on the lake. | Je vois cinq canards sur le lac. | duck → ducks | rattrapage : Five → plural: five ducks. |
| 164 | duck | dictation | « duck. A duck is swimming on the lake. duck. » |  | duck |  |
