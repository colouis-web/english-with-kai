/* Code — tranche de l'ancien index.html (lignes 1185–1212). Script classique : l'ordre des <script> compte. */
"use strict";
const OPEN = {};
let LAST = [];
function rank(d, q) {
    let best = 9;
    for (const k of d.keys) {
        let s = k === q ? 0 : k.startsWith(q) ? 1 : k.split(/[\s'()-]+/).some(w => w.startsWith(q)) ? 2 : k.includes(q) ? 3 : 9;
        if (s < best)
            best = s;
    }
    return best;
}
const longCls = t => {
    const n = Math.max(...t.split(/\s+/).map(w => w.length));
    return n >= 12 ? ' class="xxl"' : n >= 11 ? ' class="xl"' : n >= 9 ? ' class="lg"' : "";
};
/* scènes illustrées (galeries de Kai) affichées dans les cartes */
const SCN = { "v": { "ride": "sc-bike", "buy": "sc-buy", "shop": "sc-buy", "play": "sc-game", "eat": "sc-icecream", "dress": "sc-dress", "write": "sc-write", "present": "sc-present", "think": "sc-think", "wonder": "sc-think", "dance": "sc-tutu", "push": "sc-lift", "rest": "sc-bed", "relax": "sc-chill", "listen": "sc-chill", "open": "sc-door", "lock": "sc-door", "travel": "sc-train", "sail": "sc-sail", "fly": "sc-plane", "sleep": "sc-sleep", "ski": "sc-ski", "dream": "sc-dream", "tidy": "sc-tidy", "study": "kai-study", "walk": "kai-school", "drive": "sc-drive", "climb": "sc-hike", "brush": "sc-bathroom", "cry": "kai-cry", "jump": "kai-joy", "drink": "kai-drink", "read": "kai-read", "look": "sc-looksea", "watch": "sc-tv", "talk": "kai-friend", "scare": "sc-scared", "sit": "kai-chair", "kick": "kai-foot", "touch": "kai-dog", "hide": "sc-scared" }, "n": { "video game": "sc-game", "console": "sc-game", "controller": "sc-game", "ice cream": "sc-icecream", "bed": "sc-bed", "sofa": "sc-sofa", "television": "sc-tv", "key": "sc-door", "dream": "sc-dream", "snow": "sc-ski", "friend": "kai-friend", "book": "kai-read", "chair": "kai-chair", "shower": "sc-bathroom", "sand": "sc-beach", "dancer": "sc-tutu", "writer": "sc-write", "driver": "sc-drive", "happiness": "sc-happy", "joy": "kai-joy", "sadness": "sc-sad", "fear": "sc-scared", "anger": "kai-angry", "boredom": "kai-bored", "disease": "sc-ill", "cold": "sc-ill", "pain": "sc-ill", "bike": "sc-bike", "beach": "sc-beach", "holiday": "sc-beach", "sea": "sc-sea", "shop": "sc-shop", "tie": "sc-suit", "basketball": "sc-basket", "door": "sc-door", "train": "sc-train", "boat": "sc-sail", "plane": "sc-plane", "flight": "sc-plane", "car": "sc-drive", "dog": "kai-dog", "cat": "kai-cat", "giraffe": "sc-zoo", "football": "kai-foot", "skiing": "sc-ski", "bathroom": "sc-bathroom", "bedroom": "sc-bed", "school": "kai-school", "wave": "sc-surf", "mountain": "sc-hike", "living room": "sc-sofa", "ball": "sc-basket" }, "j": { "happy": "sc-happy", "sad": "sc-sad", "scared": "sc-scared", "lazy": "sc-sofa", "handsome": "sc-suit", "angry": "kai-angry", "bored": "kai-bored", "tired": "sc-sleep", "excited": "kai-joy", "hungry": "kai-eat", "thirsty": "kai-drink", "calm": "sc-chill", "ill": "sc-ill" } }, SCUT = new Set(["kai-cry", "kai-joy", "kai-drink", "kai-read", "kai-friend", "kai-chair", "kai-foot", "kai-dog", "kai-cat", "kai-angry", "kai-bored", "kai-eat"]);
const scene = f => f ? `<img class="scene${SCUT.has(f) ? " cut" : ""}" src="img/${f}.webp" alt="" loading="lazy">` : "";
function body(d) {
    return `${scene(SCN.v[d.v])}<p class="pron">/${d.ipa}/ · « ${esc(d.pr)} »</p>
<div class="forms"><div><i>Base</i><b${longCls(d.v)}>${d.v}</b></div><div><i>Past simple</i><b${longCls(d.pt)}>${d.pt}</b></div><div><i>Past participle</i><b${longCls(d.pp)}>${d.pp}</b></div></div>
<div class="exs">${d.ex.map(([en, fr]) => `<div class="ex"><button class="snd sm" data-say="${esc(plain(en))}" aria-label="Listen to the example">${SPK}</button><div><p class="en">${hl(en)}</p><p class="fr">${hl(fr)}</p></div></div>`).join("")}</div>`;
}
function card(d, open) {
    const to = d.modal ? "" : "to ", sz = d.v.length > 9 ? "xl" : d.v.length > 7 ? "lg" : "";
    return `<article class="vcard${open ? "" : " mini"}"><div class="vh"><button class="snd" data-say="${to}${d.v}" aria-label="Listen: ${to}${d.v}">${SPK}</button><div class="w"><h3 class="${sz}">${d.modal ? "" : "<small>to</small>"}${d.v}</h3><p class="tr">${esc(d.fr)}</p>${useLine("verbs", d)}</div><div class="side"><span class="tag ${d.modal ? "mod" : d.irr ? "" : "reg"}">${d.modal ? "Modal" : d.irr ? "Irregular" : "Regular"}</span><button class="tgl" data-tgl="${d.v}" aria-expanded="${open}" aria-label="${open ? "Hide" : "Show"} details: ${to}${d.v}">${PM}</button></div></div>
<div class="vbody"${open ? "" : " inert"}><div>${open ? body(d) : ""}</div></div></article>`;
}
function renderVerbs() {
    const raw = document.getElementById("q").value, q = norm(raw);
    let list = DICT;
    if (q) {
        list = DICT.map(d => [rank(d, q), d]).filter(x => x[0] < 9).sort((a, b) => a[0] - b[0] || a[1].i - b[1].i).map(x => x[1]);
    }
    const auto = !!q && list.length <= 3;
    LAST = list;
    document.getElementById("searchBox").classList.toggle("has", !!q);
    document.getElementById("count").textContent = q ? `${list.length} verb${list.length === 1 ? "" : "s"} found` : `${DICT.length} verbs in the dictionary`;
    document.getElementById("vlist").innerHTML = list.length ? list.map(d => card(d, d.v in OPEN ? OPEN[d.v] : auto)).join("") : `<div class="empty">No verb found for “${esc(raw)}”.<br>More verbs coming soon!</div>`;
}
document.getElementById("q").addEventListener("input", renderVerbs);
document.getElementById("clr").addEventListener("click", e => {
    e.preventDefault();
    const q = document.getElementById("q");
    q.value = "";
    renderVerbs();
    q.focus();
});
document.getElementById("vlist").addEventListener("click", e => {
    const t = e.target.closest("[data-tgl]");
    if (t) {
        const c = t.closest(".vcard"), d = DMAP[t.dataset.tgl], open = c.classList.contains("mini"), vb = c.querySelector(".vbody"), to = d.modal ? "" : "to ";
        if (open && !vb.firstElementChild.innerHTML) {
            vb.firstElementChild.innerHTML = body(d);
            void c.offsetHeight;
        }
        c.classList.toggle("mini", !open);
        OPEN[d.v] = open;
        t.setAttribute("aria-expanded", open);
        t.setAttribute("aria-label", (open ? "Hide" : "Show") + " details: " + to + d.v);
        vb.inert = !open;
        return;
    }
    const b = e.target.closest("[data-say]");
    if (!b)
        return;
    document.querySelectorAll(".snd.talk").forEach(x => x.classList.remove("talk"));
    sayOne(b.dataset.say, b);
});
document.getElementById("toVerbs").addEventListener("click", () => {
    renderVerbs();
    show("verbs");
});
document.getElementById("backV").addEventListener("click", () => show("words", true));
document.querySelectorAll("[data-soon]").forEach(t => t.onclick = () => toast("Coming soon!"));
requestAnimationFrame(fit);
