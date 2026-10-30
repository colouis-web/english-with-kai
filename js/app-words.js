/* Code — tranche de l'ancien index.html (lignes 2290–2316). Script classique : l'ordre des <script> compte. */
"use strict";
/* ===== WORDS : une recherche dans tous les mots (verbes, noms, adjectifs, adverbes, connecteurs, prépositions) ===== */
const WCATS = [{ k: "verbs", lab: "Verbs" }, { k: "nouns", lab: "Nouns" }, { k: "adj", lab: "Adjectives", lex: ADJ }, { k: "adv", lab: "Adverbs", lex: ADV }, { k: "con", lab: "Connectors", lex: CON }, { k: "prep", lab: "Prepositions", lex: PREP }, { k: "phr", lab: "Phrasal verbs", lex: PHR }, { k: "idi", lab: "Idioms", lex: IDI }];
const WMAX = 12;
let WMORE = {}, WOPEN = {};
function wsearch(q) {
    const G = WCATS.map(c => {
        let l = c.k === "verbs" ? DICT.map(d => [rank(d, q), d]) : c.k === "nouns" ? NDICT.map(n => [nrank(n, q), n]) : c.lex.data.map(n => [Math.min(rank(n, q), rank({ keys: n.lkeys }, q) + 2), n]);
        l = l.filter(x => x[0] < 9).sort((a, b) => a[0] - b[0] || a[1].i - b[1].i);
        return { c, l };
    });
    /* les mots trouvés au milieu d'un autre mot ne s'affichent que s'il n'y a rien de mieux */
    const lim = G.some(g => g.l.some(x => x[0] <= 2)) ? 2 : 8;
    return G.map(g => {
        const l = g.l.filter(x => x[0] <= lim);
        return { c: g.c, list: l.map(x => x[1]), best: l.length ? l[0][0] : 9 };
    }).filter(g => g.list.length).sort((a, b) => a.best - b.best || WCATS.indexOf(a.c) - WCATS.indexOf(b.c));
}
const wid = (c, x) => c.k + ":" + (c.k === "verbs" ? x.v : x.i);
const wcard = (c, x, open) => c.k === "verbs" ? card(x, open) : c.k === "nouns" ? ncard(x, open) : c.lex.card(x, open);
function renderWords() {
    const raw = document.getElementById("wq").value, q = norm(raw), box = document.getElementById("wres"), cnt = document.getElementById("wcount");
    document.getElementById("wsearchBox").classList.toggle("has", !!raw);
    document.getElementById("wtiles").hidden = !!q;
    box.hidden = !q;
    cnt.hidden = !q;
    if (!q) {
        box.innerHTML = "";
        return;
    }
    const G = wsearch(q), tot = G.reduce((s, g) => s + g.list.length, 0), auto = tot <= 3;
    cnt.textContent = tot ? `${tot} word${tot > 1 ? "s" : ""} found${G.length > 1 ? ` in ${G.length} lists` : ""}` : "";
    box.innerHTML = tot ? G.map(g => {
        const shown = WMORE[g.c.k] ? g.list : g.list.slice(0, WMAX);
        return `<section class="wgrp" data-wc="${g.c.k}"><div class="dsec"><h2>${g.c.lab}</h2><span>${g.list.length}</span></div><div class="vlist">${shown.map(x => {
            const id = wid(g.c, x);
            return wcard(g.c, x, id in WOPEN ? WOPEN[id] : auto);
        }).join("")}</div>${g.list.length > shown.length ? `<button class="ghost sm wmore" type="button" data-wmore="${g.c.k}">Show all ${g.list.length} ${g.c.lab.toLowerCase()}</button>` : ""}</section>`;
    }).join("")
        : `<div class="empty">No word found for “${esc(raw.trim())}”.<br>Try in French or in English!</div>`;
}
document.getElementById("wq").addEventListener("input", () => {
    WMORE = {};
    renderWords();
});
document.getElementById("wclr").addEventListener("click", e => {
    e.preventDefault();
    const q = document.getElementById("wq");
    q.value = "";
    WMORE = {};
    renderWords();
    q.focus();
});
document.getElementById("wres").addEventListener("click", e => {
    const t = e.target, m = t.closest("[data-wmore]");
    if (m) {
        WMORE[m.dataset.wmore] = 1;
        renderWords();
        return;
    }
    const tg = t.closest("[data-tgl],[data-ntgl],[data-ltgl]");
    if (tg) {
        const c = WCATS.find(x => x.k === tg.closest("[data-wc]").dataset.wc), x = c.k === "verbs" ? DMAP[tg.dataset.tgl] : c.k === "nouns" ? NDICT[+tg.dataset.ntgl] : c.lex.data[+tg.dataset.ltgl];
        const cd = tg.closest(".vcard"), open = cd.classList.contains("mini"), vb = cd.querySelector(".vbody");
        if (open && !vb.firstElementChild.innerHTML) {
            vb.firstElementChild.innerHTML = c.k === "verbs" ? body(x) : c.k === "nouns" ? nbody(x) : c.lex.body(x);
            void cd.offsetHeight;
        }
        cd.classList.toggle("mini", !open);
        WOPEN[wid(c, x)] = open;
        tg.setAttribute("aria-expanded", open);
        vb.inert = !open;
        return;
    }
    const b = t.closest("[data-say]");
    if (!b)
        return;
    document.querySelectorAll(".snd.talk").forEach(x => x.classList.remove("talk"));
    sayOne(b.dataset.say, b);
});
