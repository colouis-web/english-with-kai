#!/usr/bin/env python3
"""Petits iPhone (SE 375×667, mini 375×812, mini sous les barres de Safari 375×629) et WebKit (Safari) : cadrage des images,
défilement horizontal, contenu coupé. Demande T5 / R2 du PO (30/10), chantier de Dédé au sprint A de Kai 2.

  python3 tests/test_appareils.py [--app <dossier>] [--only se|mini|mini-safari] [--engine chromium|webkit|all]
                                  [--cadrage-strict] [--captures <dossier>]

Principe : on PARCOURT les écrans comme un élève (progression de référence, date figée, hasard gradué) et, sur chacun, on MESURE
dans la page (rien n'est comparé au pixel) :
  - défilement horizontal : la page est-elle plus large que l'écran (documentElement.scrollWidth > clientWidth) ?
  - images de Kai et de scènes (<img> et <image> des SVG) : la partie DESSINÉE de l'image (object-fit / preserveAspectRatio compris)
    est-elle entièrement visible, ou coupée par son cadre, par un parent qui rogne (overflow:hidden) ou par le bord de l'écran ?
    (les vignettes rondes — humeurs, calendrier — sont exclues : le recadrage sur le visage y est voulu)
  - contenu coupé : un bouton, une carte ou un texte dont le contenu dépasse du cadre (overflow:hidden) ;
  - le bouton « Start » de l'accueil est-il visible sans défiler ?
Quand quelque chose est mal cadré, le test écrit une capture annotée (cadres rouges) et dit précisément écran + image.

Contrôles de CADRAGE (id « AP-cad-… ») : tant que Ouss n'a pas corrigé le cadrage (R2), un échec n'est PAS un KO : il est noté
« attendu après correction d'Ouss » (statut Note, avec le détail), la suite reste verte. `--cadrage-strict` les rend bloquants
(à utiliser dès que la correction d'Ouss est fusionnée). Les autres contrôles (chargement des images, erreurs de console, parcours)
sont toujours bloquants.

WebKit : si le moteur n'est pas installé (python3 -m playwright install --with-deps webkit), la passe WebKit est notée « Non disponible »
(Note) ; avec --require-webkit elle devient un KO.
"""
import json
import re
import tempfile
from pathlib import Path

from kai_common import (FIXED_NOW, OUT, Bilan, new_context, open_app, run_suite, wait_page, stable, wait_js, appareil, APPAREILS,
                        lancer_moteur, current_page)
from test_persistance import FIXTURE, SEED, fabrique_parcours

PREFIXE_ATTENDU = "attendu après correction d'Ouss"

# ---------------------------------------------------------------------------------------------- mesure dans la page
# Renvoie { vw, scrollW, imgs: [...], coupes: [...], larges: [...] } pour l'écran affiché.
JS_MESURE = r"""
async () => {
  const vw = document.documentElement.clientWidth;
  const rect = el => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const aire = r => Math.max(0, r.r - r.l) * Math.max(0, r.b - r.t);
  const inter = (a, b) => ({ l: Math.max(a.l, b.l), t: Math.max(a.t, b.t), r: Math.min(a.r, b.r), b: Math.min(a.b, b.b) });
  const visible = el => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    for (let p = el.parentElement; p; p = p.parentElement) { const c = getComputedStyle(p); if (c.display === 'none' || c.visibility === 'hidden') return false; }
    const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1;
  };
  const chemin = el => {
    const out = [];
    for (let e = el; e && e.nodeType === 1 && out.length < 4; e = e.parentElement) {
      out.unshift(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.classList.length ? '.' + [...e.classList].slice(0, 2).join('.') : ''));
      if (e.id) break;
    }
    return out.join(' > ');
  };
  // rectangle visible = intersection des parents qui ROGNENT (overflow hidden / clip) ; la largeur de l'écran borde tout
  const cadre = el => {
    let c = { l: 0, t: -1e9, r: vw, b: 1e9 };
    for (let p = el.parentElement; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      const rog = v => v === 'hidden' || v === 'clip';
      if (rog(cs.overflowX) || rog(cs.overflowY)) {
        const r = rect(p);
        c = inter(c, { l: rog(cs.overflowX) ? r.l : -1e9, r: rog(cs.overflowX) ? r.r : 1e9, t: rog(cs.overflowY) ? r.t : -1e9, b: rog(cs.overflowY) ? r.b : 1e9 });
      }
    }
    return c;
  };
  const pos = (s, dflt) => { const m = String(s || dflt).split(/\s+/); const f = v => v.endsWith('%') ? parseFloat(v) / 100 : v === 'left' || v === 'top' ? 0 : v === 'right' || v === 'bottom' ? 1 : 0.5; return [f(m[0]), f(m[1] === undefined ? m[0] : m[1])]; };
  const charge = src => new Promise(res => { const i = new Image(); i.onload = () => res([i.naturalWidth, i.naturalHeight]); i.onerror = () => res([0, 0]); i.src = src; });
  const imgs = [];
  // ---- <img> : object-fit / object-position
  for (const el of document.images) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el), r = rect(el);
    const bx = { l: r.l + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft), t: r.t + parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop),
                 r: r.r - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight), b: r.b - parseFloat(cs.borderBottomWidth) - parseFloat(cs.paddingBottom) };
    const bw = bx.r - bx.l, bh = bx.b - bx.t, nw = el.naturalWidth, nh = el.naturalHeight;
    if (!nw || !nh) { imgs.push({ src: el.getAttribute('src'), kind: 'img', chemin: chemin(el), charge: false, vis: 0, rect: r }); continue; }
    let sc = [bw / nw, bh / nh];
    const fit = cs.objectFit;
    if (fit === 'contain') sc = [Math.min(...sc), Math.min(...sc)];
    else if (fit === 'cover') sc = [Math.max(...sc), Math.max(...sc)];
    else if (fit === 'none') sc = [1, 1];
    else if (fit === 'scale-down') { const m = Math.min(1, Math.min(...sc)); sc = [m, m]; }
    const dw = nw * sc[0], dh = nh * sc[1], [px, py] = pos(cs.objectPosition, '50% 50%');
    const d = { l: bx.l + (bw - dw) * px, t: bx.t + (bh - dh) * py }; d.r = d.l + dw; d.b = d.t + dh;
    const vis = inter(inter(d, bx), cadre(el));
    const br = parseFloat(cs.borderTopLeftRadius) || 0, rond = cs.borderTopLeftRadius.endsWith('%') ? br >= 45 : br >= Math.min(bw, bh) * 0.45;
    imgs.push({ src: el.getAttribute('src'), kind: 'img', chemin: chemin(el), charge: true, fit, rond, vis: aire(vis) / aire(d), drawn: d, box: bx, nat: [nw, nh] });
  }
  // ---- <image> dans un SVG : preserveAspectRatio, dans le viewBox
  for (const el of document.querySelectorAll('svg image')) {
    if (!visible(el)) continue;
    const src = el.getAttribute('href') || el.getAttribute('xlink:href'), r = rect(el);
    const [nw, nh] = await charge(src);
    if (!nw) { imgs.push({ src, kind: 'svg-image', chemin: chemin(el), charge: false, vis: 0, rect: r }); continue; }
    const par = (el.getAttribute('preserveAspectRatio') || 'xMidYMid meet').trim().split(/\s+/);
    const al = par[0], slice = par[1] === 'slice';
    let s = [r.w / nw, r.h / nh];
    if (al !== 'none') { const m = slice ? Math.max(...s) : Math.min(...s); s = [m, m]; }
    const ax = /xMin/.test(al) ? 0 : /xMax/.test(al) ? 1 : 0.5, ay = /YMin/.test(al) ? 0 : /YMax/.test(al) ? 1 : 0.5;
    const dw = nw * s[0], dh = nh * s[1];
    const d = { l: r.l + (r.w - dw) * ax, t: r.t + (r.h - dh) * ay }; d.r = d.l + dw; d.b = d.t + dh;
    const svg = el.ownerSVGElement;
    const cs = getComputedStyle(svg), sr = rect(svg);
    // le SVG rogne à son cadre (overflow hidden par défaut) : on garde aussi la zone du viewBox mise à l'échelle
    let zone = sr;
    const vb = svg.viewBox && svg.viewBox.baseVal;
    if (vb && vb.width) {
      const k = Math.min(sr.w / vb.width, sr.h / vb.height), px = /xMin/.test(svg.getAttribute('preserveAspectRatio') || '') ? 0 : /xMax/.test(svg.getAttribute('preserveAspectRatio') || '') ? 1 : 0.5;
      const py = /YMin/.test(svg.getAttribute('preserveAspectRatio') || '') ? 0 : /YMax/.test(svg.getAttribute('preserveAspectRatio') || '') ? 1 : 0.5;
      const ox = sr.l + (sr.w - vb.width * k) * px, oy = sr.t + (sr.h - vb.height * k) * py;
      zone = { l: ox, t: oy, r: ox + vb.width * k, b: oy + vb.height * k };
    }
    const rogne = cs.overflow === 'hidden' || cs.overflow === 'clip' || cs.overflowX === 'hidden';
    const vis = inter(inter(d, rogne ? inter(sr, zone) : { l: -1e9, t: -1e9, r: 1e9, b: 1e9 }), cadre(svg));
    const visVb = inter(inter(d, zone), cadre(svg));    // même sans rognage : sortir du viewBox, c'est être coupé dès que le SVG rogne
    imgs.push({ src, kind: 'svg-image', chemin: chemin(el), charge: true, vis: aire(vis) / aire(d), visViewBox: aire(visVb) / aire(d), drawn: d, nat: [nw, nh] });
  }
  // ---- contenu coupé : texte ou bouton dont le contenu dépasse son cadre rogné
  const coupes = [];
  for (const el of document.querySelectorAll('button, a, .tile, .opt, .chip, h1, h2, h3, p, span, b, label, li, .bb, .vcard, .lvopt')) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    if ((cs.overflowX === 'hidden' || cs.overflowX === 'clip') && el.scrollWidth > el.clientWidth + 2 && cs.textOverflow !== 'ellipsis' && (el.textContent || '').trim())
      coupes.push({ chemin: chemin(el), texte: (el.textContent || '').trim().slice(0, 40), dep: el.scrollWidth - el.clientWidth });
  }
  // ---- éléments qui dépassent à droite de l'écran (hors conteneurs défilants volontaires)
  const larges = [];
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.right <= vw + 1) continue;
    if (!visible(el)) continue;
    let defil = false;
    for (let p = el.parentElement; p; p = p.parentElement) { const c = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(c.overflowX) && p !== document.body && p !== document.documentElement) { defil = true; break; } }
    if (defil) continue;
    if (getComputedStyle(el).position === 'fixed' && r.left >= vw) continue;     // volontairement hors écran (menus cachés)
    larges.push({ chemin: chemin(el), droite: Math.round(r.right), largeur: Math.round(r.width) });
    if (larges.length >= 6) break;
  }
  const start = document.getElementById('start');
  return { vw, vh: innerHeight, scrollW: document.documentElement.scrollWidth, bodyScrollW: document.body.scrollWidth, imgs, coupes: coupes.slice(0, 8), larges,
           start: start && start.offsetParent ? rect(start) : null };
}
"""

# Cadres rouges autour des problèmes, pour la capture annotée.
JS_ANNOTE = r"""
(boites) => {
  document.querySelectorAll('.__annote').forEach(e => e.remove());
  for (const b of boites) {
    const d = document.createElement('div');
    d.className = '__annote';
    d.style.cssText = `position:absolute;z-index:2147483647;pointer-events:none;border:3px solid #e00;background:rgba(255,0,0,.12);left:${b.l + scrollX}px;top:${b.t + scrollY}px;width:${Math.max(4, b.r - b.l)}px;height:${Math.max(4, b.b - b.t)}px;box-sizing:border-box`;
    document.body.appendChild(d);
  }
  if (boites.length) scrollTo(0, Math.max(0, boites[0].t + scrollY - 140));      // la capture montre le premier problème
}
"""

SEUIL_VISIBLE = 0.97      # une image dont moins de 97 % de la partie dessinée est visible est « coupée »
MOTIF_IMAGE_KAI = re.compile(r"(^|/)(kai|sc|rw)-[\w-]+\.(webp|png|svg)$")


class Mesures:
    """Accumule les contrôles d'un profil (appareil × moteur) et écrit les captures annotées."""

    def __init__(self, bilan, strict, dossier_captures, etiquette, titre):
        self.bilan, self.strict, self.dossier, self.etiq, self.titre = bilan, strict, Path(dossier_captures), etiquette, titre
        self.constats = []     # (écran, texte) pour le résumé

    def cadrage(self, cid, titre, cond, detail=""):
        """Contrôle de cadrage : OK, sinon « attendu après correction d'Ouss » (Note) ou KO si --cadrage-strict."""
        cid = f"AP-cad-{cid}@{self.etiq}"
        if cond:
            return self.bilan.ok(cid, titre)
        if self.strict:
            return self.bilan.ko(cid, titre, detail)
        return self.bilan.note(cid, f"{PREFIXE_ATTENDU.upper()} : {titre}", detail)

    def dur(self, cid, titre, cond, detail=""):
        return self.bilan.check(f"AP-{cid}@{self.etiq}", titre, bool(cond), detail)


def mesurer(page, M, ecran, tolerer_scroll=False):
    """Mesure l'écran courant, enregistre les contrôles, écrit une capture annotée s'il y a un problème."""
    stable(page)
    m = page.evaluate(JS_MESURE)
    boites, problemes = [], []
    # 1. défilement horizontal
    large = m["scrollW"] > m["vw"] + 1 or m["bodyScrollW"] > m["vw"] + 1
    M.cadrage(f"scroll-{ecran}", f"{M.titre} · {ecran} : aucun défilement horizontal", not large,
              f"largeur de la page {max(m['scrollW'], m['bodyScrollW'])} px pour un écran de {m['vw']} px ; éléments qui dépassent : "
              + "; ".join(f"{x['chemin']} (bord droit {x['droite']} px)" for x in m["larges"][:4]))
    if large:
        problemes.append("défilement horizontal")
    # éléments qui dépassent le bord droit de l'écran (même si la page ne défile pas : ils sont alors rognés)
    M.cadrage(f"debord-{ecran}", f"{M.titre} · {ecran} : aucun élément ne dépasse le bord droit de l'écran", not m["larges"],
              "; ".join(f"{x['chemin']} (bord droit à {x['droite']} px, largeur {x['largeur']} px)" for x in m["larges"][:5]))
    if m["larges"]:
        problemes.append("éléments hors écran : " + ", ".join(x["chemin"] for x in m["larges"][:2]))
    # 2. images : chargées (bloquant) puis cadrage
    non_chargees = [i["src"] for i in m["imgs"] if not i["charge"]]
    M.dur(f"img-charge-{ecran}", f"{M.titre} · {ecran} : toutes les images visibles se chargent", not non_chargees, ", ".join(non_chargees[:5]))
    coupees = []
    for i in m["imgs"]:
        if not i["charge"] or not MOTIF_IMAGE_KAI.search(i["src"] or ""):
            continue
        if i.get("rond"):
            continue      # vignette ronde (humeurs, calendrier) : le recadrage sur le visage est voulu
        if i["vis"] < SEUIL_VISIBLE or i.get("visViewBox", 1) < SEUIL_VISIBLE:
            perte = round((1 - min(i["vis"], i.get("visViewBox", 1))) * 100)
            coupees.append((i, perte))
            d = i.get("box") or i["drawn"]
            boites.append({"l": d["l"], "t": d["t"], "r": d["r"], "b": d["b"]})
    M.cadrage(f"images-{ecran}", f"{M.titre} · {ecran} : aucune image de Kai ou de scène n'est coupée",
              not coupees, "; ".join(f"{i['src']} ({i['chemin']}) : {perte} % coupé" for i, perte in coupees[:6]))
    if coupees:
        problemes.append("image coupée : " + ", ".join(i["src"] for i, _ in coupees[:3]))
    # 3. texte et boutons coupés
    M.cadrage(f"contenu-{ecran}", f"{M.titre} · {ecran} : aucun texte ni bouton coupé par son cadre", not m["coupes"],
              "; ".join(f"{c['chemin']} « {c['texte']} » dépasse de {c['dep']} px" for c in m["coupes"][:5]))
    if m["coupes"]:
        problemes.append("contenu coupé")
    # 4. accueil : « Start » sans défiler
    if ecran == "accueil" and m["start"]:
        ok = m["start"]["b"] <= m["vh"] and m["start"]["t"] >= 0
        M.cadrage("start-visible", f"{M.titre} · accueil : le bouton « Start » est visible sans défiler", ok,
                  f"bas du bouton à {round(m['start']['b'])} px pour un écran de {m['vh']} px de haut")
        if not ok:
            problemes.append("« Start » sous la ligne de flottaison")
    if problemes:
        M.constats.append((ecran, " ; ".join(problemes)))
        if M.etiq.endswith("ref390"):
            return m          # l'écran de référence sert à comparer les mesures, sans capture
        M.dossier.mkdir(parents=True, exist_ok=True)
        try:
            page.evaluate(JS_ANNOTE, [b for b in boites if b["r"] > b["l"]])
            page.screenshot(path=str(M.dossier / f"{M.etiq}-{ecran}.png"), full_page=False, animations="disabled", caret="hide", scale="css")
        finally:
            page.evaluate("() => document.querySelectorAll('.__annote').forEach(e => e.remove())")
    return m


# ---------------------------------------------------------------------------------------------- les écrans


def parcours_ecrans(P, M):
    """Écrans d'un élève : lance les mesures. P = Parcours (gestes), M = Mesures."""
    p = P.page
    # -------- sans élève : accueil, prénom
    open_app(p, P.base)
    mesurer(p, M, "accueil")
    p.locator("#start").click()
    wait_page(p, "hello")
    wait_js(p, "() => document.activeElement && document.activeElement.id === 'pname'")
    mesurer(p, M, "hello")


def ecrans_eleve(P, M):
    p = P.page
    open_app(p, P.base)
    p.wait_for_selector("#plist")
    mesurer(p, M, "qui-apprend")
    p.locator("#plist [data-pid]").first.click()
    wait_page(p, "daily")
    mesurer(p, M, "daily-today")
    # défilement jusqu'en bas : les images du bas de page (récompenses, semaine) sont mesurées aussi
    p.evaluate("() => scrollTo(0, document.body.scrollHeight)")
    mesurer(p, M, "daily-today-bas")
    P.click('[data-dtab="cal"]')
    mesurer(p, M, "daily-calendrier")
    P.click('[data-dtab="today"]')
    p.evaluate("() => show('menu')")
    P.on("menu")
    mesurer(p, M, "menu")

    def page_de(tuile, pid, nom, retour="menu"):
        P.click(f"#{tuile}")
        P.on(pid)
        mesurer(p, M, nom)

    page_de("toWords", "words", "words")
    p.locator("#wq").fill("run")
    mesurer(p, M, "words-recherche")
    p.locator("#wq").fill("")
    P.click("#toVerbs"); P.on("verbs"); mesurer(p, M, "verbes")
    P.back("words")
    P.click("#toNouns"); P.on("nouns"); mesurer(p, M, "noms")
    P.back("words"); P.back("menu")
    page_de("toConj", "conj", "conjugaison")
    P.click('[data-lesson="be"]'); P.on("lesson"); mesurer(p, M, "lecon-be")
    P.back("conj"); P.back("menu")
    page_de("toGrammar", "grammar", "grammaire")
    P.back("menu")
    page_de("toTests", "tests", "mes-tests")
    P.back("menu")
    page_de("toTY", "ty", "test-yourself")
    P.click("#toQuizzes"); P.on("quizzes"); mesurer(p, M, "quiz-liste")
    P.click("#toQV"); P.on("quiz"); mesurer(p, M, "quiz-themes")
    P.click('.seg [data-n="5"]')
    P.click('.topic[data-tag="all"]')
    p.locator("#opts .opt").first.wait_for()
    mesurer(p, M, "quiz-question")
    # fin de quiz : mauvaise série (Kai déçu) puis parfaite (Kai heureux) — les images de fin diffèrent
    P.answer_quiz(wrong_n=4)
    mesurer(p, M, "quiz-fin-ratee")
    P.click("#qagain")
    P.answer_quiz()
    mesurer(p, M, "quiz-fin-parfaite")
    P.to_menu()
    P.click("#toTY"); P.on("ty")
    P.click("#toDIY"); P.on("diy"); mesurer(p, M, "diy")
    P.back("ty")
    P.click("#toTalk"); P.on("talk"); mesurer(p, M, "lets-talk")
    # « Let's talk » tire UNE image au hasard : on les rend TOUTES (index forcé) pour ne pas rater une image mal cadrée selon le tirage
    nb = P.ev("() => TKPICS.length")
    for i in range(nb):
        p.evaluate("i => { TK.i = i; renderTalk() }", i)
        p.wait_for_function("i => { const im = document.querySelector('#talkbody .tkpic img'); return !!im && im.complete && im.naturalWidth > 0 && im.getAttribute('src').endsWith(TKPICS[i].img + '.webp') }", arg=i)
        mesurer(p, M, f"lets-talk-{p.evaluate('i => TKPICS[i].img', i)}")
    P.back("ty")
    P.click("#toT6"); P.on("t6"); mesurer(p, M, "controles-6e")
    P.back("ty"); P.back("menu")
    P.click("#toMe"); P.on("me"); mesurer(p, M, "me")
    P.to_menu()
    # fin d'entraînement d'une leçon (image de Kai du bilan)
    P.click("#toGrammar"); P.on("grammar")
    P.click('[data-lesson="articles"]'); P.on("lesson")
    mesurer(p, M, "lecon-articles")
    P.click("#lpractice")
    P.practice()
    mesurer(p, M, "lecon-fin")
    # félicitations « Congrats! » : tour de mots du jour sur un autre élève (objectif atteint pour la première fois)


def ecran_congrats(P, M):
    """Élève neuf : un tour de mots du jour complet fait apparaître « Congrats! » (Kai en pied, au-dessus de tout)."""
    p = P.page
    open_app(p, P.base)
    p.locator("#start").click()
    wait_page(p, "hello")
    p.locator("#pname").fill("Zoé")
    p.locator('[data-hlv="0"]').click()
    p.locator("#nameform .listen").click()
    wait_page(p, "menu")
    P.click("#toDaily"); P.on("daily")
    mesurer(p, M, "daily-neuf")
    P.click("#dround"); P.on("quiz")
    P.answer_quiz()
    p.wait_for_function("!!document.querySelector('.congrats')", timeout=8000)
    mesurer(p, M, "congrats")


# ---------------------------------------------------------------------------------------------- suite


def meta_viewport(page, base, bilan, etiq):
    """Encoche (viewport-fit=cover) : le CSS doit réserver les zones sûres, sinon le haut et le bas de l'iPhone sont cachés."""
    html = page.evaluate("async b => (await fetch(b + 'index.html')).text()", base)
    css = page.evaluate("async b => { const o = []; for (const l of document.querySelectorAll('link[rel=stylesheet]')) { if (l.href.startsWith(b)) o.push(await (await fetch(l.href)).text()) } return o.join('\\n') }", base)
    m = re.search(r'<meta[^>]+name=["\']viewport["\'][^>]*content=["\']([^"\']*)', html)
    content = m.group(1) if m else ""
    bilan.check(f"AP-meta@{etiq}", "La balise viewport existe (width=device-width)", "width=device-width" in content, content)
    if "viewport-fit=cover" in content:
        bilan.check(f"AP-zones-sures@{etiq}", "viewport-fit=cover : le CSS utilise env(safe-area-inset-…) (encoche et barre d'accueil de l'iPhone)",
                    "safe-area-inset" in css or "safe-area-inset" in html, "pas de safe-area-inset dans le CSS : le contenu peut passer sous l'encoche")
    else:
        bilan.note(f"AP-zones-sures@{etiq}", "Pas de viewport-fit=cover : l'application reste dans la zone sûre (rien à faire)", content)


def run(args, base, browser, bilan, collector):
    if not FIXTURE.is_file():
        bilan.ko("AP-00", "Progression de référence absente (tests/fixtures/progression-reference.json)")
        return
    ls = json.loads(FIXTURE.read_text(encoding="utf-8"))["ls"]
    captures = Path(args.captures) if args.captures else OUT / "appareils"
    moteurs = []
    if args.engine in ("chromium", "all"):
        moteurs.append(("chromium", browser, ""))
    if args.engine in ("webkit", "all"):
        wk, raison = lancer_moteur(args.pw, "webkit")
        if wk is None:
            titre = "WebKit (Safari) : le moteur n'est pas installé sur cette machine, passe non jouée"
            detail = raison + " — installer avec : python3 -m playwright install --with-deps webkit"
            (bilan.ko if args.require_webkit else bilan.note)("AP-webkit", titre, detail)
        else:
            moteurs.append(("webkit", wk, ""))
    try:
        for nom_moteur, nav, _ in moteurs:
            for cle in APPAREILS:
                if args.only and args.only != cle:
                    continue
                if nom_moteur == "webkit" and cle in ("mini-safari", "ref390"):
                    continue      # WebKit : les deux tailles plein écran suffisent
                vp, kw = appareil(args.pw, cle)
                etiq = cle if nom_moteur == "chromium" else f"webkit-{cle}"
                M = Mesures(bilan, args.cadrage_strict, captures, etiq, APPAREILS[cle]["titre"] + ("" if nom_moteur == "chromium" else " · WebKit"))
                for groupe in ("vierge", "eleve", "neuf"):
                    donnees = ls if groupe == "eleve" else {}
                    ctx = new_context(nav, base, vp, collector, seed=SEED, now=FIXED_NOW, polices=False, **kw)
                    ctx.add_init_script("(() => { try { if (!sessionStorage.getItem('__seeded')) { localStorage.clear(); const d = "
                                        + json.dumps(donnees) + "; for (const k in d) localStorage.setItem(k, d[k]); sessionStorage.setItem('__seeded', '1'); } } catch (e) {} })();")
                    ctx.route(re.compile(r".*/voice/kai-\d+\.json$"), lambda r: r.fulfill(status=200, content_type="application/json", body="{}"))
                    P = fabrique_parcours(base, nav, Bilan("x"), collector, ctx, label=etiq)
                    P.mobile = True
                    P.vp = vp
                    P.sid = f"AP-{groupe}"
                    mark = collector.mark()
                    try:
                        if groupe == "vierge":
                            parcours_ecrans(P, M)
                            meta_viewport(P.page, base, bilan, etiq)
                        elif groupe == "eleve":
                            ecrans_eleve(P, M)
                        else:
                            ecran_congrats(P, M)
                    except Exception as ex:   # noqa: BLE001
                        bilan.ko(f"AP-crash-{groupe}@{etiq}", f"{M.titre} : le parcours des écrans ({groupe}) s'est arrêté", f"{type(ex).__name__}: {str(ex)[:400]} [écran : {current_page(P.page)}]")
                        try:
                            OUT.mkdir(exist_ok=True)
                            P.page.screenshot(path=str(OUT / f"echec-appareils-{groupe}-{etiq}.png"))
                        except Exception:   # noqa: BLE001
                            pass
                    finally:
                        ctx.close()
                    erreurs = collector.since(mark)
                    bilan.check(f"AP-err-{groupe}@{etiq}", f"{M.titre} ({groupe}) : aucune erreur console / JS", not erreurs,
                                "; ".join(f"[{g}] {t}" for g, t in erreurs[:4]))
                    del collector.errors[mark:]
                if M.constats:
                    bilan.note(f"AP-resume@{etiq}", f"{M.titre} : écrans mal cadrés ({len(M.constats)}) — captures dans {captures}",
                               " | ".join(f"{e} : {t}" for e, t in M.constats)[:1400])
    finally:
        for nom_moteur, nav, _ in moteurs:
            if nom_moteur == "webkit":
                nav.close()


def extra(ap):
    ap.add_argument("--only", choices=list(APPAREILS), help="un seul appareil")
    ap.add_argument("--engine", choices=("chromium", "webkit", "all"), default="all", help="moteur(s) : Chromium (émulation iPhone) et/ou WebKit (Safari)")
    ap.add_argument("--cadrage-strict", action="store_true", help="les échecs de cadrage deviennent des KO (après la correction d'Ouss)")
    ap.add_argument("--require-webkit", action="store_true", help="WebKit absent = KO (par défaut : simple note)")
    ap.add_argument("--captures", help="dossier des captures annotées (défaut : tests/_out/appareils)")


if __name__ == "__main__":
    raise SystemExit(run_suite("Appareils", __doc__, run, extra))
