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
  Le port reste certifié dans le compte du mois.
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

## Reste à faire
- Images Gemini : la carte définitive (plus réaliste, haut de l'image libre), le bateau qui s'améliore, les états d'un port,
  les tampons du passeport. Les positions des noms des îles sur la carte (`.vyisl.i0` à `.i4` dans `css/app.css`) seront
  à ajuster sur la nouvelle carte.
- Le passeport (tampons des îles et des mois réussis) et le bateau de Kai qui s'améliore.
- Un rappel de Kai sur la carte Kai du menu, et une ligne sur la carte This week.
