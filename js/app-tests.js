/* Code — tranche de l'ancien index.html (lignes 2116–2289). Script classique : l'ordre des <script> compte. */
"use strict";
/* Les nombres de leçons viennent de LORDER (S-06) ; « sub » est un getter car des leçons sont ajoutées à LORDER
   après le chargement de ce fichier (enrichissement) : lu au moment de l'affichage, le compte est toujours juste. */
const TESTS = { grammar: { title: "Grammar test", h1: "Grammar test", ic: "G", get sub() { const n = testLessons("grammar").length; return `20 questions on your ${n} grammar lesson${n > 1 ? "s" : ""} · 7 to type`; }, say: "Grammar test! *20 questions* on your lessons." },
    conj: { title: "Conjugation test", h1: "Conjugation", ic: "C", get sub() { return `20 questions on the ${LORDER.conj.length} tenses · 7 to type`; }, say: "Conjugation test! *20 questions* on all the tenses." },
    irr: { title: "Irregular verbs test", h1: "Irregular verbs", ic: "V", sub: "10 random verbs · type the past simple and the past participle", say: "Irregular verbs! Type the *past* forms." } };
const n20 = x => String(Math.round(x * 10) / 10);
function isTest(q) {
    return String(q.k).startsWith("test-");
}
let TQ = null;
function testRecs() {
    const p = curProf();
    return (p && p.tests) || {};
}
/* moyennes par thème et par semaine (du lundi au dimanche), calculées d'après les tests enregistrés jour par jour */
const TCOL = { grammar: "#2a78d6", conj: "#eb6834", irr: "#1baf7a" }, TSHORT = { grammar: "Grammar", conj: "Conjugation", irr: "Irregular verbs" };
const markOfQ = q => typeof q.m === "number" ? q.m : Math.round((q.p || 0) / 2.5) / 2;
const wkStart = k => addDays(k, -((kDate(k).getDay() + 6) % 7));
const wkLab = w => kDate(w).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const avgOf = a => a.reduce((s, x) => s + x, 0) / a.length;
function testWeeks(n) {
    const cur = wkStart(todayKey()), weeks = [...Array(n)].map((_, i) => addDays(cur, -7 * (n - 1 - i))), acc = {};
    for (const [d, r] of Object.entries(DST.days))
        for (const q of (r && r.qs) || []) {
            if (!isTest(q))
                continue;
            const k = q.k.slice(5);
            if (!TESTS[k])
                continue;
            const key = k + "|" + wkStart(d);
            (acc[key] = acc[key] || []).push(markOfQ(q));
        }
    const tab = {}, prev = {};
    for (const k of Object.keys(TESTS)) {
        tab[k] = weeks.map(w => {
            const a = acc[k + "|" + w];
            return a ? { avg: avgOf(a), n: a.length } : null;
        });
        const w = Object.keys(acc).filter(x => x.startsWith(k + "|")).map(x => x.split("|")[1]).filter(x => x < cur).sort().pop();
        if (w)
            prev[k] = { w, avg: avgOf(acc[k + "|" + w]), n: acc[k + "|" + w].length };
    }
    return { weeks, tab, cur, prev };
}
function weekStat(k, W) {
    const t = W.tab[k], now = t[t.length - 1], pv = W.prev[k];
    return { now, pv, delta: now && pv ? Math.round((now.avg - pv.avg) * 10) / 10 : null, vs: pv ? (pv.w === addDays(W.cur, -7) ? "last week" : "week of " + wkLab(pv.w)) : "" };
}
const deltaHtml = s => s.delta === null ? (s.now ? '<i class="tdl">First week with this test</i>' : s.pv ? `<i class="tdl">${s.vs.replace(/^./, c => c.toUpperCase())}: ${n20(s.pv.avg)}/20</i>` : "")
    : `<i class="tdl ${s.delta > 0 ? "up" : s.delta < 0 ? "down" : ""}">${s.delta > 0 ? "▲ +" : s.delta < 0 ? "▼ −" : "= "}${n20(Math.abs(s.delta))} vs ${s.vs}</i>`;
function testTiles(W) {
    return `<div class="tkpi">${Object.keys(TESTS).map(k => {
        const s = weekStat(k, W);
        return `<div class="tk"><span class="tkl"><i class="key" style="background:${TCOL[k]}"></i>${TSHORT[k]}</span><b>${s.now ? n20(s.now.avg) : "–"}<small>/20</small></b><em>${s.now ? `${s.now.n} test${s.now.n > 1 ? "s" : ""} this week` : "No test this week"}</em>${deltaHtml(s)}</div>`;
    }).join("")}</div>`;
}
/* graphique : la moyenne de chaque semaine, sur les 8 dernières semaines */
let TCW = null;
function testChart(W) {
    TCW = W;
    const ks = Object.keys(TESTS);
    if (!ks.some(k => W.tab[k].some(Boolean)))
        return `<p class="dnone">No test yet. Do a test in <b>My weekly review</b>: your marks will appear here, week after week.</p><button class="listen sm tprog" data-gotests>My weekly review${GOSVG}</button>`;
    const Wd = 340, H = 200, L = 30, R = 24, T = 12, B = 28, n = W.weeks.length, x = i => L + (Wd - L - R) * (n === 1 ? .5 : i / (n - 1)), y = v => T + (H - T - B) * (1 - v / 20);
    let g = "";
    [0, 5, 10, 15, 20].forEach(v => {
        g += `<line class="tg" x1="${L}" x2="${Wd - R}" y1="${f1(y(v))}" y2="${f1(y(v))}"/><text class="ty" x="${L - 7}" y="${f1(y(v) + 3.5)}">${v}</text>`;
    });
    W.weeks.forEach((w, i) => {
        g += `<text class="tx${i === n - 1 ? " cur" : ""}" x="${f1(x(i))}" y="${H - 9}">${i === n - 1 ? "This wk" : wkLab(w)}</text>`;
    });
    let lines = "", dots = "";
    for (const k of ks) {
        const t = W.tab[k];
        let d = "";
        t.forEach((v, i) => {
            if (v)
                d += `${i > 0 && t[i - 1] ? "L" : "M"}${f1(x(i))} ${f1(y(v.avg))}`;
        });
        if (d)
            lines += `<path d="${d}" fill="none" stroke="${TCOL[k]}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
        t.forEach((v, i) => {
            if (v)
                dots += `<circle cx="${f1(x(i))}" cy="${f1(y(v.avg))}" r="4.5" fill="${TCOL[k]}" stroke="#fff" stroke-width="2"/>`;
        });
    }
    const step = n > 1 ? (Wd - L - R) / (n - 1) : Wd - L - R;
    const hits = W.weeks.map((w, i) => `<rect class="thit" data-wi="${i}" x="${f1(x(i) - step / 2)}" y="${T}" width="${f1(step)}" height="${H - T - B}" tabindex="0" aria-label="${i === n - 1 ? "This week" : "Week of " + wkLab(w)}: ${ks.map(k => `${TSHORT[k]} ${W.tab[k][i] ? n20(W.tab[k][i].avg) + " out of 20" : "no test"}`).join(", ")}"/>`).join("");
    const rows = W.weeks.map((w, i) => ({ w, i })).filter(o => ks.some(k => W.tab[k][o.i])).reverse();
    return `<div class="tchart"><div class="tleg">${ks.map(k => `<span><i class="lk" style="background:${TCOL[k]}"></i>${TSHORT[k]}</span>`).join("")}</div>
<svg viewBox="0 0 ${Wd} ${H}" data-l="${L}" data-r="${R}" role="img" aria-label="Weekly average mark out of 20 for each test, last ${n} weeks">${g}<line class="tcross" x1="0" x2="0" y1="${T}" y2="${H - B}"/>${lines}${dots}${hits}</svg><div class="ttip" aria-hidden="true"></div></div>
<details class="ttab"><summary>See the numbers</summary><table><thead><tr><th>Week</th>${ks.map(k => `<th>${TSHORT[k]}</th>`).join("")}</tr></thead><tbody>${rows.map(o => `<tr><td>${o.i === n - 1 ? "This week" : wkLab(o.w)}</td>${ks.map(k => {
        const v = W.tab[k][o.i];
        return `<td>${v ? n20(v.avg) : "–"}</td>`;
    }).join("")}</tr>`).join("")}</tbody></table></details>`;
}
function testProgress() {
    const W = testWeeks(8), ks = Object.keys(TESTS);
    if (!ks.some(k => W.tab[k].some(Boolean) || W.prev[k]))
        return testChart(W);
    return `<p class="tsub">Your average mark of the week (Monday to Sunday), for each test, and your progress week after week.</p>${testTiles(W)}${testChart(W)}`;
}
function tchartShow(svg, i) {
    const box = svg.closest(".tchart"), tip = box && box.querySelector(".ttip"), W = TCW;
    if (!tip || !W || !(i >= 0 && i < W.weeks.length))
        return;
    const n = W.weeks.length, vb = svg.viewBox.baseVal, L = +svg.dataset.l, R = +svg.dataset.r, cx = L + (vb.width - L - R) * (n === 1 ? .5 : i / (n - 1)), cr = svg.querySelector(".tcross");
    cr.setAttribute("x1", cx);
    cr.setAttribute("x2", cx);
    cr.style.visibility = "visible";
    tip.textContent = "";
    const hd = document.createElement("div");
    hd.className = "tth";
    hd.textContent = i === n - 1 ? "This week" : "Week of " + wkLab(W.weeks[i]);
    tip.appendChild(hd);
    for (const k of Object.keys(TESTS)) {
        const v = W.tab[k][i], r = document.createElement("div"), key = document.createElement("i"), b = document.createElement("b"), sp = document.createElement("span");
        r.className = "ttr";
        key.style.background = TCOL[k];
        b.textContent = v ? n20(v.avg) + "/20" : "–";
        sp.textContent = TSHORT[k] + (v ? ` · ${v.n} test${v.n > 1 ? "s" : ""}` : "");
        r.append(key, b, sp);
        tip.appendChild(r);
    }
    const br = box.getBoundingClientRect(), sr = svg.getBoundingClientRect(), px = sr.left - br.left + cx * sr.width / vb.width, tw = tip.offsetWidth || 170;
    tip.style.left = Math.max(4, Math.min(box.clientWidth - tw - 4, px - tw / 2)) + "px";
    tip.classList.add("on");
}
function tchartHide() {
    document.querySelectorAll(".ttip.on").forEach(t => t.classList.remove("on"));
    document.querySelectorAll(".tcross").forEach(c => c.style.visibility = "hidden");
}
function tchartIdx(svg, cx) {
    const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, L = +svg.dataset.l, R = +svg.dataset.r, n = TCW.weeks.length, x = (cx - r.left) * vb.width / r.width;
    return n === 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round((x - L) / ((vb.width - L - R) / (n - 1)))));
}
document.addEventListener("pointermove", e => {
    const svg = e.target.closest && e.target.closest(".tchart svg");
    if (svg && TCW)
        tchartShow(svg, tchartIdx(svg, e.clientX));
    else if (document.querySelector(".ttip.on"))
        tchartHide();
}, { passive: true });
document.addEventListener("pointerdown", e => {
    const svg = e.target.closest && e.target.closest(".tchart svg");
    if (svg && TCW)
        tchartShow(svg, tchartIdx(svg, e.clientX));
    else
        tchartHide();
});
document.addEventListener("focusin", e => {
    const r = e.target.closest && e.target.closest(".thit");
    if (r && TCW)
        tchartShow(r.closest("svg"), +r.dataset.wi);
    else
        tchartHide();
});
document.addEventListener("click", e => {
    if (e.target.closest("[data-gotests]")) {
        e.preventDefault();
        openTests();
    }
    else if (e.target.closest("[data-goprog]")) {
        e.preventDefault();
        DTAB = "today";
        openDaily();
        setTimeout(() => {
            const s = document.getElementById("dtests");
            if (s)
                s.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 120);
    }
});
function updateTestTile() {
    const t = document.querySelector("#toTests span");
    if (!t)
        return;
    const W = testWeeks(1), ks = Object.keys(TESTS).filter(k => W.tab[k][0]);
    t.textContent = ks.length ? `This week: ${ks.map(k => `${TSHORT[k]} ${n20(W.tab[k][0].avg)}/20`).join(" · ")}` : "One test a week: grammar, conjugation and irregular verbs";
}
function renderTests() {
    const T = testRecs(), W = testWeeks(8);
    document.getElementById("testsbody").innerHTML = `<div class="qhead">${headSvg("Let's *test* your English!", "smile")}</div>
<div class="dsec"><h2>My marks this week</h2><span>/20</span></div>${testTiles(W)}
<button class="ghost sm tprog" data-goprog>See my progress week after week</button>
<div class="dsec"><h2>The tests</h2><span>3</span></div>
<div class="tlist">${Object.keys(TESTS).map(k => {
        const X = TESTS[k], r = T[k], sv = tLoad(k);
        return `<button class="tcard${r ? " done" : ""}${sv ? " paused" : ""}" data-test="${k}"><span class="tci">${X.ic}</span><span class="tct"><b>${X.title}</b><small>${X.sub}</small>${sv ? `<em class="tpause">Not finished · ${tDone(sv)}/${sv.qs.length} answered</em>` : ""}<em>${r ? `Last ${n20(r.last)}/20 · best ${n20(r.best)}/20 · ${r.n} time${r.n > 1 ? "s" : ""}` : "Not done yet"}</em></span><span class="tgo${sv ? " res" : ""}">${sv ? "Resume" : r ? "Again" : "Start"}${ARROW(1)}</span></button>`;
    }).join("")}</div>
<p class="tnote">Each test gives a mark out of 20. Your average is calculated for each test, week by week (Monday to Sunday): you can take a test several times. If you stop before the end, your answers are saved and you can finish the test later. Questions marked <b>Type your answer</b> are not a quiz: write the answer yourself. The tense, the verb and the form (negative or question) are given each time.</p>`;
}
function openTests(back) {
    TQ = null;
    renderTests();
    show("tests", back);
    setTimeout(() => {
        const bb = document.querySelector("#testsbody .bb");
        if (bb)
            sayOne("Let's test your English!", bb);
    }, 450);
}
/* tirage : chaque thème est représenté, les questions déjà vues reviennent le plus tard possible */
function pickRot(list, n, key, hf) {
    let seen = [];
    try {
        seen = JSON.parse(localStorage.getItem(key) || "[]");
    }
    catch (e) {
    }
    const S = new Set(seen);
    let fresh = list.filter(x => !S.has(hf(x)));
    if (fresh.length < n) {
        seen = [];
        fresh = list.slice();
    }
    const out = shuffle(fresh).slice(0, n);
    try {
        localStorage.setItem(key, JSON.stringify(seen.concat(out.map(hf)).slice(-600)));
    }
    catch (e) {
    }
    return out;
}
const tkey = (k, x) => "kai.tq." + (PROFS.cur || "x") + "." + k + "." + x;
/* Leçons couvertes par un test (décision du PO, 30/10) : pour la grammaire, seulement les leçons que l'élève a déjà
   travaillées (au moins une série faite), complétées par les premières leçons du parcours pour avoir au moins
   TMINLES leçons. Un débutant ne tombe donc plus sur le discours indirect dès la 3e question. */
const TMINLES = 3;
function testLessons(kind) {
    const all = LORDER[kind];
    if (kind !== "grammar")
        return all;
    const p = curProf(), done = all.filter(id => p && p.lessons && p.lessons[id]);
    for (const id of all) {
        if (done.length >= TMINLES)
            break;
        if (!done.includes(id))
            done.push(id);
    }
    return all.filter(id => done.includes(id));
}
function buildTest(kind) {
    if (kind === "irr")
        return pickRot(IRR100.filter(v => DMAP[v]), 10, tkey(kind, "v"), v => v).map(v => ({ irr: 1, v, d: DMAP[v] }));
    const ids = testLessons(kind), N = TQN, base = Math.floor(N / ids.length), extra = new Set(shuffle(ids).slice(0, N - base * ids.length)), typed = new Set(shuffle(ids.filter(id => (TTYPE[kind][id] || []).length)).slice(0, TQTYPED)), qs = [];
    for (const id of ids) {
        let k = base + (extra.has(id) ? 1 : 0);
        if (typed.has(id)) {
            const t = pickRot(TTYPE[kind][id], 1, tkey(kind, "t." + id), x => x.q)[0];
            qs.push({ ...t, typed: 1, les: id });
            k--;
        }
        if (k > 0)
            pickRot(lessonBank(id), k, tkey(kind, id), pqHash).forEach(x => qs.push({ ...x, opts: shuffle(x.o), les: id }));
    }
    return shuffle(qs);
}
/* 20 questions par test (dont 7 à écrire) ; un test pas fini est gardé sur l'appareil et peut être repris */
const TQN = 20, TQTYPED = 7;
const tsKey = k => "kai.tsave." + (PROFS.cur || "x") + "." + k;
function tSave() {
    if (!TQ || TQ.done)
        return;
    try {
        localStorage.setItem(tsKey(TQ.kind), JSON.stringify({ kind: TQ.kind, i: TQ.i, pts: TQ.pts, max: TQ.max, t0: TQ.t0, qs: TQ.qs.map(q => q.irr ? { irr: 1, v: q.v, res: q.res, your: q.your, pts: q.pts } : q) }));
    }
    catch (e) {
    }
}
function tLoad(k) {
    try {
        const s = JSON.parse(localStorage.getItem(tsKey(k)) || "null");
        if (!s || s.kind !== k || !Array.isArray(s.qs) || !s.qs.length)
            return null;
        s.qs.forEach(q => {
            if (q.irr)
                q.d = DMAP[q.v];
        });
        return s.qs.some(q => q.irr && !q.d) ? null : s;
    }
    catch (e) {
        return null;
    }
}
function tClear(k) {
    try {
        localStorage.removeItem(tsKey(k));
    }
    catch (e) {
    }
}
const tDone = s => s.qs.filter(q => q.res !== undefined).length;
function startTest(kind) {
    tClear(kind);
    TQ = { kind, qs: buildTest(kind), i: 0, pts: 0, done: false, t0: Date.now() };
    TQ.max = kind === "irr" ? 2 * TQ.qs.length : TQ.qs.length;
    document.getElementById("ttitle").textContent = TESTS[kind].h1;
    renderTQ();
    show("test");
}
function resumeTest(kind) {
    const s = tLoad(kind);
    if (!s) {
        startTest(kind);
        return;
    }
    TQ = { ...s, done: false };
    const i = TQ.qs.findIndex(q => q.res === undefined);
    document.getElementById("ttitle").textContent = TESTS[kind].h1;
    show("test");
    if (i < 0) {
        TQ.i = TQ.qs.length - 1;
        endTest();
        return;
    }
    TQ.i = i;
    renderTQ();
    scrollTo(0, 0);
}
function askResume(kind) {
    const s = tLoad(kind);
    if (!s) {
        startTest(kind);
        return;
    }
    const n = tDone(s), N = s.qs.length;
    openModal(esc(TESTS[kind].title), `<p class="mtxt">You started this test${s.t0 ? ` on ${kDate(dKey(new Date(s.t0))).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}` : ""} and answered <b>${n} question${n > 1 ? "s" : ""} out of ${N}</b>. Your answers are saved.</p><div class="endbtns col"><button class="listen sm" data-mact="resume">Finish the test · ${n + 1}/${N}${GOSVG}</button><button class="ghost sm" data-mact="restart">Start a new test</button></div>`);
    MACT = { resume: () => resumeTest(kind), restart: () => startTest(kind) };
}
const tdots = () => TQ.qs.map((x, i) => `<i class="${x.res === true ? "ok" : x.res === false ? "ko" : x.res === .5 ? "half" : i === TQ.i ? "cur" : ""}"></i>`).join("");
/* réponses écrites : majuscules, ponctuation, apostrophes et formes contractées sont acceptées */
function tvars(s) {
    s = " " + String(s).toLowerCase().replace(/[’‘`´]/g, "'").replace(/[“”«»"]/g, " ").replace(/[.!?,;:]+/g, " ").replace(/\s+/g, " ") + " ";
    s = s.replace(/ won't /g, " will not ").replace(/ can't /g, " cannot ").replace(/ can not /g, " cannot ").replace(/ shan't /g, " shall not ").replace(/n't /g, " not ")
        .replace(/'m /g, " am ").replace(/'re /g, " are ").replace(/'ll /g, " will ").replace(/'ve /g, " have ").replace(/ (he|she|it|that|there|what|who|where|here)'s /g, " $1 's ");
    let out = [s];
    const exp = (pat, a, b) => {
        out = out.flatMap(x => x.includes(pat) ? [x.split(pat).join(a), x.split(pat).join(b)] : [x]);
    };
    exp(" 's ", " is ", " has ");
    exp("'d ", " would ", " had ");
    return out.map(x => x.replace(/\s+/g, " ").trim());
}
const fixApos = v => String(v).replace(/\b(do|does|did|is|are|was|were|have|has|had|could|would|should|must|need)nt\b/gi, "$1n't").replace(/\bwont\b/gi, "won't").replace(/\bcant\b/gi, "can't").replace(/\blets\b/gi, "let's");
function tmatch(q, input) {
    const I = new Set(tvars(input).filter(Boolean));
    if (!I.size)
        return false;
    const full = a => (q.q.includes("→") ? q.q.split("→").pop() : q.q).replace("___", a);
    return q.a.some(a => tvars(a).some(v => I.has(v)) || tvars(full(a)).some(v => I.has(v)));
}
function irrOk(forms, input) {
    const ok = new Set(forms.split("/").map(x => x.trim().toLowerCase())), toks = String(input).toLowerCase().replace(/[’']/g, "").split(/\s*(?:\/|,|\bor\b|\s)\s*/).map(x => x.trim()).filter(Boolean);
    return toks.length > 0 && toks.every(t => ok.has(t));
}
function tchips(q) {
    const L = LESSONS[q.les];
    return `<div class="tchips"><span class="tchip">${esc(q.l || L.title)}</span>${q.f === "neg" ? '<span class="tchip neg">Negative</span>' : q.f === "q" ? '<span class="tchip qst">Question</span>' : ""}${q.typed ? '<span class="tchip typ">Type your answer</span>' : ""}</div>`;
}
const touchOnly = () => {
    try {
        return matchMedia("(hover:none)").matches;
    }
    catch (e) {
        return false;
    }
};
function renderTQ() {
    const q = TQ.qs[TQ.i], N = TQ.qs.length, box = document.getElementById("testbody");
    let h = `<div class="dots${N > 10 ? " many" : ""}" aria-hidden="true">${tdots()}</div><p class="pcount">${q.irr ? "Verb" : "Question"} ${TQ.i + 1}/${N}</p>`;
    if (q.irr)
        h += `<p class="tins">Écris le prétérit et le participe passé du verbe.</p>
<div class="irrq"><button class="snd" data-say="to ${esc(q.v)}" aria-label="Listen">${SPK}</button><div><b><small>to</small>${esc(q.v)}</b><i>${esc(q.d.fr)}</i></div></div>
<form class="tform irr" id="tform" autocomplete="off"><label><span>Past simple <i>prétérit</i></span><input id="ipt" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="next"></label>
<label><span>Past participle <i>participe passé</i></span><input id="ipp" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="done"></label>
<button class="listen" type="submit" id="tcheck">Check${GOSVG}</button></form><div class="fb" id="tfb" aria-live="polite"></div>`;
    else if (q.typed)
        h += `${tchips(q)}<p class="tins">${esc(q.i)}</p><div class="psent tsent" id="psent">${frBtn(q)}<span class="pq">${blank(q.q)}${q.h ? ` <span class="thint">(${esc(q.h)})</span>` : ""}</span></div>
<form class="tform" id="tform" autocomplete="off"><input id="tans" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="Type the missing words" aria-label="Your answer"><button class="listen" type="submit" id="tcheck">Check${GOSVG}</button></form><div class="fb" id="tfb" aria-live="polite"></div>`;
    else
        h += `${tchips(q)}<div class="psent" id="psent">${frBtn(q)}<span class="pq">${blank(q.q)}</span></div><div class="lopts">${q.opts.map((o, k) => `<button class="opt" data-to="${k}">${esc(optLab(o))}</button>`).join("")}</div><div class="fb" id="tfb" aria-live="polite"></div>`;
    box.innerHTML = h;
    if ((q.irr || q.typed) && !touchOnly())
        setTimeout(() => {
            const i = document.getElementById(q.irr ? "ipt" : "tans");
            if (i)
                try {
                    i.focus({ preventScroll: true });
                }
                catch (e) {
                }
        }, 380);
}
function tFeedback(good, html, sayTxt) {
    const q = TQ.qs[TQ.i], last = TQ.i === TQ.qs.length - 1;
    document.querySelector("#testbody .dots").innerHTML = tdots();
    document.getElementById("tfb").innerHTML = `<p class="verdict ${good === true ? "ok" : good === .5 ? "half" : "ko"}">${good === true ? "YES! WELL DONE!" : good === .5 ? "ALMOST!" : "OOPS!"}</p>${html}<button class="listen next" id="tnext">${last ? "See my mark" : "Next"}${GOSVG}</button>`;
    if (sayTxt)
        sayOne(sayTxt, null);
    const n = document.getElementById("tnext");
    if (n) {
        n.scrollIntoView({ behavior: "smooth", block: "nearest" });
        if (!touchOnly())
            try {
                n.focus({ preventScroll: true });
            }
            catch (e) {
            }
    }
}
function answerMcq(k) {
    const q = TQ.qs[TQ.i];
    if (q.res !== undefined)
        return;
    const good = q.opts[k] === q.o[0];
    q.res = good;
    q.your = q.opts[k];
    if (good)
        TQ.pts++;
    document.querySelectorAll("#testbody .opt").forEach((b, j) => {
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
    tFeedback(good, `<p class="pexp">${esc(q.e || "")}</p>`, fullSent(q));
    tSave();
}
function answerTyped() {
    const q = TQ.qs[TQ.i];
    if (q.res !== undefined)
        return;
    const inp = document.getElementById("tans"), v = inp.value.trim();
    if (!v) {
        inp.focus();
        inp.classList.add("shake");
        setTimeout(() => inp.classList.remove("shake"), 400);
        return;
    }
    let good = tmatch(q, v), apos = false;
    if (!good) {
        const v2 = fixApos(v);
        if (v2 !== v && tmatch(q, v2)) {
            good = true;
            apos = true;
        }
    }
    q.res = good;
    q.your = v;
    if (good)
        TQ.pts++;
    inp.disabled = true;
    inp.classList.add(good ? "right" : "wrong");
    document.getElementById("tcheck").remove();
    document.querySelector("#psent .pq").innerHTML = esc(q.q).replace("___", `<span class="blank fill">${esc(q.a[0])}</span>`) + (q.h ? ` <span class="thint">(${esc(q.h)})</span>` : "");
    tFeedback(good, `${apos ? `<p class="tright">Careful with the apostrophe: <b>${esc(fixApos(v))}</b></p>` : ""}${good ? "" : `<p class="tright">The answer: <b>${esc(q.a[0])}</b>${q.a.length > 1 ? ` <i>(or ${q.a.slice(1).filter(x => !x.startsWith("'")).map(esc).join(", ")})</i>` : ""}</p>`}<p class="pexp">${esc(q.e || "")}</p>`, (q.q.includes("→") ? q.q.split("→").pop() : q.q).replace("___", q.a[0]).replace(/[“”"]/g, ""));
    tSave();
}
function answerIrr() {
    const q = TQ.qs[TQ.i];
    if (q.res !== undefined)
        return;
    const a = document.getElementById("ipt"), b = document.getElementById("ipp");
    if (!a.value.trim() || !b.value.trim()) {
        const e = !a.value.trim() ? a : b;
        e.focus();
        e.classList.add("shake");
        setTimeout(() => e.classList.remove("shake"), 400);
        return;
    }
    const g1 = irrOk(q.d.pt, a.value), g2 = irrOk(q.d.pp, b.value), n = (g1 ? 1 : 0) + (g2 ? 1 : 0);
    TQ.pts += n;
    q.res = n === 2 ? true : n === 1 ? .5 : false;
    q.your = [a.value.trim(), b.value.trim()];
    q.pts = n;
    [[a, g1], [b, g2]].forEach(([e, g]) => {
        e.disabled = true;
        e.classList.add(g ? "right" : "wrong");
    });
    document.getElementById("tcheck").remove();
    tFeedback(q.res, `<div class="irrans"><span class="${g1 ? "ok" : "ko"}">${g1 ? CHECK : CROSS}<i>Past simple</i><b>${esc(q.d.pt)}</b></span><span class="${g2 ? "ok" : "ko"}">${g2 ? CHECK : CROSS}<i>Past participle</i><b>${esc(q.d.pp)}</b></span></div><p class="pexp">${n} point${n > 1 ? "s" : ""} out of 2</p>`, `${q.v}, ${q.d.pt.replace(/ \/ /g, " or ")}, ${q.d.pp.replace(/ \/ /g, " or ")}`);
    tSave();
}
function endTest() {
    const k = TQ.kind, X = TESTS[k], S = TQ.pts, M = TQ.max, P = pct(S, M), note = Math.round(40 * S / M) / 2, pick = note >= 18 ? "v" : note >= 14 ? "knee" : note >= 12 ? "dyn" : "profile", img = END_L[pick] || END_L.dyn;
    const msg = note >= 18 ? "Excellent!" : note >= 14 ? "Great job!" : note >= 10 ? "Well done!" : "Keep working!";
    let best = false, first = false;
    try {
        const p = curProf();
        if (p) {
            p.tests = p.tests || {};
            const o = p.tests[k];
            first = !o;
            best = !!o && note > o.best;
            p.tests[k] = { last: note, best: Math.max(o ? o.best : 0, note), n: (o ? o.n : 0) + 1, t: Date.now(), h: [...((o && o.h) || []), note].slice(-10) };
            p.u = Date.now();
            pSave();
            pPush(p);
        }
    }
    catch (e) {
    }
    let DR = null;
    try {
        DR = recordActivity("test-" + k, TQ.qs.length, P, null, { m: note });
    }
    catch (e) {
    }
    updateTestTile();
    TQ.done = true;
    tClear(k);
    const ws = weekStat(k, testWeeks(8));
    const byL = {};
    if (k !== "irr")
        TQ.qs.forEach(q => {
            const b = byL[q.les] || (byL[q.les] = { n: 0, ok: 0 });
            b.n++;
            if (q.res)
                b.ok++;
        });
    const weak = Object.keys(byL).filter(id => byL[id].ok < byL[id].n);
    const recap = TQ.qs.map(q => q.irr ? `<li class="${q.res === true ? "ok" : "ko"}"><span class="m">${q.res === true ? CHECK : CROSS}</span><b>${esc(q.v)} · ${esc(q.d.pt)} · ${esc(q.d.pp)}</b><i>${q.pts}/2${q.res !== true ? ` · you wrote: ${esc(q.your.join(", "))}` : ""}</i></li>`
        : `<li class="${q.res ? "ok" : "ko"}"><span class="m">${q.res ? CHECK : CROSS}</span><b>${esc(q.typed ? (q.q.includes("→") ? q.q.split("→").pop() : q.q).replace("___", q.a[0]).replace(/[“”"]/g, "").trim() : fullSent(q))}</b><i>${q.res ? "" : `${q.typed ? "you wrote" : "you chose"}: ${esc(optLab(q.your || ""))}`}</i></li>`).join("");
    document.getElementById("testbody").innerHTML = `<p class="qpart">Your mark · ${esc(X.title)}</p><div class="qend"><svg viewBox="0 0 360 300" role="img" aria-label="Kai : your mark is ${n20(note)} out of 20">
<image class="kai${pick === "angry" ? " mad" : ""}" href="img/kai-${pick}.webp" x="${img.x}" y="${img.y}" width="${img.w}" height="${img.h}" preserveAspectRatio="xMidYMax meet"/>
<g class="bb b1"><path d="${bubblePath(img.c, img.r, img.tip)}" fill="#fff" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><text text-anchor="middle">${[["Your mark"], [[n20(note)], "/20"], [msg]].map((rw, j) => `<tspan x="${img.c[0]}" y="${f1(img.c[1] - 20 + 6 + j * 20)}">${rowSvg(rw)}</tspan>`).join("")}</text></g></svg></div>
<div class="pscore"><b>${n20(note)}</b><span>/ 20</span></div>
<p class="goal${note >= 10 ? " ok" : ""}">${k === "irr" ? `${S} good forms out of ${M}` : `${S} good answers out of ${M}`}${best ? " · New best mark!" : ""}</p>
${ws.now ? `<div class="twk"><span>${TSHORT[k]} · my average this week</span><b>${n20(ws.now.avg)}<small>/20</small></b><em>${ws.now.n} test${ws.now.n > 1 ? "s" : ""} this week</em>${deltaHtml(ws)}<button class="ghost sm" data-goprog>See my progress</button></div>` : ""}
${DR && DR.bonus ? `<p class="dban">${BOLT}Bonus activity for today: +1 star!</p>` : ""}
${weak.length ? `<div class="dsec"><h2>To review</h2><span>${weak.length}</span></div><div class="trev">${weak.map(id => `<button class="ghost sm" data-lesson="${id}">${esc(LESSONS[id].title)} <i>${byL[id].ok}/${byL[id].n}</i></button>`).join("")}</div>` : k !== "irr" ? `<p class="dban ok">${CHECK}No mistakes in any lesson. Bravo!</p>` : ""}
<div class="endbtns"><button class="listen" id="tagain">Do it again${GOSVG}</button><button class="ghost" id="tback">My tests</button></div>
<ul class="recap">${recap}</ul>`;
    scrollTo(0, 0);
    if (note === 20)
        try {
            confetti();
        }
        catch (e) {
        }
    try {
        sayOne(`Your mark is ${n20(note)} out of 20! ${msg.charAt(0) + msg.slice(1).toLowerCase()}`, document.querySelector("#testbody .bb"));
    }
    catch (e) {
    }
}
document.getElementById("toTests").addEventListener("click", () => openTests());
document.getElementById("backTs").addEventListener("click", () => show("menu", true));
document.getElementById("testsbody").addEventListener("click", e => {
    const c = e.target.closest("[data-test]");
    if (c) {
        stopSpeech();
        askResume(c.dataset.test);
        return;
    }
    const bb = e.target.closest(".qhead .bb");
    if (bb)
        sayOne("Let's test your English!", bb);
});
function leaveTest() {
    stopSpeech();
    TQ = null;
    renderTests();
    show("tests", true);
}
document.getElementById("backT").addEventListener("click", () => {
    if (!TQ || TQ.done) {
        leaveTest();
        return;
    }
    if (!tDone(TQ)) {
        tClear(TQ.kind);
        leaveTest();
        return;
    }
    tSave();
    confirmModal("Stop for now?", `Your answers are saved (${tDone(TQ)}/${TQ.qs.length}). You can finish the test later: just open it again in <b>My weekly review</b>.`, "Finish later", "Keep going", leaveTest);
});
document.getElementById("testbody").addEventListener("click", e => {
    const t = e.target;
    if (t.closest("[data-fr]")) {
        showFr(TQ.qs[TQ.i]);
        return;
    }
    const o = t.closest("[data-to]");
    if (o) {
        answerMcq(+o.dataset.to);
        return;
    }
    if (t.closest("#tnext")) {
        stopSpeech();
        if (TQ.i < TQ.qs.length - 1) {
            TQ.i++;
            tSave();
            renderTQ();
            scrollTo({ top: 0, behavior: "smooth" });
        }
        else
            endTest();
        return;
    }
    if (t.closest("#tagain")) {
        stopSpeech();
        startTest(TQ.kind);
        scrollTo(0, 0);
        return;
    }
    if (t.closest("#tback")) {
        leaveTest();
        return;
    }
    const ls = t.closest("[data-lesson]");
    if (ls) {
        stopSpeech();
        openLesson(ls.dataset.lesson);
        return;
    }
    const s = t.closest("[data-say]");
    if (s) {
        sayOne(s.dataset.say, s);
        return;
    }
    if (t.closest(".qend .bb"))
        sayOne(t.closest("svg").getAttribute("aria-label").replace(/^Kai : /, ""), t.closest(".bb"));
});
document.getElementById("testbody").addEventListener("submit", e => {
    e.preventDefault();
    if (!TQ)
        return;
    const q = TQ.qs[TQ.i];
    if (q.irr)
        answerIrr();
    else
        answerTyped();
});
document.getElementById("testbody").addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.id === "ipt") {
        e.preventDefault();
        document.getElementById("ipp").focus();
    }
});
updateTestTile();
