#!/usr/bin/env python3
"""Captures de référence des écrans principaux (390 px « téléphone » et 1280 px « ordinateur ») et comparaison au pixel.

  python3 tests/test_visuel.py [--app <dossier>] [--tolerance 0.002] [--only 390|1280] [--update]

  --update   régénère tests/reference/*.png. À faire UNIQUEMENT sur la version d'origine (51efca8), ou après une
             évolution VOULUE de l'interface validée par le PO (le dire dans le commit).

Principe : mêmes données (progression de référence), même date figée (30/10/2026 10:00), hasard gradué, animations
coupées, voix remplacées par des espions. Une capture est « identique » si au plus `tolerance` (0,2 % par défaut)
des pixels diffèrent de plus de 24/255 sur un canal. En cas d'écart : tests/_out/diff-<écran>.png (référence | obtenu | écarts).

Polices : volontairement NEUTRALISÉES (Google Fonts et fichiers de police locaux sont bloqués) pour que la comparaison
ne dépende ni du réseau ni de l'auto-hébergement des polices (Ani) : on compare la mise en page, pas la typographie.
Le chargement des polices est vérifié ailleurs (test_donnees DN-65, 0 requête en 404 dans test_parcours).
Écrans à contenu tiré au hasard (questions de quiz, de leçon, de test, « Let's talk ») : exclus, volontairement.
"""
import json
import re
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

from kai_common import FIXED_NOW, OUT, REFERENCE, Bilan, new_context, open_app, run_suite, wait_page
from test_persistance import FIXTURE, SEED, fabrique_parcours

VIEWPORTS = {"390": (390, 844), "1280": (1280, 800)}
SEUIL_CANAL = 24

def neutraliser(ctx):
    """Plus de polices (locales ou Google), plus de voix lourdes : rendu identique d'une version à l'autre."""
    ctx.route(re.compile(r".*/voice/kai-\d+\.json$"), lambda r: r.fulfill(status=200, content_type="application/json", body="{}"))


def prete(P):
    p = P.page
    p.wait_for_load_state("networkidle", timeout=15000)
    p.wait_for_function("document.documentElement.classList.contains('emo-no') || document.documentElement.classList.contains('emo-ok')", timeout=9000)
    p.evaluate("() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); scrollTo(0, 0) }")
    p.wait_for_timeout(250)


def photo(P, nom, taille, full=False):
    P.page.evaluate("() => scrollTo(0, 0)")
    P.page.wait_for_timeout(120)
    chemin = Path(P.tmpdir) / f"{nom}-{taille}.png"
    P.page.screenshot(path=str(chemin), full_page=full, animations="disabled", caret="hide")
    return chemin


def comparer(ref, neuf, nom, tolerance):
    """(ok, détail) ; écrit un diff si écart."""
    a = Image.open(ref).convert("RGB")
    b = Image.open(neuf).convert("RGB")
    if a.size != b.size:
        sauver_diff(a, b, None, nom)
        return False, f"dimensions différentes : référence {a.size}, obtenu {b.size}"
    x, y = np.asarray(a, dtype=np.int16), np.asarray(b, dtype=np.int16)
    ecart = np.abs(x - y).max(axis=2) > SEUIL_CANAL
    ratio = float(ecart.mean())
    if ratio <= tolerance:
        return True, f"{ratio * 100:.3f} % de pixels différents"
    sauver_diff(a, b, ecart, nom)
    ys, xs = np.where(ecart)
    return False, (f"{ratio * 100:.2f} % de pixels différents (> {tolerance * 100:.2f} %), zone x {xs.min()}–{xs.max()}, y {ys.min()}–{ys.max()} ; "
                   f"voir tests/_out/diff-{nom}.png")


def sauver_diff(a, b, ecart, nom):
    OUT.mkdir(exist_ok=True)
    w, h = a.size[0] + b.size[0] + (a.size[0] if ecart is not None else 0) + 20, max(a.size[1], b.size[1])
    toile = Image.new("RGB", (w, h), (255, 0, 255))
    toile.paste(a, (0, 0))
    toile.paste(b, (a.size[0] + 10, 0))
    if ecart is not None:
        rouge = np.full(ecart.shape + (3,), 255, dtype=np.uint8)
        rouge[ecart] = (220, 0, 0)
        toile.paste(Image.fromarray(rouge), (a.size[0] + b.size[0] + 20, 0))
    toile.save(OUT / f"diff-{nom}.png")


# --------------------------------------------------------------------------- les écrans


def ecrans_vierges(P, cap):
    p = P.page
    open_app(p, P.base)
    prete(P)
    cap("accueil")
    p.locator("#kaitap").click()
    wait_page(p, "hello")
    prete(P)
    cap("hello-premier-lancement")


def ecrans_eleve(P, cap):
    p = P.page
    open_app(p, P.base)
    p.wait_for_selector("#plist")
    prete(P)
    cap("qui-apprend")
    p.locator("#plist [data-pid]").first.click()
    wait_page(p, "daily")
    prete(P)
    cap("daily-today", full=True)
    P.click('[data-dtab="cal"]')
    prete(P)
    cap("daily-calendrier", full=True)
    P.click('[data-dtab="today"]')
    p.evaluate("() => show('menu')")
    P.on("menu")
    prete(P)
    cap("menu")

    def aller(tuile, page_id, nom, retour="menu", full=False, apres=None):
        P.click(f"#{tuile}")
        P.on(page_id)
        if apres:
            apres()
        prete(P)
        cap(nom, full=full)

    aller("toWords", "words", "words")
    p.locator("#wq").fill("go")
    prete(P)
    cap("words-recherche-go")
    p.locator("#wq").fill("")
    P.click("#toVerbs"); P.on("verbs"); prete(P); cap("verbes")
    P.back("words")
    P.click("#toNouns"); P.on("nouns"); prete(P); cap("noms")
    P.back("words")
    P.click("#toPrep"); P.on("prepositions"); prete(P); cap("prepositions")
    P.back("words")
    P.click("#toIdi"); P.on("idioms"); prete(P); cap("idioms")
    P.back("words"); P.back("menu")
    aller("toConj", "conj", "conjugaison")
    P.click('[data-lesson="be"]'); P.on("lesson"); prete(P); cap("lecon-be")
    P.back("conj"); P.back("menu")
    aller("toGrammar", "grammar", "grammaire")
    P.back("menu")
    aller("toTests", "tests", "mes-tests")
    P.back("menu")
    aller("toTY", "ty", "test-yourself")
    P.click("#toQuizzes"); P.on("quizzes"); prete(P); cap("quiz-liste")
    P.click("#toQV"); P.on("quiz"); prete(P); cap("quiz-themes")
    P.back("quizzes"); P.back("ty")
    P.click("#toT6"); P.on("t6"); prete(P); cap("controles-6e")
    P.back("ty"); P.back("menu")
    P.click("#toMe"); P.on("me"); prete(P); cap("me", full=True)
    P.click("#mePcChg")
    p.locator("#modal.on").wait_for(); p.wait_for_timeout(300); prete(P); cap("fenetre-code-parent")
    p.keyboard.press("Escape")
    P.back("menu")
    P.click("#toDaily"); P.on("daily")
    p.locator('#dailybody [data-help="rewards"]').first.click()
    p.locator("#modal.on").wait_for(); p.wait_for_timeout(300); prete(P); cap("aide-recompenses")


def run(args, base, browser, bilan, collector):
    REFERENCE.mkdir(exist_ok=True)
    if not FIXTURE.is_file():
        bilan.ko("VI-00", "Progression de référence absente (tests/fixtures/progression-reference.json)", "lancer test_persistance.py --update-fixture")
        return
    ls = json.loads(FIXTURE.read_text(encoding="utf-8"))["ls"]
    for label, vp in VIEWPORTS.items():
        if args.only and args.only != label:
            continue
        for groupe, fn, donnees in (("vierge", ecrans_vierges, {}), ("eleve", ecrans_eleve, ls)):
            ctx = new_context(browser, base, vp, collector, seed=SEED, now=FIXED_NOW, mobile=vp[0] < 600, polices=True)
            ctx.add_init_script("(() => { try { if (!sessionStorage.getItem('__seeded')) { localStorage.clear(); const d = "
                                + json.dumps(donnees) + "; for (const k in d) localStorage.setItem(k, d[k]); sessionStorage.setItem('__seeded', '1'); } } catch (e) {} })();")
            neutraliser(ctx)
            P = fabrique_parcours(base, browser, Bilan("x"), collector, ctx, label=label)
            P.tmpdir = tempfile.mkdtemp(prefix="kai-visuel-")
            mark = collector.mark()

            def cap(nom, full=False, P=P, label=label):
                neuf = photo(P, nom, label, full)
                ref = REFERENCE / f"{nom}-{label}.png"
                if args.update:
                    Image.open(neuf).convert("RGB").save(ref, optimize=True)
                    bilan.ok(f"VI-{nom}@{label}", f"référence écrite : {ref.name}", f"{Image.open(ref).size}")
                    return
                if not ref.is_file():
                    bilan.ko(f"VI-{nom}@{label}", f"écran « {nom} » ({label} px)", f"référence absente : {ref.name} (lancer --update sur la version d'origine)")
                    return
                ok, detail = comparer(ref, neuf, f"{nom}-{label}", args.tolerance)
                bilan.add(f"VI-{nom}@{label}", f"écran « {nom} » ({label} px) identique à la référence", "OK" if ok else "KO", "" if ok else detail)

            try:
                fn(P, cap)
            except Exception as ex:   # noqa: BLE001
                bilan.ko(f"VI-crash-{groupe}@{label}", f"parcours des écrans ({groupe}, {label} px) interrompu", f"{type(ex).__name__}: {str(ex)[:500]}")
                try:
                    OUT.mkdir(exist_ok=True)
                    P.page.screenshot(path=str(OUT / f"echec-visuel-{groupe}-{label}.png"))
                except Exception:   # noqa: BLE001
                    pass
            finally:
                ctx.close()
            erreurs = collector.since(mark)
            bilan.check(f"VI-err-{groupe}@{label}", f"{groupe} {label} px : aucune erreur console / JS pendant la prise de vues", not erreurs,
                        "; ".join(f"[{g}] {t}" for g, t in erreurs[:4]))
            del collector.errors[mark:]


def extra(ap):
    ap.add_argument("--update", action="store_true", help="régénère les références (version d'origine ou évolution voulue)")
    ap.add_argument("--tolerance", type=float, default=0.002, help="part maximale de pixels différents (défaut 0,002 = 0,2 %%)")
    ap.add_argument("--only", choices=list(VIEWPORTS))


if __name__ == "__main__":
    raise SystemExit(run_suite("Visuel", __doc__, run, extra))
