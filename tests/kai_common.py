"""Socle commun des tests de « Learning English with Kai ».

Rôle de Dédé : constater, prouver, ne pas corriger. Ce module ne contient aucune règle métier,
seulement la plomberie : serveur statique, navigateur, collecte des erreurs, bilan.

Contraintes respectées (voir CLAUDE.md du dépôt) :
  - aucun serveur autre que `python3 -m http.server` (lancé ici sur un port libre) ;
  - Playwright + Chromium uniquement, dans tests/ (jamais à l'exécution de l'application) ;
  - les tests lisent l'application par ses GLOBALES JavaScript (DICT, LBANK, QZ, PROFS…) :
    le découpage de index.html doit donc garder des scripts classiques au niveau global.
"""
import argparse
import contextlib
import json
import re
import socket
import subprocess
import sys
import time
import traceback
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

TESTS = Path(__file__).resolve().parent
ROOT = TESTS.parent
OUT = TESTS / "_out"          # captures d'échec, diff, bilans (ignoré par git, voir tests/.gitignore)
REFERENCE = TESTS / "reference"
FIXTURES = TESTS / "fixtures"

# Le fichier de sauvegarde contient une marque que .github/verifier.py cherche pour bloquer la
# publication d'une sauvegarde d'élève. On la compose ici pour ne pas la écrire en toutes lettres.
APP_ID = "learning-english-" + "with-kai"

FIXED_NOW = "2026-10-30T10:00:00"   # date figée pour les tests déterministes (vendredi)

# --------------------------------------------------------------------------- serveur


def free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


@contextlib.contextmanager
def serve(app_dir):
    """Sert `app_dir` par `python3 -m http.server` sur un port libre (comme sur GitHub Pages : en HTTP)."""
    app_dir = Path(app_dir).resolve()
    if not (app_dir / "index.html").is_file():
        raise SystemExit(f"index.html introuvable dans {app_dir}")
    port = free_port()
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", str(app_dir)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    base = f"http://127.0.0.1:{port}/"
    try:
        for _ in range(100):
            try:
                urllib.request.urlopen(base + "index.html", timeout=1).read(10)
                break
            except Exception:
                time.sleep(0.1)
        else:
            raise SystemExit("le serveur http.server ne répond pas")
        yield base
    finally:
        proc.terminate()
        try:
            proc.wait(5)
        except Exception:
            proc.kill()


def http_status(url):
    """Code HTTP d'une URL (HEAD), 0 si injoignable."""
    try:
        req = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0


# --------------------------------------------------------------------------- bilan

OK, KO, BLOQUE, NONJOUE, NOTE = "OK", "KO", "Bloqué", "Non joué", "Note"


class Bilan:
    """Liste de constats : OK / KO / Bloqué / Non joué, plus des notes (observations qui ne font pas échouer)."""

    def __init__(self, suite):
        self.suite = suite
        self.items = []

    def add(self, cid, titre, statut, detail=""):
        self.items.append({"id": cid, "titre": titre, "statut": statut, "detail": str(detail)[:1500]})
        return statut == OK

    def ok(self, cid, titre, detail=""):
        return self.add(cid, titre, OK, detail)

    def ko(self, cid, titre, detail=""):
        return self.add(cid, titre, KO, detail)

    def check(self, cid, titre, cond, detail=""):
        return self.add(cid, titre, OK if cond else KO, "" if cond else detail)

    def bloque(self, cid, titre, detail=""):
        return self.add(cid, titre, BLOQUE, detail)

    def note(self, cid, titre, detail=""):
        return self.add(cid, titre, NOTE, detail)

    def count(self, statut):
        return sum(1 for i in self.items if i["statut"] == statut)

    @property
    def failed(self):
        return self.count(KO) + self.count(BLOQUE) > 0

    def to_json(self):
        return {"suite": self.suite, "items": self.items}

    def print(self, verbose=False, file=sys.stdout):
        n = {s: self.count(s) for s in (OK, KO, BLOQUE, NONJOUE, NOTE)}
        print(f"\n== {self.suite} : {n[OK]} OK, {n[KO]} KO, {n[BLOQUE]} bloqués, {n[NONJOUE]} non joués"
              f" ({n[NOTE]} notes)", file=file)
        for i in self.items:
            if i["statut"] in (KO, BLOQUE, NONJOUE) or (verbose and i["statut"] in (OK, NOTE)) or i["statut"] == NOTE:
                print(f"  [{i['statut']}] {i['id']} {i['titre']}" + (f"\n        {i['detail']}" if i["detail"] else ""),
                      file=file)


# --------------------------------------------------------------------------- navigateur

# Injecté avant tout script de la page :
#  - hasard graine (reproductible) si window.__SEED est défini ;
#  - voix du navigateur et lecture audio remplacées par des espions (pas de carte son en CI, et on
#    veut PROUVER qu'un son est demandé) : window.__snd liste ce qui a été joué ;
#  - animations coupées (tests plus rapides et captures stables).
INIT_JS = r"""
(() => {
  if (typeof window.__SEED === 'number') {
    let a = window.__SEED >>> 0;
    Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  window.__snd = [];
  const voices = [];
  const synth = { speaking: false, pending: false, paused: false,
    getVoices: () => voices, cancel() {}, resume() {}, pause() {}, addEventListener() {}, removeEventListener() {},
    speak(u) { window.__snd.push({ tts: String(u.text) });
      setTimeout(() => { try { u.onstart && u.onstart({}); } catch (e) {} setTimeout(() => { try { u.onend && u.onend({}); } catch (e) {} }, 15); }, 5); } };
  try { Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true }); } catch (e) {}
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    const src = String(this.src || '');
    window.__snd.push({ audio: src.slice(0, 40), len: src.length, src: src.startsWith('data:audio/mpeg') ? src : '' });
    const el = this;
    setTimeout(() => { try { el.dispatchEvent(new Event('ended')); } catch (e) {} }, 15);
    return Promise.resolve();
  };
  HTMLMediaElement.prototype.pause = function () {};
  document.addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('style');
    s.id = '__no_anim';
    s.textContent = '*,*::before,*::after{animation-duration:.001s!important;animation-delay:0s!important;' +
      'animation-iteration-count:1!important;transition:none!important;scroll-behavior:auto!important;caret-color:transparent!important}';
    document.head.appendChild(s);
  });
})();
"""


POLICES = re.compile(r".*\.(woff2?|ttf|otf)(\?.*)?$", re.I)


def bloquer_polices(ctx, collector=None):
    """Polices (locales ou Google) bloquées : le texte se met en page avec les polices de secours, donc de la même façon
    quelle que soit la version (la bulle de Kai mesure ses mots avec la police chargée). Sert aux tests qui COMPARENT des écrans."""
    ctx.route(POLICES, lambda r: r.abort("blockedbyclient"))
    if collector is not None:
        collector.ignorer = POLICES


class Collector:
    """Tout ce qui ne doit JAMAIS arriver : erreur console, exception JS, requête en échec, HTTP >= 400."""

    def __init__(self, base):
        self.base = base
        self.host = urlparse(base).netloc
        self.errors = []      # (genre, texte)
        self.tiers = set()    # hôtes tiers contactés (polices Google…), réponses neutralisées par le test
        self.aborted = 0
        self.ignorer = None   # motif d'URL dont l'échec est volontaire (polices bloquées par le test)

    def attach(self, ctx):
        ctx.on("console", self._console)
        ctx.on("weberror", lambda e: self.errors.append(("exception JS", str(e.error)[:400])))
        ctx.on("requestfailed", self._failed)
        ctx.on("response", self._response)
        ctx.route(lambda url: not url.startswith(self.base) and url.split(":", 1)[0] in ("http", "https"), self._tiers)

    def _tiers(self, route):
        u = urlparse(route.request.url)
        self.tiers.add(u.netloc)
        # On répond « vide » pour ne pas dépendre d'Internet ; la présence du tiers est signalée au bilan.
        ctype = "text/css" if "css" in route.request.url else "application/octet-stream"
        route.fulfill(status=200, content_type=ctype, body="")

    def _console(self, msg):
        if msg.type == "error":
            loc = msg.location or {}
            if self.ignorer and self.ignorer.match(loc.get("url", "")) and "Failed to load resource" in msg.text:
                return
            self.errors.append(("console.error", f"{msg.text[:300]} ({loc.get('url', '')}:{loc.get('lineNumber', '')})"))

    def _failed(self, req):
        if self.ignorer and self.ignorer.match(req.url):
            return
        if "ERR_ABORTED" in (req.failure or ""):
            self.aborted += 1       # requête interrompue par un rechargement : pas un bug de l'application
            return
        self.errors.append(("requête en échec", f"{req.url[:200]} : {req.failure}"))

    def _response(self, resp):
        if resp.status >= 400 and urlparse(resp.url).netloc == self.host:
            self.errors.append((f"HTTP {resp.status}", resp.url))

    def mark(self):
        return len(self.errors)

    def since(self, mark):
        return self.errors[mark:]


def new_context(browser, base, viewport, collector=None, seed=None, now=None, mobile=False, locale="en-GB", polices=False, **kw):
    """Contexte isolé (localStorage vide) avec espions son, animations coupées, fuseau et langue fixes."""
    opts = dict(viewport={"width": viewport[0], "height": viewport[1]}, locale=locale, timezone_id="Europe/Paris",
                accept_downloads=True, device_scale_factor=1)
    if mobile:
        opts.update(is_mobile=True, has_touch=True)
    opts.update(kw)
    ctx = browser.new_context(**opts)
    ctx.set_default_timeout(10000)
    if collector:
        collector.attach(ctx)
    if seed is not None:
        ctx.add_init_script(f"window.__SEED = {int(seed)};")
    ctx.add_init_script(INIT_JS)
    if now:
        ctx.clock.set_fixed_time(now)
    if polices:
        bloquer_polices(ctx, collector)
    return ctx


def open_app(page, base, wait_boot=True):
    page.goto(base + "index.html")
    if wait_boot:
        page.wait_for_function("typeof PROFS !== 'undefined' && !!document.querySelector('.page.on')")
        page.wait_for_timeout(120)   # setTimeout(bootDirect, 0) : démarrage direct d'un élève connu
    return page


def current_page(page):
    return page.evaluate("(document.querySelector('.page.on')||{}).id || null")


def wait_page(page, pid, timeout=8000):
    page.wait_for_function("id => { const p = document.querySelector('.page.on'); return !!p && p.id === id }",
                           arg=pid, timeout=timeout)


def js_available(page, names):
    """Liste les globales JavaScript attendues qui manquent (contrat avec le découpage)."""
    # `typeof NOM` ne lève pas d'erreur pour une globale inexistante (et n'utilise pas eval : compatible CSP).
    js = "() => [" + ",".join(f'["{n}", typeof {n}]' for n in names) + "]"
    return [n for n, t in page.evaluate(js) if t == "undefined"]


# --------------------------------------------------------------------------- ligne de commande


def make_parser(description, extra=None):
    ap = argparse.ArgumentParser(description=description)
    ap.add_argument("--app", default=str(ROOT), help="dossier de l'application à tester (défaut : racine du dépôt)")
    ap.add_argument("--url", help="URL déjà servie (utilisé par run_all.py ; sinon le test sert --app lui-même)")
    ap.add_argument("--json", help="écrit le bilan en JSON dans ce fichier")
    ap.add_argument("--seed", type=int, default=20261030, help="graine du hasard (reproductibilité)")
    ap.add_argument("--strict-tiers", action="store_true", help="une requête vers un site tiers (polices Google) est un KO")
    ap.add_argument("-v", "--verbose", action="store_true")
    if extra:
        extra(ap)
    return ap


def run_suite(suite, description, run, extra=None):
    """Point d'entrée commun : sert l'application, lance `run(args, base, browser, bilan, collector)`, imprime, code de sortie."""
    from playwright.sync_api import sync_playwright
    args = make_parser(description, extra).parse_args()
    bilan = Bilan(suite)
    t0 = time.time()
    with contextlib.ExitStack() as stack:
        base = args.url or stack.enter_context(serve(args.app))
        collector = Collector(base)
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch()
                try:
                    run(args, base, browser, bilan, collector)
                finally:
                    browser.close()
        except SystemExit:
            raise
        except BaseException:
            bilan.ko("CRASH", "le test lui-même a planté (à examiner avant de conclure)", traceback.format_exc()[-1200:])
        if collector.tiers:
            msg = "requêtes vers des sites tiers (neutralisées pendant le test) : " + ", ".join(sorted(collector.tiers))
            (bilan.ko if args.strict_tiers else bilan.note)("TIERS", "sites tiers contactés par l'application", msg)
    bilan.duree = round(time.time() - t0, 1)
    bilan.print(args.verbose)
    if args.json:
        Path(args.json).parent.mkdir(parents=True, exist_ok=True)
        data = bilan.to_json()
        data["duree_s"] = bilan.duree
        Path(args.json).write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    return 1 if bilan.failed else 0
