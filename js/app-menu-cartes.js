/* Menu, nouvelle mouture (PO, 11/11) : le haut du menu devient un carrousel de 3 cartes qu'on fait glisser.
   1. Kai parle (bulle de renderMenuHead, sans la carte de rang : demande du PO) ;
   2. Today : les tâches du jour au format de My work (mots maîtrisés / objectif, étoiles, quiz bonus, série) ;
   3. This week : leçons de la semaine (grammaire, conjugaison), tests de My weekly review, étoiles de la semaine.
   Le glissement est natif (scroll-snap) ; les points suivent le défilement et permettent de sauter à une carte.
   En dessous, des « apps » 3 par ligne (PO 11/11) : Dictionary, Grammar, Conjugation, My activity, Test yourself,
   Weekly review ; mcApps() pose une pastille d'avancement sur l'icône (mots du jour, leçon de la semaine, tests).
   Script classique, chargé après app-daily.js, app-tests.js et app-v54-v62.js (il en réutilise les fonctions). */
"use strict";
function mcToday() {
    const p = curProf(), box = document.getElementById("mday");
    if (!box || !p)
        return;
    const k = todayKey(), r = DST.days[k], n = (r && r.n) || target(), m = Math.min(masteredOf(r), n), done = dayDone(r), size = roundSize();
    box.innerHTML = `<div class="mch"><span class="mct">Today</span><span class="mcd">${esc(longDate(k))}</span></div>
<div class="mcmid"><div class="mcw"><b>${m}</b><span>/ ${n} words mastered</span>${done ? CHECK : ""}</div><div class="pbar"><i style="width:${Math.round(100 * m / n)}%"></i></div>
<p class="mctxt">${done ? "Goal reached! Every extra round gives bonus stars." : `Rounds of ${size} words from every theme: nouns, verbs, adjectives, prepositions… Words you missed come back later.`}</p>
<button class="mcgo" type="button" id="mcround">${done ? "Bonus round" : m ? "Next words" : "Start"} · ${size} words${GOSVG}</button></div>
<div class="rstats sm mrs"><div class="rst"><b>${STAR}${starsOf(r)}</b><i>Stars today</i></div><div class="rst"><b>${BOLT}${bonusOf(r)}</b><i>Bonus quizzes</i></div><div class="rst"><b>${FLAME}${streak()}</b><i>Day streak</i></div></div>`;
}
function mcWeek() {
    const p = curProf(), box = document.getElementById("mweek");
    if (!box || !p)
        return;
    const t = todayKey(), days = weekKeys(t), left = days.length - 1 - days.indexOf(t), st = days.reduce((s, k) => s + starsOf(DST.days[k]), 0);
    const W = testWeeks(1), N = Object.keys(TESTS).length, nt = Object.keys(TESTS).filter(k => W.tab[k][0]).length;
    const row = (attr, ok, name, sub, right) => `<button class="mrow${ok ? " ok" : ""}" type="button" ${attr}><span class="mtick">${ok ? "✓" : ""}</span><span class="mtx"><b>${name}</b><small>${sub}</small></span><em>${right}</em></button>`;
    const les = ["grammar", "conj"].map(type => {
        const wk = weekLesson(type), id = wk ? wk.id : suggestLesson(type), L = LESSONS[id];
        return row(`data-mcl="${id}"`, !!wk, type === "grammar" ? "Grammar lesson" : "Conjugation lesson", esc(L.title) + (wk ? ` · ${wk.p}%` : ""), wk ? "1/1" : "0/1");
    }).join("");
    const todo = ["grammar", "conj"].find(type => !weekLesson(type));
    box.innerHTML = `<div class="mch"><span class="mct">This week</span><span class="mcd">${left ? `${left} day${left > 1 ? "s" : ""} left` : "Last day!"}</span></div>
<div class="mrows">${les}${row('data-mct="1"', nt >= N, "My weekly review", nt ? `${nt} of ${N} tests done` : "Grammar, conjugation, irregular verbs", `${nt}/${N}`)}
<div class="mrow mstar"><span class="mtick">${STAR}</span><span class="mtx"><b>Stars this week</b><small>Every word, quiz and lesson counts</small></span><em>${st}</em></div></div>
<button class="mcgo" type="button" ${todo ? `data-mcl="${weekLesson(todo) ? "" : suggestLesson(todo)}"` : 'data-mct="1"'}>${todo ? "Open this week's lesson" : "My weekly review"}${GOSVG}</button>`;
}
function mcApps() {
    const has = !!curProf(), put = (id, txt, ok) => {
        const b = document.querySelector(`[data-ab="${id}"]`);
        if (!b)
            return;
        b.hidden = !has || txt == null;
        b.classList.toggle("ok", !!ok);
        b.textContent = ok ? "✓" : txt == null ? "" : txt;
    };
    if (!has) {
        ["toDaily", "toGrammar", "toConj", "toTests"].forEach(id => put(id, null));
        return;
    }
    const r = DST.days[todayKey()], n = (r && r.n) || target(), m = Math.min(masteredOf(r), n);
    put("toDaily", `${m}/${n}`, dayDone(r));
    put("toGrammar", "0/1", !!weekLesson("grammar"));
    put("toConj", "0/1", !!weekLesson("conj"));
    const W = testWeeks(1), N = Object.keys(TESTS).length, nt = Object.keys(TESTS).filter(k => W.tab[k][0]).length;
    put("toTests", `${nt}/${N}`, nt >= N);
}
function mcRender() {
    const has = !!curProf(), dots = document.getElementById("mdots");
    document.querySelectorAll("#mtrack .mslide").forEach((s, i) => { if (i) s.hidden = !has; });
    if (dots)
        dots.hidden = !has;
    const g = document.getElementById("gmrank");
    if (g)
        g.hidden = true;   /* la carte de rang disparaît du menu (PO 11/11) : le rang reste dans My work */
    try {
        mcToday();
    }
    catch (e) {
    }
    try {
        mcWeek();
    }
    catch (e) {
    }
    try {
        mcApps();
    }
    catch (e) {
    }
}
/* rafraîchi à chaque mise à jour des tuiles du menu (retour au menu, fin d'un tour, changement d'élève) */
(function () {
    const U0 = updateDailyTile;
    updateDailyTile = function () {
        U0.apply(this, arguments);
        mcRender();
    };
})();
(function () {
    const track = document.getElementById("mtrack"), dots = document.getElementById("mdots");
    if (!track || !dots)
        return;
    const cur = () => Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    const mark = () => {
        const i = cur();
        dots.querySelectorAll("[data-mc]").forEach((d, k) => d.setAttribute("aria-selected", String(k === i)));
        const h = document.getElementById("mhint");
        if (h && i > 0)
            h.classList.add("seen");
    };
    let raf = 0;
    track.addEventListener("scroll", () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(mark);
    }, { passive: true });
    dots.addEventListener("click", e => {
        const d = e.target.closest("[data-mc]");
        if (d)
            track.scrollTo({ left: +d.dataset.mc * track.clientWidth, behavior: "smooth" });
    });
    document.getElementById("mhint").addEventListener("click", () => track.scrollTo({ left: track.clientWidth, behavior: "smooth" }));
    track.addEventListener("click", e => {
        if (e.target.closest("#mcround")) {
            stopSpeech();
            DAILY = true;
            startQuiz("mix", "all");
            show("quiz");
            return;
        }
        const l = e.target.closest("[data-mcl]");
        if (l && l.dataset.mcl) {
            stopSpeech();
            LFROM = null;
            openLesson(l.dataset.mcl);
            return;
        }
        if (e.target.closest("[data-mct]")) {
            stopSpeech();
            openTests();
        }
    });
    /* en revenant au menu, on repart de la carte de Kai */
    const S0 = show;
    show = function (id) {
        S0.apply(this, arguments);
        if (id === "menu") {
            track.scrollLeft = 0;
            mark();
        }
    };
})();
mcRender();
