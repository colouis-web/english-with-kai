/* Code — tranche de l'ancien index.html (lignes 1889–1965). Script classique : l'ordre des <script> compte. */
"use strict";
const PQN = 10;
function lessonBank(id) {
    const L = LESSONS[id];
    if (!L.bank) {
        const seen = new Set(), b = [];
        for (const x of [...(L.practice || []), ...(LBANK[id] || [])]) {
            const k = x.q + "|" + x.o[0];
            if (seen.has(k))
                continue;
            seen.add(k);
            b.push(x);
        }
        L.bank = b;
    }
    return L.bank;
}
const pqHash = x => {
    let h = 5381;
    const s = x.q + "|" + x.o[0];
    for (let i = 0; i < s.length; i++)
        h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
};
function pickPractice(id) {
    const bank = lessonBank(id), key = "kai.pq." + (PROFS.cur || "x") + "." + id;
    let seen = [];
    try {
        seen = JSON.parse(localStorage.getItem(key) || "[]");
    }
    catch (e) {
    }
    const S = new Set(seen);
    let fresh = bank.filter(x => !S.has(pqHash(x)));
    if (fresh.length < PQN) {
        seen = [];
        fresh = bank.slice();
    }
    const byT = {};
    shuffle(fresh).forEach(x => {
        const t = x.t || "x";
        (byT[t] = byT[t] || []).push(x);
    });
    const types = shuffle(Object.keys(byT)), out = [], n = Math.min(PQN, fresh.length);
    while (out.length < n) {
        let moved = false;
        for (const t of types) {
            if (out.length >= n)
                break;
            const a = byT[t];
            if (a.length) {
                out.push(a.shift());
                moved = true;
            }
        }
        if (!moved)
            break;
    }
    try {
        localStorage.setItem(key, JSON.stringify(seen.concat(out.map(pqHash)).slice(-2000)));
    }
    catch (e) {
    }
    return shuffle(out);
}
/* entraînement : une question à la fois, avec l'explication après chaque réponse */
const optLab = o => o === "—" ? "(no word)" : o;
const fillParts = (q, a) => {
    const p = String(a).split(" … "), n = q.q.split("___").length - 1;
    return p.length > 1 && p.length === n ? p : null;
};
const fillQ = (q, a) => {
    if (a === "—")
        return q.q.replace(/___ ?/, "");
    const p = fillParts(q, a);
    if (p) {
        let i = 0;
        return q.q.replace(/___/g, () => p[i++]);
    }
    return a[0] === "'" ? q.q.replace(/ ?___/, a) : q.q.replace("___", a);
};
const fillHtml = (q, a) => {
    const p = fillParts(q, a), w = x => `<span class="blank fill">${esc(x)}</span>`;
    if (p) {
        let i = 0;
        return esc(q.q).replace(/___/g, () => w(p[i++]));
    }
    return esc(q.q).replace(a[0] === "'" ? / ?___/ : "___", w(a));
};
const fullSent = q => (!q.q.includes("___") || q.q.includes("→")) ? q.o[0] : fillQ(q, q.o[0]).replace(/[“”]/g, "").replace(/\s*\([^)]*\)\s*$/, "").replace(/^(.)/, c => c.toUpperCase());
const blank = t => esc(t).replace(/___/g, '<span class="blank">?</span>');
function startPractice() {
    LQ = { qs: pickPractice(LES).map(x => ({ ...x, opts: shuffle(x.o) })), i: 0, ok: 0 };
    renderPQ();
    scrollTo(0, 0);
}
const pdots = () => LQ.qs.map((x, i) => `<i class="${x.res === true ? "ok" : x.res === false ? "ko" : i === LQ.i ? "cur" : ""}"></i>`).join("");
function renderPQ() {
    const q = LQ.qs[LQ.i], N = LQ.qs.length;
    document.getElementById("lessonbody").innerHTML = `<p class="qpart">Practice · ${LESSONS[LES].title}</p><div class="dots${N > 10 ? " many" : ""}" aria-hidden="true">${pdots()}</div>
<p class="pcount">Question ${LQ.i + 1}/${N}</p><div class="psent" id="psent">${frBtn(q)}<span class="pq">${blank(q.q)}</span></div>
<div class="lopts">${q.opts.map((o, k) => `<button class="opt" data-po="${k}">${esc(optLab(o))}</button>`).join("")}</div><div class="fb" id="pfb" aria-live="polite"></div>`;
}
function answerPQ(k) {
    const q = LQ.qs[LQ.i];
    if (q.res !== undefined)
        return;
    const good = q.opts[k] === q.o[0];
    q.res = good;
    if (good)
        LQ.ok++;
    document.querySelectorAll("#lessonbody .opt").forEach((b, j) => {
        b.disabled = true;
        if (q.opts[j] === q.o[0])
            b.classList.add("right");
        else if (j === k)
            b.classList.add("wrong");
        else
            b.classList.add("dim");
    });
    if (q.q.includes("___"))
        document.querySelector("#psent .pq").innerHTML = fillHtml(q, q.o[0]);
    document.querySelector("#lessonbody .dots").innerHTML = pdots();
    const last = LQ.i === LQ.qs.length - 1;
    document.getElementById("pfb").innerHTML = `<p class="verdict ${good ? "ok" : "ko"}">${good ? "YES! WELL DONE!" : "OOPS!"}</p><p class="pexp">${esc(q.e)}</p><button class="listen next" id="pnext">${last ? "See my score" : "Next"}${GOSVG}</button>`;
    sayOne(fullSent(q), null);
    document.getElementById("pnext").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function endPractice() {
    const N = LQ.qs.length, P = pct(LQ.ok, N), pick = P >= 60 ? (P === 100 ? "joy" : "dyn") : "angry", img = END_L[pick] || END_L.dyn, msg = P === 100 ? "Perfect!" : P >= 80 ? "Great job!" : P >= 60 ? "Well done!" : "Try again!", L = LESSONS[LES];
    const rows = [["You got"], [[`${P}%`], "!"], [msg]];
    document.getElementById("lessonbody").innerHTML = `<p class="qpart">Your score · ${esc(L.title)}</p><div class="qend"><svg viewBox="0 0 360 300" role="img" aria-label="Kai : you got ${P} percent">
<image class="kai${pick === "angry" ? " mad" : ""}" href="img/kai-${pick}.webp" x="${img.x}" y="${img.y}" width="${img.w}" height="${img.h}" preserveAspectRatio="xMidYMax meet"/>
<g class="bb b1"><path d="${bubblePath(img.c, img.r, img.tip)}" fill="#fff" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><text text-anchor="middle">${rows.map((rw, j) => `<tspan x="${img.c[0]}" y="${f1(img.c[1] - 20 + 6 + j * 20)}">${rowSvg(rw)}</tspan>`).join("")}</text></g></svg></div>
<div class="pscore"><b>${LQ.ok}</b><span>/ ${N}</span><small>good answers</small></div>
<p class="goal${P >= PASS ? " ok" : ""}">${P === 100 ? `100%: you know the ${esc(L.title.toLowerCase())} lesson!` : P >= PASS ? `Lesson passed (${PASS}% needed).` : `You need ${PASS}% to pass: read the lesson again and try once more!`}</p>
<div id="pban"></div>
<div class="endbtns"><button class="listen" id="pagain">Do it again${GOSVG}</button><button class="ghost" id="pmenu">Back to menu</button></div>
<p class="pnew">New questions every time!</p>
<ul class="recap">${LQ.qs.map(q => `<li class="${q.res ? "ok" : "ko"}"><span class="m">${q.res ? CHECK : CROSS}</span><b>${esc(fullSent(q))}</b><i></i></li>`).join("")}</ul>
<div class="endbtns"><button class="ghost sm" id="plesson">Read the lesson again</button></div>`;
    scrollTo(0, 0);
    let first = false, DR = null;
    let g0 = 0, g1 = 0;
    try {
        const p = curProf();
        if (p) {
            p.lessons = p.lessons || {};
            const o = p.lessons[LES] || { best: 0, n: 0 };
            first = o.best < PASS && P >= PASS;
            g0 = Number.isInteger(o.g) ? o.g : ((o.best || 0) >= LGOOD ? 1 : 0);
            g1 = g0 + (P >= LGOOD ? 1 : 0);
            p.lessons[LES] = { best: Math.max(o.best || 0, P), n: (o.n || 0) + 1, t: Date.now(), g: g1 };
            p.u = Date.now();
            pSave();
            pPush(p);
        }
    }
    catch (e) {
    }
    const s0 = starsFor(g0), s1 = starsFor(g1);
    try {
        DR = recordActivity("lesson-" + LES, N, P);
    }
    catch (e) {
    }
    try {
        const b = document.getElementById("pban");
        if (b)
            b.innerHTML = `<div class="lsbox${s1 > s0 ? " new" : ""}">${s1 > s0 ? `<p class="lsnew">New star!</p>` : ""}${starRow(s1, "big")}<p>${starHint(g1)}</p></div>` + (P >= PASS ? `<p class="dban ok">${CHECK}${L.type === "grammar" ? "Grammar" : "Conjugation"} lesson of the week done!${first ? " +2 stars" : ""}</p>` : "") + (DR && DR.bonus ? `<p class="dban">${BOLT}Bonus activity for today: +1 star!</p>` : "");
    }
    catch (e) {
    }
    try {
        sayOne(`You got ${P} percent! ${msg.charAt(0) + msg.slice(1).toLowerCase()}`, document.querySelector("#lessonbody .bb"));
    }
    catch (e) {
    }
}
document.getElementById("lessonbody").addEventListener("click", e => {
    const t = e.target;
    if (t.closest("#lpractice") || t.closest("#pagain")) {
        stopSpeech();
        startPractice();
        return;
    }
    if (t.closest("#plesson")) {
        stopSpeech();
        LQ = null;
        renderLesson();
        scrollTo(0, 0);
        return;
    }
    if (t.closest("#pmenu")) {
        stopSpeech();
        LQ = null;
        show("menu", true);
        return;
    }
    if (t.closest("[data-fr]")) {
        if (LQ && LQ.qs[LQ.i])
            showFr(LQ.qs[LQ.i]);
        return;
    }
    const o = t.closest("[data-po]");
    if (o) {
        answerPQ(+o.dataset.po);
        return;
    }
    if (t.closest("#pnext")) {
        try {
            stopSpeech();
        }
        catch (err) {
        }
        if (LQ.i < LQ.qs.length - 1) {
            LQ.i++;
            renderPQ();
            scrollTo({ top: 0, behavior: "smooth" });
        }
        else
            endPractice();
        return;
    }
    const s = t.closest("[data-say]");
    if (s) {
        document.querySelectorAll(".talk").forEach(x => x.classList.remove("talk"));
        sayOne(s.dataset.say, s);
        return;
    }
    if (t.closest(".qhead .bb") && LES && !LQ)
        sayOne(plain(LESSONS[LES].say), t.closest(".bb"));
});
/* listes de leçons : conjugaison et grammaire */
function lessonTile(id) {
    const L = LESSONS[id], b = lessonBest(id), st = lessonState(id), wk = weekLesson(L.type);
    return `<button class="tense lesson${st === "pass" ? " done" : ""}" data-lesson="${id}"><span class="tn">${L.type === "conj" ? esc(id === "be" || id === "have" ? id : String(LORDER.conj.indexOf(id) - 1)) : String(LORDER.grammar.indexOf(id) + 1)}</span><span class="tt2"><b>${L.title}</b><small>${esc(L.fr)} · ${esc(L.sub)}</small><em>${st === "new" ? "New lesson" : st === "pass" ? `Passed · best ${b}%` : `Best ${b}% · ${PASS}% to pass`}</em>${starRow(starsFor(lessonGood(id)))}${wk && wk.id === id ? `<em class="wkb">${CHECK}This week</em>` : ""}</span></button>`;
}
function renderLessonList(type) {
    const box = document.getElementById(type === "conj" ? "conjbody" : "grammarbody"), wk = weekLesson(type), sug = suggestLesson(type);
    const say = type === "conj" ? "Let's *conjugate*! One lesson a week: start with *be* and *have*." : "Let's learn *grammar*! One lesson a week.";
    box.innerHTML = `<div class="qhead">${headSvg(say, "smile")}</div>
<div class="wkline${wk ? " ok" : ""}">${wk ? `${CHECK}<span>This week's ${type === "conj" ? "conjugation" : "grammar"} lesson is done: <b>${esc(LESSONS[wk.id].title)}</b> (${wk.p}%)</span>` : `<span>Lesson of the week: <b>${esc(LESSONS[sug].title)}</b></span>`}</div>
<div class="tlist">${LORDER[type].map(lessonTile).join("")}</div>`;
}
document.getElementById("toConj").addEventListener("click", () => {
    renderLessonList("conj");
    show("conj");
});
document.getElementById("toGrammar").addEventListener("click", () => {
    renderLessonList("grammar");
    show("grammar");
});
document.getElementById("backCj").addEventListener("click", () => show("menu", true));
["conjbody", "grammarbody"].forEach(id => document.getElementById(id).addEventListener("click", e => {
    const ls = e.target.closest("[data-lesson]");
    if (ls) {
        openLesson(ls.dataset.lesson);
        return;
    }
    const bb = e.target.closest(".qhead .bb");
    if (bb)
        sayOne(bb.closest("svg").getAttribute("aria-label").replace(/^Kai : /, ""), bb);
}));
document.getElementById("backL").addEventListener("click", () => {
    stopSpeech();
    if (LQ) {
        LQ = null;
        renderLesson();
        scrollTo(0, 0);
        return;
    }
    const ty = LESSONS[LES].type;
    renderLessonList(ty);
    show(ty === "conj" ? "conj" : "grammar", true);
});
renderMenuHead();
updateDailyTile();
setTimeout(dSync, 0);
document.getElementById("backG").addEventListener("click", () => show("menu", true));
/* icônes monochromes (police Noto Emoji) : si la police ne charge pas, on les masque */
(function () {
    const H = document.documentElement, no = () => H.classList.add("emo-no");
    try {
        const t = setTimeout(no, 6000);
        document.fonts.load('27px "Noto Emoji"', "🐶").then(f => {
            clearTimeout(t);
            if (f && f.length) {
                H.classList.remove("emo-no");
                H.classList.add("emo-ok");
            }
            else
                no();
        }).catch(no);
    }
    catch (e) {
        no();
    }
})();
