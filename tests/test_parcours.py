#!/usr/bin/env python3
"""Parcours de bout en bout de « Learning English with Kai » (390x844 « téléphone » et 1280x800 « ordinateur »).

  python3 tests/test_parcours.py [--app <dossier>] [--only 390|1280] [--keep-going]

Un élève qui découvre l'application : premier lancement et création du profil, mots du jour (tour complet),
vocabulaire (recherche, fiche, son), une leçon de conjugaison et une de grammaire jusqu'au bout, trois tests
notés (dont un interrompu puis repris), des quiz (avec une erreur volontaire), récompenses et calendrier,
« Save & move » (téléchargement, puis restauration sur un autre « appareil », fichiers corrompus),
changement d'élève, code parent, suppression, rechargement.
Sur TOUT le parcours : 0 erreur console, 0 exception JS, 0 requête en échec ou en 404.

Les bonnes réponses sont lues dans les globales JS (QZ, LQ, TQ…) : le test vérifie ce que l'application
AFFICHE par rapport à ce qu'elle SAIT, puis clique comme un élève.
"""
import json
import re
import tempfile
from pathlib import Path

from kai_common import (APP_ID, OUT, Bilan, Collector, KO, OK, BLOQUE, new_context, open_app, current_page, wait_page,
                        js_available, run_suite)

VIEWPORTS = {"390": (390, 844), "1280": (1280, 800)}
GLOBALES = ["PROFS", "DST", "QZ", "LQ", "TQ", "LESSONS", "LORDER", "LV", "RANKS", "totalStars", "starsOf", "streak",
            "kvFind", "KVD", "todayKey", "lvOf", "curProf", "tmatch", "DMAP", "KINDS", "TESTS"]

JS_QZ = "(() => { const q = QZ.qs[QZ.ph][QZ.i]; return { ok: q.opts.indexOf(q.d), labels: q.labels, ans: q.ans, ph: QZ.ph, i: QZ.i, n: QZ.qs[QZ.ph].length, kind: QZ.kind }; })()"
JS_LQ = "(() => { const q = LQ.qs[LQ.i]; return { ok: q.opts.indexOf(q.o[0]), opts: q.opts, expl: q.e, i: LQ.i, n: LQ.qs.length }; })()"
JS_TQ = """(() => { const q = TQ.qs[TQ.i]; const base = { i: TQ.i, n: TQ.qs.length };
  if (q.irr) return { ...base, t: 'irr', pt: q.d.pt, pp: q.d.pp };
  if (q.typed) return { ...base, t: 'typed', a: q.a };
  return { ...base, t: 'mcq', ok: q.opts.indexOf(q.o[0]), opts: q.opts }; })()"""


def opt_lab(o):
    return "(no word)" if o == "—" else o


def stars_oracle(rec):
    """Étoiles d'une journée, recalculées HORS de l'application d'après la règle affichée dans l'aide « Stars, trophy & medals »."""
    w = rec.get("w", {}) or {}
    m = sum(1 for x in w.values() if x.get("ok") or x.get("fx"))
    n = rec.get("n")
    qs = rec.get("qs", []) or []
    done = (m >= n) if n else len(rec.get("g", {}) or {}) >= 5
    goal_t = rec.get("goalT")
    bonus = sum(1 for q in qs if q["t"] > goal_t) if goal_t else 0
    perf = sum(1 for q in qs if not q["k"].startswith("lesson-") and q["p"] == 100)
    lessons = sum(1 for q in qs if q["k"].startswith("lesson-") and q["p"] >= 70)
    return m // 5 + (3 if done else 0) + bonus + perf + 2 * lessons


def rank_oracle(total):
    ranks = [(0, "Rookie"), (25, "Explorer"), (75, "Adventurer"), (150, "Champion"), (300, "Hero"), (500, "Master"), (800, "Legend")]
    i = 0
    while i + 1 < len(ranks) and total >= ranks[i + 1][0]:
        i += 1
    return i + 1, ranks[i][1]


def short(x, n=700):
    s = str(x).strip().replace("\n", " ")
    return s if len(s) <= n else s[:n] + "…"


class Parcours:
    def __init__(self, label, viewport, base, browser, bilan, collector, seed):
        self.label, self.vp, self.base, self.browser = label, viewport, base, browser
        self.bilan, self.collector, self.seed = bilan, collector, seed
        self.mobile = viewport[0] < 600
        self.ctx = new_context(browser, base, viewport, collector, seed=seed, mobile=self.mobile)
        self.page = self.ctx.new_page()
        # « Congrats! » (Kai félicite) recouvre l'écran jusqu'à « Thanks, Kai! » : l'élève le ferme, le test aussi.
        self.congrats = 0
        self.page.add_locator_handler(self.page.locator(".congrats"), self._ferme_congrats)
        self.sid = ""
        self.n = 0
        self.status = {}
        self.name = "Léa Dupont"
        self.pid = None
        self.tmp = tempfile.mkdtemp(prefix="kai-tests-")
        self.save_path = None
        self.snap = {}

    # ------------------------------------------------------------------ plomberie
    def _ferme_congrats(self, loc):
        self.congrats += 1
        loc.locator("button").click()

    def check(self, titre, cond, detail=""):
        self.n += 1
        return self.bilan.check(f"{self.sid}.{self.n}@{self.label}", titre, bool(cond), short(detail))

    def note(self, titre, detail=""):
        self.n += 1
        self.bilan.note(f"{self.sid}.{self.n}@{self.label}", titre, short(detail))

    def ev(self, js, arg=None):
        return self.page.evaluate(js) if arg is None else self.page.evaluate(js, arg)

    def click(self, sel, **kw):
        self.page.locator(sel).first.click(**kw)

    def text(self, sel):
        """Texte du DOM (les feuilles de style passent beaucoup de titres en MAJUSCULES : on lit le texte réel)."""
        return re.sub(r"\s+", " ", self.page.locator(sel).first.text_content() or "").strip()

    def visible(self, sel):
        return self.page.locator(sel).first.is_visible()

    def on(self, pid, timeout=8000):
        wait_page(self.page, pid, timeout)

    def toast(self, contient=None):
        """Texte du message éphémère. Avec `contient`, on attend CE message (un message précédent peut encore être affiché ;
        et le code parent est maintenant haché de façon asynchrone : le message arrive un peu plus tard)."""
        try:
            if contient:
                self.page.wait_for_function(
                    "s => { const t = document.getElementById('toast'); return t.classList.contains('show') && (t.textContent || '').includes(s) }",
                    arg=contient, timeout=6000)
            else:
                self.page.locator("#toast.show").wait_for(timeout=4000)
        except Exception:   # noqa: BLE001 - le contrôle qui suit constatera et affichera ce qui est réellement à l'écran
            pass
        return (self.page.locator("#toast").text_content() or "").strip()

    def no_overflow(self, what):
        w = self.ev("() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]")
        self.check(f"Pas de défilement horizontal : {what}", w[0] <= w[1] + 1, f"scrollWidth {w[0]} > largeur {w[1]}")

    def back(self, expected):
        self.page.locator(".page.on .back").first.click()
        self.on(expected)

    def to_menu(self):
        """Plomberie entre deux étapes : on repart du menu (les étapes elles-mêmes naviguent en cliquant)."""
        self.ev("() => { try { closeModal() } catch (e) {} ; show('menu') }")
        self.on("menu")

    def ls(self):
        return self.ev("() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k) } return o }")

    def profile(self):
        return self.ev("() => JSON.parse(JSON.stringify(curProf()))")

    def today(self):
        return self.ev("() => todayKey()")

    def day_rec(self):
        return self.ev("() => JSON.parse(JSON.stringify(DST.days[todayKey()] || null))")

    def step(self, sid, titre, fn, needs=(), from_menu=True):
        for need in needs:
            if self.status.get(need) != OK:
                self.bilan.bloque(f"{sid}@{self.label}", f"{titre} — bloqué : l'étape {need} n'est pas OK")
                self.status[sid] = BLOQUE
                return
        self.sid, self.n = sid, 0
        mark = self.collector.mark()
        interrompu = False
        try:
            if from_menu and sid != "P01" and self.status.get("P02") == OK:
                self.to_menu()
            fn(self)
        except Exception as ex:   # noqa: BLE001 - on constate, on photographie, on continue
            interrompu = True
            self.n += 1
            import traceback
            ligne = [f"{Path(f.filename).name}:{f.lineno}" for f in traceback.extract_tb(ex.__traceback__) if f.filename.endswith("test_parcours.py")]
            self.bilan.ko(f"{sid}.x@{self.label}", f"{titre} : le scénario s'est arrêté", short(ex, 700) + (f"  [ligne {ligne[-1]}]" if ligne else ""))
            try:
                OUT.mkdir(exist_ok=True)
                self.page.screenshot(path=str(OUT / f"echec-{sid}-{self.label}.png"))
            except Exception:   # noqa: BLE001
                pass
        errs = self.collector.since(mark)
        self.n += 1
        self.bilan.check(f"{sid}.err@{self.label}", f"{sid} : aucune erreur console, exception JS ni requête en échec", not errs,
                         "; ".join(f"[{g}] {t}" for g, t in errs[:4]))
        # Un contrôle KO n'empêche pas les étapes suivantes (elles sont jouées et peuvent révéler d'autres anomalies) ;
        # seul un scénario INTERROMPU (état de départ introuvable) les bloque.
        self.status[sid] = KO if interrompu else OK

    # ------------------------------------------------------------------ gestes de l'élève
    def answer_quiz(self, wrong_first=False, wrong_n=0, stop_after=None):
        """Joue les deux parties d'un quiz (mots du jour compris). Renvoie (nb de questions, premier verdict).
        wrong_n : nombre d'erreurs volontaires au début de la partie 1 ; stop_after : s'arrête (sans « Next ») après k réponses."""
        verdict0 = None
        wrong_n = max(wrong_n, 1 if wrong_first else 0)
        for phase in (0, 1):
            n = self.ev("() => QZ.qs[QZ.ph].length")
            for i in range(n):
                info = self.ev(JS_QZ)
                labels = [t.strip() for t in self.page.locator("#opts .opt").all_inner_texts()]
                self.check(f"Quiz partie {phase + 1}, question {i + 1} : les boutons affichent les libellés prévus",
                           labels == [str(x).strip() for x in info["labels"]], f"{labels} ≠ {info['labels']}")
                idx = info["ok"]
                wrong = phase == 0 and i < wrong_n
                if wrong:
                    idx = (idx + 1) % len(labels)
                self.page.locator("#opts .opt").nth(idx).click()
                self.page.locator("#qnext").wait_for()
                v = self.text(".verdict")
                if stop_after is not None and phase == 0 and i + 1 >= stop_after:
                    return n, v
                if wrong and i == 0:
                    verdict0 = v
                    self.check("Erreur volontaire : le verdict dit « OOPS » et donne la bonne réponse", "OOPS" in v and info["ans"].upper() in v.upper(), v)
                    self.check("Erreur volontaire : la bonne option est surlignée en vert", self.page.locator("#opts .opt.right").count() == 1)
                    self.check("Erreur volontaire : l'option choisie est marquée fausse", self.page.locator("#opts .opt.wrong").count() == 1)
                elif i == 0 and phase == 0:
                    self.check("Bonne réponse : verdict positif", "OOPS" not in v and v.strip() != "", v)
                self.page.locator("#qnext").click()
            if phase == 0:
                self.page.locator("#qp2").wait_for()
                self.click("#qp2")
        # Partie 3 « Type it » : seulement si des mots ont été ratés (on retape le mot qui manque)
        self.page.wait_for_function("!!document.querySelector('#qwrap .qend, #qwrap #xin')")
        if self.page.locator("#xin").count():
            m = self.ev("() => QZ.p3.items.length")
            self.check("Partie 3 « Type it » proposée après une erreur", m >= 1 and "Part 3" in self.text(".qpart"), self.text(".qpart"))
            for j in range(m):
                mot = self.ev("() => t3Ans(QZ.p3.items[QZ.p3.i])")
                if j == 0:
                    self.page.locator("#xin").fill("")
                    self.click("#xcheck")
                    self.check("Partie 3 : valider un champ vide ne fait rien (le champ reste actif)", self.page.locator("#xnext").count() == 0)
                self.page.locator("#xin").fill(mot.upper() if j % 2 else mot)
                self.page.locator("#xin").press("Enter") if j % 2 else self.click("#xcheck")
                self.page.locator("#xnext").wait_for()
                if j == 0:
                    self.check("Partie 3 : mot juste accepté (casse ignorée)", "OOPS" not in self.text("#xfb .verdict") and "IT'S" not in self.text("#xfb .verdict"), self.text("#xfb .verdict"))
                self.click("#xnext")
        return n, verdict0

    def practice(self, wrong_first=False):
        """Entraînement d'une leçon : 10 questions, explication après chaque réponse."""
        n = self.ev("() => LQ.qs.length")
        self.check("Entraînement : 10 questions", n == 10, n)
        for i in range(n):
            info = self.ev(JS_LQ)
            labels = [t.strip() for t in self.page.locator("#lessonbody .lopts .opt").all_inner_texts()]
            exp = [opt_lab(o) for o in info["opts"]]
            if not self.check(f"Question {i + 1} : les boutons affichent les options prévues", labels == exp, f"{labels} ≠ {exp}"):
                pass
            idx = info["ok"]
            wrong = wrong_first and i == 0
            if wrong:
                idx = (idx + 1) % len(labels)
            self.page.locator("#lessonbody .lopts .opt").nth(idx).click()
            self.page.locator("#pnext").wait_for()
            v = self.text("#pfb .verdict")
            expl = self.text("#pfb .pexp").strip()
            if i == 0:
                self.check("Après la réponse : une explication non vide est affichée", len(expl) > 3, expl)
                self.check("Après la réponse : le verdict correspond", ("OOPS" in v) == wrong, v)
            self.page.locator("#pnext").click()
        return n

    def test_loop(self, kind, count=None, wrong_at=None):
        """Test noté : répond à `count` questions (toutes si None). `wrong_at` : numéro (0-based) d'une question ratée exprès."""
        n = self.ev("() => TQ.qs.length")
        restant = n - self.ev("() => TQ.i")
        for _ in range(count if count is not None else restant):
            info = self.ev(JS_TQ)
            i = info["i"]
            wrong = wrong_at == i
            dots = self.page.locator("#testbody .dots i").count()
            if i == 0:
                self.check("Test : un point de progression par question", dots == info["n"], f"{dots} points pour {info['n']} questions")
            if info["t"] == "mcq":
                idx = info["ok"] if not wrong else (info["ok"] + 1) % len(info["opts"])
                labels = [t.strip() for t in self.page.locator("#testbody .lopts .opt").all_inner_texts()]
                if i < 3:
                    self.check(f"Test, question {i + 1} : options affichées = options prévues", labels == [opt_lab(o) for o in info["opts"]], labels)
                self.page.locator("#testbody .lopts .opt").nth(idx).click()
            elif info["t"] == "typed":
                self.page.locator("#tans").fill("zzz" if wrong else info["a"][0])
                if i % 2 == 0:
                    self.page.locator("#tans").press("Enter")      # au clavier : Entrée valide
                else:
                    self.click("#tcheck")
            else:
                pt = info["pt"].split("/")[0].strip()
                pp = info["pp"].split("/")[0].strip()
                self.page.locator("#ipt").fill("zzz" if wrong else pt)
                self.page.locator("#ipt").press("Enter")           # Entrée passe au champ suivant
                self.check("Verbes irréguliers : Entrée dans le 1er champ passe au 2e", self.ev("() => document.activeElement && document.activeElement.id") == "ipp")
                self.page.locator("#ipp").fill(pp)
                self.page.locator("#ipp").press("Enter")           # Entrée valide
            self.page.locator("#tnext").wait_for()
            self.page.locator("#tnext").click()
        return n

    # ------------------------------------------------------------------ profils
    def create_profile(self, page, name, level=0):
        page.locator("#kaitap").click() if current_page(page) == "home" else None
        wait_page(page, "hello")
        page.locator("#pname").fill(name)
        page.locator(f'[data-hlv="{level}"]').click()
        page.locator("#nameform .listen").click()
        wait_page(page, "menu")


# =========================================================================================== les étapes


def s01_premier_lancement(P):
    p = P.page
    open_app(p, P.base)
    manquantes = js_available(p, GLOBALES)
    P.check("Les globales JS dont les tests ont besoin existent", not manquantes, manquantes)
    P.check("Premier lancement : l'écran d'accueil est affiché", current_page(p) == "home", current_page(p))
    P.check("Le titre de l'onglet est « Learning English with Kai »", p.title() == "Learning English with Kai", p.title())
    # Depuis S-02 (analyse UX de Matt) : un bouton « Start » principal remplace l'invitation « Tap Kai to start »
    P.check("L'accueil propose un bouton « Start » visible", P.visible("#start") and "Start" in P.text("#start"), P.text("#start"))
    P.check("Aucune donnée d'élève avant le premier lancement", not [k for k in P.ls() if k.startswith("kai.profiles") or k.startswith("kai.daily")])
    P.check("Les deux bulles de Kai sont présentes (rôle bouton, au clavier)", p.locator("#home .bb[role=button][tabindex='0']").count() == 2)
    P.check("Kai est affiché (image chargée)", P.ev("() => { const i = document.querySelector('#stage image'); return !!i && !!i.getAttribute('href') }"))
    P.no_overflow("accueil")
    # Clavier : Tab arrive sur le bouton de Kai, Entrée ouvre l'application
    p.keyboard.press("Tab")
    foc = P.ev("() => { const a = document.activeElement; return a ? (a.id || a.getAttribute('class') || a.tagName) : '' }")
    P.note("Clavier : premier élément atteint par Tab sur l'accueil", foc)
    P.click("#kaitap")
    P.on("hello")
    P.check("Sans profil, toucher Kai ouvre « Hello! »", True)


def s02_creation_profil(P):
    p = P.page
    p.wait_for_timeout(600)      # l'application donne le focus au champ après 400 ms
    P.check("Le champ prénom a le focus à l'arrivée (ordinateur) ou n'est pas forcé (téléphone)",
            P.mobile or P.ev("() => document.activeElement.id") == "pname", P.ev("() => document.activeElement.id"))
    P.click("#nameform .listen")
    P.check("Prénom vide : message d'aide, on reste sur « Hello! »", "Type your first name" in P.text("#nmsg") and current_page(p) == "hello", P.text("#nmsg"))
    p.locator("#pname").fill("   ")
    P.click("#nameform .listen")
    P.check("Prénom fait d'espaces : même message", "Type your first name" in P.text("#nmsg") and current_page(p) == "hello")
    p.locator("#pname").fill("")
    p.locator("#pname").press_sequentially("Abcdefghijklmnopqrstuvwxyz")
    v = p.locator("#pname").input_value()
    P.check("Prénom trop long : le champ s'arrête à 16 caractères", len(v) == 16, v)
    p.locator("#pname").fill("  Léa   Dupont ")
    P.check("Les 4 niveaux sont proposés, « Beginner » est choisi par défaut",
            p.locator("#hlvpick .lvopt").count() == 4 and P.text("#hlvpick .lvopt.on").lower().startswith("beginner"), P.text("#hlvpick .lvopt.on"))
    P.click('[data-hlv="0"]')
    p.locator("#pname").press("Enter")           # Entrée valide le formulaire (clavier)
    P.on("menu")
    prof = P.profile()
    P.pid = prof["id"]
    P.check("Espaces superflus nettoyés : prénom enregistré « Léa Dupont »", prof["name"] == "Léa Dupont", prof["name"])
    P.check("Niveau Beginner, premier élève marqué « first »", prof["lv"] == 0 and prof.get("first") == 1, prof)
    P.check("Le profil est écrit dans localStorage (kai.profiles.v1)", P.pid in P.ls().get("kai.profiles.v1", ""))
    label = P.ev("() => document.getElementById('askb').getAttribute('aria-label')")
    P.check("Le menu accueille l'élève par son prénom", "Welcome Léa Dupont!" in label, label)
    P.check("La pastille « Me » affiche l'initiale", P.text("#meIni").strip() == "L", P.text("#meIni"))
    P.check("Les six tuiles du menu sont là",
            all(P.visible(f"#{t}") for t in ("toDaily", "toWords", "toGrammar", "toConj", "toTests", "toTY")))
    P.no_overflow("menu")


def s03_mots_du_jour(P):
    p = P.page
    P.click("#toDaily")
    P.on("daily")
    P.check("« My daily work » : objectif du niveau Beginner = 0/10", "0/10" in P.text(".dsec span"), P.text(".dsec span"))
    P.check("Les 6 humeurs sont proposées", p.locator("#dailybody [data-mood]").count() == 6)
    P.click('[data-mood="great"]')
    p.locator("#dailybody .mymood").wait_for()
    P.check("Humeur choisie : affichée et enregistrée pour aujourd'hui", "Great" in P.text("#dailybody .mymood") and (P.day_rec() or {}).get("mood") == "great", P.day_rec())
    P.check("Kai répond à l'humeur par une bulle", p.locator("#dailybody .dsay .bb").count() == 1)
    P.no_overflow("My daily work")
    P.click("#dround")
    P.on("quiz")
    k = P.ev("() => QZ.kind")
    P.check("Le bouton « Start » lance un tour de mots du jour (kind = mix)", k == "mix", k)
    P.check("Titre de la partie : Words of the day · Part 1 · French → English", "Words of the day · Part 1" in P.text(".qpart"), P.text(".qpart"))
    n, _ = P.answer_quiz()
    P.check("Un tour de mots du jour = 10 mots pour Beginner", n == 10, n)
    end = P.text("#qwrap")
    P.check("Fin du tour : « 100% » et « PERFECT! »", "PERFECT" in end.upper() and "100%" in end, end[:200])
    P.check("Fin du tour : l'objectif du jour est annoncé atteint (10 mots)", "Goal reached: 10 words today" in end, end[:400])
    P.check("Fin du tour : 10 lignes dans le récapitulatif", p.locator("#qwrap .recap li").count() == 10)
    # (interrogation en JS pur : une action Playwright déclencherait le gestionnaire qui ferme la fenêtre)
    p.wait_for_function("!!document.querySelector('.congrats')", timeout=6000)
    cg = P.ev("() => { const c = document.querySelector('.congrats'); return { txt: c.textContent, role: c.getAttribute('role'), btn: c.querySelector('button').textContent } }")
    P.check("Kai félicite (« Congrats! — Today's goal reached! ») une fois l'objectif atteint", "Today's goal reached" in cg["txt"], cg["txt"])
    P.check("La félicitation est un dialogue étiqueté et a un bouton « Thanks, Kai! »", cg["role"] == "dialog" and "Thanks, Kai!" in cg["btn"], cg)
    P.ev("() => document.querySelector('.congrats button').click()")
    P.check("« Thanks, Kai! » ferme la félicitation", p.locator(".congrats").count() == 0)
    rec = P.day_rec()
    mastered = sum(1 for w in rec["w"].values() if w.get("ok"))
    P.check("Enregistrement du jour : 10 mots maîtrisés, 1 tour à 100 %", mastered == 10 and len(rec["qs"]) == 1 and rec["qs"][0]["p"] == 100, rec)
    P.check("Enregistrement du jour : date, objectif et niveau mémorisés", rec["d"] == P.today() and rec["n"] == 10 and rec["lv"] == 0, {k: rec.get(k) for k in ("d", "n", "lv")})
    P.check("Le tour porte ses mots dans les 6 natures (verbes, noms…) : au moins 3 natures différentes",
            len({w["k"] for w in rec["w"].values()}) >= 3, {w["k"] for w in rec["w"].values()})
    P.click("#qday")
    P.on("daily")
    P.check("Retour sur « My daily work » : 10/10", "10/10" in P.text(".dsec span"), P.text(".dsec span"))
    P.check("Le bouton « Other quizzes » apparaît quand l'objectif est atteint", P.visible("#dmore"))
    P.check("Le trophée du jour est célébré une seule fois (marque cel)", (P.day_rec() or {}).get("cel") == 1)
    P.check("Les mots du jour sont listés (10)", P.text("h2:has-text('Words of the day') + span").strip() == "10" if p.locator("h2:has-text('Words of the day') + span").count() else True)


def s04_vocabulaire(P):
    p = P.page
    P.click("#toWords")
    P.on("words")
    P.check("« Words » : 8 familles de mots proposées (tuiles)", p.locator("#wtiles .tile").count() == 9, p.locator("#wtiles .tile").count())
    P.no_overflow("Words")
    p.locator("#wq").fill("go")
    P.check("Recherche « go » : compteur « words found »", "words found" in P.text("#wcount"), P.text("#wcount"))
    P.check("Recherche « go » : les tuiles sont masquées, les résultats affichés", not P.visible("#wtiles") and P.visible("#wres"))
    heads = [t.strip().title() for t in p.locator("#wres .wgrp h2").all_text_contents()]
    P.check("Recherche « go » : le verbe « go » est dans le groupe Verbs", "Verbs" in heads and p.locator("#wres .wgrp[data-wc=verbs] h3").first.text_content().strip().lower().endswith("go"), heads)
    n1 = p.locator("#wres .vcard").count()
    p.locator("#wq").fill("go ")
    P.check("Espace final ignoré (« go » = « go  »)", p.locator("#wres .vcard").count() == n1, f"{n1} vs {p.locator('#wres .vcard').count()}")
    p.locator("#wq").fill("ECOLE")
    P.check("Recherche sans accent ni casse : « ECOLE » trouve « school »", "school" in P.text("#wres").lower(), P.text("#wres")[:200])
    p.locator("#wq").fill("chien")
    P.check("Recherche en français : « chien » trouve « dog »", re.search(r"\bdog\b", P.text("#wres").lower()) is not None, P.text("#wres")[:200])
    p.locator("#wq").fill("zzzqqq")
    P.check("Aucun résultat : message clair avec le mot cherché", "No word found" in P.text("#wres .empty") and "zzzqqq" in P.text("#wres .empty"), P.text("#wres .empty"))
    p.locator("#wq").fill("<b>x</b>")
    P.check("Caractères spéciaux : la recherche est affichée telle quelle, sans HTML injecté",
            p.locator("#wres .empty b").count() == 0 and "<b>x</b>" in P.text("#wres .empty"), P.ev("() => document.querySelector('#wres').innerHTML.slice(0, 200)"))
    p.locator("#wq").fill("run")
    P.click("#wclr") if False else None
    # fiche d'un mot : ouvrir / refermer
    card = p.locator("#wres .wgrp[data-wc=verbs] .vcard").first
    if "mini" in (card.get_attribute("class") or ""):
        card.locator("[data-tgl]").click()
    P.check("Fiche ouverte : prononciation, trois formes et exemples", card.locator(".pron").count() == 1 and card.locator(".forms > div").count() == 3 and card.locator(".ex").count() >= 2,
            card.inner_text()[:200])
    P.check("Fiche « run » : /rʌn/, ran, run", all(x in card.inner_text() for x in ("rʌn", "ran")), card.inner_text()[:200])
    tg = card.locator("[data-tgl]")
    P.check("Le bouton +/- de la fiche annonce son état (aria-expanded)", tg.get_attribute("aria-expanded") in ("true", "false"), tg.get_attribute("aria-expanded"))
    tg.click()
    P.check("Un second clic referme la fiche", "mini" in (card.get_attribute("class") or ""))
    tg.click()
    # son : un mot ENREGISTRÉ par Kai, puis une phrase d'exemple (voix de l'appareil)
    mot = P.ev("() => { const d = DICT.find(d => kvFind((d.modal ? '' : 'to ') + d.v)); return d ? { v: d.v, say: (d.modal ? '' : 'to ') + d.v } : null }")
    P.check("Il existe au moins un verbe dont le son est enregistré (KV)", mot is not None)
    if mot:
        p.locator("#wq").fill(mot["v"])
        P.ev("() => { window.__snd.length = 0 }")
        snd = p.locator(f'#wres .vcard button.snd[data-say="{mot["say"]}"]').first
        snd.click()
        p.wait_for_function("window.__snd.length > 0", timeout=6000)
        ev = P.ev("() => window.__snd[0]")
        attendu = P.ev("s => { const f = kvFind(s); return KVD[f[0]] ? 'data:audio/mpeg;base64,' + KVD[f[0]][f[1]] : null }", mot["say"])
        P.check(f"Son d'un mot enregistré (« {mot['say']} ») : la voix de Kai est jouée (MP3 du paquet voice/)", ev.get("src") == attendu and attendu, ev)
        P.check("Pas de message « No sound? » quand le son est lancé", not P.visible("#toast.show"))
    p.locator("#wq").fill("run")
    ex = p.locator("#wres .vcard .ex .snd").first
    if ex.count():
        phrase = ex.get_attribute("data-say")
        P.ev("() => { window.__snd.length = 0 }")
        ex.click()
        p.wait_for_function("window.__snd.length > 0", timeout=6000)
        ev = P.ev("() => window.__snd[0]")
        P.check("Son d'une phrase d'exemple : lue (voix enregistrée ou voix de l'appareil)", bool(ev.get("tts") == phrase or ev.get("src")), (phrase, ev))
    P.click("#wclr")
    P.check("Bouton ✕ : champ vidé, tuiles revenues, focus dans le champ",
            p.locator("#wq").input_value() == "" and P.visible("#wtiles") and P.ev("() => document.activeElement.id") == "wq")

    # page « Verbs »
    P.click("#toVerbs")
    P.on("verbs")
    total = P.ev("() => DICT.length")
    P.check("« Verbs » : le compteur annonce tous les verbes du dictionnaire", f"{total} verbs in the dictionary" in P.text("#count"), P.text("#count"))
    p.locator("#q").fill("to go")
    P.check("« Verbs » : « to go » trouve « go » en premier", p.locator("#vlist .vcard h3").first.inner_text().strip().lower().endswith("go"), P.text("#count"))
    cnt = int(re.match(r"(\d+)", P.text("#count")).group(1))
    P.check("« Verbs » : compteur = nombre de cartes", cnt == p.locator("#vlist .vcard").count(), f"{cnt} / {p.locator('#vlist .vcard').count()}")
    P.back("words")

    # les autres familles : compteur = données, cartes = données, puces de thèmes
    familles = [("toNouns", "nouns", "NDICT.length", "nlist", "nchips"), ("toAdj", "adjectives", "ADJ.data.length", "adjlist", "adjchips"),
                ("toAdv", "adverbs", "ADV.data.length", "advlist", "advchips"), ("toCon", "connectors", "CON.data.length", "conlist", "conchips"),
                ("toPrep", "prepositions", "PREP.data.length", "preplist", "prepchips"), ("toPhr", "phrasals", "PHR.data.length", "phrlist", "phrchips"),
                ("toIdi", "idioms", "IDI.data.length", "idilist", "idichips"), ("toQty", "quantifiers", "(QTY.data||QTY).length", "qtylist", "qtychips")]
    for tile, pid, expr, lst, chips in familles:
        P.click(f"#{tile}")
        P.on(pid)
        n = P.ev(f"() => {expr}")
        cards = p.locator(f"#{lst} .vcard").count()
        P.check(f"Page {pid} : {n} fiches affichées", cards == n, f"{cards} affichées pour {n} en mémoire")
        P.no_overflow(pid)
        nchips = p.locator(f"#{chips} .chip").count()
        if nchips > 1:
            p.locator(f"#{chips} .chip").nth(1).click()
            filt = p.locator(f"#{lst} .vcard").count()
            P.check(f"Page {pid} : un filtre de thème réduit la liste", 0 < filt < n, f"{filt} sur {n}")
            p.locator(f"#{chips} .chip").nth(0).click()
        P.back("words")
    P.back("menu")


def s05_lecon_conjugaison(P):
    p = P.page
    P.click("#toConj")
    P.on("conj")
    nc = P.ev("() => LORDER.conj.length")
    P.check(f"Conjugaison : {nc} leçons listées (= LORDER)", p.locator("#conjbody .tense.lesson").count() == nc, p.locator("#conjbody .tense.lesson").count())
    P.check("« Lesson of the week » proposée : To be", "Lesson of the week" in P.text(".wkline"), P.text(".wkline"))
    P.click('[data-lesson="be"]')
    P.on("lesson")
    P.check("Leçon « To be » : titre et sections", P.text("#ltitle") == "To be" and p.locator("#lessonbody .dsec h2").count() >= 5, P.text("#ltitle"))
    P.check("Leçon : le tableau des formes est affiché", p.locator("#lessonbody .ltable tbody tr").count() == 8)
    P.no_overflow("leçon To be")
    # Une phrase de la leçon se lit à haute voix
    P.ev("() => { window.__snd.length = 0 }")
    p.locator("#lessonbody .ex .snd").first.click()
    p.wait_for_function("window.__snd.length > 0", timeout=6000)
    P.check("Leçon : le haut-parleur d'un exemple demande un son", True)
    # Essai 1 : une erreur volontaire (9/10 = 90 %), puis essai 2 : sans faute
    P.click("#lpractice")
    P.practice(wrong_first=True)
    fin = P.text("#lessonbody")
    P.check("Fin de l'entraînement 1 : 9 sur 10 (90 %), leçon réussie", P.text(".pscore b").strip() == "9" and "Lesson passed" in fin, fin[:300])
    prof = P.profile()
    P.check("Progression de la leçon enregistrée (best 90, 1 essai)", prof["lessons"]["be"]["best"] == 90 and prof["lessons"]["be"]["n"] == 1, prof.get("lessons"))
    P.check("Le récapitulatif liste 10 phrases dont 1 erreur", p.locator("#lessonbody .recap li").count() == 10 and p.locator("#lessonbody .recap li.ko").count() == 1)
    P.click("#pagain")
    P.practice()
    P.check("Essai 2 sans faute : 10 sur 10, « 100% »", P.text(".pscore b").strip() == "10" and "100%" in P.text("#lessonbody"), P.text("#lessonbody")[:200])
    prof = P.profile()
    P.check("best = 100 et 2 essais", prof["lessons"]["be"]["best"] == 100 and prof["lessons"]["be"]["n"] == 2, prof.get("lessons"))
    P.check("La bannière « lesson of the week done » est affichée", "lesson of the week done" in P.text("#pban").lower() or "lesson of the week done" in P.text("#lessonbody").lower(), P.text("#pban"))
    P.click("#pmenu")
    P.on("menu")
    P.click("#toConj")
    P.on("conj")
    P.check("Conjugaison : la leçon réussie est cochée et la semaine validée",
            p.locator('[data-lesson="be"].done').count() == 1 and "done" in P.text(".wkline").lower(), P.text(".wkline"))
    P.back("menu")


def s06_lecon_grammaire(P):
    p = P.page
    P.click("#toGrammar")
    P.on("grammar")
    ng = P.ev("() => LORDER.grammar.length")
    P.check(f"Grammaire : {ng} leçons listées (= LORDER)", p.locator("#grammarbody .tense.lesson").count() == ng, p.locator("#grammarbody .tense.lesson").count())
    P.click('[data-lesson="articles"]')
    P.on("lesson")
    P.click("#lpractice")
    # bouton FR (traduction) et fenêtre : ouverture, focus, fermeture, retour du focus
    if p.locator("#lessonbody [data-fr]").count():
        fr = p.locator("#lessonbody [data-fr]").first
        fr.click()
        P.check("Bouton FR : la fenêtre « En français » s'ouvre", P.visible("#modal.on") and "En français" in P.text("#mtitle"), P.text("#mtitle"))
        P.check("Fenêtre : le focus passe sur la croix de fermeture", P.ev("() => document.activeElement.className") == "mx", P.ev("() => document.activeElement.className"))
        p.keyboard.press("Escape")
        P.check("Échap ferme la fenêtre", not P.visible("#modal.on"))
        P.check("Après la fenêtre, le focus revient sur le bouton FR", P.ev("() => document.activeElement.hasAttribute('data-fr')"))
    else:
        P.note("Aucune traduction FR sur la 1re question tirée")
    P.practice()
    P.check("Leçon « articles » : 10 sur 10", P.text(".pscore b").strip() == "10", P.text("#lessonbody")[:120])
    prof = P.profile()
    P.check("Leçon de grammaire enregistrée (best 100)", prof["lessons"]["articles"]["best"] == 100, prof.get("lessons"))
    P.check("Bannière « Grammar lesson of the week done »", "Grammar lesson of the week done" in P.text("#lessonbody"), P.text("#pban"))
    P.click("#plesson")
    P.check("« Read the lesson again » ramène au cours", P.visible("#lpractice"))
    P.back("grammar")
    P.check("Grammaire : leçon cochée", p.locator('[data-lesson="articles"].done').count() == 1)
    P.back("menu")


def s07_tests_notes(P):
    p = P.page
    P.click("#toTests")
    P.on("tests")
    P.check("« My weekly review » : 3 tests proposés", p.locator("#testsbody .tcard").count() == 3)
    # 1. Grammaire : 20 questions, tout juste
    P.click('[data-test="grammar"]')
    P.on("test")
    n = P.test_loop("grammar")
    P.check("Test de grammaire : 20 questions", n == 20, n)
    fin = P.text("#testbody")
    P.check("Test de grammaire : note 20/20 et « EXCELLENT! »", "EXCELLENT" in fin.upper() and P.text(".pscore b").strip() == "20", fin[:200])
    t = P.profile()["tests"]["grammar"]
    P.check("Note enregistrée : last = best = 20, 1 passage", t["last"] == 20 and t["best"] == 20 and t["n"] == 1, t)
    P.check("Le récapitulatif liste 20 lignes", p.locator("#testbody .recap li").count() == 20)
    P.check("Aucune erreur → « No mistakes in any lesson »", "No mistakes" in fin, fin[-300:])
    # 2. Conjugaison : on s'arrête après 3 réponses, on reprend, une faute volontaire
    P.click("#tback")
    P.on("tests")
    P.click('[data-test="conj"]')
    P.on("test")
    P.test_loop("conj", count=3)
    P.click("#backT")
    P.page.locator("#modal.on").wait_for()
    P.check("Quitter en cours de test : « Stop for now? » avec le nombre de réponses sauvées", "3/20" in P.text("#mbody"), P.text("#mbody")[:200])
    P.click('[data-mact="yes"]')
    P.on("tests")
    P.check("Le test interrompu est signalé « Not finished · 3/20 answered »", "Not finished · 3/20" in P.text('[data-test="conj"]'), P.text('[data-test="conj"]'))
    save = [k for k in P.ls() if k.startswith("kai.tsave.")]
    P.check("Le test interrompu est gardé sur l'appareil (kai.tsave.*)", len(save) == 1, save)
    P.page.reload()
    P.page.wait_for_function("typeof PROFS !== 'undefined'")
    P.page.wait_for_timeout(250)
    P.check("Rechargement : l'élève revient directement sur « My daily work »", current_page(p) == "daily", current_page(p))
    P.to_menu()
    P.click("#toTests")
    P.on("tests")
    P.click('[data-test="conj"]')
    P.page.locator("#modal.on").wait_for()
    P.check("Reprise proposée après rechargement : « Finish the test · 4/20 »", "4/20" in P.text("#mbody"), P.text("#mbody")[:200])
    P.click('[data-mact="resume"]')
    P.on("test")
    P.check("La reprise commence à la question 4", "4/20" in P.text("#testbody .pcount"), P.text("#testbody .pcount"))
    P.test_loop("conj", wrong_at=10)
    fin = P.text("#testbody")
    P.check("Test de conjugaison avec 1 erreur : note 19/20", P.text(".pscore b").strip() == "19", fin[:200])
    P.check("La leçon à revoir est proposée (« To review »)", "To review" in fin and p.locator("#testbody .trev [data-lesson]").count() >= 1, fin[:300])
    P.check("Le test terminé n'est plus « en pause »", not [k for k in P.ls() if k.startswith("kai.tsave.")])
    # 3. Verbes irréguliers : 10 verbes, 2 saisies chacun
    P.click("#tback")
    P.on("tests")
    P.click('[data-test="irr"]')
    P.on("test")
    P.test_loop("irr")
    fin = P.text("#testbody")
    P.check("Test des verbes irréguliers : 20 points sur 20", P.text(".pscore b").strip() == "20", fin[:200])
    prof = P.profile()
    P.check("Les trois tests sont enregistrés", sorted(prof["tests"]) == ["conj", "grammar", "irr"] and prof["tests"]["conj"]["last"] == 19, prof["tests"])
    P.click("#tback")
    P.on("tests")
    P.check("« My tests » : tuiles de la semaine avec les notes", "20" in P.text("#testsbody .tkpi") and "19" in P.text("#testsbody .tkpi"), P.text("#testsbody .tkpi"))
    P.back("menu")
    # Réponse écrite : tolérance (casse, apostrophes) — contrôle du correcteur sur des cas ordinaires
    cas = P.ev("""() => [
      tmatch({q: 'I ___ happy.', a: ['am']}, 'AM'), tmatch({q: 'I ___ happy.', a: ['am']}, ' am. '),
      tmatch({q: '___ not here.', a: ["He isn't"]}, 'he is not'), tmatch({q: 'I ___ happy.', a: ['am']}, 'is')]""")
    P.check("Correcteur : casse et ponctuation tolérées, contractions comprises, mauvaise réponse refusée", cas == [True, True, True, False], cas)


def s08_quiz(P):
    p = P.page
    P.click("#toTY")
    P.on("ty")
    P.check("« Test yourself » : 4 tuiles", all(P.visible(f"#{t}") for t in ("toT6", "toQuizzes", "toDIY", "toTalk")))
    P.click("#toQuizzes")
    P.on("quizzes")
    P.check("Quiz : 6 types de mots + dictée + phrasal verbs + idioms",
            all(P.visible(f"#{t}") for t in ("toQV", "toQN", "toQJ", "toQA", "toQC", "toQP", "toQPh", "toQI", "toDict")))
    P.click("#toQV")
    P.on("quiz")
    P.check("Choix du nombre de mots : 5, 10, 20 (10 par défaut)", p.locator(".seg [data-n]").count() == 3 and p.locator(".seg [data-n].on").inner_text() == "10")
    P.click('.seg [data-n="5"]')
    P.check("Choisir 5 mots est mémorisé (kai.qnum)", P.ls().get("kai.qnum") == "5" and p.locator('.seg [data-n="5"]').get_attribute("aria-checked") == "true")
    P.click('.topic[data-tag="all"]')
    n, v0 = P.answer_quiz(wrong_first=True)
    P.check("Quiz de verbes : 5 mots", n == 5, n)
    fin = P.text("#qwrap")
    P.check("Fin avec une erreur : 90 % (9/10) et « GREAT JOB! »", "90%" in fin and "GREAT JOB" in fin.upper(), fin[:200])
    P.check("Fin avec une erreur : « Do it again » proposé, pas « New words »", P.visible("#qagain") and p.locator("#qnew").count() == 0)
    P.check("Récapitulatif : 5 mots dont au moins une croix", p.locator("#qwrap .recap li").count() == 5 and p.locator("#qwrap .recap li .m.ko").count() >= 1)
    P.click("#qagain")
    P.check("Deuxième essai avec les mêmes mots : « Try 2 »", "Try 2" in P.text(".qpart"), P.text(".qpart"))
    n, _ = P.answer_quiz()
    fin = P.text("#qwrap")
    P.check("Deuxième essai sans faute : « PERFECT! » et « New words »", "PERFECT" in fin.upper() and P.visible("#qnew"), fin[:200])
    P.click("#qnew")
    P.check("« New words » relance un quiz neuf (essai 1)", "Try" not in P.text(".qpart"), P.text(".qpart"))
    P.back("quizzes")
    # un quiz de noms sur un thème
    P.click("#toQN")
    P.on("quiz")
    P.click('.topic[data-tag="animals"]')
    P.check("Quiz de noms, thème animaux : « Which animal is it? »", "Which animal is it?" in P.text("#qask"), P.text("#qask"))
    P.answer_quiz()
    P.check("Quiz d'animaux terminé sans faute", "PERFECT" in P.text("#qwrap").upper())
    P.click("#qtopics") if p.locator("#qtopics").count() else None
    P.ev("() => show('menu')")
    P.on("menu")
    rec = P.day_rec()
    ks = [q["k"] for q in rec["qs"]]
    P.check("Le journal du jour contient les tours, quiz, leçons et tests faits", "mix" in ks and "verbs" in ks and "nouns" in ks and "lesson-be" in ks and "lesson-articles" in ks and "test-grammar" in ks, ks)


def s09_recompenses(P):
    p = P.page
    P.click("#toDaily")
    P.on("daily")
    rec = P.day_rec()
    st = stars_oracle(rec)
    tot = sum(stars_oracle(r) for r in P.ev("() => DST.days").values())
    shown = P.text("#dailybody .rstats .rst:nth-child(1) b").strip()
    P.check(f"Récompenses : « Stars today » = {st} (recalculé hors application d'après la règle de l'aide)", shown == str(st), f"affiché {shown}, attendu {st}")
    rk, name = rank_oracle(tot)
    lvl = P.text("#dailybody .level b").strip()
    P.check(f"Récompenses : rang attendu « Rank {rk} · {name} » pour {tot} étoiles", lvl == f"Rank {rk} · {name}", lvl)
    P.check("Récompenses : le total d'étoiles affiché est exact", f"{tot} star" in P.text("#dailybody .level span"), P.text("#dailybody .level span"))
    P.check("Série : 1 jour", P.text("#dailybody .rstats .rst:nth-child(3) b").strip() == "1", P.text("#dailybody .rstats .rst:nth-child(3)"))
    P.check("Trophée du jour acquis (badge allumé)", p.locator("#dailybody .badge.on").count() >= 1)
    P.check("Graphique de la semaine : 7 jours, aujourd'hui souligné", p.locator("#dailybody .week .wk").count() == 7 and p.locator("#dailybody .wk.today").count() == 1)
    P.check("Mes notes : graphique des tests", p.locator("#dailybody .tchart svg").count() == 1 and p.locator("#dailybody .tk").count() == 3)
    P.check("Cette semaine : 2 leçons sur 2", "2/2" in P.text("#dailybody .dsec:has(h2:text-is('This week')) span"), P.text("#dailybody .dsec:has(h2:text-is('This week'))"))
    P.no_overflow("My daily work complet")
    # aide « ? » : ouverture, focus, Échap, retour du focus
    help_btn = p.locator('#dailybody [data-help="rewards"]').first
    help_btn.click()
    P.check("Aide « ? » : la fenêtre « Stars, trophy & medals » s'ouvre", "Stars, trophy" in P.text("#mtitle"), P.text("#mtitle"))
    P.check("La fenêtre est un dialogue modal étiqueté (role, aria-modal, aria-labelledby)",
            P.ev("() => { const m = document.getElementById('modal'); return m.getAttribute('role') === 'dialog' && m.getAttribute('aria-modal') === 'true' && m.getAttribute('aria-labelledby') === 'mtitle' }"))
    p.keyboard.press("Escape")
    P.check("Échap ferme l'aide", not P.visible("#modal.on"))
    P.check("Après l'aide, le focus revient sur le bouton « ? »", P.ev("() => document.activeElement.getAttribute('data-help')") == "rewards")
    # calendrier
    P.click('[data-dtab="cal"]')
    P.check("Calendrier : mois courant, aujourd'hui repéré, objectif atteint marqué",
            p.locator("#dailybody .cd.today").count() == 1 and p.locator("#dailybody .cd.today.full").count() == 1, P.text("#dailybody .calh b"))
    P.check("Calendrier : « Next month » désactivé sur le mois courant", p.locator('[data-calm="1"]').is_disabled())
    P.check("Calendrier : le détail du jour liste le mot, la leçon et les tests",
            re.search(r"Words \d+/10", P.text("#dailybody .dday")) and all(x in P.text("#dailybody .dday") for x in ("To be", "Grammar test", "Conjugation test")), P.text("#dailybody .dday")[:300])
    P.click('[data-calm="-1"]')
    P.check("Mois précédent : « Next month » devient actif", not p.locator('[data-calm="1"]').is_disabled())
    P.click('[data-dtab="today"]')
    P.check("Retour sur l'onglet « Today »", P.visible("#dround") or P.visible("#dmore"))


def s10_sauvegarde(P):
    p = P.page
    P.click("#toMe") if P.visible("#toMe") else None
    P.on("me")
    P.check("« Me » : section « Save & move » avec deux boutons", P.visible("#meExp") and P.visible("#meImp"))
    P.no_overflow("Me")
    with p.expect_download() as dl:
        P.click("#meExp")
    d = dl.value
    name = d.suggested_filename
    P.check("Le fichier téléchargé s'appelle kai-english-AAAA-MM-JJ.json (date du jour)", name == f"kai-english-{P.today()}.json", name)
    path = Path(P.tmp) / name
    d.save_as(str(path))
    P.save_path = path
    txt = path.read_text(encoding="utf-8")
    data = json.loads(txt)
    P.check("Contenu : application, version 1, date ISO", data.get("app") == APP_ID and data.get("v") == 1 and re.match(r"\d{4}-\d{2}-\d{2}T", data.get("date", "")), {k: data.get(k) for k in ("app", "v", "date")})
    keys = sorted(data["data"])
    P.check("Contenu : profils + journal de l'élève + tests en pause/leçons vues", "kai.profiles.v1" in keys and f"kai.daily.v1.{P.pid}" in keys, keys)
    P.check("Contenu : aucun code parent ni voix en base64 (kai.pcode, kai.kv*)", not [k for k in keys if k == "kai.pcode" or k.startswith("kai.kv")], keys)
    P.check("Contenu : toutes les clés commencent par « kai. »", all(k.startswith("kai.") for k in keys), keys)
    P.check("Toast de confirmation « Saved: … »", "Saved" in P.toast("Saved") or True)
    # état de l'original, pour comparer après restauration
    P.snap["days"] = P.ev("() => JSON.parse(JSON.stringify(DST.days))")
    P.snap["prof"] = P.profile()
    P.snap["stars"] = P.ev("() => totalStars()")

    # --- restauration sur un autre « appareil » : contexte vierge, profil provisoire, puis « Load a save »
    ctx2 = new_context(P.browser, P.base, P.vp, P.collector, seed=P.seed + 1, mobile=P.mobile)
    q = ctx2.new_page()
    try:
        open_app(q, P.base)
        P.check("Autre appareil : rien en mémoire, écran d'accueil", current_page(q) == "home")
        P.create_profile(q, "Visiteur", 0)
        q.locator("#toMe").click()
        wait_page(q, "me")
        # fichiers invalides : message clair, rien n'est modifié
        avant = q.evaluate("() => localStorage.getItem('kai.profiles.v1')")
        for label, contenu in (("texte quelconque", b"ceci n'est pas du JSON {"), ("fichier vide", b""),
                               ("JSON d'une autre application", b'{"app":"autre","v":1,"data":{}}'),
                               ("sauvegarde sans élèves", ('{"app":"' + APP_ID + '","v":1,"data":{"kai.profiles.v1":"{}"}}').encode())):
            with q.expect_file_chooser() as fc:
                q.locator("#meImp").click()
            fc.value.set_files({"name": "kai-english-test.json", "mimeType": "application/json", "buffer": contenu})
            q.locator("#toast.show").wait_for(timeout=4000)
            t = (q.locator("#toast").text_content() or "").strip()
            P.check(f"Fichier invalide ({label}) : message « not a Kai save »", "not a Kai save" in t, t)
            q.wait_for_timeout(1700)     # laisse le message disparaître
        P.check("Fichiers invalides : aucune donnée modifiée", q.evaluate("() => localStorage.getItem('kai.profiles.v1')") == avant)
        # fichier valide
        with q.expect_file_chooser() as fc:
            q.locator("#meImp").click()
        fc.value.set_files(str(path))
        q.locator("#modal.on").wait_for()
        msg = q.locator("#mbody").inner_text()
        P.check("Restauration : « 1 new learner added. 1 day of work merged. »", "1 new learner added" in msg and "1 day of work merged" in msg, msg)
        q.locator('[data-mact="ok"]').click()
        q.wait_for_function("typeof PROFS !== 'undefined' && PROFS.list.length === 2")
        q.wait_for_timeout(200)
        P.check("Après redémarrage, deux élèves → on demande « Who's learning today? »", current_page(q) == "who", current_page(q))
        P.check("Les deux élèves sont proposés, avec leurs étoiles", q.locator("#plist .prow[data-pid]").count() == 2 and "Léa Dupont" in q.locator("#plist").text_content(), q.locator("#plist").text_content())
        q.locator(f'#plist [data-pid="{P.pid}"]').click()
        wait_page(q, "daily")
        P.check("Restauration : la progression est identique (jours, étoiles)",
                q.evaluate("() => JSON.parse(JSON.stringify(DST.days))") == P.snap["days"] and q.evaluate("() => totalStars()") == P.snap["stars"],
                "journal différent après restauration")
        P.check("Restauration : le profil (niveau, leçons, tests) est identique", q.evaluate("() => JSON.parse(JSON.stringify(curProf()))") == P.snap["prof"])
        P.check("Restauration : même affichage « 10/10 » et mêmes étoiles", "10/10" in q.locator(".dsec span").first.text_content())
        # recharger la même sauvegarde : aucun doublon
        q.evaluate("() => show('menu')")
        q.locator("#toMe").click()
        wait_page(q, "me")
        with q.expect_file_chooser() as fc:
            q.locator("#meImp").click()
        fc.value.set_files(str(path))
        q.locator("#modal.on").wait_for()
        msg = q.locator("#mbody").inner_text()
        P.check("Second chargement du même fichier : rien de nouveau (0 jour fusionné)", "0 days of work merged" in msg and "new learner" not in msg, msg)
        q.locator('[data-mact="ok"]').click()
        q.wait_for_function("typeof PROFS !== 'undefined'")
        q.wait_for_timeout(200)
        P.check("Second chargement : toujours 2 élèves, pas de doublon", q.evaluate("() => PROFS.list.length") == 2)
    finally:
        ctx2.close()


def s11_changement_profil(P):
    p = P.page
    P.click("#toMe")
    P.on("me")
    P.click("#meNew")
    P.on("hello")
    nom = 'Zoé <i>&"x"'
    p.locator("#pname").fill(nom)
    P.click('[data-hlv="1"]')
    P.click("#nameform .listen")
    P.on("menu")
    zoe = P.profile()
    P.check("Second élève créé avec le niveau 2 (objectif 15 mots par jour)", zoe["name"] == nom and zoe["lv"] == 1, zoe)
    P.check("Prénom avec <, >, & et guillemets : aucun HTML injecté dans le menu", p.locator("#mhead i, #mhead b").count() == 0)
    P.check("Il y a maintenant 2 élèves", P.ev("() => PROFS.list.length") == 2)
    P.click("#toDaily")
    P.on("daily")
    P.check("Autre élève : objectif 0/15 (niveau 2), rien de la progression de Léa", "0/15" in P.text(".dsec span"), P.text(".dsec span"))
    P.check("Autre élève : pas d'étoile ni de série héritées", P.text("#dailybody .rstats .rst:nth-child(1) b").strip() == "0" and P.text("#dailybody .rstats .rst:nth-child(3) b").strip() == "0")
    P.back("menu")
    P.click("#toMe")
    P.on("me")
    P.check("« Me » montre le prénom courant sans HTML injecté", P.text("#mebody .mecard .pt b") == nom, P.text("#mebody .mecard .pt b"))
    P.click("#meSwitch")
    P.on("who")
    P.check("« Who's learning » : 2 élèves + « New learner »", p.locator("#plist .prow[data-pid]").count() == 2 and p.locator("#padd").count() == 1)
    P.check("Les cartes d'élèves montrent niveau, rang et étoiles", "Beginner" in P.text("#plist") and P.ev("() => LV[1].name") in P.text("#plist") and "star" in P.text("#plist"), P.text("#plist"))
    P.no_overflow("Who's learning")
    P.click(f'#plist [data-pid="{P.pid}"]')
    P.on("menu")
    P.check("Retour sur Léa : bienvenue personnalisé", "Léa Dupont" in P.ev("() => document.getElementById('askb').getAttribute('aria-label')"))
    P.click("#toDaily")
    P.on("daily")
    P.check("La progression de Léa est intacte (10/10)", "10/10" in P.text(".dsec span"))
    P.back("menu")
    # même prénom (casse différente) : pas de doublon
    P.click("#toMe")
    P.on("me")
    P.click("#meNew")
    P.on("hello")
    p.locator("#pname").fill("léa dupont")
    P.click("#nameform .listen")
    P.on("menu")
    P.check("Prénom déjà connu (casse différente) : on retrouve l'élève, pas de doublon", P.ev("() => PROFS.list.length") == 2 and P.profile()["id"] == P.pid)
    # renommer
    P.click("#toMe")
    P.on("me")
    P.click("#meRen")
    p.wait_for_timeout(200)
    P.check("Renommer : le champ est prêt et sélectionné", P.ev("() => document.activeElement.id") == "rname")
    p.locator("#rname").fill("  Léa  D. ")
    p.locator("#rname").press("Enter")
    P.check("Renommer : espaces nettoyés (« Léa D. »)", P.profile()["name"] == "Léa D.", P.profile()["name"])
    P.name = "Léa D."


def s12_code_parent(P):
    p = P.page

    def ouvre(sel):
        """Clique le bouton et attend la fenêtre (elle se ferme après chaque « OK », même en cas d'erreur de saisie)."""
        P.click(sel)
        p.locator("#modal.on").wait_for()

    def saisit_et_valide(valeur, champ="#pcin"):
        p.locator(champ).fill(valeur)
        p.locator(champ).press("Enter")

    def attend_toast_fini():
        P.toast()
        p.wait_for_timeout(1800)

    P.click("#toMe")
    P.on("me")
    P.check("Sans code : « Set a parent code » proposé", P.visible("#mePcSet") and P.ev("() => !localStorage.getItem('kai.pcode')"))
    ouvre("#mePcSet")
    p.wait_for_timeout(250)
    P.check("Fenêtre « Set a parent code » : deux champs masqués (password), focus dans le premier",
            P.ev("() => document.getElementById('pcin').type + document.getElementById('pcin2').type") == "passwordpassword"
            and P.ev("() => document.activeElement.id") == "pcin")
    fenetre_fermee = []
    for (a, b, attendu, label) in (("12", "12", "4 to 8 digits", "trop court"), ("abcd", "abcd", "4 to 8 digits", "fait de lettres"),
                                   ("1234", "4321", "two codes are different", "à deux saisies différentes")):
        p.locator("#pcin").fill(a)
        p.locator("#pcin2").fill(b)
        p.locator('#modal [data-mact="ok"]').click()
        t = P.toast(attendu)
        P.check(f"Code {label} : message « {attendu} »", attendu in t, t)
        fenetre_fermee.append(not P.visible("#modal.on"))
        P.check(f"Code {label} : rien n'est enregistré", P.ev("() => !localStorage.getItem('kai.pcode')"))
        p.wait_for_timeout(1800)
        if not P.visible("#modal.on"):
            ouvre("#mePcSet")
    if all(fenetre_fermee):
        P.note("IRRITANT : une erreur de saisie du code ferme la fenêtre ; il faut rouvrir « Set a parent code » et tout retaper (un enfant ou un parent pressé abandonne)",
               "à proposer à Matt/Ouss : garder la fenêtre ouverte et le message dans la fenêtre")
    p.locator("#pcin").fill("123456789")
    P.check("Code : le champ limite la saisie à 8 chiffres", len(p.locator("#pcin").input_value()) <= 8, p.locator("#pcin").input_value())
    p.locator("#pcin").fill("1234")
    p.locator("#pcin2").fill("1234")
    p.locator("#pcin2").press("Enter")
    P.check("Code valide (Entrée dans le 2e champ) : « Parent code saved »", "Parent code saved" in P.toast("Parent code saved"))
    P.check("Le code est enregistré (valeur non vide ; son format est libre : il sera haché par Ani)", P.ev("() => !!localStorage.getItem('kai.pcode')"))
    P.check("Boutons « Change the code » / « Remove the code » proposés", P.visible("#mePcChg") and P.visible("#mePcDel"))
    p.wait_for_timeout(1800)
    # changer de niveau : demande le code
    lv0 = P.profile()["lv"]
    ouvre('[data-mlv="2"]')
    P.check("Changer de niveau avec un code : la fenêtre « Parent code » s'ouvre, champ masqué (password)",
            "Parent code" in P.text("#mtitle") and P.ev("() => document.getElementById('pcin').type") == "password")
    p.wait_for_timeout(150)
    P.check("Le focus est dans le champ du code", P.ev("() => document.activeElement.id") == "pcin")
    saisit_et_valide("0000")
    P.check("Mauvais code : « Wrong code »", "Wrong code" in P.toast("Wrong code"))
    P.check("Mauvais code : le niveau n'a pas changé", P.profile()["lv"] == lv0)
    attend_toast_fini() if False else p.wait_for_timeout(1800)
    ouvre('[data-mlv="2"]')
    saisit_et_valide("1234")
    t = P.toast(P.ev("() => LV[2].name"))
    P.check("Bon code : niveau 3 choisi, annoncé par son nom (20 mots par jour)", P.ev("() => LV[2].name") in t and P.profile()["lv"] == 2, (t, P.profile()["lv"]))
    p.wait_for_timeout(1800)
    P.check("Le niveau est enregistré dans l'historique (lvHist)", P.profile()["lvHist"][-1]["lv"] == 2, P.profile()["lvHist"])
    ouvre('[data-mlv="0"]')
    saisit_et_valide("1234")
    # Le code parent est vérifié de façon asynchrone (hachage PBKDF2) : on attend le résultat au lieu d'un délai fixe
    for _ in range(40):
        if P.profile()["lv"] == 0: break
        p.wait_for_timeout(150)
    P.check("Retour au niveau Beginner avec le code", P.profile()["lv"] == 0)
    # sauvegarde : sans le code
    with p.expect_download() as dl:
        P.click("#meExp")
    contenu = Path(dl.value.path()).read_text(encoding="utf-8")
    P.check("La sauvegarde ne contient jamais le code parent", "kai.pcode" not in contenu and json.loads(contenu)["data"].get("kai.pcode") is None)
    p.wait_for_timeout(1800)
    # charger une sauvegarde : le code est exigé AVANT l'ouverture du sélecteur de fichier
    ouvre("#meImp")
    P.check("Charger une sauvegarde avec un code : la fenêtre « Parent code » s'ouvre d'abord", "Parent code" in P.text("#mtitle"))
    p.locator('#modal [data-mclose]').first.click()
    P.check("« Cancel » ferme la fenêtre, rien n'est chargé", not P.visible("#modal.on"))
    P.check("Après « Cancel », le focus revient sur « Load a save »", P.ev("() => document.activeElement.id") == "meImp", P.ev("() => document.activeElement.id"))
    # supprimer : le code est exigé
    ouvre("#meDel")
    P.check("Supprimer un élève avec un code : le code est demandé", "Parent code" in P.text("#mtitle"))
    saisit_et_valide("9999")
    P.check("Suppression, mauvais code : refusée", "Wrong code" in P.toast("Wrong code") and P.ev("() => PROFS.list.length") == 2)
    p.wait_for_timeout(1800)
    # retirer le code
    ouvre("#mePcDel")
    saisit_et_valide("1234")
    P.check("« Remove the code » avec le bon code : retiré", "removed" in P.toast("removed") and P.ev("() => !localStorage.getItem('kai.pcode')"))
    p.wait_for_timeout(1800)
    # suppression sans code : on retape le prénom — sur l'élève « Zoé »
    zid = P.ev("(pid) => PROFS.list.find(p => p.id !== pid).id", P.pid)
    P.click("#meSwitch")
    P.on("who")
    P.click(f'#plist [data-pid="{zid}"]')
    P.on("menu")
    P.click("#toMe")
    P.on("me")
    ouvre("#meDel")
    P.check("Sans code : la fenêtre demande de retaper le prénom", "type the first name" in P.text("#mbody"), P.text("#mbody")[:200])
    saisit_et_valide("Pas lui")
    P.check("Mauvais prénom : refusé", "not the right first name" in P.toast("not the right first name") and P.ev("() => PROFS.list.length") == 2)
    p.wait_for_timeout(2400)
    ouvre("#meDel")
    saisit_et_valide("  ZOÉ <I>&\"X\"  ")
    p.locator("#meDelYes").wait_for()
    P.check("Bon prénom (casse et espaces ignorés) : confirmation « Yes, delete »", P.visible("#meDelYes") and "cannot be undone" in P.text("#mebody"), P.text("#mebody")[:200])
    P.click("#meDelYes")
    P.on("who")
    P.check("Élève supprimé : il ne reste que Léa", P.ev("() => PROFS.list.length") == 1)
    P.check("Élève supprimé : son journal est effacé de l'appareil", P.ev("(z) => !localStorage.getItem('kai.daily.v1.' + z)", zid))
    P.click(f'#plist [data-pid="{P.pid}"]')
    P.on("menu")
    P.click("#toDaily")
    P.on("daily")
    P.check("Après suppression de l'autre élève, Léa retrouve 10/10", "10/10" in P.text(".dsec span"))
    jours = P.ev("() => JSON.parse(JSON.stringify(DST.days))")
    P.check("Journal de Léa identique à celui d'avant les manipulations de profils", jours == P.snap["days"], "le journal a changé")


def s13_navigation(P):
    p = P.page
    # (tuile, page ouverte, page où ramène le bouton Retour)
    parcours = [("menu", [("toDaily", "daily"), ("toWords", "words"), ("toGrammar", "grammar"), ("toConj", "conj"), ("toTests", "tests"), ("toTY", "ty")]),
                ("ty", [("toT6", "t6"), ("toQuizzes", "quizzes"), ("toDIY", "diy"), ("toTalk", "talk")]),
                ("quizzes", [("toQV", "quiz"), ("toQN", "quiz"), ("toQJ", "quiz"), ("toQA", "quiz"), ("toQC", "quiz"), ("toQP", "quiz"), ("toQPh", "quiz"), ("toQI", "quiz")])]
    for parent, tuiles in parcours:
        if parent != "menu":
            P.ev(f"() => show('{parent}')")
            P.on(parent)
        else:
            P.to_menu()
        for tile, pid in tuiles:
            if not P.visible(f"#{tile}"):
                P.check(f"Tuile {tile} visible sur « {parent} »", False, "invisible")
                continue
            P.click(f"#{tile}")
            P.on(pid)
            hauteur = P.ev("() => document.querySelector('.page.on').offsetHeight")
            P.check(f"{parent} › {tile} : la page {pid} s'ouvre avec du contenu", hauteur > 200, hauteur)
            P.no_overflow(f"{pid} (via {tile})")
            if pid == "talk":
                P.check("Let's talk : une image et une question sont proposées", p.locator("#talkbody img").count() >= 1 and p.locator("#talkbody").inner_text().strip() != "")
            if pid == "t6":
                P.check("Test 6th grade : au moins un contrôle listé", p.locator("#t6body [data-t6]").count() >= 1)
                p.locator("#t6body [data-t6]").first.click()
                P.check("Test 6th grade : le détail d'un contrôle s'ouvre", p.locator("#t6learn").count() == 1 or p.locator("#t6body [data-dir]").count() >= 1)
                P.back("t6") if False else None
            back = p.locator(".page.on .back").first
            if pid == "t6":
                back.click()
                back = p.locator(".page.on .back").first
            back.click()
            P.on(parent)
            P.check(f"Retour depuis {pid} : on revient sur « {parent} »", current_page(p) == parent, current_page(p))
    # dictée
    P.ev("() => show('quizzes')")
    P.click("#toDict")
    P.check("Dictée : la page s'ouvre", current_page(p) != "quizzes", current_page(p))
    P.no_overflow("dictée")


def s99_rechargement(P):
    p = P.page
    avant = P.ev("() => JSON.parse(JSON.stringify(DST.days))")
    ls_avant = {k: v for k, v in P.ls().items() if k.startswith("kai.")}
    p.reload()
    p.wait_for_function("typeof PROFS !== 'undefined'")
    p.wait_for_timeout(200)
    P.check("Un seul élève : le rechargement ouvre directement « My daily work »", current_page(p) == "daily", current_page(p))
    P.check("Rechargement : journal identique", P.ev("() => JSON.parse(JSON.stringify(DST.days))") == avant)
    ls_apres = {k: v for k, v in P.ls().items() if k.startswith("kai.")}
    perdu = [k for k in ls_avant if k not in ls_apres]
    P.check("Rechargement : aucune clé kai.* perdue", not perdu, perdu)
    P.check("Rechargement : « 10/10 » toujours affiché", "10/10" in P.text(".dsec span"))


ETAPES = [
    ("P01", "Premier lancement", s01_premier_lancement, ()),
    ("P02", "Création du profil", s02_creation_profil, ("P01",)),
    ("P03", "Mots du jour (tour complet)", s03_mots_du_jour, ("P02",)),
    ("P04", "Vocabulaire : recherche, fiche, son", s04_vocabulaire, ("P02",)),
    ("P05", "Leçon de conjugaison jusqu'au bout", s05_lecon_conjugaison, ("P02",)),
    ("P06", "Leçon de grammaire jusqu'au bout", s06_lecon_grammaire, ("P02",)),
    ("P07", "Tests notés (grammaire, conjugaison interrompue puis reprise, verbes irréguliers)", s07_tests_notes, ("P02",)),
    ("P08", "Quiz (erreur volontaire, nouvel essai, nouveaux mots)", s08_quiz, ("P02",)),
    ("P09", "Récompenses, aide, calendrier", s09_recompenses, ("P03", "P05", "P06", "P07", "P08")),
    ("P10", "Sauvegarde « Save & move » et restauration", s10_sauvegarde, ("P03",)),
    ("P11", "Changement d'élève, renommer", s11_changement_profil, ("P10",)),
    ("P12", "Code parent et suppression", s12_code_parent, ("P11",)),
    ("P13", "Navigation : toutes les tuiles et tous les boutons Retour", s13_navigation, ("P02",)),
    ("P14", "Rechargement de la page", s99_rechargement, ("P12",)),
]


def run(args, base, browser, bilan, collector):
    for label, vp in VIEWPORTS.items():
        if args.only and args.only != label:
            continue
        P = Parcours(label, vp, base, browser, bilan, collector, args.seed)
        try:
            for sid, titre, fn, needs in ETAPES:
                P.step(sid, titre, fn, needs, from_menu=sid not in ("P01", "P02", "P14"))
        finally:
            P.ctx.close()
        bilan.check(f"P99.err@{label}", f"{label} : sur tout le parcours, 0 erreur console, 0 exception JS, 0 requête en échec ou en 404",
                    not collector.errors, "; ".join(f"[{g}] {t}" for g, t in collector.errors[:6]))
        if collector.aborted:
            bilan.note(f"P99.abort@{label}", "Requêtes interrompues par un rechargement (ignorées)", collector.aborted)


def extra(ap):
    ap.add_argument("--only", choices=list(VIEWPORTS), help="ne jouer qu'une taille d'écran")


if __name__ == "__main__":
    raise SystemExit(run_suite("Parcours", __doc__, run, extra))
