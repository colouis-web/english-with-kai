"""Contrôles avant publication de Learning English with Kai (lancé par GitHub Actions).

Bloque la publication si : clé ou secret probable, sauvegarde d'élève, fichier > 50 Mo,
manifest invalide ou icône manquante, image / voix référencée par index.html absente,
fichier de voix JSON invalide. Python standard uniquement, aucune dépendance.
Usage : python3 -I .github/verifier.py   (depuis la racine du dépôt)
"""
import json
import os
import re
import subprocess
import sys

MAX_OCTETS = 50 * 1024 * 1024
NOM_SENSIBLE = re.compile(
    r"(^|/)\.env($|\.)|\.env$|\.(key|pem|pfx|p12|ppk|kdbx)$|(^|/)id_(rsa|dsa|ecdsa|ed25519)|kai-english-.*\.json$",
    re.I,
)
# Motifs écrits pour ne pas se détecter eux-mêmes (ex. « ke[y] »).
SECRET = re.compile(
    r"sk_[a-f0-9]{40,}|xi-api-ke[y]\s*[:=]|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}"
    r"|github_pat_[A-Za-z0-9_]{20,}|AIza[0-9A-Za-z_\-]{35}|-----BEGIN [A-Z ]*PRIVATE KEY"
)
SAUVEGARDE = re.compile(r'"app"\s*:\s*"learning-english-with-kai"')
TEXTE = re.compile(r"\.(html?|js|css|json|webmanifest|md|txt|csv|ya?ml|xml|ini|cfg|conf|ps1|bat|py)$", re.I)
REF_MEDIA = re.compile(r"""["'(=](?:\./)?((?:img|voice)/[A-Za-z0-9._-]+\.(?:webp|png|jpg|svg|json|mp3|ogg|opus))""")
REF_RACINE = re.compile(r"""(?:href|src)="(?:\./)?([A-Za-z0-9._-]+\.(?:png|webmanifest|ico|svg|webp))\"""")


def main() -> int:
    sortie = subprocess.run(["git", "ls-files", "-z"], capture_output=True, check=True).stdout
    fichiers = [f for f in sortie.decode("utf-8").split("\0") if f]
    erreurs = []

    for f in fichiers:
        if not os.path.isfile(f):
            continue
        taille = os.path.getsize(f)
        if NOM_SENSIBLE.search(f):
            erreurs.append(f"{f} : nom de fichier sensible")
        if taille > MAX_OCTETS:
            erreurs.append(f"{f} : plus de 50 Mo")
        if f.startswith("voice/") or not TEXTE.search(f):
            continue
        with open(f, encoding="utf-8", errors="replace") as fh:
            texte = fh.read()
        m = SECRET.search(texte)
        if m:
            # Jamais le secret complet dans les journaux (publics) : 4 caractères seulement.
            erreurs.append(f"{f} : clé ou secret probable ({m.group(0)[:4]}...)")
        if SAUVEGARDE.search(texte):
            erreurs.append(f"{f} : ressemble à une sauvegarde d'élève (contient des prénoms)")

    # Manifest PWA : JSON valide, icônes présentes.
    try:
        with open("manifest.webmanifest", encoding="utf-8") as fh:
            manifest = json.load(fh)
        for icone in manifest.get("icons", []):
            if not os.path.isfile(icone.get("src", "")):
                erreurs.append(f"manifest.webmanifest : icône manquante {icone.get('src')}")
    except Exception as e:  # noqa: BLE001 - tout problème de manifest bloque
        erreurs.append(f"manifest.webmanifest : invalide ({e})")

    # Liens de index.html vers img/, voice/ et les icônes de la racine.
    if os.path.isfile("index.html"):
        with open("index.html", encoding="utf-8", errors="replace") as fh:
            html = fh.read()
        refs = set(REF_MEDIA.findall(html)) | set(REF_RACINE.findall(html))
        refs.discard("voice/kai-N.json")  # exemple dans un commentaire, pas un vrai lien
        for ref in sorted(refs):
            if not os.path.isfile(ref):
                erreurs.append(f"index.html : lien cassé vers {ref}")
        # Les voix sont chargées par numéro ("voice/kai-"+n+".json") : il en faut au moins une, en suite continue.
        voix = sorted(int(m) for m in re.findall(r"kai-(\d+)\.json", " ".join(fichiers)))
        if voix and voix != list(range(1, len(voix) + 1)):
            erreurs.append(f"voice/ : numérotation des fichiers de voix incomplète {voix}")
        print(f"{len(refs)} liens vers des médias vérifiés.")
    else:
        erreurs.append("index.html absent")

    # Fichiers de voix : JSON valide.
    for f in fichiers:
        if f.startswith("voice/") and f.endswith(".json"):
            try:
                with open(f, encoding="utf-8") as fh:
                    json.load(fh)
            except Exception as e:  # noqa: BLE001
                erreurs.append(f"{f} : JSON invalide ({e})")

    if erreurs:
        print("Publication bloquée, problèmes trouvés :")
        for e in erreurs:
            print("::error::" + e)
        return 1
    print(f"OK : {len(fichiers)} fichiers vérifiés, aucun secret, manifest et liens valides.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
