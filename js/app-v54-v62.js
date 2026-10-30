/* Code — tranche de l'ancien index.html (lignes 3068–3681). Script classique : l'ordre des <script> compte. */
"use strict";
/* ===== v54 : démarrage direct sur « Today », durée affichée, série avec un seul tour, partie « Type it », dictée, mémoire des mots visible ===== */
/* --- 1. un élève déjà connu arrive directement sur My daily work › Today (l'écran de Kai reste pour la première visite) --- */
let BOOT2 = false;
(function () {
    const W0 = welcome;
    welcome = function () {
        if (BOOT2) {
            BOOT2 = false;
            DTAB = "today";
            openDaily();
            return;
        }
        W0();
    };
})();
function bootDirect() {
    try {
        if (!PROFS.list.length)
            return;
        if (!curProf() || PROFS.list.length > 1) {
            BOOT2 = true;
            openWho();
            return;
        }
        PICKED = true;
        DTAB = "today";
        openDaily();
    }
    catch (e) {
    }
}
/* --- 2. la série : un seul tour de mots par jour suffit (le trophée reste pour l'objectif complet) --- */
const dayActive = r => !!r && (dayDone(r) || (r.qs || []).some(q => q && (q.k === "mix" || (KINDS[q.k] && !String(q.k).startsWith("lesson-") && !String(q.k).startsWith("test-")))));
streak = function () {
    let k = todayKey(), n = 0;
    if (!dayActive(DST.days[k]))
        k = addDays(k, -1);
    while (dayActive(DST.days[k])) {
        n++;
        k = addDays(k, -1);
    }
    return n;
};
const roundMin = n => Math.max(2, Math.round(n * .3));
/* --- 3. la mémoire des mots : mots à revoir aujourd'hui, mots souvent ratés --- */
function memStats() {
    const t = todayKey(), S = wordState(), A = allWords(), seen = new Set(Object.keys((DST.days[t] || {}).w || {}));
    const lvm = lvOf(curProf()), sOk = key => typeof sensOk !== "function" || sensOk(A.byKey.get(key).k, A.byKey.get(key).d, lvm);
    const due = Object.entries(S).filter(([key, s]) => !seen.has(key) && A.byKey.has(key) && daysBetween(s.last, t) >= INTV[s.b] && sOk(key)).sort((a, b) => a[1].b - b[1].b || a[1].last.localeCompare(b[1].last)).map(([key]) => A.byKey.get(key));
    const miss = {};
    for (const r of Object.values(DST.days))
        for (const [key, w] of Object.entries(r.w || {}))
            if (!w.ok)
                miss[key] = (miss[key] || 0) + 1;
    const often = Object.keys(miss).filter(k => A.byKey.has(k) && sOk(k) && (miss[k] >= 2 || (S[k] && !S[k].ok))).sort((a, b) => miss[b] - miss[a] || String((S[b] || {}).last || "").localeCompare(String((S[a] || {}).last || ""))).slice(0, 12).map(k => ({ w: A.byKey.get(k), m: miss[k], fixed: !!(S[k] && S[k].ok) }));
    return { due, often };
}
function memWords(list) {
    return list.slice(0, 10).map(w => {
        const x = KK(w.k), ok = [0, 1].filter(i => w.d.ex && w.d.ex[i] && (!x.eiOk || x.eiOk(w.d, i)));
        return { d: w.d, ei: ok.length ? ok[Math.floor(Math.random() * ok.length)] : 0, k: w.k };
    });
}
function memCard() {
    let M;
    try {
        M = memStats();
    }
    catch (e) {
        return "";
    }
    const { due, often } = M, nd = due.length;
    const li = o => `<li data-say="${esc(recapLab(o.w.k, o.w.d))}"><span class="kt">${KSHORT[o.w.k] || ""}</span><b>${esc(recapLab(o.w.k, o.w.d))}</b><i>${esc(o.w.d.fr)} <em class="mx">✗ ${o.m}×</em>${o.fixed ? ` <em class="fx">${CHECK}now OK</em>` : ""}</i></li>`;
    return `<div class="dsec"><h2>My memory</h2><span>${nd}</span></div>
<div class="memcard"><div class="memdue"><b>${nd}</b><div><span>word${nd === 1 ? "" : "s"} to review today</span><small>${nd ? "Kai brings back the words you learned just before you forget them. They are in your next rounds, or review them now." : "Nothing to review today. The words you learn come back after 1, 2, 4, 8, 16 and 32 days."}</small></div></div>
${nd ? `<button class="ghost sm" id="drev">Review ${nd > 10 ? "10 of them" : nd === 1 ? "it" : "them"} now · ≈ ${roundMin(Math.min(10, nd))} min</button>` : ""}
${often.length ? `<details class="wd"><summary class="wh ko">Words you often miss <span>${often.length}</span></summary><ul class="wlist ko">${often.map(li).join("")}</ul><button class="listen sm" id="dmiss">Practise only these · ≈ ${roundMin(Math.min(10, often.length))} min${GOSVG}</button></details>` : ""}
<button class="ghost sm" id="ddict">✍ Dictation · ≈ 3 min</button></div>`;
}
document.getElementById("dailybody").addEventListener("click", e => {
    const t = e.target;
    const go = list => {
        if (!list.length)
            return;
        DAILY = true;
        QZ = null;
        startQuiz("mix", "all", memWords(list));
        show("quiz");
        scrollTo(0, 0);
    };
    if (t.closest("#drev")) {
        e.stopPropagation();
        go(memStats().due);
        return;
    }
    if (t.closest("#dmiss")) {
        e.stopPropagation();
        go(memStats().often.map(o => o.w));
        return;
    }
    if (t.closest("#ddict")) {
        e.stopPropagation();
        openDict();
        return;
    }
}, true);
/* --- 4. partie 3 du tour : « Type it » sur les mots ratés --- */
const T3MAX = 5;
const t3Ans = it => {
    const m = String(it.en).match(/\*(.+?)\*/);
    return m ? m[1].trim() : String(it.ans || "");
};
const t3Blank = en => String(en).replace(/\*(.+?)\*/, "_____").replace(/\*/g, "");
const t3Norm = x => String(x || "").toLowerCase().replace(/[’‘`´]/g, "'").replace(/[.,!?;:"«»]/g, " ").replace(/\s+/g, " ").trim();
function t3Ok(v, it) {
    const a = t3Norm(v), e = t3Norm(t3Ans(it));
    if (!a)
        return false;
    if (a === e)
        return true;
    const strip = x => x.replace(/^(a|an|the|to) /, "");
    if (strip(a) === strip(e))
        return true;
    try {
        const A = tvars(a), E = tvars(e);
        if (A.some(x => E.includes(x)))
            return true;
    }
    catch (err) {
    }
    return false;
}
function t3Close(v, it) {
    try {
        return tkLev(t3Norm(v), t3Norm(t3Ans(it)), 2) <= 1;
    }
    catch (e) {
        return false;
    }
}
/* S-08 : une coquille d'une lettre est acceptée (avec l'orthographe affichée) seulement si la réponse attendue a au
   moins T3TYPO_MIN lettres, et si ce que l'élève a tapé n'est PAS un mot anglais connu (« skirt » pour « shirt » reste faux :
   c'est un autre mot, pas une faute de frappe). Réservé à « Type it » : ni les tests notés sur 20, ni la dictée. */
const T3TYPO_MIN = 5;
function t3Typo(v, it) {
    const e = t3Norm(t3Ans(it));
    if (e.replace(/[^a-z]/g, "").length < T3TYPO_MIN)
        return false;
    try {
        if (t3Norm(v).split(" ").every(w => tkKnown(w)))
            return false;
    }
    catch (err) {
    }
    return t3Close(v, it);
}
let XMODE = null; /* "t3" ou "dz" quand la page du quiz sert à écrire */
function startT3() {
    const it = [];
    for (const w of QZ.words) {
        const r0 = (QZ.qs[0].find(q => q.d === w.d) || {}).res, r1 = (QZ.qs[1].find(q => q.d === w.d) || {}).res;
        if (r0 && r1)
            continue;
        const q = QZ.qs[0].find(q => q.d === w.d);
        if (q && /\*(.+?)\*/.test(q.en) && t3Ans(q).split(/\s+/).length <= 3)
            it.push({ d: w.d, k: q.k, en: q.en, fr: q.fr });
        if (it.length >= T3MAX)
            break;
    }
    if (!it.length)
        return false;
    QZ.p3 = { items: it, i: 0, res: [] };
    XMODE = "t3";
    renderX();
    return true;
}
function xDots(X) {
    return `<div class="dots" aria-hidden="true">${X.items.map((x, j) => `<i class="${X.res[j] === true ? "ok" : X.res[j] === false ? "ko" : j === X.i ? "cur" : ""}"></i>`).join("")}</div>`;
}
function renderX() {
    const dz = XMODE === "dz", X = dz ? DZ : QZ.p3, it = X.items[X.i];
    document.getElementById("qn").textContent = `${X.i + 1}/${X.items.length}`;
    QW().innerHTML = `<p class="qpart">${dz ? "Dictation · Listen and type" : (DAILY ? "Words of the day · " : "") + "Part 3 · Type it"}</p>${xDots(X)}
<div class="qhead">${headSvg(dz ? (X.i === 0 ? "Listen and type the *missing* word!" : "Listen again and *type*!") : (X.i === 0 ? "Now *type* the words you missed!" : "Type the *missing* word!"), "head")}</div>
<div class="t3card">${dz ? `<button class="listen sm" id="xsay">${SPK} Listen</button>` : `<p class="t3fr">${hl(it.fr)}</p>`}<p class="t3en">${esc(t3Blank(it.en)).replace(/_____([.,!?;:]*)/, '<span class="bw"><span class="blank" role="img" aria-label="missing word"></span>$1</span>')}</p>${dz ? `<button class="ghost sm" id="xfr" type="button">FR</button><p class="t3fr" id="xfrt" hidden>${hl(it.fr)}</p>` : `<small>${esc(it.d.fr)}</small>`}</div>
<input id="xin" class="t3in" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Type the English word" aria-label="The missing English word">
<button class="listen" id="xcheck">Check${GOSVG}</button><div class="fb" id="xfb" aria-live="polite"></div>`;
    if (dz)
        setTimeout(() => sayOne(plain(it.en), document.getElementById("xsay")), 350);
    setTimeout(() => {
        const i = document.getElementById("xin");
        if (i)
            try {
                i.focus({ preventScroll: true });
            }
            catch (e) {
            }
    }, 250);
}
function xCheck() {
    const dz = XMODE === "dz", X = dz ? DZ : QZ.p3, it = X.items[X.i], inp = document.getElementById("xin");
    if (!inp || X.res[X.i] !== undefined)
        return;
    const v = inp.value;
    if (!v.trim()) {
        inp.classList.add("shake");
        setTimeout(() => inp.classList.remove("shake"), 400);
        return;
    }
    const exact = t3Ok(v, it), typo = !exact && !dz && t3Typo(v, it), ok = exact || typo, ans = t3Ans(it), close = !ok && t3Close(v, it), last = X.i === X.items.length - 1;
    X.res[X.i] = ok;
    inp.disabled = true;
    const cb = document.getElementById("xcheck");
    if (cb)
        cb.remove(); /* S-08 : plus de bouton CHECK une fois la réponse donnée */
    inp.classList.add(ok ? "right" : "wrong");
    document.querySelector("#qwrap .dots").outerHTML = xDots(X);
    document.getElementById("xfb").innerHTML = `<p class="verdict ${ok ? "ok" : "ko"}">${ok ? ["YES!", "PERFECT!", "WELL DONE!"][X.i % 3] : close ? `ALMOST! IT'S <b>${esc(ans.toUpperCase())}</b>` : `IT'S <b>${esc(ans.toUpperCase())}</b>`}</p>${typo ? `<p class="tright">Watch the spelling: <b>${esc(ans)}</b></p>` : ""}
<div class="ex"><button class="snd sm" id="xsay2" aria-label="Listen to the sentence">${SPK}</button><div><p class="en">${hl(it.en)}</p><p class="fr">${hl(it.fr)}</p></div></div>
<button class="listen next" id="xnext">${last ? "See my score" : "Next"}${GOSVG}</button>`;
    sayOne(plain(it.en), document.getElementById("xsay2"));
    document.getElementById("xnext").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function xNext() {
    const dz = XMODE === "dz", X = dz ? DZ : QZ.p3;
    stopSpeech();
    if (X.i < X.items.length - 1) {
        X.i++;
        renderX();
        scrollTo({ top: 0, behavior: "smooth" });
        return;
    }
    if (dz) {
        renderDZEnd();
        return;
    }
    XMODE = null;
    QZ.p3done = true;
    renderEnd();
}
(function () {
    const E1 = renderEnd;
    renderEnd = function () {
        if (QZ && !QZ.p3 && !QZ.p3done && XMODE !== "dz") {
            if (startT3()) {
                scrollTo(0, 0);
                return;
            }
        }
        XMODE = null;
        E1();
        if (QZ && QZ.p3 && QZ.p3.items.length) {
            const P = QZ.p3, n = P.res.filter(Boolean).length, N = P.items.length, sc = document.querySelector("#qwrap .scores");
            if (sc)
                sc.insertAdjacentHTML("afterend", `<p class="dban t3b">✍ Type it: <b>${n}/${N}</b> word${N > 1 ? "s" : ""} typed right</p>`);
        }
    };
})();
(function () {
    const S0 = startQuiz, T0 = renderTopics, R0 = renderQ;
    startQuiz = function (...a) {
        XMODE = null;
        return S0(...a);
    };
    renderTopics = function (k) {
        XMODE = null;
        return T0(k);
    };
    renderQ = function () {
        XMODE = null;
        return R0();
    };
})();
/* --- 5. la dictée : Kai lit la phrase, on tape le mot qui manque --- */
let DZ = null;
function dzPick(n) {
    const A = allWords(), S = wordState(), lv = lvOf(curProf());
    const okW = w => w.d.ex && w.d.ex.length && lvOkWord(w.k, w.d, lv);
    const pool = [...shuffle(A.filter(w => S[w.key] && okW(w))), ...shuffle(A.filter(w => !S[w.key] && okW(w)))], out = [];
    for (const w of pool) {
        if (out.length >= n)
            break;
        const x = KK(w.k);
        const eis = [0, 1].filter(i => w.d.ex[i] && (!x.eiOk || x.eiOk(w.d, i)));
        if (!eis.length)
            continue;
        const [en, fr] = w.d.ex[eis[Math.floor(Math.random() * eis.length)]];
        const m = String(en).match(/\*(.+?)\*/);
        if (!m || m[1].split(/\s+/).length > 3)
            continue;
        out.push({ d: w.d, k: w.k, en, fr });
    }
    return out;
}
function openDict() {
    DAILY = false;
    DZ = { items: dzPick(10), i: 0, res: [] };
    XMODE = "dz";
    document.getElementById("qtitle").textContent = "Dictation";
    show("quiz");
    scrollTo(0, 0);
    renderX();
}
function renderDZEnd() {
    const n = DZ.res.filter(Boolean).length, N = DZ.items.length, P = pct(n, N);
    document.getElementById("qn").textContent = "";
    XMODE = "dzend";
    QW().innerHTML = `<p class="qpart">Dictation · Results</p><div class="qhead">${headSvg(P === 100 ? "*Perfect*! You heard every word!" : P >= 60 ? `Well done! *${n}/${N}* words right!` : `Not yet: *${n}/${N}*. Let's try again!`, P >= 60 ? "smile" : "head")}</div>
<div class="scores"><div class="sc${n === N ? " ok" : ""}"><i>Dictation</i><b>${P}%</b><small>${n} of ${N} words</small></div></div>
<ul class="recap">${DZ.items.map((it, j) => `<li><span class="m ${DZ.res[j] ? "ok" : "ko"}">${DZ.res[j] ? CHECK : CROSS}</span><b>${esc(t3Ans(it))}</b><i>${esc(it.d.fr)}</i></li>`).join("")}</ul>
<div class="endbtns"><button class="listen" id="dzagain">New dictation</button><button class="ghost" id="dzquiz">Quizzes</button><button class="ghost" id="dzday">My day</button></div>`;
    sayOne(P >= 60 ? `Well done! ${n} out of ${N}!` : `${n} out of ${N}. Let's try again!`, document.querySelector("#qwrap .qhead .bb"));
}
document.getElementById("quiz").addEventListener("click", e => {
    if (!XMODE)
        return;
    const t = e.target;
    const stop = () => {
        e.stopPropagation();
        e.preventDefault();
    };
    if (t.closest("#xcheck")) {
        stop();
        xCheck();
        return;
    }
    if (t.closest("#xnext")) {
        stop();
        xNext();
        return;
    }
    if (t.closest("#xsay") || t.closest("#xsay2")) {
        stop();
        const X = XMODE === "dz" ? DZ : QZ.p3, it = X.items[X.i];
        sayOne(plain(it.en), t.closest("button"));
        return;
    }
    if (t.closest("#xfr")) {
        stop();
        const f = document.getElementById("xfrt");
        if (f)
            f.hidden = !f.hidden;
        return;
    }
    if (t.closest("#dzagain")) {
        stop();
        openDict();
        return;
    }
    if (t.closest("#dzquiz")) {
        stop();
        XMODE = null;
        show("quizzes", true);
        return;
    }
    if (t.closest("#dzday")) {
        stop();
        XMODE = null;
        DTAB = "today";
        openDaily(true);
        return;
    }
    if (t.closest(".qhead .bb")) {
        stop();
        if (XMODE === "dz" || XMODE === "t3") {
            const X = XMODE === "dz" ? DZ : QZ.p3, it = X.items[X.i];
            sayOne(plain(it.en), t.closest(".bb"));
        }
    }
}, true);
document.getElementById("quiz").addEventListener("keydown", e => {
    if (e.key !== "Enter" || !XMODE || e.target.id !== "xin")
        return;
    e.preventDefault();
    const X = XMODE === "dz" ? DZ : QZ.p3;
    if (X && X.res[X.i] === undefined)
        xCheck();
    else
        xNext();
});
document.getElementById("toDict").addEventListener("click", openDict);
(function () {
    const B0 = document.getElementById("backQ");
    B0.addEventListener("click", () => {
        if (XMODE === "dz" || XMODE === "dzend") {
            XMODE = null;
        }
    }, true);
})();
setTimeout(bootDirect, 0);
/* ===== v55 : les nouvelles images de Kai — victoire (quiz et tests réussis), « Congrats! » à la place des confettis ===== */
Object.assign(END_L, { v: { x: 8, y: 6, w: 143, h: 288, c: [256, 84], r: [96, 58], tip: [116, 70] }, knee: { x: 0, y: 26, w: 158, h: 270, c: [262, 82], r: [92, 56], tip: [120, 74] } });
function kaiCongrats(title, sub, say) {
    document.querySelectorAll(".congrats").forEach(x => x.remove());
    const box = document.createElement("div");
    box.className = "congrats";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Congrats!");
    box.innerHTML = `<div class="cgbox"><img src="img/kai-congrats.webp" alt="Kai lève le pouce"><div class="cgbub">CONGRATS!</div><p class="cgt">${title}</p><p class="cgs">${sub}</p><button class="listen sm" type="button">Thanks, Kai!</button></div>`;
    box.addEventListener("click", e => {
        if (e.target === box || e.target.closest("button")) {
            stopSpeech();
            box.remove();
        }
    });
    document.body.appendChild(box);
    setTimeout(() => {
        try {
            sayOne(say || "Congrats! You did it!", box.querySelector(".cgbub"));
        }
        catch (e) {
        }
    }, 300);
}
confetti = function () {
    if (LVUP !== null && LV[LVUP])
        kaiCongrats("Level up!", `You are now <b>${LV[LVUP].name}</b>: ${LV[LVUP].words} words a day. Bravo!`, `Congrats! You are now ${LV[LVUP].name}!`);
    else
        kaiCongrats("Today's goal reached!", "You mastered all your words of the day. Trophy +3 stars!", "Congrats! You reached today's goal!");
};
addEventListener("popstate", () => document.querySelectorAll(".congrats").forEach(x => x.remove()));
/* l'objectif du jour atteint à la fin d'un tour : Kai félicite tout de suite */
(function () {
    const E2 = renderEnd;
    renderEnd = function () {
        E2();
        try {
            if (XMODE || !DAILY)
                return;
            const r = dToday();
            if (dayDone(r) && !r.cel && DST.days[r.d]) {
                const c = JSON.parse(JSON.stringify(r));
                c.cel = 1;
                dPut(c);
                LVUP = null;
                setTimeout(() => confetti(), 900);
            }
        }
        catch (e) {
        }
    };
})();
/* v56 : « Which flower is it? » pour le thème des fleurs */
(function () {
    const A0 = KINDS.nouns.ask;
    KINDS.nouns.ask = t => t === "flowers" ? "Which flower is it?" : A0(t);
})();
/* ===== v57 : nouvelles images de Kai, dictée (barre continue), Kai devant la croix quand l'objectif est atteint, propositions des quiz du même domaine ===== */
/* --- 1. les nouvelles images sur les cartes des mots --- */
(function () {
    const add = (o, x) => {
        for (const [k, v] of Object.entries(x))
            if (!o[k])
                o[k] = v;
    };
    add(SCN.v, { cook: "sc-cook", feed: "sc-farm", skate: "sc-skate", juggle: "sc-skate", wash: "sc-handwash", run: "sc-jog", jog: "sc-jog", draw: "sc-sketch", bounce: "sc-dribble", cut: "sc-cook", hit: "sc-tennis", visit: "sc-paris", sell: "sc-bakery", take: "sc-tokyo", catch: "sc-rugby" });
    add(SCN.n, { elephant: "sc-safari", lion: "sc-lions", rugby: "sc-rugby", pizza: "sc-pizza", tennis: "sc-tennis", racket: "sc-tennis", bakery: "sc-bakery", baker: "sc-bakery", bread: "sc-bakery", burger: "sc-burger", chips: "sc-burger",
        turkey: "sc-farm", duck: "sc-farm", hen: "sc-farm", farm: "sc-farm", cheese: "sc-raclette", raclette: "sc-raclette", potato: "sc-raclette", ham: "sc-raclette", taxi: "sc-newyork", skyscraper: "sc-newyork", street: "sc-newyork", city: "sc-newyork",
        bridge: "sc-london", river: "sc-london", tower: "sc-london", tourist: "sc-london", desert: "sc-pyramids", pyramid: "sc-pyramids", sunset: "sc-pyramids", backpack: "sc-pyramids", skateboard: "sc-skate", "skate park": "sc-skate",
        hand: "sc-handwash", soap: "sc-handwash", sink: "sc-handwash", kitchen: "sc-cook", knife: "sc-cook", vegetable: "sc-cook", cook: "sc-chef", chef: "sc-chef", notebook: "sc-sketch", pencil: "sc-sketch", drawing: "sc-sketch",
        camera: "sc-lions", safari: "sc-safari", photo: "sc-tokyo", night: "sc-tokyo", crowd: "sc-tokyo", flag: "sc-paris", capital: "sc-paris", kimono: "sc-kimono", tracksuit: "sc-jog", player: "sc-rugby", harbour: "kai-cross", cross: "kai-cross" });
    add(SCN.j, { Japanese: "sc-kimono", French: "sc-paris", British: "sc-london", American: "sc-newyork", Egyptian: "sc-pyramids", delicious: "sc-pizza", hot: "sc-pyramids", fast: "sc-jog", clean: "sc-handwash", proud: "sc-chef" });
})();
/* --- 2. Let's talk : nouvelles images --- */
TKPICS.push({ img: "sc-raclette", d: "Kai is in a wooden chalet in the mountains. He is eating raclette: melted cheese with potatoes and ham.", q: "What is Kai eating?", k: "raclette,cheese,melted,potato,potatoes,ham,eat,mountains,chalet,dinner,hot,delicious,snow", w: [["melted cheese", "du fromage fondu"], ["potatoes", "des pommes de terre"], ["delicious", "délicieux"]], m: ["Kai is eating raclette.", "He loves cheese with potatoes and ham.", "It is cold outside but the food is hot."] }, { img: "sc-chef", d: "Kai is a chef. He is wearing a white hat and a white jacket, and he is cooking rice in a pan.", q: "What is Kai's job in this picture?", k: "chef,cook,cooking,rice,pan,hat,white,jacket,kitchen,restaurant,job", w: [["a chef", "un chef cuisinier"], ["to cook", "cuisiner"], ["a pan", "une poêle"]], m: ["Kai is a chef.", "He is cooking rice in a pan.", "He is wearing a white hat."] }, { img: "sc-skate", d: "Kai is skateboarding in a skate park and juggling with three balls at the same time.", q: "What is Kai doing?", k: "skate,skateboard,skateboarding,juggle,juggling,balls,skate park,graffiti,trick,same time", w: [["a skateboard", "un skateboard"], ["to juggle", "jongler"], ["at the same time", "en même temps"]], m: ["Kai is skateboarding in the skate park.", "He is juggling with three balls.", "He is very good at sport."] }, { img: "sc-paris", d: "Kai is walking on a big avenue in Paris. Behind him, there is the Arc de Triomphe and there are French flags.", q: "Where is Kai?", k: "paris,france,french,avenue,street,flag,flags,arc,monument,walk,trees,capital", w: [["the capital", "la capitale"], ["a flag", "un drapeau"], ["behind", "derrière"]], m: ["Kai is in Paris.", "He is walking in a big street.", "Paris is the capital of France."] }, { img: "sc-newyork", d: "Kai is walking in a street in New York. There are yellow taxis and very tall skyscrapers.", q: "Where is Kai? What can you see?", k: "new york,usa,america,american,taxi,taxis,skyscraper,skyscrapers,street,city,yellow,tall,buildings", w: [["a skyscraper", "un gratte-ciel"], ["a taxi", "un taxi"], ["tall", "grand, haut"]], m: ["Kai is in New York.", "There are yellow taxis in the street.", "The buildings are very tall."] }, { img: "sc-london", d: "Kai is walking near Tower Bridge in London. The sky is blue.", q: "Where is Kai?", k: "london,england,english,british,uk,bridge,tower,river,thames,walk,sky,blue", w: [["a bridge", "un pont"], ["a river", "une rivière, un fleuve"], ["near", "près de"]], m: ["Kai is in London.", "He is walking near a famous bridge.", "The sky is blue today."] }, { img: "sc-pyramids", d: "Kai is in the desert in Egypt. He is looking at the pyramids at sunset. He has a cap and a backpack.", q: "What is Kai looking at?", k: "egypt,egyptian,pyramid,pyramids,desert,sunset,sand,hot,cap,backpack,look,looking", w: [["the pyramids", "les pyramides"], ["the desert", "le désert"], ["the sunset", "le coucher de soleil"]], m: ["Kai is looking at the pyramids.", "He is in the desert in Egypt.", "It is very hot."] }, { img: "sc-tokyo", d: "Kai is in a busy street in Tokyo at night. He is taking a photo with his phone. There is a big crowd.", q: "What is Kai doing in Tokyo?", k: "tokyo,japan,japanese,night,photo,phone,selfie,crowd,people,lights,street,city,busy", w: [["a crowd", "une foule"], ["to take a photo", "prendre une photo"], ["at night", "la nuit"]], m: ["Kai is in Tokyo at night.", "He is taking a photo with his phone.", "There are a lot of people in the street."] }, { img: "sc-kimono", d: "Kai is wearing a blue kimono in a Japanese garden. He has a fan in his hand.", q: "What is Kai wearing?", k: "kimono,japan,japanese,garden,fan,blue,wear,wearing,trees,traditional", w: [["a kimono", "un kimono"], ["a garden", "un jardin"], ["traditional", "traditionnel"]], m: ["Kai is wearing a blue kimono.", "He is in a Japanese garden.", "He looks calm."] }, { img: "sc-safari", d: "Kai is on a safari in Africa. He is in a jeep and he is looking at an elephant with binoculars.", q: "What animal can Kai see?", k: "safari,africa,elephant,jeep,car,binoculars,look,wild,animal,big,grass", w: [["an elephant", "un éléphant"], ["a safari", "un safari"], ["wild animals", "des animaux sauvages"]], m: ["Kai is on a safari.", "He can see a big elephant.", "He is looking at the elephant from the car."] }, { img: "sc-lions", d: "Kai is in a jeep on a safari. He is taking photos of lions in the grass.", q: "What is Kai doing?", k: "lion,lions,safari,africa,camera,photo,photos,jeep,car,grass,wild,dangerous", w: [["a lion", "un lion"], ["a camera", "un appareil photo"], ["dangerous", "dangereux"]], m: ["Kai is taking photos of lions.", "The lions are in the grass.", "Lions can be dangerous."] }, { img: "sc-rugby", d: "Kai is playing rugby. He is running with the ball and another player is trying to stop him.", q: "What sport is Kai playing?", k: "rugby,ball,run,running,player,team,match,stop,tackle,sport,strong,fast", w: [["to play rugby", "jouer au rugby"], ["a player", "un joueur"], ["to run", "courir"]], m: ["Kai is playing rugby.", "He is running with the ball.", "The other player wants to stop him."] }, { img: "sc-pizza", d: "Kai is in a restaurant. He is taking a slice of pizza from a box. He looks very happy.", q: "What is Kai eating?", k: "pizza,slice,box,restaurant,eat,eating,hungry,delicious,cheese,happy", w: [["a slice", "une part"], ["hungry", "qui a faim"], ["delicious", "délicieux"]], m: ["Kai is eating pizza.", "He is very hungry.", "The pizza looks delicious."] }, { img: "sc-tennis", d: "Kai is playing tennis on a clay court. He is hitting the ball with his racket.", q: "What sport is Kai playing?", k: "tennis,racket,ball,court,hit,hitting,play,shorts,white,sport,match", w: [["a racket", "une raquette"], ["to hit the ball", "frapper la balle"], ["a tennis court", "un court de tennis"]], m: ["Kai is playing tennis.", "He is hitting the ball with his racket.", "He is wearing white shorts."] }, { img: "sc-bakery", d: "Kai is in a bakery. The baker is giving him some bread.", q: "Where is Kai? What is he buying?", k: "bakery,baker,bread,baguette,croissant,buy,buying,shop,give,cakes", w: [["a bakery", "une boulangerie"], ["a baker", "un boulanger"], ["to buy bread", "acheter du pain"]], m: ["Kai is in a bakery.", "He is buying some bread.", "The baker is very nice."] }, { img: "sc-breakdance", d: "Kai is breakdancing in the street. He is upside down on one hand! There is graffiti on the wall.", q: "What is Kai doing?", k: "dance,dancing,breakdance,hand,upside down,street,wall,graffiti,music,cool", w: [["to dance", "danser"], ["upside down", "la tête en bas"], ["a wall", "un mur"]], m: ["Kai is dancing in the street.", "He is standing on one hand.", "He is very good at dancing."] }, { img: "sc-handwash", d: "Kai is washing his hands with soap in the bathroom.", q: "What is Kai doing?", k: "wash,washing,hands,soap,water,sink,bathroom,clean,tap", w: [["to wash your hands", "se laver les mains"], ["soap", "du savon"], ["clean", "propre"]], m: ["Kai is washing his hands.", "He is using soap and water.", "His hands are clean now."] }, { img: "sc-cook", d: "Kai is in the kitchen. He is cutting vegetables on a chopping board with a knife.", q: "What is Kai doing in the kitchen?", k: "kitchen,cook,cooking,cut,cutting,vegetables,knife,board,carrot,pepper,dinner", w: [["to cut", "couper"], ["a knife", "un couteau"], ["vegetables", "des légumes"]], m: ["Kai is in the kitchen.", "He is cutting vegetables with a knife.", "He is cooking dinner."] }, { img: "sc-burger", d: "Kai is eating a big burger in a fast-food restaurant. There are chips on his tray.", q: "What is Kai eating?", k: "burger,hamburger,chips,fries,eat,eating,restaurant,fast food,hungry,tray,drink", w: [["a burger", "un hamburger"], ["chips (UK) / fries (US)", "des frites"], ["hungry", "qui a faim"]], m: ["Kai is eating a big burger.", "There are chips on his tray.", "He is very hungry."] }, { img: "sc-jog", d: "Kai is running in the forest. He is wearing a tracksuit.", q: "What is Kai doing?", k: "run,running,jog,jogging,forest,trees,path,tracksuit,sport,fast,morning", w: [["to run / to jog", "courir"], ["a tracksuit", "un survêtement"], ["the forest", "la forêt"]], m: ["Kai is running in the forest.", "He is wearing a tracksuit.", "He runs every morning."] }, { img: "sc-farm", d: "Kai is on a farm. He is feeding a turkey, some chickens and some ducks.", q: "Where is Kai? Which animals can you see?", k: "farm,feed,feeding,turkey,chickens,chicken,hens,ducks,duck,animals,food", w: [["a farm", "une ferme"], ["to feed", "nourrir"], ["a duck", "un canard"]], m: ["Kai is on a farm.", "He is feeding the animals.", "There is a turkey and two ducks."] }, { img: "kai-cross", d: "Kai is standing on the rocks next to a big stone cross. Behind him, there is the sea, a harbour with boats and a blue sky.", q: "Where is Kai?", k: "cross,stone,sea,rocks,sky,clouds,harbour,boats,stand,standing,blue,village", w: [["a cross", "une croix"], ["the sea", "la mer"], ["rocks", "des rochers"]], m: ["Kai is standing near a stone cross.", "He is next to the sea.", "The sky is blue with white clouds."] });
/* mots des images que le correcteur doit connaître */
["tokyo", "egypt", "japan", "york", "africa", "thames", "eiffel", "triomphe"].forEach(w => TK_NAMES.add(w));
(function () {
    const X = "pan,pans,famous,wooden,melted,slice,slices,upside,tray,graffiti,jeep,binoculars,dribble,dribbles,dribbling,chopping,fries,hamburger,hamburgers,baguette,neon,avenue,chalet,selfie,croissant,croissants,tackle,sketchbook,breakdance,breakdancing,skateboarding,juggling,juggles,juggled,jogging,clay".split(",");
    const K0 = tkKnownSet;
    tkKnownSet = function () {
        const S = K0();
        if (!S._v57) {
            X.forEach(w => S.add(w));
            S._v57 = 1;
        }
        return S;
    };
})();
/* --- 3. dictée et « Type it » : la barre se remplit avec le bon mot --- */
(function () {
    const C0 = xCheck;
    xCheck = function () {
        const X = XMODE === "dz" ? DZ : (QZ && QZ.p3), i = X ? X.i : -1, was = X ? X.res[i] : true;
        C0();
        if (!X || was !== undefined || X.res[i] === undefined)
            return;
        const b = document.querySelector("#qwrap .t3en .blank");
        if (b) {
            b.textContent = t3Ans(X.items[i]);
            b.classList.add("fill");
            if (!X.res[i])
                b.classList.add("ko");
        }
    };
})();
/* --- 4. objectif du jour atteint : Kai devant la croix, « See you tomorrow! » --- */
function crossCard(r) {
    const m = masteredOf(r), n = r.n || target();
    return `<figure class="xcross" id="dcross"><img src="img/kai-cross.webp" alt="Kai devant une croix en pierre, au bord de la mer"><figcaption><b>SEE YOU TOMORROW!</b><span>Today's goal reached · ${Math.min(m, n)}/${n} words. Well done!</span></figcaption></figure>`;
}
document.getElementById("dailybody").addEventListener("click", e => {
    const c = e.target.closest("#dcross");
    if (c)
        sayOne("Well done! You reached today's goal. See you tomorrow!", null);
});
/* --- 5. quiz : les mauvaises réponses viennent du même domaine que la bonne --- */
const VG = {
    move: "go come run walk move leave follow return fall jump dance swim ride climb skate travel visit hurry ski sail dive row march escape flee slide cross camp explore float sink land board rise spin swing jog turn reach arrive",
    body: "stand sit lie rest sleep wake yawn sneeze smile hug kiss clap wave dress brush wash bleed hurt shake point touch bite spit",
    talk: "say tell ask talk speak call shout explain promise joke thank whisper scream sing repeat spell excuse warn answer",
    mind: "think know want need mean believe feel like understand remember decide hope dream forgive worry wish wonder realize learn study teach read write count agree accept plan try seem appear",
    hands: "make take give put keep hold bring find use show open shut cut pull pick drop carry throw catch draw colour build create produce cover tear fold lock type knock hang stick dig mix set add spill sweep tidy pack recycle light juggle",
    food: "eat drink cook bake boil taste smell grind spoil feed",
    money: "buy sell pay spend cost shop book steal win offer serve provide",
    senses: "see look watch hear listen smell taste",
    change: "begin start stop continue become change grow happen end last finish develop die live stay wait freeze burn shine rain snow blow shrink spread",
    fight: "fight attack defend invade conquer surrender destroy beat hunt gather rule invent obey free rescue hide scare seek shoot",
    fun: "play win score celebrate fish date marry joke sing dance camp",
    help: "help support allow let include lead meet name send",
    say_e: "argue claim assert state suggest imply emphasize highlight stress warn urge persuade convince",
    judge_e: "acknowledge admit concede question challenge doubt criticize condemn advocate oppose justify refute prove assume predict",
    show_e: "demonstrate illustrate reveal indicate convey depict portray represent symbolize reflect define outline summarize conclude",
    study_e: "assess examine interpret determine establish",
    effect_e: "ensure enable encourage discourage foster enhance hinder tackle address overcome solve struggle benefit outweigh overlook neglect ignore threaten jeopardize endanger undermine weaken strengthen reinforce entail involve affect influence shape contribute restrict limit ban exploit preserve sustain",
    law: "arrest accuse judge punish sentence forbid ban allow obey vote respect investigate release confess sue defend prove steal rob escape forgive admit",
    death: "die bury mourn pray inherit cry miss remember forget",
    trend_e: "arise emerge persist evolve decline expand prevail matter deserve depend tend obtain gain lack"
};
const VGM = new Map();
for (const [g, l] of Object.entries(VG))
    for (const v of l.split(" "))
        VGM.set(v, [...(VGM.get(v) || []), g]);
function semOf(k, d) {
    try {
        if (!d)
            return [];
        if (d._sem)
            return d._sem;
        let g = [];
        if (k === "nouns")
            g = [d.cat, ...(d.also || [])].filter(Boolean);
        else if (k === "verbs")
            g = VGM.get(d.v) || (d.r && /e/.test(d.r) ? ["effect_e"] : []);
        else {
            const x = KK(k);
            if (x && x.lex) {
                const L = x.lex();
                g = Object.keys(L.cats).filter(c => L.inC(d, c));
            }
        }
        return d._sem = g;
    }
    catch (e) {
        return [];
    }
}
wrongs = function (k, tag, d, sent, plural) {
    const lvw = lvOf(curProf()), pool = wPool(k, tag), full = kAll(k).filter(o => tag !== "all" || typeof sensOk !== "function" || sensOk(k, o, lvw)), S = new Set(semOf(k, d)), same = o => S.size && semOf(k, o).some(c => S.has(c)), inT = o => kIn(k, o, tag), res = [], STOK = new Set((sent || "").split(/[^a-z]+/));
    const easy = o => {
        try {
            return useOf(k, o).f >= 2;
        }
        catch (e) {
            return true;
        }
    };
    const tiers = [pool.filter(o => inT(o) && same(o)), full.filter(o => inT(o) && same(o) && easy(o)), pool.filter(inT), pool, full], seen = new Set();
    for (const T of tiers)
        for (const x of shuffle(T)) {
            if (res.length >= 3)
                return res;
            if (seen.has(x))
                continue;
            seen.add(x);
            if (qClash(k, d, x) || res.some(r => qClash(k, r, x)) || (plural && (x.t === "u" || x.t === "x" || x.t === "d")))
                continue;
            if (sent && [...frWords(x)].some(w => x.prep ? w.length >= 3 && STOK.has(w) : sent.includes(w)))
                continue;
            res.push(x);
        }
    return res;
};
/* ===== v57 : « Do it yourself » — l'élève choisit lui-même ce qu'il révise (mots par thème, grammaire, conjugaison, mots à revoir),
   en QCM, texte à trous ou mélange, 10, 20 ou 30 questions ; une sélection peut être gardée comme « devoir » ===== */
const DYK = [["verbs", "Verbs"], ["nouns", "Nouns"], ["adjectives", "Adjectives"], ["adverbs", "Adverbs"], ["connectors", "Connectors"], ["prepositions", "Prepositions"]];
const DYMODES = [["mcq", "Multiple choice", "Tu choisis la bonne réponse."], ["fill", "Fill in the blanks", "Tu écris le mot qui manque dans la phrase."], ["mix", "Mix", "Un peu des deux."]];
let DY = { sel: new Set(), mode: "mcq", n: 10, view: "build", run: null, del: null };
const dyKey = x => "kai.diy." + x + "." + (PROFS.cur || "x");
const dyBody = () => document.getElementById("dybody");
const dyMin = (n, m) => Math.max(2, Math.round(n * (m === "mcq" ? .3 : m === "fill" ? .5 : .4)));
function dyLoad() {
    DY.sel = new Set();
    try {
        const o = JSON.parse(localStorage.getItem(dyKey("last")) || "null");
        if (o) {
            DY.sel = new Set((o.sel || []).filter(dyValid));
            DY.mode = o.mode || "mcq";
            DY.n = o.n || 10;
        }
    }
    catch (e) {
    }
}
function dySaveLast() {
    try {
        localStorage.setItem(dyKey("last"), JSON.stringify({ sel: [...DY.sel], mode: DY.mode, n: DY.n }));
    }
    catch (e) {
    }
}
function dyHW() {
    try {
        return JSON.parse(localStorage.getItem(dyKey("hw")) || "[]");
    }
    catch (e) {
        return [];
    }
}
function dyHWSet(l) {
    try {
        localStorage.setItem(dyKey("hw"), JSON.stringify(l));
    }
    catch (e) {
    }
}
function dyValid(s) {
    const [t, a, b] = String(s).split(":");
    try {
        if (t === "w")
            return !!KINDS[a] && kTags(a).some(x => x[0] === b);
        if (t === "g")
            return LORDER.grammar.includes(a);
        if (t === "c")
            return LORDER.conj.includes(a);
        return t === "m";
    }
    catch (e) {
        return false;
    }
}
function dyLab(s, short) {
    const [t, a, b] = s.split(":");
    if (t === "w") {
        const T = kTags(a).find(x => x[0] === b), K = (DYK.find(x => x[0] === a) || [a, a])[1];
        if (!T)
            return K;
        if (b === "all" || a === "verbs")
            return T[1];
        return a === "nouns" || short ? T[1] : K + " · " + T[1];
    }
    if (t === "g" || t === "c")
        return LESSONS[a] ? LESSONS[a].title : a;
    return "My words to review";
}
function dyMem() {
    try {
        const M = memStats(), seen = new Set(), out = [];
        for (const w of [...M.due, ...M.often.map(o => o.w)]) {
            const key = w.k + ":" + (w.d.v || w.d.w);
            if (!seen.has(key)) {
                seen.add(key);
                out.push(w);
            }
        }
        return out;
    }
    catch (e) {
        return [];
    }
}
/* --- l'écran de choix --- */
function dyChip(s, l, c, ic) {
    const on = DY.sel.has(s);
    return `<button type="button" class="dyc${on ? " on" : ""}" data-s="${esc(s)}" aria-pressed="${on}">${ic ? `<span class="ic" aria-hidden="true">${ic}</span>` : ""}${esc(l)}${c != null ? `<i>${c}</i>` : ""}</button>`;
}
function dyCount(g) {
    return [...DY.sel].filter(s => s.startsWith(g + ":")).length;
}
function dyFoot() {
    const n = DY.sel.size, m = DY.mode, N = DY.n;
    return `<div class="dysel">${n ? [...DY.sel].map(s => `<button type="button" class="dyx" data-x="${esc(s)}" aria-label="Remove ${esc(dyLab(s))}">${esc(dyLab(s))}<b aria-hidden="true">×</b></button>`).join("") : `<p>Pick at least one topic above.</p>`}</div>
<button class="listen wgo" id="dygo"${n ? "" : " disabled"}><span class="wgl">Start · ${N} questions<small>≈ ${dyMin(N, m)} min</small></span>${GOSVG}</button>
${n ? `<button class="ghost sm" id="dysave" type="button">☆ Save as homework</button><div id="dysf"></div>` : ""}`;
}
function dyRefresh() {
    const f = document.getElementById("dyfoot");
    if (f)
        f.innerHTML = dyFoot();
    document.querySelectorAll("#dybody .dycnt").forEach(x => {
        const c = dyCount(x.dataset.g);
        x.textContent = c ? c + " ✓" : "";
    });
    document.querySelectorAll("#dybody .dyc").forEach(b => {
        const on = DY.sel.has(b.dataset.s);
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", on);
    });
}
function dyBuildView() {
    DY.view = "build";
    DY.run = null;
    document.getElementById("dyqn").textContent = "";
    const hw = dyHW(), mem = dyMem().length;
    const kinds = DYK.map(([k, L]) => {
        const T = kTags(k).filter(t => t[2] >= 5);
        return `<div class="dyk"><p class="dykh">${L}</p><div class="dychips">${T.map(([key, l, c, ic]) => dyChip(`w:${k}:${key}`, l, c, ic)).join("")}</div></div>`;
    }).join("");
    const les = type => `<div class="dychips">${LORDER[type].filter(id => LESSONS[id]).map(id => dyChip(`${type === "grammar" ? "g" : "c"}:${id}`, LESSONS[id].title)).join("")}</div>`;
    dyBody().innerHTML = `<div class="qhead">${headSvg("What do you want to *revise*? You choose!", "head")}</div>
${hw.length ? `<h3 class="dyh">My homework</h3><div class="hwlist">${hw.map(x => `<div class="hwc"><button type="button" class="hwplay" data-hw="${esc(x.id)}"><b>${esc(x.name)}</b><span>${x.sel.length} topic${x.sel.length > 1 ? "s" : ""} · ${(DYMODES.find(m => m[0] === x.mode) || DYMODES[0])[1]} · ${x.n} questions</span></button><button type="button" class="hwdel${DY.del === x.id ? " sure" : ""}" data-del="${esc(x.id)}" aria-label="Delete ${esc(x.name)}">${DY.del === x.id ? "Delete?" : "×"}</button></div>`).join("")}</div>` : ""}
<h3 class="dyh">1 · Choose your topics</h3>
<p class="dytip">Tick everything you need, for example for a test. You can mix words, grammar and conjugation.</p>
${mem ? `<div class="dychips dymem">${dyChip("m:mem", "My words to review", mem, "🧠")}</div>` : ""}
<details class="dyg"><summary><b>Words</b><span class="dycnt" data-g="w"></span></summary>${kinds}</details>
<details class="dyg"><summary><b>Grammar</b><span class="dycnt" data-g="g"></span></summary>${les("grammar")}</details>
<details class="dyg"><summary><b>Conjugation</b><span class="dycnt" data-g="c"></span></summary>${les("conj")}</details>
<h3 class="dyh">2 · How?</h3>
<div class="seg dymode" role="radiogroup" aria-label="Type of questions">${DYMODES.map(([id, l]) => `<button type="button" class="${DY.mode === id ? "on" : ""}" data-mode="${id}" role="radio" aria-checked="${DY.mode === id}">${l}</button>`).join("")}</div>
<p class="dytip" id="dymtip">${DYMODES.find(m => m[0] === DY.mode)[2]}</p>
<h3 class="dyh">3 · How many questions?</h3>
<div class="seg dynum" role="radiogroup" aria-label="Number of questions">${[10, 20, 30].map(n => `<button type="button" class="${DY.n === n ? "on" : ""}" data-num="${n}" role="radio" aria-checked="${DY.n === n}">${n}</button>`).join("")}</div>
<div id="dyfoot"></div>`;
    dyRefresh();
}
/* --- fabriquer les questions --- */
let DYLEM = null;
function dyLemMap() {
    if (DYLEM)
        return DYLEM;
    const M = new Map(), put = (f, v) => {
        f = String(f || "").toLowerCase().trim();
        if (f && !M.has(f))
            M.set(f, v);
    };
    [["am", "be"], ["is", "be"], ["are", "be"], ["was", "be"], ["were", "be"], ["been", "be"], ["being", "be"], ["has", "have"], ["had", "have"], ["having", "have"], ["does", "do"], ["did", "do"], ["done", "do"], ["doing", "do"]].forEach(([f, v]) => put(f, v));
    for (const d of DICT) {
        const v = d.v;
        if (!v || /\s/.test(v))
            continue;
        put(v, v);
        String(d.pt || "").split("/").forEach(f => put(f, v));
        String(d.pp || "").split("/").forEach(f => put(f, v));
        put(/(s|x|z|ch|sh|o)$/.test(v) ? v + "es" : /[^aeiou]y$/.test(v) ? v.slice(0, -1) + "ies" : v + "s", v);
        put(/ie$/.test(v) ? v.slice(0, -2) + "ying" : /[^e]e$/.test(v) ? v.slice(0, -1) + "ing" : v + "ing", v);
        if (/[^aeiou][aeiou][bdgklmnprt]$/.test(v)) {
            put(v + v.slice(-1) + "ing", v);
            put(v + v.slice(-1) + "ed", v);
        }
    }
    return DYLEM = M;
}
const DYAUX = new Set("be have do will would shall can could may might must should".split(" "));
function dyLemOf(o) {
    const M = dyLemMap(), ls = String(o).toLowerCase().replace(/n't\b/g, "").replace(/[^a-z' ]/g, " ").split(/\s+/).filter(Boolean).map(t => M.get(t)).filter(Boolean);
    if (!ls.length)
        return null;
    const main = ls.filter(l => !DYAUX.has(l));
    return main.length ? main[main.length - 1] : ls[ls.length - 1];
}
function dyHint(x, type) {
    const q = x.q || "";
    if ((q.match(/___/g) || []).length !== 1 || q.includes("→") || !x.o || String(x.o[0]).split(/\s+/).length > 3)
        return null;
    if (/\([^)]*\)/.test(q))
        return "";
    if (type === "c") {
        const L = dyLemOf(x.o[0]);
        if (!L)
            return null;
        for (const o of x.o.slice(1)) {
            const l = dyLemOf(o);
            if (l && l !== L)
                return null;
        }
        return L;
    }
    if (x.o.every(o => String(o).split(/\s+/).length <= 2))
        return shuffle(x.o.slice()).join(" / ");
    return null;
}
function dyPrep(s) {
    const [t, a, b] = s.split(":"), P = { s, i: 0, j: 0, c: 0 };
    if (t === "w" || t === "m") {
        const L = t === "m" ? dyMem() : kAll(a).filter(d => kIn(a, d, b)).map(d => ({ d, k: a }));
        P.words = shuffle(L.filter(w => w.d && w.d.ex && w.d.ex.length));
        P.tag = t === "m" ? "all" : b;
        return P;
    }
    const kind = t === "g" ? "grammar" : "conj";
    P.typed = shuffle(((TTYPE[kind] || {})[a] || []).map(x => ({ q: x.q, h: x.h || "", a: x.a, e: x.e, fr: x.fr, i: x.i })));
    const bank = lessonBank(a);
    P.mcq = shuffle(bank.slice());
    P.cvt = shuffle(bank.map(x => {
        const h = dyHint(x, t);
        return h === null ? null : { q: x.q, h, a: [x.o[0]], e: x.e, bank: t === "g" && !!h };
    }).filter(Boolean));
    return P;
}
function dyWordItem(P, want) {
    const w = P.words[P.i++];
    if (!w)
        return null;
    const k = w.k, d = w.d, x = KK(k), eis = [0, 1].filter(i => d.ex[i] && (!x.eiOk || x.eiOk(d, i))), ei = eis.length ? eis[Math.floor(Math.random() * eis.length)] : 0, [en, fr] = d.ex[ei];
    if (want && /\*(.+?)\*/.test(en) && t3Ans({ en }).split(/\s+/).length <= 3)
        return { type: "wt", src: P.s, k, d, en, fr };
    const tag = P.tag !== "all" && kIn(k, d, P.tag) ? P.tag : "all", [p1, p2] = buildQs(k, tag, [{ d, ei }]), dir = Math.random() < .5 ? 0 : 1, q = (dir ? p2 : p1)[0];
    return { type: "wm", src: P.s, dir, tag, ...q };
}
function dyLesItem(P, want) {
    const les = P.s.split(":")[1];
    if (want) {
        const x = P.typed[P.j] || P.cvt[P.c];
        if (x) {
            if (P.typed[P.j])
                P.j++;
            else
                P.c++;
            return { type: "gt", src: P.s, les, ...x };
        }
    }
    const m = P.mcq[P.i++];
    if (m)
        return { type: "gm", src: P.s, les, q: m.q, o: m.o, opts: shuffle(m.o.slice()), e: m.e };
    if (!want) {
        const x = P.typed[P.j] || P.cvt[P.c];
        if (x) {
            if (P.typed[P.j])
                P.j++;
            else
                P.c++;
            return { type: "gt", src: P.s, les, ...x };
        }
    }
    return null;
}
function dyMake(sel, mode, N) {
    const S = shuffle([...sel]), P = S.map(dyPrep), out = [];
    let guard = 0;
    while (out.length < N && guard++ < N * 4) {
        let any = false;
        for (const p of P) {
            if (out.length >= N)
                break;
            const want = mode === "fill" || (mode === "mix" && Math.random() < .5);
            const it = p.words ? dyWordItem(p, want) : dyLesItem(p, want);
            if (it) {
                out.push(it);
                any = true;
            }
        }
        if (!any)
            break;
    }
    return shuffle(out);
}
function dyStart(sel, mode, N) {
    const items = dyMake(sel, mode, N);
    if (!items.length) {
        toast("No questions for these topics yet.", 2200);
        return;
    }
    DY.run = { items, i: 0, res: [], sel: [...sel], mode, n: N };
    DY.view = "run";
    dyRender();
    scrollTo(0, 0);
}
/* --- poser une question --- */
const dyDots = () => {
    const R = DY.run;
    return R.items.map((x, j) => `<i class="${R.res[j] === true ? "ok" : R.res[j] === false ? "ko" : j === R.i ? "cur" : ""}"></i>`).join("");
};
function dyAsk(q) {
    const x = KK(q.k);
    if (q.dir)
        return "What does it mean in French?";
    return typeof x.ask === "function" ? x.ask(q.tag === "all" ? (q.d.cat || "all") : q.tag) : x.ask;
}
function dyRender() {
    const R = DY.run, q = R.items[R.i], N = R.items.length;
    document.getElementById("dyqn").textContent = `${R.i + 1}/${N}`;
    let h = `<p class="qpart">Do it yourself · ${esc(dyLab(q.src, 1))}</p><div class="dots${N > 10 ? " many" : ""}" aria-hidden="true">${dyDots()}</div>`;
    if (q.type === "wm")
        h += `<div class="qhead" id="dyhead">${headSvg(q.dir ? q.en : q.fr, "head", "", q.dir ? "" : "fr")}</div><p class="qask">${dyAsk(q)}</p>
<div class="opts" id="dyopts">${q.labels.map((l, k) => `<button class="opt${q.dir ? " fr" : ""}" data-k="${k}">${esc(l)}</button>`).join("")}</div>`;
    else if (q.type === "wt")
        h += `<div class="qhead">${headSvg(R.i === 0 ? "Type the *missing* word!" : "Write the *English* word!", "head")}</div>
<div class="t3card"><p class="t3fr">${hl(q.fr)}</p><p class="t3en">${esc(t3Blank(q.en)).replace(/_____([.,!?;:]*)/, '<span class="bw"><span class="blank" role="img" aria-label="missing word"></span>$1</span>')}</p><small>${esc(q.d.fr)}</small></div>
<input id="dyin" class="t3in" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Type the English word" aria-label="The missing English word"><button class="listen" id="dycheck">Check${GOSVG}</button>`;
    else if (q.type === "gm")
        h += `<div class="tchips"><span class="tchip">${esc(LESSONS[q.les].title)}</span></div><div class="psent" id="dysent"><span class="pq">${blank(q.q)}</span></div><p class="qask">Choose the right answer</p>
<div class="opts lopts" id="dyopts">${q.opts.map((o, k) => `<button class="opt" data-k="${k}">${esc(o)}</button>`).join("")}</div>`;
    else
        h += `<div class="tchips"><span class="tchip">${esc(LESSONS[q.les].title)}</span><span class="tchip typ">Type your answer</span></div>${q.i ? `<p class="tins">${esc(q.i)}</p>` : ""}
<div class="psent" id="dysent"><span class="pq">${blank(q.q)}</span>${q.h && !q.bank ? ` <span class="thint">(${esc(q.h)})</span>` : ""}</div>${q.bank ? `<p class="dytip">Choose from: <b>${esc(q.h)}</b></p>` : ""}${q.fr ? `<p class="t3fr dyfr">${esc(q.fr)}</p>` : ""}
<input id="dyin" class="t3in" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Type your answer" aria-label="Your answer"><button class="listen" id="dycheck">Check${GOSVG}</button>`;
    dyBody().innerHTML = h + `<div class="fb" id="dyfb" aria-live="polite"></div>`;
    if (q.type === "wm" && q.dir)
        sayOne(plain(q.en), document.querySelector("#dyhead .bb"));
    if (q.type === "wt" || q.type === "gt")
        setTimeout(() => {
            const i = document.getElementById("dyin");
            if (i)
                try {
                    i.focus({ preventScroll: true });
                }
                catch (e) {
                }
        }, 250);
}
const DYPR = ["GREAT!", "WELL DONE!", "YES! PERFECT!", "AWESOME!"];
function dyFeedback(good, html, say) {
    const R = DY.run, last = R.i === R.items.length - 1;
    document.querySelector("#dybody .dots").innerHTML = dyDots();
    document.getElementById("dyfb").innerHTML = html + `<button class="listen next" id="dynext">${last ? "See my score" : "Next"}${GOSVG}</button>`;
    if (say)
        sayOne(say, document.getElementById("dysay"));
    document.getElementById("dynext").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
const dyEx = q => `<div class="ex"><button class="snd sm" id="dysay" aria-label="Listen to the sentence">${SPK}</button><div><p class="en">${hl(q.en)}</p><p class="fr">${hl(q.fr)}</p></div></div>`;
function dyPick(k) {
    const R = DY.run, q = R.items[R.i];
    if (R.res[R.i] !== undefined)
        return;
    if (q.type === "wm") {
        const good = q.opts[k] === q.d;
        R.res[R.i] = good;
        document.querySelectorAll("#dyopts .opt").forEach((b, j) => {
            b.disabled = true;
            b.insertAdjacentHTML("beforeend", `<small class="otr">${esc(q.subs[j])}</small>`);
            if (q.opts[j] === q.d)
                b.classList.add("right");
            else if (j === k)
                b.classList.add("wrong");
            else
                b.classList.add("dim");
        });
        document.getElementById("dyhead").innerHTML = headSvg(q.dir ? q.en : q.fr, nextFace(good ? "good" : "bad"), good ? "joy" : "sad", q.dir ? "" : "fr");
        dyFeedback(good, `<p class="verdict ${good ? "ok" : "ko"}">${good ? DYPR[R.i % 4] : `OOPS! IT'S <b>${esc(String(q.dir ? q.labels[q.opts.indexOf(q.d)] : q.ans).toUpperCase())}</b>`}</p>${dyEx(q)}`, q.dir ? null : plain(q.en));
        return;
    }
    if (q.type === "gm") {
        const good = q.opts[k] === q.o[0];
        R.res[R.i] = good;
        document.querySelectorAll("#dyopts .opt").forEach((b, j) => {
            b.disabled = true;
            if (q.opts[j] === q.o[0])
                b.classList.add("right");
            else if (j === k)
                b.classList.add("wrong");
            else
                b.classList.add("dim");
        });
        if (q.q.includes("___"))
            document.querySelector("#dysent .pq").innerHTML = esc(q.q).replace("___", `<span class="blank fill">${esc(q.o[0])}</span>`);
        dyFeedback(good, `<p class="verdict ${good ? "ok" : "ko"}">${good ? DYPR[R.i % 4] : `OOPS! IT'S <b>${esc(String(q.o[0]).toUpperCase())}</b>`}</p>${q.e ? `<p class="pexp">${esc(q.e)}</p>` : ""}`, fullSent(q));
    }
}
function dyCheck() {
    const R = DY.run, q = R.items[R.i], inp = document.getElementById("dyin");
    if (!inp || R.res[R.i] !== undefined)
        return;
    const v = inp.value.trim();
    if (!v) {
        inp.classList.add("shake");
        setTimeout(() => inp.classList.remove("shake"), 400);
        return;
    }
    inp.disabled = true;
    const btn = document.getElementById("dycheck");
    if (btn)
        btn.remove();
    if (q.type === "wt") {
        const good = t3Ok(v, q), ans = t3Ans(q), close = !good && t3Close(v, q);
        R.res[R.i] = good;
        q.your = v;
        inp.classList.add(good ? "right" : "wrong");
        const b = document.querySelector("#dybody .t3en .blank");
        if (b) {
            b.textContent = ans;
            b.classList.add("fill");
            if (!good)
                b.classList.add("ko");
        }
        dyFeedback(good, `<p class="verdict ${good ? "ok" : "ko"}">${good ? DYPR[R.i % 4] : close ? `ALMOST! IT'S <b>${esc(ans.toUpperCase())}</b>` : `IT'S <b>${esc(ans.toUpperCase())}</b>`}</p>${dyEx(q)}`, plain(q.en));
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
    R.res[R.i] = good;
    q.your = v;
    inp.classList.add(good ? "right" : "wrong");
    document.querySelector("#dysent .pq").innerHTML = esc(q.q).replace("___", `<span class="blank fill${good ? "" : " ko"}">${esc(q.a[0])}</span>`);
    const full = (q.q.includes("→") ? q.q.split("→").pop() : q.q).replace("___", q.a[0]).replace(/[“”"]/g, "").replace(/\s*\([^)]*\)\s*/g, " ").trim();
    dyFeedback(good, `<p class="verdict ${good ? "ok" : "ko"}">${good ? DYPR[R.i % 4] : `IT'S <b>${esc(String(q.a[0]).toUpperCase())}</b>`}</p>${apos ? `<p class="tright">Careful with the apostrophe: <b>${esc(fixApos(v))}</b></p>` : ""}${good ? "" : `<p class="tright"><i>You wrote:</i> ${esc(v)}</p>`}${q.e ? `<p class="pexp">${esc(q.e)}</p>` : ""}`, full);
}
function dyNext() {
    const R = DY.run;
    stopSpeech();
    if (R.i < R.items.length - 1) {
        R.i++;
        dyRender();
        scrollTo({ top: 0, behavior: "smooth" });
        return;
    }
    dyEnd();
}
/* --- le score --- */
function dyCorr(q) {
    if (q.type === "wm" || q.type === "wt")
        return { en: plain(q.en), fr: plain(q.fr) };
    if (q.type === "gm")
        return { en: fullSent(q), fr: q.e || "" };
    return { en: (q.q.includes("→") ? q.q.split("→").pop() : q.q).replace("___", q.a[0]).replace(/[“”"]/g, "").trim(), fr: q.e || "" };
}
function dyEnd() {
    const R = DY.run, N = R.items.length, n = R.res.filter(x => x === true).length, P = pct(n, N);
    DY.view = "end";
    document.getElementById("dyqn").textContent = "";
    const by = {};
    R.items.forEach((q, j) => {
        const b = by[q.src] || (by[q.src] = { ok: 0, n: 0 });
        b.n++;
        if (R.res[j] === true)
            b.ok++;
    });
    const miss = R.items.map((q, j) => ({ q, j })).filter(x => R.res[x.j] !== true), pick = P >= 80 ? "v" : P >= 50 ? "dyn" : "profile";
    dyBody().innerHTML = `<div class="dend">${kaiBig(pick, [["Your score"], [[String(n)], ` / ${N}`], [P >= 80 ? "Great job!" : P >= 50 ? "Good work!" : "Keep trying!"]], `Your score: ${n} out of ${N}. ${P >= 80 ? "Great job!" : P >= 50 ? "Good work!" : "Keep trying!"}`)}</div>
<div class="dytab">${Object.entries(by).map(([s, b]) => `<div class="dyrow"><span>${esc(dyLab(s))}</span><b class="${b.ok === b.n ? "ok" : b.ok * 2 >= b.n ? "" : "ko"}">${b.ok}/${b.n}</b></div>`).join("")}</div>
${miss.length ? `<details class="wd" open><summary class="wh ko">To learn again <span>${miss.length}</span></summary><ul class="dymiss">${miss.map(({ q }) => {
        const c = dyCorr(q);
        return `<li><button class="snd sm" type="button" data-say="${esc(c.en)}" aria-label="Listen">${SPK}</button><div><b>${esc(c.en)}</b>${c.fr ? `<i>${esc(c.fr)}</i>` : ""}${q.your ? `<small>You wrote: ${esc(q.your)}</small>` : ""}</div></li>`;
    }).join("")}</ul></details>` : `<p class="dban">Perfect! No mistakes. 🎉</p>`}
<div class="dyend">${miss.length ? `<button class="listen" id="dyretry">Retry my mistakes · ${miss.length}${GOSVG}</button>` : ""}<button class="${miss.length ? "ghost" : "listen"}" id="dyagain" type="button">New questions, same topics</button><button class="ghost" id="dyedit" type="button">Change my topics</button></div>`;
    scrollTo(0, 0);
    setTimeout(() => sayOne(P >= 80 ? "Great job!" : P >= 50 ? "Good work! Let's practise the mistakes." : "Keep trying! You can do it.", document.querySelector("#dybody .dend .bb")), 400);
}
function dyRetry() {
    const R = DY.run, items = R.items.filter((q, j) => R.res[j] !== true).map(q => {
        const c = { ...q };
        delete c.your;
        if (c.type === "wm") {
            c.opts = shuffle(c.opts.slice());
            const m = new Map(q.opts.map((o, j) => [o, j]));
            c.labels = c.opts.map(o => q.labels[m.get(o)]);
            c.subs = c.opts.map(o => q.subs[m.get(o)]);
        }
        if (c.type === "gm")
            c.opts = shuffle(c.o.slice());
        return c;
    });
    DY.run = { ...R, items: shuffle(items), i: 0, res: [] };
    DY.view = "run";
    dyRender();
    scrollTo(0, 0);
}
/* --- la tuile, la page, les clics --- */
function openDIY() {
    DAILY = false;
    dyLoad();
    DY.del = null;
    dyBuildView();
    show("diy");
}
document.getElementById("toDIY").addEventListener("click", openDIY);
document.getElementById("backDY").addEventListener("click", () => {
    stopSpeech();
    if (DY.view !== "build") {
        dyBuildView();
        scrollTo(0, 0);
    }
    else
        show("ty", true);
});
document.getElementById("dybody").addEventListener("click", e => {
    const t = e.target;
    const c = t.closest(".dyc");
    if (c) {
        const s = c.dataset.s;
        DY.sel.has(s) ? DY.sel.delete(s) : DY.sel.add(s);
        dySaveLast();
        dyRefresh();
        return;
    }
    const x = t.closest(".dyx");
    if (x) {
        DY.sel.delete(x.dataset.x);
        dySaveLast();
        dyRefresh();
        return;
    }
    const md = t.closest(".dymode [data-mode]");
    if (md) {
        DY.mode = md.dataset.mode;
        dySaveLast();
        document.querySelectorAll(".dymode button").forEach(b => {
            const on = b === md;
            b.classList.toggle("on", on);
            b.setAttribute("aria-checked", on);
        });
        document.getElementById("dymtip").textContent = DYMODES.find(m => m[0] === DY.mode)[2];
        dyRefresh();
        return;
    }
    const nm = t.closest(".dynum [data-num]");
    if (nm) {
        DY.n = +nm.dataset.num;
        dySaveLast();
        document.querySelectorAll(".dynum button").forEach(b => {
            const on = b === nm;
            b.classList.toggle("on", on);
            b.setAttribute("aria-checked", on);
        });
        dyRefresh();
        return;
    }
    if (t.closest("#dygo")) {
        if (DY.sel.size)
            dyStart(DY.sel, DY.mode, DY.n);
        return;
    }
    if (t.closest("#dysave")) {
        const f = document.getElementById("dysf");
        if (f.innerHTML) {
            f.innerHTML = "";
            return;
        }
        const d = new Date();
        f.innerHTML = `<form class="dysform" id="dyform"><label for="dyname">Name of this homework</label><input id="dyname" maxlength="40" value="Homework ${d.getDate()}/${d.getMonth() + 1}" autocomplete="off"><button class="listen sm" type="submit">Save</button></form>`;
        const i = document.getElementById("dyname");
        try {
            i.focus();
            i.select();
        }
        catch (e) {
        }
        return;
    }
    const hp = t.closest(".hwplay");
    if (hp) {
        const h = dyHW().find(x => x.id === hp.dataset.hw);
        if (!h)
            return;
        DY.sel = new Set(h.sel.filter(dyValid));
        DY.mode = h.mode;
        DY.n = h.n;
        dySaveLast();
        if (DY.sel.size)
            dyStart(DY.sel, DY.mode, DY.n);
        return;
    }
    const hd = t.closest(".hwdel");
    if (hd) {
        const id = hd.dataset.del;
        if (DY.del === id) {
            dyHWSet(dyHW().filter(x => x.id !== id));
            DY.del = null;
            toast("Homework deleted", 1400);
        }
        else
            DY.del = id;
        dyBuildView();
        return;
    }
    const o = t.closest("#dyopts .opt");
    if (o) {
        dyPick(+o.dataset.k);
        return;
    }
    if (t.closest("#dycheck")) {
        dyCheck();
        return;
    }
    if (t.closest("#dynext")) {
        dyNext();
        return;
    }
    if (t.closest("#dysay")) {
        const q = DY.run && DY.run.items[DY.run.i];
        if (q)
            sayOne(q.type === "wm" || q.type === "wt" ? plain(q.en) : fullSentDY(q), t.closest("button"));
        return;
    }
    const sy = t.closest("[data-say]");
    if (sy) {
        sayOne(sy.dataset.say, sy);
        return;
    }
    if (t.closest("#dyhead .bb")) {
        const q = DY.run && DY.run.items[DY.run.i];
        if (q)
            sayOne(plain(q.dir ? q.en : q.fr), t.closest(".bb"));
        return;
    }
    if (t.closest("#dyretry")) {
        dyRetry();
        return;
    }
    if (t.closest("#dyagain")) {
        dyStart(new Set(DY.run.sel), DY.run.mode, DY.run.n);
        return;
    }
    if (t.closest("#dyedit")) {
        dyBuildView();
        scrollTo(0, 0);
        return;
    }
});
const fullSentDY = q => q.type === "gm" ? fullSent(q) : dyCorr(q).en;
document.getElementById("dybody").addEventListener("submit", e => {
    if (e.target.id !== "dyform")
        return;
    e.preventDefault();
    const name = (document.getElementById("dyname").value || "").trim() || "Homework";
    const l = dyHW();
    l.unshift({ id: Date.now().toString(36), name, sel: [...DY.sel], mode: DY.mode, n: DY.n });
    dyHWSet(l.slice(0, 12));
    toast("Saved! Find it at the top of this page.", 1800);
    dyBuildView();
    scrollTo(0, 0);
});
document.getElementById("dybody").addEventListener("keydown", e => {
    if (e.key !== "Enter" || e.target.id !== "dyin")
        return;
    e.preventDefault();
    const R = DY.run;
    if (!R)
        return;
    if (R.res[R.i] === undefined)
        dyCheck();
    else
        dyNext();
});
/* ===== v58 : les quantifieurs (much, many, several, a few…) : une liste de mots dans Words, une leçon de grammaire, ses exercices ===== */
/* --- 1. la liste des quantifieurs (dans Words, la recherche globale et Do it yourself) --- */
const QTYD = { cats: { count: { label: "Countable" }, uncount: { label: "Uncountable" }, both: { label: "Both" }, each: { label: "All & each" } }, data: [
        { w: "many", fr: "beaucoup de (+ pluriel)", ipa: "ˈmeni", pr: "MÈ-ni", cat: "count", f: 3, ex: [["How *many* sisters have you got?", "*Combien de* sœurs as-tu ?"], ["There aren't *many* people here.", "Il n'y a pas *beaucoup de* monde ici."]] },
        { w: "much", fr: "beaucoup de (+ indénombrable)", ipa: "mʌtʃ", pr: "meutch", cat: "uncount", f: 3, ex: [["I don't have *much* money.", "Je n'ai pas *beaucoup d'*argent."], ["How *much* is it?", "*Combien* ça coûte ?"]] },
        { w: "a lot of", fr: "beaucoup de", ipa: "ə ˈlɒt əv", pr: "eu LOT ov", cat: "both", f: 3, ex: [["Kai has *a lot of* friends.", "Kai a *beaucoup d'*amis."], ["We had *a lot of* snow this winter.", "Nous avons eu *beaucoup de* neige cet hiver."]] },
        { w: "lots of", fr: "plein de, beaucoup de", ipa: "ˈlɒts əv", pr: "LOTS ov", cat: "both", f: 3, r: "i", ex: [["There are *lots of* toys in his room.", "Il y a *plein de* jouets dans sa chambre."], ["*Lots of* love, Kai", "*Plein de* bisous, Kai"]] },
        { w: "plenty of", fr: "largement assez de, plein de", ipa: "ˈplenti əv", pr: "PLÈN-ti ov", cat: "both", f: 2, ex: [["Don't worry, we have *plenty of* time.", "Ne t'inquiète pas, nous avons *largement le* temps."], ["There's *plenty of* food for everybody.", "Il y a *largement assez à* manger pour tout le monde."]] },
        { w: "several", fr: "plusieurs", ipa: "ˈsevrəl", pr: "SÈV-reul", cat: "count", f: 3, ex: [["I have *several* cousins in Spain.", "J'ai *plusieurs* cousins en Espagne."], ["I called you *several* times!", "Je t'ai appelé *plusieurs* fois !"]] },
        { w: "a few", fr: "quelques", ipa: "ə ˈfjuː", pr: "eu FIOU", cat: "count", f: 3, ex: [["I have *a few* friends at school.", "J'ai *quelques* amis au collège."], ["Wait *a few* minutes, please.", "Attends *quelques* minutes, s'il te plaît."]] },
        { w: "few", fr: "peu de (+ pluriel)", ipa: "fjuː", pr: "fiou", cat: "count", f: 2, ex: [["*Few* people know the answer.", "*Peu de* gens connaissent la réponse."], ["There are very *few* trees in the desert.", "Il y a très *peu d'*arbres dans le désert."]] },
        { w: "a couple of", fr: "deux, deux ou trois", ipa: "ə ˈkʌpl əv", pr: "eu KEU-peul ov", cat: "count", f: 2, ex: [["I'll be back in *a couple of* minutes.", "Je reviens dans *deux ou trois* minutes."], ["She has *a couple of* cats.", "Elle a *deux* chats."]] },
        { w: "a little", fr: "un peu de (+ indénombrable)", ipa: "ə ˈlɪtl", pr: "eu LI-teul", cat: "uncount", f: 3, ex: [["Can I have *a little* sugar, please?", "Je peux avoir *un peu de* sucre, s'il te plaît ?"], ["There is *a little* milk left.", "Il reste *un peu de* lait."]] },
        { w: "a bit of", fr: "un peu de", ipa: "ə ˈbɪt əv", pr: "eu BIT ov", cat: "uncount", f: 2, r: "i", ex: [["Do you want *a bit of* cake?", "Tu veux *un peu de* gâteau ?"], ["There's *a bit of* sun today.", "Il y a *un peu de* soleil aujourd'hui."]] },
        { w: "little", fr: "peu de (+ indénombrable)", ipa: "ˈlɪtl", pr: "LI-teul", cat: "uncount", f: 2, ex: [["There is *little* water in the desert.", "Il y a *peu d'*eau dans le désert."], ["We have very *little* time.", "Nous avons très *peu de* temps."]] },
        { w: "some", fr: "du, de la, des ; quelques", ipa: "sʌm", pr: "seum", cat: "both", f: 3, ex: [["There is *some* milk in the fridge.", "Il y a *du* lait dans le frigo."], ["I bought *some* apples.", "J'ai acheté *des* pommes."]] },
        { w: "any", fr: "du, des (question, négation)", ipa: "ˈeni", pr: "È-ni", cat: "both", f: 3, ex: [["Is there *any* milk?", "Est-ce qu'il y a *du* lait ?"], ["I don't have *any* brothers.", "Je n'ai *pas de* frères."]] },
        { w: "no", fr: "pas de, aucun(e)", ipa: "nəʊ", pr: "nô", cat: "both", f: 3, ex: [["There is *no* milk in the fridge.", "Il n'y a *pas de* lait dans le frigo."], ["*No* problem!", "*Pas de* problème !"]] },
        { w: "more", fr: "plus de, davantage de", ipa: "mɔː", pr: "môr", cat: "both", f: 3, ex: [["I want *more* chips!", "Je veux *plus de* frites !"], ["We need *more* time.", "Nous avons besoin de *plus de* temps."]] },
        { w: "most", fr: "la plupart (des) ; le plus de", ipa: "məʊst", pr: "môst", cat: "both", f: 3, ex: [["*Most* children like chocolate.", "*La plupart des* enfants aiment le chocolat."], ["Emma has *the most* points.", "C'est Emma qui a *le plus de* points."]] },
        { w: "enough", fr: "assez de", ipa: "ɪˈnʌf", pr: "i-NEUF", cat: "both", f: 3, ex: [["We don't have *enough* chairs.", "Nous n'avons pas *assez de* chaises."], ["Is there *enough* cake for everybody?", "Est-ce qu'il y a *assez de* gâteau pour tout le monde ?"]] },
        { w: "too much", fr: "trop de (+ indénombrable)", ipa: "tuː ˈmʌtʃ", pr: "tou MEUTCH", cat: "uncount", f: 2, ex: [["You eat *too much* sugar!", "Tu manges *trop de* sucre !"], ["There is *too much* noise.", "Il y a *trop de* bruit."]] },
        { w: "too many", fr: "trop de (+ pluriel)", ipa: "tuː ˈmeni", pr: "tou MÈ-ni", cat: "count", f: 2, ex: [["There are *too many* cars in the city.", "Il y a *trop de* voitures en ville."], ["I have *too many* things to do!", "J'ai *trop de* choses à faire !"]] },
        { w: "less", fr: "moins de (+ indénombrable)", ipa: "les", pr: "lèss", cat: "uncount", f: 2, ex: [["I want *less* homework!", "Je veux *moins de* devoirs !"], ["Drink *less* soda.", "Bois *moins de* soda."]] },
        { w: "fewer", fr: "moins de (+ pluriel)", ipa: "ˈfjuːə", pr: "FIOU-eu", cat: "count", f: 1, ex: [["There are *fewer* students this year.", "Il y a *moins d'*élèves cette année."], ["I made *fewer* mistakes today.", "J'ai fait *moins de* fautes aujourd'hui."]] },
        { w: "all", fr: "tous, toutes ; tout", ipa: "ɔːl", pr: "ôl", cat: "each", f: 3, ex: [["*All* my friends are here.", "*Tous* mes amis sont là."], ["She ate *all* the cake!", "Elle a mangé *tout* le gâteau !"]] },
        { w: "every", fr: "chaque, tous les", ipa: "ˈevri", pr: "ÈV-ri", cat: "each", f: 3, ex: [["I play football *every* day.", "Je joue au foot *tous les* jours."], ["*Every* student has a book.", "*Chaque* élève a un livre."]] },
        { w: "each", fr: "chaque ; chacun(e)", ipa: "iːtʃ", pr: "îtch", cat: "each", f: 2, ex: [["*Each* child gets a present.", "*Chaque* enfant reçoit un cadeau."], ["The tickets cost 5 euros *each*.", "Les billets coûtent 5 euros *chacun*."]] },
        { w: "both", fr: "les deux", ipa: "bəʊθ", pr: "bôth", cat: "each", f: 2, ex: [["*Both* my parents work.", "*Mes deux* parents travaillent."], ["I like *both* colours.", "J'aime *les deux* couleurs."]] },
        { w: "none", fr: "aucun(e)", ipa: "nʌn", pr: "neunn", cat: "each", f: 2, ex: [["*None* of my friends can come.", "*Aucun* de mes amis ne peut venir."], ["How many sweets are left? – *None*!", "Combien de bonbons reste-t-il ? – *Aucun* !"]] }
    ] };
LEXKIND.qty = "quantifiers";
const QTY = makeLex({ id: "qty", unit: "quantifier", data: QTYD.data, cats: QTYD.cats });
document.getElementById("toQty").addEventListener("click", () => {
    QTY.open();
    show("quantifiers");
});
document.getElementById("backQt").addEventListener("click", () => show("words", true));
WCATS.push({ k: "qty", lab: "Quantifiers", lex: QTY });
Object.assign(KINDS, { quantifiers: { title: "Quiz quantifiers", ask: "Which quantifier is it?", unit: "quantifier", lex: () => QTY } });
Object.assign(KSHORT, { quantifiers: "quant." });
DYK.push(["quantifiers", "Quantifiers"]);
(function () {
    const K0 = tkKnownSet;
    tkKnownSet = function () {
        const S = K0();
        if (!S._v58) {
            "several plenty none fewer couple".split(" ").forEach(w => S.add(w));
            S._v58 = 1;
        }
        return S;
    };
})();
/* --- 2. la leçon de grammaire « Quantifiers » --- */
LESSONS.quant = { id: "quant", type: "grammar", title: "Quantifiers", fr: "beaucoup, plusieurs, peu…", sub: "much · many · a lot of · several · a few · more", say: "How *much*? How *many*? Let's learn the quantifiers!", img: "smile", practice: [],
    intro: "Pour dire <b>combien</b> il y a de choses, l'anglais utilise des petits mots : les <b>quantifieurs</b> (beaucoup de, plusieurs, peu de, assez de…). Pour bien choisir, demande-toi si le nom se <b>compte</b> (apples, friends, cars) ou <b>ne se compte pas</b> (water, money, time, bread).",
    sections: [
        { t: "table", h: "1 · Avec un nom au pluriel (on peut compter)", cols: ["En français", "En anglais"], say: [1], rows: [
                ["beaucoup de", "many friends / a lot of friends"], ["plusieurs", "several friends"], ["quelques", "a few friends"], ["peu de (presque pas)", "few friends"],
                ["plus de", "more friends"], ["moins de", "fewer friends"], ["trop de", "too many friends"], ["assez de", "enough friends"], ["des", "some friends"]
            ] },
        { t: "table", h: "2 · Avec un nom qui ne se compte pas", cols: ["En français", "En anglais"], say: [1], rows: [
                ["beaucoup de", "much water / a lot of water"], ["un peu de", "a little water"], ["peu de (presque pas)", "little water"], ["plus de", "more water"],
                ["moins de", "less water"], ["trop de", "too much water"], ["assez de", "enough water"], ["du, de la", "some water"]
            ],
            rule: "<b>Many</b>, <b>several</b>, <b>a few</b>, <b>few</b>, <b>fewer</b>, <b>too many</b> → avec un nom au <b>pluriel</b>. <b>Much</b>, <b>a little</b>, <b>little</b>, <b>less</b>, <b>too much</b> → avec un nom qui <b>ne se compte pas</b>. <b>A lot of</b>, <b>some</b>, <b>more</b>, <b>enough</b>, <b>no</b> → avec les deux." },
        { t: "ex", h: "3 · much ou many ?", rule: "Dans une phrase affirmative, on dit plutôt <b>a lot of</b> : I have <b>a lot of</b> friends. <b>Much</b> et <b>many</b> s'emploient surtout dans les <b>questions</b> et les <b>négations</b>.", items: [
                ["How *many* brothers have you got?", "*Combien de* frères as-tu ?", "many + pluriel"], ["How *much* money have you got?", "*Combien d'*argent as-tu ?", "much + indénombrable"],
                ["There aren't *many* shops in my village.", "Il n'y a pas *beaucoup de* magasins dans mon village."], ["I don't drink *much* milk.", "Je ne bois pas *beaucoup de* lait."]
            ] },
        { t: "ex", h: "4 · a lot of, lots of, plenty of", items: [["Kai has *a lot of* friends.", "Kai a *beaucoup d'*amis."], ["There is *lots of* snow today.", "Il y a *plein de* neige aujourd'hui.", "lots of = a lot of, plus familier"],
                ["Don't worry, we have *plenty of* time.", "Ne t'inquiète pas, nous avons *largement le* temps.", "plenty of = largement assez"]] },
        { t: "ex", h: "5 · several, a few, few", items: [["I have *several* cousins in Spain.", "J'ai *plusieurs* cousins en Espagne.", "several = plusieurs"], ["I have *a few* friends at school.", "J'ai *quelques* amis au collège.", "a few = quelques (c'est positif)"],
                ["*Few* people know the answer.", "*Peu de* gens connaissent la réponse.", "few = peu, presque pas (c'est négatif)", 1]] },
        { t: "ex", h: "6 · a little, little", items: [["Can I have *a little* sugar, please?", "Je peux avoir *un peu de* sucre, s'il te plaît ?", "a little = un peu (c'est positif)"], ["There is *little* water in the desert.", "Il y a *peu d'*eau dans le désert.", "little = peu, presque pas (c'est négatif)", 1]] },
        { t: "ex", h: "7 · more, most, less, enough, too much", items: [["I want *more* chips!", "Je veux *plus de* frites !"], ["*Most* children like chocolate.", "*La plupart des* enfants aiment le chocolat.", "most + nom, sans the"],
                ["I want *less* homework!", "Je veux *moins de* devoirs !"], ["We don't have *enough* chairs.", "Nous n'avons pas *assez de* chaises."], ["You eat *too much* sugar!", "Tu manges *trop de* sucre !"], ["There are *too many* cars in the city.", "Il y a *trop de* voitures en ville."]] },
        { t: "ex", h: "8 · some, any, no", rule: "<b>Some</b> dans une phrase affirmative, <b>any</b> dans une question ou une négation. <b>No</b> = not any.", items: [
                ["There is *some* milk in the fridge.", "Il y a *du* lait dans le frigo.", "phrase affirmative"], ["Is there *any* milk?", "Est-ce qu'il y a *du* lait ?", "question"], ["There isn't *any* milk. = There is *no* milk.", "Il n'y a *pas de* lait.", "négation"]
            ] },
        { t: "ex", h: "9 · all, every, each, both", items: [["*All* my friends are here.", "*Tous* mes amis sont là.", "all + pluriel"], ["I play football *every* day.", "Je joue au foot *tous les* jours.", "every + singulier"],
                ["*Each* child gets a present.", "*Chaque* enfant reçoit un cadeau."], ["*Both* my parents work.", "*Mes deux* parents travaillent.", "both = les deux"]] },
        { t: "traps", h: "10 · Attention aux pièges !", intro: "Les erreurs typiques des francophones :", rows: [["J'ai beaucoup d'amis.", "I have *a lot of* friends.", "I have much friends."], ["Combien de pommes ?", "How *many* apples?", "How much apples?"],
                ["plusieurs fois", "*several* times", "severals times"], ["J'ai peu d'argent.", "I have *little* money.", "I have few money."], ["Il y a trop de gens.", "There are *too many* people.", "There are too much people."],
                ["La plupart des élèves", "*Most* students", "The most of students"], ["Tous les jours", "*Every* day", "All the days"]] }
    ] };
{
    const i = LORDER.grammar.indexOf("plurals");
    LORDER.grammar.splice(i + 1, 0, "quant");
}
/* --- 3. les exercices (QCM) et les questions à écrire --- */
LBANK.quant = [
    ["How ___ brothers have you got?", "many", "much", "lot", "Brothers se compte → many.", "Combien de frères as-tu ?"],
    ["How ___ money do you have?", "much", "many", "few", "L'argent ne se compte pas → much.", "Combien d'argent as-tu ?"],
    ["I don't drink ___ milk.", "much", "many", "several", "Milk ne se compte pas → much.", "Je ne bois pas beaucoup de lait."],
    ["There aren't ___ shops in my village.", "many", "much", "little", "Shops est au pluriel → many.", "Il n'y a pas beaucoup de magasins dans mon village."],
    ["Kai has ___ friends at school.", "a lot of", "much", "a little", "Phrase affirmative → a lot of.", "Kai a beaucoup d'amis au collège."],
    ["There is ___ snow on the mountain.", "a lot of", "many", "several", "Snow ne se compte pas, phrase affirmative → a lot of.", "Il y a beaucoup de neige sur la montagne."],
    ["I have ___ cousins in Spain: five or six!", "several", "much", "a little", "Plusieurs → several (+ pluriel).", "J'ai plusieurs cousins en Espagne : cinq ou six !"],
    ["We stayed in London for ___ days.", "a few", "a little", "much", "Days se compte → a few.", "Nous sommes restés quelques jours à Londres."],
    ["Can I have ___ sugar in my tea, please?", "a little", "a few", "many", "Sugar ne se compte pas → a little.", "Je peux avoir un peu de sucre dans mon thé, s'il te plaît ?"],
    ["___ people know the answer: it's very difficult!", "Few", "Little", "Much", "People est au pluriel ; presque personne → few.", "Peu de gens connaissent la réponse : c'est très difficile !"],
    ["There is ___ water in the desert.", "little", "few", "many", "Water ne se compte pas ; presque pas → little.", "Il y a peu d'eau dans le désert."],
    ["I want ___ chips, please!", "more", "most", "much", "Plus de → more.", "Je veux plus de frites, s'il te plaît !"],
    ["___ children like chocolate.", "Most", "The most of", "More of", "La plupart des → most (sans the).", "La plupart des enfants aiment le chocolat."],
    ["We don't have ___ chairs for everybody.", "enough", "much", "little", "Assez de → enough.", "Nous n'avons pas assez de chaises pour tout le monde."],
    ["You eat ___ sugar! It's bad for your teeth.", "too much", "too many", "enough of", "Sugar ne se compte pas → too much.", "Tu manges trop de sucre ! C'est mauvais pour tes dents."],
    ["There are ___ cars in the city centre.", "too many", "too much", "a little", "Cars est au pluriel → too many.", "Il y a trop de voitures dans le centre-ville."],
    ["There is ___ milk in the fridge.", "some", "any", "many", "Phrase affirmative → some.", "Il y a du lait dans le frigo."],
    ["Are there ___ apples in the bag?", "any", "much", "a little", "Question → any.", "Est-ce qu'il y a des pommes dans le sac ?"],
    ["There isn't ___ juice in the bottle.", "any", "some", "many", "Négation → any.", "Il n'y a pas de jus dans la bouteille."],
    ["There is ___ money in my wallet: it's empty!", "no", "any", "some", "Pas de → no (= not any).", "Il n'y a pas d'argent dans mon portefeuille : il est vide !"],
    ["Don't hurry, we have ___ time.", "plenty of", "many", "few", "Largement assez de → plenty of.", "Ne te presse pas, nous avons largement le temps."],
    ["How ___ is this T-shirt? – 15 euros.", "much", "many", "lot", "Pour un prix : How much…?", "Combien coûte ce T-shirt ? – 15 euros."],
    ["I've got ___ homework tonight.", "a lot of", "many", "several", "Homework ne se compte pas → a lot of.", "J'ai beaucoup de devoirs ce soir."],
    ["She has ___ books in her room: about 200!", "lots of", "much", "a little", "Books au pluriel, phrase affirmative → lots of.", "Elle a plein de livres dans sa chambre : environ 200 !"],
    ["There were ___ people at the concert: only ten.", "few", "little", "a lot of", "People au pluriel ; presque personne → few.", "Il y avait peu de gens au concert : seulement dix."],
    ["I have ___ ideas for the project: three or four.", "a few", "a little", "much", "Ideas se compte → a few.", "J'ai quelques idées pour le projet : trois ou quatre."],
    ["Add ___ salt to the soup.", "a little", "a few", "many", "Salt ne se compte pas → a little.", "Ajoute un peu de sel dans la soupe."],
    ["We need ___ eggs for the cake.", "some", "any", "much", "Phrase affirmative, eggs au pluriel → some.", "Il nous faut des œufs pour le gâteau."],
    ["I don't have ___ brothers or sisters.", "any", "some", "no", "Avec don't → any (pas de double négation).", "Je n'ai pas de frères ni de sœurs."],
    ["How ___ students are there in your class?", "many", "much", "lot of", "Students au pluriel → many.", "Combien d'élèves y a-t-il dans ta classe ?"],
    ["I'd like ___ information about the trip.", "some", "a few", "many", "Information ne se compte pas en anglais → some.", "J'aimerais des informations sur la sortie."],
    ["There's ___ traffic this morning.", "a lot of", "many", "several", "Traffic ne se compte pas → a lot of.", "Il y a beaucoup de circulation ce matin."],
    ["My dad doesn't have ___ free time.", "much", "many", "few", "Time ne se compte pas → much.", "Mon père n'a pas beaucoup de temps libre."],
    ["There are ___ mistakes in your test: only two!", "a few", "a little", "much", "Mistakes se compte → a few.", "Il y a quelques fautes dans ton contrôle : seulement deux !"],
    ["We have ___ milk left: we must buy some.", "little", "few", "a lot of", "Milk ne se compte pas ; presque plus → little.", "Il nous reste peu de lait : il faut en acheter."],
    ["She has ___ dogs: three!", "several", "much", "a little", "Plusieurs → several.", "Elle a plusieurs chiens : trois !"],
    ["___ my friends play football.", "Most of", "Most", "The most", "Avec my, the… → most of.", "La plupart de mes amis jouent au foot."],
    ["I've got ___ money than you.", "more", "most", "much more of", "Plus de… que → more… than.", "J'ai plus d'argent que toi."],
    ["Who has ___ points? – Emma, she won!", "the most", "the more", "more of", "Le plus de → the most.", "Qui a le plus de points ? – Emma, elle a gagné !"],
    ["There aren't ___ trees in the city.", "many", "much", "a little", "Trees au pluriel → many.", "Il n'y a pas beaucoup d'arbres en ville."],
    ["Is there ___ coffee left?", "any", "many", "few", "Question → any.", "Est-ce qu'il reste du café ?"],
    ["We have ___ pencils for everyone: 30!", "enough", "too", "much", "Assez de → enough.", "Nous avons assez de crayons pour tout le monde : 30 !"],
    ["He drinks ___ coffee: five cups a day!", "too much", "too many", "a few", "Coffee ne se compte pas → too much.", "Il boit trop de café : cinq tasses par jour !"],
    ["I've read ___ books this year: about twenty.", "a lot of", "a little", "much", "Books au pluriel, phrase affirmative → a lot of.", "J'ai lu beaucoup de livres cette année : une vingtaine."],
    ["___ student has a book.", "Every", "All", "Many of", "Every + nom au singulier.", "Chaque élève a un livre."],
    ["___ the students are in the playground.", "All", "Every", "Each", "All + the + pluriel.", "Tous les élèves sont dans la cour."],
    ["There is ___ juice in my glass, just a bit.", "a little", "many", "a few", "Juice ne se compte pas ; un peu → a little.", "Il y a un peu de jus dans mon verre, juste un peu."],
    ["How ___ times have you been to Paris?", "many", "much", "lot", "Times (fois) au pluriel → many.", "Combien de fois es-tu allé à Paris ?"],
    ["I spent ___ money at the fair.", "too much", "too many", "a few", "Money ne se compte pas → too much.", "J'ai dépensé trop d'argent à la fête foraine."],
    ["There are ___ students this year than last year.", "fewer", "less", "little", "Moins de + pluriel → fewer.", "Il y a moins d'élèves cette année que l'année dernière."]
].map(([q, a, b, c, e, fr]) => ({ q, o: [a, b, c], e, fr, t: "qty" }));
TTYPE.grammar.quant = [
    { q: "How ___ apples do you want?", h: "combien de", a: ["many"], fr: "Combien de pommes veux-tu ?", e: "Apples se compte → many.", i: "Complète avec much ou many." },
    { q: "How ___ water do you drink every day?", h: "combien de", a: ["much"], fr: "Combien d'eau bois-tu chaque jour ?", e: "Water ne se compte pas → much.", i: "Complète avec much ou many." },
    { q: "I have ___ friends in my class.", h: "beaucoup de", a: ["a lot of", "lots of", "many"], fr: "J'ai beaucoup d'amis dans ma classe.", e: "Phrase affirmative → a lot of.", i: "Traduis « beaucoup de »." },
    { q: "There are ___ books on the shelf.", h: "plusieurs", a: ["several"], fr: "Il y a plusieurs livres sur l'étagère.", e: "Plusieurs → several, sans -s.", i: "Traduis « plusieurs »." },
    { q: "Can I have ___ milk, please?", h: "un peu de", a: ["a little", "some", "a bit of"], fr: "Je peux avoir un peu de lait, s'il te plaît ?", e: "Milk ne se compte pas → a little.", i: "Traduis « un peu de »." },
    { q: "I have ___ questions for you.", h: "quelques", a: ["a few", "some"], fr: "J'ai quelques questions pour toi.", e: "Questions se compte → a few.", i: "Traduis « quelques »." },
    { q: "There isn't ___ bread left.", h: "du", a: ["any"], fr: "Il ne reste pas de pain.", e: "Négation → any.", i: "Complète avec some ou any." },
    { q: "You eat ___ sweets!", h: "trop de", a: ["too many"], fr: "Tu manges trop de bonbons !", e: "Sweets au pluriel → too many.", i: "Traduis « trop de »." },
    { q: "We don't have ___ time.", h: "assez de", a: ["enough"], fr: "Nous n'avons pas assez de temps.", e: "Assez de → enough.", i: "Traduis « assez de »." },
    { q: "I want ___ ice cream, please!", h: "plus de", a: ["more", "some more"], fr: "Je veux plus de glace, s'il te plaît !", e: "Plus de → more.", i: "Traduis « plus de »." }
];
/* ===== v59 : la tuile « Test yourself » regroupe Quiz, Do it yourself et Let's talk English ===== */
document.getElementById("toTY").addEventListener("click", () => show("ty"));
document.getElementById("backTY").addEventListener("click", () => show("menu", true));
/* Kai qui saute de joie : image entière (avec les pieds) */
END_L.joy = { x: 0, y: 64, w: 200, h: 230, c: [270, 62], r: [88, 56], tip: [176, 104] };
/* ===== v62 : « Test 6th grade » — les contrôles de la classe : la liste de mots, puis un test à écrire dans les deux sens ===== */
(function () {
    const A0 = KINDS.nouns.ask;
    KINDS.nouns.ask = t => t === "countries" ? "Which country is it?" : A0(t);
})();
"india australia scotland wales ireland spain italy germany canada china japan brazil mexico egypt belgium switzerland portugal".split(" ").forEach(w => TK_NAMES.add(w));
/* --- les contrôles : [anglais affiché, français affiché, autres réponses anglaises, autres réponses françaises] --- */
const T6 = [{ id: "u1", date: "2026-11-02", title: "Unit 1 · My world", sub: "Colours, personality, pets and animals, countries, identity", sections: [
            { h: "Colours", w: [["blue", "bleu", [], ["bleue"]], ["green", "vert", [], ["verte"]], ["pink", "rose"], ["orange", "orange"], ["brown", "marron", [], ["brun", "brune"]], ["yellow", "jaune"],
                    ["red", "rouge"], ["white", "blanc", [], ["blanche"]], ["grey", "gris", ["gray"], ["grise"]], ["black", "noir", [], ["noire"]], ["purple", "violet", [], ["violette"]]] },
            { h: "Personality and other characteristics", w: [["adorable", "adorable", ["cute"]], ["intelligent", "intelligent", ["clever", "smart"], ["intelligente"]], ["calm", "calme"],
                    ["affectionate", "affectueux", [], ["affectueuse"]], ["creative", "créatif", [], ["créative"]], ["protective", "protecteur", [], ["protectrice"]],
                    ["friendly", "sympa, amical(e)", [], ["sympa", "sympathique", "amical", "amicale", "gentil", "gentille"]], ["funny", "drôle", [], ["marrant", "marrante", "rigolo", "rigolote"]],
                    ["serious", "sérieux", [], ["sérieuse"]], ["brave", "courageux", ["courageous"], ["courageuse", "brave"]], ["strong", "fort", [], ["forte"]],
                    ["strange", "étrange, bizarre", ["weird"], ["étrange", "bizarre"]], ["mean", "méchant", ["nasty"], ["méchante"]]] },
            { h: "Pets and animals", w: [["a dog", "un chien"], ["a cat", "un chat"], ["a snake", "un serpent"], ["a rabbit", "un lapin"], ["a mouse (pl. mice)", "une souris", ["mouse", "mice"]],
                    ["a bird", "un oiseau"], ["a fox", "un renard"], ["a monkey", "un singe"], ["a butterfly", "un papillon"], ["a bear", "un ours"], ["a panther", "une panthère"],
                    ["a sloth", "un paresseux"], ["a buffalo", "un buffle"]] },
            { h: "Countries", w: [["the United Kingdom", "le Royaume-Uni", ["united kingdom", "the uk", "uk"]], ["the United States", "les États-Unis", ["united states", "the usa", "usa", "the us", "us", "america"]],
                    ["India", "l'Inde"], ["Australia", "l'Australie"]] },
            { h: "Identity", w: [["first name", "le prénom"], ["name", "le nom", ["surname", "last name"], ["nom de famille"]], ["address", "une adresse"], ["a vet", "un(e) vétérinaire", ["vet"], ["vétérinaire", "véto", "une vétérinaire", "un vétérinaire"]],
                    ["a sister", "une sœur"], ["a girl", "une fille"], ["a brother", "un frère"], ["a boy", "un garçon"], ["twins", "des jumeaux", ["twin"], ["jumeaux", "jumelles", "des jumelles"]]] }
        ] }];
let T6S = { view: "list", t: null, dir: "enfr", secs: null, run: null };
const t6Key = () => "kai.t6." + (PROFS.cur || "x");
function t6Rec() {
    try {
        return JSON.parse(localStorage.getItem(t6Key()) || "{}");
    }
    catch (e) {
        return {};
    }
}
function t6Save(id, dir, mark) {
    try {
        const R = t6Rec(), o = (R[id] = R[id] || {}), x = o[dir] || {};
        x.last = mark;
        x.best = Math.max(x.best || 0, mark);
        x.n = (x.n || 0) + 1;
        x.d = todayKey();
        o[dir] = x;
        localStorage.setItem(t6Key(), JSON.stringify(R));
    }
    catch (e) {
    }
}
const t6Body = () => document.getElementById("t6body");
const T6MO = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], T6DA = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function t6Date(d) {
    const x = new Date(d + "T12:00:00");
    return `${T6DA[x.getDay()]} ${x.getDate()} ${T6MO[x.getMonth()]}`;
}
function t6Days(d) {
    return daysBetween(todayKey(), d);
}
function t6When(d) {
    const n = t6Days(d);
    return n > 1 ? `in ${n} days` : n === 1 ? "tomorrow!" : n === 0 ? "today!" : "done";
}
const t6Count = t => t.sections.reduce((s, x) => s + x.w.length, 0);
/* --- comparer une réponse --- */
const t6Plain = x => String(x || "").toLowerCase().replace(/[’‘`´]/g, "'").replace(/œ/g, "oe").replace(/æ/g, "ae").replace(/[-.,!?;:"«»]/g, " ").replace(/\(e\)/g, "").replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
const t6NoAcc = x => x.normalize("NFD").replace(/[̀-ͯ]/g, "");
const t6Art = (x, fr) => fr ? x.replace(/^(une|un|les|le|la|des|du)\s+/, "").replace(/^l'\s*/, "") : x.replace(/^(an|a|the|to)\s+/, "");
function t6Answers(it, dir) {
    const [en, fr, ea, fa] = it;
    if (dir === "enfr")
        return [fr, ...(fa || []), ...fr.split(/,\s*/)];
    return [en.replace(/\s*\(.*\)$/, ""), ...(ea || [])];
}
function t6Check(v, it, dir) {
    const fr = dir === "enfr", A = t6Answers(it, dir).map(a => t6Art(t6Plain(a), fr)).filter(Boolean), u = t6Art(t6Plain(v), fr);
    if (!u)
        return { ok: false };
    if (A.includes(u))
        return { ok: true };
    if (fr && A.map(t6NoAcc).includes(t6NoAcc(u)))
        return { ok: true, acc: true };
    const near = A.some(a => a.length > 3 && tkLev(t6NoAcc(u), t6NoAcc(a), 2) <= 1);
    return { ok: false, near };
}
/* --- la liste des contrôles --- */
function t6List() {
    T6S.view = "list";
    T6S.t = null;
    document.getElementById("t6qn").textContent = "";
    const R = t6Rec();
    t6Body().innerHTML = `<div class="qhead">${headSvg("Ready for your *test*? Learn the words, then test yourself!", "head")}</div>
<p class="dytip">Les contrôles de ta classe. Révise la liste, puis écris les mots dans un sens ou dans l'autre.</p>
<div class="t6list">${T6.map(t => {
        const r = R[t.id] || {}, n = t6Days(t.date);
        return `<button class="t6c${n < 0 ? " past" : ""}" data-t6="${t.id}"><span class="t6d"><b>${t6Date(t.date)}</b><em>${t6When(t.date)}</em></span><b class="t6t">${esc(t.title)}</b><span class="t6s">${esc(t.sub)} · ${t6Count(t)} words</span>
<span class="t6b"><i>EN → FR ${r.enfr ? `<b>${n20(r.enfr.best)}/20</b>` : "–"}</i><i>FR → EN ${r.fren ? `<b>${n20(r.fren.best)}/20</b>` : "–"}</i></span>${GOSVG}</button>`;
    }).join("")}</div>`;
}
/* --- un contrôle : choisir le sens et les parties --- */
function t6Detail(id) {
    const t = T6.find(x => x.id === id);
    if (!t)
        return t6List();
    T6S.view = "detail";
    T6S.t = t;
    if (!T6S.secs || T6S.secs.tid !== id) {
        T6S.secs = new Set(t.sections.map((s, i) => i));
        T6S.secs.tid = id;
    }
    document.getElementById("t6qn").textContent = "";
    const R = t6Rec()[id] || {}, n = [...T6S.secs].reduce((s, i) => s + t.sections[i].w.length, 0);
    t6Body().innerHTML = `<div class="t6head"><p class="t6d"><b>${t6Date(t.date)}</b><em>${t6When(t.date)}</em></p><h2>${esc(t.title)}</h2><p>${esc(t.sub)}</p>
<div class="t6b"><i>English → French: ${R.enfr ? `best <b>${n20(R.enfr.best)}/20</b>` : "not done yet"}</i><i>French → English: ${R.fren ? `best <b>${n20(R.fren.best)}/20</b>` : "not done yet"}</i></div></div>
<button class="ghost sm t6learn" id="t6learn" type="button">📖 Learn the list first</button>
<h3 class="dyh">1 · Which words?</h3><div class="dychips">${t.sections.map((s, i) => `<button type="button" class="dyc${T6S.secs.has(i) ? " on" : ""}" data-sec="${i}" aria-pressed="${T6S.secs.has(i)}">${esc(s.h)}<i>${s.w.length}</i></button>`).join("")}</div>
<h3 class="dyh">2 · Which way?</h3>
<div class="t6dirs"><button class="listen wgo" data-dir="enfr"${n ? "" : " disabled"}><span class="wgl">English → French<small>${n} words · ≈ ${Math.max(2, Math.round(n * .25))} min</small></span>${GOSVG}</button>
<button class="listen wgo" data-dir="fren"${n ? "" : " disabled"}><span class="wgl">French → English<small>${n} words · ≈ ${Math.max(2, Math.round(n * .25))} min</small></span>${GOSVG}</button></div>`;
}
function t6Learn() {
    const t = T6S.t;
    T6S.view = "learn";
    t6Body().innerHTML = `<p class="qpart">${esc(t.title)} · Learn the list</p>${t.sections.map(s => `<div class="dsec"><h2>${esc(s.h)}</h2><span>${s.w.length}</span></div>
<ul class="t6words">${s.w.map(([en, fr]) => `<li><button class="snd sm" type="button" data-say="${esc(en.replace(/\s*\(.*\)$/, ""))}" aria-label="Listen: ${esc(en)}">${SPK}</button><b>${esc(en)}</b><span>${esc(fr)}</span></li>`).join("")}</ul>`).join("")}
<div class="t6dirs"><button class="listen" data-dir="enfr">Test me: English → French${GOSVG}</button><button class="listen" data-dir="fren">Test me: French → English${GOSVG}</button></div>`;
    scrollTo(0, 0);
}
/* --- le test --- */
function t6Start(dir, items) {
    const t = T6S.t;
    if (!items) {
        items = [];
        t.sections.forEach((s, i) => {
            if (T6S.secs.has(i))
                s.w.forEach(w => items.push({ w, sec: s.h }));
        });
        items = shuffle(items);
    }
    if (!items.length)
        return;
    T6S.dir = dir;
    T6S.run = { items, i: 0, res: [], your: [] };
    T6S.view = "run";
    t6Q();
    scrollTo(0, 0);
}
const t6Dots = () => {
    const R = T6S.run;
    return R.items.map((x, j) => `<i class="${R.res[j] === true ? "ok" : R.res[j] === false ? "ko" : j === R.i ? "cur" : ""}"></i>`).join("");
};
function t6Q() {
    const R = T6S.run, q = R.items[R.i], fr = T6S.dir === "enfr";
    document.getElementById("t6qn").textContent = `${R.i + 1}/${R.items.length}`;
    t6Body().innerHTML = `<p class="qpart">${esc(T6S.t.title)} · ${fr ? "English → French" : "French → English"}</p><div class="dots${R.items.length > 10 ? " many" : ""}" aria-hidden="true">${t6Dots()}</div>
<div class="t6card"><span class="tchip">${esc(q.sec)}</span><p class="t6w">${esc(fr ? q.w[0] : q.w[1])}</p>${fr ? `<button class="snd sm" id="t6say" type="button" aria-label="Listen">${SPK}</button>` : ""}<p class="t6ask">${fr ? "Write it in French" : "Write it in English"}</p></div>
<input id="t6in" class="t3in" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${fr ? "En français…" : "In English…"}" aria-label="${fr ? "Your answer in French" : "Your answer in English"}">
<div class="t6btns"><button class="listen" id="t6check">Check${GOSVG}</button><button class="ghost sm" id="t6skip" type="button">I don't know</button></div><div class="fb" id="t6fb" aria-live="polite"></div>`;
    if (fr)
        setTimeout(() => sayOne(q.w[0].replace(/\s*\(.*\)$/, ""), document.getElementById("t6say")), 300);
    setTimeout(() => {
        const i = document.getElementById("t6in");
        if (i)
            try {
                i.focus({ preventScroll: true });
            }
            catch (e) {
            }
    }, 250);
}
function t6Answer(skip) {
    const R = T6S.run, q = R.items[R.i], inp = document.getElementById("t6in");
    if (!inp || R.res[R.i] !== undefined)
        return;
    const v = inp.value.trim();
    if (!v && !skip) {
        inp.classList.add("shake");
        setTimeout(() => inp.classList.remove("shake"), 400);
        return;
    }
    const c = skip ? { ok: false } : t6Check(v, q.w, T6S.dir), fr = T6S.dir === "enfr", ans = fr ? q.w[1] : q.w[0], last = R.i === R.items.length - 1;
    R.res[R.i] = c.ok;
    R.your[R.i] = skip ? "" : v;
    inp.disabled = true;
    inp.classList.add(c.ok ? "right" : "wrong");
    ["t6check", "t6skip"].forEach(id => {
        const b = document.getElementById(id);
        if (b)
            b.remove();
    });
    document.querySelector("#t6body .dots").innerHTML = t6Dots();
    document.getElementById("t6fb").innerHTML = `<p class="verdict ${c.ok ? "ok" : "ko"}">${c.ok ? ["YES!", "PERFECT!", "WELL DONE!", "GREAT!"][R.i % 4] : c.near ? `ALMOST! IT'S <b>${esc(ans.toUpperCase())}</b>` : `IT'S <b>${esc(ans.toUpperCase())}</b>`}</p>
${c.acc ? `<p class="tright">Careful with the accents: <b>${esc(q.w[1])}</b></p>` : ""}<div class="ex"><button class="snd sm" id="t6say2" type="button" aria-label="Listen">${SPK}</button><div><p class="en"><b>${esc(q.w[0])}</b></p><p class="fr">${esc(q.w[1])}</p></div></div>
<button class="listen next" id="t6next">${last ? "See my mark" : "Next"}${GOSVG}</button>`;
    sayOne(q.w[0].replace(/\s*\(.*\)$/, ""), document.getElementById("t6say2"));
    const nx = document.getElementById("t6next");
    nx.scrollIntoView({ behavior: "smooth", block: "nearest" });
    try {
        nx.focus({ preventScroll: true });
    }
    catch (e) {
    }
}
function t6Next() {
    const R = T6S.run;
    stopSpeech();
    if (R.i < R.items.length - 1) {
        R.i++;
        t6Q();
        scrollTo({ top: 0, behavior: "smooth" });
        return;
    }
    t6End();
}
function t6End() {
    const R = T6S.run, N = R.items.length, n = R.res.filter(x => x === true).length, mark = Math.round(n * 40 / N) / 2, full = N === t6Count(T6S.t), fr = T6S.dir === "enfr";
    T6S.view = "end";
    document.getElementById("t6qn").textContent = "";
    if (full)
        t6Save(T6S.t.id, T6S.dir, mark);
    const by = {};
    R.items.forEach((q, j) => {
        const b = by[q.sec] || (by[q.sec] = { ok: 0, n: 0 });
        b.n++;
        if (R.res[j])
            b.ok++;
    });
    const miss = R.items.map((q, j) => ({ q, j })).filter(x => !R.res[x.j]), pick = mark >= 16 ? "v" : mark >= 10 ? "dyn" : "profile";
    t6Body().innerHTML = `<div class="dend">${kaiBig(pick, [[full ? "Your mark" : "Your score"], [[full ? n20(mark) : String(n)], full ? " / 20" : ` / ${N}`], [mark >= 16 ? "Great job!" : mark >= 10 ? "Good work!" : "Keep trying!"]], `${full ? "Your mark: " + n20(mark) + " out of 20" : "Your score: " + n + " out of " + N}`)}</div>
<p class="dban">${n} / ${N} words right · ${fr ? "English → French" : "French → English"}${full ? "" : " · only some parts: your best mark is kept for the whole list"}</p>
<div class="dytab">${Object.entries(by).map(([s, b]) => `<div class="dyrow"><span>${esc(s)}</span><b class="${b.ok === b.n ? "ok" : b.ok * 2 >= b.n ? "" : "ko"}">${b.ok}/${b.n}</b></div>`).join("")}</div>
${miss.length ? `<details class="wd" open><summary class="wh ko">To learn again <span>${miss.length}</span></summary><ul class="dymiss">${miss.map(({ q, j }) => `<li><button class="snd sm" type="button" data-say="${esc(q.w[0].replace(/\s*\(.*\)$/, ""))}" aria-label="Listen">${SPK}</button><div><b>${esc(q.w[0])} = ${esc(q.w[1])}</b>${R.your[j] ? `<small>You wrote: ${esc(R.your[j])}</small>` : `<small>You didn't know</small>`}</div></li>`).join("")}</ul></details>` : `<p class="dban">Perfect! No mistakes. 🎉</p>`}
<div class="dyend">${miss.length ? `<button class="listen" id="t6retry">Retry my mistakes · ${miss.length}${GOSVG}</button>` : ""}<button class="ghost" id="t6other" type="button">Now ${fr ? "French → English" : "English → French"}</button><button class="ghost" id="t6back" type="button">Back to the test</button></div>`;
    scrollTo(0, 0);
    setTimeout(() => sayOne(mark >= 16 ? "Great job! You're ready for your test!" : mark >= 10 ? "Good work! Practise your mistakes again." : "Keep trying! Learn the list and try again.", document.querySelector("#t6body .dend .bb")), 400);
}
/* --- la tuile, la page, les clics --- */
function openT6() {
    DAILY = false;
    t6List();
    show("t6");
}
document.getElementById("toT6").addEventListener("click", openT6);
document.getElementById("backT6").addEventListener("click", () => {
    stopSpeech();
    if (T6S.view === "list")
        show("ty", true);
    else if (T6S.view === "detail")
        t6List();
    else
        t6Detail(T6S.t.id);
    scrollTo(0, 0);
});
document.getElementById("t6body").addEventListener("click", e => {
    const t = e.target;
    const c = t.closest("[data-t6]");
    if (c) {
        t6Detail(c.dataset.t6);
        scrollTo(0, 0);
        return;
    }
    const sc = t.closest("[data-sec]");
    if (sc) {
        const i = +sc.dataset.sec;
        T6S.secs.has(i) ? T6S.secs.delete(i) : T6S.secs.add(i);
        t6Detail(T6S.t.id);
        return;
    }
    const d = t.closest("[data-dir]");
    if (d && !d.disabled) {
        if (T6S.view === "learn")
            T6S.secs = Object.assign(new Set(T6S.t.sections.map((s, i) => i)), { tid: T6S.t.id });
        t6Start(d.dataset.dir);
        return;
    }
    if (t.closest("#t6learn")) {
        t6Learn();
        return;
    }
    if (t.closest("#t6check")) {
        t6Answer(false);
        return;
    }
    if (t.closest("#t6skip")) {
        t6Answer(true);
        return;
    }
    if (t.closest("#t6next")) {
        t6Next();
        return;
    }
    if (t.closest("#t6say") || t.closest("#t6say2")) {
        const q = T6S.run.items[T6S.run.i];
        sayOne(q.w[0].replace(/\s*\(.*\)$/, ""), t.closest("button"));
        return;
    }
    const sy = t.closest("[data-say]");
    if (sy) {
        sayOne(sy.dataset.say, sy);
        return;
    }
    if (t.closest("#t6retry")) {
        const R = T6S.run;
        t6Start(T6S.dir, shuffle(R.items.filter((q, j) => !R.res[j])));
        return;
    }
    if (t.closest("#t6other")) {
        t6Start(T6S.dir === "enfr" ? "fren" : "enfr");
        return;
    }
    if (t.closest("#t6back")) {
        t6Detail(T6S.t.id);
        scrollTo(0, 0);
        return;
    }
});
document.getElementById("t6body").addEventListener("keydown", e => {
    if (e.key !== "Enter" || e.target.id !== "t6in")
        return;
    e.preventDefault();
    const R = T6S.run;
    if (!R)
        return;
    if (R.res[R.i] === undefined)
        t6Answer(false);
    else
        t6Next();
});
/* --- My daily work : rappel quand un contrôle arrive (7 jours avant) --- */
(function () {
    const D0 = renderDaily;
    renderDaily = function (...a) {
        const r = D0.apply(this, a);
        try {
            if (DTAB !== "today")
                return r;
            const t = T6.filter(x => {
                const n = t6Days(x.date);
                return n >= 0 && n <= 10;
            }).sort((a, b) => a.date.localeCompare(b.date))[0];
            /* S-03 : le bandeau passe sous l'objectif du jour, pour que « Start » reste visible sans défiler */
            const dd = document.querySelector("#dailybody .wgoal");
            if (t && dd && !document.getElementById("t6ban")) {
                dd.insertAdjacentHTML("afterend", `<button class="t6ban" id="t6ban" type="button" data-t6go="${t.id}">📅 <span><b>Class test ${t6When(t.date)}</b> ${esc(t.title)} · ${t6Date(t.date)}</span>${GOSVG}</button>`);
            }
        }
        catch (e) {
        }
        return r;
    };
})();
document.getElementById("dailybody").addEventListener("click", e => {
    const b = e.target.closest("[data-t6go]");
    if (b) {
        e.stopPropagation();
        DAILY = false;
        t6Detail(b.dataset.t6go);
        show("t6");
    }
}, true);
(function () {
    const PAGES = new Set(["verbs", "nouns", "adjectives", "adverbs", "connectors", "prepositions", "words", "lesson", "grammar", "conj", "test", "phrasals", "idioms", "talk", "quantifiers", "diy", "t6"]);
    const b = document.createElement("button");
    b.className = "totop";
    b.id = "totop";
    b.type = "button";
    b.setAttribute("aria-label", "Back to top");
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    document.body.appendChild(b);
    const upd = () => {
        const pg = document.querySelector(".page.on");
        b.classList.toggle("show", !!(pg && PAGES.has(pg.id) && scrollY > 500));
    };
    addEventListener("scroll", upd, { passive: true });
    addEventListener("resize", upd);
    b.addEventListener("click", () => {
        try {
            scrollTo({ top: 0, behavior: "smooth" });
        }
        catch (e) {
            scrollTo(0, 0);
        }
    });
    window.totopUpd = upd;
})();
