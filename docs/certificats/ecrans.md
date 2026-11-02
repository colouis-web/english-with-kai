# Certificats : les écrans (Ouss, sprint Kai 2 B, 02/11/2026)

Code : `js/app-certificats-ui.js` (script classique, après `js/app-certificats.js`), blocs « certificats » de `index.html`
(tuile, pages `#certs`, `#cexam`, `#cparents`, balise `<script src="js/data/certificats.js">`) et de `css/app.css`
(fin du fichier, « Sprint Kai 2 B — certificats »). Rien dans `js/app-certificats.js`, `js/app-daily.js`, `js/data/certificats.js`.
Les écrans ne contiennent **aucune règle de réussite** : ils appellent le moteur (`Cert.record`, `Cert.pickRenewal`, `Cert.list`,
`Cert.dueSoon`, `Cert.get`).

## Ce qui est livré
| Écran | Contenu |
|---|---|
| **Tuile du menu** | 2e place, sous My daily work. Médaille (`rw-medal.webp`). Résumé « 2 certificates · 1 to renew · Animals 1 is ready ». Pastille rouge avec le nombre de certificats à renouveler (J-7, échus compris). |
| **Page Certificates** | Rappel de Kai à J-7 (bulle + bouton « Renew … »), reprise d'une épreuve interrompue (« Continue your certificate »), badges datés (« Valid until 2 Feb 2027 », « Ends in 6 days » en orange, « Expired · renew it » en rouge, « Not valid · take it again » en pointillé), note de score, « Take a certificate » (thèmes de la banque, « 11/18 words known », pastille **Ready** à 80 % de mots connus, 6 thèmes puis « Show all »), note « No multiple choice… 18/20 to pass », bouton « Page for my parents ». Même page depuis My daily work : `openCertificates("daily")` (le retour ramène à My daily work). |
| **Avant l'épreuve** | Titre, règles en pastilles (20 questions · one try each · no hints · 18 to pass · ≈ 7 min), question **« Can you use sound right now? »** (🔊 / 🔇), réponse mémorisée par élève (`kai.certsound.<id>`) et présélectionnée, **Start**. |
| **Question** | En-tête (Quit, format, « 7 / 20 », barre), bulle de Kai à 18 px (consigne anglaise, traduction française en petit pour un Beginner/Elementary), un petit encouragement tous les 5 items. Formats `type-fr-en`, `picture` (émoji validé, ou **arbre généalogique** de Family 1), `gap`, `order` (étiquettes ≥ 48 px), `fix` (2 étapes : toucher le mot faux, taper la correction), `dictation` (seulement si son = oui : le mot, la phrase, le mot ; « Listen again » et « Slow », 2 réécoutes). Saisie sans correcteur automatique (`autocorrect=off`…). Verdict seulement « Correct! » / « Not this time » (+ « Watch the spelling: … » si faute de frappe tolérée). **Jamais la bonne réponse, pas d'indice, pas de micro, pas de bouton retour.** |
| **Reprise** | L'épreuve est sauvegardée **avant** d'afficher le verdict (un rechargement après une mauvaise réponse ne redonne pas la question : un seul essai). « Quit » sauve et revient. Pas de « recommencer » : on ne peut pas ouvrir une autre épreuve tant qu'une est commencée. Abandonnée sans échec après 7 jours. Clé : `kai.csave.<id>` (hors du fichier des certificats). |
| **Résultat** | Score, détail par format. Réussite : « Congrats! You are certified! », badge daté (obtenu le…, valable jusqu'au…), **+10 étoiles** (+5 au renouvellement), confettis existants. Échec : « So close! 16/20. You need 18. », « **Try again tomorrow** », « Your … certificate is still valid. Nothing is lost! » si le certificat valait encore. Renouvellement raté : « in review », ses mots reviennent. |
| **Rattrapage** (« Fix your mistakes ») | Pour chaque question ratée : la bonne réponse (lue si son = oui) + l'explication de la banque (`why`, `whyFr` en 6e) → « Got it » → l'élève la **réécrit** ; faux = on la remontre. Ne change pas la note. Se rouvre depuis la page Certificates tant qu'il reste des mots à corriger. |
| **Page des parents** | « For my parents » : fiche A4 en français (élève, niveau, date, tableau certificat / réussi le / note / valable jusqu'au / état, explication des règles), bouton **Print** = `window.print()` (rien n'est envoyé). `@media print` : une page A4 (vérifié par `page.pdf`), sans boutons, sans zoom « Text size », noir sur blanc. Sur téléphone, le tableau passe en cartes. |
| **Badges pour Ludo** | `window.certBadgesHtml(pid?)` rend les badges datés (même HTML que la page) ; à placer dans l'onglet Rewards. |

## Ce que j'ai dû remplacer par un adaptateur (à retirer quand le moteur le fournit)
`js/app-certificats.js` de Ludo n'avait pas encore poussé (`origin/kai/ludo` = base). L'écran appelle d'abord l'API du §10 de la conception
et **retombe sur un adaptateur** seulement si la fonction n'existe pas. Rien à changer côté écran quand Ludo pousse.
1. **`Cert.pickExam(pid, thème, { sound })`** : sinon, tirage local fondé sur **`CERTBANK`** (quotas du §5.2, chaque mot interrogé, ≤ 2 fois, jamais 2× le même format, « afficher après produire »). Les questions renvoyées par le moteur peuvent être `{ key, fmt }` seulement : l'écran les complète avec la banque (phrases, image, `fix`, `say`, réponses en plus) ; il accepte aussi des champs déjà remplis (`s`, `sfr`, `bad`, `good`, `img`, `also`, `alt`, `why`).
2. **`Cert.check(question, tapé)`** → `{ ok, typo, grammar, note }` : sinon règles du §3 écrites dans l'écran (article ignoré, nombre exigé, `alt` avec note « In British English », frappe tolérée pour un mot attendu de ≥ 5 lettres qui n'est pas un autre mot anglais). Les 18 cas de la table de Matt passent (`tests` locaux, voir bas).
3. **`Cert.canRetry(pid, thème)`** : sinon « épreuve complète ratée aujourd'hui → demain » lu dans `history`.
4. **Choix du son** et **épreuve en cours** : stockés par l'écran (`kai.certsound.<id>`, `kai.csave.<id>`) ; `Cert.drop` est enveloppé pour les effacer avec l'élève. Si Ludo préfère les mettre dans le moteur, il suffit de remplacer `soundGet/soundSet/runSave/runLoad`.
5. **Rattrapage → mémoire des mots** : l'écran appelle `Cert.catchUp(pid, thème, [{ key, ok: true }])` (ou `Cert.fixed(pid, thème, [clés])`) **s'il existe** ; sinon rien n'est écrit (le mot n'est pas encore « raté puis corrigé » dans `kai.daily.v1.<id>`).
6. **Étoiles** : l'écran affiche « +10 stars » (ou « +5 »), ou `rec.stars` si `Cert.record` le renvoie. **Il n'ajoute rien lui-même au total d'étoiles** (`starsOf` est dans `app-daily.js`, à Ludo).

## Constats pour l'équipe
- **`tkLev` (js/app-talk.js) ne compte pas l'inversion de deux lettres comme une seule faute** (sa « transposition » lit la ligne i-1 au lieu de i-2) : `tkLev("purpel","purple",2)` = 2. Le §3 de la conception (« deux lettres inversées, comme `tkLev` ») suppose le contraire. Mon adaptateur calcule une vraie distance de Damerau ; **Ludo : `Cert.check` doit faire pareil** (ou corriger `tkLev`, mais « Type it » changerait aussi de comportement : à décider).
- **Balise `<script src="js/data/certificats.js">`** : je l'ai ajoutée dans `index.html` juste avant `app-certificats.js` (sans elle, la banque n'est pas chargée). Si Ludo ou le scrum master l'ajoute aussi, il y aura un doublon de `const CERTBANK` (erreur de syntaxe) : n'en garder qu'une.
- **Classe `.soon` existante** (« More lessons coming soon », cadre pointillé) : mes états de badge s'appellent `due / gone / off` pour ne pas hériter de ce style.
- La **banque de Matt** est lue telle quelle : titres (« Family 1 · My family »), `suggest` (niveaux), mots du périmètre (11 / 18 / 20 mots), `fix`, `say`, `pic` (émoji validé ou case de l'arbre), `ok` / `us`. Avec le moteur actuel (qui ne connaît que les thèmes entiers), `Cert.record` reçoit l'id de la banque (`nouns:family-1`) : accepté par le moteur (`^[a-z]+:[a-z0-9_-]{1,40}$`). La **sortie de rotation** portera donc sur ce thème-id : **Ludo doit la faire porter sur les mots du périmètre** (§10 point 1), sinon un certificat « Family 1 » sortirait des mots du jour les 43 mots de `nouns:family` ou aucun.
- Le renouvellement demande au moteur `n: 40` et ne garde que les 8 premiers mots du périmètre de la banque tant que `Cert.pickRenewal` tire dans le thème entier ; ce détour disparaît quand Ludo limite le tirage au périmètre.

## Vérifications faites (Chromium, 390×844 et 375×667, `python3 -m http.server`)
- Épreuve **réussie** (19/20 → badge daté au 02/11/2026, valable jusqu'au 02/02/2027), **ratée** (16/20 → « Try again tomorrow », bouton du thème grisé « Tomorrow »), **rattrapage** complet, **renouvellement** (7/8, échéance prolongée à partir de l'échéance : 08/11 → 08/02), **reprise** après rechargement, épreuve avec et sans son (dictée : 3 questions, aucune sans son ; en mode silencieux aucun son joué), 5 parcours parfaits sur Colours, Family 1, Animals 1 avec la vraie banque (20/20).
- **0 erreur console** ; pas de défilement horizontal à 375 px, en Normal, Large et Extra large ; cibles ≥ 44 px ; contrastes calculés ≥ 4,5:1 sur les couleurs ajoutées.
- Impression : `page.pdf` en A4 → **1 page**.

## Écarts visuels voulus (tests de référence)
Le menu a une 3e entrée (la tuile Certificates, 2e place) : les photos de référence du menu changent (visuel et persistance du menu). À rafraîchir par Dédé.

## Questions au PO
1. **Étoiles** : « +10 / +5 » s'affichent bien, mais ce sont des étoiles de la boucle du jour (`starsOf`) : où les compter (total, rang) ? Décision de Ludo, à confirmer avec toi.
2. **Image de la tuile** : une médaille dorée existante (`rw-medal`) plutôt qu'une image de Kai (les autres tuiles ont Kai). Souhaites-tu une image de Kai « certifié » ?
3. **Page des parents** : libre d'accès (comme le reste de l'app) ou derrière le **code parent** ? Elle ne contient que le prénom, les notes et les dates.
4. **Dictée** : 2 réécoutes au plus (« Listen again » / « Slow ») : d'accord ?
5. **Badges échus ou « à repasser »** : ils restent affichés (rouge / pointillé) avec « Expired · renew it » / « Not valid · take it again ». Plutôt les masquer ?
