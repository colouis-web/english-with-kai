/* Kai discute (PO, 13/11) : sur la carte Kai du menu, la phrase n'est plus toujours la même.
   Kai salue selon l'heure, parle de la journée (mots du jour à faire, en cours, faits), de la série de jours, d'un contrôle
   qui approche, d'une longue absence, d'une nouvelle semaine, d'un passage de niveau… Quand les mots du jour sont faits,
   il demande la forme du jour : l'élève répond d'un toucher (les 6 humeurs de My activity, même enregistrement r.mood),
   et Kai réagit. Des réponses courtes sous la bulle (« Let's go! », « Not now »…) mènent au tour de mots, à la leçon de la semaine
   ou à My weekly review. Une phrase est tirée au sort parmi plusieurs, mais reste la même toute la journée.
   Anglais britannique, niveau A1–A2. Script classique, chargé après app-menu-cartes.js (il réutilise ses fonctions). */
"use strict";
let KTALK = { key: "", mode: "" };   /* étape de la discussion du jour, en mémoire seulement (« later », « react », « bye ») */
function kaiTalk() {
    const p = curProf(), N = p.name, today = todayKey(), r = DST.days[today], n = (r && r.n) || target(), m = Math.min(masteredOf(r), n), done = dayDone(r);
    const key = p.id + today;
    if (KTALK.key !== key)
        KTALK = { key, mode: "" };
    const h = new Date().getHours(), H = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    let seed = 0;
    for (const c of key)
        seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
    const pick = a => a[seed % a.length], w = k => `${k} word${k > 1 ? "s" : ""}`;
    const GO = { id: "go", label: "Let's go!" }, NOTNOW = { id: "later", label: "Not now" };
    /* un passage de niveau aujourd'hui passe avant tout */
    if (p.lvSince === today && lvOf(p) > 0 && !KTALK.mode)
        return { say: `Wow, ${N}! You are now *${LV[lvOf(p)].name}*! That's *${w(n)}* a day now.`, chips: done ? [] : [GO] };
    if (!done) {
        if (KTALK.mode === "later")
            return { say: `OK! I'll be *here* when you're ready.`, chips: [GO] };
        if (m > 0) {
            const left = n - m;
            return { say: pick([`Well done, ${N}! Only *${w(left)}* left today. You can do it!`, `Keep going, ${N}! *${left} more* and you're done for today!`]), chips: [{ id: "go", label: "Next words" }, NOTNOW] };
        }
        /* rien encore aujourd'hui */
        let last = null;
        Object.keys(DST.days).filter(k => k < today && dayActive(DST.days[k])).forEach(k => {
            if (!last || k > last)
                last = k;
        });
        const away = last ? daysBetween(last, today) : 0, s = streak();
        let t6 = null;
        try {
            t6 = T6.filter(x => t6Days(x.date) >= 0 && t6Days(x.date) <= 3).sort((a, b) => a.date.localeCompare(b.date))[0];
        }
        catch (e) {
        }
        if (t6) {
            const d = t6Days(t6.date);
            return { say: `${H}, ${N}! Your class test is *${d === 0 ? "today" : d === 1 ? "tomorrow" : `in ${d} days`}*. Let's revise!`, chips: [{ id: "t6", label: "Revise", t6: t6.id }, GO] };
        }
        if (away >= 3)
            return { say: `${H}, ${N}! I *missed* you! Shall we learn some words?`, chips: [GO, NOTNOW] };
        if (s >= 2)
            return { say: `${H}, ${N}! *${s} days* in a row! Let's make it *${s + 1}*!`, chips: [GO, NOTNOW] };
        if (new Date().getDay() === 1)
            return { say: `${H}, ${N}! A *new week* starts today. Ready for your *${w(n)}*?`, chips: [GO, NOTNOW] };
        return { say: pick([`${H}, ${N}! Ready for your *${w(n)}*?`, `${H}, ${N}! New words are *waiting* for you!`, `${H}, ${N}! Let's learn English *together*!`]), chips: [GO, NOTNOW] };
    }
    /* mots du jour faits : la forme du jour */
    const md = moodOf(r.mood);
    if (!md)
        return { say: pick([`Bravo, ${N}! You learned your *${w(n)}* today! How do you *feel*?`, `Yes! All your words are done, ${N}! How do you *feel* today?`]), moods: true };
    if (KTALK.mode === "bye")
        return { say: `See you *tomorrow*, ${N}!`, chips: [] };
    const happy = md.id === "great" || md.id === "good";
    if (KTALK.mode === "react")
        return { say: md.say + (happy ? " Do you want a *bonus round*?" : md.id === "okay" ? " See you tomorrow!" : ""), face: md.img, chips: happy ? [{ id: "go", label: "Yes!" }, { id: "bye", label: "No, thanks" }] : [] };
    if (!happy && md.id !== "okay")
        return { say: md.id === "tired" ? `You feel *tired* today. Have a good rest, ${N}!` : md.id === "grumpy" ? `Tomorrow will be *better*, ${N}!` : `I'm *here* with you, ${N}. See you tomorrow!`, face: md.img, chips: [] };
    /* bonne forme : on regarde la semaine */
    const todo = ["grammar", "conj"].find(t => !weekLesson(t));
    if (todo) {
        const id = suggestLesson(todo);
        return { say: `You feel *${md.id === "okay" ? "okay" : md.en.toLowerCase()}* today! Your ${todo === "grammar" ? "grammar" : "conjugation"} lesson is waiting: *${LESSONS[id].title}*.`, face: md.img, chips: [{ id: "lesson", label: "Open it", lesson: id }, { id: "bye", label: "Later" }] };
    }
    const W = testWeeks(1), NT = Object.keys(TESTS).length, nt = Object.keys(TESTS).filter(k => W.tab[k][0]).length;
    if (nt < NT)
        return { say: `Both lessons are done this week! Your *weekly review* is ready.`, face: md.img, chips: [{ id: "tests", label: "Let's see" }, { id: "bye", label: "Later" }] };
    return { say: `Everything is done this week, ${N}. You're a *star*!`, face: "joy", chips: [{ id: "go", label: "Bonus round" }] };
}
/* dessine la bulle (même mise en page que renderMenuHead, la taille suit la phrase) et les réponses dessous */
function kaiTalkRender() {
    const host = document.getElementById("mhead");
    if (!host || !curProf())
        return;
    const T = kaiTalk(), fs = bubbleFs(), lh = Math.round(fs * 1.4), rx = 116, { rows, n, ry } = bubbleFit(T.say, fs, lh, rx, 170);
    const R = Math.max(60, ry), VH = Math.max(164, Math.round(2 * R + 8)), c = [216, VH / 2 - 2], tip = [100, c[1]];
    ASK.say = plain(T.say);
    const chips = T.moods ? `<div class="kmoods" role="group" aria-label="How do you feel today?">${MOODS.map(x => `<button type="button" class="kmood" data-kmood="${x.id}"><img src="img/kai-${x.img}.webp" alt=""><b>${x.en}</b></button>`).join("")}</div>`
        : T.chips.length ? `<div class="kchips">${T.chips.map(x => `<button type="button" class="kchip" data-kc="${x.id}"${x.lesson ? ` data-kl="${x.lesson}"` : ""}${x.t6 ? ` data-kt6="${x.t6}"` : ""}>${x.label}</button>`).join("")}</div>` : "";
    host.innerHTML = `<svg viewBox="0 0 360 ${VH}" role="img" aria-label="Kai : ${esc(ASK.say)}"><image class="kai kb" id="bust" href="img/kai-bust.webp" x="10" y="${VH - 158}" width="101" height="150"/>
<g class="bb b1 kb" id="askb" role="button" tabindex="0" aria-label="${esc(ASK.say)}"><path d="${bubblePath(c, [rx, R], tip)}" fill="#fff" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><text text-anchor="middle">${rows.map((row, j) => `<tspan x="${c[0]}" y="${f1(c[1] - (n - 1) * lh / 2 + fs * .33 + j * lh)}">${rowTok(row)}</tspan>`).join("")}</text></g></svg>${chips}`;
}
(function () {
    const RMH = renderMenuHead;
    renderMenuHead = function () {
        const v = RMH.apply(this, arguments);
        try {
            kaiTalkRender();
        }
        catch (e) {
        }
        return v;
    };
    const UDT = updateDailyTile;
    updateDailyTile = function () {
        const v = UDT.apply(this, arguments);
        try {
            kaiTalkRender();
        }
        catch (e) {
        }
        return v;
    };
    const say = () => setTimeout(() => sayOne(ASK.say, document.getElementById("askb")), 150);
    document.getElementById("mhead").addEventListener("click", e => {
        const md = e.target.closest("[data-kmood]");
        if (md) {
            const r = JSON.parse(JSON.stringify(dToday()));
            r.mood = md.dataset.kmood;
            dPut(r);
            KTALK.mode = "react";
            kaiTalkRender();
            say();
            return;
        }
        const b = e.target.closest("[data-kc]");
        if (!b)
            return;
        const id = b.dataset.kc;
        if (id === "go")
            document.getElementById("mcround").click();
        else if (id === "lesson") {
            LFROM = null;
            openLesson(b.dataset.kl);
        }
        else if (id === "tests")
            openTests();
        else if (id === "t6") {   /* comme le bandeau « Class test » de My activity */
            DAILY = false;
            t6Detail(b.dataset.kt6);
            show("t6");
        }
        else {
            KTALK.mode = id;   /* « later » ou « bye » */
            kaiTalkRender();
            say();
        }
    });
    kaiTalkRender();
})();
