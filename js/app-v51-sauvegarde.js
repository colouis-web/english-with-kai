/* Code — tranche de l'ancien index.html (lignes 2966–3067). Script classique : l'ordre des <script> compte. */
"use strict";
/* ===== v51 : bouton Retour du téléphone, tour de mots repris après un rechargement, sauvegarde de la progression, code parent ===== */
/* --- 1. bouton Retour du téléphone (Android) ou glissement depuis le bord (iPhone) : on revient à l'écran précédent de l'appli --- */
(function () {
    let POP = false, QUIT = 0, N = 0;
    const S0 = show;
    const push = () => {
        try {
            history.pushState({ kai: ++N }, "");
        }
        catch (e) {
        }
    };
    try {
        history.replaceState({ kai: 0 }, "");
    }
    catch (e) {
    }
    show = function (id, back) {
        S0(id, back);
        if (!POP && !back && id !== "home")
            push();
    };
    addEventListener("popstate", () => {
        if (document.getElementById("modal").classList.contains("on")) {
            closeModal();
            push();
            return;
        }
        const cur = document.querySelector(".page.on"), id = cur ? cur.id : "home";
        if (id === "home")
            return;
        if (id === "menu") {
            if (Date.now() - QUIT < 2500) {
                QUIT = 0;
                try {
                    history.back();
                }
                catch (e) {
                }
                return;
            }
            QUIT = Date.now();
            toast("Press Back again to leave", 2400);
            push();
            return;
        }
        const b = cur.querySelector(".top .back");
        POP = true;
        try {
            if (b)
                b.click();
            else
                S0("menu", true);
        }
        catch (e) {
        }
        POP = false;
        const now = document.querySelector(".page.on");
        if (now && now.id === "menu" && id !== "menu") {
            /* revenu au menu : rien à faire */ }
    });
})();
/* --- 2. le tour de mots (mots du jour, quiz) est gardé après chaque réponse : on peut le reprendre après un rechargement --- */
const qsKey = d => "kai.qsave." + (PROFS.cur || "x") + "." + (d ? "daily" : "quiz");
const qRefOf = (k, d) => [k, k === "verbs" ? d.v : d.w, d.fr];
function qFind(r) {
    if (!Array.isArray(r))
        return null;
    const [k, w, fr] = r;
    let A;
    try {
        A = kAll(k);
    }
    catch (e) {
        return null;
    }
    if (!A)
        return null;
    const key = d => k === "verbs" ? d.v : d.w;
    return A.find(d => key(d) === w && d.fr === fr) || A.find(d => key(d) === w) || null;
}
function qSave() {
    if (!QZ || !QZ.qs || !QZ.qs[0] || !QZ.qs[0].length || !QZ.words)
        return;
    try {
        const k0 = QZ.kind, s = { v: 1, day: todayKey(), daily: !!DAILY, kind: k0, tag: QZ.tag, attempt: QZ.attempt || 1, ph: QZ.ph, i: QZ.i, t: Date.now(),
            words: QZ.words.map(w => ({ r: qRefOf(w.k || k0, w.d), ei: w.ei, k: w.k || null })),
            qs: QZ.qs.map(L => L.map(q => ({ r: qRefOf(q.k || k0, q.d), k: q.k, en: q.en, fr: q.fr, o: q.opts.map(o => qRefOf(q.k || k0, o)), labels: q.labels, subs: q.subs, ans: q.ans, res: q.res }))) };
        localStorage.setItem(qsKey(DAILY), JSON.stringify(s));
    }
    catch (e) {
    }
}
function qClear(daily) {
    try {
        localStorage.removeItem(qsKey(daily));
    }
    catch (e) {
    }
}
function qLoad(daily) {
    try {
        const s = JSON.parse(localStorage.getItem(qsKey(daily)) || "null");
        if (!s || s.v !== 1 || !Array.isArray(s.qs))
            return null;
        if (daily && s.day !== todayKey())
            return null;
        const words = s.words.map(w => Object.assign({ d: qFind(w.r), ei: w.ei }, w.k ? { k: w.k } : {}));
        if (words.some(w => !w.d))
            return null;
        const qs = s.qs.map(L => L.map(q => ({ d: qFind(q.r), k: q.k, en: q.en, fr: q.fr, opts: q.o.map(qFind), labels: q.labels, subs: q.subs, ans: q.ans, res: q.res === true || q.res === false ? q.res : undefined })));
        if (qs.some(L => L.some(q => !q.d || q.opts.some(o => !o))))
            return null;
        const done = qs.flat().filter(q => q.res !== undefined).length;
        if (!done)
            return null;
        return { s, words, qs, done, total: qs.flat().length };
    }
    catch (e) {
        return null;
    }
}
(function () {
    const A0 = answer, R0 = renderQ, M0 = renderMid, E0 = renderEnd, T0 = renderTopics;
    answer = function (k) {
        A0(k);
        qSave();
    };
    renderQ = function () {
        R0();
        qSave();
    };
    renderMid = function () {
        M0();
        qSave();
    };
    renderEnd = function () {
        qClear(DAILY);
        E0();
    };
    renderTopics = function (k) {
        T0(k);
        if (DAILY)
            return;
        const L = qLoad(false);
        if (L && L.s.kind === k)
            setTimeout(() => askRound(L, false), 60);
    };
})();
function resumeRound(L, daily) {
    DAILY = daily;
    QZ = { kind: L.s.kind, tag: L.s.tag, words: L.words, qs: L.qs, ph: 0, i: 0, attempt: L.s.attempt || 1 };
    document.getElementById("qtitle").textContent = KK(QZ.kind).title;
    show("quiz");
    scrollTo(0, 0);
    const i0 = QZ.qs[0].findIndex(q => q.res === undefined);
    if (i0 >= 0) {
        QZ.i = i0;
        renderQ();
        return;
    }
    const i1 = QZ.qs[1].findIndex(q => q.res === undefined);
    if (i1 < 0) {
        QZ.ph = 1;
        QZ.i = QZ.qs[1].length - 1;
        renderEnd();
        return;
    }
    if (QZ.qs[1].every(q => q.res === undefined)) {
        QZ.i = QZ.qs[0].length - 1;
        renderMid();
        return;
    }
    QZ.ph = 1;
    QZ.i = i1;
    renderQ();
}
function askRound(L, daily) {
    const n = L.qs[0].length;
    openModal(daily ? "Words of the day" : esc(KK(L.s.kind).title), `<p class="mtxt">You started a round of <b>${n} word${n > 1 ? "s" : ""}</b> and answered <b>${L.done} question${L.done > 1 ? "s" : ""} out of ${L.total}</b>. Your answers are saved.</p><div class="endbtns col"><button class="listen sm" data-mact="resume">Continue · ${L.done + 1}/${L.total}${GOSVG}</button><button class="ghost sm" data-mact="restart">Start a new round</button></div>`);
    MACT = { resume: () => resumeRound(L, daily), restart: () => {
            qClear(daily);
            if (daily) {
                DAILY = true;
                startQuiz("mix", "all");
                show("quiz");
            }
        } };
}
document.getElementById("dailybody").addEventListener("click", e => {
    if (!e.target.closest("#dround"))
        return;
    const L = qLoad(true);
    if (!L)
        return;
    e.stopPropagation();
    e.preventDefault();
    askRound(L, true);
}, true);
/* --- 3. les mauvaises réponses proposées viennent de mots du niveau de l'élève --- */
function wPool(k, tag) {
    const A = kAll(k);
    try {
        const p = curProf();
        if (tag !== "all" || !p)
            return A;
        const lv = lvOf(p);
        if (lv >= 3)
            return A;
        const kind = k;
        const B = A.filter(x => lvOkWord(kind, x, lv));
        return B.length >= 12 ? B : A;
    }
    catch (e) {
        return A;
    }
}
/* --- 4. sauvegarder la progression dans un fichier, la charger sur un autre appareil --- */
function kaiDump() {
    const o = { app: "learning-english-with-kai", v: 1, date: new Date().toISOString(), data: {} };
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("kai.") && k !== "kai.pcode" && !k.startsWith("kai.kv"))
            o.data[k] = localStorage.getItem(k);
    }
    return o;
}
async function kaiExport() {
    const txt = JSON.stringify(kaiDump()), name = "kai-english-" + todayKey() + ".json";
    /* dans l'artefact Claude : l'enregistrement passe par la plateforme (le visiteur confirme) */
    if (window.claude && window.claude.use) {
        let dl = null;
        try {
            dl = await window.claude.use("downloads");
        }
        catch (e) {
            dl = null;
        }
        if (dl) {
            try {
                await dl.save({ filename: name, data: txt });
                toast("Saved: " + name, 2800);
            }
            catch (e) {
                if (!(e && e.code === "declined"))
                    toast("Saving a file is not possible here", 2600);
            }
            return;
        }
    }
    try {
        const f = new File([txt], name, { type: "application/json" });
        if (/Android|iPhone|iPad/i.test(navigator.userAgent) && navigator.canShare && navigator.canShare({ files: [f] })) {
            await navigator.share({ files: [f], title: "Learning English with Kai" });
            return;
        }
    }
    catch (e) {
        if (e && e.name === "AbortError")
            return;
    }
    try {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([txt], { type: "application/json" }));
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            URL.revokeObjectURL(a.href);
            a.remove();
        }, 2000);
        toast("Saved: " + name, 2800);
    }
    catch (e) {
        toast("Saving a file is not possible here", 2600);
    }
}
function kaiMerge(o) {
    const D = o && o.data;
    if (!D || o.app !== "learning-english-with-kai")
        throw new Error("not a save");
    const inc = JSON.parse(D["kai.profiles.v1"] || "null");
    if (!inc || !Array.isArray(inc.list))
        throw new Error("no learners");
    let np = 0, nd = 0;
    for (const p of inc.list) {
        if (!p || !p.id || p.deleted)
            continue;
        const q = PROFS.list.find(x => x.id === p.id);
        if (!q) {
            PROFS.list.push(p);
            np++;
        }
        else if ((p.u || 0) > (q.u || 0))
            Object.assign(q, p);
    }
    if (!PROFS.cur && PROFS.list.length)
        PROFS.cur = (PROFS.list.find(p => p.id === inc.cur) || PROFS.list[0]).id;
    pSave();
    for (const [k, v] of Object.entries(D)) {
        if (!k.startsWith("kai.") || k === "kai.profiles.v1")
            continue;
        if (k.startsWith("kai.daily.v1.")) {
            const a = JSON.parse(localStorage.getItem(k) || "{}") || {}, b = JSON.parse(v || "{}") || {};
            for (const [d, r] of Object.entries(b)) {
                if (r && (!a[d] || (r.u || 0) > (a[d].u || 0))) {
                    a[d] = r;
                    nd++;
                }
            }
            localStorage.setItem(k, JSON.stringify(a));
            continue;
        }
        if (/^kai\.(rec|voice|rate|qnum|pcode)$/.test(k))
            continue;
        if (localStorage.getItem(k) === null)
            localStorage.setItem(k, v);
    }
    return { np, nd };
}
function kaiImport(file) {
    const r = new FileReader();
    r.onload = () => {
        try {
            const o = JSON.parse(String(r.result || ""));
            const res = kaiMerge(o);
            openModal("Save loaded", `<p class="mtxt">${res.np ? `${res.np} new learner${res.np > 1 ? "s" : ""} added. ` : ""}${res.nd} day${res.nd === 1 ? "" : "s"} of work merged. The app will now restart.</p><div class="endbtns"><button class="listen sm" data-mact="ok">OK</button></div>`);
            MACT = { ok: () => location.reload() };
        }
        catch (e) {
            toast("This file is not a Kai save", 2600);
        }
    };
    r.readAsText(file);
}
/* --- 5. code parent : changer de niveau, supprimer un élève ou charger une sauvegarde --- */
const PCK = "kai.pcode", pcode = () => {
    try {
        return localStorage.getItem(PCK) || "";
    }
    catch (e) {
        return "";
    }
};
let GATEOK = false;
function gate(why, ok) {
    const c = pcode(), p = curProf(), n = p ? p.name : "";
    const f = (lab, type, extra) => `<input class="pcin" id="pcin" type="${type}" ${type === "password" ? 'inputmode="numeric" ' : ""}autocomplete="off" maxlength="16" aria-label="${lab}">${extra || ""}`;
    if (c) {
        openModal("Parent code", `<p class="mtxt">${why}</p><p class="mtxt">Ask a parent to type the code.</p>${f("Parent code", "password")}<div class="endbtns"><button class="listen sm" data-mact="ok">OK</button><button class="ghost sm" data-mclose>Cancel</button></div>`);
        MACT = { ok: () => {
                const v = (document.getElementById("pcin") || {}).value || "";
                if (v === c)
                    ok();
                else
                    toast("Wrong code", 2000);
            } };
    }
    else {
        openModal("Are you sure?", `<p class="mtxt">${why}</p><p class="mtxt">To confirm, type the first name <b>${esc(n)}</b>.</p>${f("First name", "text")}<div class="endbtns"><button class="listen sm" data-mact="ok">OK</button><button class="ghost sm" data-mclose>Cancel</button></div><p class="menote">A parent can protect this with a parent code (bottom of this page).</p>`);
        MACT = { ok: () => {
                const v = ((document.getElementById("pcin") || {}).value || "").trim().toLowerCase();
                if (v && v === n.trim().toLowerCase())
                    ok();
                else
                    toast("That's not the right first name", 2200);
            } };
    }
    setTimeout(() => {
        const i = document.getElementById("pcin");
        if (i)
            try {
                i.focus();
            }
            catch (e) {
            }
    }, 90);
}
function askNewCode() {
    openModal("Set a parent code", `<p class="mtxt">Choose a code of 4 to 8 digits. Keep it secret!</p><input class="pcin" id="pcin" type="password" inputmode="numeric" autocomplete="off" maxlength="8" aria-label="New code"><input class="pcin" id="pcin2" type="password" inputmode="numeric" autocomplete="off" maxlength="8" aria-label="Type the code again" placeholder="Again"><div class="endbtns"><button class="listen sm" data-mact="ok">Save the code</button><button class="ghost sm" data-mclose>Cancel</button></div>`);
    MACT = { ok: () => {
            const a = (document.getElementById("pcin") || {}).value || "", b = (document.getElementById("pcin2") || {}).value || "";
            if (!/^\d{4,8}$/.test(a)) {
                toast("4 to 8 digits, please", 2200);
                return;
            }
            if (a !== b) {
                toast("The two codes are different", 2200);
                return;
            }
            try {
                localStorage.setItem(PCK, a);
            }
            catch (e) {
            }
            renderMe();
            toast("Parent code saved", 2000);
        } };
    setTimeout(() => {
        const i = document.getElementById("pcin");
        if (i)
            try {
                i.focus();
            }
            catch (e) {
            }
    }, 90);
}
document.getElementById("modal").addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.classList && e.target.classList.contains("pcin")) {
        e.preventDefault();
        const b = document.querySelector('#modal [data-mact="ok"]');
        if (b)
            b.click();
    }
});
(function () {
    const RM0 = renderMe;
    renderMe = function () {
        RM0();
        const body = document.getElementById("mebody"), c = pcode();
        const html = `<div class="dsec"><h2>Save &amp; move</h2></div>
<p class="menote">Your progress is kept in this browser. Save it in a file to keep a copy, or load it on another phone or computer: the work done on both is put together.</p>
<div class="mebtns"><button class="ghost sm" id="meExp">Save my progress</button><button class="ghost sm" id="meImp">Load a save</button></div><input type="file" id="meImpF" accept=".json,application/json" hidden>
<div class="dsec"><h2>Parent code</h2></div>
<p class="menote">${c ? "A parent code protects changing the level, deleting a learner and loading a save." : "Without a parent code, changing the level or deleting a learner asks to type the first name. A parent code is safer."}</p>
<div class="mebtns">${c ? `<button class="ghost sm" id="mePcChg">Change the code</button><button class="ghost sm" id="mePcDel">Remove the code</button>` : `<button class="ghost sm" id="mePcSet">Set a parent code</button>`}</div>`;
        const del = [...body.querySelectorAll(".dsec")].find(x => /Delete/.test(x.textContent));
        if (del)
            del.insertAdjacentHTML("beforebegin", html);
        else
            body.insertAdjacentHTML("beforeend", html);
    };
})();
document.getElementById("mebody").addEventListener("change", e => {
    if (e.target.id === "meImpF" && e.target.files && e.target.files[0]) {
        kaiImport(e.target.files[0]);
        e.target.value = "";
    }
});
document.getElementById("mebody").addEventListener("click", e => {
    const t = e.target;
    if (GATEOK)
        return;
    const ml = t.closest("[data-mlv]");
    if (ml) {
        const p = curProf();
        if (p && +ml.dataset.mlv !== lvOf(p)) {
            e.stopPropagation();
            e.preventDefault();
            gate(`Change the level of ${esc(p.name)} to <b>${LV[+ml.dataset.mlv].name}</b> (${LV[+ml.dataset.mlv].words} words a day)?`, () => {
                GATEOK = true;
                try {
                    ml.click();
                }
                finally {
                    GATEOK = false;
                }
            });
        }
        return;
    }
    const dl = t.closest("#meDel");
    if (dl) {
        e.stopPropagation();
        e.preventDefault();
        const p = curProf();
        gate(`Delete <b>${esc(p ? p.name : "")}</b> and all their progress?`, () => {
            GATEOK = true;
            try {
                dl.click();
            }
            finally {
                GATEOK = false;
            }
        });
        return;
    }
    if (t.closest("#meExp")) {
        e.stopPropagation();
        kaiExport();
        return;
    }
    if (t.closest("#meImp")) {
        e.stopPropagation();
        const go = () => document.getElementById("meImpF").click();
        if (pcode())
            gate("Load a save on this device?", go);
        else
            go();
        return;
    }
    if (t.closest("#mePcSet")) {
        e.stopPropagation();
        askNewCode();
        return;
    }
    if (t.closest("#mePcChg")) {
        e.stopPropagation();
        gate("Type the current code first.", askNewCode);
        return;
    }
    if (t.closest("#mePcDel")) {
        e.stopPropagation();
        gate("Type the code to remove it.", () => {
            try {
                localStorage.removeItem(PCK);
            }
            catch (e) {
            }
            renderMe();
            toast("Parent code removed", 2000);
        });
    }
}, true);
