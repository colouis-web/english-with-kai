"""Vérifie que le découpage de index.html en fichiers (css/, js/) ne change AUCUN comportement.

Compare l'ancienne version (index.html d'une seule pièce, pris dans git) et la version actuelle du dépôt :
  1. zéro erreur console / erreur JavaScript sur la nouvelle version ;
  2. mêmes globales clés (tailles des jeux de données, empreinte de leur contenu, fonctions globales) ;
  3. mêmes écrans principaux : même page affichée et captures identiques (ou quasi) à chaque étape ;
  4. mêmes clés localStorage `kai.*` après le parcours.

Outil de développement uniquement (rien à l'exécution de l'app). Dépendances : python3, playwright (Chromium),
Pillow + numpy pour comparer les captures.
Usage (depuis n'importe où) :  python3 scripts/verifier-decoupage.py [--ref sprint-kai-1] [--garder]
Code de sortie 0 = identique, 1 = différence trouvée.
"""
import argparse
import functools
import http.server
import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading

import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEUIL_PIXELS = 0.002  # au plus 0,2 % de pixels différents par capture (anticrénelage)

# Parcours identique sur les deux versions : (nom de l'étape, JavaScript à exécuter avant la capture).
CLIC = 'document.getElementById("{}").click()'
PARCOURS = [
    ("01-accueil", None),
    ("02-premier-lancement", CLIC.format("kaitap")),
    ("03-apres-prenom", 'document.getElementById("pname").value="Lea";'
                        'document.getElementById("nameform").requestSubmit()'),
]
for ouvrir, fermer in [("toWords", None), ("toVerbs", "backV"), ("toNouns", "backN"), ("toAdj", "backJ"),
                       ("toAdv", "backA"), ("toCon", "backC"), ("toPrep", "backP"), ("toPhr", "backPh"),
                       ("toIdi", "backId"), ("toQty", "backQt"), ("toDict", "backW"),
                       ("toGrammar", "backG"), ("toConj", "backCj"), ("toTests", "backTs"), ("toTY", "backTY"),
                       ("toQuizzes", "backQ"), ("toDIY", "backDY"), ("toT6", "backT6"), ("toTalk", "backTk"),
                       ("toDaily", "backD"), ("toMe", "backMe")]:
    PARCOURS.append((f"{len(PARCOURS) + 1:02d}-{ouvrir}", CLIC.format(ouvrir)))
    if fermer:
        PARCOURS.append((f"{len(PARCOURS) + 1:02d}-{fermer}", CLIC.format(fermer)))

# Hasard reproductible et heure figée : les deux versions tirent les mêmes mots, affichent les mêmes dates.
INIT = """
(() => { let s = 123456789; Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; })();
"""

GLOBALES = r"""
() => {
  const h = s => { let x = 5381; for (let i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) | 0; return (x >>> 0).toString(36) + ":" + s.length; };
  const j = v => { try { return h(JSON.stringify(v)); } catch (e) { return "ERR " + e.message; } };
  const r = {};
  const t = (nom, f) => { try { r[nom] = f(); } catch (e) { r[nom] = "ERR " + e.message; } };
  t("typeof DICT", () => typeof DICT);
  t("DICT.length", () => DICT.length);
  t("NDICT.length", () => NDICT.length);
  t("LESSONS", () => Object.keys(LESSONS).length);
  t("LBANK", () => Object.keys(LBANK).length);
  t("FRT", () => Object.keys(FRT).length);
  t("TTYPE", () => Object.keys(TTYPE).length);
  t("KV", () => Object.keys(KV).length);
  t("SCN", () => Object.keys(SCN).length);
  t("USAGE", () => Object.keys(USAGE).length);
  for (const n of ["ADJ", "ADV", "CON", "PREP", "PHR", "IDI", "QTY"]) t(n + ".data.length", () => eval(n).data.length);
  // empreinte du contenu (après les enrichissements faits au chargement : keys, i, prep…)
  t("#DICT", () => j(DICT)); t("#NDICT", () => j(NDICT)); t("#LESSONS", () => j(LESSONS));
  t("#LBANK", () => j(LBANK)); t("#FRT", () => j(FRT)); t("#TTYPE", () => j(TTYPE)); t("#KV", () => j(KV));
  t("#ADJ", () => j(ADJ.data)); t("#PHR", () => j(PHR.data)); t("#IDI", () => j(IDI.data)); t("#QTY", () => j(QTY.data));
  t("#KINDS", () => j(Object.keys(KINDS))); t("#KSHORT", () => j(KSHORT)); t("#END_L", () => j(END_L));
  // fonctions globales (déclarations function au niveau racine) : mêmes noms, même source
  const fns = Object.keys(window).filter(k => { try { return typeof window[k] === "function"; } catch (e) { return false; } }).sort();
  r["fonctions globales"] = fns.length;
  r["#noms des fonctions"] = h(fns.join(","));
  return r;
}
"""


def serveur(dossier):
    class Silencieux(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):  # pas de journal d'accès
            pass

    gestion = functools.partial(Silencieux, directory=dossier)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), gestion)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}/"


def ancienne_version(ref, tmp):
    """Dossier temporaire : index.html de `ref` + liens vers les médias du dépôt."""
    html = subprocess.run(["git", "-C", RACINE, "show", f"{ref}:index.html"], capture_output=True, check=True).stdout
    with open(os.path.join(tmp, "index.html"), "wb") as fh:
        fh.write(html)
    for nom in os.listdir(RACINE):
        if nom in ("index.html", "css", "js", ".git") or nom.startswith("."):
            continue
        os.symlink(os.path.join(RACINE, nom), os.path.join(tmp, nom))
    return tmp


def parcourir(navigateur, url, dossier_captures):
    ctx = navigateur.new_context(viewport={"width": 412, "height": 915}, device_scale_factor=1,
                                 locale="en-GB", timezone_id="Europe/Paris")
    page = ctx.new_page()
    page.clock.set_fixed_time("2026-10-30T10:00:00+01:00")
    page.add_init_script(INIT)
    # Polices Google : réponse vide et locale (pas de réseau, résultat identique sur les deux versions).
    page.route("**/fonts.googleapis.com/**", lambda r: r.fulfill(status=200, content_type="text/css", body=""))
    page.route("**/fonts.gstatic.com/**", lambda r: r.fulfill(status=404, body=""))
    erreurs = []
    page.on("console", lambda m: m.type == "error" and erreurs.append(f"console : {m.text}"))
    page.on("pageerror", lambda e: erreurs.append(f"JS : {e}"))
    page.goto(url, wait_until="load")
    page.wait_for_timeout(800)
    globales = page.evaluate(GLOBALES)
    etapes = []
    for nom, js in PARCOURS:
        if js:
            try:
                page.evaluate(js)
            except Exception as e:  # noqa: BLE001 - une étape impossible est un résultat, pas un plantage
                erreurs.append(f"étape {nom} : {e}")
        page.wait_for_timeout(350)
        # images (Kai, scènes) chargées avant la capture, sinon l'écart mesure le réseau, pas le code
        page.wait_for_function('() => [...document.images].every(i => i.complete)', timeout=5000)
        page.wait_for_timeout(150)
        actif = page.evaluate('() => { const p = document.querySelector(".page.on"); return p ? p.id : null; }')
        chemin = os.path.join(dossier_captures, nom + ".png")
        page.screenshot(path=chemin, animations="disabled", caret="hide")
        etapes.append((nom, actif, chemin))
    cles = page.evaluate('() => Object.keys(localStorage).filter(k => k.startsWith("kai.")).sort()')
    ctx.close()
    return erreurs, globales, etapes, cles


def ecart_pixels(a, b):
    ia, ib = np.asarray(Image.open(a).convert("RGB")), np.asarray(Image.open(b).convert("RGB"))
    if ia.shape != ib.shape:
        return 1.0
    return float(np.any(ia != ib, axis=2).mean())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", default="sprint-kai-1", help="version de référence (branche, tag ou commit)")
    ap.add_argument("--garder", action="store_true", help="garder le dossier temporaire (captures)")
    args = ap.parse_args()

    tmp = tempfile.mkdtemp(prefix="kai-decoupage-")
    os.makedirs(os.path.join(tmp, "ancien"))
    ancien = ancienne_version(args.ref, os.path.join(tmp, "ancien"))
    os.makedirs(os.path.join(tmp, "captures-ancien"))
    os.makedirs(os.path.join(tmp, "captures-nouveau"))
    srv_a, url_a = serveur(ancien)
    srv_n, url_n = serveur(RACINE)
    problemes = []
    try:
        with sync_playwright() as p:
            nav = p.chromium.launch()
            err_a, glob_a, et_a, cles_a = parcourir(nav, url_a, os.path.join(tmp, "captures-ancien"))
            err_n, glob_n, et_n, cles_n = parcourir(nav, url_n, os.path.join(tmp, "captures-nouveau"))
            nav.close()
    finally:
        srv_a.shutdown()
        srv_n.shutdown()

    print(f"Référence : {args.ref}:index.html   —   Nouvelle version : {RACINE}")
    print(f"Erreurs console/JS : ancienne {len(err_a)}, nouvelle {len(err_n)}")
    for e in err_n:
        problemes.append("nouvelle version, " + e)
    print("\nGlobales clés :")
    for k in glob_a.keys() | glob_n.keys():
        va, vn = glob_a.get(k), glob_n.get(k)
        etat = "OK " if va == vn else "DIF"
        if va != vn:
            problemes.append(f"globale {k} : {va} -> {vn}")
        if not k.startswith("#") or va != vn:
            print(f"  {etat} {k:22} {va}" + ("" if va == vn else f"  ->  {vn}"))
    print(f"  (+ {sum(1 for k in glob_a if k.startswith('#'))} empreintes de contenu comparées)")
    print("\nÉcrans :")
    for (nom, pa, ca), (_, pn, cn) in zip(et_a, et_n):
        ecart = ecart_pixels(ca, cn)
        ok = pa == pn and ecart <= SEUIL_PIXELS
        if not ok:
            problemes.append(f"écran {nom} : page {pa} -> {pn}, {ecart:.2%} de pixels différents")
        print(f"  {'OK ' if ok else 'DIF'} {nom:18} page={pn:13} pixels différents={ecart:.3%}")
    if cles_a != cles_n:
        problemes.append(f"clés localStorage : {cles_a} -> {cles_n}")
    print(f"\nlocalStorage kai.* : {len(cles_n)} clés, {'identiques' if cles_a == cles_n else 'DIFFÉRENTES'}")

    if args.garder or problemes:
        print(f"Captures gardées dans {tmp}")
    else:
        shutil.rmtree(tmp, ignore_errors=True)
    if problemes:
        print("\nÉCHEC :")
        for pb in problemes:
            print("  - " + pb)
        return 1
    print("\nOK : découpage sans changement de comportement visible.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
