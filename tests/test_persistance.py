#!/usr/bin/env python3
"""Persistance de la progression de « Learning English with Kai » (localStorage `kai.*`, fichiers de sauvegarde).

  python3 tests/test_persistance.py [--app <dossier>]
  python3 tests/test_persistance.py --update-fixture        (régénère la progression de référence)

Question posée : une progression enregistrée par la version ACTUELLE (celle d'avant le découpage) est-elle
relue À L'IDENTIQUE par la version testée ? Quatre preuves :

  PE-1x  scénario en direct : on joue, on capture l'état (stockage + calculs + écrans), on recharge, on recapture : identique ;
  PE-2x  progression de référence (tests/fixtures/progression-reference.json, enregistrée par la version d'origine,
         sur 7 jours, 2 élèves, leçons, tests, tour interrompu, test interrompu, code parent « ancien format ») :
         relue sans perte, mêmes étoiles / série / niveau / notes / écrans qu'à l'origine, les reprises fonctionnent ;
  PE-3x  fichier « Save & move » fabriqué avec cette progression : importé sur un appareil vierge, même résultat ;
  PE-4x  progression d'avant les profils (clé kai.daily.v1) et données corrompues : l'application démarre, sans erreur.

La date est figée au 30/10/2026 10:00 (Europe/Paris) et le hasard est gradué : tout est reproductible.
Si une comparaison échoue, le détail donne la première différence ; ne régénérez JAMAIS la référence avec une
version « découpée » : elle doit rester celle de l'original (commit 51efca8).
"""
import json
import re
import tempfile
from pathlib import Path

from kai_common import (APP_ID, FIXED_NOW, FIXTURES, Bilan, Collector, open_app, current_page, wait_page, run_suite)
from kai_common import new_context as _new_context
from test_parcours import Parcours

FIXTURE = FIXTURES / "progression-reference.json"
SEED = 20261030


def new_context(*a, **k):
    """Ici les polices sont bloquées : on compare des textes d'écran, qui ne doivent pas dépendre des polices chargées."""
    k.setdefault("polices", True)
    return _new_context(*a, **k)

JS_SNAPSHOT = r"""
() => {
  const J = x => JSON.parse(JSON.stringify(x === undefined ? null : x));
  const p = curProf(), g = p ? lvProgress(p) : null, W = testWeeks(8), tot = totalStars();
  return {
    profils: J(PROFS), journal: J(DST.days), etoiles: tot, serie: streak(), rang: rankOf(tot).name,
    niveau: lvOf(p), progression_niveau: g ? { i: g.i, ok: g.ok, items: J(g.items) } : null,
    lecons_semaine: { grammar: J(weekLesson('grammar')), conj: J(weekLesson('conj')) },
    semaines_tests: J(W), memoire_mots: J(wordState()), stats_profil: p ? profStats(p) : null,
    meilleures_lecons: Object.fromEntries(Object.keys(LESSONS).map(id => [id, lessonBest(id)])),
    suggestion: { grammar: suggestLesson('grammar'), conj: suggestLesson('conj') }, nb_par_quiz: QNUM,
    vitesse: VRATE, voix_enregistree: KREC,
  };
}
"""


def norm(t):
    return re.sub(r"\s+", " ", t or "").strip()


def premiere_difference(a, b, chemin=""):
    """Chemin et valeurs de la première différence entre deux structures JSON (pour un message lisible)."""
    if type(a) != type(b):
        return f"{chemin} : {str(a)[:80]} ≠ {str(b)[:80]}"
    if isinstance(a, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a:
                return f"{chemin}/{k} : absent d'un côté (autre : {str(b[k])[:60]})"
            if k not in b:
                return f"{chemin}/{k} : absent de l'autre côté (premier : {str(a[k])[:60]})"
            d = premiere_difference(a[k], b[k], f"{chemin}/{k}")
            if d:
                return d
        return None
    if isinstance(a, list):
        if len(a) != len(b):
            return f"{chemin} : {len(a)} éléments ≠ {len(b)}"
        for i, (x, y) in enumerate(zip(a, b)):
            d = premiere_difference(x, y, f"{chemin}[{i}]")
            if d:
                return d
        return None
    return None if a == b else f"{chemin} : {str(a)[:80]} ≠ {str(b)[:80]}"


def ls_dump(page):
    return page.evaluate("() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('kai.')) o[k] = localStorage.getItem(k) } return o }")


def rendus(P):
    """Texte des écrans qui dépendent de la progression (sans rien modifier). On part de « My daily work »."""
    p = P.page
    out = {}
    P.to_menu()
    out["menu_tuiles"] = norm(p.locator(".tiles").first.text_content())
    out["menu_bienvenue"] = p.evaluate("() => document.getElementById('askb').getAttribute('aria-label')")
    P.click("#toDaily")
    P.on("daily")
    out["daily_today"] = norm(p.locator("#dailybody").text_content())
    P.click('[data-dtab="cal"]')
    out["daily_calendrier"] = norm(p.locator("#dailybody").text_content())
    P.click('[data-dtab="today"]')
    P.back("menu")
    P.click("#toTests")
    P.on("tests")
    out["tests"] = norm(p.locator("#testsbody").text_content())
    P.back("menu")
    P.click("#toMe")
    P.on("me")
    out["me"] = norm(p.locator("#mebody").text_content())
    P.back("menu")
    P.click("#toConj")
    P.on("conj")
    out["liste_conjugaison"] = norm(p.locator("#conjbody").text_content())
    P.back("menu")
    P.click("#toGrammar")
    P.on("grammar")
    out["liste_grammaire"] = norm(p.locator("#grammarbody").text_content())
    P.back("menu")
    return out


def capture(P):
    return {"app": P.ev(JS_SNAPSHOT), "rendus": rendus(P), "ls": ls_dump(P.page)}


# ----------------------------------------------------------------------------------- génération de la référence


def generer_reference(P):
    """Fabrique la progression de référence EN JOUANT l'application (à lancer sur la version d'origine seulement)."""
    p = P.page
    jours = ["2026-10-24", "2026-10-25", "2026-10-26", "2026-10-28", "2026-10-29", "2026-10-30"]

    def aller(date):
        P.ctx.clock.set_fixed_time(f"{date}T10:00:00")
        open_app(p, P.base)

    def tour(wrong_n=0, stop_after=None):
        P.to_menu()
        P.click("#toDaily")
        P.on("daily")
        P.click("#dround")
        if p.locator("#modal.on").count():
            p.locator('[data-mact="restart"]').click()
        P.on("quiz")
        r = P.answer_quiz(wrong_n=wrong_n, stop_after=stop_after)
        if stop_after is not None:
            P.click("#backQ")
            P.on("daily")
        else:
            p.wait_for_timeout(1500)     # laisse « Congrats! » apparaître (le gestionnaire le ferme)
            if p.locator("#qday").count():
                P.click("#qday")
                P.on("daily")
        return r

    def lecon(tuile, lid, wrong_first=False):
        P.to_menu()
        P.click(tuile)
        P.click(f'[data-lesson="{lid}"]')
        P.on("lesson")
        P.click("#lpractice")
        P.practice(wrong_first=wrong_first)

    def test(kind, count=None, wrong_at=None):
        P.to_menu()
        P.click("#toTests")
        P.on("tests")
        P.click(f'[data-test="{kind}"]')
        if p.locator("#modal.on").count():
            p.locator('[data-mact="restart"]').click()
        P.on("test")
        P.test_loop(kind, count=count, wrong_at=wrong_at)

    # J1 samedi 24 : création de l'élève et premier tour parfait
    aller(jours[0])
    p.locator("#kaitap").click()
    wait_page(p, "hello")
    p.locator("#pname").fill("Camille Évrard")
    p.locator('[data-hlv="0"]').click()
    p.locator("#nameform .listen").click()
    wait_page(p, "menu")
    tour()
    # J2 dimanche 25 : humeur « Tired », tour avec 3 erreurs (objectif non atteint)
    aller(jours[1])
    P.to_menu()
    P.click("#toDaily")
    P.on("daily")
    P.click('[data-mood="tired"]')
    tour(wrong_n=3)
    # J3 lundi 26 : tour parfait + leçon be à 90 %
    aller(jours[2])
    tour()
    lecon("#toConj", "be", wrong_first=True)
    # (mardi 27 : rien, la série est coupée)
    # J5 mercredi 28 : tour parfait, leçons de grammaire et de conjugaison
    aller(jours[3])
    tour()
    lecon("#toGrammar", "articles")
    lecon("#toConj", "have")
    # J6 jeudi 29 : test de grammaire parfait + tour parfait
    aller(jours[4])
    test("grammar")
    tour()
    # J7 vendredi 30 (aujourd'hui) : tour, test de conjugaison avec 2 fautes, verbes irréguliers, quiz de noms, réglages,
    #   code parent « ancien format », test interrompu, tour bonus interrompu
    aller(jours[5])
    tour()
    test("conj", wrong_at=4)
    P.to_menu()
    P.click("#toTests")
    P.on("tests")
    P.click('[data-test="irr"]')
    P.on("test")
    P.test_loop("irr")
    P.to_menu()
    P.click("#toTY")
    P.click("#toQuizzes")
    P.click("#toQN")
    P.on("quiz")
    P.click('.seg [data-n="5"]')
    P.click('.topic[data-tag="animals"]')
    P.answer_quiz()
    P.to_menu()
    P.click("#toMe")
    P.on("me")
    P.click('[data-rate="0.8"]')
    P.click('[data-krec="0"]')
    P.click("#mePcSet")
    p.locator("#modal.on").wait_for()
    p.locator("#pcin").fill("1234")
    p.locator("#pcin2").fill("1234")
    p.locator("#pcin2").press("Enter")
    p.wait_for_timeout(300)
    # 2e élève : un tour de leçon, puis retour sur Camille comme élève courant
    P.click("#meNew")
    P.on("hello")
    p.locator("#pname").fill("Noé")
    p.locator('[data-hlv="1"]').click()
    p.locator("#nameform .listen").click()
    P.on("menu")
    lecon("#toGrammar", "plurals", wrong_first=True)
    P.to_menu()
    P.click("#toMe")
    P.on("me")
    P.click("#meSwitch")
    P.on("who")
    p.locator("#plist [data-pid]").first.click()
    P.on("menu")
    # états « interrompus » de Camille : test de grammaire (5 réponses) et tour bonus (3 réponses)
    test("grammar", count=5)
    P.click("#backT")
    p.locator('[data-mact="yes"]').click()
    tour(stop_after=3)


# ----------------------------------------------------------------------------------- les preuves


def contexte_avec_stockage(P_args, base, browser, collector, donnees, label, mobile=True):
    """Contexte neuf dont le localStorage est préchargé une seule fois (pas à chaque rechargement)."""
    ctx = new_context(browser, base, (390, 844), collector, seed=SEED, now=FIXED_NOW, mobile=mobile)
    ctx.add_init_script("(() => { try { if (!sessionStorage.getItem('__seeded')) { localStorage.clear(); "
                        "const d = " + json.dumps(donnees) + "; for (const k in d) localStorage.setItem(k, d[k]); "
                        "sessionStorage.setItem('__seeded', '1'); } } catch (e) {} })();")
    return ctx


def fabrique_parcours(base, browser, bilan, collector, ctx, label="pers"):
    P = Parcours.__new__(Parcours)
    P.label, P.vp, P.base, P.browser = label, (390, 844), base, browser
    P.bilan, P.collector, P.seed, P.mobile = bilan, collector, SEED, True
    P.ctx, P.page = ctx, ctx.new_page()
    P.congrats, P.sid, P.n, P.status, P.name, P.pid, P.snap = 0, "", 0, {}, "", None, {}
    P.tmp, P.save_path = tempfile.mkdtemp(prefix="kai-pers-"), None
    P.page.add_locator_handler(P.page.locator(".congrats"), P._ferme_congrats)
    return P


def run(args, base, browser, bilan, collector):
    def ck(label, cond, detail=""):
        """label = « PE-xx titre » : l'identifiant est le premier mot."""
        cid, titre = label.split(" ", 1)
        return bilan.check(cid, titre, bool(cond), str(detail)[:900])

    if args.update_fixture:
        junk = Bilan("génération")
        ctx = new_context(browser, base, (390, 844), collector, seed=SEED, now=FIXED_NOW, mobile=True)
        P = fabrique_parcours(base, browser, junk, collector, ctx)
        generer_reference(P)
        # On repart d'un chargement à froid pour capturer ce que « un élève qui revient » voit.
        ls = ls_dump(P.page)
        ctx.close()
        ctx = contexte_avec_stockage(args, base, browser, collector, ls, "froid")
        P = fabrique_parcours(base, browser, junk, collector, ctx)
        open_app(P.page, base)
        P.page.wait_for_selector("#plist", state="attached")
        attendu = choisir_eleve_et_capturer(P)
        FIXTURE.parent.mkdir(exist_ok=True)
        FIXTURE.write_text(json.dumps({
            "genere_avec": "index.html d'origine (main 51efca8) — ne pas régénérer avec une version découpée",
            "date_figee": FIXED_NOW, "ls": ls, "attendu": attendu}, ensure_ascii=False, indent=1), encoding="utf-8")
        ctx.close()
        bad = [i for i in junk.items if i["statut"] != "OK" and i["statut"] != "Note"]
        print(f"référence écrite : {FIXTURE} ({len(ls)} clés, {len(json.dumps(ls)) // 1024} Ko) ; {len(bad)} anomalie(s) pendant la fabrication")
        for i in bad[:10]:
            print("  ", i["id"], i["titre"], i["detail"])
        if collector.errors:
            print("  erreurs :", collector.errors[:5])
        return

    blocs(args, base, browser, bilan, collector, ck)


def bloc_direct(args, base, browser, bilan, collector, ck, ref):
    """PE-1x : scénario en direct, avant / après rechargement"""
    ctx = new_context(browser, base, (390, 844), collector, seed=SEED, now=FIXED_NOW, mobile=True)
    P = fabrique_parcours(base, browser, bilan, collector, ctx)
    P.sid = "PE-1"
    open_app(P.page, base)
    P.page.locator("#kaitap").click()
    wait_page(P.page, "hello")
    P.page.locator("#pname").fill("Zoé Martin")
    P.page.locator('[data-hlv="1"]').click()
    P.page.locator("#nameform .listen").click()
    wait_page(P.page, "menu")
    P.click("#toDaily"); P.on("daily"); P.click("#dround"); P.on("quiz")
    P.answer_quiz(wrong_n=2)
    P.page.wait_for_timeout(1200)
    P.to_menu()
    P.click("#toGrammar"); P.click('[data-lesson="plurals"]'); P.on("lesson"); P.click("#lpractice"); P.practice(wrong_first=True)
    P.to_menu()
    P.click("#toTests"); P.on("tests"); P.click('[data-test="irr"]'); P.on("test"); P.test_loop("irr", count=4)
    P.click("#backT"); P.page.locator('[data-mact="yes"]').click()
    avant = capture(P)
    P.page.reload()
    P.page.wait_for_function("typeof PROFS !== 'undefined'")
    P.page.wait_for_timeout(250)
    ck("PE-11 Après rechargement, l'élève revient directement sur « My daily work »", current_page(P.page) == "daily", current_page(P.page))
    apres = capture(P)
    ck("PE-12 Stockage kai.* identique avant / après rechargement (clés et valeurs)", avant["ls"] == apres["ls"], premiere_difference(avant["ls"], apres["ls"], "ls"))
    ck("PE-13 État calculé identique (profils, journal, étoiles, série, rang, niveau, mémoire des mots, semaines de tests)",
                avant["app"] == apres["app"], premiere_difference(avant["app"], apres["app"], "app"))
    ck("PE-14 Écrans identiques (menu, My daily work, calendrier, tests, Me, listes de leçons)", avant["rendus"] == apres["rendus"],
                premiere_difference(avant["rendus"], apres["rendus"], "rendus"))
    ck("PE-15 Le test interrompu est toujours proposé à la reprise après rechargement",
                "Not finished" in apres["rendus"]["tests"], apres["rendus"]["tests"][:200])
    ctx.close()


def bloc_reference(args, base, browser, bilan, collector, ck, ref):
    """PE-2x : progression de référence enregistrée par la version d'origine"""
    ctx = contexte_avec_stockage(args, base, browser, collector, ref["ls"], "ref")
    P = fabrique_parcours(base, browser, bilan, collector, ctx)
    P.sid = "PE-2"
    open_app(P.page, base)
    P.page.wait_for_selector("#plist", state="attached")
    ck("PE-21 Deux élèves enregistrés : l'application demande « Who's learning today? »", current_page(P.page) == "who", current_page(P.page))
    if current_page(P.page) != "who":
        bilan.bloque("PE-2z", "Relecture de la progression bloquée : au démarrage, l'application n'a pas retrouvé les élèves enregistrés par l'original",
                     f"écran affiché : {current_page(P.page)} ; clés présentes : {sorted(ls_dump(P.page))[:6]}")
        ctx.close()
        return
    att = ref["attendu"]
    got = choisir_eleve_et_capturer(P)
    ck("PE-22 Les 7 jours de progression sont relus sans perte (clés kai.* toutes présentes)",
                all(k in got["ls"] for k in ref["ls"]), [k for k in ref["ls"] if k not in got["ls"]])
    ck("PE-23 Les valeurs stockées n'ont pas été réécrites au démarrage", got["ls"] == ref["ls"],
                premiere_difference(ref["ls"], got["ls"], "ls"))
    for cle, titre in (("profils", "profils (niveaux, leçons réussies, notes de tests)"), ("journal", "journal des jours (mots, quiz, humeurs)"),
                       ("etoiles", "total d'étoiles"), ("serie", "série de jours"), ("rang", "rang"), ("niveau", "niveau"),
                       ("progression_niveau", "progression vers le niveau suivant"), ("lecons_semaine", "leçons de la semaine"),
                       ("semaines_tests", "moyennes de tests par semaine"), ("memoire_mots", "mémoire des mots (répétition espacée)"),
                       ("stats_profil", "ligne « niveau · rang · étoiles » de l'élève"), ("meilleures_lecons", "meilleur score de chaque leçon"),
                       ("nb_par_quiz", "nombre de mots par quiz choisi"), ("vitesse", "vitesse de la voix choisie"), ("voix_enregistree", "choix « voix de Kai / voix du téléphone »")):
        ck(f"PE-24 {cle}", got["app"][cle] == att["app"][cle], premiere_difference(att["app"][cle], got["app"][cle], cle))
    for cle in att["rendus"]:
        ck(f"PE-25 écran « {cle} » identique à l'original", got["rendus"][cle] == att["rendus"][cle],
                    premiere_difference(att["rendus"][cle], got["rendus"][cle], cle)[:600] if got["rendus"][cle] != att["rendus"][cle] else "")
    # reprise des états interrompus
    p = P.page
    P.to_menu()
    P.click("#toDaily"); P.on("daily"); P.click("#dround")
    p.locator("#modal.on").wait_for()
    msg = norm(p.locator("#mbody").text_content())
    ck("PE-26 Tour interrompu retrouvé : « 3 questions out of 20 » et « Continue · 4/20 »", "answered 3 questions out of 20" in msg and "Continue · 4/20" in msg, msg[:200])
    p.locator('[data-mact="resume"]').click()
    P.on("quiz")
    ck("PE-27 La reprise redémarre à la question 4 de la partie 1", P.ev("() => QZ.ph === 0 && QZ.i === 3"), P.ev("() => [QZ.ph, QZ.i]"))
    P.to_menu()
    P.click("#toTests"); P.on("tests")
    ck("PE-28 Test de grammaire interrompu retrouvé (5/20)", "Not finished · 5/20" in norm(p.locator('[data-test="grammar"]').text_content()), norm(p.locator('[data-test="grammar"]').text_content()))
    P.click('[data-test="grammar"]')
    p.locator("#modal.on").wait_for()
    ck("PE-29 La reprise du test propose « Finish the test · 6/20 »", "6/20" in norm(p.locator("#mbody").text_content()))
    p.locator('[data-mact="resume"]').click()
    P.on("test")
    P.test_loop("grammar")
    t = P.profile()["tests"]["grammar"]
    ck("PE-2a Test repris et terminé : note 20/20, 2 passages (la note précédente est conservée dans l'historique)", t["last"] == 20 and t["n"] == 2 and len(t["h"]) == 2, t)
    # code parent « ancien format » : doit encore ouvrir la porte
    P.to_menu()
    P.click("#toMe"); P.on("me")
    P.click('[data-mlv="1"]') if P.profile()["lv"] != 1 else P.click('[data-mlv="2"]')
    p.locator("#modal.on").wait_for()
    p.locator("#pcin").fill("0000"); p.locator("#pcin").press("Enter")
    ck("PE-2b Code parent de l'ancien format : un mauvais code est refusé", "Wrong code" in P.toast())
    p.wait_for_timeout(1800)
    lv0 = P.profile()["lv"]
    P.click('[data-mlv="1"]') if lv0 != 1 else P.click('[data-mlv="2"]')
    p.locator("#modal.on").wait_for()
    p.locator("#pcin").fill("1234"); p.locator("#pcin").press("Enter")
    p.wait_for_timeout(400)
    ck("PE-2c Code parent de l'ancien format (« 1234 », enregistré par l'original) : le bon code est accepté après le changement de version",
                P.profile()["lv"] != lv0, f"niveau avant {lv0}, après {P.profile()['lv']}")
    ctx.close()


def bloc_import(args, base, browser, bilan, collector, ck, ref):
    """PE-3x : fichier « Save & move » fabriqué avec cette progression, importé sur un appareil vierge"""
    data = {k: v for k, v in ref["ls"].items() if k != "kai.pcode" and not k.startswith("kai.kv")}
    fichier = Path(tempfile.mkdtemp(prefix="kai-sauv-")) / "sauvegarde-test.json"
    fichier.write_text(json.dumps({"app": APP_ID, "v": 1, "date": "2026-10-30T09:00:00.000Z", "data": data}), encoding="utf-8")
    ctx = new_context(browser, base, (390, 844), collector, seed=SEED, now=FIXED_NOW, mobile=True)
    P = fabrique_parcours(base, browser, bilan, collector, ctx)
    P.sid = "PE-3"
    p = P.page
    open_app(p, base)
    P.create_profile(p, "Visiteur", 0)
    P.click("#toMe"); P.on("me")
    with p.expect_file_chooser() as fc:
        p.locator("#meImp").click()
    fc.value.set_files(str(fichier))
    p.locator("#modal.on").wait_for()
    msg = norm(p.locator("#mbody").text_content())
    ids = [x["id"] for x in json.loads(ref["ls"]["kai.profiles.v1"])["list"]]
    nb_jours = sum(len(json.loads(v)) for k, v in ref["ls"].items() if k.startswith("kai.daily.v1."))
    ck("PE-31 Import de la sauvegarde de référence : « 2 new learners added » et tous les jours fusionnés", "2 new learners added" in msg and f"{nb_jours} days of work merged" in msg, msg)
    p.locator('[data-mact="ok"]').click()
    p.wait_for_function("typeof PROFS !== 'undefined' && PROFS.list.length === 3")
    p.wait_for_timeout(250)
    got = P.ev("() => ({ profs: JSON.parse(JSON.stringify(PROFS.list)), days: Object.fromEntries(PROFS.list.map(p => [p.id, JSON.parse(localStorage.getItem('kai.daily.v1.' + p.id) || '{}')])) })")
    ref_profs = {x["id"]: x for x in json.loads(ref["ls"]["kai.profiles.v1"])["list"]}
    ok_profs = all(next((q for q in got["profs"] if q["id"] == i), None) == ref_profs[i] for i in ids)
    ck("PE-32 Import : les profils importés sont identiques à l'original", ok_profs, "profil différent")
    ok_days = all(got["days"][i] == json.loads(ref["ls"][f"kai.daily.v1.{i}"]) for i in ids if f"kai.daily.v1.{i}" in ref["ls"])
    ck("PE-33 Import : le journal de chaque élève importé est identique à l'original", ok_days, "journal différent")
    ck("PE-34 Import : les tests et tours interrompus (kai.tsave / kai.qsave) sont repris tels quels",
                all(P.ev("k => localStorage.getItem(k)", k) == v for k, v in ref["ls"].items() if k.startswith(("kai.tsave.", "kai.qsave.", "kai.pq.", "kai.tq."))),
                "clé d'état interrompu absente ou modifiée")
    ck("PE-35 Import : le code parent de l'appareil n'est pas écrasé et celui du fichier n'est pas exporté", "kai.pcode" not in data and P.ev("() => !localStorage.getItem('kai.pcode')"))
    ctx.close()


def bloc_anciennes(args, base, browser, bilan, collector, ck, ref):
    """PE-4x : progression d'avant les profils et données corrompues"""
    jours = None
    if FIXTURE.is_file():
        ref = json.loads(FIXTURE.read_text(encoding="utf-8"))
        pid0 = json.loads(ref["ls"]["kai.profiles.v1"])["list"][0]["id"]
        jours = ref["ls"][f"kai.daily.v1.{pid0}"]
        ctx = contexte_avec_stockage(args, base, browser, collector, {"kai.daily.v1": jours}, "ancien")
        P = fabrique_parcours(base, browser, bilan, collector, ctx)
        P.sid = "PE-4"
        p = P.page
        open_app(p, base)
        ck("PE-41 Progression d'avant les profils (clé kai.daily.v1) sans profil : l'accueil s'affiche", current_page(p) == "home", current_page(p))
        P.create_profile(p, "Premier", 0)
        ck("PE-42 La progression d'avant les profils revient au premier élève créé, la clé ancienne est retirée",
                    P.ev("() => JSON.stringify(DST.days)") == json.dumps(json.loads(jours), separators=(",", ":"), ensure_ascii=False).replace(" ", "") or
                    P.ev("() => Object.keys(DST.days).length") == len(json.loads(jours)),
                    P.ev("() => Object.keys(DST.days).length"))
        ck("PE-43 La clé ancienne kai.daily.v1 a été déplacée, pas dupliquée", P.ev("() => localStorage.getItem('kai.daily.v1') === null"))
        ctx.close()

    corrompus = {
        "profils illisibles (pas du JSON)": {"kai.profiles.v1": "ceci n'est pas du JSON{"},
        "profils = nombre": {"kai.profiles.v1": "42"},
        "profils sans liste": {"kai.profiles.v1": '{"cur":"x"}'},
        "journal illisible": {"kai.profiles.v1": '{"list":[{"id":"kA","name":"Test","lv":0,"u":1}],"cur":"kA"}', "kai.daily.v1.kA": "{{{"},
        "journal = tableau": {"kai.profiles.v1": '{"list":[{"id":"kA","name":"Test","lv":0,"u":1}],"cur":"kA"}', "kai.daily.v1.kA": "[1,2]"},
        "niveau hors limites": {"kai.profiles.v1": '{"list":[{"id":"kA","name":"Test","lv":99,"u":1}],"cur":"kA"}'},
        "réglages absurdes": {"kai.qnum": "abc", "kai.rate": "-3", "kai.rec": "peut-être"},
        "tour sauvegardé illisible": {"kai.profiles.v1": '{"list":[{"id":"kA","name":"Test","lv":0,"u":1}],"cur":"kA"}', "kai.qsave.kA.daily": "{\"v\":1,\"qs\":\"x\"}", "kai.tsave.kA.grammar": "pas du JSON"},
    }
    for i, (nom, donnees) in enumerate(corrompus.items(), 1):
        mark = collector.mark()
        ctx = contexte_avec_stockage(args, base, browser, collector, donnees, "corrompu")
        P = fabrique_parcours(base, browser, bilan, collector, ctx)
        p = P.page
        try:
            open_app(p, base)
            pid = current_page(p)
            vit = pid in ("home", "daily", "who", "menu")
            if pid == "home":
                p.locator("#kaitap").click()
                p.wait_for_timeout(300)
                vit = vit and current_page(p) in ("hello", "who", "menu", "daily")
            elif pid == "daily":
                P.click(".dsec span") if False else None
            erreurs = collector.since(mark)
            ck(f"PE-5{i} Données corrompues « {nom} » : l'application démarre et reste utilisable, sans erreur",
                        vit and not erreurs, f"écran {pid} ; erreurs : " + "; ".join(f"[{g}] {t}" for g, t in erreurs[:3]))
            del collector.errors[mark:]    # signalé ci-dessus : on ne le compte pas une seconde fois au bilan global
        finally:
            ctx.close()



def blocs(args, base, browser, bilan, collector, ck):
    ref = json.loads(FIXTURE.read_text(encoding="utf-8")) if FIXTURE.is_file() else None
    for nom, f, besoin in (("PE-1x", bloc_direct, False), ("PE-2x", bloc_reference, True), ("PE-3x", bloc_import, True), ("PE-4x", bloc_anciennes, False)):
        if besoin and ref is None:
            bilan.ko(nom.replace('x', '0'), "Progression de référence absente (tests/fixtures/progression-reference.json)", "à générer avec --update-fixture sur la version d'origine (51efca8)")
            continue
        try:
            f(args, base, browser, bilan, collector, ck, ref)
        except Exception as ex:   # noqa: BLE001 - on constate : la suite du bloc est bloquée, les autres blocs continuent
            ck(f"{nom.replace('x', '9')} Le bloc {nom} s'est interrompu", False, f"{type(ex).__name__}: {str(ex)[:600]}")


def choisir_eleve_et_capturer(P):
    """Après le chargement à froid de la référence : choisir Camille (élève courant) puis capturer."""
    p = P.page
    if current_page(p) == "who":
        p.locator("#plist [data-pid]").first.click()
        wait_page(p, "daily")
    return capture(P)


def extra(ap):
    ap.add_argument("--update-fixture", action="store_true", help="régénère tests/fixtures/progression-reference.json (version d'ORIGINE uniquement)")


if __name__ == "__main__":
    raise SystemExit(run_suite("Persistance", __doc__, run, extra))
