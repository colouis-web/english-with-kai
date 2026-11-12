/* Menu, nouvelle mouture (PO, 11/11) : le haut du menu devient un carrousel de 3 cartes qu'on fait glisser.
   1. Kai parle (bulle de renderMenuHead, sans la carte de rang : demande du PO) ;
   2. Today : les mots du jour au format de My work (mots maîtrisés / objectif, phrase, bouton du tour) ;
      le menu s'ouvre sur cette carte tant que l'objectif du jour n'est pas atteint (PO 11/11) ;
   3. This week : leçons de la semaine (grammaire, conjugaison), tests de My weekly review, étoiles de la semaine.
   Le glissement est natif (scroll-snap) ; les points suivent le défilement et permettent de sauter à une carte.
   En dessous, des « apps » 3 par ligne (PO 11/11) : Dictionary, Grammar, Conjugation, My activity, Test yourself,
   Weekly review ; sans pastille d'avancement :
   les cartes Today et This week le disent déjà (PO 11/11).
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
<button class="mcgo" type="button" id="mcround">${done ? "Bonus round" : m ? "Next words" : "Start"} · ${size} words${GOSVG}</button></div>`;   /* PO 11/11 : sans les 3 stats, elles sont dans My activity */
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
}
/* carte d'arrivée : Today tant que l'objectif du jour n'est pas atteint, sinon Kai ; Kai aussi quand il accueille l'élève */
let MCKAI = false;
function mcStart() {
    try {
        return curProf() && !dayDone(DST.days[todayKey()]) ? 1 : 0;
    }
    catch (e) {
        return 0;
    }
}
/* fin ou abandon d'un tour de mots : retour au menu, sur la carte Today (PO 11/11) ; Kai félicite si l'élève monte de niveau */
function openMenuDay(back) {
    DAILY = false;
    MCKAI = false;
    LVUP = null;
    const up = checkLevelUp();
    updateDailyTile();
    show("menu", back);
    if (up) {
        confetti();
        toast(`Level up! You are now ${LV[LVUP].name}!`, 2600);
    }
}
(function () {
    const W1 = welcome;
    welcome = function () {
        MCKAI = true;
        return W1.apply(this, arguments);
    };
})();
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
            /* un tour interrompu : on propose de le reprendre, comme l'ancien bouton Start de My work (app-v51-sauvegarde.js) */
            const L = typeof qLoad === "function" ? qLoad(true) : null;
            if (L) {
                askRound(L, true);
                return;
            }
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
    /* en revenant au menu : la carte Today tant que l'objectif n'est pas atteint, sinon celle de Kai */
    const S0 = show;
    show = function (id) {
        S0.apply(this, arguments);
        if (id === "menu") {
            const i = MCKAI ? 0 : mcStart();
            MCKAI = false;
            track.scrollLeft = i * track.clientWidth;
            mark();
        }
    };
})();
mcRender();
