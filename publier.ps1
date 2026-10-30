# publier.ps1 - publie la version du dossier sur GitHub (branche main), sans glisser-deposer.
# Lance par publier.bat (double-clic). Aucun droit administrateur necessaire.
# Ce que fait le script :
#   1. trouve git (Git for Windows ou celui de GitHub Desktop) ;
#   2. affiche ce qui a change ;
#   3. refuse les fichiers sensibles (cles, .env, sauvegardes d'eleves) ;
#   4. demande un message, puis add / commit / pull --rebase / push sur main ;
#   5. dit en clair si ca a marche.

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
$Host.UI.RawUI.WindowTitle = 'Publier Learning English with Kai'

function Say([string]$texte, [string]$couleur = 'Gray') { Write-Host $texte -ForegroundColor $couleur }
function Fin([int]$code) {
    Write-Host ''
    Read-Host 'Appuyez sur Entrée pour fermer cette fenêtre' | Out-Null
    exit $code
}
function Echec([string]$texte) {
    Write-Host ''
    Say "ÉCHEC : $texte" 'Red'
    Say 'Rien n''a été publié. Le site en ligne n''a pas changé.' 'Red'
    Fin 10
}

Say '=============================================' 'Cyan'
Say '   Publier Learning English with Kai'         'Cyan'
Say '=============================================' 'Cyan'
Write-Host ''

# --- 1. Trouver git -------------------------------------------------------
function Find-Git {
    $c = Get-Command git -ErrorAction SilentlyContinue
    if ($c) { return $c.Source }
    $candidats = @(
        (Join-Path $env:ProgramFiles 'Git\cmd\git.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\Git\cmd\git.exe')
    )
    $candidats += Get-ChildItem (Join-Path $env:LOCALAPPDATA 'GitHubDesktop\app-*\resources\app\git\cmd\git.exe') -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | ForEach-Object { $_.FullName }
    foreach ($p in $candidats) { if ($p -and (Test-Path $p)) { return $p } }
    return $null
}
$git = Find-Git
if (-not $git) {
    Say 'Git n''est pas installé sur cet ordinateur.' 'Red'
    Say 'Installez « Git for Windows » : https://git-scm.com/download/win' 'Yellow'
    Say '(sans droits administrateur : choisissez une installation pour vous seul)' 'Yellow'
    Say 'ou « GitHub Desktop » : https://desktop.github.com' 'Yellow'
    Say 'Le guide PUBLIER.md explique tout pas à pas.' 'Yellow'
    Fin 10
}

# --- 2. Être dans le bon dossier, sur main ---------------------------------
Set-Location -LiteralPath $PSScriptRoot
& $git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
    Echec "ce dossier n'est pas relié à GitHub. Suivez l'étape « Première installation » de PUBLIER.md (cloner le dépôt), puis copiez vos fichiers dans le dossier cloné."
}
$gitDir = (& $git rev-parse --git-dir).Trim()
if ((Test-Path (Join-Path $gitDir 'rebase-merge')) -or (Test-Path (Join-Path $gitDir 'rebase-apply'))) {
    Echec 'une publication précédente est restée à moitié (conflit). Ouvrez GitHub Desktop pour la terminer, ou demandez de l''aide.'
}
$branche = (& $git rev-parse --abbrev-ref HEAD).Trim()
if ($branche -ne 'main') {
    Echec "vous êtes sur la branche « $branche » et non « main ». Dans GitHub Desktop, choisissez « main » en haut (Current branch), puis relancez."
}
$remote = (& $git remote get-url origin 2>$null)
if (-not $remote) { Echec 'aucun dépôt GitHub (« origin ») n''est configuré dans ce dossier.' }
$remote = "$remote".Trim()

# --- 3. Identité de l'auteur (adresse privée GitHub, jamais l'e-mail perso) --
$email = "$(& $git config user.email)".Trim()
if (-not $email) {
    Say 'Première publication depuis cet ordinateur : il faut une adresse d''auteur.' 'Yellow'
    Say 'Pour ne pas rendre votre e-mail public, utilisez l''adresse privée de GitHub :' 'Yellow'
    Say 'GitHub > photo en haut à droite > Settings > Emails > l''adresse qui finit par @users.noreply.github.com' 'Yellow'
    $email = (Read-Host 'Collez cette adresse ici').Trim()
    if ($email -notmatch '@users\.noreply\.github\.com$') {
        $ok = Read-Host 'Cette adresse sera visible publiquement. Continuer quand même ? (o/N)'
        if ($ok -notmatch '^[oOyY]') { Echec 'adresse d''auteur non confirmée.' }
    }
    $nom = (Read-Host 'Votre nom d''utilisateur GitHub (ex. colouis-web)').Trim()
    if (-not $nom) { $nom = 'colouis-web' }
    & $git config user.email $email
    & $git config user.name $nom
}

# --- 4. Récupérer la version en ligne (vérifie aussi la connexion) --------
Say 'Connexion à GitHub...'
& $git fetch --quiet origin main
if ($LASTEXITCODE -ne 0) { Echec 'impossible de joindre GitHub (pas d''internet, ou pas connecté à votre compte : voir PUBLIER.md, étape 3).' }

# --- 5. Qu'est-ce qui a changé ? -------------------------------------------
$changes = & $git -c core.quotepath=off status --porcelain -uall
$enAvance = [int]("$(& $git rev-list --count origin/main..HEAD)".Trim())
if (-not $changes -and $enAvance -eq 0) {
    Say 'Rien de nouveau à publier : le dossier est identique à la version en ligne.' 'Green'
    Fin 0
}
if ($changes) {
    Say 'Fichiers modifiés depuis la dernière publication :' 'Cyan'
    foreach ($l in $changes) {
        $etat = $l.Substring(0, 2); $f = $l.Substring(3)
        $mot = switch -regex ($etat) { '\?\?' { 'nouveau  '; break } 'D' { 'supprimé '; break } 'R' { 'renommé  '; break } 'A' { 'nouveau  '; break } default { 'modifié  ' } }
        Say "   $mot $f"
    }
    Write-Host ''
}

# --- 6. Préparer et contrôler les fichiers ---------------------------------
& $git add -A
$fichiers = & $git -c core.quotepath=off diff --cached --name-only --diff-filter=ACMR
$bloques = @()
$motifsNom = '(^|/)\.env($|\.)|\.env$|\.(key|pem|pfx|p12|ppk|kdbx)$|(^|/)id_(rsa|dsa|ecdsa|ed25519)|kai-english-.*\.json$|(secret|password|motdepasse|mot-de-passe|credential)'
$motifsContenu = 'sk_[a-f0-9]{40,}|xi-api-ke[y]\s*[:=]|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{20,}|AIza[0-9A-Za-z_\-]{35}|-----BEGIN [A-Z ]*PRIVATE KEY|"app"\s*:\s*"learning-english-with-kai"'
$textes = '\.(html?|js|css|json|webmanifest|md|txt|csv|ya?ml|xml|ini|cfg|conf|env|ps1|bat)$'
foreach ($f in $fichiers) {
    if (-not $f) { continue }
    $chemin = Join-Path $PSScriptRoot $f
    if ($f -match $motifsNom) { $bloques += "$f  (nom de fichier sensible)"; continue }
    if (-not (Test-Path -LiteralPath $chemin)) { continue }
    $taille = (Get-Item -LiteralPath $chemin).Length
    if ($taille -gt 50MB) { $bloques += "$f  (fichier de plus de 50 Mo : GitHub le refusera)"; continue }
    if ($f -match '^voice/' -or $f -eq 'publier.ps1') { continue }
    if ($f -match $textes -and $taille -lt 20MB) {
        $contenu = [System.IO.File]::ReadAllText($chemin)
        if ($contenu -match $motifsContenu) {
            if ($Matches[0] -like '*learning-english-with-kai*') { $bloques += "$f  (sauvegarde d'élève : contient des prénoms)" }
            else { $bloques += "$f  (contient une clé ou un secret : $($Matches[0].Substring(0, [Math]::Min(4, $Matches[0].Length)))...)" }
        }
    }
}
if ($bloques.Count -gt 0) {
    & $git reset --quiet
    Say 'Publication ARRÊTÉE : ces fichiers ne doivent pas être mis sur un site public.' 'Red'
    foreach ($b in $bloques) { Say "   - $b" 'Red' }
    Say 'Retirez-les du dossier (ou déplacez-les ailleurs), puis relancez publier.bat.' 'Yellow'
    Echec 'fichier sensible détecté.'
}

# --- 7. Message de version, commit -----------------------------------------
$defaut = 'Mise à jour du ' + (Get-Date -Format 'dd/MM/yyyy')
$message = (Read-Host "Décrivez la mise à jour en une phrase (Entrée = « $defaut »)").Trim()
if (-not $message) { $message = $defaut }
if ($changes) {
    & $git commit --quiet -m $message
    if ($LASTEXITCODE -ne 0) { Echec 'l''enregistrement local (commit) a échoué.' }
}

# --- 8. Se mettre à jour puis publier --------------------------------------
Say 'Récupération des éventuelles modifications faites en ligne...'
& $git pull --quiet --rebase origin main
if ($LASTEXITCODE -ne 0) {
    & $git rebase --abort *> $null
    Echec 'la version en ligne a été modifiée entre-temps sur les mêmes fichiers (par exemple depuis le site GitHub). Votre travail est conservé sur cet ordinateur. Ouvrez GitHub Desktop pour choisir la bonne version, ou demandez de l''aide.'
}
Say 'Envoi vers GitHub...'
& $git push --quiet origin HEAD:main
if ($LASTEXITCODE -ne 0) {
    Echec 'l''envoi a été refusé (connexion au compte GitHub expirée ou droits insuffisants). Votre travail est conservé sur cet ordinateur : relancez publier.bat après vous être reconnecté (PUBLIER.md, étape 3).'
}

# --- 9. Succès ---------------------------------------------------------------
$site = ''
if ($remote -match 'github\.com[:/]([^/]+)/([^/.]+)') { $site = "https://$($Matches[1].ToLower()).github.io/$($Matches[2])/" }
Write-Host ''
Say 'C''EST ENVOYÉ.' 'Green'
Say "Version : $message" 'Green'
Say 'GitHub vérifie maintenant les fichiers puis met le site en ligne (1 à 3 minutes).' 'Green'
if ($site) { Say "Site : $site   (numéro de version : ${site}version.json)" 'Green' }
$actions = $remote -replace '\.git$', '' -replace '^git@github\.com:', 'https://github.com/'
Say "Suivi : $actions/actions  (coche verte = en ligne, croix rouge = pas publié, e-mail envoyé)" 'Green'
Say '(Si l''ancienne version s''affiche encore, appuyez sur Ctrl+F5 dans le navigateur.)' 'Green'
Fin 0
