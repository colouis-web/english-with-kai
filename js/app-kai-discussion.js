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
    /* PO, 17/11 : un dialogue plus riche — un mot d'accueil (retour, week-end, heure) puis une phrase sur ce qu'il y a à faire */
    let last = null;
    Object.keys(DST.days).filter(k => k < today && dayActive(DST.days[k])).forEach(k => {
        if (!last || k > last)
            last = k;
    });
    const away = last ? daysBetween(last, today) : 0, s = streak(), wd = new Date().getDay(), late = wd === 0 || wd >= 4;
    const todoL = ["grammar", "conj"].find(t => !weekLesson(t)), lname = t => t === "grammar" ? "grammar" : "conjugation";
    const dzTodo = typeof dzWeek === "function" && !dzWeek();
    let npk = 0;
    try {
        npk = weekKeys(today).reduce((a, k) => a + pkOf(k).length, 0);
    }
    catch (e) {
    }
    const startedToday = r && dayActive(r);
    /* le mot d'accueil */
    const hello = () => {
        if (startedToday)
            return pick([`Welcome back, ${N}!`, `Hello again, ${N}!`, `You're back, ${N}!`]);
        if (away >= 3)
            return pick([`${N}, you're back! I *missed* you!`, `Welcome back, ${N}! I *missed* you so much!`]);
        if (away === 2)
            return `Welcome back, ${N}! I *missed* you yesterday.`;
        if (h >= 21)
            return `Hi ${N}! It's quite *late*.`;
        if (wd === 6 || wd === 0)
            return pick([`Happy ${wd === 6 ? "Saturday" : "Sunday"}, ${N}!`, `${H}, ${N}! It's the *weekend*!`]);
        if (wd === 1)
            return `${H}, ${N}! A *new week* starts today.`;
        return pick([`${H}, ${N}!`, `Welcome back, ${N}!`, `Hello, ${N}! Nice to see you.`, `${H}, ${N}! How are you?`]);
    };
    if (!done) {
        if (KTALK.mode === "later")
            return { say: `OK, ${N}! I'll be *here* when you're ready.`, chips: [GO] };
        if (m > 0) {
            const left = n - m;
            return { say: `${hello()} ${pick(m >= n / 2 ? [`Only *${w(left)}* left today. You can do it!`, `You're more than *halfway* there! *${left} more* to go.`] : [`*${w(left)}* left today. Let's finish them!`, `Keep going! *${left} more* and you're done for today.`])}`, chips: [{ id: "go", label: "Next words" }, NOTNOW] };
        }
        if (!last && !startedToday)   /* tout premier jour : Kai se présente */
            return { say: `Welcome, ${N}! I'm *Kai*. Let's learn English *together*!`, chips: [GO, NOTNOW] };
        let t6 = null;
        try {
            t6 = T6.filter(x => t6Days(x.date) >= 0 && t6Days(x.date) <= 3).sort((a, b) => a.date.localeCompare(b.date))[0];
        }
        catch (e) {
        }
        if (t6) {
            const d = t6Days(t6.date);
            return { say: `${hello()} Your class test is *${d === 0 ? "today" : d === 1 ? "tomorrow" : `in ${d} days`}*. Let's revise!`, chips: [{ id: "t6", label: "Revise", t6: t6.id }, GO] };
        }
        if (h >= 21)
            return { say: `${hello()} Just a few *words* before bed?`, chips: [GO, NOTNOW] };
        /* fin de semaine : ce qu'il reste à faire passe en premier */
        if (late && todoL)
            return { say: `${hello()} You need to do your *${lname(todoL)} lesson* this week. Your words first?`, chips: [GO, { id: "lesson", label: "The lesson", lesson: suggestLesson(todoL) }] };
        if (late && dzTodo && wd !== 4)
            return { say: `${hello()} Don't forget your *dictation* this week! Your words first?`, chips: [GO, { id: "dict", label: "Dictation" }] };
        if (s >= 2)
            return { say: `${hello()} *${s} days* in a row! Let's make it *${s + 1}*!`, chips: [GO, NOTNOW] };
        if (npk >= 3 && seed % 3 === 0)
            return { say: `${hello()} You picked *${npk} words* this week. Revise them, then learn new ones!`, chips: [GO, { id: "picks", label: "My picks" }] };
        return { say: `${hello()} ${pick([`Ready for your *${w(n)}*?`, `New words are *waiting* for you!`, `Let's learn some *English* together!`, `What will we *learn* today?`, `Your *${w(n)}* are ready. Shall we start?`])}`, chips: [GO, NOTNOW] };
    }
    /* mots du jour faits : la forme du jour */
    const md = moodOf(r.mood);
    if (!md)
        return { say: pick([`Bravo, ${N}! You learned your *${w(n)}* today! How do you *feel*?`, `Yes! All your words are done, ${N}! How do you *feel* today?`]), moods: true };
    if (KTALK.mode === "bye")
        return { say: `See you *tomorrow*, ${N}!`, chips: [] };
    const happy = md.id === "great" || md.id === "good";
    if (KTALK.mode === "react")
        return { say: md.say + (happy ? ` Do you want a *bonus round*, ${N}?` : md.id === "okay" ? ` See you tomorrow, ${N}!` : ` See you tomorrow, ${N}.`), face: md.img, chips: happy ? [{ id: "go", label: "Yes!" }, { id: "bye", label: "No, thanks" }] : [] };
    if (!happy && md.id !== "okay")
        return { say: md.id === "tired" ? `You feel *tired* today. Have a good rest, ${N}!` : md.id === "grumpy" ? `Tomorrow will be *better*, ${N}!` : `I'm *here* with you, ${N}. See you tomorrow!`, face: md.img, chips: [] };
    /* bonne forme : on regarde la semaine */
    const todo = ["grammar", "conj"].find(t => !weekLesson(t));
    if (todo) {
        const id = suggestLesson(todo);
        return { say: pick([`You feel *${md.id === "okay" ? "okay" : md.en.toLowerCase()}* today, ${N}! Your ${lname(todo)} lesson is waiting: *${LESSONS[id].title}*.`, `Welcome back, ${N}! You need to do your *${lname(todo)} lesson* this week: *${LESSONS[id].title}*.`, `Your words are done, ${N}! Now, what about your *${lname(todo)} lesson*? It's *${LESSONS[id].title}*.`]), face: md.img, chips: [{ id: "lesson", label: "Open it", lesson: id }, { id: "bye", label: "Later" }] };
    }
    if (typeof dzWeek === "function" && !dzWeek())   /* Dictation, tâche de la semaine (PO, 14/11) */
        return { say: pick([`Both lessons are done, ${N}! Now your *dictation* of the week!`, `Great work this week, ${N}! You still need to do your *dictation*. Listen and type!`]), face: md.img, chips: [{ id: "dict", label: "Let's do it" }, { id: "bye", label: "Later" }] };
    const W = testWeeks(1), NT = Object.keys(TESTS).length, nt = Object.keys(TESTS).filter(k => W.tab[k][0]).length;
    if (nt < NT)
        return { say: `Well done, ${N}! Your *weekly review* is ready.`, face: md.img, chips: [{ id: "tests", label: "Let's see" }, { id: "bye", label: "Later" }] };
    return { say: pick([`Everything is done this week, ${N}. You're a *star*!`, `What a week, ${N}! Everything is *done*. See you tomorrow!`, `Lessons, dictation, review: all *done*! I'm so proud of you, ${N}!`]), face: "joy", chips: npk ? [{ id: "picks", label: "My picks" }, { id: "go", label: "Bonus round" }] : [{ id: "go", label: "Bonus round" }] };
}
/* dessine la bulle (même mise en page que renderMenuHead, la taille suit la phrase) et les réponses dessous */
function kaiTalkRender() {
    const host = document.getElementById("mhead");
    if (!host || !curProf())
        return;
    const T = kaiTalk(), fs = bubbleFs(), lh = Math.round(fs * 1.4), rx = 128, { rows, n, ry } = bubbleFit(T.say, fs, lh, rx, 200);   /* bulle plus large : les phrases de Kai sont plus longues (PO, 17/11) */
    const R = Math.max(60, ry), VH = Math.max(164, Math.round(2 * R + 8)), c = [228, VH / 2 - 2], tip = [104, c[1]];
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
        else if (id === "dict")
            openDict("menu");
        else if (id === "picks")
            openPicks();
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
