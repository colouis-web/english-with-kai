# Bugs trouvés — Learning English with Kai (chasse d'Ouss, 30/10/2026)

Version testée : `main` @ `51efca8` + docs (branche `kai/ouss`), servie par `python3 -m http.server`,
Playwright/Chromium en 390×844 (téléphone) et 1280×800 (+ 680×700 pour le balayage des écrans).
Les polices Google échouent dans le bac à sable (pas de réseau) : ce n'est pas un bug de l'app (voir I-2 d'Ani).

## Ce qui a été vérifié et qui est propre
- 0 erreur console, 0 exception, 0 réponse 404 sur le balayage des 20 écrans principaux (390 et 1280 px).
- Toutes les images `img/*.webp` citées existent ; 9 fichiers ne sont jamais cités (poids mort, pas un bug).
- Banque TTYPE : 275 questions à écrire × chaque réponse acceptée × 6 variantes (casse, apostrophe courbe ’,
  espaces doubles, point final, phrase entière) : **0 refus à tort**. Banque LBANK : 2 314 questions, bonne réponse
  toujours en `o[0]`, pas d'options en double, 0 apostrophe courbe dans les options.
- 4 078 phrases d'exemple (2 039 mots) : astérisques équilibrés, réponse « Type it » acceptée dans toutes les variantes.
- IPA : alphabet cohérent (britannique, pas de `g` ASCII, pas de `oʊ`/`ɚ`), 100 verbes irréguliers : formes acceptées.
- Retour arrière : chaque flèche « back » ramène à l'écran parent attendu (20 écrans testés).
- Suppression d'un élève (avec confirmation du prénom), nom vide, nom `<img onerror=…>` : correctement refusés/échappés.

## Gênants

### G1 — Double clic sur « Let's go! » : l'enfant atterrit sur « Words »
- **Écran** : Hello! (création d'un élève), même risque sur tout bouton qui change d'écran sous le doigt.
- **Reproduire** : Home › toucher Kai › taper un prénom › double-cliquer (ou double-tap) « Let's go! ».
- **Attendu** : le menu. **Obtenu** : le 1er clic ouvre le menu, le 2e clic tombe sur la tuile « Words » qui est au même endroit.
- **Cause probable** : `show()` (`index.html:1164`) affiche la nouvelle page tout de suite, sans délai de protection.
- **Correction proposée** : dans `show()`, bloquer les clics ~350 ms (`pointer-events:none` sur `.page.on` pendant l'animation `pagein`).

### G2 — Deux élèves peuvent avoir le même prénom (renommage)
- **Écran** : Me › Rename.
- **Reproduire** : créer Léo et Anna, renommer Anna en « léo ».
- **Attendu** : refus, comme à la création (où « léo » rouvre le profil Léo). **Obtenu** : deux profils « Léo » / « léo », indiscernables sur « Who's learning? ».
- **Cause probable** : le gestionnaire du formulaire `#renform` (`index.html:1648`) ne cherche pas de doublon.
- **Correction proposée** : même test insensible à la casse que `nameform`, avec un toast « This name is already used ».

### G3 — Noms de niveaux qui ne sont pas de l'anglais (« Practicer », « Confirmed »)
- **Écran** : Hello!, Me, My daily work › My level (« Road to Practicer »).
- **Obtenu** : « Practicer » n'existe pas ; « Confirmed » est un faux ami de « confirmé ».
- **Cause probable** : tableau `LV` (`index.html:1361`).
- **Correction proposée** : « Elementary » (A2) et « Intermediate » (B1), identifiants `practicer`/`confirmed` inchangés (la progression enregistrée ne bouge pas).
  Question au PO : garder « Expert » pour B2 (« Upper-intermediate » serait plus juste) ?

## Cosmétiques

### C1 — Renommer avec un champ vide ne dit rien
- **Écran** : Me › Rename. **Reproduire** : vider le champ, Entrée. **Obtenu** : le formulaire se ferme, l'ancien prénom reste, aucun message.
- **Cause** : `index.html:1649` `if(p&&n){…}RENAME=false`. **Correction** : toast « Type a first name ».

### C2 — Un prénom avec émoji peut être coupé au milieu d'un caractère
- **Reproduire** : prénom de 15 lettres + « 😀 ». **Obtenu** : le `slice(0,16)` coupe la paire de substitution → « � ».
- **Cause** : `.slice(0,16)` (`index.html:1600` et `1648`). **Correction** : `[...name].slice(0,16).join("")`.

### C3 — README : « 19 leçons de grammaire » mais l'application en affiche 20
- **Écran** : Grammar (leçons 1 à 20). **Correction** : README → 20 (le 2 299 exercices est à recompter : LBANK = 2 314 questions).

### C4 — Questions en double dans une même leçon
- `LBANK.order` (« She has a ___. » ×6, « I have three ___. » ×6…), `be` (« Tom and Lily ___ in the kitchen. » ×2), `cond#64/#66`
  (même phrase, `build` / `make`). L'enfant revoit la même question dans un test de 20. **Correction** : dédoublonner à la source ou dans `pickRot` (clé `q`+`o[0]`).

### C5 — 68 connecteurs sans API ni prononciation
- `connectors` : « first », « and », « also », « to start with »… ont `ipa` et `pr` vides. À vérifier visuellement : la ligne de prononciation reste-t-elle vide ?
  **Correction** : ajouter les IPA (travail de contenu pour Matt) ou masquer la ligne vide.

## Non couvert (à tester ensuite)
Dictée, « Let's talk English » (micro), Test 6th grade (réponses écrites), Do it yourself, tests hebdomadaires, sauvegarde/chargement
d'un fichier, code parent, navigation au clavier (Tab/focus), zoom 150 %.
