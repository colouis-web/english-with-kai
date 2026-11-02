/* =====================================================================================
   Banque des certificats de vocabulaire — sprint Kai 2 B (Matt, 02/11/2026).
   Conception : docs/certificats/conception.md (§2 formats, §3 correction, §4 données, §5 banque).
   Relecture lisible (une ligne par question) : docs/certificats/banque-relecture.md.

   Script classique (pas de module) : déclare la globale CERTBANK. Il ne lit rien et n'écrit rien : à charger
   n'importe où après js/data/ndict.js et js/data/lexiques.js (le moteur js/app-certificats.js la lit à l'appel).

   Ce fichier ne recopie pas le dictionnaire : chaque mot est une CLÉ existante de allWords() ("<nature>:<w>").
   Le mot anglais, sa traduction (fr), son pluriel (pl), son émoji (e) et sa fréquence (USAGE) se lisent dans les
   données. La banque n'ajoute que ce qui manque, écrit à la main et relu :

   CERTBANK = { v, formats, certs: [certificat, …] }
   certificat = {
     id       identifiant du certificat = thème du moteur ("adjectives:colours") ou partie ("nouns:family-1")
     theme    thème des données d'où viennent les mots ("nouns:family")
     part     numéro de la partie (0 = thème entier)
     title    titre affiché (anglais) ; titleFr : sous-titre français pour un Beginner ; icon : émoji de la tuile
     suggest  niveaux auxquels Kai le propose (0 Beginner … 3 Upper-intermediate) ; certifiable à tous les niveaux
     picture  { q, qFr } : consigne du format « picture » pour ce certificat
     tree     (Family seulement, facultatif) arbre généalogique pour le format « picture » : voir plus bas
     words    les mots du périmètre (≤ 20), dans l'ordre de l'écran
   }
   mot = {
     k     clé du mot dans allWords() — c'est elle qu'on envoie à Cert.record ({ key, fmt, ok })
     fr    (facultatif) traduction affichée par « type-fr-en » si celle des données est ambiguë ; sinon d.fr
     skip  (facultatif) formats à NE PAS poser pour ce mot : ["type-fr-en"] quand le mot français s'écrit comme
           l'anglais (orange, parent, cousin : la question donnerait la réponse)
     ok    (facultatif) autres réponses justes, SANS note : { "<forme attendue>": ["autre", …] }
           (ex. aunt → auntie ; s'applique à toute question dont la réponse attendue est cette forme, sauf
           l'étape 2 de « fix » qui n'accepte que good et fix.ok). Les paires de registre (mother / mum, father / dad,
           grandmother / grandma, grandfather / grandpa) s'acceptent l'une l'autre : le français ne les sépare pas
           assez nettement (« une grand-mère / mamie ») pour qu'un écart de registre compte faux.
     us    (facultatif) orthographe ou mot américain accepté AVEC la note « In British English: <forme attendue> »
           (décision Q9) : { "grey": ["gray"] }
     pic   (facultatif) image SANS ambiguïté pour « picture » ; absent = pas de question image pour ce mot.
           Une image n'est portée que par UN mot du périmètre (mother, pas mum : la case accepte les deux)
           true            → l'émoji des données (d.e)
           { e, fr? }      → cet émoji (fr : nom de l'objet montré, pour la relecture et les lecteurs d'écran)
           { tree: "id" }  → la case "id" de l'arbre du certificat (format possible seulement si l'écran sait le dessiner)
           ok?             → réponses justes en plus, propres à l'image (🐶 : puppy)
     gap   phrases à compléter : [anglais avec *mot*, français avec *mot*, réponses justes en plus?]
           réponse attendue = le texte entre *…*, forme exigée (pluriel compris) ; casse ignorée
     ord   phrases à remettre dans l'ordre : [anglais, français, autres ordres justes?]
           4 à 8 étiquettes (mots séparés par des espaces, ponctuation finale retirée) ; seul le 1er mot passe en
           minuscule (sauf I et Kai / Kai's) : les autres gardent leur casse (English) ; un seul ordre juste une fois
           la phrase française lue (sinon il est dans le 3e champ)
     fix   phrases avec UNE erreur : { s, bad, good, fr, why, whyFr }
           s : phrase fautive ; bad : le mot faux (présent une seule fois dans s) ; good : le mot qui le remplace ;
           fr : traduction de la phrase JUSTE (montrée en 6e, décision Q8) ; why / whyFr : explication du rattrapage ;
           ok? : autres corrections justes à l'étape 2 (goldfish → goldfishes).
           À l'étape 2, retaper `bad` est TOUJOURS faux, même à une lettre près de `good` (oncle / uncle) : la
           tolérance de frappe ne s'applique pas au mot fautif. La phrase française tranche quand une autre correction
           d'un mot serait grammaticale (« I have two brother » → « J'ai deux frères » : brothers, pas « a brother »).
           L'erreur porte toujours sur le mot du périmètre et se corrige en remplaçant UN mot (§2.5).
     say   phrase de la dictée : Kai dit « mot. phrase. mot. » ; l'élève tape le mot (forme du dictionnaire)
   }
   Arbre (tree) : { nodes: [{ id, e, row, col, you? }], couples: [[id, id]], kids: [[parent id, enfant id]],
                    ask: { "<id de case>": ["réponse", …] } } — une seule case porte « ? » ; les autres ne montrent
                    QUE leur émoji (aucun mot anglais : ce serait un indice), la case de l'élève dit « You ».

   Règles de contenu (CLAUDE.md, règle 3) : anglais britannique (grey, mum, colourful) ; niveau A1–A2 ;
   phrases adaptées à un enfant de 11–12 ans (rien d'effrayant ni de triste) ; aucune liste protégée recopiée :
   les phrases sont celles des données (ex) ou écrites pour la banque.
   ===================================================================================== */
"use strict";
const CERTBANK = {
    v: 1,
    formats: ["type-fr-en", "picture", "gap", "order", "fix", "dictation"],
    certs: [
        /* =========================================================================== COLOURS (11 mots) */
        {
            id: "adjectives:colours", theme: "adjectives:colours", part: 0,
            title: "Colours", titleFr: "Les couleurs", icon: "🎨", suggest: [0, 1],
            picture: { q: "What colour is it?", qFr: "De quelle couleur est-ce ?" },
            words: [
                { k: "adjectives:red", pic: { e: "🍓", fr: "une fraise" },
                    gap: [["I have a *red* bike.", "J'ai un vélo *rouge*."], ["Strawberries are *red*.", "Les fraises sont *rouges*."]],
                    ord: [["I have a red bike.", "J'ai un vélo rouge."], ["My best friend has a red scooter.", "Mon meilleur ami a une trottinette rouge."]],
                    fix: [{ s: "I have a rouge bike.", bad: "rouge", good: "red", fr: "J'ai un vélo rouge.", why: "Rouge is French. In English: red.", whyFr: "« Rouge » est du français : en anglais, red." },
                        { s: "I have two reds pencils.", bad: "reds", good: "red", fr: "J'ai deux crayons rouges.", why: "Colours never take -s: two red pencils.", whyFr: "Les couleurs ne prennent jamais de -s : two red pencils." }],
                    say: "Strawberries are red." },
                { k: "adjectives:blue", pic: { e: "🌊", fr: "une vague" },
                    gap: [["The sky is *blue* today.", "Le ciel est *bleu* aujourd'hui."], ["Kai has *blue* eyes.", "Kai a les yeux *bleus*."]],
                    ord: [["Kai has blue eyes.", "Kai a les yeux bleus."], ["My school bag is blue.", "Mon cartable est bleu."]],
                    fix: [{ s: "Kai has blues eyes.", bad: "blues", good: "blue", fr: "Kai a les yeux bleus.", why: "Colours never take -s: blue eyes.", whyFr: "Les couleurs ne prennent jamais de -s : blue eyes." },
                        { s: "The sky is bleu today.", bad: "bleu", good: "blue", fr: "Le ciel est bleu aujourd'hui.", why: "Bleu is French. In English: blue.", whyFr: "« Bleu » est du français : en anglais, blue." }],
                    say: "The sky is blue today." },
                { k: "adjectives:green", pic: { e: "🐸", fr: "une grenouille" },
                    gap: [["Frogs are *green*.", "Les grenouilles sont *vertes*."], ["I'm wearing a *green* T-shirt.", "Je porte un tee-shirt *vert*."]],
                    ord: [["I'm wearing a green T-shirt.", "Je porte un tee-shirt vert."], ["My grandpa has a green car.", "Mon papi a une voiture verte."]],
                    fix: [{ s: "Frogs are vert.", bad: "vert", good: "green", fr: "Les grenouilles sont vertes.", why: "Vert is French. In English: green.", whyFr: "« Vert » est du français : en anglais, green." },
                        { s: "I'm wearing greens trainers.", bad: "greens", good: "green", fr: "Je porte des baskets vertes.", why: "Colours never take -s: green trainers.", whyFr: "Les couleurs ne prennent jamais de -s : green trainers." }],
                    say: "Frogs are green." },
                { k: "adjectives:yellow", pic: { e: "🍌", fr: "une banane" },
                    gap: [["Bananas are *yellow*.", "Les bananes sont *jaunes*."], ["The sun is *yellow*.", "Le soleil est *jaune*."]],
                    ord: [["The sun is yellow.", "Le soleil est jaune."], ["Kai has a yellow pencil.", "Kai a un crayon jaune."]],
                    fix: [{ s: "Bananas are jaune.", bad: "jaune", good: "yellow", fr: "Les bananes sont jaunes.", why: "Jaune is French. In English: yellow.", whyFr: "« Jaune » est du français : en anglais, yellow." },
                        { s: "I have two yellows balloons.", bad: "yellows", good: "yellow", fr: "J'ai deux ballons jaunes.", why: "Colours never take -s: yellow balloons.", whyFr: "Les couleurs ne prennent jamais de -s : yellow balloons." }],
                    say: "Bananas are yellow." },
                { k: "adjectives:orange", skip: ["type-fr-en"], pic: { e: "🥕", fr: "une carotte" },
                    gap: [["My cat is *orange* and white.", "Mon chat est *orange* et blanc."], ["Carrots are *orange*.", "Les carottes sont *orange*."]],
                    ord: [["My cat is orange and white.", "Mon chat est orange et blanc.", ["My cat is white and orange."]], ["I have an orange backpack.", "J'ai un sac à dos orange."]],
                    fix: [{ s: "I've got two oranges T-shirts.", bad: "oranges", good: "orange", fr: "J'ai deux tee-shirts orange.", why: "Colours never take -s: orange T-shirts.", whyFr: "Les couleurs ne prennent jamais de -s : orange T-shirts." },
                        { s: "She has oranges socks.", bad: "oranges", good: "orange", fr: "Elle a des chaussettes orange.", why: "Colours never take -s: orange socks.", whyFr: "Les couleurs ne prennent jamais de -s : orange socks." }],
                    say: "Carrots are orange." },
                { k: "adjectives:pink", pic: { e: "🦩", fr: "un flamant rose" },
                    gap: [["Flamingos are *pink*.", "Les flamants sont *roses*."], ["My sister loves *pink* dresses.", "Ma sœur adore les robes *roses*."]],
                    ord: [["My sister loves pink dresses.", "Ma sœur adore les robes roses."], ["The flamingo has pink feathers.", "Le flamant a des plumes roses."]],
                    fix: [{ s: "My sister loves pinks dresses.", bad: "pinks", good: "pink", fr: "Ma sœur adore les robes roses.", why: "Colours never take -s: pink dresses.", whyFr: "Les couleurs ne prennent jamais de -s : pink dresses." },
                        { s: "Look at the pinks flowers!", bad: "pinks", good: "pink", fr: "Regarde les fleurs roses !", why: "Colours never take -s: pink flowers.", whyFr: "Les couleurs ne prennent jamais de -s : pink flowers." }],
                    say: "Flamingos are pink." },
                { k: "adjectives:purple", pic: { e: "🍇", fr: "du raisin" },
                    gap: [["Grapes can be *purple*.", "Le raisin peut être *violet*."], ["I have a *purple* pencil case.", "J'ai une trousse *violette*."]],
                    ord: [["I have a purple pencil case.", "J'ai une trousse violette."], ["Grapes can be purple.", "Le raisin peut être violet."]],
                    fix: [{ s: "She has purples shoes.", bad: "purples", good: "purple", fr: "Elle a des chaussures violettes.", why: "Colours never take -s: purple shoes.", whyFr: "Les couleurs ne prennent jamais de -s : purple shoes." },
                        { s: "Kai has two purples pens.", bad: "purples", good: "purple", fr: "Kai a deux stylos violets.", why: "Colours never take -s: purple pens.", whyFr: "Les couleurs ne prennent jamais de -s : purple pens." }],
                    say: "Grapes can be purple." },
                { k: "adjectives:brown", pic: { e: "🐻", fr: "un ours" },
                    gap: [["Bears are often *brown*.", "Les ours sont souvent *bruns*."], ["I have *brown* eyes.", "J'ai les yeux *marron*."]],
                    ord: [["I have brown eyes.", "J'ai les yeux marron."], ["My dog has brown ears.", "Mon chien a les oreilles marron."]],
                    fix: [{ s: "I have marron eyes.", bad: "marron", good: "brown", fr: "J'ai les yeux marron.", why: "Marron is French. In English: brown.", whyFr: "« Marron » est du français : en anglais, brown." },
                        { s: "My dog has browns ears.", bad: "browns", good: "brown", fr: "Mon chien a les oreilles marron.", why: "Colours never take -s: brown ears.", whyFr: "Les couleurs ne prennent jamais de -s : brown ears." }],
                    say: "I have brown eyes." },
                { k: "adjectives:black", pic: { e: "🎩", fr: "un chapeau haut-de-forme" },
                    gap: [["Kai's hoodie is *black*.", "Le sweat de Kai est *noir*."], ["I have a *black* cat.", "J'ai un chat *noir*."]],
                    ord: [["Kai's hoodie is black.", "Le sweat de Kai est noir."], ["I have a black cat.", "J'ai un chat noir."]],
                    fix: [{ s: "I have a noir cat.", bad: "noir", good: "black", fr: "J'ai un chat noir.", why: "Noir is French. In English: black.", whyFr: "« Noir » est du français : en anglais, black." },
                        { s: "My dad has two blacks jackets.", bad: "blacks", good: "black", fr: "Mon papa a deux vestes noires.", why: "Colours never take -s: black jackets.", whyFr: "Les couleurs ne prennent jamais de -s : black jackets." }],
                    say: "Kai's hoodie is black." },
                { k: "adjectives:white", pic: { e: "🥛", fr: "un verre de lait" },
                    gap: [["Snow is *white*.", "La neige est *blanche*."], ["My trainers are *white*.", "Mes baskets sont *blanches*."]],
                    ord: [["My trainers are white.", "Mes baskets sont blanches."], ["Polar bears have white fur.", "Les ours polaires ont une fourrure blanche."]],
                    fix: [{ s: "Snow is blanc.", bad: "blanc", good: "white", fr: "La neige est blanche.", why: "Blanc is French. In English: white.", whyFr: "« Blanc » est du français : en anglais, white." },
                        { s: "I've got whites trainers.", bad: "whites", good: "white", fr: "J'ai des baskets blanches.", why: "Colours never take -s: white trainers.", whyFr: "Les couleurs ne prennent jamais de -s : white trainers." }],
                    say: "Snow is white." },
                { k: "adjectives:grey", us: { "grey": ["gray"] }, pic: { e: "🐘", fr: "un éléphant" },
                    gap: [["Elephants are *grey*.", "Les éléphants sont *gris*."], ["The sky is *grey* today.", "Le ciel est *gris* aujourd'hui."]],
                    ord: [["My grandpa has grey hair.", "Mon papi a les cheveux gris."], ["Elephants have grey skin.", "Les éléphants ont la peau grise."]],
                    fix: [{ s: "Elephants are gris.", bad: "gris", good: "grey", fr: "Les éléphants sont gris.", why: "Gris is French. In English: grey.", whyFr: "« Gris » est du français : en anglais, grey." },
                        { s: "Look at the greys clouds.", bad: "greys", good: "grey", fr: "Regarde les nuages gris.", why: "Colours never take -s: grey clouds.", whyFr: "Les couleurs ne prennent jamais de -s : grey clouds." }],
                    say: "Elephants are grey." }
            ]
        },
        /* =========================================================================== FAMILY 1 · MY FAMILY (18 mots) */
        {
            id: "nouns:family-1", theme: "nouns:family", part: 1,
            title: "Family 1 · My family", titleFr: "Ma famille", icon: "🌳", suggest: [0, 1],
            picture: { q: "Who is this? This is your…", qFr: "Qui est-ce ? C'est ton / ta…" },
            tree: {
                nodes: [
                    { id: "grandpa", e: "👴", row: 0, col: 1 }, { id: "grandma", e: "👵", row: 0, col: 2 },
                    { id: "dad", e: "👨", row: 1, col: 0 }, { id: "mum", e: "👩", row: 1, col: 1 },
                    { id: "aunt", e: "👩", row: 1, col: 2 }, { id: "uncle", e: "👨", row: 1, col: 3 },
                    { id: "you", e: "🧒", row: 2, col: 0, you: true }, { id: "brother", e: "👦", row: 2, col: 1 },
                    { id: "sister", e: "👧", row: 2, col: 2 }, { id: "cousin", e: "🧒", row: 2, col: 3 }
                ],
                couples: [["grandpa", "grandma"], ["dad", "mum"], ["aunt", "uncle"]],
                kids: [["grandma", "mum"], ["grandma", "aunt"], ["mum", "you"], ["mum", "brother"], ["mum", "sister"], ["aunt", "cousin"]],
                /* réponses justes pour chaque case marquée « ? » (l'image ne distingue pas mother / mum) ;
                   "grandparents" = les deux cases du haut marquées ensemble */
                ask: {
                    grandpa: ["grandfather", "grandpa", "grandad", "granddad"], grandma: ["grandmother", "grandma", "granny", "gran"],
                    grandparents: ["grandparents"], dad: ["father", "dad", "daddy"], mum: ["mother", "mum", "mummy"],
                    aunt: ["aunt", "auntie", "aunty"], uncle: ["uncle"], brother: ["brother"], sister: ["sister"], cousin: ["cousin"]
                }
            },
            words: [
                { k: "nouns:family",
                    gap: [["I love my *family*.", "J'aime ma *famille*."], ["Some *families* have lots of children.", "Certaines *familles* ont beaucoup d'enfants."]],
                    ord: [["I love my family.", "J'aime ma famille."], ["My family has a big house.", "Ma famille a une grande maison."]],
                    fix: [{ s: "Some familys have lots of children.", bad: "familys", good: "families", fr: "Certaines familles ont beaucoup d'enfants.", why: "family → families (y becomes ies).", whyFr: "family → families (le y devient ies)." },
                        { s: "I love my famille.", bad: "famille", good: "family", fr: "J'aime ma famille.", why: "Famille is French. In English: family.", whyFr: "« Famille » est du français : en anglais, family." }],
                    say: "I love my family." },
                { k: "nouns:parent", skip: ["type-fr-en"],
                    gap: [["Each *parent* must sign the paper.", "Chaque *parent* doit signer le papier."], ["My *parents* are at work.", "Mes *parents* sont au travail."]],
                    ord: [["My parents are at work.", "Mes parents sont au travail."], ["My parents love dancing.", "Mes parents adorent danser."]],
                    fix: [{ s: "Both my parent are at work.", bad: "parent", good: "parents", fr: "Mes deux parents sont au travail.", why: "Both = two people: parents (plural).", whyFr: "Both = deux personnes : parents (pluriel)." },
                        { s: "I live with my two parent.", bad: "parent", good: "parents", fr: "Je vis avec mes deux parents.", why: "Two → plural: two parents.", whyFr: "Two → pluriel : two parents." }],
                    say: "My parents are at work." },
                { k: "nouns:mother", ok: { "mother": ["mum", "mummy"], "mothers": ["mums"] }, us: { "mother": ["mom"] }, pic: { tree: "mum" },
                    gap: [["My *mother* is a doctor.", "Ma *mère* est médecin."], ["*Mothers* and daughters often look alike.", "Les *mères* et les filles se ressemblent souvent."]],
                    ord: [["My mother is a doctor.", "Ma mère est médecin."], ["My mother speaks English.", "Ma mère parle anglais."]],
                    fix: [{ s: "My mère is a doctor.", bad: "mère", good: "mother", fr: "Ma mère est médecin.", why: "Mère is French. In English: mother.", whyFr: "« Mère » est du français : en anglais, mother." },
                        { s: "The two mother are talking at the school gate.", bad: "mother", good: "mothers", fr: "Les deux mères discutent à la porte de l'école.", why: "Two → plural: two mothers.", whyFr: "Two → pluriel : two mothers." }],
                    say: "My mother is a doctor." },
                { k: "nouns:mum", ok: { "mum": ["mummy", "mother"], "mums": ["mummies", "mothers"] }, us: { "mum": ["mom"], "mums": ["moms"] },
                    gap: [["*Mum*, can I have a biscuit?", "*Maman*, je peux avoir un biscuit ?"], ["All the *mums* came to the school show.", "Toutes les *mamans* sont venues au spectacle de l'école."]],
                    ord: [["Mum is in the kitchen.", "Maman est dans la cuisine."], ["My mum likes pizza.", "Ma maman aime la pizza."]],
                    fix: [{ s: "All the mum came to the school show.", bad: "mum", good: "mums", fr: "Toutes les mamans sont venues au spectacle de l'école.", why: "All the → plural: all the mums.", whyFr: "All the → pluriel : all the mums." }],
                    say: "Mum is in the kitchen." },
                { k: "nouns:father", ok: { "father": ["dad", "daddy"], "fathers": ["dads"] }, pic: { tree: "dad" },
                    gap: [["My *father* is very tall.", "Mon *père* est très grand."], ["Some *fathers* stay at home with the children.", "Certains *pères* restent à la maison avec les enfants."]],
                    ord: [["My father is very tall.", "Mon père est très grand."], ["My father is a good cook.", "Mon père est un bon cuisinier."]],
                    fix: [{ s: "My père is very tall.", bad: "père", good: "father", fr: "Mon père est très grand.", why: "Père is French. In English: father.", whyFr: "« Père » est du français : en anglais, father." },
                        { s: "Many father stay at home with the children.", bad: "father", good: "fathers", fr: "Beaucoup de pères restent à la maison avec les enfants.", why: "Many → plural: many fathers.", whyFr: "Many → pluriel : many fathers." }],
                    say: "My father is very tall." },
                { k: "nouns:dad", ok: { "dad": ["daddy", "father"], "dads": ["daddies", "fathers"] },
                    gap: [["*Dad*, where are my shoes?", "*Papa*, où sont mes chaussures ?"], ["The *dads* made a cake for the party.", "Les *papas* ont fait un gâteau pour la fête."]],
                    ord: [["My dad plays the guitar.", "Mon papa joue de la guitare."], ["Dad is cooking pasta.", "Papa fait cuire des pâtes."]],
                    fix: [{ s: "All the dad came to the school show.", bad: "dad", good: "dads", fr: "Tous les papas sont venus au spectacle de l'école.", why: "All the → plural: all the dads.", whyFr: "All the → pluriel : all the dads." },
                        { s: "Three dad helped at the school fair.", bad: "dad", good: "dads", fr: "Trois papas ont aidé à la kermesse de l'école.", why: "Three → plural: three dads.", whyFr: "Three → pluriel : three dads." }],
                    say: "Dad is cooking pasta." },
                { k: "nouns:brother", pic: { tree: "brother" },
                    gap: [["My big *brother* is 15.", "Mon grand *frère* a 15 ans."], ["I have two *brothers*.", "J'ai deux *frères*."]],
                    ord: [["My big brother is 15.", "Mon grand frère a 15 ans."], ["I have two brothers.", "J'ai deux frères."]],
                    fix: [{ s: "I have two brother.", bad: "brother", good: "brothers", fr: "J'ai deux frères.", why: "Two → plural: two brothers.", whyFr: "Two → pluriel : two brothers." },
                        { s: "My big frère is 15.", bad: "frère", good: "brother", fr: "Mon grand frère a 15 ans.", why: "Frère is French. In English: brother.", whyFr: "« Frère » est du français : en anglais, brother." }],
                    say: "My big brother is 15." },
                { k: "nouns:sister", pic: { tree: "sister" },
                    gap: [["My little *sister* is 6.", "Ma petite *sœur* a 6 ans."], ["My friends have *sisters* at our school.", "Mes amis ont des *sœurs* dans notre collège."]],
                    ord: [["My little sister is 6.", "Ma petite sœur a 6 ans."], ["My sister has long hair.", "Ma sœur a les cheveux longs."]],
                    fix: [{ s: "I have three sister.", bad: "sister", good: "sisters", fr: "J'ai trois sœurs.", why: "Three → plural: three sisters.", whyFr: "Three → pluriel : three sisters." },
                        { s: "My little sœur is 6.", bad: "sœur", good: "sister", fr: "Ma petite sœur a 6 ans.", why: "Sœur is French. In English: sister.", whyFr: "« Sœur » est du français : en anglais, sister." }],
                    say: "My little sister is 6." },
                { k: "nouns:son",
                    gap: [["Their *son* is called Kai.", "Leur *fils* s'appelle Kai."], ["The king had three *sons*.", "Le roi avait trois *fils*."]],
                    ord: [["Their son is called Kai.", "Leur fils s'appelle Kai."], ["The king had three sons.", "Le roi avait trois fils."]],
                    fix: [{ s: "Their sun is called Kai.", bad: "sun", good: "son", fr: "Leur fils s'appelle Kai.", why: "sun = le soleil ; son = le fils. Same sound, different words!", whyFr: "sun = le soleil ; son = le fils. Même son, mots différents !" },
                        { s: "The king had three son.", bad: "son", good: "sons", fr: "Le roi avait trois fils.", why: "Three → plural: three sons.", whyFr: "Three → pluriel : three sons." }],
                    say: "Their son is called Kai." },
                { k: "nouns:daughter",
                    gap: [["Their *daughter* is a good student.", "Leur *fille* est une bonne élève."], ["My aunt has two *daughters*.", "Ma tante a deux *filles*."]],
                    ord: [["Their daughter is a good student.", "Leur fille est une bonne élève."], ["My aunt has two daughters.", "Ma tante a deux filles."]],
                    fix: [{ s: "My aunt has two daughter.", bad: "daughter", good: "daughters", fr: "Ma tante a deux filles.", why: "Two → plural: two daughters.", whyFr: "Two → pluriel : two daughters." },
                        { s: "Their fille is a good student.", bad: "fille", good: "daughter", fr: "Leur fille est une bonne élève.", why: "Fille is French. Their child = their daughter.", whyFr: "« Fille » est du français : l'enfant de quelqu'un = daughter." }],
                    say: "Their daughter is a good student." },
                { k: "nouns:grandmother", fr: "une grand-mère", ok: { "grandmother": ["grandma", "granny", "gran"], "grandmothers": ["grandmas"] }, pic: { tree: "grandma" },
                    gap: [["My *grandmother* makes the best cakes.", "Ma *grand-mère* fait les meilleurs gâteaux."], ["Both my *grandmothers* live in Brittany.", "Mes deux *grands-mères* habitent en Bretagne."]],
                    ord: [["My grandmother makes the best cakes.", "Ma grand-mère fait les meilleurs gâteaux."]],
                    fix: [{ s: "Both my grandmother live in Brittany.", bad: "grandmother", good: "grandmothers", fr: "Mes deux grands-mères habitent en Bretagne.", why: "Both → plural: both my grandmothers.", whyFr: "Both → pluriel : both my grandmothers." }],
                    say: "My grandmother makes the best cakes." },
                { k: "nouns:grandfather", fr: "un grand-père", ok: { "grandfather": ["grandpa", "grandad", "granddad"], "grandfathers": ["grandpas", "grandads"] }, pic: { tree: "grandpa" },
                    gap: [["My *grandfather* tells funny stories.", "Mon *grand-père* raconte des histoires drôles."], ["My two *grandfathers* love fishing.", "Mes deux *grands-pères* adorent la pêche."]],
                    ord: [["My grandfather tells funny stories.", "Mon grand-père raconte des histoires drôles."], ["My two grandfathers love fishing.", "Mes deux grands-pères adorent la pêche."]],
                    fix: [{ s: "My two grandfather love fishing.", bad: "grandfather", good: "grandfathers", fr: "Mes deux grands-pères adorent la pêche.", why: "Two → plural: two grandfathers.", whyFr: "Two → pluriel : two grandfathers." }],
                    say: "My grandfather tells funny stories." },
                { k: "nouns:grandma", ok: { "grandma": ["granny", "gran", "grandmother"], "grandmas": ["grannies", "grans", "grandmothers"] },
                    gap: [["My *grandma* makes great pancakes.", "Ma *mamie* fait de super crêpes."], ["Both my *grandmas* live in Lyon.", "Mes deux *mamies* habitent à Lyon."]],
                    ord: [["My grandma makes great pancakes.", "Ma mamie fait de super crêpes."]],
                    fix: [{ s: "My mamie makes great pancakes.", bad: "mamie", good: "grandma", fr: "Ma mamie fait de super crêpes.", why: "Mamie is French. In English: grandma.", whyFr: "« Mamie » est du français : en anglais, grandma." },
                        { s: "Both my grandma live in Lyon.", bad: "grandma", good: "grandmas", fr: "Mes deux mamies habitent à Lyon.", why: "Both → plural: both my grandmas.", whyFr: "Both → pluriel : both my grandmas." }],
                    say: "My grandma makes great pancakes." },
                { k: "nouns:grandpa", ok: { "grandpa": ["grandad", "granddad", "grandfather"], "grandpas": ["grandads", "granddads", "grandfathers"] },
                    gap: [["My *grandpa* takes me fishing.", "Mon *papi* m'emmène à la pêche."], ["My two *grandpas* love football.", "Mes deux *papis* adorent le foot."]],
                    ord: [["My grandpa takes me fishing.", "Mon papi m'emmène à la pêche."], ["My two grandpas love football.", "Mes deux papis adorent le foot."]],
                    fix: [{ s: "My papi takes me fishing.", bad: "papi", good: "grandpa", fr: "Mon papi m'emmène à la pêche.", why: "Papi is French. In English: grandpa.", whyFr: "« Papi » est du français : en anglais, grandpa." },
                        { s: "My two grandpa love football.", bad: "grandpa", good: "grandpas", fr: "Mes deux papis adorent le foot.", why: "Two → plural: two grandpas.", whyFr: "Two → pluriel : two grandpas." }],
                    say: "My grandpa takes me fishing." },
                { k: "nouns:grandparents", pic: { tree: "grandparents" },
                    gap: [["I spend my holidays at my *grandparents*' house.", "Je passe mes vacances chez mes *grands-parents*."], ["My *grandparents* live in the countryside.", "Mes *grands-parents* habitent à la campagne."]],
                    ord: [["My grandparents live in the countryside.", "Mes grands-parents habitent à la campagne."], ["My grandparents have a big garden.", "Mes grands-parents ont un grand jardin."]],
                    fix: [{ s: "I love all my grandparent.", bad: "grandparent", good: "grandparents", fr: "J'aime tous mes grands-parents.", why: "All my → plural: all my grandparents.", whyFr: "All my → pluriel : all my grandparents." },
                        { s: "My grands-parents live in the countryside.", bad: "grands-parents", good: "grandparents", fr: "Mes grands-parents habitent à la campagne.", why: "Grands-parents is French. In English: grandparents (one word).", whyFr: "« Grands-parents » est du français : en anglais, grandparents (en un mot)." }],
                    say: "My grandparents live in the countryside." },
                { k: "nouns:uncle", pic: { tree: "uncle" },
                    gap: [["My *uncle* lives in Canada.", "Mon *oncle* habite au Canada."], ["I have three *uncles*.", "J'ai trois *oncles*."]],
                    ord: [["My uncle lives in Canada.", "Mon oncle habite au Canada."], ["I have three uncles.", "J'ai trois oncles."]],
                    fix: [{ s: "Both my uncle live in Paris.", bad: "uncle", good: "uncles", fr: "Mes deux oncles habitent à Paris.", why: "Both → plural: both my uncles.", whyFr: "Both → pluriel : both my uncles." },
                        { s: "I have three uncle.", bad: "uncle", good: "uncles", fr: "J'ai trois oncles.", why: "Three → plural: three uncles.", whyFr: "Three → pluriel : three uncles." }],
                    say: "My uncle lives in Canada." },
                { k: "nouns:aunt", ok: { "aunt": ["auntie", "aunty"], "aunts": ["aunties"] }, pic: { tree: "aunt" },
                    gap: [["My *aunt* is a nurse.", "Ma *tante* est infirmière."], ["My *aunts* always give me presents.", "Mes *tantes* me font toujours des cadeaux."]],
                    ord: [["My aunt is a nurse.", "Ma tante est infirmière."], ["My aunt has a big dog.", "Ma tante a un gros chien."]],
                    fix: [{ s: "My ant is a nurse.", bad: "ant", good: "aunt", fr: "Ma tante est infirmière.", why: "ant = une fourmi ; aunt = une tante.", whyFr: "ant = une fourmi ; aunt = une tante." },
                        { s: "My tante always gives me presents.", bad: "tante", good: "aunt", fr: "Ma tante me fait toujours des cadeaux.", why: "Tante is French. In English: aunt.", whyFr: "« Tante » est du français : en anglais, aunt." }],
                    say: "My aunt is a nurse." },
                { k: "nouns:cousin", skip: ["type-fr-en"], pic: { tree: "cousin" },
                    gap: [["My *cousin* is the same age as me.", "Mon *cousin* a le même âge que moi."], ["I play with my *cousins* every summer.", "Je joue avec mes *cousins* chaque été."]],
                    ord: [["My cousin is the same age as me.", "Mon cousin a le même âge que moi."], ["I have five cousins.", "J'ai cinq cousins."]],
                    fix: [{ s: "My cousins is the same age as me.", bad: "cousins", good: "cousin", fr: "Mon cousin a le même âge que moi.", why: "One cousin: singular, my cousin is…", whyFr: "Un seul cousin : singulier, my cousin is…" },
                        { s: "I play with my two cousin every summer.", bad: "cousin", good: "cousins", fr: "Je joue avec mes deux cousins chaque été.", why: "Two → plural: two cousins.", whyFr: "Two → pluriel : two cousins." }],
                    say: "My cousin is the same age as me." }
            ]
        },
        /* =========================================================================== ANIMALS 1 · PETS & FARM (20 mots) */
        {
            id: "nouns:animals-1", theme: "nouns:animals", part: 1,
            title: "Animals 1 · Pets & farm", titleFr: "Animaux de compagnie et de la ferme", icon: "🐾", suggest: [0, 1],
            picture: { q: "What is it?", qFr: "Qu'est-ce que c'est ?" },
            words: [
                { k: "nouns:pet",
                    gap: [["Do you have a *pet*?", "Tu as un *animal de compagnie* ?"], ["Dogs and cats are popular *pets*.", "Les chiens et les chats sont des *animaux de compagnie* très appréciés."]],
                    ord: [["I would like a pet.", "J'aimerais avoir un animal de compagnie."], ["My pet is very funny.", "Mon animal de compagnie est très drôle."]],
                    fix: [{ s: "Dogs and cats are popular pet.", bad: "pet", good: "pets", fr: "Les chiens et les chats sont des animaux de compagnie très appréciés.", why: "Dogs and cats = more than one: pets.", whyFr: "Dogs and cats = plusieurs : pets (pluriel)." },
                        { s: "I have three pet at home.", bad: "pet", good: "pets", fr: "J'ai trois animaux de compagnie à la maison.", why: "Three → plural: three pets.", whyFr: "Three → pluriel : three pets." }],
                    say: "Do you have a pet?" },
                { k: "nouns:dog", pic: { e: "🐶", ok: ["puppy"] },
                    gap: [["My *dog* loves to play in the garden.", "Mon *chien* adore jouer dans le jardin."], ["Some *dogs* are very big.", "Certains *chiens* sont très grands."]],
                    ord: [["My dog is very big.", "Mon chien est très grand."], ["Some dogs are very big.", "Certains chiens sont très grands."]],
                    fix: [{ s: "My chien loves to play in the garden.", bad: "chien", good: "dog", fr: "Mon chien adore jouer dans le jardin.", why: "Chien is French. In English: dog.", whyFr: "« Chien » est du français : en anglais, dog." },
                        { s: "I have two dog.", bad: "dog", good: "dogs", fr: "J'ai deux chiens.", why: "Two → plural: two dogs.", whyFr: "Two → pluriel : two dogs." }],
                    say: "My dog loves to play in the garden." },
                { k: "nouns:puppy",
                    gap: [["Our *puppy* chews all my shoes!", "Notre *chiot* mâchouille toutes mes chaussures !"], ["The *puppies* are drinking milk.", "Les *chiots* boivent du lait."]],
                    ord: [["Our puppy chews all my shoes.", "Notre chiot mâchouille toutes mes chaussures."], ["The puppies are drinking milk.", "Les chiots boivent du lait."]],
                    fix: [{ s: "The puppys are drinking milk.", bad: "puppys", good: "puppies", fr: "Les chiots boivent du lait.", why: "puppy → puppies (y becomes ies).", whyFr: "puppy → puppies (le y devient ies)." },
                        { s: "Our chiot chews all my shoes!", bad: "chiot", good: "puppy", fr: "Notre chiot mâchouille toutes mes chaussures !", why: "Chiot is French. In English: puppy.", whyFr: "« Chiot » est du français : en anglais, puppy." }],
                    say: "Our puppy chews all my shoes!" },
                { k: "nouns:cat", pic: { e: "🐱", ok: ["kitten"] },
                    gap: [["The *cat* is sleeping on my bed.", "Le *chat* dort sur mon lit."], ["*Cats* love to sleep in the sun.", "Les *chats* adorent dormir au soleil."]],
                    ord: [["My cat has green eyes.", "Mon chat a les yeux verts."], ["Cats love to sleep in the sun.", "Les chats adorent dormir au soleil."]],
                    fix: [{ s: "The chat is sleeping on my bed.", bad: "chat", good: "cat", fr: "Le chat dort sur mon lit.", why: "Chat is French. In English: cat (to chat = to talk).", whyFr: "« Chat » est le mot français ; en anglais, to chat = bavarder. Le chat : cat." },
                        { s: "I have two cat.", bad: "cat", good: "cats", fr: "J'ai deux chats.", why: "Two → plural: two cats.", whyFr: "Two → pluriel : two cats." }],
                    say: "The cat is sleeping on my bed." },
                { k: "nouns:kitten",
                    gap: [["The little *kitten* is playing with a ball of wool.", "Le petit *chaton* joue avec une pelote de laine."], ["My cat had four *kittens*.", "Ma chatte a eu quatre *chatons*."]],
                    ord: [["My cat had four kittens.", "Ma chatte a eu quatre chatons."], ["The kitten is very small.", "Le chaton est tout petit."]],
                    fix: [{ s: "My cat had four kitten.", bad: "kitten", good: "kittens", fr: "Ma chatte a eu quatre chatons.", why: "Four → plural: four kittens.", whyFr: "Four → pluriel : four kittens." },
                        { s: "The little chaton is playing with a ball of wool.", bad: "chaton", good: "kitten", fr: "Le petit chaton joue avec une pelote de laine.", why: "Chaton is French. In English: kitten.", whyFr: "« Chaton » est du français : en anglais, kitten." }],
                    say: "The little kitten is playing with a ball of wool." },
                { k: "nouns:rabbit", pic: { e: "🐰", ok: ["bunny"] },
                    gap: [["My *rabbit* eats carrots every day.", "Mon *lapin* mange des carottes tous les jours."], ["There are a lot of *rabbits* in the field.", "Il y a beaucoup de *lapins* dans le champ."]],
                    ord: [["My rabbit eats carrots.", "Mon lapin mange des carottes."], ["My rabbit has long ears.", "Mon lapin a de longues oreilles."]],
                    fix: [{ s: "My lapin eats carrots every day.", bad: "lapin", good: "rabbit", fr: "Mon lapin mange des carottes tous les jours.", why: "Lapin is French. In English: rabbit.", whyFr: "« Lapin » est du français : en anglais, rabbit." },
                        { s: "There are a lot of rabbit in the field.", bad: "rabbit", good: "rabbits", fr: "Il y a beaucoup de lapins dans le champ.", why: "A lot of → plural: a lot of rabbits.", whyFr: "A lot of → pluriel : a lot of rabbits." }],
                    say: "My rabbit eats carrots every day." },
                { k: "nouns:mouse", pic: true,
                    gap: [["A little *mouse* is hiding under the table.", "Une petite *souris* se cache sous la table."], ["The cat is chasing the *mice*.", "Le chat chasse les *souris*."]],
                    ord: [["I can see a little mouse.", "Je vois une petite souris."]],
                    fix: [{ s: "I can see three mouses.", bad: "mouses", good: "mice", fr: "Je vois trois souris.", why: "One mouse, two mice: irregular plural!", whyFr: "One mouse, two mice : pluriel irrégulier !" },
                        { s: "A little souris is hiding under the table.", bad: "souris", good: "mouse", fr: "Une petite souris se cache sous la table.", why: "Souris is French. In English: mouse.", whyFr: "« Souris » est du français : en anglais, mouse." }],
                    say: "A little mouse is hiding under the table." },
                { k: "nouns:goldfish",
                    gap: [["My *goldfish* swims round and round.", "Mon *poisson rouge* tourne en rond."], ["There are three *goldfish* in the bowl.", "Il y a trois *poissons rouges* dans le bocal.", ["goldfishes"]]],
                    ord: [["My goldfish swims round and round.", "Mon poisson rouge tourne en rond."]],
                    fix: [{ s: "There are three goldfishs in the bowl.", bad: "goldfishs", good: "goldfish", ok: ["goldfishes"], fr: "Il y a trois poissons rouges dans le bocal.", why: "One goldfish, three goldfish: no -s.", whyFr: "One goldfish, three goldfish : pas de -s." }],
                    say: "My goldfish swims round and round." },
                { k: "nouns:parrot", pic: true,
                    gap: [["The *parrot* can say hello!", "Le *perroquet* sait dire bonjour !"], ["*Parrots* have very colourful feathers.", "Les *perroquets* ont des plumes très colorées."]],
                    ord: [["The parrot can say hello.", "Le perroquet sait dire bonjour."], ["Parrots have very colourful feathers.", "Les perroquets ont des plumes très colorées."]],
                    fix: [{ s: "The perroquet can say hello!", bad: "perroquet", good: "parrot", fr: "Le perroquet sait dire bonjour !", why: "Perroquet is French. In English: parrot.", whyFr: "« Perroquet » est du français : en anglais, parrot." },
                        { s: "My grandpa has two parrot.", bad: "parrot", good: "parrots", fr: "Mon papi a deux perroquets.", why: "Two → plural: two parrots.", whyFr: "Two → pluriel : two parrots." }],
                    say: "The parrot can say hello!" },
                { k: "nouns:tortoise", pic: { e: "🐢", ok: ["turtle"] },
                    gap: [["My grandma's *tortoise* is 40 years old.", "La *tortue* de ma grand-mère a 40 ans."], ["*Tortoises* walk very slowly.", "Les *tortues* marchent très lentement."]],
                    ord: [["My grandma's tortoise is 40 years old.", "La tortue de ma grand-mère a 40 ans."], ["Tortoises walk very slowly.", "Les tortues marchent très lentement."]],
                    fix: [{ s: "My grandma's tortue is 40 years old.", bad: "tortue", good: "tortoise", fr: "La tortue de ma grand-mère a 40 ans.", why: "Tortue is French. In English: tortoise.", whyFr: "« Tortue » est du français : en anglais, tortoise." },
                        { s: "Look at the two tortoise!", bad: "tortoise", good: "tortoises", fr: "Regarde les deux tortues !", why: "Two → plural: two tortoises.", whyFr: "Two → pluriel : two tortoises." }],
                    say: "My grandma's tortoise is 40 years old." },
                { k: "nouns:horse", pic: { e: "🐴", ok: ["pony"] },
                    gap: [["My sister rides a *horse* on Saturdays.", "Ma sœur monte à *cheval* le samedi."], ["The *horses* are running in the field.", "Les *chevaux* courent dans le champ."]],
                    ord: [["My sister rides a horse.", "Ma sœur monte à cheval."], ["The horses are running in the field.", "Les chevaux courent dans le champ."]],
                    fix: [{ s: "My sister rides a cheval on Saturdays.", bad: "cheval", good: "horse", fr: "Ma sœur monte à cheval le samedi.", why: "Cheval is French. In English: horse.", whyFr: "« Cheval » est du français : en anglais, horse." },
                        { s: "Two horse are running in the field.", bad: "horse", good: "horses", fr: "Deux chevaux courent dans le champ.", why: "Two → plural: two horses.", whyFr: "Two → pluriel : two horses." }],
                    say: "My sister rides a horse on Saturdays." },
                { k: "nouns:pony",
                    gap: [["My little sister has a *pony*.", "Ma petite sœur a un *poney*."], ["The *ponies* are eating hay.", "Les *poneys* mangent du foin."]],
                    ord: [["My little sister has a pony.", "Ma petite sœur a un poney."], ["The ponies are eating hay.", "Les poneys mangent du foin."]],
                    fix: [{ s: "My little sister has a poney.", bad: "poney", good: "pony", fr: "Ma petite sœur a un poney.", why: "Poney is French. In English: pony.", whyFr: "« Poney » est du français : en anglais, pony." },
                        { s: "The ponys are eating hay.", bad: "ponys", good: "ponies", fr: "Les poneys mangent du foin.", why: "pony → ponies (y becomes ies).", whyFr: "pony → ponies (le y devient ies)." }],
                    say: "My little sister has a pony." },
                { k: "nouns:donkey",
                    gap: [["The *donkey* carries heavy bags.", "L'*âne* porte des sacs lourds."], ["*Donkeys* say hee-haw!", "Les *ânes* font hi-han !"]],
                    ord: [["The donkey carries heavy bags.", "L'âne porte des sacs lourds."], ["Donkeys have long ears.", "Les ânes ont de longues oreilles."]],
                    fix: [{ s: "The âne carries heavy bags.", bad: "âne", good: "donkey", fr: "L'âne porte des sacs lourds.", why: "Âne is French. In English: donkey.", whyFr: "« Âne » est du français : en anglais, donkey." },
                        { s: "I can see two donkey in the field.", bad: "donkey", good: "donkeys", fr: "Je vois deux ânes dans le champ.", why: "Two → plural: two donkeys.", whyFr: "Two → pluriel : two donkeys." }],
                    say: "The donkey carries heavy bags." },
                { k: "nouns:cow", pic: { e: "🐮", ok: ["calf"] },
                    gap: [["The *cow* gives us milk.", "La *vache* nous donne du lait."], ["There are black and white *cows* on the farm.", "Il y a des *vaches* noires et blanches à la ferme."]],
                    ord: [["The cow gives us milk.", "La vache nous donne du lait."]],
                    fix: [{ s: "The vache gives us milk.", bad: "vache", good: "cow", fr: "La vache nous donne du lait.", why: "Vache is French. In English: cow.", whyFr: "« Vache » est du français : en anglais, cow." },
                        { s: "There are black and white cow on the farm.", bad: "cow", good: "cows", fr: "Il y a des vaches noires et blanches à la ferme.", why: "There are → plural: cows.", whyFr: "There are → pluriel : cows." }],
                    say: "The cow gives us milk." },
                { k: "nouns:pig", pic: true,
                    gap: [["The *pig* is rolling in the mud.", "Le *cochon* se roule dans la boue."], ["*Pigs* are very intelligent.", "Les *cochons* sont très intelligents."]],
                    ord: [["Pigs are very intelligent.", "Les cochons sont très intelligents."]],
                    fix: [{ s: "The cochon is rolling in the mud.", bad: "cochon", good: "pig", fr: "Le cochon se roule dans la boue.", why: "Cochon is French. In English: pig.", whyFr: "« Cochon » est du français : en anglais, pig." },
                        { s: "There are four pig on the farm.", bad: "pig", good: "pigs", fr: "Il y a quatre cochons à la ferme.", why: "Four → plural: four pigs.", whyFr: "Four → pluriel : four pigs." }],
                    say: "The pig is rolling in the mud." },
                { k: "nouns:sheep", pic: { e: "🐑", ok: ["lamb"] },
                    gap: [["The *sheep* is eating grass.", "Le *mouton* mange de l'herbe."], ["We counted twenty *sheep* on the hill.", "Nous avons compté vingt *moutons* sur la colline."]],
                    ord: [["The sheep is eating grass.", "Le mouton mange de l'herbe."]],
                    fix: [{ s: "We counted twenty sheeps on the hill.", bad: "sheeps", good: "sheep", fr: "Nous avons compté vingt moutons sur la colline.", why: "One sheep, twenty sheep: no -s.", whyFr: "One sheep, twenty sheep : pas de -s." },
                        { s: "The mouton is eating grass.", bad: "mouton", good: "sheep", fr: "Le mouton mange de l'herbe.", why: "Mouton is French. In English: sheep.", whyFr: "« Mouton » est du français : en anglais, sheep." }],
                    say: "The sheep is eating grass." },
                { k: "nouns:lamb",
                    gap: [["The *lamb* is following its mother.", "L'*agneau* suit sa mère."], ["Baby sheep are called *lambs*.", "Les bébés moutons s'appellent des *agneaux*."]],
                    ord: [["The lamb is following its mother.", "L'agneau suit sa mère."], ["Baby sheep are called lambs.", "Les bébés moutons s'appellent des agneaux."]],
                    fix: [{ s: "The agneau is following its mother.", bad: "agneau", good: "lamb", fr: "L'agneau suit sa mère.", why: "Agneau is French. In English: lamb.", whyFr: "« Agneau » est du français : en anglais, lamb." },
                        { s: "Baby sheep are called lamb.", bad: "lamb", good: "lambs", fr: "Les bébés moutons s'appellent des agneaux.", why: "Baby sheep (more than one) → lambs.", whyFr: "Plusieurs bébés moutons → lambs (pluriel)." }],
                    say: "The lamb is following its mother." },
                { k: "nouns:goat", pic: true,
                    gap: [["The *goat* is climbing on the rocks.", "La *chèvre* grimpe sur les rochers."], ["We make cheese with milk from our *goats*.", "Nous faisons du fromage avec le lait de nos *chèvres*."]],
                    ord: [["My uncle has three goats.", "Mon oncle a trois chèvres."]],
                    fix: [{ s: "The chèvre is climbing on the rocks.", bad: "chèvre", good: "goat", fr: "La chèvre grimpe sur les rochers.", why: "Chèvre is French. In English: goat.", whyFr: "« Chèvre » est du français : en anglais, goat." },
                        { s: "My uncle has three goat.", bad: "goat", good: "goats", fr: "Mon oncle a trois chèvres.", why: "Three → plural: three goats.", whyFr: "Three → pluriel : three goats." }],
                    say: "The goat is climbing on the rocks." },
                { k: "nouns:hen", ok: { "hen": ["chicken"], "hens": ["chickens"] }, pic: true,
                    gap: [["The *hen* laid an egg this morning.", "La *poule* a pondu un œuf ce matin."], ["Grandpa has six *hens* in his garden.", "Papi a six *poules* dans son jardin."]],
                    ord: [["The hen laid an egg.", "La poule a pondu un œuf."]],
                    fix: [{ s: "The poule laid an egg this morning.", bad: "poule", good: "hen", fr: "La poule a pondu un œuf ce matin.", why: "Poule is French. In English: hen.", whyFr: "« Poule » est du français : en anglais, hen." },
                        { s: "Grandpa has six hen in his garden.", bad: "hen", good: "hens", fr: "Papi a six poules dans son jardin.", why: "Six → plural: six hens.", whyFr: "Six → pluriel : six hens." }],
                    say: "The hen laid an egg this morning." },
                { k: "nouns:duck", pic: true,
                    gap: [["A *duck* is swimming on the lake.", "Un *canard* nage sur le lac."], ["We gave bread to the *ducks*.", "Nous avons donné du pain aux *canards*."]],
                    ord: [["I can see two ducks.", "Je vois deux canards."]],
                    fix: [{ s: "A canard is swimming on the lake.", bad: "canard", good: "duck", fr: "Un canard nage sur le lac.", why: "Canard is French. In English: duck.", whyFr: "« Canard » est du français : en anglais, duck." },
                        { s: "I can see five duck on the lake.", bad: "duck", good: "ducks", fr: "Je vois cinq canards sur le lac.", why: "Five → plural: five ducks.", whyFr: "Five → pluriel : five ducks." }],
                    say: "A duck is swimming on the lake." }
            ]
        }
    ]
};
