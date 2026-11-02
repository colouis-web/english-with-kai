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
    const RULES = { examPass: 90, examFormats: 3, renewalPass: 80, renewalSize: 8, months: [3, 3, 6, 6], remindDays: 7, history: 20, missed: 40 };
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
    function themeWords(th) {
        if (typeof th !== "string" || !RE_TH.test(th))
            return [];
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
    function themes() {
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
        const M = load(pid), t = today(), A = new Set(Object.keys(M).filter(th => activeOn(M[th], t)));
        if (!A.size)
            return null;
        return w => !w || !themesOfWord(w).some(th => A.has(th));
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
        return { ok, pass: res.pass, cert: view(M[th], t), score: res };
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
        const miss = {}, D = daysOf(pid), last = {};
        for (const k of Object.keys(D).sort()) {
            const r = D[k];
            for (const [key, w] of Object.entries((r && r.w) || {})) {
                if (!w)
                    continue;
                if (!w.ok)
                    miss[key] = (miss[key] || 0) + 1;
                last[key] = !!(w.ok || w.fx);
            }
        }
        const c = load(pid)[th];
        for (const key of (c && c.missed) || [])
            miss[key] = (miss[key] || 0) + 1;
        const pool = W.map(w => {
            const f = freqOf(w), m = Math.min(4, (miss[w.key] || 0) + (last[w.key] === false ? 1 : 0));
            return { w, f, m, weight: FREQ_W[f] * (1 + 1.5 * m) };
        });
        const out = [], F = Array.isArray(opts.formats) ? opts.formats.filter(f => typeof f === "string" && RE_FMT.test(f)) : [];
        while (out.length < size && pool.length) {
            let r = Math.random() * pool.reduce((s, p) => s + p.weight, 0), i = 0;
            while (i < pool.length - 1 && (r -= pool[i].weight) >= 0)
                i++;
            const p = pool.splice(i, 1)[0];
            out.push({ k: p.w.k, d: p.w.d, key: p.w.key, fmt: F.length ? F[out.length % F.length] : null, f: p.f, miss: p.m, weight: p.weight });
        }
        return out;
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
    return { RULES, PREFIX, themes, themeWords, list, get, isActive, dueSoon, passExam, scoreRenewal, record, pickRenewal, validityMonths, inRotation, rotationFilter, mergeRaw, drop, _clean: clean, _addMonths: addMonths };
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
