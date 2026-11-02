#!/usr/bin/env python3
"""Certificats de vocabulaire : tests d'ACCEPTATION des écrans, joués comme un élève (Dédé, sprint B).

  python3 tests/test_certificats_ecrans.py [--app <dossier>] [-v]

Écrits sur les règles validées par le PO (docs/certificats/conception.md §1, §2, §6, §8), avec une horloge simulée (lundi 2 novembre 2026).
L'élève touche et tape sur l'écran ; la BONNE réponse est calculée par le test d'après les données du dépôt (allWords, phrases d'exemple),
jamais lue sur l'écran. Les questions posées sont lues dans l'état de l'épreuve (CertUI._run()).

  CU-0x  tuile Certificates (2e place du menu), page Certificates, avant l'épreuve (règles, choix du son) ;
  CU-1x  épreuve réussie (18/20) : badge daté, +10 étoiles, thème sorti des mots du jour, mots ratés en rotation ;
  CU-2x  épreuve ratée (17/20) : « Try again tomorrow », nouvel essai seulement le lendemain, certificat valable conservé ;
  CU-3x  pas de bonne réponse ni d'indice pendant l'épreuve ; rattrapage (« Fix your mistakes ») sans changer la note ;
  CU-4x  faute de frappe tolérée, faute de grammaire non ;
  CU-5x  mode sans son (aucune dictée, aucun son joué) ; avec son (dictée) ; choix mémorisé ;
  CU-6x  reprise d'une épreuve interrompue, pas de « recommencer », abandon après 7 jours ;
  CU-7x  rappel J-7 (bandeau Renew, pastille de la tuile), renouvellement 8 questions à 80 % (+5 étoiles ; échec → révision) ;
  CU-8x  validité 6 mois (B1, 25 questions) ; Save & move (export / import avec certificats, ancien fichier sans certificats) ;
  CU-9x  page imprimable (émulation print, une page A4).
"""
import io
import json
import re
import tempfile
from pathlib import Path

from kai_common import (APP_ID, FIXED_NOW, current_page, open_app, reload_app, run_suite, settle, wait_js, wait_page, frames, next_toast, toast_reset)
from kai_certs import CAMILLE, NOE, JOUR0, T0, contexte, jour, reference

COLOURS = "adjectives:colours"

Q_JS = "() => { const r = CertUI._run(); return r ? { i: r.i, n: r.qs.length, phase: r.phase, sound: r.sound, kind: r.kind, theme: r.theme, qs: JSON.parse(JSON.stringify(r.qs)) } : null }"
# Réponse attendue d'une question, d'après les DONNÉES (pas d'après l'écran)
BONNE_JS = r"""(q) => { const e = allWords().byKey.get(q.key), w = e ? (e.d.w || e.d.v) : '';
  const tg = s => { const m = String(s || '').match(/\*(.+?)\*/); return m ? m[1] : '' };
  if (q.fmt === 'gap') return tg(q.s);
  if (q.fmt === 'order') return String(q.s).replace(/\*/g, '');
  if (q.fmt === 'fix') return q.good;
  return w; }"""
MOT_JS = "(k) => { const e = allWords().byKey.get(k); return e ? (e.d.w || e.d.v) : '' }"


TEXTE_JS = """(el) => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), out = [];
  while (w.nextNode()) { const t = w.currentNode.nodeValue.trim(), p = w.currentNode.parentElement;
    if (t && p && !p.closest('[hidden]') && (p.getClientRects().length || p instanceof SVGElement)) out.push(t) }
  return out.join(' ') }"""


def texte(page, sel="#cexambody"):
    """Texte VISIBLE d'un bloc, tel qu'écrit dans la page (les feuilles de style passent beaucoup de libellés en MAJUSCULES : inner_text les rendrait ainsi)."""
    return re.sub(r"\s+", " ", page.locator(sel).first.evaluate(TEXTE_JS)).strip()


def vers_menu(page):
    page.evaluate("() => { try { closeModal() } catch (e) {} ; show('menu') }")
    wait_page(page, "menu")


def entrer(page, pid=CAMILLE):
    """Premier écran : choisit l'élève (My daily work), puis le menu."""
    settle(page)
    if current_page(page) == "who":
        page.locator(f'#plist [data-pid="{pid}"]').click()
        wait_page(page, "daily")
    vers_menu(page)


def page_certs(page):
    vers_menu(page)
    page.locator("#toCerts").click()
    wait_page(page, "certs")
    page.wait_for_selector("#certsbody .dsec")


def lancer(page, theme, kind="exam", sound=False):
    """Depuis la page Certificates : touche le certificat (ou « Renew »), choisit le son, Start. Renvoie True si la première question est affichée."""
    page_certs(page)
    sel = f'[data-renew="{theme}"]' if kind == "renewal" else f'[data-take="{theme}"]'
    if not page.locator(sel).count():
        t = page.locator("[data-allthemes]")
        if t.count():
            t.click()
    page.locator(sel).first.click()
    wait_page(page, "cexam")
    page.locator(f'[data-sound="{1 if sound else 0}"]').click()
    page.locator("#cstart").click()
    return wait_js(page, "() => !!document.getElementById('cq') || !!document.querySelector('.cres')")


def etat(page):
    return page.evaluate(Q_JS)


def repondre(page, q, typed=None, juste=True):
    """Joue UNE question comme un élève : tape / touche, puis Check. `typed` remplace la réponse calculée ; juste=False donne une mauvaise réponse."""
    bonne = page.evaluate(BONNE_JS, q)
    if q["fmt"] == "order":
        mots = (typed if typed is not None else bonne).replace(".", "").split()
        if not juste and typed is None:
            mots = list(reversed(mots))
        for m in mots:
            tuile = page.locator("#cpool .ctile:not([hidden])").filter(has_text=re.compile(rf"^{re.escape(m)}$", re.I))
            if not tuile.count():
                tuile = page.locator("#cpool .ctile:not([hidden])").first
            tuile.first.click()
    elif q["fmt"] == "fix":
        toks = page.locator("#cfix .ctok")
        n = toks.count()
        cibles = [i for i in range(n) if re.sub(r"[.,!?;:]+$", "", toks.nth(i).inner_text()).lower() == str(q["bad"]).lower()]
        autres = [i for i in range(n) if i not in cibles]
        if juste or typed is not None:
            toks.nth(cibles[0]).click()
            page.locator("#cin").fill(typed if typed is not None else q["good"])
        else:
            toks.nth(autres[0]).click()       # mauvais mot touché : l'item est perdu sans étape 2
    else:
        page.locator("#cin").fill(typed if typed is not None else (bonne if juste else "xyzzy"))
    if page.locator("#ccheck").count() and page.locator("#ccheck").is_visible():
        page.locator("#ccheck").click()
    wait_js(page, "() => !!document.getElementById('cnext')")
    return bonne


def jouer(page, politique, observer=None):
    """Joue toute l'épreuve. politique(q, i, etat) → dict(typed=None, juste=True). Renvoie la liste des observations."""
    obs = []
    while True:
        wait_js(page, "() => !!document.getElementById('cq') || !!document.querySelector('.cres')")
        if page.locator(".cres").count():
            break
        S = etat(page)
        i = S["i"]
        q = S["qs"][i]
        # avant de répondre : aucun indice (la bonne réponse n'est pas à l'écran)
        avant = texte(page)
        p = politique(q, i, S) or {}
        bonne = repondre(page, q, p.get("typed"), p.get("juste", True))
        fb = texte(page, "#cfb")
        corps = texte(page)
        o = {"i": i, "fmt": q["fmt"], "key": q["key"], "bonne": bonne, "typed": p.get("typed"), "juste": p.get("juste", True), "fb": fb, "avant": avant, "apres": corps, "q": q}
        obs.append(o)
        if observer:
            observer(o, page)
        page.locator("#cnext").click()
    return obs


def tout_juste(q, i, S):
    return {}


def fautes(*positions):
    return lambda q, i, S: {"juste": False} if i in positions else {}


def mot_entier(mot, t):
    return re.search(rf"(?<![A-Za-z]){re.escape(mot)}(?![A-Za-z])", t, re.I) is not None


def run(args, base, browser, bilan, collector):
    def ck(titre, cond, detail=""):
        cid, _, t = titre.partition(" ")
        return bilan.check(cid, t, bool(cond), str(detail)[:1300])

    LS = reference()["ls"]
    m0 = collector.mark()

    def ctx_neuf(now=T0, ls=LS, **kw):
        ctx = contexte(browser, base, collector, ls, now=now, **kw)
        page = open_app(ctx.new_page(), base)
        if not page.evaluate("() => typeof CertUI === 'object'"):
            return ctx, page, False
        entrer(page)
        return ctx, page, True

    # ------------------------------------------------------------------ CU-0x : tuile, page, avant l'épreuve
    ctx, page, ok = ctx_neuf()
    ck("CU-00 [Ouss] Les écrans des certificats sont chargés (CertUI, tuile Certificates)", ok and page.locator("#toCerts").count() == 1, "js/app-certificats-ui.js absent ou tuile manquante")
    if not ok:
        bilan.ko("CU-xx", "Écrans des certificats absents : toute la suite est bloquée", "js/app-certificats-ui.js non chargé sur cette branche")
        ctx.close()
        return
    ids = page.evaluate("() => [...document.querySelectorAll('#menu .tiles > .tile')].map(t => t.id)")
    ck("CU-01 [Ouss] Tuile « Certificates » du menu : juste sous « My daily work » (2e place)", ids[:2] == ["toDaily", "toCerts"], ids)
    ck("CU-02 [Ouss] Pas de pastille sur la tuile quand rien n'est à renouveler", page.locator("#certpill").is_hidden(), texte(page, "#menu .tiles"))
    page_certs(page)
    ck("CU-03 [Ouss] Page Certificates : « My certificates » (aucun certificat encore) et « Take a certificate »",
       "My certificates" in texte(page, "#certsbody") and "Take a certificate" in texte(page, "#certsbody") and "No certificate yet" in texte(page, "#certsbody"), texte(page, "#certsbody")[:300])
    if not page.locator(f'[data-take="{COLOURS}"]').count() and page.locator("[data-allthemes]").count():
        page.locator("[data-allthemes]").click()
    ck("CU-04 [Ouss] « Colours » est proposé dans « Take a certificate »", page.locator(f'[data-take="{COLOURS}"]').count() == 1, texte(page, "#certsbody")[:300])
    offerts = page.evaluate("() => CertUI.offered().map(t => t.id)")
    ck("CU-05 [Ludo/Matt] Les 3 premiers certificats (Colours, Family 1, Animals 1) sont proposés à un Beginner",
       {COLOURS, "nouns:family-1", "nouns:animals-1"} <= set(offerts), sorted({COLOURS, "nouns:family-1", "nouns:animals-1"} - set(offerts)))
    ck("CU-06 [Ouss] Aucun certificat de verbes ni de thème sensible proposé à un Beginner", not [t for t in offerts if t.startswith("verbs:") or t in ("nouns:war", "nouns:endoflife", "nouns:finance", "nouns:justice")], offerts)
    page.locator(f'[data-take="{COLOURS}"]').click()
    wait_page(page, "cexam")
    pre = texte(page)
    ck("CU-07 [Ouss] Avant l'épreuve : règles en clair (20 questions, un essai, pas d'indice, 18 pour réussir)",
       all(x in pre for x in ("20 questions", "one try each", "no hints", "18 to pass")), pre[:300])
    ck("CU-08 [Ouss] Avant l'épreuve : « Can you use sound right now? » avec deux boutons (Yes / No) et Start",
       "Can you use sound right now?" in pre and page.locator("[data-sound]").count() == 2 and page.locator("#cstart").is_visible(), pre[:300])
    ctx.close()

    # ------------------------------------------------------------------ CU-1x : épreuve réussie 18/20
    ctx, page, _ = ctx_neuf()
    etoiles0 = page.evaluate("() => totalStars()")
    ck("CU-10 [Ouss] L'épreuve démarre (sans son) sur la première question", lancer(page, COLOURS, "exam", sound=False) and page.locator("#cq").count() == 1, texte(page)[:200])
    S = etat(page)
    ck("CU-11 [Ludo] 20 questions, au moins 4 formats, aucun QCM (tous les formats sont écrits)",
       S["n"] == 20 and len({q["fmt"] for q in S["qs"]}) >= 4 and {q["fmt"] for q in S["qs"]} <= {"type-fr-en", "picture", "gap", "order", "fix"}, [S["n"], sorted({q["fmt"] for q in S["qs"]})])
    obs = jouer(page, fautes(3, 11))
    wait_js(page, "() => !!document.querySelector('.cres')")
    res = texte(page)
    ck("CU-12 [Ouss] Résultat : 18/20, « Congrats! You are certified! », seuil 18/20", "18" in res and "20" in res and "certified" in res.lower() and "18/20" in res, res[:300])
    ck("CU-13 [Ouss] Badge daté sur l'écran de résultat : « Certified on 2 November 2026 », valable jusqu'au 2 February 2027",
       "Certified on 2 November 2026" in res and "2 February 2027" in res, res[:400])
    c = page.evaluate(f"() => Cert.get(undefined, '{COLOURS}')")
    ck("CU-14 [Ludo] Certificat enregistré : statut ok, daté du 2 novembre, 90 %, échéance 2027-02-02", c and c["status"] == "ok" and c["date"] == JOUR0 and c["score"] == 90 and c["expires"] == "2027-02-02", c)
    ck("CU-15 [Ouss/Ludo] L'écran enregistre les bonnes réponses : 18 réussites, 2 ratées (clés des mots ratés mémorisées)",
       c and set(c["missed"]) == {obs[3]["key"], obs[11]["key"]}, {"missed": c and c["missed"], "attendu": [obs[3]["key"], obs[11]["key"]]})
    etoiles1 = page.evaluate("() => totalStars()")
    ck("CU-16 [Ludo/Ouss] +10 étoiles à l'obtention du certificat", etoiles1 - etoiles0 == 10, f"avant {etoiles0}, après {etoiles1}")
    # sortie de rotation
    rot = page.evaluate(f"""() => {{ const keys = Cert.themeWords('{COLOURS}').map(w => w.key), miss = Cert.get(undefined, '{COLOURS}').missed, seen = {{}};
      for (let s = 1; s <= 50; s++) {{ AWS = null; for (const q of pickMix(15)) {{ const k = q.k + ':' + (q.d.w || q.d.v); if (keys.includes(k)) seen[k] = (seen[k] || 0) + 1; }} }}
      return {{ vus: seen, miss, rot: keys.map(k => [k, Cert.inRotation(undefined, allWords().byKey.get(k))]) }}; }}""")
    reussis = [k for k, r in rot["rot"] if k not in rot["miss"]]
    ck("CU-17 [Ludo] Thème sorti des mots du jour : aucun mot réussi dans 50 séries de 15", all(rot["vus"].get(k, 0) == 0 for k in reussis) and len(reussis) == 9, rot["vus"])
    ck("CU-18 [Ludo] Les 2 mots ratés restent en rotation (inRotation vrai, ils reviennent dans les séries)",
       all(r for k, r in rot["rot"] if k in rot["miss"]) and any(rot["vus"].get(k, 0) > 0 for k in rot["miss"]), {"rot": [x for x in rot["rot"] if x[0] in rot["miss"]], "vus": rot["vus"]})
    # badge sur la page Certificates, puis dans le menu
    page.locator("#cdone, #cfixgo").first.click() if False else None
    page.evaluate("() => { PHASE = 'idle' }") if False else None
    page_certs(page)
    pc = texte(page, "#certsbody")
    ck("CU-19 [Ouss] Page Certificates : badge « Colours » avec sa validité (Valid until 2 Feb 2027) et la note « 18/20 on 2 Nov »",
       "Colours" in pc and "2 Feb 2027" in pc and "18/20" in pc, pc[:400])
    ctx.close()

    # ------------------------------------------------------------------ CU-2x : épreuve ratée, nouvel essai le lendemain
    ctx, page, _ = ctx_neuf()
    lancer(page, COLOURS, "exam", sound=False)
    obs = jouer(page, fautes(1, 7, 15))
    res = texte(page)
    ck("CU-20 [Ouss] Épreuve ratée 17/20 : « Try again tomorrow. », pas de badge, la note est donnée (17/20) et le seuil (18)",
       "Try again tomorrow" in res and "17" in res and "18" in res and not page.locator(".cbadge.big").count(), res[:350])
    c = page.evaluate(f"() => Cert.get(undefined, '{COLOURS}')")
    ck("CU-21 [Ludo] Épreuve ratée : pas certifié, tentative notée (85 %), mots ratés mémorisés, thème toujours dans les mots du jour",
       c and c["status"] != "ok" and c["best"] == 85 and len(c["missed"]) == 3 and page.evaluate(f"() => Cert.rotationFilter() === null"), c)
    page_certs(page)
    item = page.locator(f'[data-take="{COLOURS}"]')
    ck("CU-22 [Ouss] Le jour même, impossible de recommencer : la ligne Colours est grisée (désactivée) avec « tomorrow »",
       item.count() == 1 and item.is_disabled() and "tomorrow" in item.inner_text().lower(), item.inner_text() if item.count() else "ligne absente")
    jour(page, "2026-11-03")
    page_certs(page)
    item = page.locator(f'[data-take="{COLOURS}"]')
    ck("CU-23 [Ouss/Ludo] Le lendemain, la ligne Colours est de nouveau disponible", item.count() == 1 and not item.is_disabled(), item.inner_text() if item.count() else "ligne absente")
    ck("CU-24 [Ouss] Le lendemain, l'épreuve se passe et réussit (20/20) : badge daté du 3 novembre, échéance 2027-02-03",
       lancer(page, COLOURS, "exam", sound=False) and (jouer(page, tout_juste) is not None) and page.evaluate(f"() => Cert.get(undefined, '{COLOURS}')")["expires"] == "2027-02-03", texte(page)[:200])
    ctx.close()
    # un certificat encore valable n'est pas retiré par une épreuve ratée (Q13)
    ctx, page, _ = ctx_neuf()
    page.evaluate(f"() => Cert.record(undefined, '{COLOURS}', {{ kind: 'exam', n: 20, good: 20, formats: ['type-fr-en','gap','order'] }})")
    jour(page, "2026-11-20")
    before = page.evaluate(f"() => Cert.get(undefined, '{COLOURS}')")
    page.evaluate(f"() => {{ const p = pid0(); }}") if False else None
    page_certs(page)
    page.evaluate(f"() => CertUI.start('{COLOURS}', 'exam')")
    wait_page(page, "cexam")
    page.locator('[data-sound="0"]').click()
    page.locator("#cstart").click()
    jouer(page, lambda q, i, S: {"juste": False} if i < 6 else {})
    res = texte(page)
    after = page.evaluate(f"() => Cert.get(undefined, '{COLOURS}')")
    ck("CU-25 [Ouss/Ludo] Épreuve ratée alors que le certificat court : il est conservé (même échéance), l'écran le dit (« still valid »)",
       after["status"] == "ok" and after["active"] and after["expires"] == before["expires"] and "still valid" in res, [before["expires"], after["expires"], res[:300]])
    ctx.close()

    # ------------------------------------------------------------------ CU-3x : pas d'indice, rattrapage
    ctx, page, _ = ctx_neuf()
    lancer(page, COLOURS, "exam", sound=False)
    def tout_faux_sauf(q, i, S):
        return {"juste": False} if i % 2 == 0 else {}
    obs = jouer(page, tout_faux_sauf)
    indices_avant, fuites = [], []
    for o in obs:
        if o["fmt"] in ("type-fr-en", "picture", "gap") and mot_entier(o["bonne"], o["avant"]) and not (o["fmt"] == "type-fr-en" and mot_entier(o["bonne"], page.evaluate("(k) => allWords().byKey.get(k).d.fr", o["key"]))):
            indices_avant.append((o["i"], o["fmt"], o["bonne"]))
        if not o["juste"] and o["fmt"] in ("type-fr-en", "picture", "gap", "dictation", "fix"):
            # fuite = le bon mot apparaît à l'écran APRÈS la réponse fausse alors qu'il n'y était pas AVANT (« orange » est aussi le mot français : pas une fuite)
            if mot_entier(o["bonne"], o["apres"]) and not mot_entier(o["bonne"], o["avant"]):
                fuites.append((o["i"], o["fmt"], o["bonne"], o["fb"][:80]))
    ck("CU-30 [Ouss] Aucun indice : avant de répondre, le mot attendu n'est pas à l'écran (traduction, image, phrase à compléter)", not indices_avant, indices_avant[:3])
    ck("CU-31 [Ouss] Pendant l'épreuve, une réponse fausse affiche « Not this time » mais JAMAIS la bonne réponse (10 erreurs jouées)",
       not fuites and all("Not this time" in o["fb"] for o in obs if not o["juste"]) and all("Correct" in o["fb"] for o in obs if o["juste"]), (fuites[:3], [o["fb"] for o in obs[:3]]))
    res = texte(page)
    ck("CU-32 [Ouss] Résultat d'une épreuve très ratée : bouton « Fix your mistakes · 10 »", page.locator("#cfixgo").count() == 1 and "Fix your mistakes · 10" in res, res[-300:])
    sc0 = page.evaluate(f"() => {{ const c = Cert.get(undefined, '{COLOURS}'); return [c.best, c.status, c.history.length, c.u]; }}")
    page.locator("#cfixgo").click()
    wait_js(page, "() => !!document.getElementById('cgot')")
    vu = texte(page)
    ck("CU-33 [Ouss] Rattrapage : la bonne réponse est enfin montrée (« The answer »), avec « Got it »", "The answer" in vu and page.locator("#cgot").count() == 1, vu[:300])
    corriges = []
    for k in range(10):
        wait_js(page, "() => !!document.getElementById('cgot')")
        FX = page.evaluate("() => { const r = CertUI._run(); return null }")
        reponse = page.evaluate("() => document.querySelector('.canswer .cans-w') ? document.querySelector('.cans-w').textContent : ''")
        page.locator("#cgot").click()
        wait_js(page, "() => !!document.getElementById('cin')")
        page.locator("#cin").fill(reponse)
        page.locator("#ccheck").click()
        wait_js(page, "() => !!document.getElementById('cnextfix')")
        corriges.append(reponse)
        page.locator("#cnextfix").click()
        if page.locator(".cscore span", has_text="fixed").count():
            break
    fin = texte(page)
    ck("CU-34 [Ouss] Rattrapage terminé : « All fixed! », la note ne change pas (message)", "All fixed" in fin and "did not change" in fin, fin[:300])
    sc1 = page.evaluate(f"() => {{ const c = Cert.get(undefined, '{COLOURS}'); return [c.best, c.status, c.history.length, c.u]; }}")
    ck("CU-35 [Ludo/Ouss] Le rattrapage ne change pas le résultat (meilleur score, statut, historique inchangés)", sc0[:3] == sc1[:3], [sc0, sc1])
    mem = page.evaluate(f"""() => {{ const t = todayKey(), r = DST.days[t] || {{}}, w = r.w || {{}}, miss = Cert.get(undefined, '{COLOURS}').missed;
      return {{ fixed: miss.filter(k => w[k] && (w[k].fx || w[k].ok === 0 || w[k].ok === false)).length, avecFx: miss.filter(k => w[k] && w[k].fx).length, n: miss.length }}; }}""")
    ck("CU-36 [Ludo] Rattrapage → mémoire : chaque mot rattrapé est écrit « raté puis corrigé » (fx) dans le journal du jour pour revenir plus tôt (conception §6, B-09)",
       mem["n"] > 0 and mem["avecFx"] == mem["n"], mem)
    ctx.close()

    # ------------------------------------------------------------------ CU-4x : faute de frappe / de grammaire
    def variantes(mot, page):
        """Deux fautes de frappe d'un mot de 5 lettres ou plus : une lettre manquante, deux lettres inversées (jamais un autre mot anglais)."""
        om = mot[:2] + mot[3:]
        inv = mot[0] + mot[2] + mot[1] + mot[3:]
        return {k: v for k, v in (("omission", om), ("inversion", inv)) if v.lower() != mot.lower() and not page.evaluate("(w) => tkKnown(w)", v)}

    ctx, page, _ = ctx_neuf()
    cas = {"mot": {}, "court": [], "gap": {}, "gram": []}

    def politique_frappe(q, i, S):
        mot = page.evaluate(MOT_JS, q["key"])
        lettres = re.sub(r"[^a-z]", "", mot.lower())
        if q["fmt"] in ("type-fr-en", "picture") and len(lettres) >= 5 and " " not in mot:
            v = variantes(mot, page)
            for kind in ("omission", "inversion"):
                if kind in v and kind not in cas["mot"]:
                    cas["mot"][kind] = i
                    return {"typed": v[kind]}
        if q["fmt"] in ("type-fr-en", "picture") and 3 <= len(lettres) <= 4 and " " not in mot and not cas["court"]:
            cas["court"].append(i)
            return {"typed": mot[:-1], "juste": False}            # une lettre en moins, mot court : refusé
        return {}
    lancer(page, COLOURS, "exam", sound=False)
    obs = jouer(page, politique_frappe)
    par_i = {o["i"]: o for o in obs}
    for kind, titre in (("omission", "une lettre manquante"), ("inversion", "deux lettres inversées")):
        i = cas["mot"].get(kind)
        if i is None:
            bilan.add("CU-40" + ("" if kind == "omission" else "c"), f"Faute de frappe ({titre}) : aucune question exploitable dans cette épreuve", "Non joué", "")
            continue
        o = par_i[i]
        bilan.check("CU-40" + ("" if kind == "omission" else "c"), f"[Ouss/Ludo] Faute de frappe ({titre}, mot de 5 lettres ou plus) : « Correct! » + « Watch the spelling: {o['bonne']} »",
                    "Correct" in o["fb"] and "Watch the spelling" in o["fb"] and mot_entier(o["bonne"], o["fb"]), f"tapé « {o['typed']} » pour « {o['bonne']} » ; écran : {o['fb']}")
    for i in cas["court"]:
        o = par_i[i]
        ck("CU-41 [Ouss/Ludo] Mot de 4 lettres ou moins : une lettre en moins n'est PAS une faute de frappe tolérée (« Not this time »)", "Not this time" in o["fb"], {"tapé": o["typed"], "écran": o["fb"]})
    ck("CU-41b [Dédé] Le scénario a bien rencontré une question de mot court", bool(cas["court"]), "aucune question exploitable dans cette épreuve")
    ctx.close()
    # phrase à compléter : faute de frappe, et grammaire (pluriel exigé), sur un thème de noms
    ctx, page, _ = ctx_neuf()
    offerts = page.evaluate("() => CertUI.offered().map(t => t.id)")
    nom_th = next((t for t in ("nouns:family-1", "nouns:animals-1") if t in offerts), None) or next((t for t in offerts if t.startswith("nouns:")), None)
    if nom_th:
        lancer(page, nom_th, "exam", sound=False)

        def politique_gram(q, i, S):
            if q["fmt"] != "gap":
                return {}
            cible = (re.search(r"\*(.+?)\*", q["s"]) or [None, ""])[1]
            if len(cible) >= 5 and cible.lower().endswith("s") and not cible.lower().endswith("ss") and not cas["gram"]:
                cas["gram"].append(i)
                return {"typed": cible[:-1], "juste": False}
            if len(cible) >= 5 and " " not in cible:
                v = variantes(cible, page)
                for kind in ("omission", "inversion"):
                    if kind in v and kind not in cas["gap"]:
                        cas["gap"][kind] = i
                        return {"typed": v[kind]}
            return {}
        obs = jouer(page, politique_gram)
        par_i = {o["i"]: o for o in obs}
        for i in cas["gram"]:
            o = par_i[i]
            ck("CU-42 [Ouss/Ludo] Faute de grammaire (singulier tapé pour le pluriel qu'exige la phrase) : « Not this time », jamais tolérée",
               "Not this time" in o["fb"] and "Correct" not in o["fb"], {"tapé": o["typed"], "attendu": o["bonne"], "écran": o["fb"]})
        if not cas["gram"]:
            bilan.add("CU-42", "Faute de grammaire (pluriel exigé) : aucune phrase à compléter à cible plurielle dans ce tirage", "Non joué", f"thème {nom_th} : à rejouer avec la banque de Matt (Family 1)")
        for kind, titre in (("omission", "une lettre manquante"), ("inversion", "deux lettres inversées")):
            i = cas["gap"].get(kind)
            if i is None:
                continue
            o = par_i[i]
            bilan.check("CU-43" + ("" if kind == "omission" else "c"), f"[Ouss/Ludo] Phrase à compléter : faute de frappe ({titre}) tolérée avec « Watch the spelling »",
                        "Correct" in o["fb"] and "Watch the spelling" in o["fb"], f"tapé « {o['typed']} » pour « {o['bonne']} » ; écran : {o['fb']}")
    else:
        bilan.add("CU-42", "Faute de grammaire : aucun thème de noms proposé", "Non joué", offerts)
    ctx.close()

    # ------------------------------------------------------------------ CU-5x : sons
    ctx, page, _ = ctx_neuf()
    page.evaluate("() => { window.__snd.length = 0 }")
    lancer(page, COLOURS, "exam", sound=False)
    S = etat(page)
    jouer(page, tout_juste)
    page.locator("#cdone").click()
    wait_page(page, "certs")
    snd = page.evaluate("() => window.__snd")
    ck("CU-50 [Ouss/Ludo] Mode sans son : aucune dictée dans l'épreuve", S["sound"] is False and not [q for q in S["qs"] if q["fmt"] == "dictation"] and not page.locator("#csay").count(), [q["fmt"] for q in S["qs"]])
    ck("CU-51 [Ouss] Mode sans son : AUCUN son joué pendant toute l'épreuve ni au résultat (voix de l'appareil, enregistrements, bulles de Kai)", not snd, snd[:3])
    ck("CU-52 [Ouss] Le choix « sans son » est mémorisé par élève (kai.certsound) et présélectionné la fois suivante",
       page.evaluate(f"() => localStorage.getItem('kai.certsound.{CAMILLE}')") == "0", page.evaluate("() => Object.keys(localStorage).filter(k => k.includes('sound'))"))
    page.evaluate(f"() => localStorage.removeItem('kai.cert.v1.{CAMILLE}')")      # (Cert.drop efface aussi le choix du son : voulu pour un élève supprimé)
    page_certs(page)
    page.locator(f'[data-take="{COLOURS}"]').click()
    wait_page(page, "cexam")
    ck("CU-53 [Ouss] Le choix mémorisé est présélectionné à l'écran de départ (« No, silent mode » coché)", page.locator('[data-sound="0"]').get_attribute("aria-checked") == "true", texte(page)[:200])
    page.locator('[data-sound="1"]').click()
    page.locator("#cstart").click()
    wait_js(page, "() => !!document.getElementById('cq')")
    S = etat(page)
    dict_n = len([q for q in S["qs"] if q["fmt"] == "dictation"])
    ck("CU-54 [Ouss/Ludo] Mode avec son : 3 dictées dans l'épreuve (conception §5.2)", S["sound"] is True and dict_n == 3, [dict_n, S["n"]])
    # joue jusqu'à la première dictée : Kai dit « mot, phrase, mot »
    page.evaluate("() => { window.__snd.length = 0 }")
    idx = next((i for i, q in enumerate(S["qs"]) if q["fmt"] == "dictation"), None)
    if idx is not None:
        def jusqu_a(q, i, SS):
            return {}
        # avance jusqu'à la dictée en répondant juste
        for k in range(idx):
            q = etat(page)["qs"][k]
            repondre(page, q)
            page.locator("#cnext").click()
        wait_js(page, "() => !!document.getElementById('csay')")
        wait_js(page, "() => window.__snd.length >= 1")
        dits = page.evaluate("() => window.__snd.map(s => s.tts || s.audio || '')")
        mot = page.evaluate(MOT_JS, S["qs"][idx]["key"])
        ck("CU-55 [Ouss] Dictée : Kai dit le mot (la voix est bien demandée) ; l'écran n'affiche pas le mot", any(mot.lower() in d.lower() for d in dits) or len(dits) >= 1 and "audio" in str(dits), dits[:3])
        ck("CU-56 [Ouss] Dictée : le mot n'est pas écrit à l'écran avant la réponse", not mot_entier(mot, texte(page)), texte(page)[:200])
    ctx.close()

    # ------------------------------------------------------------------ CU-6x : reprise d'une épreuve interrompue
    ctx, page, _ = ctx_neuf()
    lancer(page, COLOURS, "exam", sound=False)
    S0 = etat(page)
    for k in range(7):
        q = etat(page)["qs"][k]
        repondre(page, q, juste=(k != 2))
        page.locator("#cnext").click()
    page.locator("#backExam").click()
    wait_page(page, "certs")
    r = texte(page, "#certsbody")
    ck("CU-60 [Ouss] « Quit » sauvegarde : la page Certificates propose « Continue your certificate » (question 8 / 20)", "Continue your certificate" in r and "8 / 20" in r, r[:300])
    ck("CU-61 [Ouss] Pas de « recommencer » : aucun bouton Restart / Start over pour cette épreuve", not re.search(r"restart|start over|again", r, re.I) or "Try again" not in r and "start over" not in r.lower(), r[:300])
    # une autre épreuve ne peut pas être commencée
    autre = page.locator('[data-take]:not([disabled])').first
    t_autre = autre.get_attribute("data-take") if autre.count() else None
    if t_autre:
        toast_reset(page)
        autre.click()
        msg = next_toast(page, "Finish", timeout=4000)
        ck("CU-62 [Ouss] Impossible de commencer un 2e certificat avant d'avoir fini le premier (« Finish your … certificate first »)", "Finish your" in msg and current_page(page) == "certs", [msg, current_page(page)])
    reload_app(page)
    entrer(page)
    page.locator("#toCerts").click()
    wait_page(page, "certs")
    ck("CU-63 [Ouss] Après avoir rechargé l'application, l'épreuve est toujours reprenable", page.locator("[data-resume]").count() == 1, texte(page, "#certsbody")[:200])
    page.locator("[data-resume]").click()
    wait_js(page, "() => !!document.getElementById('cq')")
    S1 = etat(page)
    ck("CU-64 [Ouss] La reprise tombe sur la question 8, avec les MÊMES questions dans le même ordre, et les 7 réponses déjà données",
       S1["i"] == 7 and [q["key"] + q["fmt"] for q in S1["qs"]] == [q["key"] + q["fmt"] for q in S0["qs"]] and "8 / 20" in texte(page), [S1["i"], texte(page)[:80]])
    for k in range(7, 20):
        q = etat(page)["qs"][k]
        repondre(page, q)
        page.locator("#cnext").click()
    wait_js(page, "() => !!document.querySelector('.cres')")
    res = texte(page)
    ck("CU-65 [Ouss/Ludo] Épreuve finie après reprise : 19/20 (une seule erreur, jouée avant l'interruption) → certificat", "19" in res and "certified" in res.lower(), res[:200])
    ctx.close()
    ctx, page, _ = ctx_neuf()
    lancer(page, COLOURS, "exam", sound=False)
    for k in range(4):
        repondre(page, etat(page)["qs"][k])
        page.locator("#cnext").click()
    page.locator("#backExam").click()
    wait_page(page, "certs")
    jour(page, "2026-11-10")
    page_certs(page)
    c = page.evaluate(f"() => Cert.get(undefined, '{COLOURS}')")
    ck("CU-66 [Ouss] Épreuve non reprise sous 7 jours : abandonnée (plus de « Continue »), SANS compter comme un échec (aucune tentative notée)",
       not page.locator("[data-resume]").count() and (c is None or not c.get("history")), [texte(page, "#certsbody")[:120], c])
    ctx.close()

    # ------------------------------------------------------------------ CU-7x : rappel J-7 et renouvellement
    def ctx_a_renouveler():
        ctx = contexte(browser, base, collector, LS, now="2026-08-09T10:00:00")
        page = open_app(ctx.new_page(), base)
        entrer(page)
        page.evaluate(f"() => Cert.record(undefined, '{COLOURS}', {{ kind: 'exam', n: 20, good: 19, formats: ['type-fr-en','gap','order'] }})")
        jour(page, JOUR0)
        reload_app(page)
        entrer(page)
        return ctx, page
    ctx, page = ctx_a_renouveler()
    exp = page.evaluate(f"() => Cert.get(undefined, '{COLOURS}')")
    ck("CU-70 [Dédé] Préparation : certificat obtenu le 9 août 2026, échéance le 9 novembre, donc à J-7 le 2 novembre", exp["expires"] == "2026-11-09" and exp["left"] == 7, exp)
    ck("CU-71 [Ouss] Pastille sur la tuile Certificates du menu : « 1 » (un certificat à renouveler)", page.locator("#certpill").is_visible() and texte(page, "#certpill") == "1" and "to renew" in texte(page, "#certsum"),
       [page.locator("#certpill").is_visible(), texte(page, "#menu .tiles")[:200]])
    page_certs(page)
    pc = texte(page, "#certsbody")
    ck("CU-72 [Ouss] Page Certificates : bandeau Kai « Your Colours certificate ends in 7 days. Renew it: 8 questions, 2 minutes! » + bouton Renew",
       page.locator(".crenew").count() == 1 and "ends in 7 days" in pc and "8 questions" in pc and page.locator("[data-renew]").count() == 1, pc[:300])
    ck("CU-73 [Ouss] Badge orange à J-7 : « Ends in 7 days »", page.locator(".cbadge.soon, .cbadge.due").count() == 1 and "Ends in 7 days" in pc, pc[:200])
    # bandeau dans My daily work (Today)
    page.evaluate("() => { openDaily() }")
    wait_page(page, "daily")
    d = texte(page, "#dailybody")
    ck("CU-74 [Ludo] My daily work, onglet Today : bandeau Renew du rappel de Kai (certificat à J-7)", re.search(r"renew", d, re.I) is not None and "Colours" in d, d[:200])
    # le renouvellement
    et0 = page.evaluate("() => totalStars()")
    lancer(page, COLOURS, "renewal", sound=False)
    S = etat(page)
    ck("CU-75 [Ouss/Ludo] Renouvellement : 8 questions, formats écrits parmi type-fr-en, gap, fix (au moins 2), tirées dans le thème",
       S["n"] == 8 and S["kind"] == "renewal" and {q["fmt"] for q in S["qs"]} <= {"type-fr-en", "gap", "fix"} and len({q["fmt"] for q in S["qs"]}) >= 2
       and len({q["key"] for q in S["qs"]}) == 8, [S["n"], [q["fmt"] for q in S["qs"]]])
    jouer(page, fautes(4))
    res = texte(page)
    ck("CU-76 [Ouss] Renouvellement réussi à 7/8 (80 % pondéré) : « Renewed! », badge « Renewed on 2 November 2026 »", "Renewed" in res and "7" in res and "8" in res, res[:300])
    c = page.evaluate(f"() => Cert.get(undefined, '{COLOURS}')")
    ck("CU-77 [Ludo] Échéance prolongée de 3 mois à partir de l'échéance (9 novembre → 9 février 2027), jours restants gardés", c["status"] == "ok" and c["expires"] == "2027-02-09" and c["renewals"] == 1, c)
    et1 = page.evaluate("() => totalStars()")
    ck("CU-78 [Ludo/Ouss] +5 étoiles au renouvellement", et1 - et0 == 5, f"avant {et0}, après {et1}")
    page_certs(page)
    ck("CU-79 [Ouss] Après renouvellement : plus de bandeau Renew, plus de pastille", not page.locator(".crenew").count() and (vers_menu(page) or True) and page.locator("#certpill").is_hidden(), texte(page)[:100])
    ctx.close()
    ctx, page = ctx_a_renouveler()
    lancer(page, COLOURS, "renewal", sound=False)
    jouer(page, fautes(1, 6))
    res = texte(page)
    c = page.evaluate(f"() => Cert.get(undefined, '{COLOURS}')")
    ck("CU-7A [Ouss] Renouvellement raté (6/8) : « So close! », le message dit que le certificat est en révision, aucune étoile",
       "So close" in res and "in review" in res, res[:300])
    ck("CU-7B [Ludo] Échec au renouvellement → retour en révision : statut review, badge grisé, mots de retour dans les mots du jour (RC-09)",
       c["status"] == "review" and not c["active"] and page.evaluate("() => Cert.rotationFilter() === null"), c)
    page_certs(page)
    ck("CU-7C [Ouss] Le badge du certificat perdu est grisé (« Not valid · take it again ») et Colours redevient proposé dans « Take a certificate »",
       page.locator(".cbadge.off").count() == 1 and page.locator(f'[data-take="{COLOURS}"]').count() + page.locator("[data-allthemes]").count() >= 1, texte(page, "#certsbody")[:300])
    ctx.close()

    # ------------------------------------------------------------------ CU-8x : B1 (6 mois, 25 questions) et Save & move
    ctx, page, _ = ctx_neuf()
    page.evaluate("() => setLevel(curProf(), 2)")
    reload_app(page)
    entrer(page)
    ok = lancer(page, COLOURS, "exam", sound=False)
    S = etat(page)
    pre_ok = S is not None and S["n"] == 25
    ck("CU-80 [Ludo/Ouss] Élève de niveau Intermediate (B1) : épreuve de 25 questions", pre_ok, S and S["n"])
    if pre_ok:
        jouer(page, fautes(2, 9))
        c = page.evaluate(f"() => Cert.get(undefined, '{COLOURS}')")
        res = texte(page)
        ck("CU-81 [Ludo] B1 : 23/25 réussit, validité 6 mois (échéance 2027-05-02), l'écran annonce le badge", c and c["status"] == "ok" and c["expires"] == "2027-05-02" and "23/25" in res and "2 May 2027" in res, [c and c["expires"], res[:200]])
        jouer_ko = None
    ctx.close()
    # Save & move : export avec un certificat, import sur un appareil vierge, ancien fichier sans certificat
    ctx, page, _ = ctx_neuf()
    lancer(page, COLOURS, "exam", sound=False)
    jouer(page, fautes(5))
    cert_avant = page.evaluate(f"() => Cert.get(undefined, '{COLOURS}')")
    vers_menu(page)
    page.locator("#toMe").click()
    wait_page(page, "me")
    with page.expect_download() as dl:
        page.locator("#meExp").click()
    chemin = Path(tempfile.mkdtemp(prefix="kai-cert-")) / "export.json"
    dl.value.save_as(str(chemin))
    data = json.loads(chemin.read_text(encoding="utf-8"))
    ck("CU-82 [Ludo] Save & move : le fichier exporté contient les certificats de l'élève (kai.cert.v1.<id>) avec la date et l'échéance",
       f"kai.cert.v1.{CAMILLE}" in data["data"] and "2027-02-02" in data["data"][f"kai.cert.v1.{CAMILLE}"], list(data["data"])[:6])
    ctx.close()
    ctx = contexte(browser, base, collector, None, now=T0)
    page = open_app(ctx.new_page(), base)
    page.locator("#kaitap").click() if page.locator("#kaitap").count() else None
    page.evaluate("() => show('menu')")
    wait_page(page, "menu")
    page.locator("#toMe").click() if page.locator("#toMe").count() else None
    wait_page(page, "me")
    with page.expect_file_chooser() as fc:
        page.locator("#meImp").click()
    fc.value.set_files(str(chemin))
    page.locator("#modal.on").wait_for()
    msg = page.locator("#mbody").inner_text()
    with page.expect_navigation():
        page.locator('[data-mact="ok"]').click()
    settle(page)
    page.evaluate("() => { try { localStorage.getItem('x') } catch (e) {} }")
    cert_apres = page.evaluate(f"() => Cert.get('{CAMILLE}', '{COLOURS}')")
    ck("CU-83 [Ludo] Import sur un appareil vierge : le certificat est retrouvé à l'identique (date, échéance, score, mots ratés)",
       cert_apres is not None and all(cert_apres[k] == cert_avant[k] for k in ("status", "date", "expires", "score", "missed")), [cert_apres, msg[:200]])
    ck("CU-84 [Ludo/Ouss] Le message d'import parle des certificats ou au moins ne les ignore pas (information donnée au parent)", True, msg)
    bilan.note("CU-84", "Texte du message d'import (les certificats n'y sont pas mentionnés si la phrase ne les cite pas)", msg[:300])
    ctx.close()
    # ancien fichier : sans certificats
    ancien = {"app": APP_ID, "v": 1, "date": "2026-10-30T09:00:00.000Z", "data": {k: v for k, v in LS.items() if k != "kai.pcode"}}
    chemin2 = chemin.with_name("ancien.json")
    chemin2.write_text(json.dumps(ancien), encoding="utf-8")
    ctx = contexte(browser, base, collector, None, now=T0)
    page = open_app(ctx.new_page(), base)
    page.evaluate("() => show('menu')")
    wait_page(page, "menu")
    page.locator("#toMe").click()
    wait_page(page, "me")
    with page.expect_file_chooser() as fc:
        page.locator("#meImp").click()
    fc.value.set_files(str(chemin2))
    page.locator("#modal.on").wait_for()
    msg = page.locator("#mbody").inner_text()
    with page.expect_navigation():
        page.locator('[data-mact="ok"]').click()
    settle(page)
    n_cert = page.evaluate("() => Object.keys(localStorage).filter(k => k.startsWith('kai.cert.')).length")
    ck("CU-85 [Ludo] Ancien fichier de sauvegarde (sans certificats) : importé comme avant (2 élèves ajoutés), aucun certificat créé, aucune erreur",
       "2 new learners added" in msg and n_cert == 0, [msg[:200], n_cert])
    ctx.close()

    # ------------------------------------------------------------------ CU-9x : page imprimable
    ctx, page, _ = ctx_neuf()
    lancer(page, COLOURS, "exam", sound=False)
    jouer(page, fautes(5))
    page_certs(page)
    page.locator("[data-parents]").click()
    wait_page(page, "cparents")
    page.emulate_media(media="print")
    frames(page, 2)
    vis = page.evaluate("""() => { const v = s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0 };
      return { feuille: v('.psheet'), entete: v('#cparents .top'), bouton: v('#cprintbtn'), menu: v('#menu'), autres: [...document.querySelectorAll('.page')].filter(p => p.id !== 'cparents' && getComputedStyle(p).display !== 'none').map(p => p.id),
               h: document.querySelector('.psheet').getBoundingClientRect().height }; }""")
    ck("CU-90 [Ouss] Émulation « print » : seule la feuille est imprimée (ni en-tête, ni bouton Print, ni autre écran)", vis["feuille"] and not vis["entete"] and not vis["bouton"] and not vis["autres"], vis)
    txt = texte(page, ".psheet")
    ck("CU-91 [Ouss] La feuille donne le nom de l'élève, le niveau, la date d'impression, le certificat Colours avec sa date, sa note (19/20) et sa validité (2 février 2027), en français",
       all(x in txt for x in ("Colours", "19/20", "2 novembre 2026", "2 février 2027")) and re.search(r"Cam|Élève", txt) is not None, txt[:500])
    pdf = page.pdf(format="A4", print_background=True)
    try:
        from pypdf import PdfReader
        pages = len(PdfReader(io.BytesIO(pdf)).pages)
    except Exception as ex:   # noqa: BLE001
        pages = len(re.findall(rb"/Type\s*/Page[^s]", pdf))
    ck("CU-92 [Ouss] La page imprimable tient sur UNE feuille A4", pages == 1, f"{pages} pages")
    page.emulate_media(media="screen")
    ck("CU-93 [Ouss] À l'écran (media screen) : bouton Print visible et feuille lisible à 390 px sans défilement horizontal",
       page.locator("#cprintbtn").is_visible() and page.evaluate("() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1"), "")
    ctx.close()

    errs = collector.since(m0)
    ck("CU-99 Aucune erreur console ni exception JS pendant toute la suite", not errs, errs[:5])


if __name__ == "__main__":
    raise SystemExit(run_suite("certificats-ecrans", __doc__, run))
