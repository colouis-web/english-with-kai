/* Code — tranche de l'ancien index.html (lignes 1583–1649). Script classique : l'ordre des <script> compte. */
"use strict";
/* ===== PROFILS : prénom au démarrage, accueil personnalisé, changement d'élève, réglages de la voix ===== */
const BACKSVG = '<svg viewBox="0 0 24 24"><path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const initial = n => (n || "?").trim().charAt(0).toUpperCase() || "?";
function menuRows(name) {
    return name ? [["WELCOME"], [[name.toUpperCase()], "!"], ["LET'S LEARN ENGLISH"], ["TOGETHER!"]] : [["WHAT DO YOU"], ["WANT TO LEARN"], [["TODAY"], "?"]];
}
function renderMenuHead() {
    const p = curProf(), say = p ? `Welcome ${p.name}! Let's learn English together!` : "What do you want to learn today?", rows = menuRows(p ? p.name : "");
    ASK.say = say;
    const c = [216, 80], r = [114, 60], tip = [100, 80], n = rows.length, lh = 19;
    document.getElementById("mhead").innerHTML = `<svg viewBox="0 0 360 164" role="img" aria-label="Kai : ${esc(say)}"><image class="kai kb" id="bust" href="img/kai-bust.webp" x="10" y="6" width="101" height="150"/>
<g class="bb b1 kb" id="askb" role="button" tabindex="0" aria-label="${esc(say)}"><path d="${bubblePath(c, r, tip)}" fill="#fff" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><text text-anchor="middle">${rows.map((row, j) => `<tspan x="${c[0]}" y="${f1(c[1] - (n - 1) * lh / 2 + 6 + j * lh)}">${rowSvg(row.map(x => Array.isArray(x) ? [esc(x[0])] : esc(x)))}</tspan>`).join("")}</text></g></svg>`;
    const me = document.getElementById("meIni");
    if (me)
        me.textContent = p ? initial(p.name) : "?";
}
document.getElementById("mhead").addEventListener("click", e => {
    if (e.target.closest(".kb"))
        sayOne(ASK.say, document.getElementById("askb"));
});
document.getElementById("mhead").addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === " ") && e.target.closest("#askb")) {
        e.preventDefault();
        sayOne(ASK.say, document.getElementById("askb"));
    }
});
function welcome() {
    show("menu");
    setTimeout(() => sayOne(ASK.say, document.getElementById("askb")), 450);
}
/* au démarrage : prénom (première fois), choix de l'élève (plusieurs profils), sinon le menu */
function startApp() {
    if (!PROFS.list.length) {
        openHello(false);
        return;
    }
    if (!curProf() || (!PICKED && PROFS.list.length > 1)) {
        openWho();
        return;
    }
    PICKED = true;
    show("menu");
}
let HELLO_FROM = "home";
function openHello(fromWho) {
    HELLO_FROM = fromWho ? "who" : "home";
    document.getElementById("hellohead").innerHTML = headSvg(PROFS.list.length ? "Hi! What's your *name*?" : "Hi! I'm Kai. What's your *name*?", "smile");
    const i = document.getElementById("pname");
    i.value = "";
    HLV = 0;
    document.getElementById("hlvpick").innerHTML = lvPicker(HLV, "hlv");
    document.getElementById("nmsg").textContent = "";
    show("hello");
    setTimeout(() => {
        try {
            i.focus();
        }
        catch (e) {
        }
    }, 400);
    sayOne(PROFS.list.length ? "Hi! What's your name?" : "Hi! I'm Kai. What's your name?", document.querySelector("#hellohead .bb"));
}
document.getElementById("nameform").addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("pname").value.replace(/\s+/g, " ").trim().slice(0, 16);
    if (!name) {
        document.getElementById("nmsg").textContent = "Type your first name, then tap Let's go!";
        document.getElementById("pname").focus();
        return;
    }
    const same = PROFS.list.find(p => p.name.toLowerCase() === name.toLowerCase());
    const p = same || addProfile(name, HLV);
    useProfile(p.id);
    welcome();
});
document.getElementById("backH").addEventListener("click", () => HELLO_FROM === "who" ? openWho() : show("home", true));
function profStats(p) {
    const days = p.id === PROFS.cur ? DST.days : loadDays(p.id), st = Object.values(days).reduce((s, r) => s + starsOf(r), 0), R = rankOf(st);
    return `${LV[lvOf(p)].name} · ${R.name} · ${st} star${st === 1 ? "" : "s"}`;
}
let HLV = 0;
const lvPicker = (sel, attr) => LV.map((l, i) => `<button type="button" class="lvopt${i === sel ? " on" : ""}" data-${attr}="${i}" role="radio" aria-checked="${i === sel}"><b>${l.name}</b><small>${l.fr} · ${l.cefr} · ${l.words} words a day</small></button>`).join("");
document.getElementById("hlvpick").addEventListener("click", e => {
    const b = e.target.closest("[data-hlv]");
    if (!b)
        return;
    HLV = +b.dataset.hlv;
    document.getElementById("hlvpick").innerHTML = lvPicker(HLV, "hlv");
});
function renderWho() {
    const l = document.getElementById("plist");
    if (!l)
        return;
    l.innerHTML = PROFS.list.map(p => `<button class="prow${p.id === PROFS.cur ? " cur" : ""}" data-pid="${esc(p.id)}"><span class="ava">${esc(initial(p.name))}</span><span class="pt"><b>${esc(p.name)}</b><small>${profStats(p)}</small></span>${GOSVG}</button>`).join("") + `<button class="prow add" id="padd"><span class="ava">+</span><span class="pt"><b>New learner</b><small>Add someone from your family</small></span></button>`;
}
function openWho() {
    document.getElementById("whohead").innerHTML = headSvg("Who's *learning* today?", "smile");
    renderWho();
    show("who");
    sayOne("Who's learning today?", document.querySelector("#whohead .bb"));
}
document.getElementById("plist").addEventListener("click", e => {
    if (e.target.closest("#padd")) {
        openHello(true);
        return;
    }
    const b = e.target.closest("[data-pid]");
    if (b) {
        useProfile(b.dataset.pid);
        welcome();
    }
});
document.getElementById("backWho").addEventListener("click", () => show("home", true));
/* réglages : élève + voix de Kai */
let RENAME = false, DELC = false;
const TRY = "Hello! I'm Kai. Let's learn English together!";
function renderMe() {
    const p = curProf(), vs = enVoices().slice(0, 8), auto = enVoices()[0];
    document.getElementById("mebody").innerHTML = `<div class="dsec"><h2>Learner</h2></div>
<div class="mecard"><span class="ava big">${esc(initial(p ? p.name : "?"))}</span>${RENAME ? `<form id="renform" class="renform"><input id="rname" maxlength="16" value="${esc(p ? p.name : "")}" aria-label="New first name" autocomplete="off"><button class="listen sm" type="submit">Save</button></form>` : `<div class="pt"><b>${esc(p ? p.name : "")}</b><small>${p ? profStats(p) : ""}</small></div><button class="ghost sm" id="meRen">Rename</button>`}</div>
<div class="mebtns"><button class="ghost sm" id="meSwitch">Switch learner</button><button class="ghost sm" id="meNew">New learner</button></div>
<p class="menote">Each learner has their own goals, stars and calendar.</p>
<div class="dsec"><h2>English level</h2></div>
<div class="lvpick">${lvPicker(lvOf(p), "mlv")}</div>
<p class="menote">Kai moves you up a level when you are ready (see My daily work › My level). A parent can also change it here.</p>
<div class="dsec"><h2>Kai's voice</h2></div>
<div class="seg" role="radiogroup" aria-label="Kai's real voice">${[[1, "Kai's real voice"], [0, "Phone voice"]].map(([v, l]) => `<button class="${(KREC ? 1 : 0) === v ? "on" : ""}" data-krec="${v}" role="radio" aria-checked="${(KREC ? 1 : 0) === v}">${l}</button>`).join("")}</div>
<p class="menote">${KREC ? `Kai's real voice says all his own sentences and ${KVN - 51} words. Example sentences and the other words use the phone voice below. Kai's voice was recorded with ElevenLabs.` : `Kai uses the phone voice for everything.`}</p>
<div class="dsec"><h2>Phone voice</h2></div>
${vs.length ? `<div class="vlist2">${[["", `Automatic${auto ? ` · ${auto.name}` : ""}`], ...vs.map(v => [v.voiceURI || v.name, `${v.name} · ${v.lang.replace("_", "-")}`])].map(([id, l]) => `<div class="vrow${VPREF === id ? " on" : ""}"><button class="vpick" data-v="${esc(id)}" role="radio" aria-checked="${VPREF === id}"><i></i><span>${esc(l)}</span></button><button class="vtry" data-try="${esc(id)}" aria-label="Try this voice">${SPK}</button></div>`).join("")}</div>` : `<p class="menote">No English voice found on this device yet.</p>`}
<div class="dsec"><h2>Speed</h2></div>
<div class="seg" role="radiogroup" aria-label="Speech speed">${[[.8, "Slow"], [.95, "Normal"]].map(([r, l]) => `<button class="${Math.abs(VRATE - r) < .01 ? "on" : ""}" data-rate="${r}" role="radio" aria-checked="${Math.abs(VRATE - r) < .01}">${l}</button>`).join("")}</div>
<p class="menote">The voices come from this phone or computer. For a more natural voice on iPhone or iPad, download an English voice marked “Enhanced” or “Premium” in Settings › Accessibility › Spoken Content › Voices.</p>
<div class="dsec"><h2>Delete</h2></div>
${DELC ? `<div class="delbox"><p>Delete <b>${esc(p ? p.name : "")}</b> and all their progress (goals, stars, calendar, lessons)? This cannot be undone.</p><div class="mebtns"><button class="listen sm danger" id="meDelYes">Yes, delete</button><button class="ghost sm" id="meDelNo">Cancel</button></div></div>` : `<button class="ghost sm danger" id="meDel">Delete this learner</button>`}`;
}
function openMe() {
    RENAME = false;
    DELC = false;
    renderMe();
    show("me");
}
document.getElementById("toMe").addEventListener("click", openMe);
document.getElementById("backMe").addEventListener("click", () => show("menu", true));
document.getElementById("mebody").addEventListener("click", e => {
    const t = e.target;
    if (t.closest("#meRen")) {
        RENAME = true;
        renderMe();
        setTimeout(() => {
            const i = document.getElementById("rname");
            if (i) {
                i.focus();
                i.select();
            }
        }, 50);
        return;
    }
    if (t.closest("#meSwitch")) {
        openWho();
        return;
    }
    const ml = t.closest("[data-mlv]");
    if (ml) {
        const p = curProf();
        setLevel(p, +ml.dataset.mlv);
        renderMe();
        updateDailyTile();
        toast(`${LV[lvOf(p)].name}: ${LV[lvOf(p)].words} words a day`, 2000);
        return;
    }
    if (t.closest("#meDel")) {
        DELC = true;
        renderMe();
        const b = document.getElementById("meDelNo");
        if (b)
            b.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }
    if (t.closest("#meDelNo")) {
        DELC = false;
        renderMe();
        return;
    }
    if (t.closest("#meDelYes")) {
        const p = curProf();
        if (!p)
            return;
        const n = p.name;
        deleteProfile(p.id);
        DELC = false;
        toast(`${n} deleted`, 2000);
        if (PROFS.list.length)
            openWho();
        else
            openHello(false);
        return;
    }
    if (t.closest("#meNew")) {
        openHello(true);
        return;
    }
    const kr = t.closest("[data-krec]");
    if (kr) {
        KREC = kr.dataset.krec === "1";
        try {
            localStorage.setItem("kai.rec", KREC ? "1" : "0");
        }
        catch (e) {
        }
        renderMe();
        if (KREC)
            kvPreload();
        ttsSpeak(KREC ? "Hello, my name is Kai!" : TRY, null);
        return;
    }
    const vp = t.closest("[data-v]");
    if (vp) {
        VPREF = vp.dataset.v;
        try {
            localStorage.setItem("kai.voice", VPREF);
        }
        catch (e) {
        }
        VOSKIP = false;
        pickVoice();
        renderMe();
        ttsSpeak(TRY, null);
        return;
    }
    const vt = t.closest("[data-try]");
    if (vt) {
        const all = enVoices(), v = vt.dataset.try ? all.find(x => (x.voiceURI || x.name) === vt.dataset.try) : all[0];
        VOSKIP = false;
        ttsSpeak(TRY, vt, null, v || VO);
        return;
    }
    const rt = t.closest("[data-rate]");
    if (rt) {
        VRATE = +rt.dataset.rate;
        try {
            localStorage.setItem("kai.rate", VRATE);
        }
        catch (e) {
        }
        renderMe();
        ttsSpeak("This is my speed now.", null);
    }
});
document.getElementById("mebody").addEventListener("submit", e => {
    e.preventDefault();
    const p = curProf(), n = (document.getElementById("rname").value || "").replace(/\s+/g, " ").trim().slice(0, 16);
    // Un autre élève porte déjà ce prénom (sans tenir compte de la casse) : on garde le formulaire ouvert
    if (p && n && PROFS.list.some(x => x !== p && x.name.toLowerCase() === n.toLowerCase())) {
        toast("This name is already used", 2200);
        return;
    }
    if (p && n) {
        p.name = n;
        p.u = Date.now();
        pSave();
        pPush(p);
        renderMenuHead();
    }
    RENAME = false;
    renderMe();
});
