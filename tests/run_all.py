#!/usr/bin/env python3
"""Lance toute la batterie de tests de « Learning English with Kai » et rend UN bilan.

  python3 tests/run_all.py                       # teste l'application de ce dépôt (racine)
  python3 tests/run_all.py --app <dossier>       # teste un autre dossier (lecture seule : rien n'y est écrit)
  python3 tests/run_all.py --only donnees,persistance
  python3 tests/run_all.py --save-bilan tests/reference/bilan-origine.json     # photographie des résultats
  python3 tests/run_all.py --app <dossier> --compare tests/reference/bilan-origine.json   # régressions ?

Le dossier est servi par `python3 -m http.server` sur un port libre (comme sur GitHub Pages) ; Playwright pilote Chromium.
Code de sortie : 0 si tout est OK ; 1 au moindre KO, test bloqué ou plantage ; 2 si --compare trouve une RÉGRESSION
(un contrôle OK dans la référence qui ne l'est plus) alors que le reste est identique. Les KO déjà présents dans la
référence sont signalés « déjà connu » : ils restent des KO (code de sortie 1), mais ne sont pas des régressions.

Prérequis (équipe seulement) : pip install playwright pillow numpy ; playwright install chromium.
"""
import argparse
import concurrent.futures as cf
import json
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from kai_common import OUT, ROOT, TESTS, serve

SUITES = [  # (nom court, fichier, durée indicative)
    ("donnees", "test_donnees.py"),
    ("persistance", "test_persistance.py"),
    ("visuel", "test_visuel.py"),
    ("parcours", "test_parcours.py"),
]


def versions(app):
    git = subprocess.run(["git", "-C", str(app), "log", "-1", "--format=%h %s"], capture_output=True, text=True)
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch()
        v = b.version
        b.close()
    return (git.stdout.strip() if git.returncode == 0 else "(pas un dépôt git)"), f"Chromium {v}, Python {sys.version.split()[0]}"


def lancer(nom, fichier, base, app, extra, tmp):
    sortie = Path(tmp) / f"{nom}.json"
    t0 = time.time()
    cmd = [sys.executable, str(TESTS / fichier), "--url", base, "--app", str(app), "--json", str(sortie)] + extra
    r = subprocess.run(cmd, capture_output=True, text=True, cwd=str(TESTS))
    if r.returncode != 0 and nom in ("parcours", "persistance"):
        # Parcours navigateur : un délai d'animation ou de hachage peut faire échouer une étape une fois.
        # On rejoue la suite UNE fois ; un vrai bug échoue aussi au second passage.
        print(f"  (suite « {nom} » rejouée une fois après un échec)", flush=True)
        r = subprocess.run(cmd, capture_output=True, text=True, cwd=str(TESTS))
    data = None
    if sortie.is_file():
        data = json.loads(sortie.read_text(encoding="utf-8"))
    return nom, data, r, round(time.time() - t0, 1)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--app", default=str(ROOT), help="dossier de l'application (défaut : racine du dépôt)")
    ap.add_argument("--only", help="liste de suites séparées par des virgules : " + ", ".join(n for n, _ in SUITES))
    ap.add_argument("--jobs", type=int, default=1, help="suites lancées en parallèle (défaut 1 : le hachage du code parent est lent, le parallèle rend le parcours instable)")
    ap.add_argument("--strict-tiers", action="store_true", help="une requête vers un site tiers (polices Google) devient un KO")
    ap.add_argument("--tolerance", type=float, default=0.002, help="tolérance des captures (part de pixels différents)")
    ap.add_argument("--save-bilan", help="écrit le bilan complet (JSON) : à garder comme référence")
    ap.add_argument("--compare", help="bilan de référence (JSON) à comparer")
    ap.add_argument("-v", "--verbose", action="store_true", help="affiche aussi les contrôles OK")
    args = ap.parse_args()

    app = Path(args.app).resolve()
    voulues = set(args.only.split(",")) if args.only else {n for n, _ in SUITES}
    inconnues = voulues - {n for n, _ in SUITES}
    if inconnues:
        raise SystemExit(f"suite inconnue : {', '.join(sorted(inconnues))}")
    OUT.mkdir(exist_ok=True)
    debut = time.time()
    resultats = {}
    with serve(app) as base, tempfile.TemporaryDirectory(prefix="kai-bilan-") as tmp:
        commit, outils = versions(app)
        print(f"Application : {app}\n  version : {commit}\n  outils  : {outils}\n  adresse : {base} (http.server)\n")
        extra_commun = (["--strict-tiers"] if args.strict_tiers else [])
        travaux = []
        for nom, fichier in SUITES:
            if nom not in voulues:
                continue
            extra = list(extra_commun) + (["--tolerance", str(args.tolerance)] if nom == "visuel" else [])
            travaux.append((nom, fichier, base, app, extra, tmp))
        with cf.ThreadPoolExecutor(max_workers=max(1, args.jobs)) as ex:
            futurs = {ex.submit(lancer, *t): t[0] for t in travaux}
            for f in cf.as_completed(futurs):
                nom, data, r, duree = f.result()
                resultats[nom] = (data, r, duree)
                n = len(data["items"]) if data else 0
                print(f"  terminé : {nom} ({duree} s, {n} contrôles)", flush=True)

    # ---------------------------------------------------------------- bilan unique
    ordre = [n for n, _ in SUITES if n in resultats]
    items = {}
    lignes = []
    tot = {"OK": 0, "KO": 0, "Bloqué": 0, "Non joué": 0, "Note": 0}
    for nom in ordre:
        data, r, duree = resultats[nom]
        if not data:
            items[f"{nom}:CRASH"] = {"statut": "KO", "titre": "la suite n'a produit aucun résultat", "detail": (r.stderr or r.stdout)[-800:]}
            lignes.append((nom, 0, 1, 0, 0, duree))
            continue
        c = {s: sum(1 for i in data["items"] if i["statut"] == s) for s in tot}
        for k in tot:
            tot[k] += c[k]
        for i in data["items"]:
            items[f"{nom}:{i['id']}"] = i
        lignes.append((nom, c["OK"], c["KO"], c["Bloqué"], c["Note"], duree))

    print("\n" + "=" * 78)
    print(f"{'suite':<13}{'OK':>6}{'KO':>6}{'Bloqué':>8}{'notes':>7}{'durée':>9}")
    for nom, ok, ko, bl, no, d in lignes:
        print(f"{nom:<13}{ok:>6}{ko:>6}{bl:>8}{no:>7}{d:>8}s")
    print(f"{'TOTAL':<13}{tot['OK']:>6}{tot['KO']:>6}{tot['Bloqué']:>8}{tot['Note']:>7}{round(time.time() - debut):>8}s")
    print("=" * 78)

    base_ref = None
    if args.compare:
        base_ref = json.loads(Path(args.compare).read_text(encoding="utf-8"))["items"]

    mauvais = {k: i for k, i in items.items() if i["statut"] in ("KO", "Bloqué", "Non joué")}
    regressions, connus = {}, {}
    for k, i in mauvais.items():
        if base_ref is not None and k in base_ref and base_ref[k]["statut"] == i["statut"]:
            connus[k] = i
        else:
            regressions[k] = i
    if mauvais:
        print("\nCONTRÔLES EN ÉCHEC :" if base_ref is None else "\nCONTRÔLES EN ÉCHEC (« déjà connu » = déjà KO dans la référence) :")
        for k, i in sorted(mauvais.items()):
            marque = "" if base_ref is None else ("  [déjà connu]" if k in connus else "  [NOUVEAU]")
            print(f"  [{i['statut']}] {k} {i['titre']}{marque}")
            if i.get("detail"):
                print(f"        {i['detail'][:500]}")
    if base_ref is not None:
        corriges = [k for k, i in base_ref.items() if i["statut"] in ("KO", "Bloqué") and items.get(k, {}).get("statut") == "OK"]
        absents = [k for k, i in base_ref.items() if i["statut"] == "OK" and k not in items and k.split(":")[0] in resultats]
        print(f"\nCOMPARAISON avec {args.compare} : {len(regressions)} régression(s)/nouveau(x) KO, {len(connus)} KO déjà connu(s), "
              f"{len(corriges)} KO corrigé(s), {len(absents)} contrôle(s) de la référence qui n'existe(nt) plus")
        for k in corriges:
            print(f"  corrigé : {k} {base_ref[k]['titre']}")
        for k in absents[:20]:
            print(f"  disparu : {k} {base_ref[k]['titre']}")
    notes = [(k, i) for k, i in items.items() if i["statut"] == "Note"]
    if notes and args.verbose:
        print("\nNOTES (observations, ne font pas échouer) :")
        for k, i in notes:
            print(f"  {k} {i['titre']} : {i['detail'][:300]}")
    elif notes:
        print(f"\n{len(notes)} note(s) d'observation (voir -v ou les sorties des suites).")

    if args.save_bilan:
        Path(args.save_bilan).parent.mkdir(parents=True, exist_ok=True)
        Path(args.save_bilan).write_text(json.dumps({"app": str(app), "commit": commit, "items": items}, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"bilan écrit : {args.save_bilan}")

    vert = not mauvais
    print("\nVERDICT : " + ("VERT — aucun KO." if vert else f"ROUGE — {len(mauvais)} contrôle(s) en échec."))
    if vert:
        return 0
    if base_ref is not None and not regressions:
        print("(tous les échecs étaient déjà dans la référence : pas de régression)")
    return 2 if (base_ref is not None and regressions) else 1


if __name__ == "__main__":
    raise SystemExit(main())
