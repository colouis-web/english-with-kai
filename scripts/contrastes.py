"""Mesure les contrastes de couleur (WCAG 2.x) de l'application, écran par écran.

Outil de développement (hors exécution de l'application) : Playwright + Chromium, serveur `python3 -m http.server`
sur un port libre. Pour chaque écran visité, on prend tous les textes visibles, on calcule la couleur du texte et
la couleur de fond réellement affichée (fonds semi-transparents composés), puis le rapport de contraste.
Seuils : 4,5:1 (texte normal), 3:1 (grand texte : >= 24 px, ou >= 18,66 px en gras).
Les textes posés sur une image (background-image, <img>) ne sont pas mesurables ici : ils sont listés à part.

Usage : python3 scripts/contrastes.py [--largeur 390 --hauteur 844] [--verbeux]
Sortie : liste des couples sous le seuil (couleur, fond, rapport, extrait) ; code de sortie 1 s'il y en a.
"""
import argparse
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

RACINE = Path(__file__).resolve().parent.parent

# Relevé dans le navigateur : un enregistrement par élément qui porte du texte direct.
JS_RELEVE = r"""
() => {
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const over = (f, b) => { const a = f[3]; return [0, 1, 2].map(i => f[i] * a + b[i] * (1 - a)).concat([1]); };
  const fond = el => {            // fond effectif : on remonte en composant les fonds semi-transparents
    let pile = [], img = false;
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e), bg = parse(cs.backgroundColor);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') img = true;
      if (bg && bg[3] > 0) { pile.push(bg); if (bg[3] === 1) break; }
    }
    let r = [255, 255, 255, 1];
    for (let i = pile.length - 1; i >= 0; i--) r = over(pile[i], r);
    return { bg: r, img };
  };
  const out = [], vu = new Set();
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    const t = n.nodeValue.trim(); if (!t) continue;
    const el = n.parentElement; if (!el || vu.has(el)) continue;
    const page = el.closest('.page'); if (page && !page.classList.contains('on')) continue;
    if (el.closest('[hidden],script,style,#toast:empty')) continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    if (el.closest('button:disabled,[aria-hidden="true"]')) continue;
    let op = 1; for (let e = el; e; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity);
    const isSvg = el instanceof SVGElement;
    const fg = parse(isSvg ? cs.fill : cs.color); if (!fg) continue;
    const { bg, img } = fond(el);
    const f = fg[3] < 1 || op < 1 ? over([fg[0], fg[1], fg[2], fg[3] * op], bg) : fg;
    vu.add(el);
    out.push({ txt: t.slice(0, 40), fg: f.slice(0, 3), bg: bg.slice(0, 3), px: parseFloat(cs.fontSize),
               bold: parseInt(cs.fontWeight, 10) >= 700, img,
               sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '') });
  }
  return out;
}
"""


def luminance(c):
    def lin(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(x) for x in c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def rapport(a, b):
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def hexa(c):
    return "#%02x%02x%02x" % tuple(round(x) for x in c)


def port_libre():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    p = s.getsockname()[1]
    s.close()
    return p


def attendre(page, pid):
    page.wait_for_function("id => (document.querySelector('.page.on') || {}).id === id", arg=pid, timeout=8000)
    page.wait_for_timeout(450)  # fin de l'animation d'entrée de page


def clic_et_attendre(page, selecteur, pid):
    page.locator(selecteur).first.click()
    attendre(page, pid)


def retour(page, pid):
    page.locator(".page.on .back").first.click()
    attendre(page, pid)


def parcours(page, mesurer):
    """Visite les écrans principaux (l'ordre compte : on revient toujours au menu)."""
    page.locator("#kaitap").click()
    attendre(page, "hello")
    mesurer("hello")
    page.locator("#pname").fill("Test")
    page.locator('[data-hlv="0"]').click()
    page.locator("#nameform .listen").click()
    attendre(page, "menu")
    mesurer("menu")
    for bouton, pid, nom in [("#toDaily", "daily", "daily"), ("#toGrammar", "grammar", "grammar"), ("#toConj", "conj", "conj"),
                             ("#toTests", "tests", "tests"), ("#toWords", "words", "words")]:
        clic_et_attendre(page, bouton, pid)
        mesurer(nom)
        if nom == "daily":
            page.locator('[data-mood="good"]').first.click()
            page.wait_for_timeout(300)
            mesurer("daily-humeur")
            page.locator('[data-dtab="cal"]').click()
            page.wait_for_timeout(300)
            mesurer("daily-calendrier")
        if nom in ("grammar", "conj"):
            page.locator("[data-les], .tense, .gtile, [data-lid]").first.click()
            page.wait_for_timeout(600)
            mesurer(nom + "-lecon")
            retour(page, nom)
        if nom == "words":
            for b, p, n in [("#toNouns", "nouns", "nouns"), ("#toVerbs", "verbs", "verbs"), ("#toAdj", "adjectives", "adjectives")]:
                try:
                    clic_et_attendre(page, b, p)
                    mesurer(n)
                    retour(page, "words")
                except Exception as e:  # un écran introuvable ne doit pas arrêter la mesure
                    print("  (écran ignoré :", n, str(e)[:60], ")")
        retour(page, "menu")
    clic_et_attendre(page, "#toTY", "ty")
    mesurer("ty")
    clic_et_attendre(page, "#toQuizzes", "quizzes")
    mesurer("quizzes")
    clic_et_attendre(page, "#toQN", "quiz")
    mesurer("quiz-choix")
    page.locator(".topic.noi, .topic").first.click()
    page.wait_for_selector("#opts .opt")
    vus = set()
    for i in range(8):             # on répond au hasard jusqu'à avoir vu une bonne ET une mauvaise réponse
        page.locator("#opts .opt").nth(i % 3).click()
        page.wait_for_selector("#qnext")
        etat = "faux" if page.locator("#opts .opt.wrong").count() else "juste"
        if etat not in vus:
            vus.add(etat)
            mesurer("quiz-" + etat)
        if len(vus) == 2:
            break
        page.click("#qnext")
        page.wait_for_selector("#opts .opt")
    retour(page, "quizzes")
    retour(page, "ty")
    clic_et_attendre(page, "#toTalk", "talk")
    mesurer("talk")
    page.fill("#tktext", "kai see elephant big")
    page.click("#tkcheck")
    page.wait_for_selector("#tkfb .tkres")
    page.wait_for_timeout(300)
    mesurer("talk-resultat")
    retour(page, "ty")
    retour(page, "menu")
    page.locator("#toMe").click()
    attendre(page, "me")
    mesurer("me")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--largeur", type=int, default=390)
    ap.add_argument("--hauteur", type=int, default=844)
    ap.add_argument("--verbeux", action="store_true", help="affiche aussi le pire couple de chaque écran")
    a = ap.parse_args()
    port = port_libre()
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", str(RACINE)],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    base = f"http://127.0.0.1:{port}/"
    for _ in range(100):
        try:
            urllib.request.urlopen(base + "index.html", timeout=1).read(5)
            break
        except Exception:
            time.sleep(0.1)
    mauvais, sur_image, total, vus = [], 0, 0, set()
    try:
        with sync_playwright() as p:
            nav = p.chromium.launch()
            ctx = nav.new_context(viewport={"width": a.largeur, "height": a.hauteur}, locale="en-GB",
                                  reduced_motion="reduce")  # coupe les animations : sinon on mesure des textes à demi transparents
            page = ctx.new_page()
            page.goto(base + "index.html")
            page.wait_for_timeout(300)

            def mesurer(nom):
                nonlocal sur_image, total
                pire = None
                for e in page.evaluate(JS_RELEVE):
                    if e["img"]:
                        sur_image += 1
                        continue
                    total += 1
                    seuil = 3.0 if (e["px"] >= 24 or (e["px"] >= 18.66 and e["bold"])) else 4.5
                    r = rapport(e["fg"], e["bg"])
                    pire = min(pire or (99, None), (r, e), key=lambda x: x[0])
                    cle = (hexa(e["fg"]), hexa(e["bg"]), seuil)
                    if r < seuil - 0.005 and (nom, cle, e["sel"]) not in vus:
                        vus.add((nom, cle, e["sel"]))
                        mauvais.append((nom, r, seuil, e))
                if a.verbeux and pire:
                    print(f"  [{nom}] pire : {pire[0]:.2f}:1  {pire[1]['sel']}  « {pire[1]['txt']} »")

            parcours(page, mesurer)
            nav.close()
    finally:
        srv.terminate()
    print(f"{total} textes mesurés sur {a.largeur}×{a.hauteur} ({sur_image} sur image, non mesurables).")
    for nom, r, seuil, e in sorted(mauvais, key=lambda x: x[1]):
        print(f"  SOUS LE SEUIL {r:.2f}:1 (< {seuil}) [{nom}] {hexa(e['fg'])} sur {hexa(e['bg'])}  {e['px']:.0f}px  {e['sel']}  « {e['txt']} »")
    print("OK : tous les couples mesurés respectent le seuil." if not mauvais else f"{len(mauvais)} couple(s) sous le seuil.")
    return 1 if mauvais else 0


if __name__ == "__main__":
    sys.exit(main())
