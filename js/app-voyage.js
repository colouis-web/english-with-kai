/* Kai's voyage (PO, 20/11) : les objectifs de vocabulaire du mois, en voyage d'île en île.
   - Une île par famille de mots : Thing Island (noms), Action Volcano (verbes), Colour Cove (adjectifs), Swift Reef (adverbes).
   - Chaque île est un chemin de ports ; un port = 10 mots, rangés du plus courant au plus rare : d'abord le niveau minimum
     du mot (lvOkWord), puis l'ordre de fréquence (js/data/frequence-voyage.js ; verbes : liste USAGE), puis la classe f.
     Un port est figé (ses 10 mots sont notés dans le profil) dès sa première série : un mot ajouté plus tard au dictionnaire
     ne décale jamais un port commencé.
   - La série : 10 phrases d'exemple à trou, on tape le mot (aucun choix de réponses). Une faute de frappe compte comme une faute.
   - Un port est certifié après 2 séries sans faute faites 2 jours différents (PO : « 2 fois sans fautes »).
   - Tempête : 21 jours après sa certification (ou sa dernière tempête), une série sans faute garde le phare allumé.
   - Le voyage du mois : 10 ports (4 de noms, 3 de verbes, 2 d'adjectifs, 1 d'adverbes), choisis le premier jour où l'élève
     ouvre l'app dans le mois ; les ports non finis reviennent le mois suivant.
   - Données : dans le profil (p.voy), donc dans les sauvegardes ; rien ne quitte l'appareil.
   Script classique, chargé après app-picks.js (réutilise t3Ok, t3Blank, headSvg, la page du quiz). */
"use strict";
const VY_ISL = [
    { k: "nouns", name: "Thing Island", fam: "Nouns", one: "noun", n: "#a3e635", per: 4 },
    { k: "verbs", name: "Action Volcano", fam: "Verbs", one: "verb", n: "#fb923c", per: 3 },
    { k: "adjectives", name: "Colour Cove", fam: "Adjectives", one: "adjective", n: "#f472b6", per: 2 },
    { k: "adverbs", name: "Swift Reef", fam: "Adverbs", one: "adverb", n: "#38bdf8", per: 1 }];
const VY_SIZE = 10, VY_RUNS = 2, VY_STORM = 21;
let VYV = { i: null, h: null }, VY = null;
const vyIsl = k => VY_ISL.find(x => x.k === k);
const vyHkey = (k, n) => k + ":" + n;
const vyMonth = () => todayKey().slice(0, 7);
/* données de l'élève : p.voy = { h: { "nouns:4": { w: [clés], r: [jours sans faute], c: jour certifié, s: jour de la dernière tempête } },
   m: { "2026-11": [clés des ports du mois] } } */
function vySt() {
    const p = curProf();
    if (!p)
        return { h: {}, m: {} };
    if (!p.voy || typeof p.voy !== "object")
        p.voy = { h: {}, m: {} };
    p.voy.h = p.voy.h || {};
    p.voy.m = p.voy.m || {};
    return p.voy;
}
function vySave() {
    const p = curProf();
    if (!p)
        return;
    p.u = Date.now();
    pSave();
    pPush(p);
}
/* une phrase d'exemple à trou pour un mot (le mot entre étoiles, 3 mots au plus) */
function vyExamples(w) {
    const x = KK(w.k), d = w.d;
    return [0, 1].filter(i => d.ex && d.ex[i] && (!x || !x.eiOk || x.eiOk(d, i)) && /\*([^*]+)\*/.test(d.ex[i][0]) && String(d.ex[i][0]).match(/\*([^*]+)\*/)[1].trim().split(/\s+/).length <= 3);
}
/* les mots d'une île, du plus utile au plus rare (calculé une fois) */
const VYRANK = {};
function vyRank(k) {
    if (VYRANK[k])
        return VYRANK[k];
    /* l'ordre de fréquence : js/data/frequence-voyage.js, sinon (verbes) l'ordre de la liste USAGE */
    const F = (typeof VY_FREQ !== "undefined" && VY_FREQ[k]) || Object.keys((typeof USAGE !== "undefined" && USAGE[k]) || {}), ui = new Map(F.map((w, i) => [w, i]));
    const band = d => [0, 1, 2, 3].find(l => lvOkWord(k, d, l));
    const L = allWords().map((w, i) => ({ w, i })).filter(({ w }) => w.k === k && vyExamples(w).length && band(w.d) !== undefined && (typeof sensOk !== "function" || sensOk(k, w.d, 1)));
    const key = ({ w, i }) => {
        const name = w.d.v || w.d.w, u = useOf(k, w.d);
        return [band(w.d), ui.has(name) ? 0 : 1, ui.has(name) ? ui.get(name) : 3 - u.f, i];
    };
    const K = new Map(L.map(x => [x, key(x)]));
    L.sort((a, b) => {
        const A = K.get(a), B = K.get(b);
        for (let j = 0; j < A.length; j++)
            if (A[j] !== B[j])
                return A[j] - B[j];
        return 0;
    });
    return VYRANK[k] = L.map(x => x.w);
}
/* les ports d'une île : les ports déjà commencés gardent leurs mots ; les autres se remplissent dans l'ordre */
function vyHarbours(k) {
    const st = vySt(), by = allWords().byKey, fz = new Map();
    Object.entries(st.h).forEach(([key, h]) => {
        const [kk, n] = key.split(":");
        if (kk === k && h.w && h.w.length)
            fz.set(+n, h.w.filter(x => by.has(x)));
    });
    const used = new Set([...fz.values()].flat()), pool = vyRank(k).filter(w => !used.has(w.key)).map(w => w.key), out = [];
    let p = 0;
    for (let n = 1; p < pool.length || [...fz.keys()].some(x => x >= n); n++) {
        if (fz.has(n)) {
            out.push({ k, n, w: fz.get(n) });
            continue;
        }
        const w = pool.slice(p, p + VY_SIZE);
        if (w.length < 5 && out.length && ![...fz.keys()].some(x => x > n)) {   /* un reste de moins de 5 mots rejoint le dernier port */
            if (!fz.has(out[out.length - 1].n))
                out[out.length - 1].w.push(...w);
            break;
        }
        p += w.length;
        out.push({ k, n, w });
    }
    return out;
}
/* état d'un port : "cert" (certifié), "storm" (tempête), "run" (1 série sans faute), "new" */
function vyState(k, n) {
    const h = vySt().h[vyHkey(k, n)], T = todayKey();
    if (!h)
        return "new";
    if (h.c)
        return daysBetween(h.s || h.c, T) >= VY_STORM ? "storm" : "cert";
    return h.r && h.r.length ? "run" : "new";
}
/* le voyage du mois : 10 ports, choisis une fois par mois (les ports non certifiés les plus proches de chaque île) */
function vyRoute() {
    const st = vySt(), M = vyMonth();
    if (st.m[M] && st.m[M].length)
        return st.m[M];
    const R = [], spare = [];
    VY_ISL.forEach(I => {
        const free = vyHarbours(I.k).filter(h => !(st.h[vyHkey(I.k, h.n)] || {}).c).map(h => vyHkey(I.k, h.n));
        R.push(...free.slice(0, I.per));
        spare.push(...free.slice(I.per));
    });
    while (R.length < VY_SIZE && spare.length)   /* une île finie : ses ports vont aux autres îles */
        R.push(spare.shift());
    if (curProf()) {
        st.m[M] = R;
        vySave();
    }
    return R;
}
const vyDone = key => !!(vySt().h[key] || {}).c;
/* le prochain port conseillé : un port du mois pas encore certifié et pas déjà réussi aujourd'hui, sinon une tempête */
function vyNext() {
    const st = vySt(), T = todayKey(), R = vyRoute();
    const todo = R.filter(key => !vyDone(key));
    const free = todo.find(key => !((st.h[key] || {}).r || []).includes(T));
    if (free)
        return { key: free };
    const storm = Object.keys(st.h).find(key => { const [k, n] = key.split(":"); return vyState(k, +n) === "storm"; });
    if (storm)
        return { key: storm, storm: true };
    return todo.length ? { wait: true } : { done: true };
}
const vyLabel = key => { const [k, n] = key.split(":"); return `${vyIsl(k).name} · Harbour ${n}`; };
/* ===== la page du voyage : la carte, une île, un port ===== */
function openVoyage() {
    VYV = { i: null, h: null };
    renderVoyage();
    show("voyage");
    scrollTo(0, 0);
}
const vyIcon = {
    flag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V4M6 4h11l-2.5 4L17 12H6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    storm: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 16a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1A4 4 0 0 1 17 16M12 13l-2 4h4l-2 4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
};
function vyMonthCard() {
    const R = vyRoute(), n = R.filter(vyDone).length, T = todayKey(), d = kDate(T), last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate();
    const per = VY_ISL.map(I => { const mine = R.filter(key => key.startsWith(I.k + ":")); return mine.length ? `<span style="--n:${I.n}">${I.fam} ${mine.filter(vyDone).length}/${mine.length}</span>` : ""; }).join("");
    return `<div class="vymonth"><div class="vymh"><span>${d.toLocaleDateString("en-GB", { month: "long" })} voyage</span><span>${last ? `${last} day${last > 1 ? "s" : ""} left` : "Last day!"}</span></div>
<div class="vymn"><b>${n}</b><span>/ ${R.length} harbours certified</span></div><div class="pbar"><i style="width:${Math.round(100 * n / Math.max(1, R.length))}%"></i></div><div class="vyfam">${per}</div></div>`;
}
function renderVoyage() {
    const B = document.getElementById("vybody");
    if (!B)
        return;
    const h1 = document.querySelector("#voyage h1");
    if (VYV.h)
        return renderHarbour(B, h1);
    if (VYV.i)
        return renderIsland(B, h1);
    h1.textContent = "Kai's voyage";
    const nx = vyNext(), R = vyRoute(), n = R.filter(vyDone).length;
    const say = !curProf() ? "Create your profile first, then we *set sail*!" : nx.done ? "Every harbour of the month is *certified*! You're a real captain!" : nx.wait ? "Great sailing today! Come back *tomorrow* for your second runs." : n ? `*${n}/${R.length}* harbours this month. Let's sail on!` : `This month: *${R.length} harbours* to reach. Let's set sail!`;
    B.innerHTML = `<div class="qhead">${headSvg(say, n ? "smile" : "head")}</div>
${vyMonthCard()}
${nx.key ? `<button class="vygo" type="button" data-vyh="${nx.key}">${nx.storm ? "Storm! " : "Next: "}${esc(vyLabel(nx.key))}${GOSVG}</button>` : ""}
<div class="vymap"><img src="img/voyage-carte.webp" alt="Map of the archipelago" loading="lazy">
${VY_ISL.map((I, j) => { const H = vyHarbours(I.k), c = H.filter(h => vyDone(vyHkey(I.k, h.n))).length; return `<button class="vyisl i${j}" type="button" data-vyi="${I.k}" style="--n:${I.n}"><b>${I.name}</b><small>${I.fam} · ${c}/${H.length}</small></button>`; }).join("")}
<span class="vyisl i4 lock">${vyIcon.lock}<small>Secret island</small></span></div>`;
}
function renderIsland(B, h1) {
    const I = vyIsl(VYV.i), H = vyHarbours(I.k), R = vyRoute(), st = vySt();
    h1.textContent = I.name;
    const started = H.filter(h => st.h[vyHkey(I.k, h.n)]).map(h => h.n), open = Math.max(1, ...started.map(n => n + 1), ...R.filter(key => key.startsWith(I.k + ":")).map(key => +key.split(":")[1]));
    const vis = H.filter(h => h.n <= open + 2);
    B.innerHTML = `<div class="vyhead" style="--n:${I.n}"><img src="img/kai-voyage.webp" alt=""><div><span>${I.fam} · ${H.length} harbours</span><p>Harbour 1 has the 10 most useful ${I.fam.toLowerCase()}. The further you sail, the rarer the words!</p></div></div>
<ol class="vyports">${vis.map(h => {
        const key = vyHkey(I.k, h.n), s = vyState(I.k, h.n), lock = h.n > open, inR = R.includes(key), runs = ((st.h[key] || {}).r || []).length;
        const sub = s === "cert" ? "Certified" : s === "storm" ? "Storm!" : s === "run" ? `${Math.min(runs, VY_RUNS)} / ${VY_RUNS} perfect runs` : lock ? "Locked" : inR ? "This month" : "Ready";
        const words = h.w.slice(0, 5).map(x => (allWords().byKey.get(x) || { d: {} }).d).map(d => esc(d.v || d.w || "")).join(" · ");
        return `<li><button type="button" class="vyport ${s}${lock ? " lock" : ""}${inR ? " month" : ""}" ${lock ? "disabled" : `data-vyh="${key}"`}><span class="vyn">${s === "cert" ? vyIcon.flag : s === "storm" ? vyIcon.storm : lock ? vyIcon.lock : h.n}</span><span class="vyt"><b>Harbour ${h.n}</b><em>${sub}</em><small>${lock ? `${h.w.length} new ${I.fam.toLowerCase()}` : words + "…"}</small></span></button></li>`;
    }).join("")}</ol>
${H.length > vis.length ? `<p class="vymore">${H.length - vis.length} more harbours to discover</p>` : ""}`;
}
function renderHarbour(B, h1) {
    const [k, n] = VYV.h.split(":"), I = vyIsl(k), H = vyHarbours(k).find(h => h.n === +n), h = vySt().h[VYV.h] || {}, s = vyState(k, +n), T = todayKey();
    h1.textContent = `Harbour ${n}`;
    if (!H) {
        VYV.h = null;
        return renderIsland(B, h1);
    }
    const r = h.r || [], today = r.includes(T);
    const say = s === "cert" ? "This harbour is *certified*! Practise when you want." : s === "storm" ? "A *storm* is coming! One perfect run keeps your lighthouse on." : today ? "Perfect run today! Come back *tomorrow* for the second one." : r.length ? "Second run today! *No mistakes* and I plant your flag!" : "Ten words, ten gaps. Two *perfect* runs, on two different days!";
    const W = H.w.map(x => allWords().byKey.get(x)).filter(Boolean);
    B.innerHTML = `<div class="qhead">${headSvg(say, s === "cert" ? "smile" : "head")}</div>
<div class="vyruns">${[0, 1].map(j => `<div class="${r[j] ? "ok" : ""}"><span>Run ${j + 1}${r[j] ? " · " + kDate(r[j]).toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }) : ""}</span><b>${r[j] ? "10 / 10 perfect" : "To do"}</b></div>`).join("")}</div>
<div class="vywords" style="--n:${I.n}"><div class="vywh"><span>${I.name}</span><span>${W.length} ${W.length === 1 ? I.one : I.fam.toLowerCase()}</span></div>
<ul>${W.map(w => `<li><button class="snd sm" type="button" data-say="${esc(w.d.v || w.d.w)}" aria-label="Listen">${SPK}</button><b>${esc(w.d.v || w.d.w)}</b><i>${esc(w.d.fr || "")}</i></li>`).join("")}</ul></div>
<p class="vyrule">${W.length} sentences with a gap: type the missing word. A typo counts as a mistake.</p>
<button class="vygo" type="button" id="vystart">${s === "cert" ? "Practise" : s === "storm" ? "Face the storm" : r.length && !today ? "Start run 2" : today ? "Practise again" : "Start run 1"}${GOSVG}</button>`;
}
/* ===== la série : 10 phrases à trou ===== */
function vyStart(key) {
    const [k, n] = key.split(":"), H = vyHarbours(k).find(h => h.n === +n);
    if (!H)
        return;
    const st = vySt();
    if (!st.h[key] && curProf()) {   /* le port est figé dès sa première série */
        st.h[key] = { w: H.w.slice(), r: [] };
        vySave();
    }
    const items = H.w.map(x => allWords().byKey.get(x)).filter(Boolean).map(w => {
        const e = vyExamples(w), i = e[Math.floor(Math.random() * e.length)], [en, fr] = w.d.ex[i];
        return { key: w.key, base: w.d.v || w.d.w, f: w.d.fr || "", en, fr };
    });
    VY = { key, items: shuffle(items), i: 0, res: [] };
    XMODE = "vy";
    DAILY = false;
    document.getElementById("qtitle").textContent = vyIsl(k).name;
    renderVy();
    show("quiz");
    scrollTo(0, 0);
}
const vyDots = () => `<div class="dots" aria-hidden="true">${VY.items.map((x, j) => `<i class="${VY.res[j] === undefined ? (j === VY.i ? "cur" : "") : VY.res[j] ? "ok" : "ko"}"></i>`).join("")}</div>`;
function renderVy() {
    const it = VY.items[VY.i], ans = t3Ans(it), /* Kai dit le mot français de la phrase (« heure » pour « What time is it? ») */ hint = t3Norm(ans) !== t3Norm(it.base) ? `<p class="vyhint">Hint: <b>${esc(it.base)}</b></p>` : "";
    document.getElementById("qn").textContent = `${VY.i + 1}/${VY.items.length}`;
    QW().innerHTML = `<p class="qpart">${esc(vyLabel(VY.key))} · Fill the gap</p>${vyDots()}
<div class="qhead">${headSvg(`*${((String(it.fr).match(/\*(.+?)\*/) || [])[1] || it.f.split("/")[0]).trim()}*`, "head", "", "fr")}</div>
<div class="t3card pkcard"><p class="t3en">${esc(t3Blank(it.en)).replace(/_____([.,!?;:]*)/, '<span class="bw"><span class="blank" role="img" aria-label="missing word"></span>$1</span>')}</p><p class="t3fr">${hl(it.fr)}</p>${hint}</div>
<input class="t3in" id="vyin" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Type the missing word" aria-label="Missing word">
<button class="listen" id="vycheck">Check${GOSVG}</button><div class="fb" id="vyfb" aria-live="polite"></div>`;
    setTimeout(() => {
        const i = document.getElementById("vyin");
        if (i)
            try {
                i.focus({ preventScroll: true });
            }
            catch (e) {
            }
    }, 250);
}
function vyCheck() {
    if (VY.res[VY.i] !== undefined)
        return;
    const it = VY.items[VY.i], inp = document.getElementById("vyin"), v = inp.value;
    if (!v.trim()) {
        inp.classList.add("shake");
        setTimeout(() => inp.classList.remove("shake"), 400);
        inp.focus();
        return;
    }
    const ok = t3Ok(v, it), typo = !ok && t3Typo(v, it), last = VY.i === VY.items.length - 1;
    VY.res[VY.i] = ok;
    inp.disabled = true;
    inp.classList.add(ok ? "right" : "wrong");
    document.getElementById("vycheck").remove();
    document.querySelector("#qwrap .dots").outerHTML = vyDots();
    document.getElementById("vyfb").innerHTML = `<p class="verdict ${ok ? "ok" : "ko"}">${ok ? ["YES!", "PERFECT!", "WELL DONE!"][VY.i % 3] : typo ? `ALMOST! IT'S <b>${esc(t3Ans(it).toUpperCase())}</b>` : `IT'S <b>${esc(t3Ans(it).toUpperCase())}</b>`}</p>
<div class="ex"><button class="snd sm" id="vysay" aria-label="Listen to the sentence">${SPK}</button><div><p class="en">${hl(it.en)}</p><p class="fr">${hl(it.fr)}</p></div></div>
<button class="listen next" id="vynext">${last ? "See my score" : "Next"}${GOSVG}</button>`;
    sayOne(plain(it.en), document.getElementById("vysay"));
    document.getElementById("vynext").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
/* fin de série : une série sans faute est notée (un jour compte une fois) ; 2 jours différents = port certifié */
function vyEnd() {
    const N = VY.items.length, n = VY.res.filter(Boolean).length, P = pct(n, N), perfect = n === N, T = todayKey(), [k, hn] = VY.key.split(":");
    const st = vySt(), h = st.h[VY.key] || (st.h[VY.key] = { w: VY.items.map(x => x.key), r: [] });
    const was = vyState(k, +hn);
    let out = "fail";
    if (perfect && curProf()) {
        h.r = h.r || [];
        if (was === "storm") {
            h.s = T;
            out = "storm";
        }
        else if (h.c)
            out = "again";
        else if (h.r.includes(T))
            out = "sameday";
        else {
            h.r.push(T);
            if (h.r.length >= VY_RUNS) {
                h.c = T;
                out = "cert";
            }
            else
                out = "run1";
        }
        vySave();
    }
    const say = { cert: `*Harbour ${hn} certified!* I plant your flag!`, run1: "*Perfect run!* Come back on another day for run 2!", sameday: "Perfect again! Run 2 must be on *another day*.", storm: "You beat the *storm*! Your lighthouse stays on!", again: "*Perfect!* This harbour is still yours!", fail: P >= 60 ? `*${n}/${N}*. So close! A run must be *perfect*.` : `*${n}/${N}*. Read the words again and try once more!` }[out];
    XMODE = "vyend";
    document.getElementById("qn").textContent = "";
    QW().innerHTML = `<p class="qpart">${esc(vyLabel(VY.key))} · Results</p><div class="qhead">${headSvg(say, perfect ? "smile" : "head")}</div>
${out === "cert" ? `<div class="vycert">${vyIcon.flag}<b>Harbour ${hn} · ${esc(vyIsl(k).name)}</b><span>Certified · ${vyRoute().filter(vyDone).length}/${vyRoute().length} this month</span></div>` : ""}
<div class="scores one"><div class="sc${perfect ? " ok" : ""}"><i>${esc(vyIsl(k).name)}</i><b>${P}%</b><small>${n} of ${N} words</small></div></div>
<ul class="recap">${VY.items.map((it, j) => `<li><span class="m ${VY.res[j] ? "ok" : "ko"}">${VY.res[j] ? CHECK : CROSS}</span><b>${esc(t3Ans(it))}</b><i>${esc(it.f)}</i></li>`).join("")}</ul>
<div class="endbtns"><button class="listen" id="vyagain">Try again</button><button class="ghost" id="vyback">Harbour ${hn}</button></div>`;
    if (out === "cert" || out === "storm")   /* la fenêtre « Congrats! » de Kai, une fois qu'il a fini de parler */
        try {
            const R = vyRoute(), c = R.filter(vyDone).length;
            afterSpeech(() => out === "cert" ? kaiCongrats(`Harbour ${hn} certified!`, `${esc(vyIsl(k).name)}: your flag is planted. <b>${c}/${R.length}</b> harbours this month.`, `Congrats! Harbour ${hn} is certified!`)
                : kaiCongrats("Storm beaten!", `Harbour ${hn} keeps its lighthouse on.`, "Congrats! You beat the storm!"));
        }
        catch (e) {
        }
    sayOne(plain(say), document.querySelector("#qwrap .qhead .bb"));
    try {
        updateDailyTile();
    }
    catch (e) {
    }
}
/* clics de la page du voyage */
document.getElementById("voyage").addEventListener("click", e => {
    const t = e.target;
    const s = t.closest("[data-say]");
    if (s) {
        sayOne(s.dataset.say, s);
        return;
    }
    const hb = t.closest("[data-vyh]");
    if (hb) {
        stopSpeech();
        VYV = { i: hb.dataset.vyh.split(":")[0], h: hb.dataset.vyh };
        renderVoyage();
        scrollTo(0, 0);
        return;
    }
    const il = t.closest("[data-vyi]");
    if (il) {
        stopSpeech();
        VYV = { i: il.dataset.vyi, h: null };
        renderVoyage();
        scrollTo(0, 0);
        return;
    }
    if (t.closest("#vystart")) {
        stopSpeech();
        vyStart(VYV.h);
    }
});
document.getElementById("backVy").addEventListener("click", () => {
    stopSpeech();
    if (VYV.h)
        VYV.h = null;
    else if (VYV.i)
        VYV.i = null;
    else
        return show("menu", true);
    renderVoyage();
    scrollTo(0, 0);
});
/* clics de la série (capture sur le document : avant les gestionnaires de la page du quiz) */
document.addEventListener("click", e => {
    if (!XMODE || !/^vy/.test(XMODE) || !e.target.closest || !e.target.closest("#quiz"))
        return;
    const t = e.target, stop = () => {
        e.stopPropagation();
        e.preventDefault();
    };
    if (t.closest("#vycheck")) {
        stop();
        vyCheck();
    }
    else if (t.closest("#vynext")) {
        stop();
        stopSpeech();
        if (VY.i < VY.items.length - 1) {
            VY.i++;
            renderVy();
            scrollTo({ top: 0, behavior: "smooth" });
        }
        else
            vyEnd();
    }
    else if (t.closest("#vysay")) {
        stop();
        sayOne(plain(VY.items[VY.i].en), t.closest("button"));
    }
    else if (t.closest("#vyagain")) {
        stop();
        vyStart(VY.key);
    }
    else if (t.closest("#vyback") || t.closest("#backQ")) {
        stop();
        stopSpeech();
        XMODE = null;
        VYV = { i: VY.key.split(":")[0], h: VY.key };
        renderVoyage();
        show("voyage", true);
    }
}, true);
document.addEventListener("keydown", e => {
    if (e.key === "Enter" && XMODE === "vy" && e.target.id === "vyin") {
        e.preventDefault();
        vyCheck();
    }
});
document.getElementById("toVoyage").addEventListener("click", openVoyage);
