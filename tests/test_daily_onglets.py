#!/usr/bin/env python3
"""« My daily work » en option A (onglets Today · Week · My level · Rewards + bande des 7 jours) — tests d'acceptation (Dédé, sprint B).

  python3 tests/test_daily_onglets.py [--app <dossier>] [-v]
  python3 tests/test_daily_onglets.py --update-reference     (UNIQUEMENT sur l'écran d'AVANT les onglets : sprint-kai-2 @ c3ec1fb)

Référence : docs/ux/maquettes-daily/README.md (option A choisie par le PO le 02/11 à 14:00, avec la bande des 7 jours de l'option C) et
docs/backlog/2026-10-30-retours-po.md. Critères :

  OA-0x  quatre onglets (Today, Week, My level, Rewards), le calendrier rangé avec la semaine ;
  OA-1x  aucune information perdue : chaque bloc de l'écran d'avant (tests/reference/daily-blocs-avant.json, photographié sur la version
         d'avant, deux situations : « objectif atteint » le 30/10 et « matin » le 02/11) se retrouve, mot pour mot, dans l'un des onglets ;
  OA-2x  mémorisation : Today au premier lancement du jour, puis l'onglet laissé ; un onglet par élève ;
  OA-3x  « Start » visible sans défiler à 375×667 et 390×844 (avec bandeau de contrôle de classe et bandeau Renew) ;
  OA-4x  bande des 7 jours : sept jours qui finissent aujourd'hui, états conformes au journal, série ;
  OA-5x  pas de défilement horizontal, libellés d'onglets entiers (375 px, texte normal / grand / très grand) ;
  OA-6x  Start lance bien un tour ; bulles de fin d'exercice à 18 px (375 et 390 px).
"""
import json
import re

from kai_common import (FIXED_NOW, REFERENCE, Collector, current_page, new_context, open_app, reload_app, run_suite, wait_js, wait_page, frames, stable)
from kai_certs import CAMILLE, NOE, SEED, T0, contexte, jour, reference, RESEED

REF_BLOCS = REFERENCE / "daily-blocs-avant.json"
SITUATIONS = {"objectif-atteint": FIXED_NOW, "matin": T0}      # 30/10 10:00 (journée du jeu de référence) et 02/11 10:00 (rien fait, contrôle de classe)
ONGLETS = ["Today", "Week", "My level", "Rewards"]

# Blocs de l'écran d'avant, repérés par leurs classes (les blocs sont « réutilisés tels quels » dans les trois options : maquettes, README).
BLOCS = [".ddate", ".dsec", ".wgoal", ".t6ban", ".moods", ".mymood", ".memcard", ".wtile", ".lvcard", ".rstats", ".badges", ".rnext", ".level",
         ".week", ".wsum", ".tsub", ".tkpi", ".tchart", ".dend", ".wd", ".cal", ".mstats", ".dday", ".lvup"]
# Titres de section : la mise en page les regroupe autrement (les onglets les remplacent) : leur disparition est une NOTE, pas un KO.
TITRES = [".dsec"]

EXTRAIRE = r"""(sels) => {
  const norm = t => (t || '').replace(/\s+/g, ' ').trim();
  const root = document.getElementById('dailybody');
  const blocs = {};
  for (const s of sels) blocs[s] = [...root.querySelectorAll(s)].map(e => norm(e.textContent)).filter(Boolean);
  const atomes = [...new Set([...root.querySelectorAll('*')].filter(e => e.children.length === 0 || e.tagName === 'tspan')
                    .map(e => norm(e.textContent)).filter(t => /[A-Za-zÀ-ÿ]{3,}/.test(t)))];
  return { blocs, atomes };
}"""
OUVRIR_TOUT = "() => { document.querySelectorAll('#dailybody details').forEach(d => { d.open = true }) }"


def choisir_eleve(page, pid=CAMILLE):
    """Ouvre My daily work pour un élève (Who's learning → élève ; ou menu → tuile)."""
    cur = current_page(page)
    if cur == "who":
        page.locator(f'#plist [data-pid="{pid}"]').click()
        wait_page(page, "daily")
    elif cur == "menu":
        page.locator("#toDaily").click()
        wait_page(page, "daily")
    elif cur != "daily":
        page.evaluate("() => show('menu')")
        page.locator("#toDaily").click()
        wait_page(page, "daily")
    page.wait_for_selector("#dailybody .ddate")


def reunion(situations_vues):
    blocs, atomes = {}, set()
    for v in situations_vues:
        for s, L in v["blocs"].items():
            blocs.setdefault(s, set()).update(L)
        atomes.update(v["atomes"])
    return blocs, atomes


def photographier_avant(page):
    """Version d'AVANT : l'onglet Today puis l'onglet Calendar."""
    page.wait_for_selector("#dailybody .ddate")
    vues = [page.evaluate(EXTRAIRE, BLOCS)]
    page.evaluate(OUVRIR_TOUT)
    vues = [page.evaluate(EXTRAIRE, BLOCS)]
    page.locator('[data-dtab="cal"]').click()
    page.wait_for_selector("#dailybody .cal")
    page.evaluate(OUVRIR_TOUT)
    vues.append(page.evaluate(EXTRAIRE, BLOCS))
    b, a = reunion(vues)
    return {"blocs": {s: sorted(L) for s, L in b.items()}, "atomes": sorted(a)}


def onglets_visibles(page):
    return page.get_by_role("tab").all()


def nom_onglet(el):
    return re.sub(r"\s+", " ", el.text_content() or "").strip()


def onglet_actif(page):
    t = page.locator('#dailybody [role="tab"][aria-selected="true"]')
    return nom_onglet(t.first) if t.count() else None


def aller_onglet(page, nom):
    """Touche l'onglet `nom` et attend qu'il soit sélectionné. True/False (jamais d'exception : le contrôle qui suit constate)."""
    try:
        page.locator("#dailybody").get_by_role("tab", name=re.compile(rf"^\s*{re.escape(nom)}\s*$", re.I)).click(timeout=2500)
    except Exception:   # noqa: BLE001
        return False
    ok = wait_js(page, "n => { const t = document.querySelector('#dailybody [role=tab][aria-selected=true]'); return !!t && t.textContent.trim().toLowerCase() === n.toLowerCase() }", nom)
    frames(page, 2)
    return ok


def run(args, base, browser, bilan, collector):
    def ck(titre, cond, detail=""):
        cid, _, t = titre.partition(" ")
        return bilan.check(cid, t, bool(cond), str(detail)[:1300])

    LS = reference()["ls"]

    # ------------------------------------------------------------------ mode « photographier l'écran d'avant »
    if args.update_reference:
        out = {"genere_avec": "My daily work AVANT les onglets (sprint-kai-2 @ c3ec1fb) — ne pas régénérer avec l'option A", "situations": {}}
        for nom, now in SITUATIONS.items():
            ctx = contexte(browser, base, collector, LS, now=now)
            page = open_app(ctx.new_page(), base)
            choisir_eleve(page)
            out["situations"][nom] = photographier_avant(page)
            ctx.close()
        REF_BLOCS.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"référence écrite : {REF_BLOCS} ({sum(len(L) for s in out['situations'].values() for L in s['blocs'].values())} blocs)")
        return

    m0 = collector.mark()
    avant = json.loads(REF_BLOCS.read_text(encoding="utf-8"))["situations"]

    # ------------------------------------------------------------------ OA-0x : les quatre onglets
    ctx = contexte(browser, base, collector, LS, now=T0)
    page = open_app(ctx.new_page(), base)
    choisir_eleve(page)
    tabs = [nom_onglet(t) for t in page.locator("#dailybody").get_by_role("tab").all()]
    ck("OA-01 [Ludo] Quatre onglets dans cet ordre : Today · Week · My level · Rewards (rôle tab, un seul sélectionné)",
       [t.lower() for t in tabs] == [o.lower() for o in ONGLETS] and page.locator('#dailybody [role="tab"][aria-selected="true"]').count() == 1, tabs)
    ck("OA-02 [Ludo] Le calendrier n'est plus un onglet : il est rangé avec la semaine (« Calendar » absent de la barre d'onglets)", "calendar" not in [t.lower() for t in tabs], tabs)
    ck("OA-03 [Ludo] Premier lancement du jour : My daily work s'ouvre sur « Today »", (onglet_actif(page) or "").lower() == "today", onglet_actif(page))
    gabarit = {}
    if [t.lower() for t in tabs] == [o.lower() for o in ONGLETS]:
        for o in ONGLETS:
            aller_onglet(page, o)
            gabarit[o] = page.evaluate("""() => { const r = document.getElementById('dailybody'); return { start: !!r.querySelector('#dround'), goal: !!r.querySelector('.wgoal'), mem: !!r.querySelector('.memcard'),
              lessons: r.querySelectorAll('.wtile').length, week: !!r.querySelector('.week'), cal: !!r.querySelector('.cal'), level: !!r.querySelector('.lvcard'),
              rewards: !!r.querySelector('.badges'), tests: !!r.querySelector('.tkpi, .tchart'), words: !!r.querySelector('.wd'), h: r.scrollHeight }; }""")
        g = gabarit
        ck("OA-04 [Ludo] Today : objectif du jour et bouton Start", g["Today"]["goal"] and g["Today"]["start"], g["Today"])
        ck("OA-05 [Ludo] Week : les 2 leçons de la semaine, le graphique des 7 jours, le calendrier et les tests", g["Week"]["lessons"] == 2 and g["Week"]["week"] and g["Week"]["cal"] and g["Week"]["tests"], g["Week"])
        ck("OA-06 [Ludo] My level : la carte du niveau avec la route vers le niveau suivant", g["My level"]["level"], g["My level"])
        ck("OA-07 [Ludo] Rewards : étoiles, trophée et médailles", g["Rewards"]["rewards"], g["Rewards"])
        ck("OA-08 [Ludo] Chaque onglet tient en un écran et demi au plus (≤ 1,5 × 844 px) : c'était le but de la réorganisation (2 900 px avant)",
           all(v["h"] <= 1.5 * 844 + 120 for v in g.values()), {k: v["h"] for k, v in g.items()})
        aller_onglet(page, "Today")
    ctx.close()

    # ------------------------------------------------------------------ OA-1x : aucune information perdue
    perdus_tot, notes_titres = {}, {}
    for nom, now in SITUATIONS.items():
        ctx = contexte(browser, base, collector, LS, now=now)
        page = open_app(ctx.new_page(), base)
        choisir_eleve(page)
        vues = []
        ts = page.locator("#dailybody").get_by_role("tab").all()
        if len(ts) >= 4:
            for i in range(len(ts)):
                page.locator("#dailybody").get_by_role("tab").nth(i).click()
                frames(page, 2)
                page.evaluate(OUVRIR_TOUT)
                vues.append(page.evaluate(EXTRAIRE, BLOCS))
        else:
            vues.append(page.evaluate(EXTRAIRE, BLOCS))
        blocs, atomes = reunion(vues)
        perdus, titres = [], []
        for s, L in avant[nom]["blocs"].items():
            for t in L:
                if t not in blocs.get(s, set()):
                    (titres if s in TITRES else perdus).append((s, t[:90]))
        atomes_perdus = [a for a in avant[nom]["atomes"] if a not in atomes and a.lower() not in ("calendar",)]
        perdus_tot[nom] = (perdus, atomes_perdus)
        notes_titres[nom] = titres
        ctx.close()
    for nom, (perdus, atomes_perdus) in perdus_tot.items():
        ck(f"OA-10 [Ludo] Aucun bloc perdu par rapport à l'écran d'avant (situation « {nom} ») : tous les blocs se retrouvent, mot pour mot, dans un onglet",
           not perdus, perdus[:5])
        ck(f"OA-11 [Ludo] Aucune phrase perdue (situation « {nom} ») : chaque texte de l'ancien écran se retrouve quelque part", not atomes_perdus, atomes_perdus[:8])
    for nom, titres in notes_titres.items():
        if titres:
            bilan.note("OA-12", f"Titres de section de l'écran d'avant qui n'existent plus (situation « {nom} ») : {len(titres)}", "; ".join(t for _, t in titres[:6]))

    # ------------------------------------------------------------------ OA-2x : mémorisation de l'onglet
    ctx = contexte(browser, base, collector, LS, now=T0)
    page = open_app(ctx.new_page(), base)
    choisir_eleve(page)
    aller_onglet(page, "Rewards")
    page.locator("#backD").click()
    wait_page(page, "menu")
    page.locator("#toDaily").click()
    wait_page(page, "daily")
    ck("OA-20 [Ludo] On quitte My daily work sur « Rewards » puis on y revient le même jour : l'écran rouvre sur « Rewards »", (onglet_actif(page) or "").lower() == "rewards", onglet_actif(page))
    reload_app(page)
    if current_page(page) == "who":
        page.locator(f'#plist [data-pid="{CAMILLE}"]').click()
        wait_page(page, "daily")
    ck("OA-21 [Ludo] Même chose après avoir rechargé l'application (l'onglet est mémorisé, pas seulement en mémoire vive)", (onglet_actif(page) or "").lower() == "rewards", onglet_actif(page))
    # un autre élève n'hérite pas de l'onglet de Camille ; Camille garde le sien
    page.evaluate(f"() => {{ useProfile('{NOE}'); show('menu'); }}")
    wait_page(page, "menu")
    page.locator("#toDaily").click()
    wait_page(page, "daily")
    noe0 = onglet_actif(page)
    aller_onglet(page, "My level")
    page.evaluate(f"() => {{ useProfile('{CAMILLE}'); show('menu'); }}")
    page.locator("#toDaily").click()
    wait_page(page, "daily")
    cam1 = onglet_actif(page)
    ck("OA-22 [Ludo] L'onglet est mémorisé par élève : le 2e élève ouvre sur « Today » (son premier lancement du jour), Camille retrouve « Rewards »",
       (noe0 or "").lower() == "today" and (cam1 or "").lower() == "rewards", [noe0, cam1])
    # le lendemain, premier lancement du jour : Today, même si on avait laissé Rewards
    jour(page, "2026-11-03")
    reload_app(page)
    if current_page(page) == "who":
        page.locator(f'#plist [data-pid="{CAMILLE}"]').click()
        wait_page(page, "daily")
    ck("OA-23 [Ludo] Le lendemain, au premier lancement du jour, l'écran rouvre sur « Today » (même si « Rewards » avait été laissé)", (onglet_actif(page) or "").lower() == "today", onglet_actif(page))
    aller_onglet(page, "Week")
    page.locator("#backD").click()
    wait_page(page, "menu")
    page.locator("#toDaily").click()
    wait_page(page, "daily")
    ck("OA-24 [Ludo] Puis, le même jour, il rouvre sur l'onglet laissé (« Week »)", (onglet_actif(page) or "").lower() == "week", onglet_actif(page))
    ctx.close()

    # ------------------------------------------------------------------ OA-3x : Start visible sans défiler
    TAILLES = {"iPhone SE 375×667": (375, 667), "iPhone 390×844": (390, 844)}
    for taille, vp in TAILLES.items():
        for sit, now in (("matin avec contrôle de classe", T0), ("objectif atteint", FIXED_NOW)):
            ctx = contexte(browser, base, collector, LS, now=now, viewport=vp)
            page = open_app(ctx.new_page(), base)
            choisir_eleve(page)
            r = page.evaluate("""() => { const b = document.querySelector('#dround, #dmore'); const e = document.getElementById('dround'); if (!e) return null;
              const x = e.getBoundingClientRect(); return { top: Math.round(x.top), bottom: Math.round(x.bottom), h: innerHeight, sy: scrollY, vis: !!(e.offsetParent), banniere: !!document.getElementById('t6ban') }; }""")
            ck(f"OA-30 [Ludo] « Start » entièrement visible sans défiler — {taille}, {sit}",
               r is not None and r["sy"] == 0 and r["top"] >= 0 and r["bottom"] <= r["h"], r)
            ctx.close()
        # avec un certificat à renouveler (bandeau Renew) ET le contrôle de classe : le pire cas
        # certificat obtenu le 9 août (3 mois : échéance le 9 novembre) ; le 2 novembre il est à J-7, le jour du contrôle de classe « Unit 1 »
        ctx = contexte(browser, base, collector, LS, now="2026-08-09T10:00:00", viewport=vp)
        page = open_app(ctx.new_page(), base)
        page.evaluate(f"""() => {{ Cert.record('{CAMILLE}', 'adjectives:colours', {{ kind: 'exam', n: 20, good: 19, formats: ['type-fr-en','gap','order'] }}); }}""")
        jour(page, "2026-11-02")
        page.reload()
        settle_to_daily(page)
        r = page.evaluate("""() => { const e = document.getElementById('dround'); if (!e) return null; const x = e.getBoundingClientRect();
              return { top: Math.round(x.top), bottom: Math.round(x.bottom), h: innerHeight, sy: scrollY, renew: /renew/i.test(document.getElementById('dailybody').textContent) }; }""")
        ck(f"OA-31 [Ludo] « Start » visible sans défiler même avec le bandeau Renew (certificat à J-7) — {taille}",
           r is not None and r["renew"] and r["sy"] == 0 and r["top"] >= 0 and r["bottom"] <= r["h"], r)
        ctx.close()

    # ------------------------------------------------------------------ OA-4x : bande des 7 jours
    ctx = contexte(browser, base, collector, LS, now=FIXED_NOW)
    page = open_app(ctx.new_page(), base)
    choisir_eleve(page)
    bande = page.evaluate(BANDE_JS)
    attendu = page.evaluate("""() => { const t = todayKey(), out = []; for (let i = 6; i >= 0; i--) { const k = addDays(t, i * -1), r = DST.days[k];
        out.push({ k, wd: kDate(k).toLocaleDateString('en-GB', { weekday: 'short' }), st: dayDone(r) ? 'done' : (r && (r.qs || []).length ? 'part' : 'none') }); } return { days: out, streak: streak() }; }""")
    ck("OA-40 [Ludo] Onglet Today : une bande de 7 jours (un élément par jour, avec le nom du jour)", bande is not None and len(bande["cells"]) == 7, bande and [c["txt"] for c in bande["cells"]])
    if bande is not None and len(bande["cells"]) == 7:
        noms = [c["wd"] for c in bande["cells"]]
        ck("OA-41 [Ludo] Les 7 jours sont consécutifs et finissent aujourd'hui (le dernier est marqué « aujourd'hui »)",
           [n.lower()[:3] for n in noms] == [d["wd"].lower()[:3] for d in attendu["days"]] and bande["cells"][-1]["today"], [noms, [d["wd"] for d in attendu["days"]], bande["cells"][-1]])
        sig = [c["sig"] for c in bande["cells"]]
        par_etat = {}
        for s, d in zip(sig, attendu["days"]):
            par_etat.setdefault(d["st"], set()).add(s)
        etats = [d["st"] for d in attendu["days"]]
        coherent = all(len(v) == 1 for v in par_etat.values()) and len({next(iter(v)) for v in par_etat.values()}) == len(par_etat)
        ck("OA-42 [Ludo] Chaque jour est dessiné selon son état dans le journal (objectif atteint / un peu de travail / rien) : même état = même dessin, états différents = dessins différents",
           coherent and len(par_etat) >= 2, {"états attendus": etats, "dessins": sig})
        ck("OA-43 [Ludo] La série de jours (streak) est affichée près de la bande", re.search(rf"(?<!\d){attendu['streak']}(?!\d)", bande["ctx"] or "") is not None, {"streak": attendu["streak"], "texte": bande["ctx"]})
        if bande["h"] > 110:
            bilan.note("OA-44", "La bande des 7 jours mesure plus de 110 px de haut (≈ 70 px dans la maquette)", bande["h"])
    ctx.close()

    # ------------------------------------------------------------------ OA-5x : pas de défilement horizontal, libellés d'onglets entiers
    for taille, vp in TAILLES.items():
        for reglage in ("normal", "large", "xlarge"):
            ls = dict(LS)
            ls[f"kai.textsize.{CAMILLE}"] = reglage
            ctx = contexte(browser, base, collector, ls, now=FIXED_NOW, viewport=vp)
            page = open_app(ctx.new_page(), base)
            choisir_eleve(page)
            mauvais = []
            for o in ONGLETS:
                if not aller_onglet(page, o):
                    mauvais.append((o, "onglet introuvable"))
                    continue
                m = page.evaluate("""() => { const d = document.documentElement; const tabs = [...document.querySelectorAll('#dailybody [role=tab]')];
                    const bar = tabs[0] && tabs[0].parentElement;
                    return { sw: d.scrollWidth, cw: d.clientWidth, coupes: tabs.filter(t => t.scrollWidth > t.clientWidth + 1 || t.scrollHeight > t.clientHeight + 1).map(t => t.textContent.trim()),
                             barre: bar ? [bar.scrollWidth, bar.clientWidth] : null, hors: tabs.filter(t => t.getBoundingClientRect().right > innerWidth + 1 || t.getBoundingClientRect().left < -1).map(t => t.textContent.trim()) }; }""")
                if m["sw"] > m["cw"] + 1 or m["coupes"] or m["hors"] or (m["barre"] and m["barre"][0] > m["barre"][1] + 1):
                    mauvais.append((o, m))
            ck(f"OA-50 [Ludo/Ouss] {taille}, texte « {reglage} » : pas de défilement horizontal, les quatre libellés d'onglets tiennent entiers dans l'écran", not mauvais, mauvais[:2])
            ctx.close()

    # ------------------------------------------------------------------ OA-6x : Start lance un tour ; bulles de fin à 18 px
    ctx = contexte(browser, base, collector, LS, now=T0)
    page = open_app(ctx.new_page(), base)
    choisir_eleve(page)
    page.locator("#dround").click()
    ok = wait_js(page, "() => (document.querySelector('.page.on')||{}).id === 'quiz'")
    ck("OA-60 [Ludo] « Start » (onglet Today) lance un tour de mots du jour : l'écran Quiz s'ouvre", ok and page.evaluate("() => DAILY === true && QZ && QZ.qs && QZ.qs[0].length === 10") is True, current_page(page))
    ctx.close()
    for taille, vp in TAILLES.items():
        ctx = contexte(browser, base, collector, LS, now=FIXED_NOW, viewport=vp)
        page = open_app(ctx.new_page(), base)
        choisir_eleve(page)
        m = page.evaluate(PX_BULLES_JS)
        ck(f"OA-61 [Ludo] Bulles de fin d'exercice (Kai) : texte de 18 px au moins à l'écran — {taille} (bulle de l'écran + bulles « score » produites par kaiBig)",
           m["sizes"] and min(m["sizes"]) >= 17.8, m)
        ctx.close()

    errs = collector.since(m0)
    ck("OA-99 Aucune erreur console ni exception JS pendant toute la suite", not errs, errs[:5])


# Bande des 7 jours : l'élément qui a 7 enfants portant chacun un nom de jour (Mon…Sun), dans l'onglet Today.
BANDE_JS = r"""() => {
  const root = document.getElementById('dailybody'), WD = /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/i;
  const lab = k => (k.textContent || '') + ' ' + (k.getAttribute('aria-label') || '') + ' ' + (k.getAttribute('title') || '');
  for (const el of root.querySelectorAll('*')) {
    const kids = [...el.children]; if (kids.length < 7 || el.closest('.cal') || el.closest('.moods')) continue;
    const wk = kids.filter(k => WD.test(lab(k)));
    if (wk.length !== 7) continue;
    const cells = wk.map(k => { const m = lab(k).match(WD);
      return { txt: (k.textContent || '').replace(/\s+/g, ' ').trim(), wd: m[0], today: /today|now|cur/i.test(k.className + ' ' + (k.getAttribute('aria-current') || '') + ' ' + (k.getAttribute('aria-label') || '')),
               sig: (k.className || '').toString().replace(/\b(today|on|sel)\b/g, '').replace(/\s+/g, ' ').trim() + '|' + [...k.querySelectorAll('svg,img,i,b,em')].map(x => (x.className && x.className.baseVal !== undefined ? x.className.baseVal : x.className) + ':' + (x.getAttribute('src') || x.getAttribute('data-s') || '')).join(',') }; });
    const r = el.getBoundingClientRect(), up = el.parentElement && el.parentElement.parentElement || el;
    return { cells, h: Math.round(r.height), ctx: (up.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300), cls: el.className };
  }
  return null;
}"""

PX_BULLES_JS = r"""() => {
  const host = document.querySelector('.page.on'), out = [];
  const mesure = (html) => { const d = document.createElement('div'); d.className = 'dend'; d.innerHTML = html; host.appendChild(d);
    const svg = d.querySelector('svg'), sc = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    const s = [...d.querySelectorAll('text, tspan')].map(e => Math.round(parseFloat(getComputedStyle(e).fontSize) * sc * 10) / 10); d.remove(); return { sc: Math.round(sc * 100) / 100, s }; };
  const a = mesure(kaiBig('joy', [['All done!'], ['See you'], [['tomorrow!']]], 'All done'));
  const b = mesure(kaiBig('dyn', [['Keep going!'], [['7'], ' words'], ['to go!']], 'Keep going'));
  const c = mesure(kaiBig('joy', [['Your score'], [['8'], ' / 10'], ['Great job!']], 'Your score'));
  const e = document.querySelector('#dailybody .dend');
  const sizes = [...a.s, ...b.s, ...c.s].filter(x => x > 0);
  return { sizes, echelle: a.sc, ecran: e ? [...e.querySelectorAll('text')].map(t => t.getBoundingClientRect().height) : null };
}"""


def settle_to_daily(page):
    from kai_common import settle
    settle(page)
    if current_page(page) == "who":
        page.locator(f'#plist [data-pid="{CAMILLE}"]').click()
    elif current_page(page) == "menu":
        page.locator("#toDaily").click()
    wait_page(page, "daily")
    page.wait_for_selector("#dailybody .ddate")


def extra(ap):
    ap.add_argument("--update-reference", action="store_true", help="photographie les blocs de l'écran d'AVANT les onglets (une fois, sur la version d'avant)")


if __name__ == "__main__":
    raise SystemExit(run_suite("daily-onglets", __doc__, run, extra))
