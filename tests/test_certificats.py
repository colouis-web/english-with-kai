#!/usr/bin/env python3
"""Moteur des certificats de vocabulaire (js/app-certificats.js, Ludo, sprint Kai 2 A).

  python3 tests/test_certificats.py [--app <dossier>] [-v]

Script autonome (même socle que les suites de Dédé : kai_common). Il ne fait pas partie de run_all.py
(fichier de Dédé) : à y ajouter au sprint B si l'équipe le souhaite.

  CE-0x  démarrage : API présente, 0 erreur console, progression de référence relue telle quelle (aucune clé réécrite),
         mots du jour et « My memory » identiques avec et sans le moteur pour un élève sans certificat ;
  CE-1x  règles et stockage : épreuve ≥ 90 % sur ≥ 3 formats, clé kai.cert.v1.<élève>, validité 3 mois (6e) / 6 mois (B1–B2) ;
  CE-2x  sortie de rotation (mots du jour, mots à revoir, mots souvent ratés) et retour à l'échéance ;
  CE-3x  expiration et rappel (dueSoon) à J-7, J-1, J ;
  CE-4x  renouvellement : 8 questions du thème, sans doublon, pondérées vers les mots rares et ratés ; seuil 80 % ;
  CE-5x  Save & move : export, import sur appareil vierge, ancien fichier sans certificats, fichier trafiqué, conflit ;
  CE-6x  élève supprimé : ses certificats aussi.

Date figée au 30/10/2026 10:00 (Europe/Paris) puis avancée avec l'horloge de Playwright ; hasard gradué.
"""
import json

from kai_common import APP_ID, FIXED_NOW, FIXTURES, Collector, new_context, open_app, run_suite

FIXTURE = FIXTURES / "progression-reference.json"
CAMILLE = "kmvm3z7k0vnx6"     # niveau 0 (Beginner), élève en cours dans la progression de référence
NOE = "kmvuqrhc0w5vp"         # niveau 1 (Elementary)

LS_DUMP = "() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('kai.')) o[k] = localStorage.getItem(k) } return o }"

# Hasard reproductible rejoué juste avant un tirage (le démarrage peut consommer un nombre variable de tirages).
RESEED = """(seed) => { let a = seed >>> 0; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }"""

TIRAGES = """() => { const out = [];
  for (let s = 1; s <= 12; s++) { (%s)(s * 7919); AWS = null; out.push(pickMix(10).map(q => q.k + ':' + (q.d.v || q.d.w) + ':' + q.ei)); }
  const M = memStats(); out.push(M.due.map(w => w.key)); out.push(M.often.map(o => o.w.key + ':' + o.m));
  return out; }""" % RESEED


def contexte(browser, base, collector, ls, now=FIXED_NOW, sans_moteur=False, seed=20261030):
    ctx = new_context(browser, base, (390, 844), collector, seed=seed, now=now)
    ctx.add_init_script("(() => { try { if (!sessionStorage.getItem('__seeded')) { localStorage.clear(); const d = "
                        + json.dumps(ls) + "; for (const k in d) localStorage.setItem(k, d[k]); sessionStorage.setItem('__seeded', '1'); } } catch (e) {} })();")
    if sans_moteur:
        ctx.route("**/js/app-certificats.js", lambda r: r.fulfill(status=200, content_type="text/javascript", body="/* moteur retiré pour comparaison */"))
    return ctx


def run(args, base, browser, bilan, collector):
    def ck(titre, cond, detail=""):
        cid, _, t = titre.partition(" ")
        return bilan.check(cid, t, bool(cond), detail)
    ref = json.loads(FIXTURE.read_text(encoding="utf-8"))
    LS = ref["ls"]

    # ------------------------------------------------------------------ CE-0x : rien de changé sans certificat
    c0 = Collector(base)
    ctx = contexte(browser, base, c0, LS, sans_moteur=True)
    page = open_app(ctx.new_page(), base)
    sans = page.evaluate(TIRAGES)
    ctx.close()

    m0 = collector.mark()
    ctx = contexte(browser, base, collector, LS)
    page = open_app(ctx.new_page(), base)
    P = page.evaluate
    ck("CE-01 L'API Cert est chargée (script classique global)", P("() => typeof Cert === 'object' && ['list','get','record','isActive','dueSoon','pickRenewal','scoreRenewal','passExam','themes'].every(f => typeof Cert[f] === 'function')"),
       "Cert absent ou incomplet")
    got = P(LS_DUMP)
    ck("CE-02 Progression de référence relue telle quelle (aucune clé kai.* ajoutée, retirée ni réécrite)", got == LS,
       [k for k in set(got) | set(LS) if got.get(k) != LS.get(k)][:8])
    avec = P(TIRAGES)
    ck("CE-03 Mots du jour, mots à revoir et mots souvent ratés identiques avec et sans le moteur (élève sans certificat, 12 tirages)",
       avec == sans, f"premier écart : {next((i for i, (a, b) in enumerate(zip(avec, sans)) if a != b), '?')}")
    ck("CE-04 Aucun certificat pour un élève qui n'en a jamais passé", P("() => Cert.list().length === 0 && Cert.rotationFilter() === null && Cert.dueSoon().length === 0"), P("() => Cert.list()"))
    th = P("() => Cert.themes()")
    ids = {t["id"] for t in th}
    ck("CE-05 Thèmes certifiables issus des données (noms, adjectifs, adverbes, connecteurs, prépositions, verbes)",
       {"nouns:animals", "adjectives:colours", "adverbs:frequency", "connectors:contrast", "prepositions:place", "verbs:irregular"} <= ids and all(t["n"] > 0 and t["label"] for t in th),
       sorted(ids)[:20])

    # ------------------------------------------------------------------ CE-1x : règles d'épreuve, stockage, durée
    regles = P("""() => { const I = (n, good, fmts) => ({ items: [...Array(n)].map((_, i) => ({ key: 'adjectives:x' + i, fmt: fmts[i % fmts.length], ok: i < good })) });
      return [Cert.passExam(I(10, 9, ['type-fr-en','picture','gap'])).pass, Cert.passExam(I(10, 9, ['type-fr-en','picture'])).pass,
              Cert.passExam(I(10, 8, ['a','b','c'])).pass, Cert.passExam(I(29, 26, ['a','b','c'])).pass, Cert.passExam(I(20, 18, ['a','b','c','d'])).pass,
              Cert.passExam({ n: 0, good: 0, formats: ['a','b','c'] }).pass, Cert.passExam({ n: 10, good: 50, formats: ['a','b','c'] }).p]; }""")
    ck("CE-10 Épreuve : ≥ 90 % ET ≥ 3 formats (9/10 sur 3 formats oui ; 2 formats non ; 80 % non ; 89,7 % non ; 0 question non ; bonnes réponses plafonnées)",
       regles == [True, False, False, False, True, False, 100], regles)

    colours = P("() => Cert.themeWords('adjectives:colours').map(w => w.key)")
    res = P("""(keys) => Cert.record(undefined, 'adjectives:colours', { kind: 'exam', items: keys.slice(0, 10).map((k, i) => ({ key: k, fmt: ['type-fr-en','picture','gap'][i % 3], ok: i !== 4 })) })""", colours)
    c = res["cert"]
    ck("CE-11 Épreuve réussie → certificat daté (obtention, score, formats, échéance)",
       res["ok"] and res["pass"] and c["status"] == "ok" and c["date"] == "2026-10-30" and c["first"] == "2026-10-30" and c["score"] == 90
       and c["formats"] == ["type-fr-en", "picture", "gap"] and c["active"] and c["missed"] == [colours[4]], res)
    ck("CE-12 Validité 3 mois pour un élève de 6e (Beginner) : échéance 30/01/2027", c["expires"] == "2027-01-30" and c["level"] == 0, c)
    brut = P(f"() => localStorage.getItem('kai.cert.v1.{CAMILLE}')")
    try:
        s = json.loads(brut)
        ok = s["v"] == 1 and list(s["themes"]) == ["adjectives:colours"] and s["themes"]["adjectives:colours"]["expires"] == "2027-01-30"
    except Exception:
        ok = False
    ck("CE-13 Stockage par élève : kai.cert.v1.<id> (même forme que kai.daily.v1.<id>), JSON lisible", ok, brut)
    ck("CE-14 Les autres clés kai.* ne sont pas touchées par l'enregistrement d'un certificat",
       {k: v for k, v in P(LS_DUMP).items() if not k.startswith("kai.cert.")} == LS, "clé modifiée")
    noe = P(f"""() => {{ useProfile('{NOE}'); const r = Cert.record('{NOE}', 'nouns:animals', {{ kind: 'exam', n: 20, good: 19, formats: ['a','b','c'] }}).cert;
      const p = PROFS.list.find(x => x.id === '{NOE}'); setLevel(p, 2); const r2 = Cert.record('{NOE}', 'nouns:family', {{ kind: 'exam', n: 20, good: 20, formats: ['a','b','c'] }}).cert;
      setLevel(p, 3); const r3 = Cert.record('{NOE}', 'nouns:body', {{ kind: 'exam', n: 20, good: 20, formats: ['a','b','c'] }}).cert;
      useProfile('{CAMILLE}'); return [r.expires, r2.expires, r3.expires, Cert.validityMonths(0), Cert.validityMonths(1), Cert.validityMonths(2), Cert.validityMonths(3), Cert.list().length, Cert.list('{NOE}').length]; }}""")
    ck("CE-15 Validité selon le niveau : Elementary 3 mois, Intermediate et Upper-intermediate 6 mois ; certificats séparés par élève",
       noe == ["2027-01-30", "2027-04-30", "2027-04-30", 3, 3, 6, 6, 1, 3], noe)
    fin = P("() => [Cert._addMonths('2026-11-30', 3), Cert._addMonths('2027-08-31', 6), Cert._addMonths('2027-11-30', 3)]")
    ck("CE-16 Fin de mois : 30/11 + 3 mois = 28/02 ; 31/08 + 6 mois = 29/02 (année bissextile)", fin == ["2027-02-28", "2028-02-29", "2028-02-29"], fin)
    rate = P("() => { const r = Cert.record(undefined, 'nouns:animals', { kind: 'exam', n: 10, good: 6, formats: ['a','b','c'] }); return [r.ok, r.pass, r.cert.status, r.cert.best, Cert.isActive(undefined, 'nouns:animals')]; }")
    ck("CE-17 Épreuve ratée : notée (meilleur score), thème « à revoir », pas certifié", rate == [True, False, "review", 60, False], rate)

    # ------------------------------------------------------------------ CE-2x : sortie de rotation
    rot = P(f"""() => {{ const A = allWords(), col = new Set(Cert.themeWords('adjectives:colours').map(w => w.key)); let seen = 0, n = 0;
      for (let s = 1; s <= 40; s++) {{ ({RESEED})(s * 104729); AWS = null; for (const q of pickMix(15)) {{ n++; if (col.has('adjectives:' + q.d.w) && q.k === 'adjectives') seen++; }} }}
      const M = memStats(); return {{ seen, n, due: M.due.filter(w => col.has(w.key)).length, often: M.often.filter(o => col.has(o.w.key)).length, f: Cert.inRotation(undefined, A.byKey.get('adjectives:red')) }}; }}""")
    ck("CE-20 Thème certifié et valide : aucun de ses mots dans 40 séries de mots du jour, ni dans « My memory »",
       rot["seen"] == 0 and rot["n"] > 0 and rot["due"] == 0 and rot["often"] == 0 and rot["f"] is False, rot)
    # un mot de couleur à revoir aujourd'hui : on l'injecte dans le journal (raté il y a 3 jours) pour prouver qu'il revient à l'échéance
    P("""() => { const r = { d: '2026-10-27', qs: [{ k: 'mix', n: 10, p: 50, t: 1 }], w: { 'adjectives:red': { k: 'adjectives', e: 'red', f: 'rouge', ok: 0 } }, n: 10, u: 1 };
      DST.days['2026-10-27'] = Object.assign({}, DST.days['2026-10-27'] || {}, r, { w: Object.assign({}, (DST.days['2026-10-27'] || {}).w, r.w) }); AWS = null; }""")
    ck("CE-21 Mot raté d'un thème certifié : absent des mots à revoir tant que le certificat court",
       P("() => !memStats().due.some(w => w.key === 'adjectives:red') && !memStats().often.some(o => o.w.key === 'adjectives:red')"), "red présent")
    scr = P("() => { DTAB = 'today'; openDaily(); const b = document.getElementById('dailybody'); return [document.querySelector('.page.on').id, b.innerHTML.includes('My memory'), b.querySelectorAll('#dround').length]; }")
    ck("CE-23 L'écran My daily work s'affiche normalement avec un certificat (My memory, bouton Start)", scr == ["daily", True, 1], scr)
    page.clock.set_fixed_time("2027-01-30T10:00:00")
    back = P(f"() => {{ AWS = null; ({RESEED})(5); return [Cert.isActive(undefined, 'adjectives:colours'), Cert.rotationFilter('{CAMILLE}') === null, memStats().due.some(w => w.key === 'adjectives:red'), Cert.get(undefined, 'adjectives:colours').left]; }}")
    ck("CE-22 À l'échéance (30/01/2027) le thème revient en révision : le mot raté est de nouveau à revoir", back == [False, True, True, 0], back)

    # ------------------------------------------------------------------ CE-3x : expiration et rappel
    jours = {}
    for d in ("2027-01-22", "2027-01-23", "2027-01-29", "2027-01-30", "2027-03-01"):
        page.clock.set_fixed_time(d + "T10:00:00")
        jours[d] = P("() => [Cert.isActive(undefined, 'adjectives:colours'), Cert.dueSoon(undefined).map(c => c.theme + ':' + c.left).join(','), Cert.dueSoon(undefined, 30).length]")
    ck("CE-30 Expiration : valable jusqu'à la veille de l'échéance, plus le jour même ni après", [jours[d][0] for d in jours] == [True, True, True, False, False], jours)
    ck("CE-31 Rappel une semaine avant : dueSoon(7) vide à J-8, présent à J-7 et J-1, et encore après l'échéance (à renouveler)",
       jours["2027-01-22"][1] == "" and jours["2027-01-23"][1] == "adjectives:colours:7" and jours["2027-01-29"][1] == "adjectives:colours:1"
       and jours["2027-01-30"][1] == "adjectives:colours:0" and jours["2027-03-01"][1].startswith("adjectives:colours:-"), jours)

    # ------------------------------------------------------------------ CE-4x : renouvellement
    page.clock.set_fixed_time("2027-01-25T10:00:00")
    q = P(f"() => {{ ({RESEED})(42); return Cert.pickRenewal(undefined, 'adjectives:colours').map(x => ({{ key: x.key, fmt: x.fmt, f: x.f, miss: x.miss }})); }}")
    keys = [x["key"] for x in q]
    ck("CE-40 Renouvellement : 8 questions, toutes du thème, sans doublon", len(q) == 8 and len(set(keys)) == 8 and set(keys) <= set(colours), q)
    fm = P(f"() => {{ ({RESEED})(7); return Cert.pickRenewal(undefined, 'adjectives:colours', {{ formats: ['type-fr-en', 'gap', 'order'] }}).map(x => x.fmt); }}")
    ck("CE-41 Formats imposés distribués à tour de rôle", fm == ["type-fr-en", "gap", "order"] * 2 + ["type-fr-en", "gap"], fm)
    # pondération : un thème avec des mots des trois fréquences ; un mot très courant raté plusieurs fois
    stat = P(f"""() => {{ const T = Cert.themes().map(t => t.id).filter(id => {{ const W = Cert.themeWords(id), F = new Set(W.map(w => useOf(w.k, w.d).f)); return W.length >= 30 && F.has(1) && F.has(3); }});
      const th = T.includes('nouns:animals') ? 'nouns:animals' : T[0], W = Cert.themeWords(th), f3 = W.filter(w => useOf(w.k, w.d).f === 3), victim = f3[0];
      const cnt = {{}}; ({RESEED})(99);
      for (let i = 0; i < 300; i++) for (const x of Cert.pickRenewal(undefined, th)) cnt[x.key] = (cnt[x.key] || 0) + 1;
      const rate = f => {{ const L = W.filter(w => useOf(w.k, w.d).f === f && w.key !== victim.key); return L.reduce((s, w) => s + (cnt[w.key] || 0), 0) / Math.max(1, L.length); }};
      const before = rate(3);
      DST.days['2027-01-20'] = {{ d: '2027-01-20', qs: [], n: 10, u: 2, w: {{ [victim.key]: {{ k: victim.k, e: victim.d.w, f: victim.d.fr, ok: 0 }} }} }};
      DST.days['2027-01-21'] = {{ d: '2027-01-21', qs: [], n: 10, u: 3, w: {{ [victim.key]: {{ k: victim.k, e: victim.d.w, f: victim.d.fr, ok: 0 }} }} }}; AWS = null;
      const c2 = {{}}; ({RESEED})(99);
      for (let i = 0; i < 300; i++) for (const x of Cert.pickRenewal(undefined, th)) c2[x.key] = (c2[x.key] || 0) + 1;
      delete DST.days['2027-01-20']; delete DST.days['2027-01-21']; AWS = null;
      return {{ th, n: W.length, r1: rate(1), r2: rate(2), r3: before, victimBefore: cnt[victim.key] || 0, victimAfter: c2[victim.key] || 0, f3avg: before }}; }}""")
    ck("CE-42 Tirage pondéré vers les mots peu fréquents (300 tirages : mot rare ≥ 2× plus souvent qu'un mot très courant)",
       stat["r1"] >= 2 * stat["r3"] and stat["r2"] > stat["r3"], stat)
    ck("CE-43 Tirage pondéré vers les mots déjà ratés (un mot très courant raté 2 fois sort ≥ 2× plus souvent)",
       stat["victimAfter"] >= 2 * max(1, stat["victimBefore"]), stat)
    sc = P("() => [Cert.scoreRenewal({ n: 8, good: 7 }), Cert.scoreRenewal({ n: 8, good: 6 }), Cert.scoreRenewal({ n: 10, good: 8 }), Cert.scoreRenewal([{ ok: true }, { ok: true }, { ok: true }, { ok: true }, { ok: false }]), Cert.RULES.renewalSize].map(x => typeof x === 'object' ? [x.p, x.pass] : x)")
    ck("CE-44 Seuil 80 % : 7/8 oui (88 %), 6/8 non (75 %), 8/10 oui (80 % pile), 4/5 oui ; 8 questions par défaut",
       sc == [[88, True], [75, False], [80, True], [80, True], 8], sc)
    ren = P("""() => { const r = Cert.record(undefined, 'adjectives:colours', { kind: 'renewal', n: 8, good: 7 });
      return [r.pass, r.cert.status, r.cert.expires, r.cert.renewals, r.cert.date, r.cert.first, Cert.isActive(undefined, 'adjectives:colours')]; }""")
    ck("CE-45 Renouvellement réussi 5 jours avant l'échéance : +3 mois à partir de l'échéance (30/04/2027), jours restants gardés",
       ren == [True, "ok", "2027-04-30", 1, "2027-01-25", "2026-10-30", True], ren)
    page.clock.set_fixed_time("2027-05-10T10:00:00")
    late = P("() => { const r = Cert.record(undefined, 'adjectives:colours', { kind: 'renewal', n: 8, good: 8 }); return [r.pass, r.cert.expires]; }")
    ck("CE-46 Renouvellement réussi après l'échéance : +3 mois à partir d'aujourd'hui", late == [True, "2027-08-10"], late)
    ko = P("""() => { const r = Cert.record(undefined, 'adjectives:colours', { kind: 'renewal', items: [...Array(8)].map((_, i) => ({ key: 'adjectives:red', ok: i < 6 })) });
      const r2 = Cert.record(undefined, 'adjectives:colours', { kind: 'renewal', n: 8, good: 8 }); const r3 = Cert.record(undefined, 'nouns:animals', { kind: 'renewal', n: 8, good: 8 });
      return [r.pass, r.cert.status, Cert.isActive(undefined, 'adjectives:colours'), Cert.rotationFilter() === null, r2.ok, r2.error, r3.error, r.cert.missed.includes('adjectives:red')]; }""")
    ck("CE-47 Renouvellement raté (6/8) : thème remis en révision, de retour dans les mots du jour ; plus de renouvellement possible sans repasser l'épreuve",
       ko == [False, "review", False, True, False, "no-cert", "no-cert", True], ko)
    P("() => Cert.record(undefined, 'adjectives:colours', { kind: 'exam', n: 10, good: 10, formats: ['a','b','c'] })")
    page.clock.set_fixed_time(FIXED_NOW)

    # ------------------------------------------------------------------ CE-5x : Save & move
    dump = P("() => kaiDump()")
    ck("CE-50 Export « Save & move » : les certificats de chaque élève sont dans le fichier",
       f"kai.cert.v1.{CAMILLE}" in dump["data"] and f"kai.cert.v1.{NOE}" in dump["data"] and dump["app"] == APP_ID, list(dump["data"])[:5])
    mes_certs = P("() => [Cert.list(), Cert.list('" + NOE + "')]")
    ctx.close()

    def appareil_vierge():
        cx = new_context(browser, base, (390, 844), collector, seed=1, now=FIXED_NOW)
        pg = open_app(cx.new_page(), base)
        return cx, pg

    cx, pg = appareil_vierge()
    r = pg.evaluate("(o) => { const r = kaiMerge(o); return [r, Cert.list(), Cert.list('" + NOE + "')]; }", dump)
    ck("CE-51 Import sur un appareil vierge : certificats retrouvés à l'identique (les deux élèves)", r[1] == mes_certs[0] and r[2] == mes_certs[1] and r[0]["nc"] == 5, r)
    cx.close()

    cx, pg = appareil_vierge()
    old = {"app": APP_ID, "v": 1, "date": "2026-10-30T09:00:00.000Z", "data": {k: v for k, v in LS.items() if k != "kai.pcode"}}
    r = pg.evaluate("(o) => { const r = kaiMerge(o); const ks = Object.keys(localStorage).filter(k => k.startsWith('kai.cert.')); return [r, ks, Cert.list().length]; }", old)
    ck("CE-52 Ancien fichier de sauvegarde (sans certificats) : importé comme avant, aucun certificat créé", r[0]["np"] == 2 and r[0]["nc"] == 0 and r[1] == [] and r[2] == 0, r)
    cx.close()

    cx, pg = appareil_vierge()
    trafique = json.loads(json.dumps(dump))
    trafique["data"][f"kai.cert.v1.{NOE}"] = "{ ceci n'est pas du JSON"
    trafique["data"]["kai.cert.v1.inconnu"] = json.dumps({"v": 1, "themes": {"nouns:animals": {"status": "ok", "date": "2026-10-01"}}})
    trafique["data"]["kai.cert.v1."] = "[]"
    trafique["data"][f"kai.cert.v1.{CAMILLE}"] = json.dumps({"v": 1, "themes": {
        "adjectives:colours": {"status": "ok", "date": "2026-10-30", "expires": "2099-01-01", "score": 999, "formats": ["<img src=x onerror=alert(1)>", "picture", 5], "level": 7, "u": 9},
        "nouns:animals": {"status": "ok", "date": "2026-02-31", "expires": "2027-01-01"},
        "nouns:family": {"status": "ok", "date": "2026-10-15", "expires": "pas une date"},
        "nouns:body": "certifié !",
        "<script>": {"status": "ok", "date": "2026-10-30"},
        "verbs:irregular": {"status": "maybe", "date": "2026-10-30", "history": [{"date": "hier"}, {"date": "2026-10-30", "score": "100", "kind": "x"}]},
        "nouns:house": None,
        "__proto__": {"status": "ok"},
    }})
    r = pg.evaluate("(o) => { let err = null, r = null; try { r = kaiMerge(o); } catch (e) { err = String(e); } return [err, r, Cert.list(), Cert.list('" + NOE + "'), Object.keys(localStorage).filter(k => k.startsWith('kai.cert.')).sort()]; }", trafique)
    err, res_m, lc, ln, ks = r
    by = {c["theme"]: c for c in lc}
    ck("CE-53 Fichier trafiqué : import sans plantage, certificats impossibles ignorés, valeurs assainies",
       err is None and set(by) == {"adjectives:colours", "nouns:family", "verbs:irregular", "nouns:animals"}
       and by["adjectives:colours"]["score"] == 100 and by["adjectives:colours"]["formats"] == ["picture"] and by["adjectives:colours"]["level"] == 3
       and by["adjectives:colours"]["expires"] == "2027-10-30"
       and by["nouns:family"]["expires"] == "2027-01-15" and by["nouns:animals"]["status"] == "review"
       and by["verbs:irregular"]["status"] == "review" and by["verbs:irregular"]["history"] == [{"date": "2026-10-30", "kind": "exam", "score": 0, "pass": False}]
       and ln == [],
       r)
    ck("CE-54 Fichier trafiqué : aucune clé de certificat pour un élève inconnu ou sans identifiant",
       f"kai.cert.v1.inconnu" not in ks and "kai.cert.v1." not in ks, ks)
    # stockage local abîmé à la main : lecture sans planter, mots du jour toujours tirés
    r = pg.evaluate(f"""() => {{ localStorage.setItem('kai.cert.v1.{CAMILLE}', '{{"v":1,"themes":[1,2,3]}}'); const a = Cert.list().length;
      localStorage.setItem('kai.cert.v1.{CAMILLE}', 'null'); const b = Cert.list().length; localStorage.setItem('kai.cert.v1.{CAMILLE}', '"texte"');
      let n = 0; try {{ n = pickMix(10).length; }} catch (e) {{ n = String(e); }} return [a, b, Cert.list().length, n, Cert.isActive(undefined, 'adjectives:colours')]; }}""")
    ck("CE-55 Stockage local modifié à la main (tableau, null, texte) : aucun certificat lu, mots du jour tirés normalement", r == [0, 0, 0, 10, False], r)
    cx.close()

    # conflit : même élève sur deux appareils, le certificat le plus récent gagne
    cx, pg = appareil_vierge()
    pg.evaluate("(o) => kaiMerge(o)", dump)
    pg.clock.set_fixed_time("2026-12-01T10:00:00")
    r = pg.evaluate(f"""(o) => {{ const loc = Cert.record('{CAMILLE}', 'nouns:animals', {{ kind: 'exam', n: 10, good: 10, formats: ['a','b','c'] }}).cert;
      const before = Cert.get(undefined, 'adjectives:colours'); const n = kaiMerge(o).nc; return [n, Cert.get(undefined, 'nouns:animals').date, Cert.get(undefined, 'adjectives:colours').u === before.u]; }}""", dump)
    ck("CE-56 Import d'un fichier plus ancien : le certificat local plus récent est gardé, rien n'est écrasé", r == [0, "2026-12-01", True], r)
    cx.close()

    # ------------------------------------------------------------------ CE-6x : suppression d'un élève
    cx, pg = appareil_vierge()
    pg.evaluate("(o) => kaiMerge(o)", dump)
    r = pg.evaluate(f"() => {{ deleteProfile('{NOE}'); return [localStorage.getItem('kai.cert.v1.{NOE}'), Cert.list('{CAMILLE}').length]; }}")
    ck("CE-60 Élève supprimé : ses certificats sont effacés, ceux des autres restent", r == [None, 2], r)
    cx.close()

    errs = collector.since(m0)
    ck("CE-99 Aucune erreur console ni exception JS pendant toute la suite", not errs, errs[:5])


if __name__ == "__main__":
    raise SystemExit(run_suite("certificats", __doc__, run))
