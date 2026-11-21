/* Kai's voyage (PO, 20/11) : un apprentissage continu du vocabulaire, en voyage d'île en île (pas d'objectif mensuel :
   « on fait le plan et les élèves avancent », PO 20/11).
   - Une île par famille de mots : Thing Island (noms), Action Volcano (verbes), Colour Cove (adjectifs), Swift Reef (adverbes).
   - Chaque île est un chemin de ports ; un port = 7 mots (10 au départ, 7 depuis le 21/11 : « pour que ce ne soit pas trop long », PO), rangés du plus courant au plus rare : d'abord le niveau minimum
     du mot (lvOkWord), puis l'ordre de fréquence (js/data/frequence-voyage.js ; verbes : liste USAGE), puis la classe f.
     Un port est figé (ses mots sont notés dans le profil) dès sa première série : un mot ajouté plus tard au dictionnaire
     ne décale jamais un port commencé, et un port commencé à 10 mots les garde.
   - La série : une phrase d'exemple à trou par mot, on tape le mot (aucun choix de réponses). Une faute de frappe compte comme une faute.
   - Un port est certifié après 2 séries sans faute faites 2 jours différents (PO : « 2 fois sans fautes »).
   - Tempête : 21 jours après sa certification (ou sa dernière tempête), une série sans faute garde le phare allumé.
   - Chaque élève avance à son rythme : sur une île, le port suivant s'ouvre dès qu'on a commencé le précédent.
     Le bouton « Next » propose le port de l'île la moins avancée (pondérée : 4 noms pour 3 verbes, 2 adjectifs, 1 adverbe).
   - Pièces d'or (PO, 21/11 : « un système de pièces d'or, je pourrai transformer les points en cadeau au bout de x pièces ») :
     1re série sans faute 1 pièce ; 2e série (certification) 3 pièces le lendemain, 2 dans les 3 jours, 1 ensuite ; tempête battue 2.
     Un parent choisit un cadeau et son prix en pièces (code parent) ; l'élève échange ses pièces contre le cadeau (code parent).
   - Données : dans le profil (p.voy), donc dans les sauvegardes ; rien ne quitte l'appareil.
   Script classique, chargé après app-picks.js (réutilise t3Ok, t3Blank, headSvg, la page du quiz). */
"use strict";
const VY_ISL = [
    { k: "nouns", name: "Thing Island", fam: "Nouns", one: "noun", n: "#a3e635", per: 4, st: "vert" },
    { k: "verbs", name: "Action Volcano", fam: "Verbs", one: "verb", n: "#fb923c", per: 3, st: "volcan" },
    { k: "adjectives", name: "Colour Cove", fam: "Adjectives", one: "adjective", n: "#f472b6", per: 2, st: "arc" },
    { k: "adverbs", name: "Swift Reef", fam: "Adverbs", one: "adverb", n: "#38bdf8", per: 1, st: "recif" }];
const VY_SIZE = 7, VY_RUNS = 2, VY_STORM = 21;
let VYV = { i: null, h: null }, VY = null;
const vyIsl = k => VY_ISL.find(x => x.k === k);
const vyHkey = (k, n) => k + ":" + n;
/* données de l'élève : p.voy = { h: { "nouns:4": { w: [clés], r: [jours sans faute], c: jour certifié, s: jour de la dernière tempête } },
   seen: jour de la 1re ouverture (Kai annonce la nouveauté dans le menu jusque-là),
   gold: { n: pièces en poche, tot: pièces gagnées, gifts: [{ d, n, g }] cadeaux reçus }, gift: { n: prix en pièces, g: le cadeau } } */
function vySt() {
    const p = curProf();
    if (!p)
        return { h: {} };
    if (!p.voy || typeof p.voy !== "object")
        p.voy = { h: {} };
    p.voy.h = p.voy.h || {};
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
        if (w.length < 4 && out.length && ![...fz.keys()].some(x => x > n)) {   /* un reste de moins de 4 mots rejoint le dernier port */
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
const vyDone = key => !!(vySt().h[key] || {}).c;
/* le dernier port ouvert d'une île : le port 1, puis le port qui suit le dernier port commencé */
function vyOpen(k) {
    const st = vySt();
    return Math.max(1, ...vyHarbours(k).filter(h => st.h[vyHkey(k, h.n)]).map(h => h.n + 1));
}
/* le prochain port conseillé : sur l'île la moins avancée, le premier port ouvert pas encore certifié et pas déjà réussi
   aujourd'hui ; sinon un port en tempête ; sinon « reviens demain » (2e série) ou « tout est fini » */
function vyNext() {
    const st = vySt(), T = todayKey(), C = [];
    let left = 0;
    VY_ISL.forEach(I => {
        const H = vyHarbours(I.k), open = vyOpen(I.k), todo = H.filter(h => !vyDone(vyHkey(I.k, h.n)));
        left += todo.length;
        const h = todo.find(h => h.n <= open && !((st.h[vyHkey(I.k, h.n)] || {}).r || []).includes(T));
        if (h)
            C.push({ key: vyHkey(I.k, h.n), w: H.filter(x => vyDone(vyHkey(I.k, x.n))).length / I.per });
    });
    C.sort((a, b) => a.w - b.w);
    if (C.length)
        return { key: C[0].key };
    const storm = Object.keys(st.h).find(key => { const [k, n] = key.split(":"); return vyState(k, +n) === "storm"; });
    if (storm)
        return { key: storm, storm: true };
    return left ? { wait: true } : { done: true };
}
const vyCount = () => Object.values(vySt().h).filter(h => h.c).length;
const vyWords = () => Object.values(vySt().h).filter(h => h.c).reduce((t, h) => t + (h.w || []).length, 0);
/* le nom amusant du port (js/data/noms-ports.js) ; « Harbour 4 » si le fichier manque */
/* le lieu de chaque port (12 vignettes Gemini du PO, 21/11) : caché dans le brouillard, il se dévoile à moitié après la
   1re série sans faute et en entier quand le port est certifié — une raison de plus de faire la 2e série */
const VY_LIEUX = ["A fishing harbour in Brittany", "A tropical harbour in Tahiti", "A colourful little harbour in Italy", "A peaceful harbour in Greece",
    "A harbour on the east coast of the USA", "A pirates' hideout in the 17th century", "The walled harbour of Saint-Malo", "A fishing harbour in England",
    "A harbour in the fjords of Norway", "A big trading harbour in Asia", "A harbour in the Middle East", "A modern marina"];
const VY_LORDER = { nouns: [1, 6, 8, 5, 7, 2, 3, 4, 9, 10, 11, 12], verbs: [10, 11, 4, 2, 6, 9, 1, 3, 5, 7, 8, 12], adjectives: [3, 4, 2, 12, 1, 5, 6, 7, 8, 9, 10, 11], adverbs: [12, 9, 2, 1, 3, 4, 5, 6, 7, 8, 10, 11] };
const vyLieu = (k, n) => { const L = VY_LORDER[k] || VY_LORDER.nouns; return L[(n - 1) % L.length]; };
const vyLieuImg = (k, n) => `img/voyage-lieu-${String(vyLieu(k, n)).padStart(2, "0")}.webp`;
const vyHname = (k, n) => typeof vyName === "function" ? vyName(k, +n) : `Harbour ${n}`;
const vyLabel = key => { const [k, n] = key.split(":"); return `${vyIsl(k).name} · ${vyHname(k, n)}`; };
/* ===== la page du voyage : la carte, une île, un port ===== */
function openVoyage() {
    VYV = { i: null, h: null };
    const st = vySt();
    if (!st.seen && curProf()) {   /* Kai n'annonce plus la nouveauté dans le menu */
        st.seen = todayKey();
        vySave();
    }
    renderVoyage();
    show("voyage");
    scrollTo(0, 0);
}
const vyIcon = {
    coin: '<svg class="vycoin" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="#fbbf24" stroke="#b45309" stroke-width="1.6"/><circle cx="12" cy="12" r="7.2" fill="none" stroke="#d97706" stroke-width="1.3"/><path d="M12 7.6l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#fff7d6"/></svg>',
    flag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V4M6 4h11l-2.5 4L17 12H6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    storm: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 16a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1A4 4 0 0 1 17 16M12 13l-2 4h4l-2 4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
};
/* la carte « My voyage » : ports certifiés et mots appris, île par île */
/* le bateau de Kai grandit avec les ports certifiés (images Gemini du PO, 21/11) */
const VY_BOATS = [{ min: 0, name: "raft" }, { min: 5, name: "rowing boat" }, { min: 15, name: "sailing boat" }, { min: 30, name: "big ship" }];
const vyBoat = n => VY_BOATS.reduce((b, x, i) => n >= x.min ? i : b, 0);
function vyCard() {
    const n = vyCount(), b = vyBoat(n), nx = VY_BOATS[b + 1], per = VY_ISL.map(I => { const H = vyHarbours(I.k); return `<span style="--n:${I.n}">${I.fam} ${H.filter(h => vyDone(vyHkey(I.k, h.n))).length}/${H.length}</span>`; }).join("");
    return `<div class="vymonth"><div class="vymh"><span>My voyage</span><span>${vyWords()} words learnt</span></div>
<div class="vyboat"><img src="img/voyage-bateau-${b + 1}.webp" alt="Kai on his ${VY_BOATS[b].name}"><div><div class="vymn"><b>${n}</b><span>harbour${n === 1 ? "" : "s"} certified</span></div>
<p>Kai's boat: <b>${VY_BOATS[b].name}</b></p>${nx ? `<div class="pbar"><i style="width:${Math.round(100 * (n - VY_BOATS[b].min) / (nx.min - VY_BOATS[b].min))}%"></i></div><small>${nx.min - n} more for a ${nx.name}</small>` : "<small>The biggest ship of the archipelago!</small>"}</div></div>
<div class="vyfam">${per}</div></div>`;
}
/* le passeport (images Gemini du PO, 21/11) : le tampon d'une île au 1er port certifié sur cette île ;
   le tampon « voyage » quand les 4 îles sont tamponnées */
const vyIslDone = k => vyHarbours(k).filter(h => vyDone(vyHkey(k, h.n))).length;
const vyStamps = () => VY_ISL.filter(I => vyIslDone(I.k) > 0).length;
function vyPassport() {
    const all = vyStamps() === VY_ISL.length;
    const one = (img, name, got, sub) => `<li class="${got ? "got" : ""}"><span class="vystamp">${got ? `<img src="img/voyage-tampon-${img}.webp" alt="">` : ""}</span><b>${name}</b><small>${sub}</small></li>`;
    return `<div class="vypass"><div class="vypassh"><span>My passport</span><span>${vyStamps() + (all ? 1 : 0)} / ${VY_ISL.length + 1} stamps</span></div>
<ul>${VY_ISL.map(I => { const c = vyIslDone(I.k); return one(I.st, I.name, c > 0, c ? `${c} harbour${c > 1 ? "s" : ""}` : "1 harbour to get it"); }).join("")}${one("voyage", "Great voyage", all, all ? "All the islands!" : "Every island stamped")}</ul></div>`;
}
/* ===== les pièces d'or et le cadeau (PO, 21/11) ===== */
const VY_COIN = { run1: 1, storm: 2 };
const vyCoinsCert = d => d <= 1 ? 3 : d <= 3 ? 2 : 1;   /* 2e série : d jours après la 1re */
const vyCoinTxt = c => `${c} gold coin${c === 1 ? "" : "s"}`;
function vyGold() {
    const st = vySt();
    if (!st.gold || typeof st.gold !== "object") {   /* première fois : les ports déjà réussis rapportent leurs pièces */
        let n = 0;
        Object.values(st.h).forEach(h => {
            if (h.r && h.r.length)
                n += VY_COIN.run1;
            if (h.c)
                n += 3;
        });
        st.gold = { n, tot: n, gifts: [] };
    }
    st.gold.gifts = st.gold.gifts || [];
    return st.gold;
}
function vyTreasure() {
    const g = vyGold(), gift = vySt().gift, ok = gift && g.n >= gift.n;
    return `<div class="vytres"><div class="vymh"><span>My treasure</span><span>${vyCoinTxt(g.tot)} won</span></div>
<div class="vyboat"><span class="vychest">${vyIcon.coin}</span><div><div class="vymn"><b>${g.n}</b><span>gold coin${g.n === 1 ? "" : "s"}</span></div>
${gift ? `<p>My gift: <b>${esc(gift.g)}</b></p><div class="pbar"><i style="width:${Math.min(100, Math.round(100 * g.n / gift.n))}%"></i></div><small>${ok ? "Enough coins! Ask a parent." : `${gift.n - g.n} more coin${gift.n - g.n === 1 ? "" : "s"} for your gift`}</small>` : "<p>A parent chooses a gift and its price in gold coins.</p>"}</div></div>
<p class="vycrule">Run 1: <b>1 coin</b> · Run 2 the next day: <b>3 coins</b> (within 3 days: 2, later: 1) · Storm beaten: <b>2 coins</b></p>
<div class="vytbtn">${ok ? `<button class="vygo" type="button" id="vyswap">${vyIcon.coin}Get my gift</button>` : ""}<button class="ghost sm" type="button" id="vygift">${gift ? "Change the gift" : "Choose a gift"} (parents)</button></div>
${g.gifts.length ? `<small class="vygot">Gifts received: ${g.gifts.length}</small>` : ""}</div>`;
}
/* le parent choisit le cadeau et son prix (après le code parent) */
function vyGiftForm() {
    const gift = vySt().gift || {};
    openModal("The gift", `<p class="mtxt">Choose a gift and how many gold coins it costs.</p><input class="pcin vygin" id="vygg" type="text" maxlength="40" autocomplete="off" placeholder="The gift (e.g. a cinema ticket)" aria-label="The gift" value="${esc(gift.g || "")}"><input class="pcin" id="vygn" type="number" inputmode="numeric" min="1" max="1000" placeholder="Coins" aria-label="Price in gold coins" value="${gift.n || ""}"><div class="endbtns"><button class="listen sm" data-mact="ok">Save</button>${gift.g ? '<button class="ghost sm" data-mact="del">No gift</button>' : ""}<button class="ghost sm" data-mclose>Cancel</button></div>`);
    const save = () => {
        renderVoyage();
        vySave();
    };
    MACT = { ok: () => {
            const g = ((document.getElementById("vygg") || {}).value || "").trim().slice(0, 40), n = Math.round(+((document.getElementById("vygn") || {}).value || 0));
            if (!g || !(n >= 1 && n <= 1000)) {
                toast(!g ? "Write the gift, please" : "A price from 1 to 1000 coins", 2200);
                return;
            }
            vySt().gift = { n, g };
            save();
            toast("Gift saved", 2000);
        }, del: () => {
            delete vySt().gift;
            save();
        } };
    setTimeout(() => {
        const i = document.getElementById("vygg");
        if (i)
            try {
                i.focus();
            }
            catch (e) {
            }
    }, 90);
}
/* l'élève échange ses pièces contre le cadeau (le parent confirme) */
function vySwap() {
    const g = vyGold(), gift = vySt().gift;
    if (!gift || g.n < gift.n)
        return;
    gate(`Swap <b>${gift.n} gold coins</b> for <b>${esc(gift.g)}</b>?`, () => {
        g.n -= gift.n;
        g.gifts.push({ d: todayKey(), n: gift.n, g: gift.g });
        vySave();
        renderVoyage();
        kaiCongrats("Enjoy your gift!", `<b>${esc(gift.g)}</b> for ${gift.n} gold coins. Well done, captain!`, "Congrats! Enjoy your gift!");
    });
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
    const nx = vyNext(), n = vyCount();
    const say = !curProf() ? "Create your profile first, then we *set sail*!" : nx.done ? "Every harbour is *certified*! You're a real captain!" : nx.wait ? "Great sailing today! Come back *tomorrow* for your second runs." : n ? `*${n} harbour${n === 1 ? "" : "s"}* certified. Let's sail on!` : `${VY_NUM[VY_SIZE]} words in each *harbour*. Let's set sail!`;
    /* le haut de la page comme le menu (PO, 21/11) : un carrousel de 3 cartes — Kai et « Next », le statut, le passeport —
       pour que la carte des îles remonte */
    B.innerHTML = `<div class="mcar vycar" aria-roledescription="carousel" aria-label="Kai, my voyage and my passport"><div class="mtrack" id="vytrack">
<section class="mslide" aria-roledescription="slide" aria-label="1 of 3: Kai"><div class="mcard mkai vykai">${curProf() ? `<span class="vycoins" aria-label="${vyCoinTxt(vyGold().n)}">${vyIcon.coin}<b>${vyGold().n}</b></span>` : ""}<div class="qhead">${headSvg(say, n ? "smile" : "head")}</div>
${nx.key ? `<button class="vygo" type="button" data-vyh="${nx.key}"><span>${nx.storm ? "Storm! " : "Next: "}${esc(vyHname(...nx.key.split(":")))}<small>${esc(vyIsl(nx.key.split(":")[0]).name)}</small></span>${GOSVG}</button>` : ""}
<p class="mhint" id="vyhint">Swipe for your voyage <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></p></div></section>
<section class="mslide" aria-roledescription="slide" aria-label="2 of 3: my voyage">${vyCard()}</section>
<section class="mslide" aria-roledescription="slide" aria-label="3 of 3: my passport">${vyPassport()}</section></div>
<div class="mdots" id="vydots" role="tablist" aria-label="Cards">${["Kai", "My voyage", "My passport"].map((t, i) => `<button type="button" role="tab" aria-selected="${!i}" aria-label="${t}" data-vc="${i}"></button>`).join("")}</div></div>
<div class="vymap"><img src="img/voyage-carte.webp" alt="Map of the archipelago" loading="lazy">
${VY_ISL.map((I, j) => { const H = vyHarbours(I.k), c = H.filter(h => vyDone(vyHkey(I.k, h.n))).length; return `<button class="vyisl i${j}" type="button" data-vyi="${I.k}" style="--n:${I.n}"><b>${I.name}</b><small>${I.fam} · ${c}/${H.length}</small></button>`; }).join("")}
<span class="vyisl i4 lock">${vyIcon.lock}<small>Secret island</small></span></div>
${curProf() ? vyTreasure() : ""}
<div class="vymiss"><img src="img/voyage-missions.webp" alt="Kai and two friends on a rock above a harbour in Brittany"><div><span>${vyIcon.lock} Special missions</span><p>Coming soon: Kai and his friends have new adventures for you!</p></div></div>`;
    vyCarousel();
}
/* glisser d'une carte à l'autre : les points suivent, un point ou « Swipe » fait défiler (comme le menu) */
function vyCarousel() {
    const track = document.getElementById("vytrack"), dots = document.getElementById("vydots");
    if (!track || !dots)
        return;
    const cur = () => Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    let raf = 0;
    track.addEventListener("scroll", () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
            const i = cur();
            dots.querySelectorAll("[data-vc]").forEach((d, k) => d.setAttribute("aria-selected", String(k === i)));
            if (i > 0)
                document.getElementById("vyhint").classList.add("seen");
        });
    }, { passive: true });
    dots.addEventListener("click", e => {
        const d = e.target.closest("[data-vc]");
        if (d)
            track.scrollTo({ left: +d.dataset.vc * track.clientWidth, behavior: "smooth" });
    });
    document.getElementById("vyhint").addEventListener("click", () => track.scrollTo({ left: track.clientWidth, behavior: "smooth" }));
}
function renderIsland(B, h1) {
    const I = vyIsl(VYV.i), H = vyHarbours(I.k), st = vySt(), nx = vyNext().key;
    h1.textContent = I.name;
    const open = vyOpen(I.k);
    const vis = H.filter(h => h.n <= open + 2);
    B.innerHTML = `<div class="vyhead" style="--n:${I.n}"><img src="img/kai-voyage.webp" alt=""><div><span>${I.fam} · ${H.length} harbours</span><p>${esc(vyHname(I.k, 1))} has the ${VY_SIZE} most useful ${I.fam.toLowerCase()}. The further you sail, the rarer the words!</p></div></div>
<ol class="vyports">${vis.map(h => {
        const key = vyHkey(I.k, h.n), s = vyState(I.k, h.n), lock = h.n > open, inR = key === nx, runs = ((st.h[key] || {}).r || []).length;
        const sub = s === "cert" ? "Certified" : s === "storm" ? "Storm!" : s === "run" ? `${Math.min(runs, VY_RUNS)} / ${VY_RUNS} perfect runs` : lock ? "Locked" : key === nx ? "Next" : "Ready";
        const words = h.w.slice(0, 5).map(x => (allWords().byKey.get(x) || { d: {} }).d).map(d => esc(d.v || d.w || "")).join(" · ");
        return `<li><button type="button" class="vyport ${s}${lock ? " lock" : ""}${inR ? " next" : ""}" ${lock ? "disabled" : `data-vyh="${key}"`}><span class="vyn">${s === "cert" ? vyIcon.flag : s === "storm" ? vyIcon.storm : lock ? vyIcon.lock : h.n}</span><span class="vyt"><b>${esc(vyHname(I.k, h.n))}</b><em>${sub}</em><small>${lock ? `${h.w.length} new ${I.fam.toLowerCase()}` : words + "…"}</small></span>${lock ? "" : `<img class="vythumb${s === "cert" || s === "storm" ? "" : s === "run" ? " fog1" : " fog"}" src="${vyLieuImg(I.k, h.n)}" alt="">`}</button></li>`;
    }).join("")}</ol>
${H.length > vis.length ? `<p class="vymore">${H.length - vis.length} more harbours to discover</p>` : ""}`;
}
const VY_NUM = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
/* sous le mot, dans la liste du port, ce qui aide pour les phrases à trou (PO, 21/11) : le pluriel des noms,
   le prétérit et le participe passé des verbes irréguliers */
function vyForms(w) {
    const d = w.d, f = x => String(x || "").trim(), ok = x => f(x) && f(x) !== "—";
    let t = "";
    if (w.k === "nouns")
        t = d.t === "u" ? "uncountable" : d.t === "p" ? "always plural" : (d.t === "c" || d.t === "n") && ok(d.pl) && f(d.pl) !== f(d.w)
            ? `plural: <b>${esc(f(d.pl))}</b>${d.ipl ? ' <em>irregular</em>' : ""}` : "";
    else if (w.k === "verbs" && d.irr && ok(d.pt))
        t = `<b>${esc(f(d.pt))}</b>${ok(d.pp) ? " · <b>" + esc(f(d.pp)) + "</b>" : ""}`;   /* seuls les irréguliers ont leurs formes : pas d'étiquette */
    return t ? `<small class="vyfm">${t}</small>` : "";
}
/* sous chaque série du port : ce qu'elle rapporte (pour donner envie de revenir le lendemain) */
function vyRunCoins(j, r, s) {
    if (s === "cert" || s === "storm" || r[j])
        return "";
    const T = todayKey(), c = j === 0 ? VY_COIN.run1 : !r[0] ? 3 : r[0] === T ? 3 : vyCoinsCert(daysBetween(r[0], T)), when = j === 1 && r[0] === T ? "tomorrow" : j === 1 && r[0] ? "today" : "";
    return `<small class="vyrc">${vyIcon.coin}+${vyCoinTxt(c)}${when ? " " + when : ""}</small>`;
}
function renderHarbour(B, h1) {
    const [k, n] = VYV.h.split(":"), I = vyIsl(k), H = vyHarbours(k).find(h => h.n === +n), h = vySt().h[VYV.h] || {}, s = vyState(k, +n), T = todayKey();
    h1.textContent = vyHname(k, n);
    if (!H) {
        VYV.h = null;
        return renderIsland(B, h1);
    }
    const r = h.r || [], today = r.includes(T);
    const W = H.w.map(x => allWords().byKey.get(x)).filter(Boolean);
    const say = s === "cert" ? "This harbour is *certified*! Practise when you want." : s === "storm" ? "A *storm* is coming! One perfect run keeps your lighthouse on." : today ? "Perfect run today! Come back *tomorrow* for the second one." : r.length ? "Second run today! *No mistakes* and I plant your flag!" : `${VY_NUM[W.length] || W.length} words, ${(VY_NUM[W.length] || W.length + "").toLowerCase()} gaps. Two *perfect* runs, on two different days!`;
    const face = s === "cert" ? "smile" : "head";   /* le visage à part : le test des images lit le 2e argument de headSvg */
    /* l'image du port : au soleil quand il est certifié, sous la tempête, sinon encore dans le brouillard */
    /* l'image du port : Kai dans le brouillard (rien de réussi), le lieu dans la brume (1 série), le lieu dévoilé (certifié), la tempête */
    const lieu = VY_LIEUX[vyLieu(k, +n) - 1];
    const scene = s === "storm" ? `<figure class="vyscene"><img src="img/voyage-port-tempete.webp" alt="Kai at the lighthouse in the storm"><figcaption>Storm! One perfect run keeps your lighthouse on.</figcaption></figure>`
        : s === "cert" ? `<figure class="vyscene lieu"><img src="${vyLieuImg(k, n)}" alt="${esc(lieu)}"><figcaption>${vyIcon.flag}${esc(lieu)}</figcaption></figure>`
        : s === "run" ? `<figure class="vyscene lieu fog1"><img src="${vyLieuImg(k, n)}" alt="${esc(lieu)}, still in the fog"><figcaption>The fog is lifting… One more perfect run!</figcaption></figure>`
        : `<figure class="vyscene lieu fog"><img src="${vyLieuImg(k, n)}" alt="${esc(lieu)}, in the fog"><figcaption>Two perfect runs and the fog lifts on this harbour!</figcaption></figure>`;
    B.innerHTML = `<div class="qhead">${headSvg(say, face)}</div>
${scene}
<div class="vyruns">${[0, 1].map(j => `<div class="${r[j] ? "ok" : ""}"><span>Run ${j + 1}${r[j] ? " · " + kDate(r[j]).toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }) : ""}</span><b>${r[j] ? `${W.length} / ${W.length} perfect` : "To do"}</b>${vyRunCoins(j, r, s)}</div>`).join("")}</div>
<div class="vywords" style="--n:${I.n}"><div class="vywh"><span>${I.name}</span><span>${W.length} ${W.length === 1 ? I.one : I.fam.toLowerCase()}</span></div>
<ul>${W.map(w => `<li><button class="snd sm" type="button" data-say="${esc(w.d.v || w.d.w)}" aria-label="Listen">${SPK}</button><span class="vyw"><b>${esc(w.d.v || w.d.w)}</b>${vyForms(w)}</span><i>${esc(w.d.fr || "")}</i></li>`).join("")}</ul></div>
<p class="vyrule">${W.length} sentences with a gap: type the missing word. A typo counts as a mistake.</p>
<button class="vygo" type="button" id="vystart">${s === "cert" ? "Practise" : s === "storm" ? "Face the storm" : r.length && !today ? "Start run 2" : today ? "Practise again" : "Start run 1"}${GOSVG}</button>`;
}
/* ===== la série : une phrase à trou par mot du port ===== */
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
    vyMicStop();
    const mic = vyMicOk(), it = VY.items[VY.i], ans = t3Ans(it), /* Kai dit le mot français de la phrase (« heure » pour « What time is it? ») */ hint = t3Norm(ans) !== t3Norm(it.base) ? `<p class="vyhint">Hint: <b>${esc(it.base)}</b></p>` : "";
    document.getElementById("qn").textContent = `${VY.i + 1}/${VY.items.length}`;
    QW().innerHTML = `<p class="qpart">${esc(vyLabel(VY.key))} · Fill the gap</p>${vyDots()}
<div class="qhead">${headSvg(`*${((String(it.fr).match(/\*(.+?)\*/) || [])[1] || it.f.split("/")[0]).trim()}*`, "head", "", "fr")}</div>
<div class="t3card pkcard"><p class="t3en">${esc(t3Blank(it.en)).replace(/_____([.,!?;:]*)/, '<span class="bw"><span class="blank" role="img" aria-label="missing word"></span>$1</span>')}</p><p class="t3fr">${hl(it.fr)}</p>${hint}</div>
<div class="vyrow"><input class="t3in" id="vyin" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${mic ? "Type or say" : "Type"} the missing word" aria-label="Missing word">${mic ? `<button class="mic vymic" id="vymic" type="button" aria-label="Say the word">${MICSVG}</button>` : ""}</div>
${mic ? '<p class="vymsg" id="vymsg">Type the word, or tap the microphone and say it.</p>' : ""}<button class="listen" id="vycheck">Check${GOSVG}</button><div class="fb" id="vyfb" aria-live="polite"></div>`;
    /* avec le micro, sur téléphone, on n'ouvre pas le clavier d'office : l'enfant choisit */
    if (!(mic && matchMedia("(pointer: coarse)").matches))
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
    vyMicStop();
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
    document.querySelectorAll("#vymic, #vymsg").forEach(x => x.remove());
    document.querySelector("#qwrap .dots").outerHTML = vyDots();
    document.getElementById("vyfb").innerHTML = `<p class="verdict ${ok ? "ok" : "ko"}">${ok ? ["YES!", "PERFECT!", "WELL DONE!"][VY.i % 3] : typo ? `ALMOST! IT'S <b>${esc(t3Ans(it).toUpperCase())}</b>` : `IT'S <b>${esc(t3Ans(it).toUpperCase())}</b>`}</p>
<div class="ex"><button class="snd sm" id="vysay" aria-label="Listen to the sentence">${SPK}</button><div><p class="en">${hl(it.en)}</p><p class="fr">${hl(it.fr)}</p></div></div>
<button class="listen next" id="vynext">${last ? "See my score" : "Next"}${GOSVG}</button>`;
    sayOne(plain(it.en), document.getElementById("vysay"));
    document.getElementById("vynext").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
/* ---------- micro (PO, 21/11) : dire le mot au lieu de le taper, au choix, à chaque question ----------
   Le navigateur propose plusieurs écritures de ce qu'il entend (jusqu'à 5) : on garde celle qui correspond au mot
   attendu, s'il y en a une (« their » / « there », « 7 » / « seven »). Sinon, la première. Le mot entendu s'écrit dans la
   case : l'enfant voit l'orthographe, peut corriger ou recommencer, puis touche Check (rien n'est validé tout seul). */
let VYREC = null, VYMICOFF = false;
const vyMicOk = () => !!MIC_SR && !VYMICOFF;
function vyMicStop() {
    if (VYREC)
        try {
            VYREC.abort();
        }
        catch (e) {
        }
    VYREC = null;
}
function vyHeard(alts, it) {
    const ans = t3Ans(it), cands = alts.map(a => String(a || "").trim().replace(/[.!?]+$/, "")).filter(Boolean).flatMap(micVariants);
    if (cands.some(c => t3Ok(c, it)))
        return { t: ans, ok: true }; /* « the friend », « Friend. » : on écrit le mot attendu, bien orthographié */
    return { t: cands[0] || "", ok: false };
}
function vyListen() {
    if (!document.getElementById("vymic") || VY.res[VY.i] !== undefined)
        return;
    if (VYREC) {
        try {
            VYREC.stop();
        }
        catch (e) {
        }
        return;
    }
    micAsk(vyListenGo);
}
function vyListenGo() {
    const b = document.getElementById("vymic"), msg = document.getElementById("vymsg"), inp = document.getElementById("vyin"), i0 = VY.i, it = VY.items[i0];
    if (!b || VY.res[i0] !== undefined)
        return;
    try {
        stopSpeech();
    }
    catch (e) {
    }
    let r;
    try {
        r = micNew(5, true);
    }
    catch (e) {
        return;
    }
    VYREC = r;
    let heard = "";
    const here = () => VYREC === r && VY.i === i0 && VY.res[i0] === undefined && document.getElementById("vymic") === b;
    b.classList.add("on");
    msg.textContent = "I'm listening… say the word!";
    r.onresult = e => {
        if (!here())
            return;
        const R = Array.from(e.results), alts = R.length === 1 ? Array.from(R[0]).map(a => a.transcript) : [R.map(x => x[0].transcript).join(" ")];
        heard = vyHeard(alts, it).t;
        inp.value = heard;
    };
    r.onerror = e => {
        if (!here())
            return;
        const k = micErr(e);
        if (k === "off") {
            VYMICOFF = true;
            b.remove();
            msg.textContent = "Le micro n'est pas autorisé ici : écris le mot.";
            inp.placeholder = "Type the missing word";
        }
        else
            msg.textContent = k === "none" ? "I didn't hear anything. Try again!" : "Oops, try again!";
    };
    r.onend = () => {
        if (VYREC === r)
            VYREC = null;
        b.classList.remove("on");
        if (VY.i !== i0 || VY.res[i0] !== undefined || VYMICOFF)
            return;
        if (heard) {
            msg.textContent = "Is it right? Tap Check! (or try again)";
            const c = document.getElementById("vycheck");
            if (c)
                c.focus({ preventScroll: true });
        }
        else if (msg.textContent === "I'm listening… say the word!")
            msg.textContent = "I didn't hear anything. Try again!";
    };
    try {
        r.start();
    }
    catch (e) {
        VYREC = null;
        b.classList.remove("on");
    }
}
/* fin de série : une série sans faute est notée (un jour compte une fois) ; 2 jours différents = port certifié */
function vyEnd() {
    const N = VY.items.length, n = VY.res.filter(Boolean).length, P = pct(n, N), perfect = n === N, T = todayKey(), [k, hn] = VY.key.split(":");
    const st = vySt(), G = vyGold(), h = st.h[VY.key] || (st.h[VY.key] = { w: VY.items.map(x => x.key), r: [] });   /* vyGold avant de noter la série */
    const gift = st.gift, had = G.n;
    let coins = 0;
    const was = vyState(k, +hn);
    let out = "fail";
    if (perfect && curProf()) {
        h.r = h.r || [];
        if (was === "storm") {
            h.s = T;
            out = "storm";
            coins = VY_COIN.storm;
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
                coins = vyCoinsCert(daysBetween(h.r[0], T));
            }
            else {
                out = "run1";
                coins = VY_COIN.run1;
            }
        }
        G.n += coins;
        G.tot += coins;
        vySave();
    }
    const giftNow = gift && had < gift.n && G.n >= gift.n;
    const say = { cert: `*${vyHname(k, hn)}* is certified! I plant your flag!`, run1: "*Perfect run!* Come back *tomorrow* for run 2: *3 gold coins*!", sameday: "Perfect again! Run 2 must be on *another day*.", storm: "You beat the *storm*! Your lighthouse stays on!", again: "*Perfect!* This harbour is still yours!", fail: P >= 60 ? `*${n}/${N}*. So close! A run must be *perfect*.` : `*${n}/${N}*. Read the words again and try once more!` }[out];
    XMODE = "vyend";
    document.getElementById("qn").textContent = "";
    QW().innerHTML = `<p class="qpart">${esc(vyLabel(VY.key))} · Results</p><div class="qhead">${headSvg(say, perfect ? "smile" : "head")}</div>
${out === "storm" ? `<div class="vycert"><img class="wide" src="img/voyage-port-soleil.webp" alt="Kai at the harbour in the sun"><b>${esc(vyHname(k, hn))} · ${esc(vyIsl(k).name)}</b><span>Storm beaten: the lighthouse stays on!</span></div>` : ""}
${out === "cert" ? `<div class="vycert"><img src="img/voyage-drapeau.webp" alt="Kai plants his flag on the pier"><b>${esc(vyHname(k, hn))} · ${esc(vyIsl(k).name)}</b><span>Certified · ${vyCount()} harbour${vyCount() === 1 ? "" : "s"} on your voyage</span></div>` : ""}
${coins ? `<div class="vywin">${vyIcon.coin}<b>+${coins}</b><span>${coins === 1 ? "gold coin" : "gold coins"} · ${G.n} in your treasure</span></div>` : ""}
<div class="scores one"><div class="sc${perfect ? " ok" : ""}"><i>${esc(vyIsl(k).name)}</i><b>${P}%</b><small>${n} of ${N} words</small></div></div>
<ul class="recap">${VY.items.map((it, j) => `<li><span class="m ${VY.res[j] ? "ok" : "ko"}">${VY.res[j] ? CHECK : CROSS}</span><b>${esc(t3Ans(it))}</b><i>${esc(it.f)}</i></li>`).join("")}</ul>
<div class="endbtns"><button class="listen" id="vyagain">Try again</button><button class="ghost" id="vyback">${esc(vyHname(k, hn))}</button></div>`;
    if (giftNow)   /* assez de pièces pour le cadeau : c'est l'annonce la plus importante */
        afterSpeech(() => kaiCongrats("Gift unlocked!", `You have <b>${G.n} gold coins</b>: enough for <b>${esc(gift.g)}</b>! Ask a parent.`, "Congrats! You have enough gold coins for your gift!"));
    else if (out === "cert" || out === "storm")   /* la fenêtre « Congrats! » de Kai, une fois qu'il a fini de parler */
        try {
            const c = vyCount(), b = vyBoat(c);
            const stamp = out === "cert" && vyIslDone(k) === 1, great = stamp && vyStamps() === VY_ISL.length;   /* 1er port de l'île : nouveau tampon */
            afterSpeech(() => great ? kaiCongrats("Great voyage!", `Every island of the archipelago has its stamp in your passport!`, "Congrats! You've got the great voyage stamp!")
                : stamp && !(b > vyBoat(c - 1)) ? kaiCongrats("New stamp!", `${esc(vyIsl(k).name)} is in your passport now. ${esc(vyHname(k, hn))} is certified!`, `Congrats! A new stamp for ${vyIsl(k).name}!`)
                : out === "cert" && b > vyBoat(c - 1) ? kaiCongrats(`New boat: a ${VY_BOATS[b].name}!`, `${esc(vyHname(k, hn))} certified: <b>${c}</b> harbours on your voyage. Kai sails on a ${VY_BOATS[b].name} now!`, `Congrats! Kai has a new boat: a ${VY_BOATS[b].name}!`)
                : out === "cert" ? kaiCongrats(`${esc(vyHname(k, hn))} certified!`, `${esc(vyIsl(k).name)}: your flag is planted. <b>${vyWords()}</b> words learnt on your voyage.`, `Congrats! ${vyHname(k, hn)} is certified!`)
                : kaiCongrats("Storm beaten!", `${esc(vyHname(k, hn))} keeps its lighthouse on.`, "Congrats! You beat the storm!"));
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
    if (t.closest("#vygift")) {
        stopSpeech();
        gate("Choose the gift and its price in gold coins.", vyGiftForm);
        return;
    }
    if (t.closest("#vyswap")) {
        stopSpeech();
        vySwap();
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
        return openMenuDay(true);   /* retour au menu par le même chemin que les autres apps : Kai remet sa discussion à jour */
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
    if (t.closest("#vymic")) {
        stop();
        vyListen();
    }
    else if (t.closest("#vycheck")) {
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
        vyMicStop();
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
