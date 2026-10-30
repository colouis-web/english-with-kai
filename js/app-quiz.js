/* Code — tranche de l'ancien index.html (lignes 1213–1350). Script classique : l'ordre des <script> compte. */
"use strict";
/* ===== QUIZ v0.2 : 10 mots dans les deux sens (français → anglais, puis anglais → français) ===== */
let QNUM = 10;
try {
    const v = +localStorage.getItem("kai.qnum");
    if ([5, 10, 20].includes(v))
        QNUM = v;
}
catch (e) {
}
const pct = (s, n) => Math.round(100 * s / Math.max(1, n));
const QPOOL = DICT.filter(d => d.q || d.v === "be" || d.v === "have");
/* phrases où le verbe français pourrait faire penser à un autre verbe anglais */
const QEXCL = new Set(["get:1", "mean:1", "happen:1", "stand:1", "return:1"]);
/* verbes trop proches pour être proposés ensemble */
const QSYN = [["begin", "start"], ["shout", "scream"], ["smell", "feel"], ["hope", "wish"], ["cook", "bake", "boil"], ["wash", "clean"], ["learn", "study", "teach"], ["think", "believe"], ["win", "beat"], ["gather", "pick"], ["rule", "lead"], ["free", "rescue", "save"], ["defend", "protect"], ["destroy", "break"], ["invade", "attack", "conquer"], ["hunt", "catch"], ["march", "walk"], ["end", "finish", "complete"], ["scare", "frighten"], ["mother", "mum"], ["father", "dad"], ["child", "kid"], ["glass", "glasses"], ["below", "under"], ["sun", "sunshine"], ["student", "pupil"], ["fun", "laughter"]];
const QSTOP = new Set(["les", "des", "une", "son", "ses", "sur", "aux", "dans", "avec", "pour", "quelqu", "qqn", "que", "qui", "pas"]);
const PSTOP = new Set(["le", "la", "les", "l", "un", "une", "des", "du", "d", "qn", "s", "t"]);
const frWords = d => d._fw || (d._fw = d.prep ? new Set(d.fr.split("/").map(x => x.replace(/\(.*?\)/g, " ")).join(" ").split(/\s+/).map(norm).flatMap(w => w.split(/[^a-z]+/)).filter(w => w && !PSTOP.has(w))) : new Set(d.fr.split("/").map(x => stripArt(x.replace(/\(.*?\)/g, " "))).join(" ").split(/\s+/).map(norm).flatMap(w => w.split(/[^a-z]+/)).filter(w => w.length >= 3 && !QSTOP.has(w))));
const shuffle = a => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};
const lab = d => (d.modal ? "" : "to ") + d.v;
const firstPl = n => n.pl.split("/")[0].trim();
function qClash(k, a, b) {
    if (a === b)
        return true;
    const A = frWords(a);
    for (const w of frWords(b))
        if (A.has(w))
            return true;
    const ka = a.v || a.w, kb = b.v || b.w;
    return QSYN.some(g => g.includes(ka) && g.includes(kb));
}
/* les 5 sortes de quiz */
const KINDS = {
    verbs: { title: "Quiz verbs", ask: "Which verb is it?", unit: "verb", all: () => QPOOL, inTag: (d, t) => t === "irregular" && d.irr && !d.modal,
        tags: () => [["all", "All verbs", QPOOL.length], ["irregular", "Irregular verbs", QPOOL.filter(d => d.irr && !d.modal).length]], eiOk: (d, i) => !QEXCL.has(d.v + ":" + i) },
    nouns: { title: "Quiz nouns", ask: t => ({ animals: "Which animal is it?", numbers: "Which number is it?", jobs: "Which job is it?", fruitveg: "Which fruit or vegetable is it?", family: "Who is it?" })[t] || "Which noun is it?", unit: "noun", all: () => NDICT, inTag: (n, t) => inCat(n, t),
        tags: () => [["all", "All nouns", NDICT.length], ...Object.keys(NCAT).map(c => [c, NCAT[c].label, NDICT.filter(n => inCat(n, c)).length, NCAT[c].icon])] },
    adjectives: { title: "Quiz adjectives", ask: "Which adjective is it?", unit: "adjective", lex: () => ADJ },
    adverbs: { title: "Quiz adverbs", ask: "Which adverb is it?", unit: "adverb", lex: () => ADV },
    connectors: { title: "Quiz connectors", ask: "Which connector is it?", unit: "connector", lex: () => CON },
    prepositions: { title: "Quiz prepositions", ask: "Which preposition is it?", unit: "preposition", lex: () => PREP },
    mix: { title: "Words of the day", ask: "Which word is it?", unit: "word", all: () => allWords().map(w => w.d), inTag: () => true }
};
const KK = k => KINDS[k];
const kAll = k => KK(k).lex ? KK(k).lex().data : KK(k).all();
const kIn = (k, d, t) => t === "all" || (KK(k).lex ? KK(k).lex().inC(d, t) : KK(k).inTag(d, t));
function kTags(k) {
    const x = KK(k);
    if (x.tags)
        return x.tags();
    const L = x.lex();
    return [["all", "All " + x.unit + "s", L.data.length], ...Object.keys(L.cats).map(c => [c, L.cats[c].label, L.data.filter(d => L.inC(d, c)).length])];
}
const enLabel = (k, o, plural) => k === "verbs" ? lab(o) : k === "nouns" && plural && (o.t === "c" || o.t === "n") ? firstPl(o) : o.w;
const recapLab = (k, d) => k === "verbs" ? lab(d) : k === "nouns" ? (artOf(d) ? artOf(d) + " " : "") + d.w : d.w;
function pickWords(k, tag) {
    if (k === "mix")
        return pickMix(roundSize());
    const x = KK(k), out = [], N = QNUM;
    for (const d of shuffle(kAll(k).filter(d => kIn(k, d, tag)))) {
        if (out.length >= N)
            break;
        const ok = [0, 1].filter(i => !x.eiOk || x.eiOk(d, i));
        if (ok.length)
            out.push({ d, ei: ok[Math.floor(Math.random() * ok.length)] });
    }
    return out;
}
function wrongs(k, tag, d, sent, plural) {
    const all = wPool(k, tag), res = [], STOK = new Set((sent || "").split(/[^a-z]+/));
    for (const x of [...shuffle(all.filter(o => kIn(k, o, tag))), ...shuffle(all)]) {
        if (res.length >= 3)
            break;
        if (res.includes(x) || qClash(k, d, x) || res.some(r => qClash(k, r, x)) || (plural && (x.t === "u" || x.t === "x" || x.t === "d")))
            continue;
        if (sent && [...frWords(x)].some(w => x.prep ? w.length >= 3 && STOK.has(w) : sent.includes(w)))
            continue;
        res.push(x);
    }
    return res;
}
function buildQs(k0, tag0, words) {
    const p1 = [], p2 = [];
    for (const w of shuffle(words)) {
        const { d, ei } = w, k = w.k || k0, tag = w.k ? "all" : tag0, [en, fr] = d.ex[ei], sent = norm(fr.replace(/\*/g, ""));
        let said = enLabel(k, d, false), plural = false;
        if (k === "nouns") {
            const hw = (en.match(/\*(.+?)\*/) || ["", d.w])[1].toLowerCase();
            plural = (d.t === "c" || d.t === "n") && hw !== d.w.toLowerCase();
            if (plural)
                said = d.pl.split("/").map(x => x.trim()).find(x => x.toLowerCase() === hw) || hw;
        }
        const o1 = shuffle([d, ...wrongs(k, tag, d, sent, plural)]), o2 = shuffle([d, ...wrongs(k, tag, d, null, false)]);
        p1.push({ d, k, en, fr, opts: o1, labels: o1.map(o => o === d ? said : enLabel(k, o, plural)), subs: o1.map(o => o.fr), ans: said });
        p2.push({ d, k, en, fr, opts: o2, labels: o2.map(o => o.fr), subs: o2.map(o => o === d ? enLabel(k, d, false) : enLabel(k, o, false)), ans: d.fr });
    }
    return [p1, shuffle(p2)];
}
let QZ = null;
/* découpe la phrase en lignes pour la bulle (le mot à trouver reste en surbrillance) */
let MCTX = null;
function measure(t) {
    try {
        MCTX = MCTX || document.createElement("canvas").getContext("2d");
        MCTX.font = '400 15px "Roboto Condensed","Arial Narrow",Roboto,sans-serif';
        return MCTX.measureText(t).width;
    }
    catch (e) {
        return t.length * 8;
    }
}
function wrapRows(s, maxW) {
    const toks = [];
    let prevEnd = true;
    s.split(/(\*[^*]+\*)/).forEach(seg => {
        if (!seg)
            return;
        const hl = seg[0] === "*", txt = seg.replace(/\*/g, "");
        txt.split(/\s+/).filter(Boolean).forEach((w, k) => toks.push({ w: w.toUpperCase(), hl, glue: k === 0 && toks.length > 0 && !prevEnd && !/^\s/.test(txt) }));
        prevEnd = /\s$/.test(txt);
    });
    const rows = [];
    let cur = [], cw = 0;
    for (const t of toks) {
        const tw = measure(t.w + " ");
        if (cur.length && !t.glue && !/^[!?:;»]+$/.test(t.w) && cw + tw > maxW) {
            rows.push(cur);
            cur = [];
            cw = 0;
        }
        cur.push(t);
        cw += tw;
    }
    if (cur.length)
        rows.push(cur);
    return rows;
}
function rowTok(row) {
    return row.map((t, i) => {
        const sp = i && !t.glue ? " " : "";
        return t.hl ? `<tspan class="hl">${sp}${esc(t.w)}</tspan>` : sp + esc(t.w);
    }).join("");
}
/* rotation des images de Kai : bonne réponse / mauvaise réponse */
const ROT = { good: ["smile", "joy"], bad: ["cry", "grumpy", "cry", "bored"] }, ROTI = { good: 0, bad: 0 };
const nextFace = k => ROT[k][ROTI[k]++ % ROT[k].length];
function headSvg(sentence, face, mood) {
    const rows = wrapRows(sentence, 168), n = rows.length, lh = 18, ry = Math.max(44, n * lh / 2 + 22), cx = 238, H = Math.max(176, 2 * ry + 26), cy = H / 2, rx = 116;
    return `<svg viewBox="0 0 360 ${f1(H)}" role="img" aria-label="Kai : ${esc(plain(sentence))}">
<image class="kai qface${mood ? " " + mood : ""}" href="img/kai-${face}.webp" x="2" y="${f1(H - 150)}" width="122" height="150" preserveAspectRatio="xMidYMax meet"/>
<g class="bb b1 qb"><path d="${bubblePath([cx, cy], [rx, ry], [108, H - 62])}" fill="#fff" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><text text-anchor="middle">${rows.map((r, j) => `<tspan x="${cx}" y="${f1(cy - (n - 1) * lh / 2 + 5 + j * lh)}">${rowTok(r)}</tspan>`).join("")}</text></g></svg>`;
}
const QW = () => document.getElementById("qwrap");
const GOSVG = '<svg class="go" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function dotsHtml() {
    return QZ.qs[QZ.ph].map((q, i) => `<i class="${q.res === true ? "ok" : q.res === false ? "ko" : i === QZ.i ? "cur" : ""}"></i>`).join("");
}
const partLab = ph => (QZ.kind === "mix" ? "Words of the day · " : "") + (ph ? "Part 2 · English → French" : "Part 1 · French → English") + (QZ.attempt > 1 ? ` · Try ${QZ.attempt}` : "");
function renderQ() {
    const ph = QZ.ph, list = QZ.qs[ph], q = list[QZ.i], x = KK(q.k || QZ.kind);
    document.getElementById("qn").textContent = `${QZ.i + 1}/${list.length}`;
    const ask = ph ? "What does it mean in French?" : typeof x.ask === "function" ? x.ask((q.k && q.k !== QZ.kind) || QZ.tag === "all" ? (q.d && q.d.cat) || "all" : QZ.tag) : x.ask;
    QW().innerHTML = `<p class="qpart">${partLab(ph)}</p><div class="dots${QZ.qs[QZ.ph].length > 10 ? " many" : ""}" aria-hidden="true">${dotsHtml()}</div>
<div class="qhead" id="qhead">${headSvg(ph ? q.en : q.fr, "head")}</div>
<p class="qask" id="qask">${ask}</p>
<div class="opts" id="opts">${q.labels.map((l, k) => `<button class="opt${ph ? " fr" : ""}" data-k="${k}">${esc(l)}</button>`).join("")}</div>
<div class="fb" id="fb" aria-live="polite"></div>`;
    if (ph)
        sayOne(plain(q.en), document.querySelector(".qhead .bb"));
}
function answer(k) {
    const ph = QZ.ph, list = QZ.qs[ph], q = list[QZ.i];
    if (q.res !== undefined)
        return;
    const good = q.opts[k] === q.d;
    q.res = good;
    document.querySelectorAll(".opt").forEach((b, j) => {
        b.disabled = true;
        b.insertAdjacentHTML("beforeend", `<small class="otr">${esc(q.subs[j])}</small>`);
        if (q.opts[j] === q.d)
            b.classList.add("right");
        else if (j === k)
            b.classList.add("wrong");
        else
            b.classList.add("dim");
    });
    document.getElementById("qhead").innerHTML = headSvg(ph ? q.en : q.fr, nextFace(good ? "good" : "bad"), good ? "joy" : "sad");
    document.querySelector(".qhead .bb").style.animation = "none";
    document.querySelector(".dots").innerHTML = dotsHtml();
    const PR = ["GREAT!", "WELL DONE!", "YES! PERFECT!", "AWESOME!"], last = QZ.i === list.length - 1;
    document.getElementById("fb").innerHTML = `<p class="verdict ${good ? "ok" : "ko"}">${good ? PR[Math.floor(Math.random() * PR.length)] : `OOPS! IT'S <b>${esc(q.ans.toUpperCase())}</b>`}</p>
<div class="ex"><button class="snd sm" id="qsay" aria-label="Listen to the sentence">${SPK}</button><div><p class="en">${hl(q.en)}</p><p class="fr">${hl(q.fr)}</p></div></div>
<button class="listen next" id="qnext">${last ? (ph ? "See my score" : "Part 2") : "Next"}${GOSVG}</button>`;
    if (!ph)
        sayOne(plain(q.en), document.getElementById("qsay"));
    document.getElementById("qnext").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
/* entre les deux parties */
function renderMid() {
    const N = QZ.qs[0].length, s = QZ.qs[0].filter(q => q.res).length;
    document.getElementById("qn").textContent = "";
    QW().innerHTML = `<p class="qpart">Part 1 done · ${pct(s, N)}%</p><div class="dots${N > 10 ? " many" : ""}" aria-hidden="true">${QZ.qs[0].map(q => `<i class="${q.res ? "ok" : "ko"}"></i>`).join("")}</div>
<div class="qhead">${headSvg("Now the other way round: *English* → *French*!", s >= N * .6 ? "smile" : "head")}</div>
<p class="qask">Same words, now choose the French translation</p>
<button class="listen next mid" id="qp2">Start part 2${GOSVG}</button>`;
    sayOne("Now the other way round!", document.querySelector(".qhead .bb"));
}
/* écran de fin : Kai en colère sous 6/10 de moyenne, sinon une image joyeuse qui change d'une partie à l'autre */
const END_L = { dyn: { x: 20, y: 8, w: 113, h: 286, c: [242, 84], r: [100, 58], tip: [104, 46] }, profile: { x: 252, y: 8, w: 86, h: 286, c: [124, 84], r: [100, 58], tip: [262, 48] },
    joy: { x: 0, y: 96, w: 176, h: 198, c: [268, 72], r: [88, 56], tip: [150, 124] }, angry: { x: 6, y: 70, w: 180, h: 225, c: [272, 74], r: [86, 56], tip: [168, 120] },
    dog: { x: 0, y: 76, w: 206, h: 221, c: [278, 70], r: [80, 54], tip: [182, 104] }, cat: { x: 0, y: 100, w: 230, h: 186, c: [280, 66], r: [78, 52], tip: [178, 112] }, foot: { x: 0, y: 110, w: 250, h: 179, c: [278, 70], r: [80, 52], tip: [190, 98] } };
let ENDI = 0;
function endPick(s, N) {
    if (s < N * .6)
        return "profile";
    if (s === N)
        return ["v", "knee"][ENDI++ % 2];
    if (s >= N * .8)
        return ["knee", "v", "joy"][ENDI++ % 3];
    const pool = QZ.kind === "verbs" ? ["joy", "dyn"] : QZ.kind !== "nouns" ? ["joy", "dyn", "profile"] : QZ.tag === "animals" ? ["dog", "cat", "joy"] : QZ.tag === "sports" ? ["foot", "joy"] : ["joy", "profile"];
    return pool[ENDI++ % pool.length];
}
function renderEnd() {
    const DR = dailyRecord(), N = QZ.qs[0].length, s1 = QZ.qs[0].filter(q => q.res).length, s2 = QZ.qs[1].filter(q => q.res).length, T = s1 + s2, perfect = s1 === N && s2 === N, P = pct(T, 2 * N);
    const msg = perfect ? "PERFECT!" : P >= 80 ? "GREAT JOB!" : P >= 60 ? "WELL DONE!" : "NOT YET!", nfix = QZ.words.filter(({ d }) => !(QZ.qs[0].find(q => q.d === d) || {}).res || !(QZ.qs[1].find(q => q.d === d) || {}).res).length;
    document.getElementById("qn").textContent = "";
    const rows = [["YOU GOT"], [[`${P}%`], "!"], [msg]], pick = endPick(T, 2 * N), img = END_L[pick];
    const r = (ph, d) => QZ.qs[ph].find(q => q.d === d).res, mk = v => `<span class="m ${v ? "ok" : "ko"}">${v ? CHECK : CROSS}</span>`;
    QW().innerHTML = `<p class="qpart">${QZ.attempt > 1 ? `Try ${QZ.attempt}` : "Results"}</p>
<div class="qend"><svg viewBox="0 0 360 300" role="img" aria-label="Kai : you got ${P} percent">
<image class="kai${pick === "angry" ? " mad" : ""}" href="img/kai-${pick}.webp" x="${img.x}" y="${img.y}" width="${img.w}" height="${img.h}" preserveAspectRatio="xMidYMax meet"/>
<g class="bb b1" id="endb"><path d="${bubblePath(img.c, img.r, img.tip)}" fill="#fff" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><text text-anchor="middle">${rows.map((rw, j) => `<tspan x="${img.c[0]}" y="${f1(img.c[1] - 20 + 6 + j * 20)}">${rowSvg(rw)}</tspan>`).join("")}</text></g></svg></div>
<div class="scores"><div class="sc${s1 === N ? " ok" : ""}"><i>French → English</i><b>${pct(s1, N)}%</b><small>${s1} of ${N} words</small></div><div class="sc${s2 === N ? " ok" : ""}"><i>English → French</i><b>${pct(s2, N)}%</b><small>${s2} of ${N} words</small></div></div>
<p class="goal${perfect ? " ok" : ""}">${perfect ? `100% both ways: you know these ${N} words. Well done!` : (P < 60 ? `Not yet! ${nfix} word${nfix > 1 ? "s" : ""} to fix: let's go again, you can do it.` : `Get 100% both ways to unlock new words!`)}</p>
${DR ? `<p class="dban${DR.reached ? " ok" : ""}">${DR.reached ? `${CHECK}Goal reached: ${DR.m} words today! Trophy +3 stars` : DR.bonus ? `${BOLT}Bonus quiz: +1 star!` : `${CHECK}Words of the day: ${Math.min(DR.m, DR.n)}/${DR.n} mastered`}</p>` : ""}
<p class="rleg">FR → EN · EN → FR</p>
<ul class="recap two">${QZ.words.map(({ d, k }) => `<li>${mk(r(0, d))}${mk(r(1, d))}<b>${esc(recapLab(k || QZ.kind, d))}</b><i>${esc(d.fr)}</i></li>`).join("")}</ul>
<div class="endbtns">${perfect ? `<button class="listen" id="qnew">${QZ.kind === "mix" ? "Next words" : "New words"}</button>` : `<button class="listen" id="qagain">Do it again</button>`}${DAILY ? `<button class="ghost" id="qday">My day</button>` : `<button class="ghost" id="qtopics">Topics</button><button class="ghost" id="qmenu">Menu</button>`}</div>`;
    sayOne(P < 60 ? `You got ${P} percent. Not yet! ${nfix} word${nfix > 1 ? "s" : ""} to fix. Let's go again!` : `You got ${P} percent! ${msg.charAt(0) + msg.slice(1).toLowerCase()}`, document.getElementById("endb"));
}
/* choix du thème */
function renderTopics(k) {
    const x = KK(k);
    QZ = { kind: k, qs: [[], []], ph: 0, i: 0, attempt: 1 };
    document.getElementById("qtitle").textContent = x.title;
    document.getElementById("qn").textContent = "";
    const T = kTags(k).filter(t => t[2] >= 5);
    QW().innerHTML = `<div class="qhead">${headSvg("Pick a *topic*!", "head")}</div>
<p class="qask">How many words?</p>
<div class="seg" role="radiogroup" aria-label="Number of words">${[5, 10, 20].map(n => `<button class="${n === QNUM ? "on" : ""}" data-n="${n}" role="radio" aria-checked="${n === QNUM}">${n}</button>`).join("")}</div>
<p class="qask">What do you want to practise?</p>
<div class="topics${T.length > 8 ? " many" : ""}">${T.map(([key, l, c, ic]) => `<button class="topic${ic ? "" : " noi"}" data-tag="${key}">${ic ? `<span class="emo" aria-hidden="true">${ic}</span>` : ""}<span class="tt"><b>${esc(l)}</b><i>${c} words</i></span>${GOSVG}</button>`).join("")}</div>`;
}
function startQuiz(k, tag, words) {
    const again = !!words;
    words = words || pickWords(k, tag);
    const [p1, p2] = buildQs(k, tag, words);
    QZ = { kind: k, tag, words, qs: [p1, p2], ph: 0, i: 0, attempt: again && QZ ? (QZ.attempt || 1) + 1 : 1 };
    document.getElementById("qtitle").textContent = KK(k).title;
    renderQ();
}
[["toQV", "verbs"], ["toQN", "nouns"], ["toQJ", "adjectives"], ["toQA", "adverbs"], ["toQC", "connectors"], ["toQP", "prepositions"]].forEach(([id, k]) => document.getElementById(id).addEventListener("click", () => {
    DAILY = false;
    renderTopics(k);
    show("quiz");
}));
document.getElementById("backQ").addEventListener("click", () => DAILY ? openDaily(true) : show("quizzes", true));
document.getElementById("quiz").addEventListener("click", e => {
    const o = e.target.closest(".opt");
    if (o) {
        answer(+o.dataset.k);
        return;
    }
    const sg = e.target.closest(".seg [data-n]");
    if (sg) {
        QNUM = +sg.dataset.n;
        try {
            localStorage.setItem("kai.qnum", QNUM);
        }
        catch (e) {
        }
        document.querySelectorAll(".seg [data-n]").forEach(b => {
            const on = +b.dataset.n === QNUM;
            b.classList.toggle("on", on);
            b.setAttribute("aria-checked", on);
        });
        return;
    }
    const tp = e.target.closest("[data-tag]");
    if (tp) {
        startQuiz(QZ.kind, tp.dataset.tag);
        scrollTo(0, 0);
        return;
    }
    if (e.target.closest("#qsay")) {
        const q = QZ.qs[QZ.ph][QZ.i];
        sayOne(plain(q.en), document.getElementById("qsay"));
        return;
    }
    if (e.target.closest(".qhead .bb") && QZ.ph === 1 && QZ.qs[1][QZ.i]) {
        sayOne(plain(QZ.qs[1][QZ.i].en), e.target.closest(".bb"));
        return;
    }
    if (e.target.closest("#qnext")) {
        stopSpeech();
        if (QZ.i < QZ.qs[QZ.ph].length - 1) {
            QZ.i++;
            renderQ();
            scrollTo({ top: 0, behavior: "smooth" });
        }
        else if (QZ.ph === 0)
            renderMid();
        else
            renderEnd();
        scrollTo(0, 0);
        return;
    }
    if (e.target.closest("#qp2")) {
        stopSpeech();
        QZ.ph = 1;
        QZ.i = 0;
        renderQ();
        scrollTo(0, 0);
        return;
    }
    if (e.target.closest("#qagain")) {
        stopSpeech();
        startQuiz(QZ.kind, QZ.tag, QZ.words);
        scrollTo(0, 0);
        return;
    }
    if (e.target.closest("#qnew")) {
        stopSpeech();
        startQuiz(QZ.kind, QZ.tag);
        scrollTo(0, 0);
        return;
    }
    if (e.target.closest("#qtopics")) {
        stopSpeech();
        renderTopics(QZ.kind);
        scrollTo(0, 0);
        return;
    }
    if (e.target.closest("#qday")) {
        stopSpeech();
        openDaily(true);
        return;
    }
    if (e.target.closest("#qmenu")) {
        show("quizzes", true);
    }
});
/* pages à venir : travail du jour et grammaire */
function soon(id, sentence, text) {
    document.getElementById(id + "body").innerHTML = `<div class="qhead">${headSvg(sentence, "smile")}</div><div class="soon">${text}</div>`;
    show(id);
}
document.getElementById("backD").addEventListener("click", () => show("menu", true));
