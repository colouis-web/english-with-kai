/* Dictation (PO, 14/11) : une app du menu, deux niveaux, une tâche de la semaine.
   - Standard : Kai lit une phrase, l'élève tape LE mot qui manque (la dictée d'origine, app-v54-v62.js, 10 phrases).
   - Complex : 2 ou 3 trous par phrase (le mot étudié + 1 ou 2 autres mots pleins de la phrase), 8 phrases ; on compte les mots.
     Les phrases viennent des exemples des dictionnaires (mots du niveau de l'élève) : plus de 5 000 phrases possibles.
   - Expert (PO, 20/11) : la vraie dictée ; la phrase n'est pas affichée, l'élève l'écrit en entier (6 phrases de 5 à 12 mots).
     Correction mot à mot (alignement le plus long : un mot oublié ne décale pas la suite) ; majuscules et ponctuation ne
     comptent pas ; bouton « Slow » pour réécouter lentement.
   - Une dictée terminée est notée dans la journée (r.dz : niveau, mots justes, mots, heure) ; une par semaine coche
     « Dictation » sur la carte This week du menu.
   Script classique, chargé après app-kai-discussion.js. */
"use strict";
let DZFROM = "menu";   /* page d'où la dictée a été ouverte : "menu", "daily" (My activity › My memory) ou "quizzes" (Test yourself › Quiz) */
const DZ_STOP = new Set("this that these those with from have has had they them their there then than what when where which while will would could should your yours very some into onto about does done were been being after before again also just only much many more most such each every other another over under here very well even ever never always often still back down your ours mine".split(" "));
const DZLV = { std: "Standard", cpx: "Complex", exp: "Expert" };
const dzLvName = lv => DZLV[lv] || "Standard";
/* nombre de mots à trouver dans une phrase : les trous (Complex) ou tous les mots (Expert) */
const dzCount = it => it.words ? it.words.length : it.toks.filter(t => t.gap).length;
const DZB = () => DZFROM === "daily" ? "My activity" : DZFROM === "quizzes" ? "Quizzes" : "Menu";   /* bouton de fin : retour à la page d'origine */
/* une dictée faite cette semaine ? */
function dzWeek() {
    for (const k of weekKeys(todayKey())) {
        const r = DST.days[k];
        if (r && r.dz && r.dz.length)
            return r.dz[r.dz.length - 1];
    }
    return null;
}
/* niveau complexe : la phrase découpée en morceaux, avec 2 ou 3 trous */
function dzGaps(en) {
    const m = String(en).match(/\*(.+?)\*/);
    if (!m)
        return null;
    let before = en.slice(0, m.index).replace(/\*/g, ""), after = en.slice(m.index + m[0].length).replace(/\*/g, "");
    /* la ponctuation collée au mot étudié (« *Canadian*: he… ») reste collée à son trou */
    const glueA = (after.match(/^[^\s]+/) || [""])[0], glueB = (before.match(/[^\s]+$/) || [""])[0];
    after = after.slice(glueA.length);
    before = before.slice(0, before.length - glueB.length);
    const split = s => s.split(/\s+/).filter(Boolean);
    const toks = [...split(before).map(w => ({ w })), { w: glueB + m[1].trim() + glueA, gap: true, main: true, ans: m[1].trim() }, ...split(after).map(w => ({ w }))];
    /* la ponctuation autour d'un trou reste affichée */
    toks.forEach(t => {
        const x = t.w.match(/^([("«]*)(.*?)([.,!?;:)"»]*)$/);
        t.pre = x[1];
        t.core = x[2];
        t.post = x[3];
        if (t.main) {   /* le trou du mot étudié : la réponse est le mot (ou les mots) entre étoiles */
            const i = t.w.indexOf(t.ans);
            t.pre = t.w.slice(0, i);
            t.core = t.ans;
            t.post = t.w.slice(i + t.ans.length);
        }
    });
    if (toks.length < 6)
        return null;
    const okTok = (t, i) => !t.gap && /^[a-z]{4,}$/.test(t.core) && !DZ_STOP.has(t.core) && !(toks[i - 1] && toks[i - 1].gap) && !(toks[i + 1] && toks[i + 1].gap);
    const extra = toks.length >= 9 ? 2 : 1;
    for (let k = 0; k < extra; k++) {
        const c = toks.map((t, i) => okTok(t, i) ? i : -1).filter(i => i >= 0);
        if (!c.length)
            break;
        toks[c[Math.floor(Math.random() * c.length)]].gap = true;
    }
    return toks.filter(t => t.gap).length >= 2 ? toks : null;
}
function dzPickC(n) {
    const out = [];
    for (const it of dzPick(n * 4)) {
        if (out.length >= n)
            break;
        const toks = dzGaps(it.en);
        if (toks)
            out.push({ ...it, toks });
    }
    return out;
}
/* niveau expert : des phrases entières, ni trop courtes ni trop longues, sans chiffres (on entend « fifty », on tape « 50 » ?) */
const dzWords = s => t3Norm(String(s).replace(/[-‐–—]/g, " ")).split(" ").filter(Boolean);
function dzPickE(n) {
    const out = [];
    for (const it of dzPick(n * 6)) {
        if (out.length >= n)
            break;
        const en = plain(it.en), words = dzWords(en);
        if (/\d/.test(en) || words.length < 5 || words.length > 12 || out.some(o => o.en === it.en))
            continue;
        out.push({ ...it, words });
    }
    return out;
}
/* alignement des mots tapés sur les mots attendus (plus longue sous-suite commune) : true = mot attendu bien écrit */
function dzAlign(exp, got) {
    const m = exp.length, n = got.length, L = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--)
        for (let j = n - 1; j >= 0; j--)
            L[i][j] = exp[i] === got[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const ok = new Array(m).fill(false);
    let i = 0, j = 0;
    while (i < m && j < n) {
        if (exp[i] === got[j]) {
            ok[i] = true;
            i++;
            j++;
        }
        else if (L[i + 1][j] >= L[i][j + 1])
            i++;
        else
            j++;
    }
    return ok;
}
/* écran de choix du niveau */
function openDict(from) {
    const on = id => document.getElementById(id).classList.contains("on");
    /* « New dictation » garde la page d'origine ; la tuile du Quiz passe l'événement du clic, pas une page */
    DZFROM = typeof from === "string" ? from : on("daily") ? "daily" : on("quizzes") ? "quizzes" : on("quiz") ? DZFROM : "menu";
    DAILY = false;
    XMODE = "dzpick";
    document.getElementById("qtitle").textContent = "Dictation";
    document.getElementById("qn").textContent = "";
    const last = dzWeek();
    QW().innerHTML = `<p class="qpart">Dictation · Listen and type</p>
<div class="qhead">${headSvg("Listen to me and write what you *hear*! Choose your *level*.", "head")}</div>
<div class="dzlv">
<button class="dzopt" type="button" data-dzlv="std"><b>Standard</b><span>1 missing word in each sentence</span><small>10 sentences · ≈ 3 min</small></button>
<button class="dzopt cpx" type="button" data-dzlv="cpx"><b>Complex</b><span>2 or 3 missing words in each sentence</span><small>8 sentences · ≈ 5 min</small></button>
<button class="dzopt exp" type="button" data-dzlv="exp"><b>Expert</b><span>Write the whole sentence</span><small>6 sentences · ≈ 8 min</small></button>
</div>
<p class="dzwk">${last ? `${CHECK} This week's dictation is done (${dzLvName(last.lv)}, ${last.n}/${last.N}). You can do more!` : "One dictation a week is one of your weekly goals."}</p>`;
    show("quiz");
    scrollTo(0, 0);
}
function dzStart(lv) {
    if (lv === "exp") {
        DZ = { lv, items: dzPickE(6), i: 0, res: [] };
        XMODE = "dze";
        renderE();
    }
    else if (lv === "cpx") {
        DZ = { lv, items: dzPickC(8), i: 0, res: [] };
        XMODE = "dzc";
        renderC();
    }
    else {
        DZ = { lv: "std", items: dzPick(10), i: 0, res: [] };
        XMODE = "dz";
        renderX();
    }
    scrollTo(0, 0);
}
/* niveau complexe : une phrase, plusieurs trous */
const dzDots = () => `<div class="dots" aria-hidden="true">${DZ.items.map((x, j) => {
    const r = DZ.res[j];
    return `<i class="${r === undefined ? (j === DZ.i ? "cur" : "") : r === dzCount(x) ? "ok" : "ko"}"></i>`;
}).join("")}</div>`;
function renderC() {
    const it = DZ.items[DZ.i];
    let g = 0;
    document.getElementById("qn").textContent = `${DZ.i + 1}/${DZ.items.length}`;
    const line = it.toks.map(t => t.gap ? `${esc(t.pre || "")}<input class="dzg" data-g="${g++}" style="width:${Math.max(4, t.core.length + 1)}ch" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Missing word ${g}">${esc(t.post || "")}` : esc(t.w)).join(" ");
    QW().innerHTML = `<p class="qpart">Dictation · Complex</p>${dzDots()}
<div class="qhead">${headSvg(DZ.i === 0 ? "Listen and type the *missing* words!" : "Listen again and fill the *gaps*!", "head")}</div>
<div class="t3card"><button class="listen sm" id="xsay">${SPK} Listen</button><p class="t3en dzline">${line}</p><button class="ghost sm" id="xfr" type="button">FR</button><p class="t3fr" id="xfrt" hidden>${hl(it.fr)}</p></div>
<button class="listen" id="dzcheck">Check${GOSVG}</button><div class="fb" id="xfb" aria-live="polite"></div>`;
    setTimeout(() => sayOne(plain(it.en), document.getElementById("xsay")), 350);
    setTimeout(() => {
        const i = QW().querySelector(".dzg");
        if (i)
            try {
                i.focus({ preventScroll: true });
            }
            catch (e) {
            }
    }, 250);
}
function checkC() {
    const it = DZ.items[DZ.i], ins = [...QW().querySelectorAll(".dzg")], gaps = it.toks.filter(t => t.gap);
    if (DZ.res[DZ.i] !== undefined)
        return;
    const empty = ins.filter(i => !i.value.trim());
    if (empty.length) {
        empty.forEach(i => {
            i.classList.add("shake");
            setTimeout(() => i.classList.remove("shake"), 400);
        });
        empty[0].focus();
        return;
    }
    let n = 0;
    ins.forEach((inp, j) => {
        const ok = t3Norm(inp.value) === t3Norm(gaps[j].core);
        n += ok;
        inp.disabled = true;
        inp.classList.add(ok ? "right" : "wrong");
        inp.style.width = Math.max(4, inp.value.trim().length + 1) + "ch";   /* une réponse longue reste lisible en entier */
    });
    DZ.res[DZ.i] = n;
    const N = gaps.length, last = DZ.i === DZ.items.length - 1, cb = document.getElementById("dzcheck");
    if (cb)
        cb.remove();
    document.querySelector("#qwrap .dots").outerHTML = dzDots();
    const miss = gaps.filter((t, j) => !ins[j].classList.contains("right")).map(t => `<b>${esc(t.core)}</b>`);
    document.getElementById("xfb").innerHTML = `<p class="verdict ${n === N ? "ok" : "ko"}">${n === N ? ["YES!", "PERFECT!", "WELL DONE!"][DZ.i % 3] : `${n}/${N} · IT'S ${miss.join(", ").toUpperCase()}`}</p>
<div class="ex"><button class="snd sm" id="xsay2" aria-label="Listen to the sentence">${SPK}</button><div><p class="en">${hl(it.en)}</p><p class="fr">${hl(it.fr)}</p></div></div>
<button class="listen next" id="dznext">${last ? "See my score" : "Next"}${GOSVG}</button>`;
    sayOne(plain(it.en), document.getElementById("xsay2"));
    document.getElementById("dznext").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
/* niveau expert : la phrase entière à écrire */
function dzSlow(btn) {   /* réécoute lente : la vitesse de la voix est baissée le temps d'une phrase */
    const r = VRATE;
    let done = false;
    const back = () => {
        if (!done) {
            done = true;
            VRATE = r;
        }
    };
    VRATE = Math.min(r, .7);
    ttsSpeak(plain(DZ.items[DZ.i].en), btn, back);
    setTimeout(back, 1500);   /* la voix lit le texte avec la vitesse du moment où elle commence */
}
function renderE() {
    const it = DZ.items[DZ.i];
    document.getElementById("qn").textContent = `${DZ.i + 1}/${DZ.items.length}`;
    QW().innerHTML = `<p class="qpart">Dictation · Expert</p>${dzDots()}
<div class="qhead">${headSvg(DZ.i === 0 ? "Listen and write the *whole* sentence!" : "Listen carefully and write *everything*!", "head")}</div>
<div class="t3card"><div class="dzbtns"><button class="listen sm" id="xsay">${SPK} Listen</button><button class="listen sm slow" id="xslow" type="button">${SPK} Slow</button></div>
<p class="dzn">${it.words.length} words</p>
<textarea class="dzta" id="dzta" rows="3" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Write the sentence"></textarea>
<button class="ghost sm" id="xfr" type="button">FR</button><p class="t3fr" id="xfrt" hidden>${hl(it.fr)}</p></div>
<button class="listen" id="dzcheck">Check${GOSVG}</button><div class="fb" id="xfb" aria-live="polite"></div>`;
    setTimeout(() => sayOne(plain(it.en), document.getElementById("xsay")), 350);
    setTimeout(() => {
        const t = document.getElementById("dzta");
        if (t)
            try {
                t.focus({ preventScroll: true });
            }
            catch (e) {
            }
    }, 250);
}
function checkE() {
    const it = DZ.items[DZ.i], ta = document.getElementById("dzta");
    if (DZ.res[DZ.i] !== undefined || !ta)
        return;
    if (!ta.value.trim()) {
        ta.classList.add("shake");
        setTimeout(() => ta.classList.remove("shake"), 400);
        ta.focus();
        return;
    }
    const ok = dzAlign(it.words, dzWords(ta.value)), n = ok.filter(Boolean).length, N = it.words.length;
    DZ.res[DZ.i] = n;
    ta.disabled = true;
    const last = DZ.i === DZ.items.length - 1, cb = document.getElementById("dzcheck");
    if (cb)
        cb.remove();
    document.querySelector("#qwrap .dots").outerHTML = dzDots();
    document.getElementById("xfb").innerHTML = `<p class="verdict ${n === N ? "ok" : "ko"}">${n === N ? ["YES!", "PERFECT!", "WELL DONE!"][DZ.i % 3] : `${n}/${N} WORDS RIGHT`}</p>
<p class="dzw">${it.words.map((w, j) => `<span class="${ok[j] ? "right" : "wrong"}">${esc(w)}</span>`).join(" ")}</p>
<div class="ex"><button class="snd sm" id="xsay2" aria-label="Listen to the sentence">${SPK}</button><div><p class="en">${hl(it.en)}</p><p class="fr">${hl(it.fr)}</p></div></div>
<button class="listen next" id="dznext">${last ? "See my score" : "Next"}${GOSVG}</button>`;
    sayOne(plain(it.en), document.getElementById("xsay2"));
    document.getElementById("dznext").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
/* fin de dictée : on note le résultat dans la journée, puis l'écran des scores */
function dzSave(n, N) {
    try {
        const r = JSON.parse(JSON.stringify(dToday()));
        r.dz = (r.dz || []).concat({ lv: DZ.lv, n, N, t: Date.now() });
        dPut(r);
        updateDailyTile();
    }
    catch (e) {
    }
}
(function () {
    const E0 = renderDZEnd;
    renderDZEnd = function () {
        if (DZ.lv === "std") {
            dzSave(DZ.res.filter(Boolean).length, DZ.items.length);
            E0();
        }
        else {
            const N = DZ.items.reduce((s, x) => s + dzCount(x), 0), n = DZ.res.reduce((s, x) => s + (x || 0), 0), P = pct(n, N);
            dzSave(n, N);
            document.getElementById("qn").textContent = "";
            XMODE = "dzend";
            QW().innerHTML = `<p class="qpart">Dictation · Results</p><div class="qhead">${headSvg(P === 100 ? "*Perfect*! You heard every word!" : P >= 60 ? `Well done! *${n}/${N}* words right!` : `Not yet: *${n}/${N}*. Let's try again!`, P >= 60 ? "smile" : "head")}</div>
<div class="scores one"><div class="sc${n === N ? " ok" : ""}"><i>Dictation · ${dzLvName(DZ.lv)}</i><b>${P}%</b><small>${n} of ${N} word${N > 1 ? "s" : ""}</small></div></div>
<ul class="recap${DZ.lv === "exp" ? " dzr" : ""}">${DZ.items.map((it, j) => `<li><span class="m ${DZ.res[j] === dzCount(it) ? "ok" : "ko"}">${DZ.res[j] === dzCount(it) ? CHECK : CROSS}</span><b>${it.words ? esc(plain(it.en)) : it.toks.filter(t => t.gap).map(t => esc(t.core)).join(" · ")}</b><i>${DZ.res[j] || 0}/${dzCount(it)}</i></li>`).join("")}</ul>
<div class="endbtns"><button class="listen" id="dzagain">New dictation</button><button class="ghost" id="dzday">${DZB()}</button></div>`;
            sayOne(P >= 60 ? `Well done! ${n} out of ${N}!` : `${n} out of ${N}. Let's try again!`, document.querySelector("#qwrap .qhead .bb"));
        }
        /* fin standard : « My day » devient le bouton de retour (Menu, My activity ou Quizzes) ; « Quizzes » en double disparaît,
           la note seule est centrée (PO, 14/11 : passe sur la mise en page) */
        const b = document.getElementById("dzday"), q = document.getElementById("dzquiz"), sc = document.querySelector("#qwrap .scores");
        if (b)
            b.textContent = DZB();
        if (q)
            q.remove();
        if (sc)
            sc.classList.add("one");
    };
})();
/* clics de la page du quiz pendant la dictée : capture sur le document, donc AVANT ceux d'app-v54-v62.js (sur #quiz) */
document.addEventListener("click", e => {
    if (!XMODE || !/^dz/.test(XMODE) || !e.target.closest || !e.target.closest("#quiz"))
        return;
    const t = e.target, stop = () => {
        e.stopPropagation();
        e.preventDefault();
    };
    const lv = t.closest("[data-dzlv]");
    if (lv) {
        stop();
        dzStart(lv.dataset.dzlv);
        return;
    }
    if (t.closest("#dzcheck")) {
        stop();
        XMODE === "dze" ? checkE() : checkC();
        return;
    }
    if (t.closest("#dznext")) {
        stop();
        stopSpeech();
        if (DZ.i < DZ.items.length - 1) {
            DZ.i++;
            DZ.lv === "exp" ? renderE() : renderC();
            scrollTo({ top: 0, behavior: "smooth" });
        }
        else
            renderDZEnd();
        return;
    }
    if (XMODE === "dze" && t.closest("#xslow")) {
        stop();
        dzSlow(t.closest("button"));
        return;
    }
    if ((XMODE === "dzc" || XMODE === "dze") && (t.closest("#xsay") || t.closest("#xsay2") || t.closest(".qhead .bb"))) {
        stop();
        sayOne(plain(DZ.items[DZ.i].en), t.closest("button") || t.closest(".bb"));
        return;
    }
    if ((XMODE === "dzc" || XMODE === "dze") && t.closest("#xfr")) {
        stop();
        const f = document.getElementById("xfrt");
        if (f)
            f.hidden = !f.hidden;
        return;
    }
    if (t.closest("#backQ") || t.closest("#dzday")) {   /* flèche retour ou bouton de fin : là d'où on vient */
        stop();
        XMODE = null;
        stopSpeech();
        if (DZFROM === "daily") {
            DTAB = "today";
            openDaily(true);
        }
        else if (DZFROM === "quizzes")
            show("quizzes", true);
        else
            openMenuDay(true);
    }
}, true);
/* Entrée : trou suivant, puis Check (Expert : Entrée = Check) */
document.getElementById("quiz").addEventListener("keydown", e => {
    if (e.key === "Enter" && XMODE === "dze" && e.target.id === "dzta") {
        e.preventDefault();
        checkE();
        return;
    }
    if (e.key !== "Enter" || XMODE !== "dzc" || !e.target.classList.contains("dzg"))
        return;
    e.preventDefault();
    const ins = [...QW().querySelectorAll(".dzg")], nx = ins.slice(ins.indexOf(e.target) + 1).find(i => !i.value.trim()) || ins.find(i => !i.value.trim());
    if (nx)
        nx.focus();
    else
        checkC();
});
/* l'app « Dictation » du menu */
document.getElementById("toDictee").addEventListener("click", () => openDict("menu"));
