/* Dictation (PO, 14/11) : une app du menu, deux niveaux, une tâche de la semaine.
   - Standard : Kai lit une phrase, l'élève tape LE mot qui manque (la dictée d'origine, app-v54-v62.js, 10 phrases).
   - Complex : 2 ou 3 trous par phrase (le mot étudié + 1 ou 2 autres mots pleins de la phrase), 8 phrases ; on compte les mots.
     Les phrases viennent des exemples des dictionnaires (mots du niveau de l'élève) : plus de 5 000 phrases possibles.
   - Une dictée terminée est notée dans la journée (r.dz : niveau, mots justes, mots, heure) ; une par semaine coche
     « Dictation » sur la carte This week du menu.
   Script classique, chargé après app-kai-discussion.js. */
"use strict";
let DZFROM = "menu";   /* page d'où la dictée a été ouverte : "menu" ou "daily" (My activity › My memory) */
const DZ_STOP = new Set("this that these those with from have has had they them their there then than what when where which while will would could should your yours very some into onto about does done were been being after before again also just only much many more most such each every other another over under here very well even ever never always often still back down your ours mine".split(" "));
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
/* écran de choix du niveau */
function openDict(from) {
    const on = id => document.getElementById(id).classList.contains("on");
    DZFROM = from || (on("daily") ? "daily" : on("quiz") ? DZFROM : "menu");   /* « New dictation » garde la page d'origine */
    DAILY = false;
    XMODE = "dzpick";
    document.getElementById("qtitle").textContent = "Dictation";
    document.getElementById("qn").textContent = "";
    const last = dzWeek();
    QW().innerHTML = `<p class="qpart">Dictation · Listen and type</p>
<div class="qhead">${headSvg("Listen to me and type the *missing* words! Choose your *level*.", "head")}</div>
<div class="dzlv">
<button class="dzopt" type="button" data-dzlv="std"><b>Standard</b><span>1 missing word in each sentence</span><small>10 sentences · ≈ 3 min</small></button>
<button class="dzopt cpx" type="button" data-dzlv="cpx"><b>Complex</b><span>2 or 3 missing words in each sentence</span><small>8 sentences · ≈ 5 min</small></button>
</div>
<p class="dzwk">${last ? `${CHECK} This week's dictation is done (${last.lv === "cpx" ? "Complex" : "Standard"}, ${last.n}/${last.N}). You can do more!` : "One dictation a week is one of your weekly goals."}</p>`;
    show("quiz");
    scrollTo(0, 0);
}
function dzStart(lv) {
    if (lv === "cpx") {
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
    return `<i class="${r === undefined ? (j === DZ.i ? "cur" : "") : r === x.toks.filter(t => t.gap).length ? "ok" : "ko"}"></i>`;
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
        if (DZ.lv !== "cpx") {
            dzSave(DZ.res.filter(Boolean).length, DZ.items.length);
            E0();
        }
        else {
            const N = DZ.items.reduce((s, x) => s + x.toks.filter(t => t.gap).length, 0), n = DZ.res.reduce((s, x) => s + (x || 0), 0), P = pct(n, N);
            dzSave(n, N);
            document.getElementById("qn").textContent = "";
            XMODE = "dzend";
            QW().innerHTML = `<p class="qpart">Dictation · Results</p><div class="qhead">${headSvg(P === 100 ? "*Perfect*! You heard every word!" : P >= 60 ? `Well done! *${n}/${N}* words right!` : `Not yet: *${n}/${N}*. Let's try again!`, P >= 60 ? "smile" : "head")}</div>
<div class="scores"><div class="sc${n === N ? " ok" : ""}"><i>Dictation · Complex</i><b>${P}%</b><small>${n} of ${N} words</small></div></div>
<ul class="recap">${DZ.items.map((it, j) => `<li><span class="m ${DZ.res[j] === it.toks.filter(t => t.gap).length ? "ok" : "ko"}">${DZ.res[j] === it.toks.filter(t => t.gap).length ? CHECK : CROSS}</span><b>${it.toks.filter(t => t.gap).map(t => esc(t.core)).join(" · ")}</b><i>${DZ.res[j] || 0}/${it.toks.filter(t => t.gap).length}</i></li>`).join("")}</ul>
<div class="endbtns"><button class="listen" id="dzagain">New dictation</button><button class="ghost" id="dzday">${DZFROM === "daily" ? "My activity" : "Menu"}</button></div>`;
            sayOne(P >= 60 ? `Well done! ${n} out of ${N}!` : `${n} out of ${N}. Let's try again!`, document.querySelector("#qwrap .qhead .bb"));
        }
        /* fin standard : « My day » devient « Menu » (ou « My activity »), « Quizzes » reste */
        const b = document.getElementById("dzday");
        if (b)
            b.textContent = DZFROM === "daily" ? "My activity" : "Menu";
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
        checkC();
        return;
    }
    if (t.closest("#dznext")) {
        stop();
        stopSpeech();
        if (DZ.i < DZ.items.length - 1) {
            DZ.i++;
            renderC();
            scrollTo({ top: 0, behavior: "smooth" });
        }
        else
            renderDZEnd();
        return;
    }
    if (XMODE === "dzc" && (t.closest("#xsay") || t.closest("#xsay2") || t.closest(".qhead .bb"))) {
        stop();
        sayOne(plain(DZ.items[DZ.i].en), t.closest("button") || t.closest(".bb"));
        return;
    }
    if (XMODE === "dzc" && t.closest("#xfr")) {
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
        else
            openMenuDay(true);
    }
}, true);
/* Entrée : trou suivant, puis Check */
document.getElementById("quiz").addEventListener("keydown", e => {
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
document.getElementById("toDict").addEventListener("click", () => openDict("menu"));
