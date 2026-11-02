/* Moteur des certificats de vocabulaire (Ludo, sprint Kai 2 A, 02/11/2026). Script classique, sans écran :
   les écrans (tuile « Certificates », épreuves, badge, page imprimable) viennent au sprint B (Ouss).
   À charger APRÈS js/app-daily.js, js/app-usage.js, js/data/themes-sensibles.js et js/app-v54-v62.js.

   ===== API publique : l'objet global Cert =====
   « élève » = identifiant de profil (PROFS.list[i].id), ou l'objet profil, ou rien (= élève en cours, PROFS.cur).
   « thème » = identifiant de thème des données existantes, tel que allWords() le forme : "<nature>:<catégorie>",
     ex. "nouns:animals", "adjectives:colours", "adverbs:frequency", "verbs:irregular", "verbs:regular".
   Les dates sont des clés "AAAA-MM-JJ" (comme DST.days), dans le fuseau de l'appareil.

   Cert.themes(élève?)              → [{ id, kind, cat, label, n }] : tous les thèmes certifiables (n = nombre de mots).
   Cert.themeWords(thème)            → mots du thème [{ k, d, key, th }] (catégorie principale OU « also », comme les puces).
   Cert.list(élève)                  → certificats de l'élève (copies), triés par thème, avec deux champs calculés :
                                       active (bool) et left (jours avant l'échéance, négatif si dépassée).
   Cert.get(élève, thème)            → un certificat (copie, mêmes champs calculés) ou null.
   Cert.isActive(élève, thème, jour?) → vrai si certifié ET jour < date d'échéance (le jour de l'échéance, il ne l'est plus).
   Cert.dueSoon(élève, jours = 7)    → certificats à renouveler : statut "ok" et échéance dans `jours` jours ou moins,
                                       échéances dépassées comprises (left < 0) ; triés par échéance. Sert au rappel de Kai.
   Cert.passExam(résultat)           → { n, good, p, formats, pass } selon la règle : ≥ 90 % ET au moins 3 formats.
   Cert.scoreRenewal(résultat)       → { n, good, p, pass } selon la règle : ≥ 80 % (sur 8 questions : 7 bonnes réponses).
   Cert.record(élève, thème, résultat) → { ok, pass, cert, error? } : enregistre une épreuve ou un renouvellement.
        résultat = { kind: "exam" | "renewal", items: [{ key: "nouns:cat", fmt: "type-fr-en", ok: true }, …] }
                ou { kind, n, good, formats: [...] } (scores déjà comptés par l'écran).
        exam réussie      → certificat (re)créé : obtention aujourd'hui, échéance = aujourd'hui + 3 ou 6 mois.
        exam ratée        → tentative notée (statut "review", meilleur score gardé) ; le thème reste dans les mots du jour.
        renewal réussi    → échéance prolongée : max(aujourd'hui, échéance) + 3 ou 6 mois (on ne perd pas les jours restants).
        renewal raté      → statut "review" : le thème revient dans les mots du jour (il faudra repasser l'épreuve).
        renewal sans certificat valable (absent ou "review") → { ok: false, error: "no-cert" }, rien n'est changé.
   Cert.pickRenewal(élève, thème, { n = 8, formats? }) → n questions [{ k, d, key, fmt, f, miss, weight }] tirées au hasard
        sans remise, pondérées vers les mots peu fréquents (USAGE : f = 1 → ×4, f = 2 → ×2, f = 3 → ×1) et vers les mots
        déjà ratés (journal des jours de l'élève + mots ratés aux épreuves : ×(1 + 1,5 × ratés, plafonné à 4)).
        `formats` (liste) : distribués à tour de rôle dans fmt ; sinon fmt = null (l'écran choisit, cf. conception de Matt).
   Cert.validityMonths(niveau)       → 3 (Beginner, Elementary) ou 6 (Intermediate, Upper-intermediate).
   Cert.inRotation(élève, mot)       → faux si le mot appartient à un thème certifié et valide de l'élève.
   Cert.rotationFilter(élève)        → null si l'élève n'a aucun certificat valide, sinon une fonction mot → bool
                                       (branchée dans pickMix, js/app-daily.js, et dans memStats ci-dessous).
   Cert.mergeRaw(clé, texte)         → fusion d'un certificat importé (Save & move) : thème par thème, le plus récent (champ u)
                                       gagne ; texte JSON ou objet ; ignoré si l'élève n'existe pas. Rend le nombre de thèmes repris.
   Cert.drop(élève)                  → efface les certificats d'un élève supprimé.
   Cert.RULES                        → seuils et durées (modifiables en un seul endroit).

   ===== Stockage =====
   localStorage["kai.cert.v1.<id de l'élève>"] (même forme que "kai.daily.v1.<id>") : JSON lisible, modifiable à la main
   par un parent (décision du PO, T1) :
   { "v": 1, "themes": { "nouns:animals": { "theme": "nouns:animals", "status": "ok", "first": "2026-11-02",
       "date": "2026-11-02", "expires": "2027-02-02", "score": 95, "formats": ["type-fr-en", "picture", "gap"],
       "level": 0, "renewals": 0, "best": 95, "missed": ["nouns:parrot"],
       "history": [{ "date": "2026-11-02", "kind": "exam", "score": 95, "pass": true }], "u": 1793612345678 } } }
   status : "ok" (certifié, valable jusqu'à expires exclu) ou "review" (pas ou plus certifié : retour en révision).
   La clé commence par "kai." : elle part donc d'elle-même dans le fichier « Save & move » (kaiDump) ; à l'import,
   kaiMerge appelle Cert.mergeRaw (fusion thème par thème) au lieu de « garder l'existant ».
   Tout est assaini à la lecture : JSON invalide, champ absent ou faux, date impossible → ignoré ou recalculé, sans planter.
   Un ancien fichier de sauvegarde (sans clé kai.cert.*) se charge comme avant : l'élève n'a simplement aucun certificat. */
"use strict";
const Cert = (function () {
    const RULES = { examPass: 90, examFormats: 3, renewalPass: 80, renewalSize: 8, months: [3, 3, 6, 6], remindDays: 7, history: 20, missed: 40, starsCert: 10, starsRenewal: 5 };
    const PREFIX = "kai.cert.v1.";
    const RE_TH = /^[a-z]+:[a-z0-9_-]{1,40}$/, RE_FMT = /^[a-z0-9-]{1,32}$/, RE_KEY = /^[a-z]+:[^\u0000-\u001f]{1,60}$/, RE_PID = /^[A-Za-z0-9_-]{1,40}$/;
    /* --- dates (clés "AAAA-MM-JJ", fuseau de l'appareil) --- */
    const pad = n => String(n).padStart(2, "0");
    const dk = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const today = () => typeof todayKey === "function" ? todayKey() : dk(new Date());
    function validDay(k) {
        if (typeof k !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(k))
            return false;
        const [y, m, d] = k.split("-").map(Number), x = new Date(y, m - 1, d);
        return x.getFullYear() === y && x.getMonth() === m - 1 && x.getDate() === d;
    }
    /* + n mois, jour ramené à la fin du mois si besoin (31/01 + 1 mois → 28 ou 29/02) */
    function addMonths(k, n) {
        const [y, m, d] = k.split("-").map(Number), t = new Date(y, m - 1 + n, 1), last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
        t.setDate(Math.min(d, last));
        return dk(t);
    }
    const between = (a, b) => {
        const P = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
        return Math.round((P(b) - P(a)) / 864e5);
    };
    const validityMonths = lv => RULES.months[Number.isInteger(lv) && RULES.months[lv] ? lv : 0];
    /* --- élèves --- */
    function pidOf(x) {
        const p = x && typeof x === "object" ? x.id : x === undefined || x === null ? (typeof PROFS !== "undefined" ? PROFS.cur : null) : x;
        return typeof p === "string" && RE_PID.test(p) ? p : null;
    }
    function profOf(pid) {
        try {
            return PROFS.list.find(p => p && p.id === pid) || null;
        }
        catch (e) {
            return null;
        }
    }
    const levelOf = pid => {
        const p = profOf(pid);
        return typeof lvOf === "function" ? lvOf(p) : (p && Number.isInteger(p.lv) ? p.lv : 0);
    };
    /* --- assainissement d'un certificat lu (fichier modifié à la main, ancienne version, données abîmées) --- */
    const num = (v, lo, hi) => typeof v === "number" && isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : null;
    function clean(th, c) {
        if (!RE_TH.test(th) || !c || typeof c !== "object" || Array.isArray(c))
            return null;
        const o = { theme: th, status: c.status === "ok" ? "ok" : "review" };
        o.level = num(c.level, 0, RULES.months.length - 1) ?? 0;
        o.score = num(c.score, 0, 100);
        o.best = num(c.best, 0, 100) ?? o.score;
        o.renewals = num(c.renewals, 0, 999) ?? 0;
        o.formats = Array.isArray(c.formats) ? [...new Set(c.formats.filter(f => typeof f === "string" && RE_FMT.test(f)))].slice(0, 12) : [];
        o.missed = Array.isArray(c.missed) ? [...new Set(c.missed.filter(k => typeof k === "string" && RE_KEY.test(k)))].slice(0, RULES.missed) : [];
        /* mots ratés à l'épreuve et pas encore réussis dans un tour du jour : ils restent dans les mots du jour (champ absent = tous les ratés) */
        o.redo = Array.isArray(c.redo) ? [...new Set(c.redo.filter(k => typeof k === "string" && RE_KEY.test(k)))].slice(0, RULES.missed) : o.missed.slice();
        o.history = Array.isArray(c.history) ? c.history.filter(h => h && typeof h === "object" && validDay(h.date)).map(h => ({ date: h.date, kind: h.kind === "renewal" ? "renewal" : "exam", score: num(h.score, 0, 100) ?? 0, pass: !!h.pass })).slice(-RULES.history) : [];
        o.u = num(c.u, 0, 8.64e15) ?? 0;
        if (validDay(c.date))
            o.date = c.date;
        if (validDay(c.first))
            o.first = c.first;
        else if (o.date)
            o.first = o.date;
        if (o.status === "ok") {
            /* un certificat « ok » sans date d'obtention n'a pas de sens : il redevient « à revoir » */
            if (!o.date)
                o.status = "review";
            else if (!validDay(c.expires) || c.expires <= o.date)
                o.expires = addMonths(o.date, validityMonths(o.level));
            else
                /* plafond : deux durées de validité après la date (un renouvellement anticipé garde ses jours restants) */
                o.expires = c.expires < addMonths(o.date, 2 * validityMonths(o.level)) ? c.expires : addMonths(o.date, 2 * validityMonths(o.level));
        }
        else if (validDay(c.expires))
            o.expires = c.expires;
        return o;
    }
    function parse(raw) {
        const out = {};
        let v = raw && typeof raw === "object" ? raw : null;
        try {
            if (!v)
                v = JSON.parse(typeof raw === "string" ? raw : "null");
        }
        catch (e) {
            return out;
        }
        const T = v && typeof v === "object" && v.themes && typeof v.themes === "object" && !Array.isArray(v.themes) ? v.themes : null;
        if (!T)
            return out;
        for (const th of Object.keys(T).slice(0, 500)) {
            const c = clean(th, T[th]);
            if (c)
                out[th] = c;
        }
        return out;
    }
    function load(pid) {
        if (!pid)
            return {};
        try {
            return parse(localStorage.getItem(PREFIX + pid));
        }
        catch (e) {
            return {};
        }
    }
    function save(pid, M) {
        try {
            localStorage.setItem(PREFIX + pid, JSON.stringify({ v: 1, themes: M }));
            return true;
        }
        catch (e) {
            return false;
        }
    }
    /* --- état calculé --- */
    const activeOn = (c, t) => !!c && c.status === "ok" && !!c.expires && t < c.expires;
    const view = (c, t) => Object.assign(JSON.parse(JSON.stringify(c)), { active: activeOn(c, t), left: c.expires ? between(t, c.expires) : null });
    function list(x) {
        const pid = pidOf(x), M = load(pid), t = today();
        return Object.keys(M).sort().map(th => view(M[th], t));
    }
    function get(x, th) {
        const c = load(pidOf(x))[th];
        return c ? view(c, today()) : null;
    }
    const isActive = (x, th, t) => activeOn(load(pidOf(x))[th], validDay(t) ? t : today());
    function dueSoon(x, days) {
        const n = Number.isFinite(days) ? days : RULES.remindDays, t = today();
        return list(x).filter(c => c.status === "ok" && c.expires && between(t, c.expires) <= n).sort((a, b) => a.expires.localeCompare(b.expires));
    }
    /* --- thèmes et mots (données existantes : allWords, NCAT, lexiques) --- */
    function words() {
        try {
            return typeof allWords === "function" ? allWords() : [];
        }
        catch (e) {
            return [];
        }
    }
    /* tous les thèmes d'un mot : catégorie principale + « also » (comme les puces des dictionnaires) */
    const themesOfWord = w => w.k === "verbs" ? [w.th] : [w.th, ...((w.d && w.d.also) || []).map(c => w.k + ":" + c)];
    /* périmètre de la banque (js/data/certificats.js, Matt) : "nouns:family-1" → ses mots ; sans entrée, le thème entier */
    function bankOf(id) {
        try {
            return (typeof CERTBANK === "object" && CERTBANK && Array.isArray(CERTBANK.certs) && CERTBANK.certs.find(c => c && c.id === id)) || null;
        }
        catch (e) {
            return null;
        }
    }
    const hasBank = () => { try { return typeof CERTBANK === "object" && !!CERTBANK && Array.isArray(CERTBANK.certs) && CERTBANK.certs.length > 0; } catch (e) { return false; } };
    const bankWord = (bc, key) => (bc && bc.words.find(w => w.k === key)) || null;
    const wordOf = key => { try { return allWords().byKey.get(key) || null; } catch (e) { return null; } };
    function themeWords(th) {
        if (typeof th !== "string" || !RE_TH.test(th))
            return [];
        const bc = bankOf(th);
        if (bc)
            return bc.words.map(w => wordOf(w.k)).filter(Boolean);
        return words().filter(w => themesOfWord(w).includes(th));
    }
    function label(kind, cat) {
        try {
            if (kind === "verbs")
                return cat === "irregular" ? "Irregular verbs" : "Regular verbs";
            if (kind === "nouns")
                return NCAT[cat].label;
            return KK(kind).lex().cats[cat].label;
        }
        catch (e) {
            return cat;
        }
    }
    /* avec la banque : les certificats qu'elle décrit (périmètres de 20 mots au plus, pas de verbes) ; sans elle, les thèmes entiers */
    function themes() {
        if (hasBank())
            return CERTBANK.certs.filter(c => c && RE_TH.test(c.id) && Array.isArray(c.words)).map(c => {
                const [kind, cat] = String(c.theme || c.id).split(":");
                return { id: c.id, kind, cat, label: c.title || label(kind, cat), title: c.title, titleFr: c.titleFr, icon: c.icon, theme: c.theme, part: c.part || 0, suggest: c.suggest || null, n: c.words.length };
            });
        const n = {};
        for (const w of words())
            for (const th of themesOfWord(w))
                n[th] = (n[th] || 0) + 1;
        return Object.keys(n).map(id => {
            const [kind, cat] = id.split(":");
            return { id, kind, cat, label: label(kind, cat), n: n[id] };
        });
    }
    /* --- sortie de rotation --- */
    function rotationFilter(x) {
        const pid = pidOf(x);
        if (!pid)
            return null;
        const M = load(pid), t = today(), A = Object.keys(M).filter(th => activeOn(M[th], t));
        if (!A.length)
            return null;
        /* par périmètre : les mots de la partie certifiée sortent, sauf ceux ratés à l'épreuve tant qu'ils ne sont pas réussis dans un tour du jour postérieur */
        const D = daysOf(pid), out = new Set();
        for (const th of A) {
            const back = new Set((M[th].redo || []).filter(k => !resolvedAfter(D, k, M[th].u)));
            for (const w of themeWords(th))
                if (!back.has(w.key))
                    out.add(w.key);
        }
        return w => !w || !out.has(w.key);
    }
    /* mots ratés à l'épreuve d'un certificat valide et pas encore réussis dans un tour du jour : pickMix les remet dans les mots à revoir */
    function pending(x) {
        const pid = pidOf(x), M = load(pid), t = today(), D = daysOf(pid), out = new Map();
        for (const th of Object.keys(M))
            if (activeOn(M[th], t))
                for (const k of M[th].redo || [])
                    if (!out.has(k) && !resolvedAfter(D, k, M[th].u) && wordOf(k))
                        out.set(k, wordOf(k));
        return [...out.values()];
    }
    /* un mot réussi dans un tour du jour après l'instant u (les rattrapages de certificat, drapeau cu, ne comptent pas) */
    function resolvedAfter(D, key, u) {
        const ud = dk(new Date(u || 0));
        for (const k of Object.keys(D || {})) {
            if (k < ud)
                continue;
            const r = D[k], w = r && r.w && r.w[key];
            if (!w || w.cu || !(w.ok || w.fx))
                continue;
            if (k > ud || (r.qs || []).some(q => q && q.t > (u || 0)))
                return true;
        }
        return false;
    }
    const inRotation = (x, w) => {
        const f = rotationFilter(x);
        return !f || f(w);
    };
    /* --- règles de réussite --- */
    function count(r) {
        r = r || {};
        if (Array.isArray(r.items)) {
            const I = r.items.filter(i => i && typeof i === "object");
            return { n: I.length, good: I.filter(i => i.ok).length, formats: [...new Set(I.map(i => i.fmt).filter(f => typeof f === "string" && RE_FMT.test(f)))], missed: I.filter(i => !i.ok && typeof i.key === "string" && RE_KEY.test(i.key)).map(i => i.key) };
        }
        const n = num(r.n, 0, 1e4) ?? 0;
        return { n, good: Math.min(n, num(r.good, 0, 1e4) ?? 0), formats: Array.isArray(r.formats) ? [...new Set(r.formats.filter(f => typeof f === "string" && RE_FMT.test(f)))] : [], missed: [] };
    }
    const pctOf = (good, n) => n ? Math.round(100 * good / n) : 0;
    function passExam(r) {
        const c = count(r), p = pctOf(c.good, c.n);
        /* comparaison exacte (sans arrondi) : 9/10 = 90 % réussit, 26/29 = 89,7 % échoue */
        return { n: c.n, good: c.good, p, formats: c.formats, pass: c.n > 0 && 100 * c.good >= RULES.examPass * c.n && c.formats.length >= RULES.examFormats };
    }
    function scoreRenewal(r) {
        const c = count(Array.isArray(r) ? { items: r } : r), p = pctOf(c.good, c.n);
        return { n: c.n, good: c.good, p, pass: c.n > 0 && 100 * c.good >= RULES.renewalPass * c.n };
    }
    /* --- enregistrer une épreuve ou un renouvellement --- */
    function record(x, th, r) {
        const pid = pidOf(x);
        if (!pid || !profOf(pid))
            return { ok: false, pass: false, cert: null, error: "no-learner" };
        if (typeof th !== "string" || !RE_TH.test(th))
            return { ok: false, pass: false, cert: null, error: "bad-theme" };
        const kind = r && r.kind === "renewal" ? "renewal" : "exam", t = today(), lv = levelOf(pid), M = load(pid), old = M[th] || null, c = count(r);
        if (kind === "renewal" && (!old || old.status !== "ok" || !old.expires))
            return { ok: false, pass: false, cert: old ? view(old, t) : null, error: "no-cert" };
        const res = kind === "exam" ? passExam(r) : scoreRenewal(r), n = old ? JSON.parse(JSON.stringify(old)) : { theme: th, status: "review", level: lv, score: null, best: null, renewals: 0, formats: [], missed: [], history: [] };
        n.history = [...n.history, { date: t, kind, score: res.p, pass: res.pass }].slice(-RULES.history);
        n.missed = [...new Set([...c.missed, ...n.missed])].slice(0, RULES.missed);
        /* mots à garder dans les mots du jour : ceux de cette épreuve + les anciens pas encore réussis depuis */
        const D = daysOf(pid), carried = old ? (old.redo || old.missed || []).filter(k => !resolvedAfter(D, k, old.u)) : [];
        n.redo = [...new Set([...c.missed, ...carried])].slice(0, RULES.missed);
        n.u = Date.now();
        if (kind === "exam") {
            n.best = Math.max(n.best ?? 0, res.p);
            if (res.pass) {
                n.status = "ok";
                n.first = old && old.first ? old.first : t;
                n.date = t;
                n.level = lv;
                n.score = res.p;
                n.formats = res.formats;
                n.expires = addMonths(t, validityMonths(lv));
            }
            /* épreuve ratée : un certificat encore valable le reste (l'écran ne devrait pas proposer l'épreuve dans ce cas) */
        }
        else if (res.pass) {
            n.renewals = (n.renewals || 0) + 1;
            n.level = lv;
            n.date = t;
            n.expires = addMonths(old.expires > t ? old.expires : t, validityMonths(lv));
        }
        else
            n.status = "review";
        M[th] = clean(th, n);
        const ok = save(pid, M);
        /* étoiles : +10 pour un certificat obtenu (pas pour une épreuve repassée alors que le certificat court), +5 par renouvellement réussi */
        let stars = 0;
        if (ok && res.pass)
            stars = kind === "exam" ? (activeOn(old, t) ? 0 : RULES.starsCert) : RULES.starsRenewal;
        if (stars)
            dayWrite(pid, r => { r.cs = (r.cs || 0) + stars; });
        return { ok, pass: res.pass, cert: view(M[th], t), score: res, stars };
    }
    /* --- tirage des questions de renouvellement --- */
    function daysOf(pid) {
        try {
            if (typeof PROFS !== "undefined" && pid === PROFS.cur && typeof DST !== "undefined")
                return DST.days || {};
            return typeof loadDays === "function" ? loadDays(pid) : {};
        }
        catch (e) {
            return {};
        }
    }
    function freqOf(w) {
        try {
            const f = typeof useOf === "function" ? useOf(w.k, w.d).f : 2;
            return f === 1 || f === 3 ? f : 2;
        }
        catch (e) {
            return 2;
        }
    }
    /* mots ratés : dans le journal des jours (hors rattrapages de certificat) et aux épreuves du périmètre */
    function missInfo(pid, th) {
        const miss = {}, last = {}, D = daysOf(pid);
        for (const k of Object.keys(D).sort()) {
            const r = D[k];
            for (const [key, w] of Object.entries((r && r.w) || {})) {
                if (!w || w.cu)
                    continue;
                if (!w.ok)
                    miss[key] = (miss[key] || 0) + 1;
                last[key] = !!(w.ok || w.fx);
            }
        }
        const c = load(pid)[th];
        for (const key of (c && c.missed) || [])
            miss[key] = (miss[key] || 0) + 1;
        return { miss, last };
    }
    const FREQ_W = { 1: 4, 2: 2, 3: 1 };
    function pickRenewal(x, th, opts) {
        opts = opts || {};
        const pid = pidOf(x), size = num(opts.n, 1, 50) ?? RULES.renewalSize, lv = levelOf(pid);
        let W = themeWords(th);
        /* un thème sensible choisi par l'élève reste possible : on ne retire les mots sensibles que s'il en reste assez */
        if (typeof sensOk === "function") {
            const S = W.filter(w => sensOk(w.k, w.d, lv));
            if (S.length >= Math.min(size, W.length))
                W = S;
        }
        const { miss, last } = missInfo(pid, th);
        const pool = W.map(w => {
            const f = freqOf(w), m = Math.min(4, (miss[w.key] || 0) + (last[w.key] === false ? 1 : 0));
            return { w, f, m, weight: FREQ_W[f] * (1 + 1.5 * m) };
        });
        const out = [], bc = bankOf(th), usedS = new Map(), F = Array.isArray(opts.formats) ? opts.formats.filter(f => typeof f === "string" && RE_FMT.test(f)) : [];
        while (out.length < size && pool.length) {
            let r = Math.random() * pool.reduce((s, p) => s + p.weight, 0), i = 0;
            while (i < pool.length - 1 && (r -= pool[i].weight) >= 0)
                i++;
            const p = pool.splice(i, 1)[0];
            const want = F.length ? F[out.length % F.length] : null, q = want ? build(bc, p.w, want, usedS) : { key: p.w.key, fmt: null };
            out.push(Object.assign({ k: p.w.k, d: p.w.d, f: p.f, miss: p.m, weight: p.weight }, q));
        }
        return out;
    }
    /* --- questions : mise en forme d'une question à partir de la banque (js/data/certificats.js) ---
       question = { key, fmt, … } ; champs lus par l'écran : fr (traduction), s / sfr (phrase, avec *mot* pour « gap »), also (autres
       réponses justes, sans note), alt (variante américaine, avec note ; pour « order » : autres ordres justes), img / tree / ask / askFr (image),
       bad / good / why / whyFr (correction), main (réponse affichée d'une case de l'arbre), ex (phrase + traduction, pour les tests). */
    const PRODUCE = ["type-fr-en", "picture", "gap", "dictation"], SHOWS = ["order", "fix"];
    const FALL = { fix: ["gap", "type-fr-en"], gap: ["type-fr-en"], picture: ["type-fr-en", "gap"], dictation: ["type-fr-en", "gap"], order: ["gap", "type-fr-en"], "type-fr-en": ["gap", "picture", "order", "fix", "dictation"] };
    const rnd = a => a && a.length ? a[Math.floor(Math.random() * a.length)] : null;
    function shuf(a) {
        const b = a.slice();
        for (let i = b.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [b[i], b[j]] = [b[j], b[i]];
        }
        return b;
    }
    const plainS = s => String(s || "").replace(/\*/g, "");
    const mainOf = w => (w && w.d && (w.d.w || w.d.v)) || "";
    const targetOf = s => { const m = String(s || "").match(/\*(.+?)\*/); return m ? m[1].trim() : ""; };
    /* le mot peut-il être interrogé dans ce format ? (sans banque : seulement traduction et phrases d'exemple des données) */
    function can(bc, w, f) {
        const bw = bankWord(bc, w.key), ex = (w.d && w.d.ex) || [];
        if (!bc || !bw)
            return f === "type-fr-en" || ((f === "gap" || f === "order" || f === "dictation") && ex.length > 0);
        if ((bw.skip || []).includes(f))
            return false;
        switch (f) {
            case "type-fr-en": return true;
            case "picture": return !!bw.pic;
            case "gap": return !!(bw.gap && bw.gap.length);
            case "order": return !!(bw.ord && bw.ord.length);
            case "fix": return !!(bw.fix && bw.fix.length);
            case "dictation": return !!bw.say;
        }
        return false;
    }
    /* met une question en forme ; si le mot ne sait pas faire ce format, un format voisin (fix → gap → traduction…) */
    function build(bc, w, fmt, usedS) {
        const chain = [fmt, ...(FALL[fmt] || [])], f = chain.find(x => can(bc, w, x)) || "type-fr-en", q = { key: w.key, fmt: f }, bw = bankWord(bc, w.key);
        if (!bc || !bw)
            return q;
        const main = mainOf(w), us = k => (bw.us && bw.us[k]) || [], okOf = k => (bw.ok && bw.ok[k]) || [];
        const used = (usedS && usedS.get(w.key)) || new Set();
        if (usedS)
            usedS.set(w.key, used);
        const choose = (L, text) => {
            const fresh = L.filter(x => !used.has(plainS(text(x)).toLowerCase())), x = rnd(fresh.length ? fresh : L);
            used.add(plainS(text(x)).toLowerCase());
            return x;
        };
        if (f === "type-fr-en") {
            q.fr = bw.fr || w.d.fr;
            q.also = okOf(main).slice();
            q.alt = us(main).slice();
        }
        else if (f === "picture") {
            const pc = bw.pic, bt = bc.tree;
            q.ask = (bc.picture && bc.picture.q) || "What is it?";
            q.askFr = (bc.picture && bc.picture.qFr) || "";
            if (pc && pc.tree) {
                q.tree = { cert: bc.id, box: pc.tree };
                q.also = ((bt && bt.ask && bt.ask[pc.tree]) || []).slice();
                q.main = q.also[0];
            }
            else {
                q.img = pc === true ? w.d.e : (pc && pc.e) || w.d.e;
                q.also = okOf(main).concat((pc && pc.ok) || []);
            }
            q.alt = us(main).slice();
        }
        else if (f === "gap") {
            const g = choose(bw.gap, x => x[0]), t = targetOf(g[0]);
            q.s = g[0];
            q.sfr = g[1];
            q.also = (g[2] || []).concat(okOf(t));
            q.alt = us(t).slice();
            q.ex = [g[0], g[1]];
        }
        else if (f === "order") {
            const o = choose(bw.ord, x => x[0]);
            q.s = o[0];
            q.sfr = o[1];
            q.alt = Array.isArray(o[2]) ? o[2].slice() : [];
            /* ex : la phrase avec le mot du périmètre entre étoiles (comme dans les données) */
            const re = new RegExp("\\b" + main.replace(/[^a-z' -]/gi, "") + "\\w*", "i");
            q.ex = [o[0].replace(re, m => "*" + m + "*"), o[1]];
        }
        else if (f === "fix") {
            const x = choose(bw.fix, y => y.s);
            Object.assign(q, { s: x.s, bad: x.bad, good: x.good, sfr: x.fr, why: x.why, whyFr: x.whyFr, also: (x.ok || []).slice() });
        }
        else if (f === "dictation") {
            /* en dictée : le mot dit et sa variante américaine (avec note), rien d'autre (ni ok, ni pic.ok) */
            q.s = bw.say;
            q.alt = us(main).slice();
        }
        return q;
    }
    /* --- tirage d'une épreuve complète (conception §5.2 et §5.3) --- */
    const QUOTAS = {
        young: { silent: { "type-fr-en": 6, picture: 4, gap: 5, order: 3, fix: 2 }, sound: { "type-fr-en": 4, picture: 4, gap: 4, order: 3, fix: 2, dictation: 3 } },
        older: { silent: { "type-fr-en": 7, picture: 3, gap: 7, order: 4, fix: 4 }, sound: { "type-fr-en": 5, picture: 3, gap: 6, order: 4, fix: 4, dictation: 3 } }
    };
    /* couplage maximum (Kuhn) : adj[u] = droites possibles du noeud gauche u ; rend Map droite → gauche */
    function kuhn(nl, adj) {
        const mr = new Map();
        const tryK = (u, seen) => {
            for (const v of adj[u]) {
                if (seen.has(v))
                    continue;
                seen.add(v);
                if (!mr.has(v) || tryK(mr.get(v), seen)) {
                    mr.set(v, u);
                    return true;
                }
            }
            return false;
        };
        for (let u = 0; u < nl; u++)
            tryK(u, new Set());
        return mr;
    }
    function pickExam(x, th, opts) {
        opts = opts || {};
        const pid = pidOf(x), young = levelOf(pid) <= 1, sound = !!opts.sound, bc = bankOf(th), N = young ? 20 : 25;
        let W = themeWords(th);
        if (!W.length)
            return [];
        const { miss } = missInfo(pid, th), cert = load(pid)[th], jitter = new Map();
        /* priorité des questions en plus : mots ratés à une épreuve, puis ratés dans les tours du jour, puis les moins fréquents */
        const prio = w => {
            if (!jitter.has(w.key))
                jitter.set(w.key, Math.random() * .5);
            return 2 * ((cert && cert.missed || []).includes(w.key) ? 1 : 0) + Math.min(4, miss[w.key] || 0) + (freqOf(w) === 1 ? 1 : 0) + jitter.get(w.key);
        };
        if (W.length > N)
            W = W.slice().sort((a, b) => prio(b) - prio(a)).slice(0, N);
        const caps = f => W.filter(w => can(bc, w, f) && (f !== "dictation" || sound)).length;
        const quota = Object.assign({}, QUOTAS[young ? "young" : "older"][sound ? "sound" : "silent"]);
        /* un format sans assez de matière (pas d'images, pas de phrase fautive…) passe aux formats voisins */
        for (const f of ["picture", "fix", "order", "gap", "dictation"]) {
            if (!(f in quota))
                continue;
            let over = quota[f] - caps(f);
            while (over-- > 0) {
                quota[f]--;
                const to = ["type-fr-en", "gap", "order", "fix", "picture"].filter(g => g !== f).map(g => [g, caps(g) - (quota[g] || 0)]).filter(a => a[1] > 0).sort((a, b) => b[1] - a[1])[0];
                if (to)
                    quota[to[0]] = (quota[to[0]] || 0) + 1;
            }
        }
        /* un mot est interrogé au plus 2 fois (3 si le périmètre est trop petit pour remplir l'épreuve : Colours, 11 mots, à 25 questions),
           jamais deux fois dans le même format */
        const maxPer = Math.max(2, Math.ceil(N / W.length)), total = Math.min(N, Object.values(quota).reduce((a, b) => a + b, 0));
        const assign = () => {
            const words = shuf(W), slots = shuf(Object.keys(quota).flatMap(f => Array(Math.max(0, quota[f])).fill(f)));
            const used = words.map(() => new Set()), res = [];
            let exact = true, left = slots.map((f, i) => i);
            /* tour 1 : chaque mot reçoit une question (couplage maximum mots → places) ; tours suivants : une question de plus par mot, les mots
               ratés et peu fréquents d'abord */
            for (let round = 0; round < maxPer && left.length; round++) {
                const adj = round === 0
                    ? words.map((w, wi) => left.filter(si => can(bc, w, slots[si]) && !used[wi].has(slots[si])))
                    : left.map(si => words.map((w, wi) => wi).filter(wi => can(bc, words[wi], slots[si]) && !used[wi].has(slots[si])).sort((a, b) => prio(words[b]) - prio(words[a])));
                const m = kuhn(adj.length, adj), taken = new Set();
                if (round === 0)
                    m.forEach((wi, si) => { res.push({ wi, f: slots[si] }); used[wi].add(slots[si]); taken.add(si); });
                else
                    m.forEach((li, wi) => { const si = left[li]; res.push({ wi, f: slots[si] }); used[wi].add(slots[si]); taken.add(si); });
                if (round === 0)
                    words.forEach((w, wi) => {
                        if (used[wi].size)
                            return;
                        exact = false;
                        const f = shuf(Object.keys(QUOTAS.young.sound)).find(g => can(bc, w, g) && (g !== "dictation" || sound));
                        if (f) {
                            res.push({ wi, f });
                            used[wi].add(f);
                        }
                    });
                left = left.filter(si => !taken.has(si));
            }
            if (left.length)
                exact = false;
            return { res, words, exact: exact && res.length === total };
        };
        let best = null;
        for (let i = 0; i < 40; i++) {
            const r = assign();
            if (!best || r.res.length > best.res.length || (r.exact && !best.exact))
                best = r;
            if (r.exact)
                break;
        }
        const usedS = new Map();
        let Q = best.res.map(r => build(bc, best.words[r.wi], r.f, usedS));
        /* ordre aléatoire ; une question qui AFFICHE le mot ne vient jamais avant celle qui le demande */
        Q = shuf(Q);
        for (const key of new Set(Q.map(q => q.key))) {
            let first = Q.findIndex(q => q.key === key && PRODUCE.includes(q.fmt));
            if (first < 0)
                continue;
            for (let i = 0; i < first; i++)
                if (Q[i].key === key && SHOWS.includes(Q[i].fmt)) {
                    const [q] = Q.splice(i, 1);
                    first--;
                    Q.splice(first + 1 + Math.floor(Math.random() * (Q.length - first)), 0, q);
                    i--;
                }
        }
        return Q;
    }
    /* --- correction d'une réponse tapée (conception §3 ; banque : ok, us, pic.ok, fix.ok) --- */
    const norm = t => typeof t3Norm === "function" ? t3Norm(t) : String(t || "").toLowerCase().replace(/[’‘`´]/g, "'").replace(/[.,!?;:"«»]/g, " ").replace(/\s+/g, " ").trim();
    const stripArt = x => x.replace(/^(a|an|the|to) /, "");
    /* distance de Damerau-Levenshtein : une lettre en trop, en moins, changée, ou deux lettres inversées = 1 (tkLev ne compte pas l'inversion) */
    function lev(a, b) {
        if (Math.abs(a.length - b.length) > 2)
            return 9;
        const d = Array.from({ length: a.length + 1 }, (_, i) => [i].concat(Array(b.length).fill(0)));
        for (let j = 1; j <= b.length; j++)
            d[0][j] = j;
        for (let i = 1; i <= a.length; i++)
            for (let j = 1; j <= b.length; j++) {
                d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
                if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
                    d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
            }
        return d[a.length][b.length];
    }
    const isKnown = w => { try { return NEAR_WORDS.has(w) || (typeof tkKnown === "function" && tkKnown(w)); } catch (e) { return false; } };
    const frKey = fr => String(fr || "").replace(/\(.*?\)/g, "").split("/")[0].toLowerCase().replace(/^(un|une|le|la|les|l'|des|du|de la)\s+/, "").trim();
    /* traduction et image : les mots de même nature qui disent la même chose (mother / mum, 🐴 pony / horse) sont justes aussi */
    function sameMeaning(q, e) {
        const out = [mainOf(e)];
        if (q.fmt === "type-fr-en" && !/\(/.test(e.d.fr || "")) {
            const fk = frKey(e.d.fr);
            try { allWords().forEach(w => { if (w.k === e.k && w.key !== e.key && frKey(w.d.fr) === fk) out.push(mainOf(w)); }); } catch (er) { }
        }
        if (q.fmt === "picture" && (q.img || e.d.e)) {
            const em = q.img || e.d.e;
            try { allWords().forEach(w => { if (w.k === e.k && w.d.e === em) out.push(mainOf(w)); }); } catch (er) { }
        }
        return out;
    }
    /* les formes qui ne diffèrent d'un mot que par la terminaison du nombre (s, es, ies, ves) : toujours fausses (règle 5) */
    function numberForms(x) {
        const o = new Set([x + "s", x + "es"]);
        if (/ies$/.test(x))
            [x.slice(0, -1), x.slice(0, -2), x.slice(0, -3) + "y"].forEach(v => o.add(v));
        else if (/ves$/.test(x))
            [x.slice(0, -1), x.slice(0, -3) + "f", x.slice(0, -3) + "fe"].forEach(v => o.add(v));
        else if (/es$/.test(x))
            [x.slice(0, -1), x.slice(0, -2)].forEach(v => o.add(v));
        else if (/s$/.test(x))
            o.add(x.slice(0, -1));
        if (/y$/.test(x))
            o.add(x.slice(0, -1) + "ies");
        if (/(f|fe)$/.test(x))
            o.add(x.replace(/fe?$/, "ves"));
        o.delete(x);
        return o;
    }
    /* mots anglais courants à une lettre d'un mot de certificat, absents des dictionnaires de l'application (block ≠ black) */
    const NEAR_WORDS = new Set("block blank brow crown drown whine write fellow mellow greed greet prey grew pick link sink wink pint shirt skirt sleep sheet sweep boat coat house hose worse mouth south cough".split(" "));
    function check(q, typed) {
        const res = { ok: false, typo: "", grammar: "", note: "" };
        if (!q || typeof q !== "object")
            return res;
        const a = norm(typed);
        if (!a)
            return res;
        const fmt = q.fmt;
        if (fmt === "order") {
            res.ok = [q.s].concat(q.alt || []).some(s => norm(plainS(s)) === a);
            return res;
        }
        const word = fmt === "type-fr-en" || fmt === "picture" || fmt === "dictation", e = wordOf(q.key), main = mainOf(e);
        let exp;
        if (fmt === "fix") {
            /* étape 2 : retaper le mot fautif est toujours faux, même à une lettre de la correction */
            if (a === norm(q.bad))
                return res;
            exp = [q.good].concat(q.also || []);
        }
        else if (fmt === "gap")
            exp = [targetOf(q.s)].concat(q.also || []);
        else if (fmt === "dictation")
            exp = [main]; /* seulement le mot dit (+ variante américaine plus bas) : mum ≠ mother */
        else if (fmt === "picture" && q.tree)
            exp = [].concat(q.also || []);
        else
            exp = (e ? sameMeaning(q, e) : [main]).concat(q.also || []);
        exp = exp.filter(Boolean).map(norm);
        if (exp.includes(a))
            return (res.ok = true, res);
        if (word && exp.some(x => stripArt(a) === stripArt(x)))
            return (res.ok = true, res);
        const alts = (word || fmt === "gap" ? q.alt || [] : []).map(norm);
        if (alts.includes(a) || (word && alts.includes(stripArt(a)))) {
            res.ok = true;
            res.note = `In British English: ${fmt === "gap" ? exp[0] : q.main || main}`;
            return res;
        }
        /* grammaire : jamais tolérée (pluriel oublié, pluriel fabriqué wifes / childs, autre forme du même mot) */
        const forms = e ? [e.d.w, e.d.pl, e.d.v].filter(Boolean).map(norm) : [], plurals = forms.flatMap(f => [f + "s", f + "es"]);
        const sameStem = exp.some(x => x !== a && !x.includes(" ") && x.length >= 4 && numberForms(x).has(a));
        if (forms.includes(a) || plurals.includes(a) || sameStem) {
            res.grammar = fmt === "gap" ? `Look at the sentence: you need ${exp[0]}.` : "Singular or plural? Look carefully.";
            return res;
        }
        /* faute de frappe : une lettre, mot attendu d'au moins 5 lettres, et ce qui est tapé n'est pas un autre mot anglais */
        for (const x of exp) {
            if (x.replace(/[^a-z]/g, "").length < 5 || a.split(" ").every(isKnown))
                continue;
            if (lev(a, x) <= 1) {
                res.ok = true;
                res.typo = x;
                return res;
            }
        }
        return res;
    }
    /* nouvel essai : une épreuve complète ratée aujourd'hui ne se repasse que demain (règle du PO) */
    function canRetry(x, th) {
        const c = load(pidOf(x))[th], t = today(), h = c && c.history && c.history[c.history.length - 1];
        if (h && h.kind === "exam" && !h.pass && h.date === t) {
            const [y, m, d] = t.split("-").map(Number);
            return { ok: false, on: dk(new Date(y, m - 1, d + 1)) };
        }
        return { ok: true, on: null };
    }
    /* --- journal du jour : écriture d'un enregistrement (étoiles de certificat, mots rattrapés) --- */
    function dayWrite(pid, fn) {
        try {
            const cur = typeof PROFS !== "undefined" && pid === PROFS.cur && typeof DST !== "undefined" && typeof dPut === "function", t = today();
            const days = cur ? DST.days : (typeof loadDays === "function" ? loadDays(pid) : {});
            const rec = JSON.parse(JSON.stringify(days[t] || { d: t, mood: null, qs: [], w: {}, n: typeof LV !== "undefined" && LV[levelOf(pid)] ? LV[levelOf(pid)].words : 10 }));
            rec.w = rec.w || {};
            rec.qs = rec.qs || [];
            fn(rec);
            if (cur)
                dPut(rec);
            else {
                rec.u = Date.now();
                days[t] = rec;
                localStorage.setItem("kai.daily.v1." + pid, JSON.stringify(days));
                if (typeof dPush === "function")
                    dPush(rec, pid);
            }
            if (typeof AWS !== "undefined")
                AWS = null;
        }
        catch (e) {
        }
    }
    /* rattrapage « Fix your mistakes » → mémoire des mots (répétition espacée). Aucune activité (qs) n'est ajoutée : ni la note, ni la
       moyenne des 10 derniers quiz, ni l'objectif du jour ne bougent ; l'entrée porte cu = 1 (masteredOf et les étoiles l'ignorent). */
    function catchUp(x, th, items) {
        const pid = pidOf(x), L = (Array.isArray(items) ? items : []).filter(i => i && typeof i.key === "string" && RE_KEY.test(i.key) && wordOf(i.key));
        if (!pid || !L.length)
            return 0;
        dayWrite(pid, rec => {
            for (const i of L) {
                const e = wordOf(i.key), o = rec.w[i.key];
                /* « raté puis corrigé » (ok 0, fx 1), comme un rattrapage de quiz : le mot revient plus tôt */
                if (!o)
                    rec.w[i.key] = { k: e.k, e: typeof recapLab === "function" ? recapLab(e.k, e.d) : mainOf(e), f: e.d.fr, ok: 0, fx: i.ok ? 1 : 0, cu: 1 };
                else if (o.cu)
                    o.fx = i.ok ? 1 : 0;
            }
        });
        return L.length;
    }
    /* --- Save & move : fusion d'un fichier importé, effacement d'un élève --- */
    function mergeRaw(key, raw) {
        const pid = typeof key === "string" && key.startsWith(PREFIX) ? pidOf(key.slice(PREFIX.length)) : null;
        /* seulement pour un élève connu (kaiMerge ajoute les élèves du fichier avant les autres clés) */
        if (!pid || !profOf(pid))
            return 0;
        const inc = parse(raw), M = load(pid);
        let n = 0;
        for (const th of Object.keys(inc))
            if (!M[th] || inc[th].u > M[th].u) {
                M[th] = inc[th];
                n++;
            }
        if (n)
            save(pid, M);
        return n;
    }
    function drop(x) {
        const pid = pidOf(x);
        try {
            if (pid)
                localStorage.removeItem(PREFIX + pid);
        }
        catch (e) {
        }
    }
    return { RULES, PREFIX, themes, themeWords, list, get, isActive, dueSoon, passExam, scoreRenewal, record, pickRenewal, pickExam, check, canRetry, catchUp, pending, validityMonths, inRotation, rotationFilter, mergeRaw, drop, _clean: clean, _addMonths: addMonths };
})();
/* « My memory » (mots à revoir aujourd'hui, « Words you often miss ») : les mots d'un thème certifié et valide n'y figurent
   plus non plus ; sans certificat valide, memStats rend exactement la même chose qu'avant. */
if (typeof memStats === "function") {
    const memStats0 = memStats;
    memStats = function () {
        const M = memStats0.apply(this, arguments);
        let f = null;
        try {
            f = Cert.rotationFilter();
        }
        catch (e) {
        }
        return f ? Object.assign({}, M, { due: M.due.filter(f), often: M.often.filter(o => f(o.w)) }) : M;
    };
}
