# Kai — retours du PO après la v1.0 (30/10, 18:30) et préparation du sprint Kai 2

Aucun sprint lancé : le PO prend les questions de l'équipe une par une dans le chat.

## Retours du PO
| # | Retour | Analyse / piste | Qui | Effort |
|---|---|---|---|---|
| R1 | Police des bulles de Kai un peu petite et fine sur téléphone | Taille et graisse des bulles et des phrases d'exercice : ≥ 18 px, graisse 500, interligne 1,4 ; vérifier sur 360–430 px de large | Ouss | 0,25 dj |
| R2 | iPhone plus petit (fils) : images mal cadrées | Cadrage des images de Kai et des scènes sur petits écrans (iPhone SE 375×667, iPhone mini 375×812) : `object-fit`/`viewBox`, zones de sécurité ; tests visuels de Dédé à ces tailles | Ouss + Dédé | 0,5 dj |
| R3 | Mots : quand on choisit un thème, on ne peut plus l'enlever | Bouton « tous les thèmes » / re-toucher la puce pour la désélectionner, état visible | Ouss | 0,1 dj |
| R4 | L'app sert aussi au fils en 1ère (vocabulaire) | Deuxième public B1–B2 : profils par élève (existants), niveaux Intermediate / Upper-intermediate, vocabulaire de lycée (thèmes du programme de 1re : identités et échanges, espace privé et public, art et pouvoir, citoyenneté et mondes virtuels, fictions et réalités, innovations scientifiques, diversité et inclusion), connecteurs de dissertation (existants) | Matt + scrum master (contenu), Ludo (données) | à chiffrer |
| R5 | D'autres formes de tests, « comme pour des certifications », pas de QCM ; ce qui est maîtrisé (ex. les couleurs) ne revient plus régulièrement | Voir proposition ci-dessous | Matt (conception), Ludo (moteur), Dédé (validation) | ≈ 3 dj (v1) |

## Proposition R5 — certificats de maîtrise (scrum master)
- **Un certificat par thème de vocabulaire et par point de grammaire** (Colours, Family, Present simple…), puis un certificat de niveau (A1, A2 ; B1, B2 pour le lycéen) quand tous les thèmes du niveau sont certifiés.
- **Épreuve sans choix multiple**, formats mélangés : traduction FR → EN tapée ; dictée (Kai dit, l'élève écrit) ; image → mot tapé ; phrase à compléter sans propositions ; remettre les mots dans l'ordre ; corriger l'erreur d'une phrase ; dire le mot ou la phrase au micro (option). Un seul essai par item, ordre aléatoire, pas d'indice ; faute de frappe tolérée, faute de grammaire non.
- **Réussite** : ≥ 90 % sur au moins 3 formats → badge « certifié » daté, page de certificats imprimable pour les parents.
- **Ce qui est certifié sort de la rotation** des mots du jour ; une **vérification d'entretien** rapide (2–3 questions) tous les 2–3 mois ; en cas d'échec, le thème revient en révision.
- **Lycéen (B1–B2)** : épreuves plus longues (phrases complètes, connecteurs, reformulation), vocabulaire du programme de 1re.
- Effort indicatif : moteur + 4 formats tapés + badges + sortie de rotation ≈ 3 dj ; micro + certificats de niveau ≈ 2 dj de plus.

## Questions ouvertes de l'équipe (à poser une par une)
1. (Matt) R4 — fils en 1ère : son propre profil, sur son propre téléphone ? niveau de départ (B1) ? quels thèmes en priorité ?
2. (Matt) R5 — certificats : priorité vocabulaire, grammaire, ou les deux ? micro dans les épreuves ?
3. (Matt, Q-03) Un seul seuil de réussite à 80 % pour toutes les leçons ?
4. (Matt, Q-04) Mise en page tablette / ordinateur dédiée ?
5. (Matt, Q-06) Les contrôles de la classe saisis par le parent ?
6. (Matt) Créer deux leçons 6e manquantes : l'heure et la date ; *like + -ing* ?
7. (Ludo) Garder *ghost*, *skeleton*, *church* pour un Beginner ? Auditer les phrases d'exemple (0,5 dj) ?
8. (Ani) Droits de diffusion publique des images de Kai et de la voix ElevenLabs ?
9. (Ani) Double authentification active sur le compte GitHub ?
10. (Ani) Délai croissant après erreurs de code parent ? Balise CSP ? Mode hors ligne utile ?

## Réponses du PO
- **30/10, 18:40 — Q1** : le fils en 1ère a **son propre profil sur son propre téléphone**, niveau de départ **B1**. Thèmes : pas de préférence exprimée → hypothèse : thèmes du programme de 1re.
- **30/10, 18:40 — contrainte** : **mode sans son** indispensable (usage dans le RER) : la dictée et le micro sont des formats optionnels ; sans son, l'épreuve les remplace par des formats écrits (le choix « son disponible ? » se fait au début de l'épreuve et est mémorisé).
- **30/10, 18:40 — renouvellement** : les certifications doivent être **refaites régulièrement** → un certificat a une durée de validité ; à l'échéance, épreuve de renouvellement courte ; en cas d'échec, le thème revient en révision.
- **30/10, 18:43 — Q2** : validité **3 mois (6e) / 6 mois (B1–B2)** ✅ ; renouvellement en **8 questions**, réussite 80 %, rappel par Kai une semaine avant. Les 8 questions doivent **éviter les mots trop simples** : tirage pondéré vers les mots les moins fréquents et ceux déjà ratés.
- **30/10, 18:44 — Q3** : certificats **vocabulaire d'abord** (sprint Kai 2), **grammaire au sprint suivant** (même moteur) ✅
- **30/10, 18:45 — nouvelle demande (R6)** : **valoriser la réécriture des réponses en fin de série** (rattrapage) : même après un échec, retrouver et écrire le bon mot doit être récompensé. Proposition : « étoile de rattrapage » (demi-point regagné, affiché à part du score initial), message de Kai, compteur « mots rattrapés » dans les récompenses, mot rattrapé revu plus tôt (répétition espacée raccourcie) mais compté comme progrès. Rattrapage d'une épreuve de certificat : ne change pas le résultat de l'épreuve, mais compte pour la révision. Matt + Ouss, ≈ 0,5 dj.
- **30/10, 18:46** : R6 (rattrapage valorisé) ✅ tel que proposé ; **Q4 : seuil unique 80 - **30/10, 18:46** : R6 (rattrapage valorisé) ✅ tel que proposé ; **Q4 : seuil unique 80 pour cent** pour toutes les leçons ✅ (leçons déjà réussies conservées).
- **30/10, 18:47 — Q5** : pas de mise en page tablette / ordinateur pour l'instant ✅ (priorité aux certificats).
- **30/10, 18:47 — Q6** : écran parent pour saisir les contrôles de la classe ✅ (≈ 2 dj, après les certificats).
- **30/10, 18:48 — Q7** : ajouter au sprint Kai 2 les leçons 6e « l'heure et la date » et « like + -ing » ✅ (Matt écrit, scrum master relit).
- **30/10, 18:51 — Q8** : on garde ghost, skeleton, church pour un Beginner ✅ ; relecture de toutes les phrases d'exemple (adaptées à un enfant) ✅ (Ludo, ≈ 0,5 dj).
- **30/10, 18:51 — Q9** : Kai dessiné d'après un croquis du PO, autres images générées avec Gemini, voix générée avec ElevenLabs. → Ani : page « Crédits » dans l'aide (images : croquis original + Gemini ; voix : ElevenLabs), usage gratuit non commercial ; vérifier les conditions de l'offre ElevenLabs utilisée (attribution exigée sur l'offre gratuite) (≈ 0,1 dj).
- **30/10, 18:53 — Q10** : délai croissant après 3 mauvais codes parent ✅ ; CSP ✅ ; mode hors ligne ✅ (Ani).

## Backlog du sprint Kai 2 (validé par le PO le 30/10, en attente de son « top »)
| Lot | Contenu | Qui | Effort |
|---|---|---|---|
| Lisibilité | R1 police des bulles ; R2 cadrage petits iPhone ; R3 désélection d'un thème | Ouss, Dédé | ≈ 0,85 dj |
| Certificats v1 (vocabulaire) | Épreuves sans QCM (traduction tapée, image → mot, phrase à compléter, ordre des mots, correction d'erreur ; dictée et micro seulement si « son disponible »), réussite 90 % sur ≥ 3 formats, badge daté, page imprimable, sortie de la rotation, validité 3 mois (6e) / 6 mois (B1–B2), renouvellement 8 questions à 80 % (mots rares et déjà ratés), rappel une semaine avant | Matt (conception), Ludo (moteur), Ouss (écrans), Dédé (tests) | ≈ 3 dj |
| Rattrapage valorisé (R6) | Étoile de rattrapage, message de Kai, compteur et médailles, révision rapprochée | Ouss | ≈ 0,5 dj |
| Seuil 80 % | Seuil unique, leçons déjà réussies conservées | Ludo | ≈ 0,25 dj |
| Contenu | Leçons 6e « l'heure et la date » et « like + -ing » ; relecture des exemples ; vocabulaire B1 (thèmes de 1re) pour le fils aîné | Matt + scrum master, Ludo | ≈ 2 dj |
| Sécurité et confort | Crédits ; délai après mauvais codes ; CSP ; mode hors ligne | Ani | ≈ 2,1 dj |
| Après les certificats | Écran parent des contrôles (≈ 2 dj) ; certificats de grammaire (sprint suivant) | — | — |
Rappel : double authentification à activer sur le compte GitHub du PO.
- **31/10, 10:06** : double authentification activée sur le compte GitHub du PO ✅

## Tour de table Ludo / Ouss / Dédé / Ani (31/10)
- **T1 (Ludo)** : certificats rangés avec la progression de chaque élève et inclus dans « Save & move » ✅ ; modification manuelle possible acceptée (outil familial) ✅.
- **T2 (Ludo)** : vocabulaire B1 maison (pas de recopie des listes protégées), **300 mots** sur les 8 thèmes de 1re, format existant, exemples adaptés à un lycéen, relus par le scrum master ✅ (≈ 1,5 dj).
