# Publier une nouvelle version de Learning English with Kai

Fini le glisser-déposer. Le circuit devient :

```
 Vous modifiez            GitHub vérifie                 Le site est à jour
 (PC ou téléphone)  ──►   (secrets, liens, taille)  ──►  + numéro de version
                          croix rouge = rien publié
```

- **Depuis le PC** : un double-clic sur `publier.bat`.
- **Depuis le téléphone** (petite correction) : modifier le fichier directement sur github.com. GitHub publie seul.
- **Dans les deux cas**, GitHub vérifie avant de publier. Si un contrôle échoue, le site en ligne ne change pas
  et vous recevez un e-mail.

---

## 0. Réglage à faire UNE seule fois sur GitHub (2 minutes, possible depuis le téléphone)

À faire **juste avant d'accepter** (merger) la pull request qui installe ce circuit :

1. Ouvrez <https://github.com/colouis-web/english-with-kai/settings/pages>.
2. Rubrique **Build and deployment** › **Source** : choisissez **GitHub Actions** (au lieu de « Deploy from a branch »).
3. C'est tout. L'adresse du site ne change pas.

Tant que ce réglage n'est pas fait, la publication automatique échoue (croix rouge) mais le site actuel reste en ligne.

Protégez aussi votre adresse e-mail, une fois : <https://github.com/settings/emails> › cochez
**Keep my email addresses private** et **Block command line pushes that expose my email**. Notez l'adresse qui finit
par **@users.noreply.github.com** : `publier.bat` vous la demandera la première fois.

---

## 1. Publier depuis le PC (nouvelle version complète)

### Installation (une seule fois par ordinateur, 15 minutes)

**Étape 1 — Installer Git for Windows.** Ouvrez <https://git-scm.com/download/win>, lancez le fichier téléchargé,
cliquez **Next** à chaque écran. Au bureau, sans droits administrateur : choisissez l'installation **pour vous seul**
si elle est proposée ; sinon, passez au **plan B** (GitHub Desktop, section 4).

**Étape 2 — Récupérer le dépôt dans un dossier (« cloner »).** Touches **Windows + R**, tapez `powershell`,
**Entrée**. Collez (clic droit) ces deux lignes, **Entrée** après chacune :

```
cd $HOME\Documents
git clone https://github.com/colouis-web/english-with-kai.git
```

Vous avez un dossier **Documents\english-with-kai** : c'est **votre dossier de publication**.
Ce qui est dans ce dossier = ce qui sera en ligne.

**Étape 3 — Se connecter à GitHub.** Rien à faire à l'avance : à la première publication, une fenêtre
« Connect to GitHub » s'ouvre. Cliquez **Sign in with your browser**, puis **Authorize**. Windows s'en souvient.

### Chaque fois que je publie

1. **Copiez les nouveaux fichiers** (le nouvel `index.html`, des images dans `img\`…) dans
   **Documents\english-with-kai**, en remplaçant les anciens. Supprimez ce qui ne sert plus.
2. **Double-cliquez sur `publier.bat`**.
3. La fenêtre liste les fichiers modifiés et demande une phrase qui décrit la mise à jour
   (**Entrée** seule = « Mise à jour du JJ/MM/AAAA »).
4. Message vert **C'EST ENVOYÉ** : GitHub vérifie puis met en ligne en 1 à 3 minutes.

Le script **refuse d'envoyer** les clés, mots de passe et sauvegardes d'élèves (`kai-english-….json`, qui contiennent
les prénoms). Ne les mettez jamais dans ce dossier.

### Si un message rouge s'affiche dans la fenêtre

| Message | Ce que ça veut dire | Que faire |
|---|---|---|
| Git n'est pas installé | Étape 1 pas faite sur cet ordinateur | Faire l'étape 1 (ou le plan B) |
| Ce dossier n'est pas relié à GitHub | `publier.bat` est ailleurs que dans le dossier cloné | Utiliser celui de **Documents\english-with-kai** |
| Impossible de joindre GitHub | Pas d'internet, ou pas connecté | Vérifier internet, relancer |
| Publication ARRÊTÉE : fichier sensible | Un fichier dangereux est dans le dossier | Le sortir du dossier, relancer |
| La version en ligne a été modifiée entre-temps | Le même fichier a été modifié sur github.com | Ne rien effacer ; plan B ou demander de l'aide |
| Le script n'a pas pu démarrer | PowerShell bloqué par l'informatique du bureau | Plan B (section 4) |

Dans tous ces cas, **rien n'est envoyé** et le site reste tel quel.

---

## 2. Petite correction depuis le téléphone (faute de frappe, phrase à changer)

1. Ouvrez <https://github.com/colouis-web/english-with-kai> dans le navigateur du téléphone (connecté à votre compte).
2. Touchez le fichier à corriger (par exemple `README.md`), puis l'icône **crayon** (Edit).
3. Faites la correction, touchez **Commit changes…**, écrivez une phrase courte, laissez
   **Commit directly to the main branch**, puis **Commit changes**.
4. GitHub vérifie et publie seul (1 à 3 minutes).

Limite : `index.html` fait 1,7 Mo, avec des lignes très longues. Le modifier depuis un téléphone est déconseillé
(lent, risque d'erreur). Pour lui, passez par le PC.

Si vous corrigez sur le téléphone, la prochaine fois sur le PC, `publier.bat` récupère d'abord cette correction :
rien n'est perdu, tant que vous n'avez pas modifié le même passage des deux côtés.

---

## 3. Vérifier ce qui est en ligne

- **Le site** : `https://colouis-web.github.io/english-with-kai/` (adresse exacte dans Settings › Pages).
- **La version en ligne** : ajoutez `version.json` à l'adresse du site. Exemple de réponse :
  `{"version":"v2026.10.30.12","date":"30/10/2026 08:41","commit":"1a2b3c4"}`.
  Le numéro = date + compteur de publication. Il est aussi enregistré comme étiquette (onglet **Tags** du dépôt).
- **Le suivi** : onglet **Actions** du dépôt. Coche verte = publié. Croix rouge = rien publié ; touchez-la pour
  lire la raison (« lien cassé vers img/… », « clé ou secret probable… »).

### Revenir à la version précédente

Onglet **Commits** du dépôt (ou GitHub Desktop › **History**) : sur la publication fautive, **Revert**
(GitHub Desktop : clic droit › **Revert changes in commit**, puis **Push origin**). Le site revient en arrière
tout seul en 1 à 3 minutes.

### Proposer sans publier (aperçu)

Pour faire relire avant de publier, on passe par une **pull request** (c'est ce qu'Ani fait) : GitHub vérifie
les fichiers et affiche le résultat dans la pull request, sans rien mettre en ligne. Il n'y a pas d'aperçu
visuel du site : GitHub Pages ne gère qu'un seul site par dépôt.

---

## 4. Plan B — GitHub Desktop (si Git ou PowerShell sont bloqués au bureau)

GitHub Desktop s'installe **sans droits administrateur**.

1. Installez-le depuis <https://desktop.github.com> et connectez-vous.
2. **File › Clone repository** › `colouis-web/english-with-kai` › dossier `Documents\english-with-kai` › **Clone**.
3. Pour publier : copiez vos fichiers dans ce dossier ; dans GitHub Desktop, écrivez une phrase dans **Summary**
   (en bas à gauche), **Commit to main**, puis **Push origin** (en haut).

Avec le plan B, le contrôle local de `publier.bat` ne s'exécute pas : regardez la liste des fichiers affichée par
GitHub Desktop avant **Commit**. Le contrôle de GitHub reste actif et bloque la mise en ligne si un fichier pose
problème (mais le fichier, lui, est déjà envoyé dans le dépôt public : prévenez Ani pour le retirer).
