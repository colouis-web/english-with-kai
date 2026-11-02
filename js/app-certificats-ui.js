/* Écrans des certificats de vocabulaire (Ouss, sprint Kai 2 B). Script classique, à charger APRÈS js/app-certificats.js (le moteur de Ludo).

   Ce fichier ne contient AUCUNE règle de réussite : il affiche, il enregistre la réponse de l'élève, il appelle le moteur.
     - tuile « Certificates » du menu (pastille quand un certificat est à renouveler, résumé) ;
     - page Certificates (rappel de Kai à J-7, badges datés, « Take a certificate », reprise d'une épreuve) ;
     - écran d'épreuve : choix du son, 6 formats écrits (+ dictée si son = oui), un essai, pas d'indice, pas de micro ;
     - résultat, puis rattrapage (« Fix your mistakes ») qui ne change pas la note ;
     - page imprimable pour les parents (@media print dans css/app.css, rien n'est envoyé).

   Exposé aux autres scripts :
     certBadgesHtml(pid?)   HTML des badges datés (onglet Rewards de My daily work, Ludo)
     openCertificates(from) ouvre la page Certificates ("menu" par défaut, "daily" : le retour ramène à My daily work)
     updateCertTile()       rafraîchit la tuile du menu (appelée toute seule quand le menu s'affiche)
     CertUI                 { start(theme, kind), resume(), grade(q, typed) } pour les tests

   Contrat avec le moteur (js/app-certificats.js, conception de Matt §10) : tout est dans Cert, rien n'est recalculé ici.
     Cert.pickExam(pid, theme, { sound }) → questions [{ key, fmt, … }]
     Cert.pickRenewal(pid, theme, { n, formats }) → questions de renouvellement (existe)
     Cert.check(question, tapé) → { ok, typo, grammar, note }
     Cert.canRetry(pid, theme) → true / false / { ok, on }
     Cert.record(pid, theme, { kind, items: [{ key, fmt, ok }] }) → { ok, pass, cert, … } (existe)
   Stockage (hors du fichier des certificats) : kai.certsound.<id> (choix du son), kai.csave.<id> (épreuve en cours : reprise). */
"use strict";
(function () {
    if (typeof Cert !== "object" || !Cert)
        return;
    const $ = id => document.getElementById(id);
    const FMT = {
        "type-fr-en": { label: "Translate", ask: "How do you say this in English?", fr: "Comment dit-on ça en anglais ?" },
        picture: { label: "What is it?", ask: "What is it?", fr: "Qu'est-ce que c'est ?" },
        gap: { label: "Complete", ask: "Complete the sentence.", fr: "Complète la phrase." },
        order: { label: "Put in order", ask: "Put the words in order.", fr: "Remets les mots dans l'ordre." },
        fix: { label: "Fix the mistake", ask: "There is one mistake. Tap it!", fr: "Il y a une seule erreur. Touche-la !" },
        dictation: { label: "Listen and write", ask: "Listen and write the word.", fr: "Écoute et écris le mot." }
    };
    const CHECK_SVG = typeof CHECK === "string" ? CHECK : "", CROSS_SVG = typeof CROSS === "string" ? CROSS : "";
    const GO = typeof GOSVG === "string" ? GOSVG : "";
    /* ---------- petits outils ---------- */
    const pid = () => (typeof PROFS !== "undefined" && PROFS.cur) || null;
    const prof = () => (typeof curProf === "function" ? curProf() : null);
    const level = () => (typeof lvOf === "function" ? lvOf(prof()) : 0);
    const young = () => level() <= 1; /* 6e : consigne et phrases françaises en petit (Q8) */
    const today = () => (typeof todayKey === "function" ? todayKey() : new Date().toISOString().slice(0, 10));
    const dateOf = k => { const [y, m, d] = String(k).split("-").map(Number); return new Date(y, m - 1, d); };
    const fmtDate = (k, o) => dateOf(k).toLocaleDateString("en-GB", o || { day: "numeric", month: "long", year: "numeric" });
    const fmtShort = k => fmtDate(k, { day: "numeric", month: "short", year: "numeric" });
    const fmtDateFr = k => dateOf(k).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const days = n => `${n} day${n === 1 ? "" : "s"}`;
    const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
    const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
    const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
    const lsDel = k => { try { localStorage.removeItem(k); } catch (e) { } };
    const wordOf = key => { try { return allWords().byKey.get(key) || null; } catch (e) { return null; } };
    /* banque des certificats (js/data/certificats.js, Matt) : titres, périmètres, phrases, images validées */
    const bankCert = th => { try { return (typeof CERTBANK === "object" && CERTBANK.certs.find(c => c.id === th)) || null; } catch (e) { return null; } };
    const bankWord = (th, key) => { const c = bankCert(th); return c ? c.words.find(w => w.k === key) || null : null; };
    const wordsOfTheme = th => {
        const c = bankCert(th);
        if (c) /* le périmètre de la banque (≤ 20 mots) */
            return c.words.map(w => wordOf(w.k)).filter(Boolean);
        try { return Cert.themeWords(th) || []; } catch (e) { return []; }
    };
    const known = () => { try { return wordState(); } catch (e) { return {}; } };
    const shortTitle = t => String(t).split(" · ")[0];
    const CAT_ICON = { colours: "🎨", personality: "😊", looks: "👀", size: "📏", feelings: "😊", weather: "⛅", opinion: "💬", frequency: "🔁", manner: "🏃", place: "📍", time: "⏰", contrast: "↔️", cause: "➡️", adding: "➕" };
    function iconOf(t) {
        if (t && (t.icon || t.em))
            return t.icon || t.em;
        const id = typeof t === "string" ? t : t.id, [kind, cat] = String(id).split(":"), c = String(cat).replace(/-(\d+|plus)$/, "");
        try {
            if (kind === "nouns" && NCAT[c] && NCAT[c].icon)
                return NCAT[c].icon;
        } catch (e) { }
        return CAT_ICON[c] || "📘";
    }
    /* ---------- le moteur : ce qu'on lui demande,  ---------- */
    const GOOD_MIN = (n, kind) => Math.ceil((kind === "renewal" ? 80 : 90) * n / 100 - 1e-9);
    let OFF = { k: "", t: 0, v: [] };
    function offered() {
        const key = pid() + "|" + level();
        if (OFF.k === key && Date.now() - OFF.t < 2500)
            return OFF.v;
        const v = offered0();
        OFF = { k: key, t: Date.now(), v };
        return v;
    }
    function offered0() {
        if (typeof CERTBANK === "object" && CERTBANK.certs) { /* la banque dit ce qui est proposé, à quel niveau, avec quel titre */
            const lv = level();
            /* conception §5.4 : les thèmes d'un autre niveau ne sont pas suggérés, mais restent accessibles (« Show all ») */
            return CERTBANK.certs.map(c => ({ id: c.id, title: c.title, titleFr: c.titleFr, icon: c.icon || iconOf(c.theme), n: c.words.length, sug: !c.suggest || c.suggest.includes(lv) }));
        }
        let T = [];
        try { T = Cert.themes(pid()) || []; } catch (e) { }
        T = T.filter(t => t && !/^verbs:/.test(t.id));
        return T.map(t => ({ id: t.id, title: t.title || t.label || t.id, icon: iconOf(t), n: t.n || wordsOfTheme(t.id).length }));
    }
    function titleOf(th) {
        const bc = bankCert(th);
        if (bc)
            return bc.title;
        const o = offered().find(t => t.id === th);
        if (o)
            return o.title;
        try {
            const T = Cert.themes(pid()) || [], t = T.find(x => x.id === th);
            if (t)
                return t.title || t.label;
            /* repli tant que la banque n'a pas le titre : « nouns:family-1 » → « Family & people 1 » */
            const m = String(th).match(/^([a-z]+):([a-z0-9]+)-(\d+|plus)$/), base = m && T.find(x => x.id === m[1] + ":" + m[2]);
            if (base)
                return `${base.title || base.label}${m[3] === "plus" ? " & more" : " " + m[3]}`;
        } catch (e) { }
        return String(th).split(":")[1] || th;
    }
    function iconFor(th) {
        const bc = bankCert(th);
        if (bc && bc.icon)
            return bc.icon;
        const o = offered().find(t => t.id === th);
        return o ? o.icon : iconOf(th);
    }
    function knownOf(th) {
        const S = known(), W = wordsOfTheme(th), k = W.filter(w => S[w.key] && S[w.key].ok).length;
        return { known: k, n: W.length, ready: W.length > 0 && k >= Math.ceil(.8 * W.length) };
    }
    function canRetry(th) {
        try {
            const r = Cert.canRetry(pid(), th);
            return { ok: r.ok !== false, on: r.on || null };
        } catch (e) { return { ok: true }; }
    }
    function soundGet() { const v = lsGet("kai.certsound." + pid()); return v === "1" ? true : v === "0" ? false : null; }
    function soundSet(on) { lsSet("kai.certsound." + pid(), on ? "1" : "0"); }
    function voiceOk() { try { return typeof speechSynthesis !== "undefined" || (typeof KREC !== "undefined" && KREC); } catch (e) { return false; } }
    /* ---------- les questions : mise en forme stockable (rien d'autre que du texte, de quoi reprendre une épreuve) ---------- */
    const targetOf = en => { const m = String(en || "").match(/\*(.+?)\*/); return m ? m[1].trim() : ""; };
    function sentenceFor(q, e) {
        if (q.s)
            return { en: q.s, fr: q.sfr || q.fr || "" };
        const ex = (e && e.d.ex) || [], i = Number.isInteger(q.ex) && ex[q.ex] ? q.ex : Math.floor(Math.random() * ex.length), x = ex[i] || ["", ""];
        return { en: x[0], fr: x[1], ex: i };
    }
    function tokensOf(sentence) {
        const raw = String(sentence).replace(/\*/g, "").trim().replace(/[.!?]+$/, "").split(/\s+/).filter(Boolean);
        if (raw.length && raw[0] !== "I" && !/^I'/.test(raw[0])) {
            const low = raw[0].toLowerCase();
            let kn = true;
            try { kn = tkKnown(low); } catch (e) { }
            if (kn)
                raw[0] = low;
        }
        return raw;
    }
    function prep(raw, th) {
        const q = Object.assign({}, raw);
        delete q.d; delete q.k; delete q.f; delete q.miss; delete q.weight; delete q.w;
        q.fmt = FMT[q.fmt] ? q.fmt : "type-fr-en";
        const e = wordOf(q.key), banked = !!bankCert(th);
        if (q.fmt === "fix" && !(q.s && q.bad && q.good))
            q.fmt = "gap"; /* pas de phrase écrite à la main pour ce mot : une phrase à compléter */
        if (q.fmt === "picture" && !(q.img || q.tree || (!banked && e && e.d.e)))
            q.fmt = "type-fr-en"; /* sans banque, seul l'émoji du dictionnaire peut servir d'image */
        if (q.fmt === "fix" && !q.sfr)
            q.sfr = q.fr || ""; /* {w, s, bad, good, fr} : fr = phrase française */
        if ((q.fmt === "gap" || q.fmt === "order" || q.fmt === "dictation") && e && !q.s) {
            const sx = sentenceFor(q, e);
            q.s = sx.en;
            q.sfr = sx.fr;
        }
        if (q.fmt === "gap" && !targetOf(q.s))
            q.fmt = "type-fr-en";
        if (q.fmt === "dictation" && !q.s)
            q.fmt = "type-fr-en";
        if (q.fmt === "order") {
            const t = tokensOf(q.s);
            let sh = shuffle(t), n = 0;
            while (t.length > 1 && sh.join(" ") === t.join(" ") && n++ < 20)
                sh = shuffle(t);
            q.tokens = sh;
        }
        return q;
    }
    function buildQuestions(th, kind, sound) {
        const raw = kind === "renewal"
            ? Cert.pickRenewal(pid(), th, { n: 8, formats: ["type-fr-en", "gap", "fix"].concat(sound ? ["dictation"] : []), sound })
            : Cert.pickExam(pid(), th, { sound });
        return (raw || []).filter(q => q && q.key).map(q => prep(q, th));
    }
    /* ---------- correction : le moteur (Cert.check, conception §3) ---------- */
    const N = t => (typeof t3Norm === "function" ? t3Norm(t) : String(t || "").toLowerCase().replace(/[’‘`´]/g, "'").replace(/[.,!?;:"«»]/g, " ").replace(/\s+/g, " ").trim());
    function grade(q, typed, step) {
        let r = null;
        try { r = Cert.check(Object.assign({}, q), typed); } catch (e) { r = null; }
        if (!r || typeof r !== "object")
            r = { ok: false };
        return { ok: !!r.ok, typo: r.typo || "", grammar: r.grammar || "", note: r.note || "" };
    }
    /* ---------- épreuve en cours : sauvegardée à chaque réponse (reprise) ---------- */
    const SAVE = p => "kai.csave." + p;
    const STALE_DAYS = 7;
    let RUN = null, PHASE = "idle", FROM = "menu", ALL = false;
    function runSave() {
        if (RUN)
            lsSet(SAVE(RUN.pid), JSON.stringify(RUN));
    }
    function runLoad(p) {
        try {
            const r = JSON.parse(lsGet(SAVE(p)) || "null");
            if (!r || r.v !== 1 || r.ui !== 1 || r.pid !== p || !Array.isArray(r.qs) || !r.qs.length || !Cert.themes)
                return null;
            if ((Date.now() - (r.t0 || 0)) / 864e5 > STALE_DAYS) { /* non reprise sous 7 jours : abandonnée, sans compter comme un échec */
                lsDel(SAVE(p));
                return null;
            }
            return r;
        } catch (e) { return null; }
    }
    const runClear = p => lsDel(SAVE(p || (RUN && RUN.pid) || pid()));
    /* ---------- composants d'écran ---------- */
    const kaiBubble = (html, face, extra) => `<div class="ckai${extra ? " " + extra : ""}"><img class="kav" src="img/kai-${face || "smile"}.webp" alt=""><div class="cbub">${html}</div></div>`;
    const frSmall = t => `<small lang="fr">${esc(t)}</small>`;
    function soonText(c) {
        if (c.status !== "ok")
            return "Not valid · take it again";
        if (!c.active)
            return `Expired · renew it`;
        if (c.left <= 7)
            return c.left === 1 ? "Ends tomorrow" : `Ends in ${days(c.left)}`;
        return `Valid until ${fmtShort(c.expires)}`;
    }
    const stateOf = c => (c.status !== "ok" ? "off" : !c.active ? "gone" : c.left <= 7 ? "due" : "ok");
    function badge(c) {
        const st = stateOf(c);
        return `<div class="cbadge ${st}"><span class="seal" aria-hidden="true">${iconFor(c.theme)}</span><b>${esc(titleOf(c.theme))}</b><small>${esc(soonText(c))}</small></div>`;
    }
    function scoreLine(c) {
        const p = c.score;
        if (p === null || p === undefined || !c.date)
            return "";
        const n = c.level >= 2 ? 25 : 20, good = Math.round(p * n / 100);
        return `${esc(shortTitle(titleOf(c.theme)))}: ${good}/${n} on ${fmtDate(c.date, { day: "numeric", month: "short" })}`;
    }
    window.certBadgesHtml = function (p) {
        const id = p || pid();
        let L = [];
        try { L = Cert.list(id).filter(c => c.date); } catch (e) { }
        if (!L.length)
            return `<p class="cnone">No certificate yet. Pass a test in the <b>Certificates</b> page to win your first badge!</p>`;
        return `<div class="cgrid">${L.map(badge).join("")}</div><p class="cnote">${L.map(scoreLine).filter(Boolean).join(" · ")}</p>`;
    };
    /* ---------- page Certificates ---------- */
    function dueList() {
        try { return Cert.dueSoon(pid(), 7) || []; } catch (e) { return []; }
    }
    function renewBlock(due) {
        if (!due.length)
            return "";
        const c = due[0], t = shortTitle(titleOf(c.theme)), more = due.length > 1 ? ` (and ${due.length - 1} more)` : "";
        const say = !c.active
            ? `Your <b>${esc(t)}</b> certificate has ended. Renew it: 8 questions, 2 minutes!`
            : `Your <b>${esc(t)}</b> certificate ends ${c.left === 1 ? "tomorrow" : "in " + days(c.left)}. Renew it: 8 questions, 2 minutes!`;
        return `<section class="crenew" aria-label="Certificate to renew">${kaiBubble(`${say}${more ? `<span class="cmore">${esc(more)}</span>` : ""}`, "smile")}
<div class="crow">${due.map(d => `<button class="listen sm" type="button" data-renew="${esc(d.theme)}">Renew ${esc(shortTitle(titleOf(d.theme)))}${GO}</button>`).join("")}</div>${young() ? `<p class="cfr" lang="fr">Renouveler : 8 questions, il faut 7 bonnes réponses.</p>` : ""}</section>`;
    }
    function resumeBlock(r) {
        if (!r)
            return "";
        const fin = r.phase === "done", t = titleOf(r.theme), n = r.qs.length;
        const missed = fin ? r.qs.filter((q, i) => r.res[i] && !r.res[i].ok && !(r.fixed || []).includes(i)).length : 0;
        if (fin && !missed)
            return "";
        return `<section class="cresume"><b>${fin ? "Fix your mistakes" : "Continue your certificate"}</b><span>${esc(t)} · ${fin ? plural(missed, "word") + " to fix" : `question ${Math.min(r.i + 1, n)} / ${n}`}</span>
<button class="listen sm" type="button" data-resume>${fin ? "Open" : "Continue"}${GO}</button></section>`;
    }
    function takeList(L, run) {
        const have = new Set(L.filter(c => c.status === "ok").map(c => c.theme));
        let T = offered().filter(t => !have.has(t.id));
        T = T.map(t => Object.assign({}, t, knownOf(t.id), { retry: canRetry(t.id) }));
        T.sort((a, b) => (b.sug !== false ? 1 : 0) - (a.sug !== false ? 1 : 0) || (b.ready ? 1 : 0) - (a.ready ? 1 : 0) || b.known / Math.max(1, b.n) - a.known / Math.max(1, a.n) || a.title.localeCompare(b.title));
        const sugT = T.filter(t => t.sug !== false), shown = ALL || !sugT.length ? T : sugT.slice(0, 6), size = young() ? 20 : 25;
        if (!T.length)
            return `<p class="cnone">You have a certificate for every theme on this list. Well done!</p>`;
        return `<div class="clist">${shown.map(t => {
            const cur = run && run.theme === t.id && run.phase !== "done";
            return `<button class="citem${t.retry.ok ? "" : " wait"}" type="button" data-take="${esc(t.id)}"${t.retry.ok ? "" : " disabled"}><span class="em" aria-hidden="true">${t.icon}</span><span class="t"><b>${esc(t.title)}</b><small>${t.retry.ok ? `${t.known}/${t.n} words known · ${size} questions · ≈ ${young() ? 7 : 10} min` : "Try again tomorrow"}</small></span>${!t.retry.ok ? '<span class="pill soonp">Tomorrow</span>' : cur ? '<span class="pill ready">Continue</span>' : t.ready ? '<span class="pill ready">Ready</span>' : ""}</button>`;
        }).join("")}</div>${T.length > shown.length ? `<div class="crow"><button class="ghost sm" type="button" data-allthemes>Show all ${T.length} themes</button></div>` : ""}`;
    }
    function renderCerts() {
        const body = $("certsbody"), p = pid();
        if (!p) {
            body.innerHTML = `<p class="cnone">Choose who is learning first (Menu, then the round button).</p>`;
            return;
        }
        let L = [];
        try { L = Cert.list(p); } catch (e) { }
        const mine = L.filter(c => c.status === "ok" && c.date), lapsed = L.filter(c => c.status !== "ok" && c.date);
        const run = runLoad(p), due = dueList();
        const grid = mine.concat(lapsed);
        body.innerHTML = `${resumeBlock(run)}${renewBlock(due)}
<div class="dsec"><h2>My certificates</h2><span>${mine.filter(c => c.active).length}</span></div>
${grid.length ? `<div class="cgrid">${grid.map(badge).join("")}</div><p class="cnote">${grid.map(scoreLine).filter(Boolean).join(" · ")}</p>` : `<p class="cnone">No certificate yet. Take one below: when you pass, you win a dated badge!</p>`}
<div class="dsec"><h2>Take a certificate</h2></div>${takeList(L, run)}
<p class="cnote">No multiple choice: you type the words. One try per question, ${young() ? "18/20" : "23/25"} to pass. Certified words leave your words of the day.</p>
${young() ? `<p class="cfr" lang="fr">Pas de QCM : tu écris les mots. Un seul essai par question, 18 bonnes réponses sur 20 pour réussir. Les mots certifiés ne reviennent plus dans tes mots du jour.</p>` : ""}
<div class="crow"><button class="ghost" type="button" data-parents>🖨 Page for my parents</button></div>${young() ? `<p class="cfr" lang="fr">Une page à imprimer, avec les certificats de l'élève.</p>` : ""}`;
    }
    function openCerts(from) {
        FROM = from === "daily" ? "daily" : "menu";
        ALL = false;
        PHASE = "idle";
        renderCerts();
        show("certs", false);
    }
    window.openCertificates = openCerts;
    function leaveCerts() {
        if (FROM === "daily" && typeof openDaily === "function")
            openDaily(true);
        else
            show("menu", true);
        updateTile();
    }
    $("backCerts").addEventListener("click", leaveCerts);
    $("certsbody").addEventListener("click", e => {
        const t = e.target;
        const rn = t.closest("[data-renew]"), tk = t.closest("[data-take]"), th = rn ? rn.dataset.renew : tk && !tk.disabled ? tk.dataset.take : null;
        if (th) {
            const run = runLoad(pid());
            if (run && run.phase === "q") { /* une épreuve commencée se termine avant d'en commencer une autre (pas de « recommencer ») */
                if (run.theme === th)
                    resume();
                else
                    toast(`Finish your ${shortTitle(titleOf(run.theme))} certificate first`, 2600);
                return;
            }
            openPre(th, rn ? "renewal" : "exam");
            return;
        }
        if (t.closest("[data-resume]")) { resume(); return; }
        if (t.closest("[data-allthemes]")) { ALL = true; renderCerts(); return; }
        if (t.closest("[data-parents]")) { openParents(); return; }
    });
    /* ---------- écran d'épreuve : en-tête, avant l'épreuve ---------- */
    const body = () => $("cexambody");
    function setTop(title, mode) {
        $("cexamtitle").textContent = title;
        const q = $("backExam");
        q.innerHTML = mode === "quit" ? `${BACKSVGX()}<span>Quit</span>` : BACKSVGX();
        q.classList.toggle("cquit", mode === "quit");
        q.setAttribute("aria-label", mode === "quit" ? "Quit: your test is saved" : "Back to certificates");
    }
    const BACKSVGX = () => (typeof BACKSVG === "string" ? BACKSVG : "");
    function sayOn() { return !!(RUN ? RUN.sound : soundGet()); }
    function openPre(th, kind) {
        const p = pid();
        PHASE = "pre";
        RUN = null;
        const last = soundGet(), size = kind === "renewal" ? 8 : young() ? 20 : 25, need = GOOD_MIN(size, kind), min = kind === "renewal" ? 2 : young() ? 7 : 10;
        const title = shortTitle(titleOf(th));
        setTop(title, "back");
        PRE = { th, kind, sound: last === null ? (voiceOk() ? true : false) : last, chosen: last !== null };
        const rules = kind === "renewal"
            ? [`${size} questions`, "one try each", "no hints", `${need} to pass`, `≈ ${min} min`]
            : [`${size} questions`, "one try each", "no hints", `${need} to pass`, `≈ ${min} min`];
        body().innerHTML = `${kaiBubble(kind === "renewal" ? `Let's renew your <b>${esc(title)}</b> certificate!` : `Ready for the <b>${esc(title)}</b> certificate?`, "smile")}
<ul class="crules" aria-label="Rules">${rules.map(r => `<li>${esc(r)}</li>`).join("")}</ul>
${young() ? `<p class="cfr" lang="fr">${size} questions · un seul essai par question · pas d'indice · il faut ${need} bonnes réponses.</p>` : ""}
<div class="dsec"><h2>Sound</h2></div>
<p class="csq">Can you use sound right now?${young() ? ` ${frSmall("Peux-tu utiliser le son maintenant ?")}` : ""}</p>
<div class="csound" role="radiogroup" aria-label="Can you use sound right now?">
<button type="button" role="radio" data-sound="1" aria-checked="${PRE.sound}" class="${PRE.sound ? "on" : ""}"><span aria-hidden="true">🔊</span>Yes, I can listen</button>
<button type="button" role="radio" data-sound="0" aria-checked="${!PRE.sound}" class="${!PRE.sound ? "on" : ""}"><span aria-hidden="true">🔇</span>No, silent mode <small>(bus, train…)</small></button></div>
<p class="menote">${PRE.sound ? "Kai will say some words and you write them." : "Everything is written: no sound at all."}${young() ? ` ${frSmall(PRE.sound ? "Kai dit des mots et tu les écris." : "Tout est écrit : aucun son.")}` : ""}</p>
<button class="listen" id="cstart" type="button">Start${GO}</button>`;
        show("cexam", false);
        void p;
    }
    let PRE = null;
    $("cexambody").addEventListener("click", e => {
        const t = e.target;
        if (PHASE === "pre") {
            const s = t.closest("[data-sound]");
            if (s) {
                PRE.sound = s.dataset.sound === "1";
                body().querySelectorAll("[data-sound]").forEach(b => {
                    const on = b === s;
                    b.classList.toggle("on", on);
                    b.setAttribute("aria-checked", on);
                });
                const n = body().querySelector(".menote");
                n.innerHTML = `${PRE.sound ? "Kai will say some words and you write them." : "Everything is written: no sound at all."}${young() ? ` ${frSmall(PRE.sound ? "Kai dit des mots et tu les écris." : "Tout est écrit : aucun son.")}` : ""}`;
                return;
            }
            if (t.closest("#cstart"))
                begin();
        }
    });
    function begin() {
        const { th, kind, sound } = PRE, p = pid();
        soundSet(sound);
        const qs = buildQuestions(th, kind, sound);
        if (!qs.length) {
            toast("No questions for this theme yet", 2400);
            return;
        }
        RUN = { v: 1, ui: 1, pid: p, theme: th, kind, sound, t0: Date.now(), qs, i: 0, res: [], phase: "q" };
        runSave();
        PHASE = "q";
        setTop(shortTitle(titleOf(th)), "quit");
        renderQ();
    }
    function resume() {
        const r = runLoad(pid());
        if (!r) { renderCerts(); return; }
        RUN = r;
        if (r.phase === "done") {
            setTop(shortTitle(titleOf(r.theme)), "back");
            show("cexam", false);
            renderResult(true);
            return;
        }
        PHASE = "q";
        setTop(shortTitle(titleOf(r.theme)), "quit");
        show("cexam", false);
        renderQ();
    }
    /* ---------- une question ---------- */
    const GAPHTML = en => esc((typeof t3Blank === "function" ? t3Blank(en) : String(en).replace(/\*(.+?)\*/, "_____"))).replace(/_____([.,!?;:]*)/, '<span class="bw"><span class="blank" role="img" aria-label="missing word"></span>$1</span>');
    const ENC = ["Well done, keep going!", "Great, you are doing it!", "Super! Keep it up!", "Nice work, Kai is proud!"];
    let ST = null; /* état de la question à l'écran : { q, step, touched, picked, listens } */
    function progressHtml(i, n) {
        return `<div class="cprog" role="group" aria-label="Question ${i + 1} of ${n}"><span class="cfmt">${esc(FMT[RUN.qs[i].fmt].label)}</span><b>${i + 1} / ${n}</b></div><div class="pbar" aria-hidden="true"><i style="width:${Math.round(100 * i / n)}%"></i></div>`;
    }
    function askLine(q) {
        const f = FMT[q.fmt], e = wordOf(q.key);
        let ask = q.ask || f.ask, fr = f.fr;
        if (q.fmt === "picture" && q.ask && q.askFr)
            fr = q.askFr;
        else if (q.fmt === "picture" && !q.ask && e && e.th === "adjectives:colours") { ask = "What colour is it?"; fr = "Quelle est cette couleur ?"; }
        return `<span class="casks">${esc(ask)}</span>${young() ? frSmall(fr) : ""}`;
    }
    function questionBody(q) {
        const e = wordOf(q.key), fr = young() && q.sfr ? `<p class="t3fr" lang="fr">${hl(q.sfr)}</p>` : "";
        const input = ph => `<input id="cin" class="t3in" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="${ph}" aria-label="Your answer">`;
        const check = `<button class="listen" id="ccheck" type="button" disabled>Check${GO}</button>`;
        switch (q.fmt) {
            case "type-fr-en":
                return `<div class="t3card"><p class="cbig" lang="fr">${esc(q.fr || (e && e.d.fr) || "")}</p></div>${input("Type the English word")}${check}`;
            case "picture": {
                if (q.tree)
                    return `<div class="t3card cpic">${treeHtml(q.tree)}</div>${input("Type the English word")}${check}`;
                const img = q.img || (e && e.d.e) || "❓";
                return `<div class="t3card cpic"><span class="cem" role="img" aria-label="A picture to name">${esc(img)}</span></div>${input("Type the English word")}${check}`;
            }
            case "gap":
                return `<div class="t3card"><p class="t3en">${GAPHTML(q.s)}</p>${fr}</div>${input("Type the missing word")}${check}`;
            case "order":
                return `<div class="t3card">${fr || `<p class="t3fr">Put the words in the right order.</p>`}</div>
<div class="cans" id="cans" aria-label="Your sentence" aria-live="polite"></div>
<div class="cpool" id="cpool">${q.tokens.map((w, j) => `<button type="button" class="ctile" data-tk="${j}">${esc(w)}</button>`).join("")}</div>${check}`;
            case "fix": {
                const toks = q.s.replace(/\*/g, "").split(/\s+/).filter(Boolean);
                return `<div class="t3card"><p class="cfix" id="cfix">${toks.map((w, j) => `<button type="button" class="ctok" data-w="${j}">${esc(w)}</button>`).join(" ")}</p>${fr}</div><div id="cfix2"></div>`;
            }
            case "dictation":
                return `<div class="t3card cdict"><div class="crow"><button class="listen sm" id="csay" type="button">${typeof SPK === "string" ? SPK : ""}Listen again</button><button class="ghost sm" id="cslow" type="button">Slow</button></div><small id="cleft">Kai says it once. You can listen again 2 times.</small></div>${input("Type the English word")}${check}`;
        }
        return "";
    }
    /* arbre généalogique du certificat Family 1 : que des émojis (aucun mot anglais, ce serait un indice), la case de l'élève dit « You », une case porte « ? » */
    function treeHtml(t, plainView) {
        const bc = bankCert(t.cert), T = bc && bc.tree;
        if (!T)
            return "";
        const cols = 1 + Math.max(...T.nodes.map(n => n.col)), rows = 1 + Math.max(...T.nodes.map(n => n.row)), by = Object.fromEntries(T.nodes.map(n => [n.id, n]));
        const ctr = n => [n.col + .5, n.row + .5], mark = t.box === "grandparents" ? ["grandpa", "grandma"] : [t.box];
        const lines = T.couples.map(([a, b]) => { const A = ctr(by[a]), B = ctr(by[b]); return `<line x1="${A[0] + .28}" y1="${A[1]}" x2="${B[0] - .28}" y2="${B[1]}"/>`; })
            .concat(T.kids.map(([a, b]) => { const A = ctr(by[a]), B = ctr(by[b]); return `<line x1="${A[0]}" y1="${A[1] + .3}" x2="${B[0]}" y2="${B[1] - .3}"/>`; }));
        return `<div class="ctree" role="img" aria-label="A family tree. One person has a question mark." style="aspect-ratio:${cols * 1.1}/${rows}">
<svg viewBox="0 0 ${cols} ${rows}" preserveAspectRatio="none" aria-hidden="true">${lines.join("")}</svg>${T.nodes.map(n => `<span class="cnode${mark.includes(n.id) ? " q" : ""}${n.you ? " you" : ""}" style="left:${100 * n.col / cols}%;top:${100 * n.row / rows}%;width:${100 / cols}%;height:${100 / rows}%"><i>${mark.includes(n.id) ? "?" : esc(n.e)}</i>${n.you ? "<b>You</b>" : ""}</span>`).join("")}</div>`;
    }
    function renderQ() {
        const R = RUN, n = R.qs.length;
        if (R.i >= n) { finish(); return; }
        const q = R.qs[R.i];
        ST = { q, step: 1, touched: null, picked: [], listens: 0 };
        const enc = R.i > 0 && R.i % 5 === 0 ? `<span class="cenc">${ENC[(R.i / 5 - 1) % ENC.length]}</span> ` : "";
        body().innerHTML = `${progressHtml(R.i, n)}
${kaiBubble(`${enc}${askLine(q)}`, "head", "cask")}
<div class="cq" id="cq">${questionBody(q)}</div>
<div class="cfb" id="cfb" aria-live="polite"></div>`;
        scrollTo(0, 0);
        if (q.fmt === "order")
            renderOrder(q);
        const inp = $("cin");
        if (inp) {
            inp.addEventListener("input", () => { const b = $("ccheck"); if (b) b.disabled = !inp.value.trim(); });
            inp.addEventListener("keydown", ev => { if (ev.key === "Enter") { ev.preventDefault(); const b = $("ccheck"); if (b && !b.disabled) b.click(); } });
            setTimeout(() => { if (PHASE === "q" && $("cin") === inp) try { inp.focus({ preventScroll: true }); } catch (er) { } }, 250);
        }
        if (q.fmt === "dictation")
            setTimeout(() => dictate(false), 300);
    }
    function dictate(slow) {
        const q = ST && ST.q;
        if (!q || !R_SOUND())
            return;
        const e = wordOf(q.key), w = e ? e.d.w || e.d.v : "", s = plainText(q.s || ""), btn = $("csay");
        const old = typeof VRATE !== "undefined" ? VRATE : null;
        const done = () => { if (slow && old !== null) try { VRATE = old; } catch (er) { } };
        if (slow && old !== null) try { VRATE = .7; } catch (er) { }
        try {
            ttsSpeak(w, btn, () => ttsSpeak(s, btn, () => ttsSpeak(w, btn, done)));
        } catch (er) { done(); }
    }
    const R_SOUND = () => !!(RUN && RUN.sound);
    const plainText = t => String(t).replace(/\*/g, "");
    function setFeedback(r, q) {
        const fb = $("cfb"), last = RUN.i >= RUN.qs.length;
        let msg = r.ok ? `<p class="verdict ok">${CHECK_SVG}Correct!</p>` : `<p class="verdict ko">${CROSS_SVG}Not this time</p>`;
        if (r.ok && r.typo)
            msg += `<p class="cnote2">Watch the spelling: <b>${esc(r.typo)}</b></p>`;
        if (r.ok && r.note)
            msg += `<p class="cnote2">${esc(r.note)}</p>`;
        fb.innerHTML = `${msg}<button class="listen" id="cnext" type="button">${last ? "See my result" : "Next"}${GO}</button>`;
        const nx = $("cnext");
        nx.focus({ preventScroll: true });
        void q;
    }
    function lockQ() {
        const inp = $("cin"), ck = $("ccheck");
        if (inp) inp.readOnly = true;
        if (ck) ck.hidden = true;
        document.querySelectorAll("#cq .ctile,#cq .ctok").forEach(b => (b.disabled = true));
    }
    /* la réponse est enregistrée AVANT d'afficher le verdict : un seul essai, même si l'on quitte juste après */
    function answered(res, typed) {
        const R = RUN, q = ST.q;
        R.res[R.i] = { ok: res.ok, typo: res.typo ? 1 : 0, typed: String(typed || "").slice(0, 80), grammar: res.grammar || "" };
        R.i++;
        runSave();
        const inp = $("cin");
        if (inp) inp.classList.add(res.ok ? "right" : "wrong");
        lockQ();
        const faceEl = document.querySelector("#cexambody .kav");
        if (faceEl)
            faceEl.src = `img/kai-${res.ok ? "smile" : "head"}.webp`;
        setFeedback(res, q);
    }
    body().addEventListener("click", e => {
        if (PHASE !== "q" || !ST)
            return;
        const t = e.target, q = ST.q;
        if (t.closest("#cnext")) { RUN.i >= RUN.qs.length ? finish() : renderQ(); return; }
        if (RUN.res[RUN.i - 1] && ST.q === RUN.qs[RUN.i - 1] && $("cnext"))
            return; /* déjà répondu */
        if (t.closest("#ccheck")) {
            if (q.fmt === "fix") {
                const v = $("cin").value;
                const r = grade(q, v, 2);
                answered(r, `${ST.touched}→${v}`);
                return;
            }
            const v = q.fmt === "order" ? ST.picked.map(j => q.tokens[j]).join(" ") : $("cin").value;
            answered(grade(q, v, 1), v);
            return;
        }
        const tk = t.closest("[data-tk]");
        if (tk && q.fmt === "order") {
            const j = +tk.dataset.tk, at = ST.picked.indexOf(j);
            if (at >= 0) ST.picked.splice(at, 1);
            else ST.picked.push(j);
            renderOrder(q);
            return;
        }
        const w = t.closest("[data-w]");
        if (w && q.fmt === "fix" && ST.step === 1)
            fixTouch(q, +w.dataset.w, w);
        if (t.closest("#csay") && q.fmt === "dictation" && ST.listens < 2) {
            ST.listens++;
            dictate(false);
            $("cleft").textContent = ST.listens >= 2 ? "No more listening for this word." : "You can listen 1 more time.";
            if (ST.listens >= 2) { $("csay").disabled = true; $("cslow").disabled = true; }
            return;
        }
        if (t.closest("#cslow") && q.fmt === "dictation" && ST.listens < 2) {
            ST.listens++;
            dictate(true);
            $("cleft").textContent = ST.listens >= 2 ? "No more listening for this word." : "You can listen 1 more time.";
            if (ST.listens >= 2) { $("csay").disabled = true; $("cslow").disabled = true; }
        }
    });
    function renderOrder(q) {
        const ans = $("cans"), pool = $("cpool");
        ans.innerHTML = ST.picked.map(j => `<button type="button" class="ctile in" data-tk="${j}">${esc(q.tokens[j])}</button>`).join("") || `<span class="cph">Tap the words below</span>`;
        pool.querySelectorAll(".ctile").forEach(b => { b.hidden = ST.picked.includes(+b.dataset.tk); });
        const ck = $("ccheck");
        ck.disabled = ST.picked.length !== q.tokens.length;
    }
    function fixTouch(q, j, btn) {
        const toks = q.s.replace(/\*/g, "").split(/\s+/).filter(Boolean), word = toks[j].replace(/[.,!?;:]+$/, "");
        ST.step = 2;
        ST.touched = word;
        if (N(word) !== N(q.bad)) {
            answered({ ok: false }, `${word}`);
            btn.classList.add("bad");
            return;
        }
        btn.classList.add("pick");
        document.querySelectorAll("#cfix .ctok").forEach(b => (b.disabled = true));
        $("cfix2").innerHTML = `<p class="qask">You found it! Now type the right word.${young() ? ` ${frSmall("Bravo ! Écris maintenant le bon mot.")}` : ""}</p>
<input id="cin" class="t3in" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="Type the right word" aria-label="The right word">
<button class="listen" id="ccheck" type="button" disabled>Check${GO}</button>`;
        const inp = $("cin");
        inp.addEventListener("input", () => { $("ccheck").disabled = !inp.value.trim(); });
        inp.addEventListener("keydown", ev => { if (ev.key === "Enter") { ev.preventDefault(); const b = $("ccheck"); if (!b.disabled) b.click(); } });
        setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (er) { } }, 50);
    }
    /* ---------- fin : enregistrement dans le moteur, puis résultat ---------- */
    function finish() {
        const R = RUN;
        if (!R.rec) {
            const items = R.qs.map((q, i) => ({ key: q.key, fmt: q.fmt, ok: !!(R.res[i] && R.res[i].ok) }));
            let out = null;
            try { out = Cert.record(R.pid, R.theme, { kind: R.kind, items }); } catch (e) { out = null; }
            const n = items.length, good = items.filter(x => x.ok).length;
            const by = {};
            items.forEach(x => { const b = by[x.fmt] || (by[x.fmt] = { n: 0, good: 0 }); b.n++; if (x.ok) b.good++; });
            R.rec = { ok: !!(out && out.ok), pass: !!(out && out.pass), n, good, by, need: GOOD_MIN(n, R.kind), expires: out && out.cert ? out.cert.expires : null, date: out && out.cert ? out.cert.date : today(), keep: !!(out && out.cert && out.cert.active), stars: out && typeof out.stars === "number" ? out.stars : null, error: out && out.error || (out ? "" : "engine") };
            R.phase = "done";
            R.fixed = [];
            runSave();
            if (R.rec.pass) cConfetti();
        }
        PHASE = "res";
        setTop(shortTitle(titleOf(R.theme)), "back");
        renderResult(false);
    }
    function cConfetti() {
        document.querySelectorAll(".confetti").forEach(x => x.remove());
        const box = document.createElement("div");
        box.className = "confetti";
        box.setAttribute("aria-hidden", "true");
        const cols = ["#f5b301", "#1f9d55", "#0b7f89", "#e5484d", "#8b5cf6"];
        for (let i = 0; i < 28; i++) {
            const e = document.createElement("i");
            e.style.left = Math.random() * 100 + "%";
            e.style.background = cols[i % cols.length];
            e.style.animationDelay = Math.random() * .6 + "s";
            box.appendChild(e);
        }
        document.body.appendChild(box);
        setTimeout(() => box.remove(), 3600);
    }
    const missedIdx = R => R.qs.map((q, i) => i).filter(i => R.res[i] && !R.res[i].ok && !(R.fixed || []).includes(i));
    function renderResult(again) {
        const R = RUN, rec = R.rec, title = shortTitle(titleOf(R.theme)), ren = R.kind === "renewal";
        PHASE = "res";
        const miss = missedIdx(R), pass = rec.pass;
        const stars = rec.stars !== null ? rec.stars : pass ? (ren ? 5 : 10) : 0;
        const say = pass ? (ren ? `Renewed! Your <b>${esc(title)}</b> badge is ready.` : `Congrats! You are <b>certified</b>!`) : ren ? `So close! ${rec.good}/${rec.n}. Let's fix your mistakes.` : `So close! <b>${rec.good}/${rec.n}</b>. You need ${rec.need}.`;
        const fmts = Object.entries(rec.by).map(([f, b]) => `<li><span>${esc(FMT[f] ? FMT[f].label : f)}</span><b>${b.good}/${b.n}</b></li>`).join("");
        let tail = "";
        if (pass)
            tail = `<div class="cbadge ok big"><span class="seal" aria-hidden="true">${iconFor(R.theme)}</span><b>${esc(titleOf(R.theme))}</b><small>${ren ? "Renewed" : "Certified"} on ${fmtDate(rec.date)}</small><small>Valid until ${fmtDate(rec.expires)}</small></div><p class="cstars">${typeof STAR === "string" ? STAR : ""}+${stars} stars</p>`;
        else if (ren)
            tail = `<p class="cnote2">Your ${esc(title)} certificate is now <b>in review</b>: its words come back in your words of the day. Take the full test to win it back.</p>`;
        else
            tail = `<p class="cnote2"><b>Try again tomorrow.</b> Look at your mistakes now, and your words will come back in your daily work.</p>${rec.keep ? `<p class="cnote2">Your ${esc(title)} certificate is still valid. Nothing is lost!</p>` : ""}`;
        const frLine = young() ? (pass ? `<p class="cfr" lang="fr">Bravo ! Le badge est daté et valable jusqu'au ${fmtDateFr(rec.expires)}.</p>` : ren ? "" : `<p class="cfr" lang="fr">Pas encore : il fallait ${rec.need} bonnes réponses. Tu pourras réessayer demain.</p>`) : "";
        body().innerHTML = `<div class="cres${pass ? " pass" : ""}">${kaiBubble(say, pass ? "joy" : "head")}
<div class="cscore"><b>${rec.good}<i>/${rec.n}</i></b><span>${pass ? "Passed" : "Pass mark"} ${rec.need}/${rec.n}</span></div>
<ul class="cfmts">${fmts}</ul>${tail}${frLine}
<div class="crow">${miss.length ? `<button class="listen" id="cfixgo" type="button">Fix your mistakes · ${miss.length}${GO}</button>` : ""}<button class="${miss.length ? "ghost" : "listen"}" id="cdone" type="button">${miss.length ? "Later" : "Back to certificates"}</button></div>
${miss.length ? `<p class="menote">Fixing your mistakes does not change your score. It helps you remember. ${young() ? frSmall("Corriger tes erreurs ne change pas ta note : ça t'aide à retenir.") : ""}</p>` : ""}</div>`;
        scrollTo(0, 0);
        void again;
    }
    body().addEventListener("click", e => {
        if (PHASE !== "res" && PHASE !== "fix")
            return;
        const t = e.target;
        if (t.closest("#cdone")) { backToCerts(); return; }
        if (t.closest("#cfixgo")) { startFix(); return; }
        if (PHASE === "fix")
            fixClick(t);
    });
    function backToCerts() {
        if (RUN && RUN.phase === "done" && !missedIdx(RUN).length)
            runClear(RUN.pid);
        RUN = null;
        ST = null;
        PHASE = "idle";
        try { stopSpeech(); } catch (e) { }
        renderCerts();
        show("certs", true);
        updateTile();
    }
    /* ---------- rattrapage : la bonne réponse, « Got it », puis on la réécrit. La note ne change pas. ---------- */
    let FX = null; /* { idx, k, step: "see" | "type" | "all" } */
    function answerHtml(q) {
        const e = wordOf(q.key);
        switch (q.fmt) {
            case "gap": {
                const m = String(q.s).split(/\*(.+?)\*/);
                return `${esc(m[0] || "")}<b class="cans-w">${esc(m[1] || "")}</b>${esc(m[2] || "")}`;
            }
            case "order": return `<b class="cans-w">${esc(plainText(q.s))}</b>`;
            case "fix": {
                let hit = false;
                return plainText(q.s).split(/\s+/).filter(Boolean).map(w => {
                    if (!hit && N(w) === N(q.bad)) {
                        hit = true;
                        return `<s>${esc(w)}</s> <b class="cans-w">${esc(q.good)}</b>`;
                    }
                    return esc(w);
                }).join(" ");
            }
            default: return `<b class="cans-w">${esc(e ? e.d.w || e.d.v : "")}</b>`;
        }
    }
    function sayText(q) {
        const e = wordOf(q.key);
        if (q.fmt === "fix")
            return plainText(q.s).replace(q.bad, q.good);
        return q.fmt === "gap" || q.fmt === "order" ? plainText(q.s) : e ? e.d.w || e.d.v || "" : "";
    }
    function startFix() {
        PHASE = "fix";
        const R = RUN, list = missedIdx(R);
        if (!list.length) { fixAll(); return; }
        FX = { idx: list[0], step: "see", tries: 0 };
        setTop(shortTitle(titleOf(R.theme)), "back");
        renderFix();
    }
    function fixPrompt(q) {
        const e = wordOf(q.key), fr = young() && q.sfr ? `<p class="t3fr" lang="fr">${hl(q.sfr)}</p>` : "";
        switch (q.fmt) {
            case "type-fr-en": return `<p class="cbig" lang="fr">${esc(q.fr || (e && e.d.fr) || "")}</p>`;
            case "picture": return q.tree ? treeHtml(q.tree) : `<span class="cem" aria-hidden="true">${esc(q.img || (e && e.d.e) || "")}</span>`;
            case "gap": return `<p class="t3en">${GAPHTML(q.s)}</p>${fr}`;
            case "order": return `${fr || `<p class="t3fr">Put the words in the right order.</p>`}`;
            case "fix": return `<p class="t3en">${esc(q.s.replace(/\*/g, ""))}</p>${fr}`;
            case "dictation": return `<p class="t3fr">${esc(askLineText(q))}</p>${R_SOUND() ? `<button class="snd" id="cfxsay" type="button" aria-label="Listen">${typeof SPK === "string" ? SPK : ""}</button>` : ""}`;
        }
        return "";
    }
    const askLineText = q => FMT[q.fmt].ask;
    function renderFix() {
        const R = RUN, q = R.qs[FX.idx], n = missedIdx(R).length + (R.fixed || []).length, pos = (R.fixed || []).length + 1, res = R.res[FX.idx];
        const seeing = FX.step === "see";
        const why = q.why ? `<p class="cnote2">${esc(q.why)}${young() && q.whyFr ? ` <small lang="fr">${esc(q.whyFr)}</small>` : ""}</p>` : res && res.grammar ? `<p class="cnote2"><b>Careful:</b> ${esc(res.grammar)}</p>` : "";
        const wrote = res && res.typed && q.fmt !== "fix" && q.fmt !== "order" ? `<p class="cnote2">You wrote: <b>${esc(res.typed)}</b></p>` : "";
        body().innerHTML = `<div class="cprog"><span class="cfmt">Fix your mistakes</span><b>${pos} / ${n}</b></div><div class="pbar" aria-hidden="true"><i style="width:${Math.round(100 * (pos - 1) / n)}%"></i></div>
${kaiBubble(seeing ? "Look at the right answer, then write it!" : FX.tries ? "Not yet. Look again and try once more!" : "Now write it from memory!", seeing ? "smile" : "head", "cask")}
<div class="cq"><div class="t3card">${fixPrompt(q)}</div>
${seeing ? `<div class="canswer" aria-live="polite"><span>The answer</span><p>${answerHtml(q)}</p>${wrote}${why}${R.sound && q.fmt !== "dictation" ? `<button class="snd sm" id="cfxsay" type="button" aria-label="Listen">${typeof SPK === "string" ? SPK : ""}</button>` : ""}</div><button class="listen" id="cgot" type="button">Got it${GO}</button>`
            : `<input id="cin" class="t3in" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="${q.fmt === "order" ? "Write the sentence" : "Type the answer"}" aria-label="Your answer"><button class="listen" id="ccheck" type="button" disabled>Check${GO}</button><div class="cfb" id="cfb" aria-live="polite"></div>`}</div>`;
        scrollTo(0, 0);
        if ((seeing || q.fmt === "dictation") && R.sound) {
            try { sayOne(sayText(q), $("cfxsay")); } catch (er) { }
        }
        const inp = $("cin");
        if (inp) {
            inp.addEventListener("input", () => { $("ccheck").disabled = !inp.value.trim(); });
            inp.addEventListener("keydown", ev => { if (ev.key === "Enter") { ev.preventDefault(); const b = $("ccheck"); if (b && !b.disabled) b.click(); } });
            setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (er) { } }, 200);
        }
    }
    function fixClick(t) {
        const R = RUN, q = FX && R.qs[FX.idx];
        if (t.closest("#cfxsay")) {
            try { sayOne(sayText(q), $("cfxsay")); } catch (er) { }
            return;
        }
        if (t.closest("#cgot")) { FX.step = "type"; renderFix(); return; }
        if (t.closest("#cnextfix")) {
            const list = missedIdx(R);
            if (!list.length) { fixAll(); return; }
            FX = { idx: list[0], step: "see", tries: 0 };
            renderFix();
            return;
        }
        if (t.closest("#ccheck")) {
            const v = $("cin").value, q2 = Object.assign({}, q), r = grade(q2, v, 2);
            if (r.ok) {
                R.fixed = (R.fixed || []).concat([FX.idx]);
                runSave();
                $("cin").classList.add("right");
                $("cin").readOnly = true;
                $("ccheck").hidden = true;
                const last = !missedIdx(R).length;
                $("cfb").innerHTML = `<p class="verdict ok">${CHECK_SVG}Correct!</p><button class="listen" id="cnextfix" type="button">${last ? "Finish" : "Next"}${GO}</button>`;
                $("cnextfix").focus({ preventScroll: true });
            }
            else {
                FX.tries++;
                FX.step = "see";
                renderFix();
            }
        }
    }
    function fixAll() {
        const R = RUN, words = [...new Set(R.qs.filter((q, i) => R.res[i] && !R.res[i].ok).map(q => q.key))];
        /* le moteur écrit les mots rattrapés (raté puis corrigé) dans la mémoire des mots, sans toucher à la note */
        try { Cert.catchUp(R.pid, R.theme, words.map(key => ({ key, ok: true }))); } catch (e) { }
        PHASE = "res";
        body().innerHTML = `${kaiBubble("All fixed! You wrote every answer again. <b>Great work!</b>", "joy")}
<div class="cscore"><b>${words.length}<i> word${words.length === 1 ? "" : "s"}</i></b><span>fixed</span></div>
<p class="menote">Your score did not change. These words will come back in your daily work to help you remember them.${young() ? ` ${frSmall("Ta note ne change pas. Ces mots reviendront dans ton travail du jour.")}` : ""}</p>
<div class="crow"><button class="listen" id="cdone" type="button">Back to certificates</button></div>`;
        runClear(R.pid);
        RUN.phase = "closed";
    }
    $("backExam").addEventListener("click", () => {
        if (PHASE === "q") {
            runSave();
            toast("Saved. You can continue your certificate later.", 2400);
        }
        if (PHASE === "q" || PHASE === "pre" || PHASE === "res" || PHASE === "fix" || PHASE === "idle")
            backToCerts();
    });
    /* ---------- page imprimable pour les parents ---------- */
    function parentsHtml() {
        const p = prof(), L = Cert.list(pid()).filter(c => c.date), name = p ? p.name : "", lv = p && typeof LV !== "undefined" ? LV[level()] : null;
        const valid = L.filter(c => c.active).length, now = today();
        const row = c => {
            const st = c.status !== "ok" ? "À repasser" : !c.active ? "Échu" : c.left <= 7 ? `Valable encore ${c.left} j` : "Valable";
            const n = c.level >= 2 ? 25 : 20, sc = c.score === null || c.score === undefined ? "—" : `${Math.round(c.score * n / 100)}/${n}`;
            return `<tr><th scope="row" lang="en">${esc(titleOf(c.theme))}</th><td data-l="Réussi le">${fmtDateFr(c.date)}</td><td data-l="Note">${sc}</td><td data-l="Valable jusqu'au">${c.expires ? fmtDateFr(c.expires) : "—"}</td><td data-l="État" class="st st-${stateOf(c)}">${st}</td></tr>`;
        };
        return `<article class="psheet" lang="fr">
<header><h2>Learning English with Kai</h2><p class="ptitle">Certificats de vocabulaire</p></header>
<dl class="pwho"><div><dt>Élève</dt><dd>${esc(name)}</dd></div><div><dt>Niveau</dt><dd>${lv ? `${esc(lv.name)} (${lv.cefr})` : "—"}</dd></div><div><dt>Imprimé le</dt><dd>${fmtDateFr(now)}</dd></div></dl>
<p class="psum">${valid ? `${valid} certificat${valid > 1 ? "s" : ""} valable${valid > 1 ? "s" : ""} aujourd'hui.` : "Aucun certificat valable aujourd'hui."}</p>
${L.length ? `<table class="ptab"><thead><tr><th scope="col">Certificat</th><th scope="col">Réussi le</th><th scope="col">Note</th><th scope="col">Valable jusqu'au</th><th scope="col">État</th></tr></thead><tbody>${L.map(row).join("")}</tbody></table>` : `<p class="pnone">Pas encore de certificat. Quand l'élève réussit une épreuve, elle apparaît ici.</p>`}
<footer><p><b>Comment ça marche.</b> Un certificat prouve qu'un thème de vocabulaire est su : épreuve écrite, sans QCM, un seul essai par question, 18 bonnes réponses sur 20 pour réussir. Il est valable 3 mois aux niveaux Beginner et Elementary (6e), 6 mois aux niveaux B1 et B2 ; une semaine avant la fin, Kai propose un renouvellement de 8 questions.</p>
<p>Cette page est préparée sur l'appareil de l'élève et imprimée par le navigateur : rien n'est envoyé nulle part.</p></footer></article>`;
    }
    function openParents() {
        if (!pid())
            return;
        PHASE = "idle";
        $("parentsbody").innerHTML = parentsHtml();
        show("cparents", false);
    }
    $("backParents").addEventListener("click", () => { renderCerts(); show("certs", true); });
    $("cprintbtn").addEventListener("click", () => { try { window.print(); } catch (e) { toast("Printing is not available here", 2400); } });
    /* ---------- tuile du menu ---------- */
    function updateTile() {
        try {
            const tile = $("toCerts"), sum = $("certsum"), pill = $("certpill");
            if (!tile)
                return;
            const p = pid();
            if (!p || typeof Cert.list !== "function") {
                sum.textContent = "Prove what you know";
                pill.hidden = true;
                return;
            }
            const L = Cert.list(p), act = L.filter(c => c.status === "ok"), due = dueList(), parts = [];
            if (act.length)
                parts.push(plural(act.length, "certificate"));
            if (due.length)
                parts.push(`${due.length} to renew`);
            let ready = null;
            if (!due.length || true) {
                const have = new Set(act.map(c => c.theme)), cand = offered().filter(t => !have.has(t.id)).map(t => Object.assign({}, t, knownOf(t.id))).filter(t => t.sug !== false && t.ready && canRetry(t.id).ok);
                cand.sort((a, b) => b.known - a.known);
                ready = cand[0] || null;
            }
            if (ready)
                parts.push(`${shortTitle(ready.title)} is ready`);
            sum.textContent = parts.length ? parts.join(" · ") : "Prove what you know: take a certificate";
            pill.textContent = due.length ? String(due.length) : "";
            pill.hidden = !due.length;
            pill.setAttribute("aria-label", `${due.length} to renew`);
        } catch (e) { }
    }
    window.updateCertTile = updateTile;
    $("toCerts").addEventListener("click", () => openCerts("menu"));
    /* le menu se rafraîchit quand il s'affiche ; une page Certificates ouverte se redessine quand on y revient */
    const show0 = show;
    show = function (id, back) {
        show0(id, back);
        if (id === "menu")
            updateTile();
    };
    /* élève supprimé : son choix de son et son épreuve en cours partent avec lui */
    const drop0 = Cert.drop;
    Cert.drop = function (x) {
        drop0.apply(this, arguments);
        const p = typeof x === "object" && x ? x.id : x;
        if (typeof p === "string") { lsDel("kai.certsound." + p); lsDel(SAVE(p)); }
    };
    if (typeof renderMenuHead === "function") {
        const rm0 = renderMenuHead;
        renderMenuHead = function () { const r = rm0.apply(this, arguments); updateTile(); return r; };
    }
    updateTile();
    window.CertUI = { start: openPre, resume, grade, offered, _run: () => RUN };
})();
