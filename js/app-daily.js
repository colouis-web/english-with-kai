/* Code — tranche de l'ancien index.html (lignes 1351–1582). Script classique : l'ordre des <script> compte. */
"use strict";
/* ===== MY DAILY WORK : niveaux, mots du jour, leçons de la semaine, récompenses, calendrier ===== */
let DAILY = false, DTAB = "today", CALM = 0, CSEL = null, MOODEDIT = false, LVUP = null;
const KSHORT = { verbs: "verb", nouns: "noun", adjectives: "adj.", adverbs: "adv.", connectors: "conn.", prepositions: "prep." };
const MOODS = [{ id: "great", img: "smile", en: "Great", fr: "Super", say: "Great! Let's *learn* together!" },
    { id: "good", img: "face", en: "Good", fr: "Bien", say: "Cool! Ready for your *words*?" },
    { id: "okay", img: "head", en: "OK", fr: "Ça va", say: "OK! Ten words at a time: *easy*!" },
    { id: "tired", img: "bored", en: "Tired", fr: "Fatigué", say: "Tired? Just a few *words*, you can do it!" },
    { id: "grumpy", img: "grumpy", en: "Grumpy", fr: "Grognon", say: "Grumpy? A good *score* will help!" },
    { id: "sad", img: "cry", en: "Sad", fr: "Triste", say: "Sad? I'm *here* with you!" }];
/* niveaux de l'élève : mots par jour (dont des mots à revoir), et ce qu'il faut pour passer au niveau suivant */
const LV = [{ id: "beginner", name: "Beginner", fr: "Débutant", cefr: "A1", words: 10, rev: 3, req: null },
    { id: "practicer", name: "Elementary", fr: "Pratiquant", cefr: "A2", words: 15, rev: 5, req: { days: 15, words: 250, acc: 80, lessons: 3 } },
    { id: "confirmed", name: "Intermediate", fr: "Confirmé", cefr: "B1", words: 20, rev: 8, req: { days: 20, words: 600, acc: 85, lessons: 6 } },
    { id: "expert", name: "Expert", fr: "Expert", cefr: "B2", words: 30, rev: 15, req: { days: 25, words: 1000, acc: 90, lessons: 9 } }];
const RANKS = [[0, "Rookie"], [25, "Explorer"], [75, "Adventurer"], [150, "Champion"], [300, "Hero"], [500, "Master"], [800, "Legend"]];
const MEDALS = [[2, "Bronze"], [5, "Silver"], [10, "Gold"]];
const lvOf = p => p && Number.isInteger(p.lv) && LV[p.lv] ? p.lv : 0;
/* --- profils : chaque membre de la famille a sa propre progression --- */
const PKEY = "kai.profiles.v1";
let PROFS = { list: [], cur: null }, PICKED = false;
try {
    const v = JSON.parse(localStorage.getItem(PKEY) || "null");
    if (v && Array.isArray(v.list))
        PROFS = { list: v.list, cur: v.cur || null };
}
catch (e) {
}
const pSave = () => {
    try {
        localStorage.setItem(PKEY, JSON.stringify(PROFS));
    }
    catch (e) {
    }
};
const curProf = () => PROFS.list.find(p => p.id === PROFS.cur) || null;
const newPid = () => "k" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const dayKey = pid => "kai.daily.v1." + pid;
function loadDays(pid) {
    try {
        return JSON.parse(localStorage.getItem(dayKey(pid)) || "{}") || {};
    }
    catch (e) {
        return {};
    }
}
/* --- stockage : sur l'appareil, et dans le compte Claude quand la base de l'artefact est disponible --- */
const DST = { days: PROFS.cur ? loadDays(PROFS.cur) : {}, db: null, uid: null, q: Promise.resolve(), legacy: null };
const dSaveLocal = () => {
    if (!PROFS.cur)
        return;
    try {
        localStorage.setItem(dayKey(PROFS.cur), JSON.stringify(DST.days));
    }
    catch (e) {
    }
};
const dbOff = e => {
    if (e && (e.code === "invalid_argument" || e.code === "revoked" || e.code === "not_granted"))
        DST.db = null;
};
const pDoc = pid => DST.db.doc("data/users/" + DST.uid + "/p-" + pid);
function dbWrite(fn) {
    if (!DST.db || !DST.uid)
        return;
    DST.q = DST.q.then(fn).catch(dbOff);
}
function dPush(rec, pid) {
    pid = pid || PROFS.cur;
    if (!pid)
        return;
    const body = JSON.parse(JSON.stringify(rec));
    dbWrite(() => pDoc(pid).collection("days").doc(rec.d).set(body));
}
const PFIELDS = ["name", "u", "lessons", "lv", "lvSince", "lvHist", "tests"];
function pPush(p) {
    const body = { id: p.id };
    PFIELDS.forEach(f => {
        if (p[f] !== undefined)
            body[f] = p[f];
    });
    dbWrite(() => pDoc(p.id).set(body));
}
function dPut(rec) {
    if (!PROFS.cur)
        return;
    rec.u = Date.now();
    DST.days[rec.d] = rec;
    dSaveLocal();
    dPush(rec);
}
function addProfile(name, lv) {
    lv = LV[lv] ? lv : 0;
    const t = todayKey(), p = { id: newPid(), name, u: Date.now(), lv, lvSince: t, lvHist: [{ lv, d: t }] };
    /* la progression enregistrée avant les profils revient au premier élève créé */
    if (!PROFS.list.length) {
        p.first = 1;
        try {
            const old = localStorage.getItem("kai.daily.v1");
            if (old) {
                localStorage.setItem(dayKey(p.id), old);
                localStorage.removeItem("kai.daily.v1");
            }
        }
        catch (e) {
        }
    }
    PROFS.list.push(p);
    pSave();
    pPush(p);
    return p;
}
function setLevel(p, lv) {
    if (!p || !LV[lv] || lvOf(p) === lv)
        return;
    const t = todayKey();
    p.lv = lv;
    p.lvSince = t;
    p.lvHist = [...(p.lvHist || []), { lv, d: t }];
    p.u = Date.now();
    pSave();
    pPush(p);
    AWS = null;
    if (p === curProf())
        updateDailyTile();
}
/* supprimer un élève : sur l'appareil et dans le compte (une marque « supprimé » prévient les autres appareils) */
function deleteProfile(pid) {
    const p = PROFS.list.find(x => x.id === pid);
    if (!p)
        return;
    if (DST.db && DST.uid) {
        const body = { id: p.id, name: p.name, deleted: true, u: Date.now() };
        dbWrite(() => pDoc(pid).set(body));
        dbWrite(async () => {
            const s = await pDoc(pid).collection("days").limit(1000).get();
            for (const d of s.docs)
                await pDoc(pid).collection("days").doc(d.id).delete();
        });
    }
    try {
        localStorage.removeItem(dayKey(pid));
    }
    catch (e) {
    }
    PROFS.list = PROFS.list.filter(x => x.id !== pid);
    if (PROFS.cur === pid) {
        PROFS.cur = null;
        DST.days = {};
    }
    PICKED = false;
    pSave();
    updateDailyTile();
    renderMenuHead();
}
function useProfile(pid) {
    PROFS.cur = pid;
    pSave();
    DST.days = loadDays(pid);
    AWS = null;
    PICKED = true;
    updateDailyTile();
    renderMenuHead();
    syncDays();
}
async function dSync() {
    try {
        if (!window.claude || !window.claude.use)
            return;
        const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
        if (!db || !user)
            return;
        const uid = await user.id();
        if (!uid)
            return;
        DST.db = db;
        DST.uid = uid;
        const snap = await db.collection("data/users/" + uid).limit(1000).get(), rp = [], legacy = {};
        snap.docs.forEach(x => {
            const v = x.data();
            if (!v)
                return;
            if (x.id.startsWith("p-") && v.id)
                rp.push(v);
            else if (v.d)
                legacy[v.d] = v;
        });
        DST.legacy = Object.keys(legacy).length ? legacy : null;
        let pc = false;
        for (const r of rp) {
            const l = PROFS.list.find(p => p.id === r.id);
            if (r.deleted) {
                if (l && (r.u || 0) >= (l.u || 0)) {
                    PROFS.list = PROFS.list.filter(p => p.id !== r.id);
                    try {
                        localStorage.removeItem(dayKey(r.id));
                    }
                    catch (e) {
                    }
                    if (PROFS.cur === r.id) {
                        PROFS.cur = null;
                        DST.days = {};
                        PICKED = false;
                    }
                    pc = true;
                }
                continue;
            }
            if (!r.name)
                continue;
            if (!l) {
                const n = { id: r.id };
                PFIELDS.forEach(f => {
                    if (r[f] !== undefined)
                        n[f] = r[f];
                });
                PROFS.list.push(n);
                pc = true;
            }
            else if ((r.u || 0) > (l.u || 0)) {
                PFIELDS.forEach(f => {
                    if (r[f] !== undefined)
                        l[f] = r[f];
                });
                pc = true;
            }
        }
        for (const l of PROFS.list) {
            const r = rp.find(x => x.id === l.id);
            if (!r || (!r.deleted && (l.u || 0) > (r.u || 0)))
                pPush(l);
        }
        if (pc) {
            pSave();
            AWS = null;
            renderWho();
            renderMenuHead();
            updateDailyTile();
        }
        await syncDays();
    }
    catch (e) {
    }
}
async function syncDays() {
    try {
        const p = curProf();
        if (!DST.db || !p)
            return;
        const pid = p.id, snap = await pDoc(pid).collection("days").limit(1000).get();
        if (PROFS.cur !== pid)
            return;
        const remote = {};
        snap.docs.forEach(x => {
            const v = x.data();
            if (v && v.d)
                remote[v.d] = v;
        });
        const src = Object.assign({}, (p.first || PROFS.list[0] === p) && DST.legacy ? DST.legacy : {}, remote);
        let changed = false;
        for (const k in src) {
            const r = src[k], l = DST.days[k];
            if (!l || (r.u || 0) > (l.u || 0)) {
                DST.days[k] = JSON.parse(JSON.stringify(r));
                changed = true;
            }
        }
        for (const k in DST.days) {
            const l = DST.days[k], r = remote[k];
            if (!r || (l.u || 0) > (r.u || 0))
                dPush(l, pid);
        }
        if (changed) {
            dSaveLocal();
            AWS = null;
            updateDailyTile();
            if (document.getElementById("daily").classList.contains("on"))
                renderDaily();
        }
    }
    catch (e) {
    }
}
/* --- dates --- */
const dKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayKey = () => dKey(new Date());
const kDate = k => {
    const [y, m, d] = k.split("-").map(Number);
    return new Date(y, m - 1, d);
};
const addDays = (k, n) => {
    const d = kDate(k);
    d.setDate(d.getDate() + n);
    return dKey(d);
};
const daysBetween = (a, b) => Math.round((kDate(b) - kDate(a)) / 864e5);
const longDate = k => kDate(k).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
const weekKeys = t => {
    const dow = (kDate(t).getDay() + 6) % 7;
    return [...Array(7)].map((_, i) => addDays(t, i - dow));
};
/* --- une journée : mots maîtrisés, objectif, bonus, étoiles --- */
const target = () => LV[lvOf(curProf())].words;
function dToday() {
    const k = todayKey();
    return DST.days[k] || { d: k, mood: null, qs: [], w: {}, n: target() };
}
const wordsOf = r => Object.values((r && r.w) || {});
const masteredOf = r => wordsOf(r).filter(w => w.ok || w.fx).length;
const isLesson = q => q.k.startsWith("lesson-");
const dayDone = r => !!r && (r.n ? masteredOf(r) >= r.n : !!(r.g && Object.keys(r.g).length >= 5));
const bonusOf = r => !r ? 0 : r.goalT ? (r.qs || []).filter(q => q.t > r.goalT).length : !r.n && dayDone(r) ? Math.max(0, (r.qs || []).length - Object.keys(r.g || {}).length) : 0;
const perfOf = r => r ? (r.qs || []).filter(q => !isLesson(q) && q.p === 100).length : 0;
const lessonsOfDay = r => r ? (r.qs || []).filter(q => isLesson(q) && q.p >= PASS).length : 0;
const starsOf = r => r ? Math.floor(masteredOf(r) / 5) + (dayDone(r) ? 3 : 0) + bonusOf(r) + perfOf(r) + 2 * lessonsOfDay(r) : 0;
const totalStars = () => Object.values(DST.days).reduce((s, r) => s + starsOf(r), 0);
function streak() {
    let k = todayKey(), n = 0;
    if (!dayDone(DST.days[k]))
        k = addDays(k, -1);
    while (dayDone(DST.days[k])) {
        n++;
        k = addDays(k, -1);
    }
    return n;
}
function rankOf(st) {
    let i = 0;
    while (i + 1 < RANKS.length && st >= RANKS[i + 1][0])
        i++;
    return { i, name: RANKS[i][1], next: RANKS[i + 1] || null, from: RANKS[i][0] };
}
/* --- mémoire des mots (répétition espacée) : un mot réussi revient après 1, 2, 4, 8, 16 puis 32 jours --- */
const INTV = [1, 1, 2, 4, 8, 16, 32];
let AWS = null;
function wordState() {
    if (AWS && AWS.t === todayKey() && AWS.n === Object.keys(DST.days).length && AWS.u === Math.max(0, ...Object.values(DST.days).map(r => r.u || 0)))
        return AWS.S;
    const S = {};
    for (const k of Object.keys(DST.days).sort()) {
        const r = DST.days[k];
        for (const [key, w] of Object.entries(r.w || {})) {
            const s = S[key] || (S[key] = { b: 0, last: k, k: w.k });
            const ok = !!(w.ok || w.fx);
            s.b = ok ? Math.min(s.b + 1, INTV.length - 1) : 0;
            s.last = k;
            s.ok = ok;
        }
    }
    AWS = { t: todayKey(), n: Object.keys(DST.days).length, u: Math.max(0, ...Object.values(DST.days).map(r => r.u || 0)), S };
    return S;
}
let ALLW = null;
function allWords() {
    if (ALLW)
        return ALLW;
    ALLW = [];
    const add = (k, arr, th) => arr.forEach(d => ALLW.push({ k, d, key: k + ":" + (d.v || d.w), th: k + ":" + th(d) }));
    add("verbs", QPOOL, d => d.irr ? "irregular" : "regular");
    add("nouns", NDICT, d => d.cat);
    add("adjectives", ADJ.data, d => d.cat);
    add("adverbs", ADV.data, d => d.cat);
    add("connectors", CON.data, d => d.cat);
    add("prepositions", PREP.data, d => d.cat);
    ALLW.byKey = new Map(ALLW.map(w => [w.key, w]));
    return ALLW;
}
/* part de chaque nature dans les mots nouveaux : tous les types de mots reviennent régulièrement */
const SHARE = { nouns: .36, verbs: .28, adjectives: .12, adverbs: .08, connectors: .08, prepositions: .08 };
function quota(n) {
    const ks = Object.keys(SHARE), out = [], rem = [];
    ks.forEach(k => {
        const v = SHARE[k] * n;
        for (let i = 0; i < Math.floor(v); i++)
            out.push(k);
        rem.push([k, v - Math.floor(v)]);
    });
    while (out.length < n && rem.some(x => x[1] > 0)) {
        let r = Math.random() * rem.reduce((s, x) => s + x[1], 0), i = 0;
        while (i < rem.length - 1 && (r -= rem[i][1]) > 0)
            i++;
        out.push(rem[i][0]);
        rem[i][1] = 0;
    }
    while (out.length < n)
        out.push(ks[Math.floor(Math.random() * ks.length)]);
    return out;
}
/* une série de mots du jour : d'abord les mots à revoir, puis des mots nouveaux pris dans le thème le moins vu */
function pickMix(size) {
    const t = todayKey(), S = wordState(), A = allWords(), lv = LV[lvOf(curProf())], seen = new Set(Object.keys((DST.days[t] || {}).w || {})), used = new Set();
    const lvn = lvOf(curProf()), sOk = w => typeof sensOk !== "function" || sensOk(w.k, w.d, lvn);
    /* un mot sensible déjà vu reste dans la mémoire de l'élève mais ne revient qu'à partir du niveau 2 */
    const due = Object.entries(S).filter(([key, s]) => !seen.has(key) && A.byKey.has(key) && daysBetween(s.last, t) >= INTV[s.b] && sOk(A.byKey.get(key))).sort((a, b) => a[1].b - b[1].b || a[1].last.localeCompare(b[1].last)).map(([key]) => A.byKey.get(key));
    const out = due.slice(0, Math.round(size * lv.rev / lv.words));
    out.forEach(w => used.add(w.key));
    for (const k of quota(size - out.length)) {
        let free = A.filter(w => w.k === k && !used.has(w.key) && !seen.has(w.key) && lvOkWord(w.k, w.d, lvn));
        if (!free.length)
            free = A.filter(w => w.k === k && !used.has(w.key) && !seen.has(w.key) && sOk(w));
        let pool = free.filter(w => !S[w.key]);
        if (!pool.length)
            pool = free.slice().sort((a, b) => S[a.key].last.localeCompare(S[b.key].last)).slice(0, 30);
        if (!pool.length)
            continue;
        const cov = {};
        A.forEach(w => {
            if (w.k !== k)
                return;
            const c = cov[w.th] || (cov[w.th] = { n: 0, s: 0 });
            c.n++;
            if (S[w.key] || used.has(w.key))
                c.s++;
        });
        const ths = [...new Set(pool.map(w => w.th))], best = Math.min(...ths.map(h => cov[h].s / cov[h].n)), th = shuffle(ths.filter(h => cov[h].s / cov[h].n <= best + 1e-9))[0];
        const pick = shuffle(pool.filter(w => w.th === th))[0];
        used.add(pick.key);
        out.push(pick);
    }
    return shuffle(out).map(w => {
        const x = KK(w.k), ok = [0, 1].filter(i => !x.eiOk || x.eiOk(w.d, i));
        return { d: w.d, ei: ok.length ? ok[Math.floor(Math.random() * ok.length)] : 0, k: w.k };
    });
}
function roundSize() {
    const r = dToday(), left = (r.n || target()) - masteredOf(r);
    return left > 0 ? Math.min(10, Math.max(5, left)) : 10;
}
/* --- enregistrer un quiz ou une leçon terminés --- */
function recordActivity(k, N, P, words, extra) {
    const rec = JSON.parse(JSON.stringify(dToday()));
    rec.qs = rec.qs || [];
    rec.w = rec.w || {};
    rec.n = target();
    rec.lv = lvOf(curProf());
    const was = dayDone(rec), t = Date.now();
    rec.qs.push(Object.assign({ k, n: N, p: P, t }, extra || {}));
    for (const { d, kind, ok } of words || []) {
        const key = kind + ":" + (d.v || d.w), o = rec.w[key];
        if (!o)
            rec.w[key] = { k: kind, e: recapLab(kind, d), f: d.fr, ok: ok ? 1 : 0 };
        else if (o.ok && !ok)
            o.ok = 0;
        else if (!o.ok)
            o.fx = ok ? 1 : 0;
    }
    const now = dayDone(rec);
    if (now && !was)
        rec.goalT = t;
    dPut(rec);
    AWS = null;
    updateDailyTile();
    return { reached: now && !was, bonus: was, rec, m: masteredOf(rec), n: rec.n };
}
function dailyRecord() {
    if (!QZ || QZ.rec)
        return null;
    QZ.rec = 1;
    const N = QZ.qs[0].length, s1 = QZ.qs[0].filter(q => q.res).length, s2 = QZ.qs[1].filter(q => q.res).length, P = pct(s1 + s2, 2 * N);
    const r = (ph, d) => !!(QZ.qs[ph].find(q => q.d === d) || {}).res;
    return recordActivity(QZ.kind, N, P, QZ.words.map(w => ({ d: w.d, kind: w.k || QZ.kind, ok: r(0, w.d) && r(1, w.d) })));
}
/* --- les leçons de la semaine (lundi → dimanche) --- */
function weekLesson(type) {
    for (const k of weekKeys(todayKey())) {
        const r = DST.days[k];
        for (const q of (r && r.qs) || [])
            if (isLesson(q) && q.p >= PASS) {
                const id = q.k.slice(7);
                if (LESSONS[id] && LESSONS[id].type === type)
                    return { id, p: q.p, d: k };
            }
    }
    return null;
}
function suggestLesson(type) {
    const ids = LORDER[type];
    return ids.find(id => (lessonBest(id) ?? -1) < PASS) || ids.slice().sort((a, b) => (lessonBest(a) ?? 0) - (lessonBest(b) ?? 0))[0];
}
/* --- passer au niveau suivant : régularité, mots connus, réussite, leçons --- */
function lvProgress(p) {
    if (!p)
        return null;
    const i = lvOf(p), next = LV[i + 1];
    if (!next)
        return null;
    const R = next.req, since = p.lvSince || "0000-00-00";
    const days = Object.values(DST.days).filter(r => r.d >= since && dayDone(r)).length, known = Object.values(wordState()).filter(s => s.ok).length;
    const rounds = Object.keys(DST.days).sort().flatMap(k => (DST.days[k].qs || []).filter(q => !isLesson(q) && !isTest(q))).slice(-10), acc = rounds.length ? Math.round(rounds.reduce((s, q) => s + q.p, 0) / rounds.length) : 0;
    const les = Object.entries(p.lessons || {}).filter(([id, v]) => LESSONS[id] && v.best >= PASS).length;
    const items = [["Days with your words goal", days, R.days, "", days >= R.days], ["Words you know", known, R.words, "", known >= R.words], [rounds.length >= 5 ? "Average score, last 10 quizzes" : `Average score (${5 - rounds.length} more quiz${5 - rounds.length > 1 ? "zes" : ""} needed)`, acc, R.acc, "%", rounds.length >= 5 && acc >= R.acc], ["Lessons passed", les, R.lessons, "", les >= R.lessons]];
    return { next, i: i + 1, items, ok: items.every(x => x[4]) };
}
function checkLevelUp() {
    const p = curProf(), g = p && lvProgress(p);
    if (g && g.ok) {
        setLevel(p, g.i);
        LVUP = g.i;
        return true;
    }
    return false;
}
function updateDailyTile() {
    const t = document.querySelector("#toDaily span");
    if (!t)
        return;
    const p = curProf();
    if (!p) {
        t.textContent = "Your words of the day";
        return;
    }
    const r = DST.days[todayKey()], m = masteredOf(r), n = (r && r.n) || target();
    t.textContent = dayDone(r) ? `Goal reached today: ${m} words!` : m ? `${m}/${n} words today` : `${LV[lvOf(p)].name} · ${n} words a day`;
    try {
        updateTestTile();
    }
    catch (e) {
    }
}
/* --- icônes --- */
const RW = (n, c) => `<img class="${c || "st"}" src="img/rw-${n}.webp" alt="">`;
const STAR = RW("star"), FLAME = RW("flame"), BOLT = RW("bolt");
const CHECK = '<svg class="stamp" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#1f9d55"/><path d="M6.8 12.4l3.6 3.6 6.8-7.2" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CROSS = '<svg class="stamp" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#e5484d"/><path d="M8.3 8.3l7.4 7.4M15.7 8.3l-7.4 7.4" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/></svg>';
const ARROW = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d ? "M9 5l7 7-7 7" : "M15 5 8 12l7 7"}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const trophySvg = () => RW("trophy", "bico");
const medalSvg = l => RW(l === "Gold" ? "medal" : "medal-" + l.toLowerCase(), "bico");
const moodOf = id => MOODS.find(m => m.id === id);
function kaiBig(pick, rows, label) {
    const img = END_L[pick];
    return `<svg viewBox="0 0 360 300" role="img" aria-label="Kai : ${esc(label)}"><image class="kai" href="img/kai-${pick}.webp" x="${img.x}" y="${img.y}" width="${img.w}" height="${img.h}" preserveAspectRatio="xMidYMax meet"/>
<g class="bb b1"><path d="${bubblePath(img.c, img.r, img.tip)}" fill="#fff" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><text text-anchor="middle">${rows.map((rw, j) => `<tspan x="${img.c[0]}" y="${f1(img.c[1] - (rows.length - 1) * 10 + 6 + j * 20)}">${rowSvg(rw)}</tspan>`).join("")}</text></g></svg>`;
}
/* --- morceaux d'interface --- */
function wordLists(r, open) {
    const W = wordsOf(r);
    if (!W.length)
        return `<p class="dnone">No words yet. Finish a round and your words will appear here.</p>`;
    const ok = W.filter(w => w.ok), ko = W.filter(w => !w.ok), li = w => `<li data-say="${esc(w.e)}"><span class="kt">${KSHORT[w.k] || ""}</span><b>${esc(w.e)}</b><i>${esc(w.f)}${!w.ok && w.fx ? ` <em class="fx">${CHECK}now OK</em>` : ""}</i></li>`;
    return `<details class="wd"${open ? " open" : ""}><summary class="wh ko">To review <span>${ko.length}</span></summary>${ko.length ? `<ul class="wlist ko">${ko.map(li).join("")}</ul>` : `<p class="dnone">No mistakes. Bravo!</p>`}</details>
<details class="wd"${open && ok.length <= 6 ? " open" : ""}><summary class="wh ok">Mastered <span>${ok.length}</span></summary>${ok.length ? `<ul class="wlist ok">${ok.map(li).join("")}</ul>` : `<p class="dnone">Not yet.</p>`}</details>`;
}
function moodBlock(r) {
    const m = moodOf(r.mood);
    if (m && !MOODEDIT)
        return `<div class="mymood"><img src="img/kai-${m.img}.webp" alt=""><div><i>Today I feel</i><b>${m.en}</b><small>${m.fr}</small></div><button class="ghost sm" id="dmoodchg">Change</button></div>`;
    return `<div class="qhead">${headSvg("Hi! How do you *feel* today?", "head")}</div>
<div class="moods" role="radiogroup" aria-label="My mood today">${MOODS.map(x => `<button class="mood${r.mood === x.id ? " on" : ""}" data-mood="${x.id}" role="radio" aria-checked="${r.mood === x.id}"><img src="img/kai-${x.img}.webp" alt=""><b>${x.en}</b><i>${x.fr}</i></button>`).join("")}</div>`;
}
function goalCard(r) {
    const p = curProf(), L = LV[lvOf(p)], n = r.n || L.words, m = masteredOf(r), done = dayDone(r), size = roundSize();
    return `<div class="wgoal${done ? " done" : ""}"><div class="wgh"><span class="lvb">${L.name} · ${L.cefr}</span><b>${n} words a day</b></div>
<div class="wcount"><b>${m}</b><span>/ ${n} words mastered</span>${done ? CHECK : ""}</div><div class="pbar big"><i style="width:${Math.min(100, 100 * m / n)}%"></i></div>
<p class="wtxt">${done ? "Goal reached! Every extra round gives bonus stars." : `Rounds of ${size} words from every theme: nouns, verbs, adjectives, prepositions… Words you missed come back later.`}</p>
<button class="listen wgo" id="dround"><span class="wgl">${done ? "Bonus round" : m ? "Next words" : "Start"} · ${size} words<small>≈ ${roundMin(size)} min</small></span>${GOSVG}</button><p class="wstreak">${FLAME}<span>One round a day keeps your streak going.${done ? "" : ` Today's goal: about ${Math.max(1, Math.ceil((n - m) / (size * .7))) * roundMin(size)} min.`}</span></p></div>`;
}
function weekTiles() {
    return `<div class="wtiles">${["grammar", "conj"].map(type => {
        const wk = weekLesson(type), id = wk ? wk.id : suggestLesson(type), L = LESSONS[id];
        return `<button class="wtile${wk ? " done" : ""}" data-wl="${id}"><span class="wtt">${type === "grammar" ? "Grammar" : "Conjugation"}</span><b>${esc(L.title)}</b><small>${wk ? `Done · ${wk.p}%` : lessonState(id) === "try" ? `Best ${lessonBest(id)}% · ${PASS}% to pass` : "1 lesson this week"}</small>${wk ? `<span class="gok">${CHECK}</span>` : `<span class="ggo">Go${ARROW(1)}</span>`}</button>`;
    }).join("")}</div>`;
}
function levelCard() {
    const p = curProf(), i = lvOf(p), L = LV[i], g = lvProgress(p);
    return `<div class="lvcard"><div class="lvtop"><span class="lvbig">${L.name}</span><span class="lvsub">${L.fr} · ${L.cefr} · ${L.words} words a day</span></div>
${g ? `<p class="lvnext">Road to <b>${g.next.name}</b> (${g.next.words} words a day):</p>${g.items.map(([lab, v, need, u, ok]) => `<div class="lvrow${ok ? " ok" : ""}"><span>${lab}</span><b>${Math.min(v, need)}${u} / ${need}${u}</b><div class="pbar"><i style="width:${Math.min(100, Math.round(100 * v / need))}%"></i></div></div>`).join("")}` : `<p class="lvnext">Top level! Keep your streak and your scores high.</p>`}</div>`;
}
function rewards(r) {
    const st = starsOf(r), b = bonusOf(r), s = streak(), tot = totalStars(), R = rankOf(tot), done = dayDone(r), left = (r.n || target()) - masteredOf(r);
    const next = !done ? `${left} more word${left > 1 ? "s" : ""} to win the daily trophy (+3 stars)!` : b >= 10 ? "Gold medal! You're a legend today!" : (() => {
        const m = MEDALS.find(m => b < m[0]);
        return `${m[0] - b} more bonus quiz${m[0] - b > 1 ? "zes" : ""} for the ${m[1].toLowerCase()} medal!`;
    })();
    const prog = R.next ? Math.round(100 * (tot - R.from) / (R.next[0] - R.from)) : 100;
    return `<div class="rstats"><div class="rst"><b>${STAR}${st}</b><i>Stars today</i></div><div class="rst"><b>${BOLT}${b}</b><i>Bonus quizzes</i></div><div class="rst"><b>${FLAME}${s}</b><i>Day streak</i></div></div>
<div class="badges"><div class="badge ${done ? "on" : "off"}">${trophySvg()}<b>Trophy</b><i>Words goal</i></div>${MEDALS.map(([n, l]) => `<div class="badge ${done && b >= n ? "on" : "off"}">${medalSvg(l)}<b>${l}</b><i>${n} bonus quizzes</i></div>`).join("")}</div>
<p class="rnext">${next}</p>
<div class="level"><div><b>Rank ${R.i + 1} · ${R.name}</b><span>${STAR}${tot} star${tot === 1 ? "" : "s"}</span></div><div class="pbar"><i style="width:${prog}%"></i></div><small>${R.next ? `${R.next[0] - tot} star${R.next[0] - tot === 1 ? "" : "s"} to ${R.next[1]}` : "Top rank reached!"}</small></div>`;
}
function weekChart() {
    const t = todayKey(), days = [...Array(7)].map((_, i) => addDays(t, i - 6)), R = days.map(k => DST.days[k]), max = Math.max(20, ...R.map(r => masteredOf(r)));
    const W = R.reduce((s, r) => s + masteredOf(r), 0), full = R.filter(dayDone).length, qs = R.reduce((s, r) => s + (r ? (r.qs || []).length : 0), 0);
    return `<div class="week">${days.map((k, i) => {
        const r = R[i], n = masteredOf(r), c = dayDone(r) ? "full" : r && (r.qs || []).length ? "part" : "";
        return `<div class="wk ${c}${k === t ? " today" : ""}"><em>${n || ""}</em><i class="bar" style="height:${Math.round(76 * n / max) + 3}px"></i><span>${kDate(k).toLocaleDateString("en-GB", { weekday: "short" })}</span></div>`;
    }).join("")}</div>
<p class="wsum">Last 7 days: <b>${W}</b> words mastered · <b>${full}</b> day${full === 1 ? "" : "s"} with the goal · <b>${qs}</b> ${qs === 1 ? "quiz or lesson" : "quizzes and lessons"}</p>`;
}
function dayDetail(k) {
    const r = DST.days[k], t = todayKey();
    if (k > t)
        return `<div class="dday"><h3>${longDate(k)}</h3><p class="dnone">This day hasn't happened yet!</p></div>`;
    if (!r || (!(r.qs || []).length && !r.mood))
        return `<div class="dday"><h3>${longDate(k)}</h3><p class="dnone">No work this day.</p>${k === t ? `<button class="listen sm" data-dtab="today">Go to today</button>` : ""}</div>`;
    const m = moodOf(r.mood), les = (r.qs || []).filter(isLesson);
    return `<div class="dday"><h3>${longDate(k)}</h3>${m ? `<div class="dmood"><img src="img/kai-${m.img}.webp" alt=""><span>Mood: <b>${m.en}</b> · ${m.fr}</span></div>` : ""}
<div class="dgl"><span class="${dayDone(r) ? "ok" : ""}">${dayDone(r) ? CHECK : ""}Words ${masteredOf(r)}${r.n ? "/" + r.n : ""}</span>${les.map(q => {
        const L = LESSONS[q.k.slice(7)];
        return L ? `<span class="${q.p >= PASS ? "ok" : ""}">${q.p >= PASS ? CHECK : ""}${esc(L.title)} <i>${q.p}%</i></span>` : "";
    }).join("")}${(r.qs || []).filter(isTest).map(q => {
        const X = TESTS[q.k.slice(5)];
        return X ? `<span class="${q.p >= 50 ? "ok" : ""}">${q.p >= 50 ? CHECK : ""}${esc(X.title)} <i>${n20(markOfQ(q))}/20</i></span>` : "";
    }).join("")}</div>
<div class="rstats sm"><div class="rst"><b>${(r.qs || []).length}</b><i>Quizzes</i></div><div class="rst"><b>${bonusOf(r)}</b><i>Bonus</i></div><div class="rst"><b>${STAR}${starsOf(r)}</b><i>Stars</i></div></div>
${wordLists(r, false)}${k === t ? `<button class="listen sm" data-dtab="today">Go to today</button>` : ""}</div>`;
}
function calendar() {
    const now = new Date(), first = new Date(now.getFullYear(), now.getMonth() + CALM, 1), y = first.getFullYear(), mo = first.getMonth(), nd = new Date(y, mo + 1, 0).getDate(), lead = (first.getDay() + 6) % 7, t = todayKey();
    const keys = [...Array(nd)].map((_, i) => dKey(new Date(y, mo, i + 1))), R = keys.map(k => DST.days[k]).filter(Boolean);
    const worked = R.filter(r => (r.qs || []).length).length, full = R.filter(dayDone).length, W = R.reduce((s, r) => s + masteredOf(r), 0), st = R.reduce((s, r) => s + starsOf(r), 0);
    if (!CSEL || !keys.includes(CSEL))
        CSEL = keys.includes(t) ? t : keys[0];
    return `<div class="cal"><div class="calh"><button data-calm="-1" aria-label="Previous month">${ARROW(0)}</button><b>${first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</b><button data-calm="1" aria-label="Next month"${CALM >= 0 ? " disabled" : ""}>${ARROW(1)}</button></div>
<div class="calg">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => `<span class="wdn">${d}</span>`).join("")}${"<span></span>".repeat(lead)}${keys.map((k, i) => {
        const r = DST.days[k], m = r && moodOf(r.mood), c = dayDone(r) ? " full" : r && (r.qs || []).length ? " part" : "";
        return `<button class="cd${c}${k === t ? " today" : ""}${k === CSEL ? " sel" : ""}" data-day="${k}"${k > t ? " disabled" : ""} aria-label="${longDate(k)}"><span class="n">${i + 1}</span>${m ? `<img src="img/kai-${m.img}.webp" alt="">` : ""}</button>`;
    }).join("")}</div>
<div class="calleg"><span><i class="lg full"></i>Goal reached</span><span><i class="lg part"></i>Some work</span><span><i class="lg"></i>Nothing</span></div></div>
<div class="rstats mstats"><div class="rst"><b>${worked}</b><i>Days worked</i></div><div class="rst"><b>${full}</b><i>Trophies</i></div><div class="rst"><b>${W}</b><i>Words</i></div><div class="rst"><b>${STAR}${st}</b><i>Stars</i></div></div>
${dayDetail(CSEL)}`;
}
function renderDaily() {
    const lvUp = checkLevelUp(), r = dToday(), body = document.getElementById("dailybody"), m = masteredOf(r), n = r.n || target(), done = dayDone(r), left = n - m, wk = ["grammar", "conj"].filter(t => weekLesson(t)).length;
    let h = `<div class="dtabs" role="tablist"><button role="tab" data-dtab="today" class="${DTAB === "today" ? "on" : ""}" aria-selected="${DTAB === "today"}">Today</button><button role="tab" data-dtab="cal" class="${DTAB === "cal" ? "on" : ""}" aria-selected="${DTAB === "cal"}">Calendar</button></div>`;
    if (DTAB === "cal") {
        body.innerHTML = h + calendar();
        return;
    }
    h += `${LVUP !== null ? `<div class="lvup"><div class="dend">${kaiBig("joy", [["LEVEL UP!"], ["YOU ARE NOW"], [[LV[LVUP].name.toUpperCase()]]], "Level up! You are now " + LV[LVUP].name)}</div><p>New goal: <b>${LV[LVUP].words} words a day</b>. Bravo!</p></div>` : ""}
<p class="ddate">${longDate(r.d)}</p>${moodBlock(r)}
<div class="dsec"><h2>Today's goal</h2><span>${Math.min(m, n)}/${n}</span></div>${goalCard(r)}${memCard()}
${done ? `<button class="listen more" id="dmore">Other quizzes${GOSVG}</button>` : ""}
<div class="dsec"><h2>This week</h2><span>${wk}/2</span></div>${weekTiles()}
<div class="dsec"><h2>My level</h2></div>${levelCard()}
<div class="dsec"><h2>My rewards</h2><button class="qhelp" type="button" data-help="rewards" aria-label="How do stars, trophies and medals work?">?</button></div>${rewards(r)}
<div class="dsec"><h2>My week</h2></div>${weekChart()}
<div class="dsec" id="dtests"><h2>My tests</h2><span>/20</span></div>${testProgress()}
<div class="dsec"><h2>Words of the day</h2><span>${wordsOf(r).length}</span></div>${wordLists(r, true)}
<div class="dend">${done ? kaiBig("joy", [["ALL DONE!"], ["SEE YOU"], [["TOMORROW!"]]], "All done! See you tomorrow!") : kaiBig("dyn", [["KEEP GOING!"], [[String(left)], ` WORD${left > 1 ? "S" : ""}`], ["TO GO!"]], `Keep going! ${left} word${left > 1 ? "s" : ""} to go!`)}</div>`;
    body.innerHTML = h;
    if (lvUp) {
        confetti();
        toast(`Level up! You are now ${LV[LVUP].name}!`, 2600);
        sayOne(`Level up! You are now ${LV[LVUP].name}!`, document.querySelector(".lvup .bb"));
    }
    else if (done && !r.cel && DST.days[r.d]) {
        const c = JSON.parse(JSON.stringify(r));
        c.cel = 1;
        dPut(c);
        confetti();
        toast("Daily trophy! +3 stars", 2200);
    }
}
function confetti() {
    const box = document.createElement("div");
    box.className = "confetti";
    box.setAttribute("aria-hidden", "true");
    const C = ["#13a6b3", "#f5b301", "#1f9d55", "#ff7a1a", "#e04f8a", "#5b34c4"];
    for (let i = 0; i < 36; i++) {
        const e = document.createElement("i");
        e.style.left = Math.random() * 100 + "%";
        e.style.background = C[i % C.length];
        e.style.animationDelay = (Math.random() * .6).toFixed(2) + "s";
        e.style.transform = `rotate(${Math.random() * 180}deg)`;
        box.appendChild(e);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3600);
}
function openDaily(back) {
    DAILY = false;
    MOODEDIT = false;
    LVUP = null;
    renderDaily();
    show("daily", back);
}
document.getElementById("toDaily").addEventListener("click", () => {
    DTAB = "today";
    openDaily();
});
document.getElementById("dailybody").addEventListener("click", e => {
    const t = e.target;
    const tb = t.closest("[data-dtab]");
    if (tb) {
        DTAB = tb.dataset.dtab;
        if (DTAB === "cal")
            CALM = 0, CSEL = todayKey();
        renderDaily();
        scrollTo(0, 0);
        return;
    }
    const md = t.closest("[data-mood]");
    if (md) {
        const r = JSON.parse(JSON.stringify(dToday())), m = moodOf(md.dataset.mood);
        r.mood = m.id;
        MOODEDIT = false;
        dPut(r);
        renderDaily();
        const hb = document.querySelector("#dailybody .mymood");
        if (hb)
            hb.insertAdjacentHTML("afterend", `<div class="qhead dsay">${headSvg(m.say, m.img)}</div>`);
        sayOne(plain(m.say), document.querySelector("#dailybody .dsay .bb"));
        return;
    }
    if (t.closest("#dmoodchg")) {
        MOODEDIT = true;
        renderDaily();
        return;
    }
    if (t.closest("#dround")) {
        DAILY = true;
        startQuiz("mix", "all");
        show("quiz");
        return;
    }
    const wl = t.closest("[data-wl]");
    if (wl) {
        openLesson(wl.dataset.wl);
        return;
    }
    if (t.closest("#dmore")) {
        DAILY = false;
        show("quizzes");
        return;
    }
    const cm = t.closest("[data-calm]");
    if (cm) {
        CALM = Math.min(0, CALM + +cm.dataset.calm);
        CSEL = null;
        renderDaily();
        return;
    }
    const dy = t.closest("[data-day]");
    if (dy) {
        CSEL = dy.dataset.day;
        renderDaily();
        const d = document.querySelector("#dailybody .dday");
        if (d)
            d.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
    }
    const s = t.closest("[data-say]");
    if (s) {
        sayOne(s.dataset.say, s);
        return;
    }
    const big = t.closest(".dend");
    if (big && (t.closest(".kai") || t.closest(".bb"))) {
        sayOne(big.querySelector("svg").getAttribute("aria-label").replace(/^Kai : /, ""), big.querySelector(".bb"));
    }
});
