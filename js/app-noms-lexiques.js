/* Code — tranche de l'ancien index.html (lignes 1972–2023). Script classique : l'ordre des <script> compte. */
"use strict";
const inCat = (n, c) => c === "all" || n.cat === c || (n.also || []).includes(c);
const nrank = (n, q) => Math.min(rank(n, q), rank({ keys: n.lkeys }, q) + 2);
const NOPEN = {};
let NSEL = "all";
function nbody(n) {
    return `${scene(SCN.n[n.w])}<p class="pron">/${n.ipa}/ · « ${esc(n.pr)} »</p>
<div class="forms two">${n.t === "d" ? `<div><i>Digits</i><b${longCls(n.pl)}>${n.pl}</b></div><div><i>Word</i><b${longCls(n.w)}>${n.w}</b></div>` : n.t === "x" ? `<div><i>Singular</i><b${longCls(n.w)}>${n.w}</b></div><div><i>Plural</i><b>—</b></div>` : n.t === "u" ? `<div><i>Singular</i><b${longCls(n.w)}>${n.w}</b></div><div><i>Plural</i><b>—</b><em class="irrpl">Uncountable</em></div>` : n.t === "p" ? `<div><i>Singular</i><b>—</b></div><div><i>Plural</i><b${longCls(n.w)}>${n.w}</b><em class="irrpl">Always plural</em></div>` : `<div><i>Singular</i><b${longCls(n.w)}>${n.w}</b></div><div><i>Plural</i><b${longCls(n.pl)}>${n.pl}</b>${n.ipl ? '<em class="irrpl">Irregular!</em>' : ""}</div>`}</div>
<div class="exs">${n.ex.map(([en, fr]) => `<div class="ex"><button class="snd sm" data-say="${esc(plain(en))}" aria-label="Listen to the example">${SPK}</button><div><p class="en">${hl(en)}</p><p class="fr">${hl(fr)}</p></div></div>`).join("")}</div>`;
}
function ncard(n, open) {
    const tc = NSEL !== "all" && inCat(n, NSEL) ? NSEL : n.cat, a = artOf(n), say = (a ? a + " " : "") + n.w, sz = n.w.length > 10 ? "xxl" : n.w.length > 8 ? "xl" : n.w.length > 6 ? "lg" : "", c = NCAT[n.cat];
    return `<article class="vcard ncard${open ? "" : " mini"}"><div class="vh"><button class="snd" data-say="${say}" aria-label="Listen: ${say}">${SPK}</button><span class="emo" aria-hidden="true">${n.e || c.icon}</span><div class="w"><h3 class="${sz}">${a ? `<small>${a}</small>` : ""}${n.w}</h3><p class="tr">${esc(n.fr)}</p>${useLine("nouns", n)}</div><div class="side"><span class="tag cat-${tc}">${NCAT[tc].label}</span><button class="tgl" data-ntgl="${n.i}" aria-expanded="${open}" aria-label="${open ? "Hide" : "Show"} details: ${say}">${PM}</button></div></div>
<div class="vbody"${open ? "" : " inert"}><div>${open ? nbody(n) : ""}</div></div></article>`;
}
function renderChips() {
    const cnt = { all: NDICT.length };
    NDICT.forEach(n => [n.cat, ...(n.also || [])].forEach(c => cnt[c] = (cnt[c] || 0) + 1));
    document.getElementById("nchips").innerHTML = [["all", "All", ""], ...Object.keys(NCAT).map(k => [k, NCAT[k].label, NCAT[k].icon])].map(([k, l, ic]) => `<button class="chip${NSEL === k ? " on" : ""}" data-cat="${k}" aria-pressed="${NSEL === k}">${ic ? `<span class="emo" aria-hidden="true">${ic}</span>` : ""}${l}<i>${cnt[k] || 0}</i></button>`).join("");
}
function renderNouns() {
    const raw = document.getElementById("nq").value, q = norm(raw);
    let list = NSEL === "all" ? NDICT : NDICT.filter(n => inCat(n, NSEL));
    if (q)
        list = list.map(n => [nrank(n, q), n]).filter(x => x[0] < 9).sort((a, b) => a[0] - b[0] || a[1].i - b[1].i).map(x => x[1]);
    const auto = !!q && list.length <= 3;
    document.getElementById("nsearchBox").classList.toggle("has", !!q);
    const s = list.length === 1 ? "" : "s";
    document.getElementById("ncount").textContent = q ? `${list.length} noun${s} found` : NSEL === "all" ? `${NDICT.length} nouns in the dictionary` : `${list.length} ${NCAT[NSEL].label.toLowerCase()}`;
    document.getElementById("nlist").innerHTML = list.length ? list.map(n => ncard(n, n.i in NOPEN ? NOPEN[n.i] : auto)).join("") : `<div class="empty">No noun found for “${esc(raw)}”.<br>More nouns coming soon!</div>`;
}
document.getElementById("nq").addEventListener("input", renderNouns);
document.getElementById("nclr").addEventListener("click", e => {
    e.preventDefault();
    const q = document.getElementById("nq");
    q.value = "";
    renderNouns();
    q.focus();
});
document.getElementById("nchips").addEventListener("click", e => {
    const c = e.target.closest("[data-cat]");
    if (!c)
        return;
    NSEL = c.dataset.cat;
    renderChips();
    renderNouns();
});
document.getElementById("nlist").addEventListener("click", e => {
    const t = e.target.closest("[data-ntgl]");
    if (t) {
        const c = t.closest(".vcard"), n = NDICT[+t.dataset.ntgl], open = c.classList.contains("mini"), vb = c.querySelector(".vbody"), a = artOf(n);
        if (open && !vb.firstElementChild.innerHTML) {
            vb.firstElementChild.innerHTML = nbody(n);
            void c.offsetHeight;
        }
        c.classList.toggle("mini", !open);
        NOPEN[n.i] = open;
        t.setAttribute("aria-expanded", open);
        t.setAttribute("aria-label", (open ? "Hide" : "Show") + " details: " + (a ? a + " " : "") + n.w);
        vb.inert = !open;
        return;
    }
    const b = e.target.closest("[data-say]");
    if (!b)
        return;
    document.querySelectorAll(".snd.talk").forEach(x => x.classList.remove("talk"));
    sayOne(b.dataset.say, b);
});
document.getElementById("toNouns").addEventListener("click", () => {
    renderChips();
    renderNouns();
    show("nouns");
});
document.getElementById("backN").addEventListener("click", () => show("words", true));
/* ===== LEXIQUES : adverbes et connecteurs (même fonctionnement que les noms) ===== */
function makeLex(o) {
    const $ = s => document.getElementById(o.id + s);
    o.data.forEach((n, i) => {
        n.i = i;
        n.keys = [n.w, ...n.fr.split("/").map(x => x.replace(/\(.*?\)/g, ""))].map(norm).filter(Boolean);
        n.lkeys = [n.cat, ...(n.also || [])].map(c => norm(o.cats[c].label));
    });
    const inC = (n, c) => c === "all" || n.cat === c || (n.also || []).includes(c);
    let SEL = "all";
    const OPEN = {};
    const body = n => `${o.scenes ? scene(o.scenes[n.w]) : ""}${n.ipa ? `<p class="pron">/${n.ipa}/ · « ${esc(n.pr)} »</p>` : ""}${o.forms ? o.forms(n) : ""}<div class="exs">${n.ex.map(([en, fr]) => `<div class="ex"><button class="snd sm" data-say="${esc(plain(en))}" aria-label="Listen to the example">${SPK}</button><div><p class="en">${hl(en)}</p><p class="fr">${hl(fr)}</p></div></div>`).join("")}</div>`;
    const card = (n, open) => {
        const tc = SEL !== "all" && inC(n, SEL) ? SEL : n.cat, L = n.w.length, sz = L > 14 ? "xxl" : L > 10 ? "xl" : L > 7 ? "lg" : "";
        return `<article class="vcard${open ? "" : " mini"}"><div class="vh"><button class="snd" data-say="${esc(n.w)}" aria-label="Listen: ${esc(n.w)}">${SPK}</button><div class="w"><h3 class="${sz}">${esc(n.w)}</h3><p class="tr">${esc(n.fr)}</p>${useLine(LEXKIND[o.id], n)}</div><div class="side"><span class="tag lc-${tc}">${o.cats[tc].label}</span><button class="tgl" data-ltgl="${n.i}" aria-expanded="${open}" aria-label="${open ? "Hide" : "Show"} details: ${esc(n.w)}">${PM}</button></div></div>
<div class="vbody"${open ? "" : " inert"}><div>${open ? body(n) : ""}</div></div></article>`;
    };
    function chips() {
        const cnt = { all: o.data.length };
        o.data.forEach(n => [n.cat, ...(n.also || [])].forEach(c => cnt[c] = (cnt[c] || 0) + 1));
        $("chips").innerHTML = [["all", "All"], ...Object.keys(o.cats).map(k => [k, o.cats[k].label])].map(([k, l]) => `<button class="chip${SEL === k ? " on" : ""}" data-cat="${k}" aria-pressed="${SEL === k}">${l}<i>${cnt[k] || 0}</i></button>`).join("");
    }
    function render() {
        const raw = $("q").value, q = norm(raw);
        let list = o.data.filter(n => inC(n, SEL));
        if (q)
            list = list.map(n => [Math.min(rank(n, q), rank({ keys: n.lkeys }, q) + 2), n]).filter(x => x[0] < 9).sort((a, b) => a[0] - b[0] || a[1].i - b[1].i).map(x => x[1]);
        const auto = !!q && list.length <= 3, s = list.length === 1 ? "" : "s";
        $("box").classList.toggle("has", !!q);
        $("count").textContent = q ? `${list.length} ${o.unit}${s} found` : SEL === "all" ? `${o.data.length} ${o.unit}s in the dictionary` : `${list.length} ${o.unit}${s} · ${o.cats[SEL].label}`;
        $("list").innerHTML = list.length ? list.map(n => card(n, n.i in OPEN ? OPEN[n.i] : auto)).join("") : `<div class="empty">No ${o.unit} found for “${esc(raw)}”.</div>`;
    }
    $("q").addEventListener("input", render);
    $("clr").addEventListener("click", e => {
        e.preventDefault();
        $("q").value = "";
        render();
        $("q").focus();
    });
    $("chips").addEventListener("click", e => {
        const c = e.target.closest("[data-cat]");
        if (!c)
            return;
        SEL = c.dataset.cat;
        chips();
        render();
    });
    $("list").addEventListener("click", e => {
        const t = e.target.closest("[data-ltgl]");
        if (t) {
            const c = t.closest(".vcard"), n = o.data[+t.dataset.ltgl], open = c.classList.contains("mini"), vb = c.querySelector(".vbody");
            if (open && !vb.firstElementChild.innerHTML) {
                vb.firstElementChild.innerHTML = body(n);
                void c.offsetHeight;
            }
            c.classList.toggle("mini", !open);
            OPEN[n.i] = open;
            t.setAttribute("aria-expanded", open);
            t.setAttribute("aria-label", (open ? "Hide" : "Show") + " details: " + n.w);
            vb.inert = !open;
            return;
        }
        const b = e.target.closest("[data-say]");
        if (!b)
            return;
        document.querySelectorAll(".snd.talk").forEach(x => x.classList.remove("talk"));
        sayOne(b.dataset.say, b);
    });
    return { open() {
            chips();
            render();
        }, data: o.data, cats: o.cats, inC, card, body };
}
