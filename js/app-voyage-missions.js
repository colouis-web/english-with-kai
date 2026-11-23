/* Kai's voyage — mission spéciale « Around the world » (PO, 23/11 : « la géographie est un excellent thème, 1 quiz de
   5 questions sur où se trouve un monument célèbre »). Choix du PO : des monuments vérifiés, illustrés par nos dessins de
   ports quand on y voit le monument ; une mission par jour, après le port du jour ; 5/5 = 2 pièces d'or, 4/5 = 1 pièce.
   - Question en anglais (« Where is the Eiffel Tower? »), 4 réponses « ville, pays » ; Kai lit la question et la réponse
     (« The Eiffel Tower is in Paris, in France. ») : l'élève apprend les noms de pays et « It's in… ».
   - 5 questions : 3 avec un dessin, 2 sans ; on évite les 20 derniers monuments vus.
   - Données : p.voy.mis = { d: jour de la dernière mission, n: score, k: nombre de missions, seen: [ids] } ;
     p.voy.day = jour de la dernière série finie (même ratée) : la mission s'ouvre après le port du jour.
   Script classique, chargé après app-voyage.js et data/monuments.js. */
"use strict";
const VM_N = 5, VM_IMG = 3, VM_COINS = n => n === VM_N ? 2 : n === VM_N - 1 ? 1 : 0;
let VM = null;
const vmCap = s => s.charAt(0).toUpperCase() + s.slice(1);
const vmPlace = x => x.city === x.cty ? x.city : `${x.city}, ${x.cty}`;
const vmQ = x => x.q || `Where ${x.pl ? "are" : "is"} ${x.m}?`;
const vmA = x => `${vmCap(x.m)} ${x.pl ? "are" : "is"} in ${x.city}${x.city === x.cty ? "" : `, in ${x.cty}`}.`;
/* « ready » : mission à faire ; « locked » : pas encore de port aujourd'hui ; « done » : faite aujourd'hui */
function vmState() {
    if (!curProf())
        return "noprof";
    const st = vySt(), T = todayKey();
    if ((st.mis || {}).d === T)
        return "done";
    return st.day === T ? "ready" : "locked";
}
function vmCard() {
    const s = vmState(), m = vySt().mis || {};
    const txt = { noprof: "Create your profile first: Kai has a mission for you!",
        locked: "Sail to <b>a harbour</b> first today: then your mission opens!",
        ready: "Where are the world's famous places? <b>5 questions</b>, up to <b>2 gold coins</b>!",
        done: `Mission done today: <b>${m.n}/${VM_N}</b>. A new mission tomorrow!` }[s];
    return `<div class="vymiss${s === "ready" ? " on" : ""}"><img src="img/voyage-missions.webp" alt="Kai and two friends on a rock above a harbour in Brittany"><div><span>${s === "ready" ? vyIcon.flag : s === "done" ? CHECK : vyIcon.lock} Special mission · Around the world</span><p>${txt}</p>${s === "ready" ? `<button class="listen sm" id="vmstart" type="button">Start the mission${GOSVG}</button>` : ""}</div></div>`;
}
/* 5 monuments : 3 avec un dessin, 2 sans, pas parmi les 20 derniers vus (sauf si la banque ne suffit plus) */
function vmPick() {
    const seen = new Set((vySt().mis || {}).seen || []), fresh = L => { const f = L.filter(x => !seen.has(x.id)); return f.length >= VM_N ? f : L; };
    const im = shuffle(fresh(VY_MONU.filter(x => x.img))).slice(0, VM_IMG);
    const tx = shuffle(fresh(VY_MONU.filter(x => !x.img && !im.includes(x)))).slice(0, VM_N - im.length);
    return shuffle(im.concat(tx));
}
/* 3 mauvaises réponses : d'autres pays que la bonne réponse, tous différents */
function vmOpts(x) {
    const out = [vmPlace(x)], ctys = new Set([x.cty]);
    for (const y of shuffle(VY_MONU.slice())) {
        if (out.length === 4)
            break;
        if (!ctys.has(y.cty) && !out.includes(vmPlace(y))) {
            out.push(vmPlace(y));
            ctys.add(y.cty);
        }
    }
    return shuffle(out);
}
function vmStart() {
    if (vmState() !== "ready")
        return;
    VM = { items: vmPick().map(x => ({ x, opts: [] })), i: 0, res: [] };
    VM.items.forEach(it => it.opts = vmOpts(it.x));
    XMODE = "vm";
    DAILY = false;
    document.getElementById("qtitle").textContent = "Special mission";
    renderVm();
    show("quiz");
    scrollTo(0, 0);
}
const vmDots = () => `<div class="dots" aria-hidden="true">${VM.items.map((x, j) => `<i class="${VM.res[j] === undefined ? (j === VM.i ? "cur" : "") : VM.res[j] ? "ok" : "ko"}"></i>`).join("")}</div>`;
function renderVm() {
    const it = VM.items[VM.i], x = it.x;
    document.getElementById("qn").textContent = `${VM.i + 1}/${VM_N}`;
    QW().innerHTML = `<p class="qpart">Around the world · Where is it?</p>${vmDots()}
<div class="qhead">${headSvg(vmQ(x).replace(/^(Where (?:is|are) )(.+)\?$/, "$1*$2*?"), "head")}</div>
${x.img ? `<figure class="vmimg"><img src="img/voyage-lieu-${String(x.img).padStart(2, "0")}.webp" alt="A famous place: where is it?"></figure>` : ""}
<p class="vmfr">${esc(x.fr)}</p>
<div class="opts vmopts" id="vmopts">${it.opts.map((o, k) => `<button class="opt fr" data-vm="${k}">${esc(o)}</button>`).join("")}</div><div class="fb" id="vmfb" aria-live="polite"></div>`;
    sayOne(vmQ(x), document.querySelector("#qwrap .qhead .bb"));
}
function vmAnswer(k) {
    if (VM.res[VM.i] !== undefined)
        return;
    const it = VM.items[VM.i], good = vmPlace(it.x), ok = it.opts[k] === good, last = VM.i === VM_N - 1;
    VM.res[VM.i] = ok;
    document.querySelectorAll("#vmopts .opt").forEach((b, j) => {
        b.disabled = true;
        b.classList.add(it.opts[j] === good ? "right" : j === k ? "wrong" : "dim");
    });
    document.querySelector("#qwrap .dots").outerHTML = vmDots();
    document.getElementById("vmfb").innerHTML = `<p class="verdict ${ok ? "ok" : "ko"}">${ok ? ["YES!", "WELL DONE!", "PERFECT!"][VM.i % 3] : `IT'S <b>${esc(good.toUpperCase())}</b>`}</p>
<div class="ex"><button class="snd sm" id="vmsay" aria-label="Listen">${SPK}</button><div><p class="en">${esc(vmA(it.x))}</p></div></div>
<button class="listen next" id="vmnext">${last ? "See my score" : "Next"}${GOSVG}</button>`;
    sayOne(vmA(it.x), document.getElementById("vmsay"));
    document.getElementById("vmnext").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function vmEnd() {
    const n = VM.res.filter(Boolean).length, coins = VM_COINS(n), T = todayKey(), st = vySt(), G = vyGold(), gift = st.gift, had = G.n;
    if (curProf()) {
        const m = st.mis || {};
        st.mis = { d: T, n, k: (m.k || 0) + 1, seen: VM.items.map(it => it.x.id).concat(m.seen || []).slice(0, 20) };
        G.n += coins;
        G.tot += coins;
        vySave();
    }
    const say = n === VM_N ? "*Perfect mission!* You know the world!" : n === VM_N - 1 ? `*${n}/${VM_N}*. Great mission!` : `*${n}/${VM_N}*. Every mission teaches you new places!`;
    XMODE = "vmend";
    document.getElementById("qn").textContent = "";
    QW().innerHTML = `<p class="qpart">Around the world · Results</p><div class="qhead">${headSvg(say, n >= VM_N - 1 ? "smile" : "head")}</div>
${coins ? `<div class="vywin">${vyIcon.coin}<b>+${coins}</b><span>${coins === 1 ? "gold coin" : "gold coins"} · ${G.n} in your treasure</span></div>` : ""}
<div class="scores one"><div class="sc${n === VM_N ? " ok" : ""}"><i>Around the world</i><b>${n}/${VM_N}</b><small>famous places</small></div></div>
<ul class="recap">${VM.items.map((it, j) => `<li><span class="m ${VM.res[j] ? "ok" : "ko"}">${VM.res[j] ? CHECK : CROSS}</span><b>${esc(vmCap(it.x.m))}</b><i>${esc(vmPlace(it.x))}</i></li>`).join("")}</ul>
<div class="endbtns"><button class="listen" id="vmback">Back to my voyage</button></div>`;
    if (gift && had < gift.n && G.n >= gift.n)
        afterSpeech(() => kaiCongrats("Gift unlocked!", `You have <b>${G.n} gold coins</b>: enough for <b>${esc(gift.g)}</b>! Ask a parent.`, "Congrats! You have enough gold coins for your gift!"));
    sayOne(plain(say), document.querySelector("#qwrap .qhead .bb"));
}
document.getElementById("voyage").addEventListener("click", e => {
    if (e.target.closest && e.target.closest("#vmstart")) {
        stopSpeech();
        vmStart();
    }
});
/* clics de la mission (capture : avant les gestionnaires de la page du quiz) */
document.addEventListener("click", e => {
    if (!XMODE || !/^vm/.test(XMODE) || !e.target.closest || !e.target.closest("#quiz"))
        return;
    const t = e.target, stop = () => {
        e.stopPropagation();
        e.preventDefault();
    };
    const o = t.closest("[data-vm]");
    if (o) {
        stop();
        stopSpeech();
        vmAnswer(+o.dataset.vm);
    }
    else if (t.closest("#vmnext")) {
        stop();
        stopSpeech();
        if (VM.i < VM_N - 1) {
            VM.i++;
            renderVm();
            scrollTo({ top: 0, behavior: "smooth" });
        }
        else
            vmEnd();
    }
    else if (t.closest("#vmsay")) {
        stop();
        sayOne(vmA(VM.items[VM.i].x), t.closest("button"));
    }
    else if (t.closest("#vmback") || t.closest("#backQ")) {
        stop();
        stopSpeech();
        XMODE = null;
        VYV = { i: null, h: null };
        renderVoyage();
        show("voyage", true);
    }
}, true);
