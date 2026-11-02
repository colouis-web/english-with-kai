# Maquettes « My daily work » : 3 options (Matt, 02/11/2026)

Demande du PO (31/10, 11:14) : l'écran est trop chargé (≈ 2 900 px de haut sur téléphone, analyse UX I-04) ;
le réorganiser par **Jour / Semaine / My level / Rewards** et y placer la tuile **Certificates** (T4).
**Le PO choisit une option avant tout code** (sprint B, Ouss ; sinon sprint Kai 3).

## Comment les ouvrir
Ouvrir `option-a.html`, `option-b.html` ou `option-c.html` dans un navigateur (double-clic, ou `python3 -m http.server`
à la racine du dépôt puis `/docs/ux/maquettes-daily/option-a.html`). Fichiers autonomes : CSS et JS dans la page, aucune
ressource externe, pas d'images de Kai (un rond avec un émoji). Sur ordinateur : un cadre de téléphone 390×844 avec
une ligne rouge au bas de l'écran, et les notes à gauche ; sur téléphone : l'écran seul, avec une barre jaune en haut.

Dans chaque maquette :
- **Option** : passer d'une option à l'autre ; **Simulate** : « Morning · 0/10 » (Léo n'a rien fait) ou « Goal
  reached » (tour fini : trophée, série à 5, mots du jour) ; **Reset**.
- Tout est cliquable : humeur, Start (simule un tour), onglets / tuiles / replis, retour → menu (nouvelle tuile
  **Certificates**), écran Certificates. Ce qui n'existe pas dans la maquette affiche « not in the mock-up ».
- Données de **Léo** (Beginner A1, 10 mots par jour, série de 4 jours, 12 mots à revoir, contrôle « Unit 1 » aujourd'hui,
  certificats *Colours* (fin dans 6 jours → rappel) et *Family 1*, *Animals 1* prêt). Textes de l'interface en anglais,
  charte de `css/app.css` (`--ink`, `--acc #0b7f89`, `--mut #5f6478`, bordures noires de 3 px, ombres « bouton »),
  police système.

## Ce qui ne change pas, quelle que soit l'option
- Même contenu qu'aujourd'hui, **rien n'est supprimé** : objectif, humeur, mémoire, leçons de la semaine, niveau,
  récompenses, histogramme, tests, mots du jour, calendrier.
- En haut, toujours : la date, **l'objectif du jour et Start** (visible sans défiler à 390×844 dans les 3 options),
  puis les bandeaux du jour (contrôle de la classe ; **renouvellement de certificat à J-7**, le rappel de Kai demandé
  par le PO), puis l'humeur et Kai.
- Une tuile **Certificates** dans le menu principal, juste sous My daily work (T4), avec une pastille rouge quand un
  certificat est à renouveler. La page Certificates est **la même** depuis le menu et depuis My daily work.
- Les onglets actuels *Today / Calendar* disparaissent : le calendrier est rangé avec la semaine.

## Comparaison

| | **A · Onglets** | **B · Today + tuiles** | **C · Tableau de bord** |
|---|---|---|---|
| Ce qui change | 4 onglets fixés en haut : *Today · Week · My level · Rewards*. « Today » = objectif + Start, bandeaux, humeur, et un repli « More practice » (mémoire, dictée). | « Today » épuré (objectif, bandeaux, humeur, mots à revoir) puis **4 tuiles** vers des pages : *My week*, *My level*, *Rewards*, *Certificates*. | Un seul écran : carte objectif, **bande des 7 jours** + série, puis 5 sections **repliables** (mémoire, semaine, niveau, récompenses, certificats), ouvertes / fermées **mémorisées**. |
| Hauteur de l'écran d'arrivée (mesurée, 390 px) | **≈ 830 px** (1 écran) | ≈ 1 040 px | ≈ 1 170 px replié ; ≈ 1 950 avec 3 sections ouvertes |
| Certificates | badges dans l'onglet *Rewards* (pastille orange sur l'onglet à J-7) + bandeau Renew dans Today | 4e tuile, orange avec « Renew » à J-7 + bandeau Renew | section repliable avec pastille orange + bandeau Renew |
| Avantages | Le plus court ; modèle connu (onglets) ; chaque onglet tient en 1 à 1,5 écran ; prolonge les onglets actuels *Today / Calendar*. | Le plus « enfant » : grosses tuiles, une idée par page ; résumé utile sur chaque tuile (« 187 stars · Champion ») ; une page par sujet = facile à faire évoluer (grammaire, contrôles parent). | Tout reste sur un écran, rien n'est caché derrière une navigation ; la bande des 7 jours rend la série visible (motivation, façon Duolingo) ; chaque élève organise son écran. |
| Risques | 4 onglets à 390 px : libellés en 13 px, « MY LEVEL » juste (à vérifier sur iPhone SE 375 px avec « grande » taille de texte, T3) ; ce qui est dans un autre onglet est moins vu (récompenses). | Un clic de plus pour voir étoiles / niveau ; 4 pages à créer (navigation retour à gérer) ; risque de « tuiles partout » (le menu en a déjà 6). | Si l'élève ouvre tout, on retrouve les 2 900 px ; la mémorisation des replis est un état de plus à sauver par élève ; les résumés des sections doivent être bien écrits pour donner envie d'ouvrir. |
| Effort de code (demi-journées d'agent) | **≈ 1 dj** : barre d'onglets (`DTAB` existe déjà), répartition des blocs existants, repli, mémorisation de l'onglet ; + 0,25 dj tests de Dédé | ≈ 1,5 dj : 4 sous-pages (`show()`, retours), tuiles et leurs résumés ; + 0,25 dj tests | ≈ 1,25 dj : bande des 7 jours, `<details>` par section, mémorisation par élève, pastilles ; + 0,25 dj tests |
| Tuile Certificates du menu + page Certificates | +0,5 dj (sprint B, déjà prévu pour Ouss) dans les trois options | | |

Les blocs eux-mêmes (`goalCard`, `memCard`, `weekTiles`, `levelCard`, `rewards`, `weekChart`, `testProgress`,
`wordLists`, `calendar` dans `js/app-daily.js` et `js/app-v54-v62.js`) sont **réutilisés tels quels** dans les trois
options : seul `renderDaily` change de mise en page. Aucune donnée de progression n'est touchée (seul un réglage
d'affichage s'ajoute : onglet choisi en A, replis ouverts en C, par élève).

## Ma recommandation : **option A (onglets)**, avec deux emprunts à C

1. **A** répond le plus directement à la demande (« Jour / Semaine / My level / Rewards »), donne l'écran
   d'arrivée le plus court (≈ 830 px, **3,5 fois moins** qu'aujourd'hui, un seul écran de téléphone), et c'est le
   moins cher à coder parce que l'écran a déjà des onglets (`DTAB`). Un enfant de 11 ans connaît les onglets (YouTube,
   Pronote).
2. Emprunter à **C** la **bande des 7 jours avec la série** (sous la carte objectif de *Today* : ≈ 70 px, la série
   est le moteur de la régularité) ; c'est facultatif et chiffré +0,25 dj.
3. Garder **le bandeau Renew** dans *Today* (le rappel de Kai à J-7 ne doit pas être caché dans un onglet) et les badges
   dans *Rewards*.

**B** est une bonne seconde option si le PO préfère de grosses tuiles ; **C** a le risque de revenir à un écran long.
Proposition : faire essayer A et C à Léo (et au grand frère) 2 minutes chacun sur leur téléphone avant de décider.

## Questions au PO
1. Quelle option (A, B ou C) ? Hypothèse : **A**, avec la bande des 7 jours de C.
2. Onglet mémorisé (A) : rouvrir sur l'onglet laissé la dernière fois, ou **toujours sur Today** ? Hypothèse :
   **toujours Today** le matin (premier lancement du jour), l'onglet laissé ensuite. La maquette mémorise toujours.
3. La tuile Certificates du menu **sous My daily work** (2e place) ? Hypothèse : **oui** (le menu passe à 7 tuiles ; le
   regroupement du menu à 4 entrées, S-19, reste un sujet du sprint Kai 3).
