/* Code — tranche de l'ancien index.html (lignes 1132–1171). Script classique : l'ordre des <script> compte. */
"use strict";
const KVL = {};
for (const k in KV)
    KVL[k.toLowerCase()] = KV[k];
const KVN = Object.keys(KV).length;
let KREC = true;
try {
    KREC = localStorage.getItem("kai.rec") !== "0";
}
catch (e) {
}
const KVD = {}, KVP = {};
const KVA = new Audio();
try {
    KVA.setAttribute("playsinline", "");
    KVA.preload = "auto";
}
catch (e) {
}
function kvFind(t) {
    const k = String(t || "").replace(/\s+/g, " ").trim();
    return KV[k] || KVL[k.toLowerCase()] || null;
}
function kvLoad(n) {
    if (KVD[n])
        return Promise.resolve(KVD[n]);
    if (!KVP[n])
        KVP[n] = fetch("voice/kai-" + n + ".json").then(r => {
            if (!r.ok)
                throw new Error("HTTP " + r.status);
            return r.json();
        }).then(o => {
            KVD[n] = o;
            return o;
        }).catch(e => {
            delete KVP[n];
            throw e;
        });
    return KVP[n];
}
let KVPRE = false;
function kvPreload() {
    if (KVPRE || !KREC)
        return;
    KVPRE = true;
    const ns = [...new Set(Object.values(KV).map(v => v[0]))].sort((a, b) => a - b);
    let i = 0;
    const next = () => {
        if (i >= ns.length)
            return;
        kvLoad(ns[i++]).then(() => setTimeout(next, 200), () => setTimeout(next, 4000));
    };
    next();
}
function kvPlay(f, text, el, onDone) {
    const id = ++SAY_ID;
    try {
        const S = window.speechSynthesis;
        if (S && (S.speaking || S.pending))
            S.cancel();
    }
    catch (e) {
    }
    const b = KVD[f[0]] && KVD[f[0]][f[1]];
    if (!b) {
        ttsDevice(text, el, onDone);
        return;
    }
    const a = KVA;
    a.onended = a.onerror = null;
    try {
        a.pause();
    }
    catch (e) {
    }
    document.querySelectorAll(".talk").forEach(x => x.classList.remove("talk"));
    const done = () => {
        if (el)
            el.classList.remove("talk");
        if (id === SAY_ID && onDone)
            onDone();
    };
    const fail = () => {
        if (el)
            el.classList.remove("talk");
        if (id === SAY_ID)
            ttsDevice(text, el, onDone);
    };
    a.src = "data:audio/mpeg;base64," + b;
    const r = VRATE < .9 ? .85 : 1;
    try {
        a.defaultPlaybackRate = r;
        a.playbackRate = r;
        a.preservesPitch = true;
    }
    catch (e) {
    }
    a.onended = done;
    a.onerror = fail;
    if (el)
        el.classList.add("talk");
    try {
        const q = a.play();
        if (q && q.catch)
            q.catch(fail);
    }
    catch (e) {
        fail();
    }
}
function ttsSpeak(text, el, onDone, vo) {
    unlockAudio();
    if (KREC && !vo) {
        const f = kvFind(text);
        if (f) {
            if (KVD[f[0]]) {
                kvPlay(f, text, el, onDone);
                return;
            }
            const id0 = ++SAY_ID;
            let late = false;
            const t = setTimeout(() => {
                late = true;
                if (id0 === SAY_ID)
                    ttsDevice(text, el, onDone, vo);
            }, 1500);
            kvLoad(f[0]).then(() => {
                if (late)
                    return;
                clearTimeout(t);
                if (id0 === SAY_ID)
                    kvPlay(f, text, el, onDone);
            }, () => {
                if (late)
                    return;
                clearTimeout(t);
                if (id0 === SAY_ID)
                    ttsDevice(text, el, onDone, vo);
            });
            return;
        }
    }
    ttsDevice(text, el, onDone, vo);
}
function stopSpeech() {
    SAY_ID++;
    try {
        KVA.pause();
    }
    catch (e) {
    }
    try {
        const S = speechSynthesis;
        if (S.speaking || S.pending)
            S.cancel();
    }
    catch (e) {
    }
    document.querySelectorAll(".talk").forEach(x => x.classList.remove("talk"));
}
const bubbles = [...document.querySelectorAll(".bb")];
function speak(list) {
    let k = 0;
    const next = () => {
        if (k >= list.length)
            return;
        const i = list[k++];
        ttsSpeak(LINES[i].say, bubbles[i], next);
    };
    next();
}
document.getElementById("listen").onclick = () => speak([0, 1]);
function show(id, back) {
    stopSpeech();
    document.querySelectorAll(".page").forEach(p => p.classList.remove("on", "rev"));
    const p = document.getElementById(id);
    p.classList.add("on");
    if (back)
        p.classList.add("rev");
    scrollTo(0, 0);
    if (id === "home")
        requestAnimationFrame(fit);
    // Protège du double clic : le 2e clic tomberait sur ce qui se trouve sous le doigt dans le nouvel écran
    document.body.classList.add("navlock");
    clearTimeout(show.lockTimer);
    show.lockTimer = setTimeout(() => document.body.classList.remove("navlock"), 350);
}
const openMenu = () => startApp(), goHome = () => show("home", true);
document.getElementById("kaitap").addEventListener("click", openMenu);
document.getElementById("start").addEventListener("click", openMenu);
document.getElementById("back").addEventListener("click", goHome);
/* en-tête du menu : buste de Kai (expression neutre) + bulle */
let ASK = { say: "What do you want to learn today?" };
function sayOne(text, el) {
    ttsSpeak(text, el);
}
