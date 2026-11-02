# Moteur des certificats de vocabulaire — notes de Ludo (sprint Kai 2 A, 02/11/2026)

Code : `js/app-certificats.js` (script classique, objet global `Cert`, API documentée en tête de fichier).
Tests : `tests/test_certificats.py` (36 contrôles, autonome : `python3 tests/test_certificats.py -v`).
Aucun écran : la tuile, les épreuves, le badge et la page imprimable viennent au sprint B (Ouss).

## Ce qui est livré
- **Stockage par élève** : `localStorage["kai.cert.v1.<id élève>"]`, même forme que `kai.daily.v1.<id>`.
  JSON lisible : `{ v: 1, themes: { "<thème>": { status, first, date, expires, score, best, formats, level, renewals, missed, history, u } } }`.
- **Thème** = identifiant déjà utilisé par les mots du jour (`allWords()`), `"<nature>:<catégorie>"` :
  `nouns:animals`, `adjectives:colours`, `adverbs:frequency`, `verbs:irregular`… Un mot rangé aussi dans un autre thème
  (champ `also`) compte dans les deux, comme les puces des dictionnaires.
- **Validité** : 3 mois si l'élève est Beginner ou Elementary au moment de l'épreuve, 6 mois s'il est Intermediate ou
  Upper-intermediate (niveau lu dans `PROFS.list[i].lv`). Le certificat est valable **jusqu'à la veille** de `expires`.
- **Réussite d'une épreuve** : ≥ 90 % (comparaison exacte, sans arrondi) **et** au moins 3 formats différents.
- **Renouvellement** : `Cert.pickRenewal` tire 8 mots du thème sans doublon, poids = fréquence (mot rare ×4, courant ×2,
  très courant ×1, d'après `USAGE`) × (1 + 1,5 × nombre d'échecs, plafonné à 4 ; échecs pris dans le journal des jours
  et dans les mots ratés aux épreuves du thème). Réussite à 80 % (7/8). Réussi → +3 ou +6 mois **à partir de l'échéance**
  si elle n'est pas passée (on ne perd pas les jours restants), sinon à partir d'aujourd'hui. Raté → thème « review ».
- **Sortie de rotation** : un thème certifié et valide ne fournit plus de mots du jour (nouveaux **ni** à revoir) et
  disparaît de « My memory » (mots à revoir, « Words you often miss »). À l'échéance ou après un renouvellement raté, il
  revient tout seul. Sans certificat, le tirage est **identique au bit près** (contrôle CE-03 : 12 tirages comparés avec et sans le moteur).
- **Save & move** : la clé commençant par `kai.`, elle part dans le fichier sans rien changer à l'export. À l'import,
  fusion **thème par thème** (le plus récent gagne, champ `u`) au lieu de « garder l'existant ». Un ancien fichier sans
  certificats s'importe comme avant.
- **Modification à la main** (décision T1) : tout est assaini à la lecture. JSON invalide → aucun certificat ; date impossible
  → certificat ignoré ou remis « review » ; échéance absente → recalculée ; échéance trop lointaine → plafonnée à deux
  durées de validité après l'obtention ; score borné à 0–100 ; formats et thèmes filtrés (pas de HTML possible dans un identifiant) ;
  clé d'un élève inconnu → ignorée.
- **Élève supprimé** : ses certificats sont effacés avec son journal.

## Branchements (minimes)
- `index.html` : `<script src="js/app-certificats.js">` après `app-v54-v62.js` (il enveloppe `memStats`).
- `js/app-daily.js` : `pickMix` ajoute `Cert.rotationFilter()` au filtre des thèmes sensibles (3 lignes) ; `deleteProfile`
  et la suppression venue du compte appellent `Cert.drop`.
- `js/app-v51-sauvegarde.js` : `kaiMerge` confie les clés `kai.cert.*` à `Cert.mergeRaw` et rend `nc` (thèmes repris).

## Constats
1. **Matt** : `docs/certificats/conception.md` n'était pas encore sur `kai/matt` quand j'ai codé. Les formats sont donc des
   identifiants libres (`[a-z0-9-]`, ex. `type-fr-en`, `dictation`, `picture`, `gap`, `order`, `fix`, `speak`) : il suffit
   que la conception fixe la liste. `pickRenewal(…, { formats })` les distribue à tour de rôle ; sans liste, `fmt` est `null`.
2. **63 thèmes certifiables** dans les données actuelles. **Trois ont moins de 8 mots** : `connectors:start` (4),
   `adverbs:certainty` (7), `connectors:condition` (7). `pickRenewal` rend alors tous les mots du thème (moins de 8 questions). À trancher (Q2).
3. **Verbes** : il n'y a que deux « thèmes » de verbes, `verbs:irregular` (107) et `verbs:regular` (258), trop gros pour un
   certificat. Ils restent certifiables techniquement, mais je propose de ne pas les proposer à l'écran (Q3).
   Les plus gros thèmes de noms (`nouns:animals` 96, `nouns:house` 74) posent la même question pour la banque de Matt.
4. **Mots sensibles** : un thème sensible (ex. `nouns:war`) reste certifiable s'il est choisi ; `pickRenewal` en retire les
   mots sensibles pour un élève jeune tant qu'il en reste assez.
5. Le moteur ne lit **pas** l'heure de passage : une épreuve faite à 23 h 59 compte pour le jour même (fuseau de l'appareil).
6. **Synchronisation compte Claude** (`dSync`) : les certificats ne sont **pas** envoyés dans la base de l'artefact (seuls
   les profils et les jours le sont). Sur GitHub Pages, cela ne change rien (pas de base). À voir si on le veut au sprint B.

## Questions au PO
- **Q1** — Une épreuve **ratée** alors que le certificat est encore valable (l'élève la repasse « pour le plaisir ») : je
  garde le certificat. D'accord ?
- **Q2** — Thème de moins de 8 mots : renouvellement plus court (tous les mots), ou thème regroupé avec un voisin ?
- **Q3** — Verbes : certificats par « paquets » de 20–30 verbes (à définir par Matt), ou pas de certificat de verbes en v1 ?
- **Q4** — L'élève **change de niveau** (6e → B1) pendant qu'un certificat court : je garde l'échéance obtenue ; la nouvelle
  durée (6 mois) s'applique au prochain renouvellement. D'accord ?
- **Q5** — Envoyer aussi les certificats dans la base de l'artefact Claude (synchro entre appareils sans fichier) ?

## Résultats des tests (02/11)
- `tests/test_certificats.py` : **36 OK / 0 KO** ; Chromium : 0 erreur console (appareil vierge et progression de référence).
- `tests/run_all.py` : données 87 OK / 0 KO. Les KO restants **existent aussi sur la base `03d25bd` sans mes changements**
  (même relance faite sur une copie de la base) : ce ne sont pas des régressions du moteur.
  - Parcours P07 (Entrée dans le 1er champ), P12 (code parent, l'étape qui casse change d'un passage à l'autre), P14 (bloqué par P12) :
    l'instabilité connue (Dédé).
  - Persistance PE-25 (écrans `daily_today`, `tests`, `me` différents de l'original) : 3 KO présents aussi sur la base. Probablement la
    bannière « Class test in 3 days » et la casse des titres, ajoutées après la référence. À signaler à Dédé.

## Pour le sprint B
- Rappel une semaine avant : `Cert.dueSoon(élève, 7)` est prêt (échéances dépassées comprises, `left` ≤ 0).
- Écran d'épreuve : appeler `Cert.record(élève, thème, { kind: "exam", items: [{ key, fmt, ok }] })` ; `key` = clé du mot
  (`"nouns:dog"`) pour que les mots ratés pèsent dans le prochain renouvellement.
- `tests/test_certificats.py` n'est pas dans `tests/run_all.py` (fichier de Dédé) : à ajouter par Dédé si l'équipe le souhaite.

## Sprint B (Ludo, 02/11/2026) : moteur complet
- `Cert.pickExam(pid, périmètre, { sound })` : 20 questions (6e) ou 25 (B1+), quotas du §5.2, couverture de tous les mots (couplage maximum),
  jamais deux fois le même format pour un mot, 2 questions par mot au plus (3 si le périmètre est trop petit : Colours à 25), contrainte
  « afficher après produire ». Les questions portent déjà phrases, image, réponses en plus (`s`, `sfr`, `also`, `alt`, `img`, `tree`, `bad`, `good`…).
- `Cert.check(question, tapé)` → `{ ok, typo, grammar, note }` (règles du §3 ; dictée = mot dit + variante US ; `fix` : le mot fautif est toujours faux).
  Liste `NEAR_WORDS` : quelques mots anglais courants à une lettre d'un mot de certificat, absents des dictionnaires (block ≠ black).
- `Cert.canRetry(pid, périmètre)` → `{ ok, on }` ; `Cert.catchUp(pid, périmètre, [{ key, ok }])` → écrit « raté puis corrigé » (`ok 0, fx 1, cu 1`) dans le
  journal du jour, sans activité (`qs`), donc ni note, ni moyenne des quiz, ni objectif ; `cu` est ignoré par `wordsOf` (app-daily.js).
- Périmètres : `Cert.themes()` rend les certificats de `CERTBANK` (≤ 20 mots, pas de verbes) ; `themeWords("nouns:family-1")` = mots de la partie.
  Sortie de rotation par périmètre ; champ `redo` du certificat = mots ratés à l'épreuve, remis en tête des mots à revoir (`Cert.pending()`, utilisé
  par `pickMix`) jusqu'à un tour du jour postérieur où ils sont réussis.
- Étoiles : champ `cs` du journal du jour (+10 obtention, +5 renouvellement réussi), ajouté dans `starsOf` ; une épreuve repassée sur un certificat valable ne redonne rien.
- Écran (Ouss) : adaptateurs supprimés, tout passe par `Cert`.
