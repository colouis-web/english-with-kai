/* My picks (PO, 15/11) : « attraper » des mots pendant les quiz pour les revoir au calme.
   - Pendant un quiz (mots du jour ou autre), après chaque réponse, un bouton « Pick this word » met le mot de côté ;
     l'écran de fin a aussi un bouton par mot. Un mot trouvé par élimination peut ainsi être revu plus tard.
   - Les mots attrapés sont rangés dans la journée (r.pk : clé, nature, mot, traduction, phrase d'exemple, heure).
   - L'app « My picks » du menu ouvre un calendrier de la semaine : chaque jour avec ses mots, la semaine d'avant
     et d'après, et un test SANS les 4 réponses (on écrit le mot anglais), pour ne plus trouver par élimination.
   Script classique, chargé après app-dictee.js. */
"use strict";
const PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1z" fill="currentColor"/></svg>';
let PKW = 0, PKD = null, PK = null;   /* semaine affichée (0 = cette semaine), jour choisi, test en cours */
const pkOf = k => ((DST.days[k] || {}).pk || []);
const pkKey = (kind, d) => kind + ":" + (d.v || d.w || d.e || d.en);
function pkHas(key) {
    return pkOf(todayKey()).some(p => p.key === key);
}
/* met de côté (ou retire) un mot dans la liste du jour */
function pkToggle(it) {
    const r = JSON.parse(JSON.stringify(dToday()));
    r.pk = r.pk || [];
    const i = r.pk.findIndex(p => p.key === it.key);
    if (i >= 0)
        r.pk.splice(i, 1);
    else
        r.pk.push({ ...it, t: Date.now() });
    dPut(r);
    return i < 0;
}
function pkRemove(day, key) {
    const r = JSON.parse(JSON.stringify(DST.days[day] || {}));
    r.pk = (r.pk || []).filter(p => p.key !== key);
    DST.days[day] = r;
    dPut(r);
}
const pkBtn = (key, small) => {
    const on = pkHas(key);
    return `<button type="button" class="pkb${small ? " sm" : ""}${on ? " on" : ""}" data-pk="${esc(key)}" aria-pressed="${on}" aria-label="${on ? "Picked: tap to remove" : "Pick this word"}">${PIN}${small ? "" : `<span>${on ? "Picked" : "Pick this word"}</span>`}</button>`;
};
/* le mot d'une question du quiz, prêt à être rangé */
function pkItemOfQ(q) {
    const kind = q.k || QZ.kind, d = q.d;
    let e = "";
    try {
        e = recapLab(kind, d);
    }
    catch (err) {
        e = d.w || d.v || "";
    }
    return { key: pkKey(kind, d), k: kind, e, f: d.fr || "", en: q.en || "", fr: q.fr || "" };
}
(function () {
    /* 1. après chaque réponse : « Pick this word » */
    const A0 = answer;
    answer = function (k) {
        const before = (QZ.qs[QZ.ph][QZ.i] || {}).res;
        A0.apply(this, arguments);
        const q = QZ.qs[QZ.ph][QZ.i];
        if (before !== undefined || !q || q.res === undefined)
            return;
        const fb = document.getElementById("fb"), v = fb && fb.querySelector(".verdict");
        if (v)
            v.insertAdjacentHTML("afterend", `<div class="pkrow">${pkBtn(pkItemOfQ(q).key)}</div>`);
    };
    /* 2. écran de fin : un bouton par mot */
    const E0 = renderEnd;
    renderEnd = function () {
        E0.apply(this, arguments);
        const lis = document.querySelectorAll("#qwrap .recap li");
        QZ.words.forEach(({ d, k }, i) => {
            const q = QZ.qs[0].find(x => x.d === d);
            if (lis[i] && q) {
                lis[i].classList.add("pk");
                lis[i].insertAdjacentHTML("beforeend", pkBtn(pkItemOfQ(q).key, true));
            }
        });
        const leg = document.querySelector("#qwrap .rleg");
        if (leg && lis.length)
            leg.insertAdjacentHTML("afterend", `<p class="pkhint">${PIN} Pick the words you want to <b>revise</b> in My picks.</p>`);
    };
    document.getElementById("qwrap").addEventListener("click", e => {
        const b = e.target.closest("[data-pk]");
        if (!b || XMODE)
            return;
        e.stopPropagation();
        const key = b.dataset.pk;
        let it = null;
        for (const list of QZ.qs)
            for (const q of list)
                if (!it && pkItemOfQ(q).key === key)
                    it = pkItemOfQ(q);
        if (!it)
            return;
        const on = pkToggle(it);
        document.querySelectorAll(`#qwrap [data-pk="${CSS.escape(key)}"]`).forEach(x => {
            x.classList.toggle("on", on);
            x.setAttribute("aria-pressed", on);
            x.setAttribute("aria-label", on ? "Picked: tap to remove" : "Pick this word");
            const s = x.querySelector("span");
            if (s)
                s.textContent = on ? "Picked" : "Pick this word";
        });
        if (on)
            toast("Picked! Find it in My picks.", 1600);
    }, true);
})();
/* ===== l'app « My picks » : la semaine, les mots de chaque jour, le test ===== */
function openPicks() {
    PKW = 0;
    const T = todayKey(), wk = weekKeys(T);
    PKD = pkOf(T).length ? T : [...wk].reverse().find(k => k <= T && pkOf(k).length) || T;
    renderPicks();
    show("picks");
    scrollTo(0, 0);
}
function renderPicks() {
    const T = todayKey(), wk = weekKeys(addDays(T, 7 * PKW)), all = wk.flatMap(pkOf);
    if (!wk.includes(PKD))
        PKD = [...wk].reverse().find(k => k <= T && pkOf(k).length) || (wk.includes(T) ? T : wk[0]);
    const day = pkOf(PKD), D = k => kDate(k), wd = ["M", "T", "W", "T", "F", "S", "S"];
    /* rythme de révision (PO, 15/11) : Kai demande « jour par jour » ou « toute la semaine » ; le choix est retenu sur cet appareil */
    const M = pkMode(), list = M === "week" ? wk.flatMap(k => pkOf(k).map(p => ({ ...p, day: k }))) : day.map(p => ({ ...p, day: PKD }));
    const head = !all.length ? (PKW < 0 ? "No picked words this week." : "Pick words in your quizzes, then *test* yourself here!") : !M ? "How do you want to *revise*: day by day, or the whole *week*?" : M === "week" ? `*${all.length} word${all.length > 1 ? "s" : ""}* to revise this week. Test yourself!` : `Day by day: *${day.length} word${day.length === 1 ? "" : "s"}* ${PKD === T ? "today" : "this day"}. Test yourself!`;
    const item = p => `<li><button class="snd sm" type="button" data-say="${esc(p.e)}" aria-label="Listen">${SPK}</button><div><b>${esc(p.e)}</b><i>${esc(p.f)}</i></div><button class="pkx" type="button" data-pkx="${esc(p.key)}" data-pkxd="${p.day}" aria-label="Remove ${esc(p.e)}">×</button></li>`;
    const byDay = wk.filter(k => pkOf(k).length).map(k => `<li class="pkdh">${k === T ? "Today" : longDate(k)}</li>${list.filter(p => p.day === k).map(item).join("")}`).join("");
    document.getElementById("pkbody").innerHTML = `<div class="qhead">${headSvg(head, all.length ? "smile" : "head")}</div>
${all.length ? `<div class="pkmode${M ? "" : " ask"}" role="radiogroup" aria-label="How do you want to revise?">${[["day", "Day by day", "the words of one day"], ["week", "The whole week", "all your picks of the week"]].map(([id, b, s]) => `<button type="button" role="radio" class="pkm${M === id ? " on" : ""}" data-pkm="${id}" aria-checked="${M === id}"><b>${b}</b>${M ? "" : `<span>${s}</span>`}</button>`).join("")}</div>` : ""}
<div class="pkweek"><button class="pknav" type="button" data-pkw="-1" aria-label="Previous week"><svg viewBox="0 0 24 24"><path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
<b>${PKW === 0 ? "This week" : PKW === -1 ? "Last week" : "Week of " + D(wk[0]).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</b>
<button class="pknav" type="button" data-pkw="1" aria-label="Next week"${PKW >= 0 ? " disabled" : ""}><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
<div class="pkdays" role="tablist" aria-label="Days">${wk.map((k, i) => {
        const n = pkOf(k).length, fut = k > T, sel = M === "week" ? n > 0 : k === PKD;
        return `<button type="button" role="tab" class="pkday${sel ? " on" : ""}${n ? " has" : ""}${k === T ? " today" : ""}" data-pkd="${k}" aria-selected="${sel}"${fut ? " disabled" : ""} aria-label="${longDate(k)}: ${n} word${n === 1 ? "" : "s"}"><i>${wd[i]}</i><b>${D(k).getDate()}</b><em>${n || ""}</em></button>`;
    }).join("")}</div>
<div class="pkpanel">${M === "week" ? `<h2>${PKW === 0 ? "This week" : "That week"} · ${all.length} word${all.length === 1 ? "" : "s"}</h2>${all.length ? `<ul class="pklist">${byDay}</ul>` : `<p class="pknone">No words picked this week. In a quiz, tap <span class="pkb mini">${PIN}</span> to pick a word.</p>`}`
        : `<h2>${PKD === T ? "Today" : longDate(PKD)}</h2>${day.length ? `<ul class="pklist">${list.map(item).join("")}</ul>` : `<p class="pknone">No words picked ${PKD === T ? "today" : "this day"}. In a quiz, tap <span class="pkb mini">${PIN}</span> to pick a word.</p>`}`}</div>
<div class="pkgo">${M && list.length ? `<button class="listen" type="button" data-pkt="${M}">${M === "week" ? `Test the week · ${list.length}` : `Test ${PKD === T ? "today's" : "this day's"} words · ${list.length}`}${GOSVG}</button>` : ""}</div>`;
}
function pkMode() {
    try {
        return localStorage.getItem("kai.pkrythme") || "";
    }
    catch (e) {
        return "";
    }
}
document.getElementById("pkbody").addEventListener("click", e => {
    const t = e.target;
    const w = t.closest("[data-pkw]");
    if (w && !w.disabled) {
        PKW = Math.min(0, PKW + +w.dataset.pkw);
        PKD = null;
        renderPicks();
        return;
    }
    const m = t.closest("[data-pkm]");
    if (m) {
        try {
            localStorage.setItem("kai.pkrythme", m.dataset.pkm);
        }
        catch (err) {
        }
        renderPicks();
        return;
    }
    const d = t.closest("[data-pkd]");
    if (d && !d.disabled) {
        PKD = d.dataset.pkd;
        if (pkMode() === "week")   /* toucher un jour : on revient au rythme « jour par jour » sur ce jour */
            try {
                localStorage.setItem("kai.pkrythme", "day");
            }
            catch (err) {
            }
        renderPicks();
        return;
    }
    const x = t.closest("[data-pkx]");
    if (x) {
        pkRemove(x.dataset.pkxd || PKD, x.dataset.pkx);
        renderPicks();
        return;
    }
    const s = t.closest("[data-say]");
    if (s) {
        sayOne(s.dataset.say, s);
        return;
    }
    const go = t.closest("[data-pkt]");
    if (go) {
        const wk = weekKeys(addDays(todayKey(), 7 * PKW)), seen = new Set();
        const items = (go.dataset.pkt === "day" ? pkOf(PKD) : wk.flatMap(pkOf)).filter(p => !seen.has(p.key) && seen.add(p.key));
        pkStart(items);
    }
});
document.getElementById("backPk").addEventListener("click", () => show("menu", true));
document.getElementById("toPicks").addEventListener("click", openPicks);
/* ===== le test : on écrit le mot anglais (pas de choix à 4 réponses) ===== */
function pkStart(items) {
    PK = { items: items.slice().sort(() => Math.random() - .5), i: 0, res: [] };
    XMODE = "pk";
    DAILY = false;
    document.getElementById("qtitle").textContent = "My picks";
    renderPk();
    show("quiz");
    scrollTo(0, 0);
}
const pkIt = p => ({ en: /\*(.+?)\*/.test(p.en) ? p.en : `*${p.e}*`, ans: p.e });
function renderPk() {
    const p = PK.items[PK.i], it = pkIt(p), hasEx = /\*(.+?)\*/.test(p.en);
    document.getElementById("qn").textContent = `${PK.i + 1}/${PK.items.length}`;
    QW().innerHTML = `<p class="qpart">My picks · Write the English word</p><div class="dots" aria-hidden="true">${PK.items.map((x, j) => `<i class="${PK.res[j] === undefined ? (j === PK.i ? "cur" : "") : PK.res[j] ? "ok" : "ko"}"></i>`).join("")}</div>
<div class="qhead">${headSvg(`*${p.f}*`, "head", "", "fr")}</div>
<p class="qask">No choices this time: write it in English!</p>
${hasEx ? `<div class="t3card pkcard"><p class="t3en">${esc(t3Blank(p.en))}</p><p class="t3fr">${hl(p.fr)}</p></div>` : ""}
<input class="t3in" id="pkin" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Type the English word" aria-label="English word">
<button class="listen" id="pkcheck">Check${GOSVG}</button><div class="fb" id="pkfb" aria-live="polite"></div>`;
    setTimeout(() => {
        const i = document.getElementById("pkin");
        if (i)
            try {
                i.focus({ preventScroll: true });
            }
            catch (e) {
            }
    }, 250);
    void it;
}
function pkCheck() {
    if (PK.res[PK.i] !== undefined)
        return;
    const p = PK.items[PK.i], it = pkIt(p), inp = document.getElementById("pkin"), v = inp.value;
    if (!v.trim()) {
        inp.classList.add("shake");
        setTimeout(() => inp.classList.remove("shake"), 400);
        inp.focus();
        return;
    }
    const ok = t3Ok(v, it), typo = !ok && t3Typo(v, it), good = ok || typo, last = PK.i === PK.items.length - 1;
    PK.res[PK.i] = good;
    inp.disabled = true;
    inp.classList.add(good ? "right" : "wrong");
    document.getElementById("pkcheck").remove();
    document.querySelector("#qwrap .dots").innerHTML = PK.items.map((x, j) => `<i class="${PK.res[j] === undefined ? (j === PK.i ? "cur" : "") : PK.res[j] ? "ok" : "ko"}"></i>`).join("");
    document.getElementById("pkfb").innerHTML = `<p class="verdict ${good ? "ok" : "ko"}">${ok ? ["YES!", "PERFECT!", "WELL DONE!"][PK.i % 3] : typo ? `ALMOST! IT'S <b>${esc(t3Ans(it).toUpperCase())}</b>` : `IT'S <b>${esc(t3Ans(it).toUpperCase())}</b>`}</p>
${/\*(.+?)\*/.test(p.en) ? `<div class="ex"><button class="snd sm" id="pksay" aria-label="Listen to the sentence">${SPK}</button><div><p class="en">${hl(p.en)}</p><p class="fr">${hl(p.fr)}</p></div></div>` : ""}
<button class="listen next" id="pknext">${last ? "See my score" : "Next"}${GOSVG}</button>`;
    sayOne(plain(/\*(.+?)\*/.test(p.en) ? p.en : p.e), document.getElementById("pksay"));
    document.getElementById("pknext").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function pkEnd() {
    const N = PK.items.length, n = PK.res.filter(Boolean).length, P = pct(n, N);
    XMODE = "pkend";
    document.getElementById("qn").textContent = "";
    QW().innerHTML = `<p class="qpart">My picks · Results</p><div class="qhead">${headSvg(P === 100 ? "*Perfect*! You know all your picks!" : P >= 60 ? `Well done! *${n}/${N}* words!` : `*${n}/${N}*. Read them again and try once more!`, P >= 60 ? "smile" : "head")}</div>
<div class="scores one"><div class="sc${n === N ? " ok" : ""}"><i>My picks</i><b>${P}%</b><small>${n} of ${N} word${N > 1 ? "s" : ""}</small></div></div>
<ul class="recap">${PK.items.map((p, j) => `<li><span class="m ${PK.res[j] ? "ok" : "ko"}">${PK.res[j] ? CHECK : CROSS}</span><b>${esc(p.e)}</b><i>${esc(p.f)}</i></li>`).join("")}</ul>
<div class="endbtns"><button class="listen" id="pkagain">Test again</button><button class="ghost" id="pkback">My picks</button></div>`;
    sayOne(P === 100 ? "Perfect! You know all your picks!" : `${n} out of ${N}!`, document.querySelector("#qwrap .qhead .bb"));
}
/* clics et Entrée du test (capture sur le document : avant les gestionnaires de la page du quiz) */
document.addEventListener("click", e => {
    if (!XMODE || !/^pk/.test(XMODE) || !e.target.closest || !e.target.closest("#quiz"))
        return;
    const t = e.target, stop = () => {
        e.stopPropagation();
        e.preventDefault();
    };
    if (t.closest("#pkcheck")) {
        stop();
        pkCheck();
    }
    else if (t.closest("#pknext")) {
        stop();
        stopSpeech();
        if (PK.i < PK.items.length - 1) {
            PK.i++;
            renderPk();
            scrollTo({ top: 0, behavior: "smooth" });
        }
        else
            pkEnd();
    }
    else if (t.closest("#pksay")) {
        stop();
        sayOne(plain(PK.items[PK.i].en), t.closest("button"));
    }
    else if (t.closest("#pkagain")) {
        stop();
        pkStart(PK.items);
    }
    else if (t.closest("#pkback") || t.closest("#backQ")) {
        stop();
        stopSpeech();
        XMODE = null;
        renderPicks();
        show("picks", true);
    }
}, true);
document.addEventListener("keydown", e => {
    if (e.key === "Enter" && XMODE === "pk" && e.target.id === "pkin") {
        e.preventDefault();
        pkCheck();
    }
});
