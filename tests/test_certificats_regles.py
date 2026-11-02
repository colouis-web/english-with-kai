#!/usr/bin/env python3
"""Certificats de vocabulaire : règles du PO vérifiées sur le MOTEUR et la BANQUE (Dédé, sprint B).

  python3 tests/test_certificats_regles.py [--app <dossier>] [-v]

Complète tests/test_certificats.py (Ludo : 36 contrôles unitaires du moteur) par des contrôles d'ACCEPTATION écrits sur
docs/certificats/conception.md (§1 règles RC-01 à RC-13, §3 correction, §5 banque, §6 cycle de vie), avec une horloge simulée
(2 novembre 2026 pour le jour de l'épreuve, puis J-7, échéance, lendemain…). Les écrans sont testés à part (test_certificats_ecrans.py).

  AC-0x  contrat : API attendue (pickExam, check…), banque des 3 premiers certificats (Colours, Family 1, Animals 1) ;
  AC-1x  tirage d'une épreuve : 20 questions (25 pour un B1), au moins 4 formats écrits, sans QCM, chaque mot interrogé,
         quotas, contrainte d'ordre « afficher après produire », mode sans son = aucune dictée, tirages différents ;
  AC-2x  correction : faute de frappe tolérée (distance 1, mot de 5 lettres ou plus, pas un autre mot anglais), faute de grammaire non ;
  AC-3x  réussite : 18/20 et au moins 3 formats ; badge daté ; validité 3 mois (6e) / 6 mois (B1) ;
  AC-4x  épreuve ratée : certificat valable conservé, mots ratés gardés ; mots réussis sortis des mots du jour, mots ratés non ;
  AC-5x  rappel J-7 (dueSoon) ; AC-6x renouvellement (8 questions, 80 %, +5 étoiles, échec → révision) ; AC-7x étoiles (+10 / +5).
Chaque contrôle qui ne passe pas = un constat précis pour l'agent concerné (docs/tests/certificats-2026-11-02.md).
"""
import json

from kai_common import Collector, new_context, open_app, run_suite
from kai_certs import CAMILLE, NOE, JOUR0, T0, LS_DUMP, RESEED, SEED, contexte, jour, reference, ORACLE_JS

BANQUE_3 = {   # conception.md §5.5 (validé par le PO le 02/11, 14:00)
    "adjectives:colours": ("Colours", {"red", "blue", "green", "yellow", "orange", "pink", "purple", "brown", "black", "white", "grey"}),
    "nouns:family-1": ("Family", {"family", "parent", "mother", "mum", "father", "dad", "brother", "sister", "son", "daughter", "grandmother",
                                  "grandfather", "grandma", "grandpa", "grandparents", "uncle", "aunt", "cousin"}),
    "nouns:animals-1": ("Animals", {"pet", "dog", "puppy", "cat", "kitten", "rabbit", "mouse", "goldfish", "parrot", "tortoise", "horse", "pony",
                                    "donkey", "cow", "pig", "sheep", "lamb", "goat", "hen", "duck"}),
}
FORMATS_ECRITS = {"type-fr-en", "picture", "gap", "order", "fix"}
PRODUIRE = {"type-fr-en", "picture", "gap", "dictation"}     # l'élève doit écrire le mot
AFFICHER = {"order", "fix"}                                   # la phrase montre le mot anglais
QUOTAS_SANS_SON = {"type-fr-en": 6, "picture": 4, "gap": 5, "order": 3, "fix": 2}      # §5.2, Beginner / Elementary
QUOTAS_AVEC_SON = {"type-fr-en": 4, "picture": 4, "gap": 4, "order": 3, "fix": 2, "dictation": 3}

TIRE = """([th, sound, n, lv]) => { const out = []; if (lv !== null) { const p = curProf(); setLevel(p, lv); }
  for (let s = 1; s <= n; s++) { (%s)(s * 7919 + 17); const r = Cert.pickExam(undefined, th, { sound: !!sound });
    out.push(Array.isArray(r) ? r : (r && (r.questions || r.qs || r.items)) || []); }
  return JSON.parse(JSON.stringify(out)); }""" % RESEED


def run(args, base, browser, bilan, collector):
    def ck(titre, cond, detail=""):
        cid, _, t = titre.partition(" ")
        return bilan.check(cid, t, bool(cond), str(detail)[:1200])

    ref = reference()
    LS = ref["ls"]
    m0 = collector.mark()
    ctx = contexte(browser, base, collector, LS)
    page = open_app(ctx.new_page(), base)
    P = page.evaluate

    # ------------------------------------------------------------------ AC-0x : contrat
    manque = P("() => ['pickExam','check','record','dueSoon','pickRenewal','scoreRenewal','passExam','themes','themeWords','isActive','rotationFilter','inRotation'].filter(f => typeof Cert[f] !== 'function')")
    ck("AC-01 [Ludo] API des certificats complète (Cert.pickExam, Cert.check, record, dueSoon, pickRenewal…)", not manque, f"manquent : {manque}")
    pe_ok = "pickExam" not in manque and "check" not in manque
    th = {t["id"]: t for t in P("() => Cert.themes()")}
    for tid, (nom, mots) in BANQUE_3.items():
        W = {w.split(":", 1)[1] for w in P("(t) => Cert.themeWords(t).map(w => w.key)", tid)}
        t = th.get(tid)
        ck(f"AC-02 [Matt/Ludo] Périmètre « {nom} » ({tid}) : {len(mots)} mots de la conception, ≤ 20, proposé par Cert.themes()",
           t is not None and W == mots and len(W) <= 20,
           f"présent={t is not None} ; en trop={sorted(W - mots)} ; en moins={sorted(mots - W)}")
    gros = sorted(t["id"] for t in th.values() if t["n"] > 20)
    verbes = sorted(t["id"] for t in th.values() if t["kind"] == "verbs")
    ck("AC-03 [Matt/Ludo] Cert.themes() ne propose que des périmètres de 20 mots au plus (Q6 : gros thèmes découpés, pas de thème entier de 48 mots)", not gros, gros[:8])
    ck("AC-04 [Matt/Ludo] Aucun certificat de verbes en v1 (décision du PO)", not verbes, verbes)
    if not pe_ok:
        bilan.ko("AC-1x", "Tirage, correction et suite : bloqués, Cert.pickExam / Cert.check n'existent pas encore", f"manquent : {manque}")

    # ------------------------------------------------------------------ AC-1x : tirage d'une épreuve
    tirages = {}
    if pe_ok:
        for tid in BANQUE_3:
            tirages[(tid, False)] = P(TIRE, [tid, False, 30, None])
        tirages[("adjectives:colours", True)] = P(TIRE, ["adjectives:colours", True, 30, None])
        c = tirages[("adjectives:colours", False)]
        ck("AC-10 [Ludo] Épreuve de 20 questions pour un élève de 6e (30 tirages de Colours)", all(len(e) == 20 for e in c), sorted({len(e) for e in c}))
        fm = [{q["fmt"] for q in e} for e in c]
        ck("AC-11 [Ludo] Sans QCM, uniquement des formats écrits (type-fr-en, picture, gap, order, fix) et au moins 4 formats différents par épreuve",
           all(f <= FORMATS_ECRITS and len(f) >= 4 for f in fm), [sorted(f) for f in fm if not (f <= FORMATS_ECRITS and len(f) >= 4)][:2])
        quotas = [{f: sum(1 for q in e if q["fmt"] == f) for f in FORMATS_ECRITS} for e in c]
        ck("AC-12 [Ludo/Matt] Colours sans son : quotas 6 traductions, 4 images, 5 phrases à compléter, 3 ordres, 2 corrections (§5.2)",
           all(q == QUOTAS_SANS_SON for q in quotas), next((q for q in quotas if q != QUOTAS_SANS_SON), ""))
        for tid, (nom, mots) in BANQUE_3.items():
            E = tirages[(tid, False)]
            cles = {"%s:%s" % (tid.split(":")[0], m) for m in mots}
            mauvais = []
            for i, e in enumerate(E):
                par = {}
                for q in e:
                    par.setdefault(q["key"], []).append(q["fmt"])
                manquants = sorted(cles - set(par))
                trop = sorted(k for k, f in par.items() if len(f) > 2 or len(set(f)) < len(f))
                autres = sorted(set(par) - cles)
                if manquants or trop or autres:
                    mauvais.append((i, manquants, trop, autres))
            ck(f"AC-13 [Ludo] {nom} : chaque mot du périmètre est interrogé au moins une fois, au plus deux fois, jamais deux fois dans le même format, aucun mot étranger",
               not mauvais, mauvais[:2])
            viol = []
            for i, e in enumerate(E):
                prem = {}
                for j, q in enumerate(e):
                    if q["fmt"] in PRODUIRE:
                        prem.setdefault(q["key"], j)
                for j, q in enumerate(e):
                    if q["fmt"] in AFFICHER and q["key"] in prem and prem[q["key"]] > j:
                        viol.append((i, q["key"], q["fmt"], j, prem[q["key"]]))
                    if q["fmt"] in AFFICHER and q["key"] not in prem and False:
                        pass
            ck(f"AC-14 [Ludo] {nom} : un mot montré (ordre, correction) ne vient jamais avant la question qui demande de l'écrire", not viol, viol[:3])
            ck(f"AC-15 [Ludo] {nom} sans son : 20 questions, aucune dictée, aucun format hors liste, au moins 4 formats",
               all(len(e) == 20 and all(q["fmt"] in FORMATS_ECRITS for q in e) and len({q["fmt"] for q in e}) >= 4 for e in E),
               sorted({len(e) for e in E}))
        a = tirages[("adjectives:colours", True)]
        qs = [{f: sum(1 for q in e if q["fmt"] == f) for f in QUOTAS_AVEC_SON} for e in a]
        ck("AC-16 [Ludo] Mode avec son : 3 dictées en plus (Colours : 4 traductions, 4 images, 4 phrases, 3 ordres, 2 corrections, 3 dictées)",
           all(q == QUOTAS_AVEC_SON for q in qs) and all(len(e) == 20 for e in a), next((q for q in qs if q != QUOTAS_AVEC_SON), ""))
        ck("AC-17 [Ludo] Mode sans son : jamais de dictée (90 tirages des trois certificats)",
           all(q["fmt"] != "dictation" for k, E in tirages.items() if not k[1] for e in E for q in e), "dictée trouvée")
        sig = [json.dumps([(q["key"], q["fmt"]) for q in e]) for e in c]
        ck("AC-18 [Ludo] Ordre aléatoire : 30 tirages donnent au moins 25 épreuves différentes", len(set(sig)) >= 25, len(set(sig)))
        b1 = P(TIRE, ["adjectives:colours", False, 5, 2])
        ck("AC-19 [Ludo] Élève de niveau B1 : épreuve de 25 questions (réussite 23/25, 22,5 arrondi vers le haut)",
           all(len(e) == 25 for e in b1) and P("() => [Cert.passExam({ items: [...Array(25)].map((_, i) => ({ key: 'a:b', fmt: ['x','y','z'][i % 3], ok: i < 23 })) }).pass, Cert.passExam({ items: [...Array(25)].map((_, i) => ({ key: 'a:b', fmt: ['x','y','z'][i % 3], ok: i < 22 })) }).pass]") == [True, False],
           sorted({len(e) for e in b1}))
        P("() => setLevel(curProf(), 0)")

    # ------------------------------------------------------------------ AC-2x : correction
    if pe_ok:
        # Questions réelles tirées par le moteur : (clé, format) -> question
        trouve = {}
        for tid in BANQUE_3:
            for e in tirages[(tid, False)]:
                for q in e:
                    trouve.setdefault((q["key"], q["fmt"]), q)
        CAS = [   # (clé, tapé, ok attendu, faute de frappe signalée, motif). Source : conception §3 (tableau pour Dédé)
            ("adjectives:purple", "purpel", True, True, "2 lettres inversées, 6 lettres"),
            ("adjectives:purple", "Purple.", True, False, "casse et ponctuation"),
            ("adjectives:grey", "gray", True, None, "variante américaine acceptée avec une note (Q9)"),
            ("adjectives:grey", "gry", False, None, "3 lettres tapées pour un mot de 4 : pas de tolérance"),
            ("adjectives:green", "gren", True, True, "mot de 5 lettres, une lettre en moins"),
            ("adjectives:red", "rad", False, None, "mot de moins de 5 lettres"),
            ("nouns:uncle", "an uncle", True, False, "article ignoré"),
            ("nouns:uncle", "uncles", False, None, "nombre exigé (grammaire)"),
            ("nouns:aunt", "ant", False, None, "moins de 5 lettres et autre mot anglais"),
            ("nouns:grandmother", "grandmohter", True, True, "inversion de deux lettres"),
            ("adjectives:black", "block", False, None, "autre mot anglais : pas une faute de frappe"),
        ]
        res = []
        for cle, tape, attendu, typo, motif in CAS:
            q = trouve.get((cle, "type-fr-en"))
            if not q:
                res.append((cle, tape, "aucune question type-fr-en tirée pour ce mot en 3 × 30 épreuves"))
                continue
            r = P("([q, t]) => { const r = Cert.check(q, t); return r && typeof r === 'object' ? r : { ok: r }; }", [q, tape])
            bon = bool(r.get("ok")) == attendu and (typo is None or bool(r.get("typo")) == typo)
            if attendu is False and r.get("typo"):
                bon = False
            if not bon:
                res.append((cle, tape, motif, r))
        ck("AC-20 [Ludo] Traduction tapée (table de la conception §3) : frappe tolérée à distance 1 pour un mot de 5 lettres ou plus, "
           "jamais pour un mot court, un autre mot anglais ou un nombre faux", not res, res[:4])
        note = P("([q]) => { const r = Cert.check(q, 'gray'); return (r && r.note) || ''; }", [trouve.get(("adjectives:grey", "type-fr-en"))]) if trouve.get(("adjectives:grey", "type-fr-en")) else ""
        ck("AC-21 [Ludo] « gray » accepté avec la note « In British English: grey » (Q9)", "grey" in str(note) and "British" in str(note), repr(note))
        # phrases à compléter : on dérive les essais de la phrase tirée (cible entre étoiles dans les données)
        gap = [q for (k, f), q in trouve.items() if f == "gap"]
        incoherent = []
        for q in gap[:40]:
            o = P(ORACLE_JS, q)
            if not o.get("target"):
                incoherent.append((q["key"], "cible introuvable dans la question"))
                continue
            t = o["target"]
            r = P("([q, t]) => { const r = Cert.check(q, t); return r && typeof r === 'object' ? r : { ok: r }; }", [q, t])
            if not r.get("ok"):
                incoherent.append((q["key"], f"la bonne réponse « {t} » est refusée", r))
                continue
            r = P("([q, t]) => { const r = Cert.check(q, t.toUpperCase() + '.'); return r && typeof r === 'object' ? r : { ok: r }; }", [q, t])
            if not r.get("ok"):
                incoherent.append((q["key"], "majuscules et point final refusés", r))
            # grammaire : un pluriel régulier réduit au singulier (ou l'inverse) n'est JAMAIS une faute de frappe
            if t.lower().endswith("s") and len(t) >= 5 and not t.lower().endswith("ss"):
                r = P("([q, t]) => { const r = Cert.check(q, t); return r && typeof r === 'object' ? r : { ok: r }; }", [q, t[:-1]])
                if r.get("ok"):
                    incoherent.append((q["key"], f"« {t[:-1]} » (nombre faux) accepté pour « {t} »", r))
        ck("AC-22 [Ludo] Phrase à compléter : la bonne réponse, avec majuscules et point final, est acceptée ; le nombre faux (singulier pour pluriel) est refusé",
           not incoherent and len(gap) >= 4, (incoherent[:3], len(gap)))
        typo_gap = []
        for q in gap[:40]:
            o = P(ORACLE_JS, q)
            t = o.get("target") or ""
            if len(t.replace(" ", "")) >= 5 and not t.lower().endswith("s"):
                faux = t[:2] + t[3] + t[2] + t[4:]       # deux lettres inversées
                if faux.lower() == t.lower():
                    continue
                r = P("([q, t]) => { const r = Cert.check(q, t); return r && typeof r === 'object' ? r : { ok: r }; }", [q, faux])
                connu = P("(w) => tkKnown(w)", faux)
                if (not connu) and not (r.get("ok") and r.get("typo")):
                    typo_gap.append((t, faux, r))
        ck("AC-23 [Ludo] Phrase à compléter : une faute de frappe (deux lettres inversées, mot de 5 lettres ou plus) est acceptée avec « Watch the spelling »",
           not typo_gap, typo_gap[:3])
        ordre = [q for (k, f), q in trouve.items() if f == "order"]
        bad = []
        for q in ordre[:20]:
            o = P(ORACLE_JS, q)
            if not o.get("sentence"):
                bad.append((q["key"], "phrase introuvable"))
                continue
            mots = o["words"]
            r1 = P("([q, s]) => { const r = Cert.check(q, s); return r && typeof r === 'object' ? r : { ok: r }; }", [q, o["sentence"]])
            r2 = P("([q, s]) => { const r = Cert.check(q, s); return r && typeof r === 'object' ? r : { ok: r }; }", [q, " ".join(reversed(mots))])
            if not r1.get("ok") or r2.get("ok"):
                bad.append((q["key"], o["sentence"], r1, r2))
        ck("AC-24 [Ludo] Remettre les mots dans l'ordre : l'ordre exact est juste, l'ordre inversé est faux (aucune tolérance)", not bad and len(ordre) >= 3, (bad[:2], len(ordre)))

    # ------------------------------------------------------------------ AC-3x : réussite, badge daté, validité
    cas =P("""() => { const mk = (n, good, f) => ({ kind: 'exam', items: [...Array(n)].map((_, i) => ({ key: 'adjectives:red', fmt: f[i % f.length], ok: i < good })) });
      const F4 = ['type-fr-en', 'picture', 'gap', 'order'];
      return { r18: Cert.passExam(mk(20, 18, F4)).pass, r17: Cert.passExam(mk(20, 17, F4)).pass, f2: Cert.passExam(mk(20, 20, ['gap', 'order'])).pass,
               f3: Cert.passExam(mk(20, 18, ['gap', 'order', 'fix'])).pass, r23: Cert.passExam(mk(25, 23, F4)).pass, r22: Cert.passExam(mk(25, 22, F4)).pass }; }""")
    ck("AC-30 [Ludo] Réussite : 18/20 oui, 17/20 non, 20/20 sur seulement 2 formats non, 18/20 sur 3 formats oui, 23/25 oui, 22/25 non",
       cas == {"r18": True, "r17": False, "f2": False, "f3": True, "r23": True, "r22": False}, cas)
    keys = P("() => Cert.themeWords('adjectives:colours').map(w => w.key)")
    star0 = P("() => totalStars()")
    r = P("""(keys) => { const fm = ['type-fr-en', 'picture', 'gap', 'order', 'fix'], qs = [...keys, ...keys].slice(0, 20);
      return Cert.record(undefined, 'adjectives:colours', { kind: 'exam', items: qs.map((k, i) => ({ key: k, fmt: fm[i % 5], ok: i !== 3 && i !== 15 })) }); }""", keys)
    c = r.get("cert") or {}
    ck("AC-31 [Ludo] Épreuve réussie 18/20 le 2 novembre 2026 : certificat daté (obtention, score 90, ≥ 3 formats, valable)",
       r.get("ok") and r.get("pass") and c.get("status") == "ok" and c.get("date") == JOUR0 and c.get("score") == 90 and len(c.get("formats", [])) >= 3 and c.get("active"), r)
    ck("AC-32 [Ludo] Validité d'un élève de 6e : 3 mois, jusqu'au 2 février 2027 (l'échéance tombe un mardi, le certificat vaut jusqu'à la veille)",
       c.get("expires") == "2027-02-02" and c.get("level") == 0, c)
    manques = sorted(set(c.get("missed", [])))
    ck("AC-33 [Ludo] Les 2 mots ratés sont mémorisés avec le certificat (pondération du futur renouvellement)", len(manques) == 2 and set(manques) <= set(keys), manques)
    plus = P("() => Cert.get(undefined, 'adjectives:colours').history")
    ck("AC-34 [Ludo] L'historique garde la tentative (date, type, score, réussite)", plus and plus[-1].get("date") == JOUR0 and plus[-1].get("kind") == "exam" and plus[-1].get("pass") is True, plus)
    star1 = P("() => totalStars()")
    ck("AC-70 [Ludo] +10 étoiles à l'obtention d'un certificat (Cert.record, ou le journal du jour) : totalStars() augmente de 10 exactement",
       star1 - star0 == 10, f"avant {star0}, après {star1}")
    # B1 : 6 mois
    v = P(f"""() => {{ const p = PROFS.list.find(x => x.id === '{NOE}'); useProfile('{NOE}'); setLevel(p, 1); const e = Cert.record('{NOE}', 'nouns:family-1', {{ kind: 'exam', n: 20, good: 18, formats: ['type-fr-en','gap','order'] }}).cert.expires;
      setLevel(p, 2); const i = Cert.record('{NOE}', 'nouns:animals-1', {{ kind: 'exam', n: 25, good: 23, formats: ['type-fr-en','gap','order'] }}).cert.expires;
      setLevel(p, 3); const u = Cert.record('{NOE}', 'adjectives:colours', {{ kind: 'exam', n: 25, good: 25, formats: ['type-fr-en','gap','order'] }}).cert.expires; useProfile('{CAMILLE}'); return [e, i, u]; }}""")
    ck("AC-35 [Ludo] Validité : Elementary 3 mois (2027-02-02), Intermediate et Upper-intermediate 6 mois (2027-05-02)", v == ["2027-02-02", "2027-05-02", "2027-05-02"], v)

    # ------------------------------------------------------------------ AC-4x : sortie des mots du jour, mots ratés
    sortie = P(f"""(keys) => {{ const miss = new Set(Cert.get(undefined, 'adjectives:colours').missed), seen = {{}}; let n = 0;
      for (let s = 1; s <= 60; s++) {{ ({RESEED})(s * 104729); AWS = null; for (const q of pickMix(15)) {{ n++; const key = q.k + ':' + (q.d.w || q.d.v); if (keys.includes(key)) seen[key] = (seen[key] || 0) + 1; }} }}
      return {{ n, vus: seen, rates: [...miss], filtres: keys.map(k => [k, Cert.inRotation(undefined, allWords().byKey.get(k))]) }}; }}""", keys)
    reussis = [k for k, v in sortie["filtres"] if k not in sortie["rates"]]
    ck("AC-40 [Ludo] Thème certifié : les mots RÉUSSIS ne sont plus dans les mots du jour (60 séries de 15 : aucun)",
       all(sortie["vus"].get(k, 0) == 0 for k in reussis) and all(not dict(sortie["filtres"])[k] for k in reussis), sortie)
    ck("AC-41 [Ludo] Les mots RATÉS à l'épreuve restent en rotation (le certificat ne les sort pas) : Cert.inRotation vrai pour eux seulement",
       all(dict(sortie["filtres"])[k] for k in sortie["rates"]) and len(sortie["rates"]) == 2, sortie["filtres"])
    # Les mots ratés doivent aussi pouvoir être RETIRÉS une fois réussis dans un tour du jour (conception, décision 4)
    sort = P(f"""(keys) => {{ const miss = Cert.get(undefined, 'adjectives:colours').missed; const k = miss[0], w = allWords().byKey.get(k);
      const t = todayKey(), r = JSON.parse(JSON.stringify(DST.days[t] || {{ d: t, qs: [], w: {{}}, n: 10, u: 1 }}));
      r.w = r.w || {{}}; r.w[k] = {{ k: w.k, e: w.d.w, f: w.d.fr, ok: 1 }}; r.qs = (r.qs || []).concat([{{ k: 'mix', n: 10, p: 100, t: Date.now() + 5000 }}]); DST.days[t] = r; AWS = null;
      return [Cert.inRotation(undefined, w), miss.length]; }}""", keys)
    ck("AC-42 [Ludo] Un mot raté qui est réussi ensuite dans un tour du jour sort de la rotation", sort[0] is False, sort)

    # ------------------------------------------------------------------ AC-5x : rappel J-7
    rap = {}
    for d in ("2027-01-25", "2027-01-26", "2027-02-01", "2027-02-02", "2027-02-20"):
        jour(page, d)
        rap[d] = P("() => [Cert.dueSoon(undefined).map(c => c.theme + ':' + c.left).join(','), Cert.isActive(undefined, 'adjectives:colours')]")
    ck("AC-50 [Ludo] Rappel de Kai : rien à J-8 (25 janvier), le certificat apparaît à J-7 (26 janvier 2027), à J-1, le jour de l'échéance et après",
       rap["2027-01-25"][0] == "" and rap["2027-01-26"][0] == "adjectives:colours:7" and rap["2027-02-01"][0] == "adjectives:colours:1"
       and rap["2027-02-02"][0] == "adjectives:colours:0" and rap["2027-02-20"][0].startswith("adjectives:colours:-"), rap)
    ck("AC-51 [Ludo] Le certificat reste valable à J-7 et jusqu'au 1er février inclus, plus le 2 février", [rap[d][1] for d in rap] == [True, True, True, False, False], rap)
    # ------------------------------------------------------------------ AC-6x : renouvellement
    jour(page, "2027-01-27")
    pr = P("""() => { const q = Cert.pickRenewal(undefined, 'adjectives:colours', { formats: ['type-fr-en', 'gap', 'fix'] }); return q.map(x => [x.key, x.fmt]); }""")
    ck("AC-60 [Ludo] Renouvellement : 8 questions du périmètre, sans doublon, au moins 2 formats écrits (type-fr-en, gap, fix)",
       len(pr) == 8 and len({k for k, _ in pr}) == 8 and {k for k, _ in pr} <= set(keys) and len({f for _, f in pr}) >= 2, pr)
    sc = P("() => [Cert.scoreRenewal({ n: 8, good: 7 }).pass, Cert.scoreRenewal({ n: 8, good: 6 }).pass]")
    ck("AC-61 [Ludo] Renouvellement : 80 % sur 8 questions = 7 bonnes réponses (6/8 = 75 % échoue)", sc == [True, False], sc)
    s0 = P("() => totalStars()")
    ok = P("""() => { const r = Cert.record(undefined, 'adjectives:colours', { kind: 'renewal', n: 8, good: 7 }); return [r.pass, r.cert.status, r.cert.expires, r.cert.renewals]; }""")
    s1 = P("() => totalStars()")
    ck("AC-62 [Ludo] Renouvellement réussi 6 jours avant l'échéance : encore valable, +3 mois à partir de l'échéance (2027-05-02)", ok == [True, "ok", "2027-05-02", 1], ok)
    ck("AC-71 [Ludo] +5 étoiles au renouvellement réussi", s1 - s0 == 5, f"avant {s0}, après {s1}")
    ko = P("""() => { const r = Cert.record(undefined, 'adjectives:colours', { kind: 'renewal', n: 8, good: 6 }); const f = Cert.rotationFilter(); const red = allWords().byKey.get('adjectives:red');
      return [r.pass, r.cert.status, Cert.isActive(undefined, 'adjectives:colours'), f === null || f(red)]; }""")
    ck("AC-63 [Ludo] Renouvellement raté (6/8) : le certificat redevient « à revoir » et ses mots reviennent dans les mots du jour (RC-09)", ko == [False, "review", False, True], ko)
    s2 = P("() => totalStars()")
    ck("AC-72 [Ludo] Un renouvellement raté ne donne aucune étoile", s2 == s1, f"avant {s1}, après {s2}")
    # un renouvellement tardif : certificat obtenu le 2 novembre, échu le 2 février, renouvelé le 10 mars (Q4 : encore possible)
    jour(page, "2026-11-02")
    P("""() => Cert.record(undefined, 'nouns:family-1', { kind: 'exam', n: 20, good: 19, formats: ['type-fr-en','gap','order'] })""")
    jour(page, "2027-03-10")
    tard = P("""() => { const r = Cert.record(undefined, 'nouns:family-1', { kind: 'renewal', n: 8, good: 8 }); return [r.pass, r.cert && r.cert.expires, r.cert && r.cert.active]; }""")
    ck("AC-64 [Ludo] Renouvellement après l'échéance (échu le 2 février, renouvelé le 10 mars) : +3 mois à partir du jour du renouvellement (2027-06-10), valable",
       tard == [True, "2027-06-10", True], tard)

    # ------------------------------------------------------------------ AC-8x : épreuve ratée avec certificat encore valable (Q13)
    jour(page, "2026-11-02")
    P("""() => { Cert.drop(); return Cert.record(undefined, 'nouns:animals-1', { kind: 'exam', n: 20, good: 19, formats: ['type-fr-en','gap','order'] }); }""")
    jour(page, "2026-11-20")
    r = P("""() => { const before = Cert.get(undefined, 'nouns:animals-1'); const r = Cert.record(undefined, 'nouns:animals-1', { kind: 'exam', items: [...Array(20)].map((_, i) => ({ key: i < 4 ? 'nouns:dog' : 'nouns:cat', fmt: ['type-fr-en','gap','order','picture'][i % 4], ok: i > 3 && i < 15 })) });
      const a = Cert.get(undefined, 'nouns:animals-1'); return [r.pass, before.expires, a.status, a.expires, a.active, a.date, a.best, a.history.length, a.missed.length > 0]; }""")
    ck("AC-80 [Ludo] Épreuve ratée (11/20) repassée alors que le certificat court : le certificat est conservé (même échéance, valable, même date), "
       "la tentative est notée, le mot raté est mémorisé (Q13)",
       r[0] is False and r[2] == "ok" and r[1] == r[3] and r[4] is True and r[5] == "2026-11-02" and r[7] == 2 and r[8] is True, r)

    errs = collector.since(m0)
    ck("AC-99 Aucune erreur console ni exception JS pendant toute la suite", not errs, errs[:5])
    ctx.close()


if __name__ == "__main__":
    raise SystemExit(run_suite("certificats-regles", __doc__, run))
