# Kai's voyage — apprentissage continu du vocabulaire (PO, 20/11)

## Ce qui est livré (branche `po/voyage-kai`)
- 9e app du menu, « Kai's voyage » (image `img/kai-voyage.webp`, générée par le PO avec Gemini).
- Une île par famille de mots : Thing Island (noms), Action Volcano (verbes), Colour Cove (adjectifs), Swift Reef (adverbes),
  et une île secrète dans le brouillard (affichée, pas encore jouable).
- Chaque île est une suite de **ports de 10 mots**, du plus courant au plus rare :
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
- `js/data/noms-ports.js` : des noms amusants dans le thème de chaque île (Ground Zero, Pirates' Harbour, Seagull Pier…
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
