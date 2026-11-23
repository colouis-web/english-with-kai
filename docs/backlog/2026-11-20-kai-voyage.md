# Kai's voyage — apprentissage continu du vocabulaire (PO, 20/11)

## Ce qui est livré (branche `po/voyage-kai`)
- 9e app du menu, « Kai's voyage » (image `img/kai-voyage.webp`, générée par le PO avec Gemini).
- Une île par famille de mots : Thing Island (noms), Action Volcano (verbes), Colour Cove (adjectifs), Swift Reef (adverbes),
  et une île secrète dans le brouillard (affichée, pas encore jouable).
- Chaque île est une suite de **ports de 7 mots** (10 au départ ; 7 depuis le 21/11 pour que la série ne soit pas trop longue — un port déjà commencé garde ses 10 mots), du plus courant au plus rare :
  1. niveau minimum du mot (`lvOkWord`, du niveau 0 au niveau 3) ;
  2. ordre de fréquence de `js/data/frequence-voyage.js` (verbes : l'ordre de la liste `USAGE`) ;
  3. classe de fréquence `f`, puis l'ordre des dictionnaires.
  Les thèmes sensibles sont exclus (`sensOk` au niveau 1). Un port est **figé** dès sa première série : un mot ajouté plus tard
  au dictionnaire ne décale jamais un port commencé.
- **Série** : 10 phrases d'exemple à trou, on tape le mot. Kai dit le mot français de la phrase ; pour un verbe conjugué ou un
  pluriel, l'indice donne la forme de base. Une faute de frappe compte comme une faute.
- **Certification** : 2 séries sans faute, faites **2 jours différents**.
- **Tempête** : 21 jours après la certification (ou la dernière tempête), une série sans faute garde le phare allumé.
  Le port reste compté comme certifié.
- **Pas d'objectif mensuel** (PO, 20/11 : « on fait le plan et les élèves avancent ») : sur une île, le port suivant s'ouvre
  dès que le précédent est commencé ; le bouton « Next » propose le port de l'île la moins avancée (pondérée : 4 noms pour
  3 verbes, 2 adjectifs, 1 adverbe). La carte « My voyage » montre les ports certifiés et les mots appris, île par île.
- **Données** : dans le profil (`p.voy`, champ ajouté à `PFIELDS`), donc dans les sauvegardes ; rien ne quitte l'appareil.

## Choix faits par le scrum master (à valider par le PO)
- Les 2 séries sans faute doivent être faites 2 jours différents, pour éviter la mémoire immédiate.
- Une faute de frappe d'une lettre (« ALMOST! ») ne compte pas comme une réussite.
- Les tempêtes sont gardées, mais sans faire perdre le port.
- Le port suivant d'une île s'ouvre dès que le précédent est commencé (pas besoin d'attendre sa certification).
- L'ordre de fréquence des noms, adjectifs et adverbes est une première version : il faudra le faire relire comme un contenu
  pédagogique (charte : relecture par Opus).

## Noms des ports (PO, 21/11)
- `js/data/noms-ports.js` : des noms amusants dans le thème de chaque île (Square One, Pirates' Harbour, Seagull Pier…
  ; Lava Landing, Dragon's Breath… ; Rainbow Pier, Bubblegum Beach… ; Flying Fish Port, Dolphin Dash…), puis des noms
  composés (« Sleepy Pelican Wharf »), uniques sur chaque île, toujours les mêmes pour un même port.

## Images (Gemini, PO 20-21/11)
- Tuile du menu, carte de l'archipel (v2, plus réaliste), 4 bateaux (radeau 0, barque 5, voilier 15, trois-mâts 30 ports
  certifiés), 3 scènes de port (brouillard : pas encore certifié ; soleil : certifié ; tempête), Kai qui plante son drapeau
  (écran de certification), 5 tampons du passeport (un par île au 1er port certifié de l'île, « Great voyage » quand les
  4 îles sont tamponnées). Sources dans le dossier de travail de la session ; recadrées et converties en webp dans `img/`.

- 12 vignettes de ports du monde (Bretagne, Tahiti, Italie, Grèce, côte est des États-Unis, repaire de pirates, Saint-Malo,
  Angleterre, fjords, Asie, Moyen-Orient, marina) : chaque port a son lieu, caché dans le brouillard, à moitié dévoilé après
  la 1re série sans faute, dévoilé quand il est certifié (vignette aussi dans la liste des ports). Une raison de plus de faire
  la 2e série.
- Kai et deux amis devant un port breton : carte « Special missions · coming soon » sous la carte des îles.

## Reste à faire
- Le système de récompense pour pousser au 2e run (coffres, pièces, marée) : proposé au PO le 20/11, en attente de sa réponse.
- Les missions spéciales débloquées par les récompenses (à définir par le PO) ; l'île secrète.
- Un rappel de Kai sur la carte Kai du menu, et une ligne sur la carte This week.

## 21/11 — retours du PO
- Bouton **Check** centré dans la série (comme le Check de la dictée).
- Liste des mots d'un port : sous chaque **nom**, son pluriel (« irregular » s'il est irrégulier, « uncountable », « always plural ») ;
  sous chaque **verbe irrégulier**, son prétérit et son participe passé (went · gone). Rien sous les verbes réguliers.
- **7 mots par port** : un reste de moins de 4 mots rejoint le dernier port. Les ports déjà commencés restent figés (10 mots).

## 21/11 — pièces d'or et cadeau (PO : « un système de pièces d'or, je pourrai transformer les points en cadeau au bout de x pièces »)
- **Gagner** : 1re série sans faute **1 pièce** ; 2e série (certification) **3 pièces** le lendemain, 2 dans les 3 jours, 1 ensuite
  (pour pousser à revenir vite) ; tempête battue **2 pièces** ; s'entraîner sur un port certifié ne rapporte rien.
- **Déjà joué** : à la première ouverture, les ports déjà réussis rapportent leurs pièces (1 par 1re série, +3 par port certifié).
- **Le cadeau** : carte « My treasure » sous la carte des îles. Un parent choisit le cadeau et son prix (1 à 1000 pièces) ;
  quand il y a assez de pièces, Kai l'annonce et « Get my gift » échange les pièces (le parent confirme). Historique gardé.
- **Code parent** : sans code parent, la confirmation demande le prénom de l'élève (comme pour changer de niveau) ;
  un code parent (page Me) est conseillé pour que l'élève ne s'offre pas son cadeau tout seul.
- Montants faciles à changer : `VY_COIN` et `vyCoinsCert` dans `js/app-voyage.js`.
- Port 1 des noms : **Square One** (au lieu de Ground Zero, qui désigne aussi le lieu d'une catastrophe).

## 21/11 — le micro dans la série (PO : « la reconnaissance vocale pour éviter de taper les réponses »)
- **Au choix, partout** (choix du PO) : à chaque phrase à trou, un bouton micro à côté de la case ; l'enfant peut aussi taper.
  Le mot entendu s'écrit dans la case et l'enfant touche Check : rien n'est validé tout seul, une erreur d'écoute se corrige.
- Le navigateur propose jusqu'à 5 écritures de ce qu'il entend : Kai garde celle qui correspond au mot attendu (their / there,
  « 7 » → seven, « 3rd » → third) et l'écrit avec la bonne orthographe, pour que l'enfant la voie.
- Sur téléphone, avec le micro, le clavier ne s'ouvre plus tout seul.
- **Enfant d'abord** (revue d'Ani I-1, jamais faite jusqu'ici) : avant le premier usage du micro sur l'appareil, un message
  dit à l'enfant que sa voix part chez Google, Apple ou Microsoft et de prévenir ses parents (choix du PO : un simple
  message, sans code parent). Il vaut aussi pour « Let's talk English ». Clé `kai.micinfo`. README corrigé.
- Code commun : `js/app-micro.js` (Let's talk et le voyage).
- **Constat** : l'orthographe n'est plus travaillée quand l'enfant dit le mot. À suivre : si les ports se certifient surtout au
  micro, garder la 2e série tapée.
- **Non fait** : la reconnaissance sur l'appareil (Chrome, `processLocally`), qui garderait la voix ici. Son test de
  disponibilité fait planter l'onglet du Chromium des tests : à reprendre quand l'API sera stable.

## 22/11 — plus d'indice (PO : « faut enlever les hint, ça rend les questions un peu trop simples »)
- La ligne « Hint: dog » (mot de base quand la réponse est un pluriel ou un verbe conjugué) est supprimée : l'enfant trouve
  la forme d'après la phrase française. Restent la phrase française (mot surligné) et Kai qui dit le mot français.
- À voir avec le PO : les autres indices de l'app (Daily « Choose from », mot de base entre parenthèses dans Tests) n'ont pas changé.

## 22/11 — 46 nouveaux lieux (planches Gemini du PO)
- 58 lieux au lieu de 12 : Océanie, Asie, Baltique, Afrique, Amérique du Sud, pirates des Caraïbes, Europe de l'Est,
  Russie (images `img/voyage-lieu-13.webp` à `-58.webp`, 400 × 280, découpées dans les planches ; dessins en 10/7).
- Légendes vérifiées, en anglais : « The port of Dakar, Senegal ». Écartés : Melbourne (faux mots dans le dessin), un
  Klaipėda en double, la série One Piece (lieux protégés, pas sur un site public). Suva : faux mot effacé du ciel.
  Hong Kong montre la tour de Kobe : légende générale « A busy harbour in East Asia ». Pirates : seules La Tortue et
  Port Royal sont nommées (les autres « repaires » de la planche n'ont pas de source).
- **Rien ne bouge pour l'enfant** : chaque port retient son lieu (`h.l`) dès sa 1re série ; les ports commencés avant
  (sans `h.l`) gardent l'ancienne règle. Les 12 premiers ports de chaque île sont inchangés ; ensuite, les nouveaux lieux.
- À venir : une planche de 6 phares avec Kai (tempêtes et certifications) ; les lieux de l'île secrète (de l'invention du PO).

## 23/11 — 12 lieux de plus (70 en tout)
- New York, San Francisco, Vancouver, Québec, Halifax, Reykjavik ; Marseille, Lisbonne, Barcelone, Amsterdam, Hambourg,
  Dublin (`img/voyage-lieu-59.webp` à `-70.webp`). Boussole et blason du cadre retirés des vignettes du haut.
- Ports déjà commencés : inchangés (`h.l`).
- **Phares** (planche du 23/11) : pas intégrés, le garçon dessiné n'est pas Kai (cheveux châtains, veste verte). À refaire
  avec la description de Kai.

## 23/11 — mission spéciale « Around the world » (PO : « la géographie est un excellent thème, 1 quiz de 5 questions sur où se trouve un monument célèbre »)
- Choix du PO : des monuments vérifiés, illustrés par nos dessins de ports quand on y voit le monument ; une mission par
  jour, après le port du jour ; 5/5 = 2 pièces d'or, 4/5 = 1 pièce.
- 5 questions en anglais (« Where is the Eiffel Tower? »), 3 avec un dessin ; 4 réponses « ville, pays » de pays
  différents ; Kai lit la question puis la réponse (« The Eiffel Tower is in Paris, in France. »).
- Banque : `js/data/monuments.js`, 43 monuments (17 avec un dessin). Quand le nom donne la réponse (« the Sydney Opera
  House »), la question décrit le dessin (« this famous opera house »). On évite les 20 derniers monuments vus.
- Code : `js/app-voyage-missions.js`. Données : `p.voy.mis`, `p.voy.day` (série finie aujourd'hui, même ratée).
- À voir avec le PO : d'autres missions (drapeaux, capitales, animaux du monde…) ; l'île secrète.

## 23/11 soir — 2e série sans attendre (PO : « pour le run 2, il faut qu'on puisse jouer sans attendre le lendemain »)
- La 2e série se joue tout de suite après la 1re ; 2 séries sans faute certifient le port, même le jour même.
- Pièces de la certification : 1 le jour même, 3 le lendemain, 2 dans les 3 jours, 1 ensuite. Revenir le lendemain
  reste la meilleure affaire, et c'est aussi ce qui fixe le mieux les mots (répétition espacée). À ajuster si le PO veut.
- Fin de la 1re série : bouton « Start run 2 ». Page du port : « +1 gold coin now · +3 gold coins tomorrow ».
- Kai conseille d'abord un port pas encore joué aujourd'hui, puis une tempête, puis la 2e série d'un port du jour.

## 23/11 soir — phares et drapeau (planches du PO)
- Tempête : la page du port montre Kai devant un des 6 phares (Kermorvan, Île Vierge, Fastnet Rock, Cape Point,
  Cape Hatteras, Cape Byron), nommé dans la légende (`img/voyage-phare-1.webp` à `-6`).
- Certification : l'ancienne image de Kai et son drapeau (jugée peu jolie par le PO) est remplacée par 6 images de Kai
  et son drapeau devant un phare (`img/voyage-drapeau-1.webp` à `-6`), image entière.
- Choix d'après le numéro du port (1 à 6, puis on recommence). Les anciennes images restent dans img/ (non utilisées).
