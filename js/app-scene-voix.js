/* Code — tranche de l'ancien index.html (lignes 1080–1127). Script classique : l'ordre des <script> compte. */
"use strict";
const INK = "#1d1b2e", f1 = n => (+n).toFixed(1);
/* ce que dit Kai : deux bulles, comme dans un manga */
const LINES = [
    { say: "Hello, my name is Kai!", rows: [["Hello, my name"], ["is ", ["Kai"], "!"]], c: [104, 76], r: [93, 50], tip: [205, 95] },
    { say: "I'm here to help you speak English!", rows: [["I'm here to"], ["help you speak"], [["English"], "!"]], c: [102, 196], r: [93, 58], tip: [207, 108] }
];
/* bulle ovale légèrement irrégulière, avec une pointe vers la bouche de Kai */
function bubblePath(c, r, tip) {
    const [cx, cy] = c, [rx, ry] = r, ta = Math.atan2((tip[1] - cy) / ry, (tip[0] - cx) / rx), sp = .17, N = 64, pts = [];
    for (let i = 0; i <= N; i++) {
        const t = ta + sp + (2 * Math.PI - 2 * sp) * i / N, w = 1 + .016 * Math.sin(t * 5 + 1);
        pts.push(f1(cx + rx * w * Math.cos(t)) + " " + f1(cy + ry * w * Math.sin(t)));
    }
    return `M${pts.join("L")}L${tip[0]} ${tip[1]}Z`;
}
function rowSvg(row) {
    return row.map(p => Array.isArray(p) ? `<tspan class="hl">${p[0]}</tspan>` : p).join("");
}
const KAI = { src: "img/kai-stand.webp", x: 150, y: 22, h: 610, w: 201.4 };
document.getElementById("stage").innerHTML = `<div class="stagebox" id="stagebox"><svg viewBox="0 0 360 640" role="img" aria-label="Kai dit : Hello, my name is Kai! I'm here to help you speak English!">
<image class="kai" href="${KAI.src}" x="${KAI.x}" y="${KAI.y}" width="${KAI.w}" height="${KAI.h}"/>
${LINES.map((L, i) => {
    const n = L.rows.length, lh = 29, y0 = L.c[1] - (n - 1) * lh / 2 + 7;  /* R1 : texte 21 unités, interligne 1,4 */
    return `<g class="bb b${i + 1}" data-i="${i}" role="button" tabindex="0" aria-label="${L.say}"><path d="${bubblePath(L.c, L.r, L.tip)}" fill="#fff" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><text text-anchor="middle">${L.rows.map((row, j) => `<tspan x="${L.c[0]}" y="${f1(y0 + j * lh)}">${rowSvg(row)}</tspan>`).join("")}</text></g>`;
}).join("")}
</svg><button class="kaitap" id="kaitap" aria-label="Open the menu"></button></div>`;
/* garder le ratio de la scène quelle que soit la hauteur de l'écran.
   R1/R2 : sur un téléphone court (iPhone SE, Safari avec ses barres), la scène entière tiendrait à moins de 0,9 px d'écran par unité
   du viewBox et le texte des bulles tomberait sous 18 px. Mode « compact » : le viewBox prend la largeur de l'écran (360 unités = toute la largeur),
   sa hauteur s'adapte à la place disponible, Kai est dessiné ENTIER à la hauteur de la scène (cadré à droite) et les bulles gardent leur taille,
   donc un texte de 19 px ou plus ; les pointes des bulles sont recalculées vers son visage. */
function layoutScene(svg, Hu, compact) {
    const img = svg.querySelector("image.kai"), g = svg.querySelectorAll(".bb path"), txs = svg.querySelectorAll(".bb text");
    let x = KAI.x, y = KAI.y, w = KAI.w, h = KAI.h;
    if (compact) {
        h = Hu - 8;
        w = h * KAI.w / KAI.h;
        x = 358 - w;
        y = 4;
    }
    svg.setAttribute("viewBox", `0 0 360 ${f1(compact ? Hu : 640)}`);
    img.setAttribute("x", f1(x));
    img.setAttribute("y", f1(y));
    img.setAttribute("width", f1(w));
    img.setAttribute("height", f1(h));
    /* compact : Kai est plus étroit, les bulles se rapprochent de lui (dx) pour que leur pointe reste courte */
    const dx = compact ? Math.max(0, Math.min(56, x - 215)) : 0;
    LINES.forEach((L, i) => {
        const c = [L.c[0] + dx, L.c[1]], tip = compact ? [x + w * (L.tip[0] - KAI.x) / KAI.w, y + h * (L.tip[1] - KAI.y) / KAI.h] : L.tip;
        if (g[i])
            g[i].setAttribute("d", bubblePath(c, L.r, tip));
        if (txs[i]) {
            txs[i].querySelectorAll(":scope > tspan").forEach(t => t.setAttribute("x", f1(c[0])));
        }
    });
}
function fit() {
    const b = document.getElementById("stagebox"), st = document.getElementById("stage");
    if (!b || !st)
        return;
    const W = st.clientWidth, H = st.clientHeight;
    if (!W || !H)
        return;   /* écran masqué : on recalcule à l'affichage */
    const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1, w = Math.min(W, H * 360 / 640);
    const compact = innerWidth <= 600 && w / 360 * z < .9, svg = b.querySelector("svg");
    b.classList.toggle("compact", compact);
    b.style.width = compact ? "" : w + "px";
    layoutScene(svg, compact ? Math.max(262, H / (W / 360)) : 640, compact);
}
addEventListener("resize", fit);
/* voix anglaise : la plus naturelle disponible sur l'appareil */
/* ===== VOIX : synthèse vocale robuste pour téléphones ===== */
let VO = null, PITCH = 1, VRATE = .95, VPREF = "";
try {
    VPREF = localStorage.getItem("kai.voice") || "";
    VRATE = +localStorage.getItem("kai.rate") || .95;
}
catch (e) {
}
const MALE = /\b(male|daniel|arthur|oliver|ryan|guy|alex|aaron|thomas|james|george|harry|christopher|eric|brian|davis|tony|roger|andrew|liam|william|rishi|gordon|lee|evan|nathan|tom)\b/i, FEMALE = /\b(female|samantha|karen|serena|libby|sonia|aria|jenny|moira|tessa|kate|victoria|susan|zira|hazel|emma|olivia|ava|allison|martha|stephanie|catherine|fiona)\b/i, NOVELTY = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|deranged|hysterical)\b/i;
const vScore = v => (/natural|neural|online|premium|enhanced|siri/i.test(v.name) ? 20 : 0) + (/google/i.test(v.name) ? 10 : 0) + (MALE.test(v.name) ? 4 : 0) + (/en[-_]GB/i.test(v.lang) ? 2 : /en[-_]US/i.test(v.lang) ? 1 : 0);
function enVoices() {
    try {
        return speechSynthesis.getVoices().filter(v => /^en([-_]|$)/i.test(v.lang) && !NOVELTY.test(v.name)).sort((a, b) => vScore(b) - vScore(a));
    }
    catch (e) {
        return [];
    }
}
function pickVoice() {
    const vs = enVoices();
    VO = (VPREF && vs.find(v => (v.voiceURI || v.name) === VPREF)) || vs[0] || null;
    PITCH = 1;
}
try {
    pickVoice();
    if (speechSynthesis.addEventListener)
        speechSynthesis.addEventListener("voiceschanged", pickVoice);
    else
        speechSynthesis.onvoiceschanged = pickVoice;
}
catch (e) {
}
/* un son muet joué au premier toucher : sur iPhone, ça aide le son à sortir même en mode silencieux */
const SILENT = "data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";
let AUD_OK = false;
function unlockAudio() {
    if (AUD_OK)
        return;
    AUD_OK = true;
    try {
        const a = new Audio(SILENT);
        a.setAttribute("playsinline", "");
        a.volume = 0.01;
        const p = a.play();
        if (p && p.catch)
            p.catch(() => {
            });
    }
    catch (e) {
    }
    try {
        if (typeof KVA !== "undefined" && !KVA.src) {
            KVA.src = SILENT;
            const q = KVA.play();
            if (q && q.catch)
                q.catch(() => {
                });
        }
    }
    catch (e) {
    }
    try {
        if (typeof kvPreload === "function")
            kvPreload();
    }
    catch (e) {
    }
}
addEventListener("pointerdown", unlockAudio, { capture: true });
addEventListener("touchend", unlockAudio, { capture: true });
let TT = 0;
function toast(msg, ms) {
    const e = document.getElementById("toast");
    if (!e)
        return;
    e.textContent = msg;
    e.classList.add("show");
    clearTimeout(TT);
    TT = setTimeout(() => e.classList.remove("show"), ms || 1600);
}
let SAY_ID = 0, HINTED = false, VOSKIP = false;
window._utt = [];
function soundHint() {
    if (HINTED)
        return;
    HINTED = true;
    toast("No sound? Turn off silent mode and turn the volume up 🔊", 4500);
}
/* - on n'annule la phrase en cours que si besoin (annuler puis parler tout de suite bloque le son sur certains téléphones)
   - si la voix choisie ne démarre pas, on réessaie avec la voix par défaut du téléphone */
function ttsDevice(text, el, onDone, vo) {
    const S = window.speechSynthesis;
    if (!S || !window.SpeechSynthesisUtterance) {
        soundHint();
        if (onDone)
            onDone();
        return;
    }
    unlockAudio();
    const id = ++SAY_ID, st = { started: false, fallback: false };
    const fallback = () => {
        if (st.fallback || st.started || id !== SAY_ID)
            return;
        st.fallback = true;
        try {
            if (S.speaking || S.pending)
                S.cancel();
        }
        catch (e) {
        }
        setTimeout(() => attempt(false), 150);
    };
    const attempt = useVoice => {
        if (id !== SAY_ID)
            return;
        const u = new SpeechSynthesisUtterance(text);
        window._utt.push(u);
        if (window._utt.length > 6)
            window._utt.shift();
        const V = vo || VO;
        if (useVoice && V && !VOSKIP) {
            u.voice = V;
            u.lang = V.lang;
        }
        else
            u.lang = (V && V.lang) || "en-GB";
        u.rate = VRATE;
        u.pitch = PITCH;
        u.volume = 1;
        u.onstart = () => {
            st.started = true;
            if (!useVoice && st.fallback)
                VOSKIP = true;
            if (el)
                el.classList.add("talk");
        };
        u.onend = () => {
            if (el)
                el.classList.remove("talk");
            if (id === SAY_ID && onDone)
                onDone();
        };
        u.onerror = e => {
            if (el)
                el.classList.remove("talk");
            if (id !== SAY_ID)
                return;
            if (e && (e.error === "interrupted" || e.error === "canceled"))
                return;
            if (useVoice && !st.started)
                fallback();
            else if (onDone)
                onDone();
        };
        try {
            if (S.paused)
                S.resume();
        }
        catch (e) {
        }
        try {
            S.speak(u);
        }
        catch (e) {
        }
        setTimeout(() => {
            if (id !== SAY_ID || st.started)
                return;
            if (useVoice) {
                if (!st.fallback && !(S.speaking && !S.pending))
                    fallback();
            }
            else
                soundHint();
        }, 2000);
    };
    if (S.speaking || S.pending) {
        try {
            S.cancel();
        }
        catch (e) {
        }
        setTimeout(() => attempt(true), 220);
    }
    else
        attempt(true);
}
