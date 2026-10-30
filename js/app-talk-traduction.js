/* Code — tranche de l'ancien index.html (lignes 2317–2586). Script classique : l'ordre des <script> compte. */
"use strict";
/* ===== LET'S TALK : traduction en français simple, avec le lexique de Kai (sans connexion) ===== */
const TKFR = (function () {
    const first = s => String(s || "").split(/\s*[\/;]\s*|,\s+/)[0];
    const clean = s => first(s).replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
    const HASP = /^(hamster|haricot|hibou|héros|hockey|huit|haut|hache|hall|handball|hangar|hasard|honte|hot-dog|hurl|hérisson|hamac|homard|housse|hublot|hutte|hamburger)/;
    const vow = w => /^[aeiouyéèêëàâîïôûœh]/i.test(w || "") && !HASP.test(w || "");
    /* ---------- conjugaison ---------- */
    const IRR = { "être": "suis,es,est,sommes,êtes,sont", "avoir": "ai,as,a,avons,avez,ont", "aller": "vais,vas,va,allons,allez,vont", "pouvoir": "peux,peux,peut,pouvons,pouvez,peuvent", "vouloir": "veux,veux,veut,voulons,voulez,veulent", "devoir": "dois,dois,doit,devons,devez,doivent", "savoir": "sais,sais,sait,savons,savez,savent", "boire": "bois,bois,boit,buvons,buvez,boivent", "asseoir": "assieds,assieds,assied,asseyons,asseyez,asseyent", "croire": "crois,crois,croit,croyons,croyez,croient", "recevoir": "reçois,reçois,reçoit,recevons,recevez,reçoivent", "mourir": "meurs,meurs,meurt,mourons,mourez,meurent", "plaire": "plais,plais,plaît,plaisons,plaisez,plaisent", "envoyer": "envoie,envoies,envoie,envoyons,envoyez,envoient", "fuir": "fuis,fuis,fuit,fuyons,fuyez,fuient", "falloir": "faut,faut,faut,faut,faut,faut", "pleuvoir": "pleut,pleut,pleut,pleut,pleut,pleuvent", "naître": "nais,nais,naît,naissons,naissez,naissent", "conclure": "conclus,conclus,conclut,concluons,concluez,concluent", "dire": "dis,dis,dit,disons,dites,disent", "faire": "fais,fais,fait,faisons,faites,font" };
    const FAM = [["crire", "cris,cris,crit,crivons,crivez,crivent"], ["prendre", "prends,prends,prend,prenons,prenez,prennent"], ["mettre", "mets,mets,met,mettons,mettez,mettent"], ["venir", "viens,viens,vient,venons,venez,viennent"], ["tenir", "tiens,tiens,tient,tenons,tenez,tiennent"], ["faire", "fais,fais,fait,faisons,faites,font"], ["cevoir", "çois,çois,çoit,cevons,cevez,çoivent"], ["voir", "vois,vois,voit,voyons,voyez,voient"], ["courir", "cours,cours,court,courons,courez,courent"], ["battre", "bats,bats,bat,battons,battez,battent"], ["vivre", "vis,vis,vit,vivons,vivez,vivent"], ["suivre", "suis,suis,suit,suivons,suivez,suivent"], ["lire", "lis,lis,lit,lisons,lisez,lisent"], ["rire", "ris,ris,rit,rions,riez,rient"], ["uire", "uis,uis,uit,uisons,uisez,uisent"], ["aître", "ais,ais,aît,aissons,aissez,aissent"], ["eindre", "eins,eins,eint,eignons,eignez,eignent"], ["aindre", "ains,ains,aint,aignons,aignez,aignent"], ["oindre", "oins,oins,oint,oignons,oignez,oignent"], ["vrir", "vre,vres,vre,vrons,vrez,vrent"], ["frir", "fre,fres,fre,frons,frez,frent"], ["illir", "ille,illes,ille,illons,illez,illent"], ["dormir", "dors,dors,dort,dormons,dormez,dorment"], ["partir", "pars,pars,part,partons,partez,partent"], ["sortir", "sors,sors,sort,sortons,sortez,sortent"], ["sentir", "sens,sens,sent,sentons,sentez,sentent"], ["servir", "sers,sers,sert,servons,servez,servent"], ["mentir", "mens,mens,ment,mentons,mentez,mentent"]];
    const DBL = new Set(["appeler", "rappeler", "jeter", "rejeter", "épeler", "renouveler", "feuilleter", "projeter"]);
    function pres(inf) {
        if (IRR[inf])
            return IRR[inf].split(",");
        for (const [s, f] of FAM)
            if (inf.endsWith(s)) {
                const p = inf.slice(0, -s.length);
                return f.split(",").map(x => p + x);
            }
        if (/ir$/.test(inf)) {
            const st = inf.slice(0, -2);
            return [st + "is", st + "is", st + "it", st + "issons", st + "issez", st + "issent"];
        }
        if (/re$/.test(inf)) {
            const st = inf.slice(0, -2);
            return [st + "s", st + "s", st + (/[dt]$/.test(st) ? "" : "t"), st + "ons", st + "ez", st + "ent"];
        }
        const st = inf.slice(0, -2);
        let s1 = st, n = st + "ons";
        if (/g$/.test(st))
            n = st + "eons";
        if (/c$/.test(st))
            n = st.slice(0, -1) + "çons";
        if (DBL.has(inf))
            s1 = st + st.slice(-1);
        else if (/[^aeiouyéè]e[^aeiouyé]$/.test(st))
            s1 = st.replace(/e([^aeiouyé])$/, "è$1");
        else if (/é[^aeiouyé]+$/.test(st))
            s1 = st.replace(/é([^aeiouyé]+)$/, "è$1");
        else if (/[ou]y$/.test(st) || /ay$/.test(st))
            s1 = st.slice(0, -1) + "i";
        return [s1 + "e", s1 + "es", s1 + "e", n, st + "ez", s1 + "ent"];
    }
    const PPF = [["prendre", "pris"], ["mettre", "mis"], ["venir", "venu"], ["tenir", "tenu"], ["crire", "crit"], ["faire", "fait"], ["cevoir", "çu"], ["pouvoir", "pu"], ["vouloir", "voulu"], ["devoir", "dû"], ["savoir", "su"], ["voir", "vu"], ["courir", "couru"], ["battre", "battu"], ["vivre", "vécu"], ["suivre", "suivi"], ["lire", "lu"], ["boire", "bu"], ["croire", "cru"], ["dire", "dit"], ["rire", "ri"], ["uire", "uit"], ["naître", "né"], ["aître", "u"], ["eindre", "eint"], ["aindre", "aint"], ["oindre", "oint"], ["vrir", "vert"], ["frir", "fert"], ["mourir", "mort"], ["asseoir", "assis"], ["plaire", "plu"], ["pleuvoir", "plu"], ["falloir", "fallu"], ["être", "été"], ["avoir", "eu"]];
    function pp(inf) {
        for (const [s, f] of PPF)
            if (inf.endsWith(s))
                return inf.slice(0, -s.length) + f;
        if (/er$/.test(inf))
            return inf.slice(0, -2) + "é";
        if (/ir$/.test(inf))
            return inf.slice(0, -2) + "i";
        if (/re$/.test(inf))
            return inf.slice(0, -2) + "u";
        return inf;
    }
    const FUT = { "être": "ser", "avoir": "aur", "aller": "ir", "faire": "fer", "pouvoir": "pourr", "vouloir": "voudr", "devoir": "devr", "savoir": "saur", "courir": "courr", "mourir": "mourr", "envoyer": "enverr", "asseoir": "assiér", "pleuvoir": "pleuvr", "falloir": "faudr", "cueillir": "cueiller" };
    function futSt(inf) {
        if (FUT[inf])
            return FUT[inf];
        for (const [s, f] of [["venir", "viendr"], ["tenir", "tiendr"], ["faire", "fer"], ["cevoir", "cevr"], ["voir", "verr"]])
            if (inf.endsWith(s))
                return inf.slice(0, -s.length) + f;
        if (/re$/.test(inf))
            return inf.slice(0, -1);
        if (/er$/.test(inf) && !/é[^aeiouy]+er$/.test(inf)) {
            const p = pres(inf)[0];
            if (/è|ll|tt|ie$/.test(p))
                return p.slice(0, -1) + "er";
        }
        return inf;
    }
    function impf(inf, p) {
        const n = inf === "être" ? "étons" : pres(inf)[3];
        const st = n.slice(0, -3);
        return st + ["ais", "ais", "ait", "ions", "iez", "aient"][p];
    }
    const ETRE = new Set("aller venir arriver partir sortir entrer rester tomber naître mourir monter descendre rentrer retourner devenir revenir".split(" "));
    const RP = ["me", "te", "se", "nous", "vous", "se"], SP = ["je", "tu", "il", "nous", "vous", "ils"];
    /* une forme verbale : {pre:[ne, pronoms], v:"verbe conjugué", post:[pas, adverbes, participe ou infinitif]} */
    function vform(inf, tense, p, o) {
        o = o || {};
        let refl = false, core = inf.trim(), tail = "";
        const m = core.match(/^(?:se |s')(.+)$/);
        if (m) {
            refl = true;
            core = m[1];
        }
        const sp = core.indexOf(" ");
        if (sp > 0) {
            tail = core.slice(sp + 1);
            core = core.slice(0, sp);
        }
        const pre = [], post = [];
        if (o.neg)
            pre.push("ne");
        if (refl)
            pre.push(RP[p]);
        if (o.cl)
            pre.push(o.cl);
        let v;
        if (tense === "pc" || tense === "pqp") {
            const aux = (refl || ETRE.has(core)) ? "être" : "avoir";
            v = tense === "pc" ? pres(aux)[p] : impf(aux, p);
            let x = pp(core);
            if (aux === "être") {
                if (o.g === "f")
                    x += "e";
                if (p >= 3 && !/s$/.test(x))
                    x += "s";
            }
            if (o.neg)
                post.push(o.never ? "jamais" : "pas");
            if (o.adv)
                post.push(...o.adv);
            post.push(x);
        }
        else {
            v = tense === "fut" ? futSt(core) + ["ai", "as", "a", "ons", "ez", "ont"][p] : tense === "cond" ? futSt(core) + ["ais", "ais", "ait", "ions", "iez", "aient"][p] : tense === "imp" ? impf(core, p) : pres(core)[p];
            if (o.neg)
                post.push(o.never ? "jamais" : "pas");
            if (o.adv)
                post.push(...o.adv);
        }
        if (tail)
            post.push(tail);
        return { pre, v, post };
    }
    function infp(inf, p, o) {
        o = o || {};
        let refl = false, core = inf;
        const m = core.match(/^(?:se |s')(.+)$/);
        if (m) {
            refl = true;
            core = m[1];
        }
        return [(o.neg ? "ne pas" : ""), (refl ? RP[p] : ""), (o.cl || ""), core].filter(Boolean).join(" ");
    }
    /* ---------- lexique ---------- */
    let L = null, UNK = [];
    const NX = { "noodle": "une nouille", "noodles": "des nouilles (f)", "soda": "un soda", "manga": "un manga", "surfboard": "une planche de surf", "slope": "une piste", "goggles": "des lunettes de ski (f)", "can": "une canette", "steering wheel": "un volant", "wheel": "une roue", "thermometer": "un thermomètre", "backpack": "un sac à dos", "bookshop": "une librairie", "bookstore": "une librairie", "market": "un marché", "seat": "un siège", "video game": "un jeu vidéo", "video games": "des jeux vidéo (m)", "tv": "une télé", "cone": "un cornet", "bench": "un banc", "collar": "un collier", "leash": "une laisse", "lead": "une laisse", "tongue": "une langue", "fur": "des poils (m)", "paw": "une patte", "paws": "des pattes (f)", "basket": "un panier", "zoo": "un zoo", "bag": "un sac", "paper bag": "un sac en papier", "bunch": "un bouquet", "sport": "un sport", "fever": "de la fièvre", "comic": "une BD", "comics": "des BD (f)", "passenger": "un passager", "surf": "le surf", "wave": "une vague", "sky": "un ciel", "room": "une chambre", "bedroom": "une chambre", "mum": "maman (f)", "mom": "maman (f)", "dad": "papa (m)", "grandma": "mamie (f)", "grandpa": "papi (m)", "kai": "Kai (m)", "hamster": "un hamster", "cheese": "le fromage", "pet": "un animal de compagnie", "stuff": "des affaires (f)", "thing": "une chose", "things": "des choses (f)", "way": "un chemin", "friend": "un ami", "girlfriend": "une copine", "boyfriend": "un copain", "home": "une maison", "place": "un endroit", "noon": "midi", "night": "une nuit", "evening": "un soir", "weekend": "un week-end" };
    const AX = { "cute": "mignon / mignonne", "cool": "cool", "fun": "amusant(e)", "sunny": "ensoleillé(e)", "messy": "en désordre", "golden": "doré(e)", "tabby": "tigré(e)", "full": "plein(e)", "empty": "vide", "cold": "froid(e)", "hot": "chaud(e)", "sleepy": "endormi(e)", "sick": "malade", "favourite": "préféré(e)", "favorite": "préféré(e)", "best": "meilleur(e)", "good": "bon / bonne", "bad": "mauvais(e)", "great": "super", "nice": "gentil(le)", "delicious": "délicieux / délicieuse", "yummy": "délicieux / délicieuse", "fast": "rapide", "slow": "lent(e)", "high": "haut(e)", "low": "bas / basse", "last": "dernier / dernière", "first": "premier / première", "next": "prochain(e)", "other": "autre", "same": "même", "own": "propre", "snowy": "enneigé(e)", "wet": "mouillé(e)", "dry": "sec / sèche", "warm": "chaud(e)", "fresh": "frais / fraîche", "calm": "calme", "busy": "occupé(e)", "ready": "prêt(e)", "free": "libre", "alone": "seul(e)", "asleep": "endormi(e)", "awake": "réveillé(e)", "afraid": "effrayé(e)", "hungry": "affamé(e)", "thirsty": "assoiffé(e)", "brown": "marron", "orange": "orange", "pink": "rose", "grey": "gris(e)", "gray": "gris(e)", "big": "grand(e)", "huge": "énorme" };
    const VX = { stroke: "caresser", pet: "caresser", cuddle: "câliner", crouch: "s'accroupir", surf: "surfer", ski: "skier", hike: "faire de la randonnée", tidy: "ranger", relax: "se détendre", chill: "se détendre", cycle: "faire du vélo", smile: "sourire", sail: "faire de la voile", hug: "faire un câlin à", kick: "taper dans", look: "regarder", enjoy: "aimer", feel: "se sentir", get: "recevoir", rain: "pleuvoir", snow: "neiger", shop: "faire les courses", be: "être", have: "avoir", do: "faire", make: "faire", know: "savoir", lie: "s'allonger", sit: "s'asseoir", stand: "se lever", carry: "porter", hold: "tenir", love: "adorer", need: "avoir besoin de", skate: "faire du skate", swim: "nager", fly: "voler", ride: "monter sur", drive: "conduire", wear: "porter", start: "commencer", begin: "commencer", talk: "parler", speak: "parler", tell: "raconter", take: "prendre", bring: "apporter", put: "mettre", live: "habiter", teach: "apprendre", visit: "visiter", climb: "grimper", throw: "lancer", wash: "laver", brush: "brosser", clean: "nettoyer", win: "gagner", lose: "perdre", go: "aller", come: "venir", leave: "partir", stay: "rester", fall: "tomber", arrive: "arriver", return: "revenir", run: "courir", try: "essayer", help: "aider", finish: "finir", pay: "payer", cook: "cuisiner", meet: "rencontrer", hear: "entendre", cry: "pleurer", laugh: "rire", drink: "boire", eat: "manger", read: "lire", write: "écrire", draw: "dessiner", paint: "peindre", sing: "chanter", dance: "danser", jump: "sauter", walk: "marcher", play: "jouer", watch: "regarder", listen: "écouter", want: "vouloir", like: "aimer", hate: "détester", prefer: "préférer", buy: "acheter", sell: "vendre", sleep: "dormir", wake: "se réveiller", wait: "attendre", open: "ouvrir", close: "fermer", think: "penser", see: "voir", use: "utiliser", travel: "voyager", study: "étudier", learn: "apprendre", work: "travailler", give: "donner", say: "dire", find: "trouver", catch: "attraper", feed: "nourrir", touch: "toucher", show: "montrer", send: "envoyer", forget: "oublier", remember: "se souvenir de", decide: "décider", stop: "arrêter", keep: "garder", turn: "tourner", grow: "grandir", build: "construire" };
    const PHX = { "look at": "regarder", "look for": "chercher", "listen to": "écouter", "wait for": "attendre", "get up": "se lever", "wake up": "se réveiller", "sit down": "s'asseoir", "stand up": "se lever", "lie down": "s'allonger", "put on": "mettre", "take off": "enlever", "pick up": "ramasser", "go out": "sortir", "come back": "revenir", "go back": "retourner", "come in": "entrer", "go in": "entrer", "get dressed": "s'habiller", "take care of": "s'occuper de", "clean up": "ranger", "tidy up": "ranger", "turn on": "allumer", "turn off": "éteindre", "fall down": "tomber", "run away": "s'enfuir", "get on": "monter dans", "get off": "descendre de", "look after": "s'occuper de", "go to bed": "aller au lit", "go home": "rentrer à la maison", "come home": "rentrer à la maison", "get home": "rentrer à la maison", "play with": "jouer avec", "talk to": "parler à", "speak to": "parler à", "think about": "penser à", "dream of": "rêver de", "dream about": "rêver de", "laugh at": "rire de", "point at": "montrer du doigt" };
    const DX = { "the": "def", "a": "ind", "an": "ind", "one": "ind", "his": "son", "her": "son", "its": "son", "my": "mon", "your": "ton", "our": "notre", "their": "leur", "this": "ce", "that": "ce", "these": "ces", "those": "ces", "some": "part", "any": "part", "every": "chaque", "each": "chaque", "another": "autre", "no": "aucun" };
    const QN1 = { several: ["plusieurs", 1], much: ["beaucoup de", 0], few: ["peu de", 1], enough: ["assez de", 0], more: ["plus de", 0], less: ["moins de", 0], fewer: ["moins de", 1], most: ["la plupart des", 1], both: ["les deux", 1] };
    const NUM = { two: "deux", three: "trois", four: "quatre", five: "cinq", six: "six", seven: "sept", eight: "huit", nine: "neuf", ten: "dix", eleven: "onze", twelve: "douze", twenty: "vingt", hundred: "cent", many: "beaucoup de", lots: "beaucoup de" };
    const PRX = { "in": "dans", "on": "sur", "at": "à", "to": "à", "from": "de", "with": "avec", "without": "sans", "for": "pour", "of": "de", "by": "par", "under": "sous", "behind": "derrière", "in front of": "devant", "next to": "à côté de", "near": "près de", "between": "entre", "into": "dans", "onto": "sur", "out of": "hors de", "around": "autour de", "after": "après", "before": "avant", "during": "pendant", "like": "comme", "about": "sur", "up": "en haut de", "down": "en bas de", "across": "de l'autre côté de", "through": "à travers", "towards": "vers", "inside": "dans", "outside": "devant", "above": "au-dessus de", "over": "au-dessus de", "along": "le long de", "against": "contre", "because of": "à cause de", "thanks to": "grâce à", "far from": "loin de", "on top of": "sur", "instead of": "au lieu de" };
    const AVX = { "very": "très", "really": "vraiment", "so": "tellement", "too": "trop", "also": "aussi", "always": "toujours", "often": "souvent", "sometimes": "parfois", "usually": "d'habitude", "never": "jamais", "now": "maintenant", "today": "aujourd'hui", "together": "ensemble", "here": "ici", "there": "là", "well": "bien", "a lot": "beaucoup", "a little": "un peu", "a bit": "un peu", "still": "encore", "already": "déjà", "just": "juste", "again": "encore", "outside": "dehors", "inside": "dedans", "fast": "vite", "quickly": "vite", "home": "à la maison", "every day": "tous les jours", "every morning": "tous les matins", "in the morning": "le matin", "in the evening": "le soir", "at night": "la nuit", "at the weekend": "le week-end", "right now": "en ce moment", "at the moment": "en ce moment" };
    function nparse(fr) {
        fr = String(fr || "").replace(/^(un|une|le|la)\/(un|une|le|la)\s+/, "$1 ");
        let s = first(fr).trim();
        let g = "", pl = false;
        const par = (String(fr || "").split(/\s*\/\s*/)[0].match(/\(([^)]*)\)/g) || []).join(" ");
        if (/\bf\b/.test(par))
            g = "f";
        else if (/\bm\b/.test(par))
            g = "m";
        if (/\bpl\b/.test(par))
            pl = true;
        s = s.replace(/\s*\([^)]*\)/g, "").trim();
        let m;
        if ((m = s.match(/^(une|un|le|la|les|des|du|de la)\s+(.+)$/))) {
            const a = m[1];
            s = m[2];
            if (!g)
                g = (a === "une" || a === "la" || a === "de la") ? "f" : "m";
            if (a === "les" || a === "des")
                pl = true;
        }
        else if ((m = s.match(/^(l'|de l'|d')\s*(.+)$/)))
            s = m[2];
        return { n: s, g: g || "m", pl, prop: /^[A-Z]/.test(s) || /^(maman|papa|mamie|papi)$/.test(s) };
    }
    function aparse(fr) {
        const a = String(fr || "").split(/\s*\/\s*|,\s+/);
        let m0 = a[0].trim();
        const q = m0.match(/^([^(]*?)\((e|le|ne|se|te)\)(.*)$/);
        let m, f;
        if (q) {
            m = (q[1] + q[3]).replace(/\s*\([^)]*\)/g, "").trim();
            f = (q[1] + q[2] + q[3]).replace(/\s*\([^)]*\)/g, "").trim();
        }
        else {
            m = m0.replace(/\s*\([^)]*\)/g, "").trim();
            const a2 = (a[1] || "").replace(/\s*\([^)]*\)/g, "").trim();
            f = a2 && !/\(/.test(a[1]) && a2.slice(0, 2) === m.slice(0, 2) && !/^qui |^en /.test(m) ? a2 : (/e$/.test(m) || /^(qui |en |pas )/.test(m) || /^(super|cool|marron|orange)$/.test(m)) ? m : m + "e";
        }
        return { m, f };
    }
    function lex() {
        if (L)
            return L;
        L = { n: new Map(), a: new Map(), av: new Map(), con: new Map(), pr: new Map(), ph: new Map() };
        const addN = (k, fr, cat, t, ipl) => {
            k = k.toLowerCase();
            if (!L.n.has(k))
                L.n.set(k, Object.assign(nparse(fr), { cat, t, ipl }));
        };
        for (const [k, v] of Object.entries(NX))
            addN(k, v, "", /s$/.test(k) ? "p" : "c", false);
        for (const n of NDICT) {
            addN(n.w, n.fr, n.cat, n.t, false);
            const p = String(n.pl || "");
            if (p && p !== "—" && p.toLowerCase() !== n.w.toLowerCase())
                addN(p, n.fr, n.cat, n.t, true);
        }
        for (const [k, v] of Object.entries(AX))
            L.a.set(k, aparse(v));
        for (const a of ADJ.data)
            if (!L.a.has(a.w.toLowerCase()))
                L.a.set(a.w.toLowerCase(), aparse(a.fr));
        for (const a of ADV.data)
            L.av.set(a.w.toLowerCase(), clean(a.fr));
        for (const [k, v] of Object.entries(AVX))
            L.av.set(k, v);
        for (const c of CON.data)
            L.con.set(c.w.toLowerCase(), clean(c.fr));
        for (const p of PREP.data)
            L.pr.set(p.w.toLowerCase(), clean(p.fr));
        for (const [k, v] of Object.entries(PRX))
            L.pr.set(k, v);
        for (const p of PHR.data)
            L.ph.set(p.w.toLowerCase().replace(/\b(sb|sth|someone|something)\b/g, "").replace(/\s+/g, " ").trim(), clean(p.fr));
        for (const [k, v] of Object.entries(PHX))
            L.ph.set(k, v);
        return L;
    }
    function vinf(b) {
        if (VX[b])
            return VX[b];
        const d = DICT.find(x => x.v === b);
        return d ? clean(d.fr) : null;
    }
    function frPl(w) {
        const p = w.split(" "), h = p[0];
        let x = h;
        if (/[sxz]$/.test(h))
            x = h;
        else if (/al$/.test(h) && !/^(bal|festival|carnaval|chacal|récital)$/.test(h))
            x = h.slice(0, -2) + "aux";
        else if (/(eau|au|eu)$/.test(h) && !/^(pneu|bleu|landau)$/.test(h))
            x = h + "x";
        else if (/^(bijou|caillou|chou|genou|hibou|joujou|pou)$/.test(h))
            x = h + "x";
        else
            x = h + "s";
        p[0] = x;
        return p.join(" ");
    }
    let CMP = null;
    function cmpMap() {
        if (CMP)
            return CMP;
        CMP = new Map();
        const X = lex();
        CMP.set("better", { pre: "", a: { m: "meilleur", f: "meilleure" } });
        CMP.set("worse", { pre: "", a: { m: "pire", f: "pire" } });
        try {
            for (const d of ADJ.data) {
                if (d.cmp && /^[a-z]+$/.test(d.cmp) && !CMP.has(d.cmp) && X.a.has(d.w))
                    CMP.set(d.cmp, { pre: "plus", a: X.a.get(d.w) });
            }
        }
        catch (e) {
        }
        return CMP;
    }
    function aform(a, g, pl) {
        let x = g === "f" ? a.f : a.m;
        if (pl && !/^(qui |en |super|cool|marron|orange)/.test(x) && !/[sx]$/.test(x))
            x = /al$/.test(x) ? x.slice(0, -2) + "aux" : /eau$/.test(x) ? x + "x" : x + "s";
        return x;
    }
    const PRE = new Set("beau belle joli jolie grand grande petit petite gros grosse bon bonne mauvais mauvaise jeune vieux vieille nouveau nouvelle long longue haut haute premier première dernier dernière autre même meilleur meilleure super vrai vraie".split(" "));
    function det(k, g, pl, nx, o) {
        o = o || {};
        if (o.neg && /^(ind|part)$/.test(k))
            return vow(nx) ? "d'" : "de";
        switch (k) {
            case "def": return pl ? "les" : vow(nx) ? "l'" : g === "f" ? "la" : "le";
            case "ind": return pl ? "des" : g === "f" ? "une" : "un";
            case "part": return pl ? "des" : vow(nx) ? "de l'" : g === "f" ? "de la" : "du";
            case "son":
            case "mon":
            case "ton": {
                const b = k[0];
                return pl ? b + "es" : (g === "f" && !vow(nx)) ? b + "a" : b + "on";
            }
            case "notre": return pl ? "nos" : "notre";
            case "leur": return pl ? "leurs" : "leur";
            case "ce": return pl ? "ces" : g === "f" ? "cette" : vow(nx) ? "cet" : "ce";
            case "ces": return "ces";
            case "chaque": return "chaque";
            case "autre": return (g === "f" ? "une" : "un") + " autre";
            case "aucun": return g === "f" ? "aucune" : "aucun";
            default: return k;
        }
    }
    /* un groupe nominal à partir de w[i] : renvoie {s, j, g, pl, n} ou null */
    function np(w, i, o) {
        o = o || {};
        const X = lex();
        let j = i, dk = null, dpl = false, num = "", owner = "";
        const adv = [], adj = [];
        const two = (w[j] || "") + " " + (w[j + 1] || ""), three = two + " " + (w[j + 2] || "");
        if (three === "a lot of" || three === "a few of") {
            num = three === "a lot of" ? "beaucoup de" : "quelques-uns de";
            j += 3;
            dpl = three !== "a lot of";
        }
        else if (two === "lots of" || two === "plenty of") {
            num = "beaucoup de";
            j += 2;
        }
        else if (three === "a couple of") {
            num = "deux";
            j += 3;
            dpl = true;
        }
        else if (three === "a bit of") {
            num = "un peu de";
            j += 3;
        }
        else if (two === "too many" || two === "too much") {
            num = "trop de";
            j += 2;
            dpl = two === "too many";
        }
        else if (QN1[w[j]] && (X.n.has(w[j + 1] || "") || (X.a.has(w[j + 1] || "") && X.n.has(w[j + 2] || "")) || X.n.has((w[j + 1] || "") + " " + (w[j + 2] || "")))) {
            num = QN1[w[j]][0];
            dpl = !!QN1[w[j]][1];
            j++;
        }
        else if (two === "a few") {
            num = "quelques";
            j += 2;
            dpl = true;
        }
        else if (two === "a little" && !X.a.has(w[j + 2] || "")) {
            num = "un peu de";
            j += 2;
        }
        else if (two === "all the") {
            dk = "all";
            j += 2;
            dpl = true;
        }
        else if (DX[w[j]] && !(w[j] === "that" && o.subj === false)) {
            dk = DX[w[j]];
            if (w[j] === "these" || w[j] === "those")
                dpl = true;
            j++;
        }
        else if (NUM[w[j]] || /^\d+$/.test(w[j] || "")) {
            num = NUM[w[j]] || w[j];
            j++;
            dpl = true;
        }
        else if (w[j] && /'s$/.test(w[j])) {
            owner = w[j].slice(0, -2);
            dk = "def";
            j++;
        }
        if (!owner && w[j] && /'s$/.test(w[j]) && dk) {
            owner = w[j].slice(0, -2);
            j++;
        }
        while (j < w.length) {
            if (/^(very|really|so|too|quite|more|less)$/.test(w[j]) && X.a.has(w[j + 1] || "") && !(QN1[w[j]] && X.n.has(w[j + 2] || ""))) {
                adv.push(w[j] === "more" ? "plus" : w[j] === "less" ? "moins" : X.av.get(w[j]) || w[j]);
                j++;
                continue;
            }
            if (X.a.has(w[j]) && (o.pred && !dk && !num || !(X.n.has(w[j]) && !X.n.has(w[j + 1] || "") && !X.a.has(w[j + 1] || "")))) {
                adj.push({ a: X.a.get(w[j]), adv: adv.splice(0) });
                j++;
                continue;
            }
            break;
        }
        let n = null, nk = "", nl = 0;
        for (const len of [3, 2, 1]) {
            const k = w.slice(j, j + len).join(" ");
            if (w.slice(j, j + len).length === len && X.n.has(k)) {
                n = X.n.get(k);
                nk = k;
                nl = len;
                break;
            }
        }
        if (!n && w[j] && (dk || num || adj.length) && /^[a-z]+$/.test(w[j]) && !X.pr.has(w[j]) && !V0b(w[j]) && !X.av.has(w[j]) && !/^(and|or|but|so|because|when|then|too)$/.test(w[j])) {
            UNK.push(w[j]);
            n = { n: "<i>" + w[j] + "</i>", g: "m", pl: false, t: "c" };
            nk = w[j];
            nl = 1;
        }
        if (!n) {
            if (!adj.length)
                return null; /* adjectifs seuls */
            const s = adj.map(a => [...a.adv, aform(a.a, o.g || "m", o.pl)].join(" ")).join(" et ");
            return { s, j, g: o.g || "m", pl: !!o.pl, adjOnly: true };
        }
        j += nl;
        let mod = null; /* nom + nom : « football shirt » → « maillot de football » */
        for (const len of [3, 2, 1]) {
            const k = w.slice(j, j + len).join(" ");
            if (w.slice(j, j + len).length === len && X.n.has(k) && !X.a.has(k) && !/^(and|or)$/.test(k)) {
                mod = n;
                n = X.n.get(k);
                nk = k;
                j += len;
                break;
            }
        }
        const pl = dpl || n.ipl || n.pl || (nk.endsWith("s") && n.t === "p");
        let noun = n.n;
        if ((dpl || n.ipl) && !n.pl)
            noun = frPl(noun);
        const g = n.g;
        let s;
        const A = adj.map(a => ({ x: [...a.adv, aform(a.a, g, pl)].join(" "), pre: !a.adv.length && (PRE.has(a.a.m) || PRE.has(a.a.f)) }));
        const pre = A.filter(a => a.pre).map(a => a.x), post = A.filter(a => !a.pre).map(a => a.x);
        let core = [...pre, noun, ...post].join(" ");
        if (mod)
            core += " de " + mod.n;
        const head = pre.length ? pre[0] : noun;
        if (n.prop && !dk && !num)
            s = noun;
        else if (num)
            s = num + " " + core;
        else if (dk === "all")
            s = (g === "f" ? "toutes les " : "tous les ") + core;
        else if (o.bare === "none" && !dk)
            s = core;
        else if (dk)
            s = det(dk, g, pl, head, o) + " " + core;
        else {
            /* sans déterminant en anglais */ const k = o.bare && o.bare !== "prep" ? o.bare : (pl ? "ind" : n.t === "u" ? "part" : "def");
            s = det(k, g, pl, head, o) + " " + core;
        }
        if (owner) {
            const on = owner === "kai" ? null : X.n.get(owner);
            s += " de " + (owner === "kai" ? "Kai" : on ? (on.prop ? on.n : det("def", on.g, false, on.n) + " " + on.n) : owner);
        }
        return { s: s.replace(/' /g, "'"), j, g, pl, n: nk };
    }
    /* ---------- une proposition ---------- */
    const PERS = { "i": [0, "m"], "you": [1, "m"], "he": [2, "m"], "she": [2, "f"], "it": [2, "m"], "we": [3, "m"], "they": [5, "m"], "kai": [2, "m"], "everybody": [2, "m"], "everyone": [2, "m"], "nobody": [2, "m"], "this": [2, "m"], "that": [2, "m"] };
    const SUBJFR = { "i": "je", "you": "tu", "he": "il", "she": "elle", "it": "il", "we": "nous", "they": "ils", "kai": "Kai", "everybody": "tout le monde", "everyone": "tout le monde", "nobody": "personne", "this": "c'", "that": "ça" };
    const BEAV = { hungry: "faim", thirsty: "soif", scared: "peur", afraid: "peur", cold: "froid", hot: "chaud", sleepy: "sommeil", right: "raison", wrong: "tort" };
    const WEA = { sunny: "il fait beau", hot: "il fait chaud", cold: "il fait froid", warm: "il fait bon", nice: "il fait beau", windy: "il y a du vent", cloudy: "il y a des nuages", foggy: "il y a du brouillard", rainy: "il pleut", snowy: "il neige", dark: "il fait nuit", late: "il est tard", early: "il est tôt" };
    const STATIVE = { sit: "assis", lie: "allongé", stand: "debout", crouch: "accroupi" };
    const CATP = { start: "à", begin: "à", learn: "à", help: "à", try: "de", stop: "de", decide: "de", forget: "de", finish: "de", refuse: "de", need: "", want: "", like: "", love: "", hate: "", prefer: "", enjoy: "", go: "", hope: "" };
    const OBJ = { him: "le", her: "la", it: "le", them: "les", me: "me", you: "te", us: "nous" }, STR = { him: "lui", her: "elle", it: "ça", them: "eux", me: "moi", you: "toi", us: "nous" };
    const IND = new Set("give tell show send offer bring write say".split(" "));
    const GAMES = new Set("game,games,video game,video games,cards,chess,football,basketball,tennis,rugby,volleyball,handball,golf,hockey,hide-and-seek,tag,board games,cards".split(","));
    const INSTR = new Set("piano guitar violin drums flute trumpet cello harp saxophone recorder clarinet keyboard bass".split(" "));
    function rest(w, i, ctx, unk) {
        /* le reste de la proposition, mot à mot avec des règles simples */ const X = lex(), out = [];
        let j = i;
        while (j < w.length) {
            const t = w[j];
            if (t === "") {
                j++;
                continue;
            }
            // préposition (plusieurs mots d'abord)
            let pk = null;
            for (const len of [3, 2, 1]) {
                const k = w.slice(j, j + len).join(" ");
                if (w.slice(j, j + len).length === len && X.pr.has(k) && !(len === 1 && /^(up|down|like|outside|inside|over)$/.test(k) && !np(w, j + 1))) {
                    pk = k;
                    break;
                }
            }
            if (pk && !(pk === "to" && w[j + 1] && V0b(w[j + 1]))) {
                let pr = X.pr.get(pk);
                if (ctx.depuis && (pk === "since" || pk === "for"))
                    pr = "depuis";
                const k2 = pk.split(" ").length;
                const nx = w[j + k2];
                if (OBJ[nx] && !(nx === "her" && np(w, j + k2 + 1))) {
                    out.push(pr + " " + STR[nx]);
                    j += k2 + 1;
                    continue;
                }
                if (nx && ingB(nx)) {
                    const f = vinf(ingB(nx)) || nx;
                    out.push(pk === "before" ? "avant de " + infp(f, ctx.p) : pk === "after" && !/^(se |s')/.test(f) ? "après avoir " + pp(f.split(" ")[0]) : (pk === "without" ? "sans" : pk === "for" ? "pour" : pr) + " " + infp(f, ctx.p));
                    j += k2 + 1;
                    continue;
                }
                const g = np(w, j + k2, { bare: pk === "of" ? "none" : "prep" });
                if (g) {
                    let p2 = pr;
                    const vh = /^(plane|train|bus|boat|car|taxi|tram|lorry|truck|van|coach|metro|underground)s?$/.test(g.n);
                    if (pk === "on" && vh)
                        p2 = "dans";
                    if (pk === "out of" && /^(window|door)s?$/.test(g.n))
                        p2 = "par";
                    if (pk === "by" && vh) {
                        out.push((g.n === "bike" || g.n === "bicycle" ? "à vélo" : "en " + g.s.replace(/^(le |la |l'|un |une )/, "")));
                        j = g.j;
                        continue;
                    }
                    if (pk === "by" && /^(bike|bicycle|horse)$/.test(g.n)) {
                        out.push(g.n === "horse" ? "à cheval" : "à vélo");
                        j = g.j;
                        continue;
                    }
                    if (pk === "at" && g.n === "home" || pk === "in" && g.n === "bed" && !/^(his|her|my|the)/.test(w[j + k2])) {
                        out.push(g.n === "home" ? "à la maison" : "au lit");
                        j = g.j;
                        continue;
                    }
                    out.push(p2 + " " + g.s);
                    j = g.j;
                    continue;
                }
                if (AVX[nx] || X.av.has(nx)) {
                    out.push(pr);
                    j += k2;
                    continue;
                }
                out.push(pr);
                j += k2;
                continue;
            }
            // to + verbe : « pour » + infinitif
            if (t === "to" && w[j + 1] && V0b(w[j + 1])) {
                const f = vinf(V0b(w[j + 1]));
                if (f) {
                    const r = sub(w, j + 2, f, ctx, unk);
                    out.push("pour " + r);
                    j = w.length;
                    continue;
                }
            }
            // pronom complément
            if (OBJ[t] && !(t === "her" && np(w, j + 1))) {
                out.push(STR[t]);
                j++;
                continue;
            }
            // adverbes (plusieurs mots d'abord)
            let ak = null;
            for (const len of [3, 2, 1]) {
                const k = w.slice(j, j + len).join(" ");
                if (w.slice(j, j + len).length === len && (AVX[k] || X.av.has(k)) && !(len === 1 && X.a.has(k) && np(w, j)) && !(len === 1 && X.n.has(k) && np(w, j) && !AVX[k]) && !(len === 1 && QN1[k] && np(w, j))) {
                    ak = k;
                    break;
                }
            }
            if (ak && / of$/.test(ak))
                ak = null;
            if (ak && !(ak === "too" && j < w.length - 1)) {
                out.push(ak === "too" ? "aussi" : (AVX[ak] || X.av.get(ak)));
                j += ak.split(" ").length;
                continue;
            }
            if (t === "and" || t === "or") {
                out.push(t === "and" ? "et" : "ou");
                j++;
                continue;
            }
            if (t === "than") {
                out.push("que");
                j++;
                continue;
            }
            const g = np(w, j, { neg: ctx.negObj, bare: ctx.bare, g: ctx.g, pl: ctx.pl, pred: ctx.pred });
            if (g) {
                out.push(g.s);
                if (ctx.negObj)
                    ctx.negObj = false;
                ctx.bare = null;
                j = g.j;
                continue;
            }
            if (/^\d+$/.test(t)) {
                out.push(t);
                j++;
                continue;
            }
            if (DX[t] && w[j + 1]) {
                out.push(det(DX[t], "m", false, w[j + 1]));
                j++;
                continue;
            }
            if (V0b(t)) {
                const f = vinf(V0b(t));
                if (f) {
                    out.push(infp(f, ctx.p));
                    j++;
                    continue;
                }
            }
            if (t === "'s" || t === "of") {
                out.push("de");
                j++;
                continue;
            }
            if (typeof TK_NAMES !== "undefined" && TK_NAMES.has(t)) {
                const CY = { london: "Londres", edinburgh: "Édimbourg", paris: "Paris", tokyo: "Tokyo", rome: "Rome", madrid: "Madrid", berlin: "Berlin", lyon: "Lyon", marseille: "Marseille", dublin: "Dublin", manchester: "Manchester", liverpool: "Liverpool", york: "York" };
                if (CY[t]) {
                    if (out[out.length - 1] === "dans")
                        out[out.length - 1] = "à";
                    out.push(CY[t]);
                }
                else
                    out.push(t[0].toUpperCase() + t.slice(1));
                j++;
                continue;
            }
            unk.push(t);
            out.push("<i>" + t + "</i>");
            j++;
        }
        return out.join(" ");
    }
    let V0 = null;
    function V0b(x) {
        if (!V0)
            V0 = tkVerbs();
        const r = V0.get(x);
        return r ? r.b : null;
    }
    function ingB(x) {
        if (!V0)
            V0 = tkVerbs();
        const r = V0.get(x);
        return r && r.t === "ing" ? r.b : null;
    }
    /* un infinitif et la suite (« aime jouer au foot ») */
    function sub(w, i, f, ctx, unk) {
        const r = rest(w, i, Object.assign({}, ctx, { negObj: false }), unk);
        return infp(f, ctx.p) + (r ? " " + r : "");
    }
    function clause(c, unk) {
        /* c : {w, vi, vEnd, implied, sp (personne si sujet sous-entendu)} */ const X = lex(), w = c.w, vi = c.vi;
        let vEnd = c.vEnd;
        if (vi >= 0) {
            while (vEnd < w.length && /^(not|never)$/.test(w[vEnd]))
                vEnd++;
            while (vEnd - 1 > vi && QN1[w[vEnd - 1]] && w[vEnd] && (X.n.has(w[vEnd]) || X.a.has(w[vEnd])))
                vEnd--;
        }
        if (vi < 0) {
            return rest(w, 0, { p: 2 }, unk);
        }
        // sujet
        let subj = "", p = 2, g = "m", pl = false, isIt = false, isThere = false;
        if (c.implied) {
            p = c.sp ? c.sp.p : 2;
            g = c.sp ? c.sp.g : "m";
        }
        else {
            const S = w.slice(0, vi);
            if (S.length === 1 && PERS[S[0]]) {
                p = PERS[S[0]][0];
                g = PERS[S[0]][1];
                subj = SUBJFR[S[0]];
                isIt = S[0] === "it";
            }
            else if (S.length === 1 && S[0] === "there") {
                isThere = true;
            }
            else {
                const parts = [];
                let k = 0, n = 0;
                while (k < S.length) {
                    if (S[k] === "and") {
                        k++;
                        n++;
                        parts.push("et");
                        continue;
                    }
                    if (PERS[S[k]] && !(/^(this|that)$/.test(S[k]) && S[k + 1] && np(S, k))) {
                        parts.push(SUBJFR[S[k]] === "je" ? "moi" : SUBJFR[S[k]] === "tu" ? "toi" : SUBJFR[S[k]] === "il" ? "lui" : SUBJFR[S[k]]);
                        if (S[k] === "i")
                            p = 3;
                        k++;
                        continue;
                    }
                    const G = np(S, k, { subj: true });
                    if (G) {
                        parts.push(G.s);
                        g = G.g;
                        pl = G.pl;
                        k = G.j;
                    }
                    else if (typeof TK_NAMES !== "undefined" && TK_NAMES.has(S[k])) {
                        parts.push(S[k][0].toUpperCase() + S[k].slice(1));
                        k++;
                    }
                    else {
                        unk.push(S[k]);
                        parts.push("<i>" + S[k] + "</i>");
                        k++;
                    }
                }
                subj = parts.join(" ").replace(/ et /g, " et ").replace(/(\S) (?!et\b)(?=\S)/g, "$1 ");
                subj = parts.reduce((a, x, i) => a + (i === 0 ? x : (x === "et" || parts[i - 1] === "et" ? " " : ", ") + x), "");
                if (n > 0) {
                    p = p === 3 ? 3 : 5;
                    pl = true;
                }
                else {
                    p = pl ? 5 : 2;
                }
                if (n > 0 && p === 5)
                    g = "m";
            }
        }
        c.sp = { p, g };
        // groupe verbal
        const vg = w.slice(vi, vEnd), R = w.slice(vEnd);
        const neg = vg.includes("not") || vg.includes("never"), never = vg.includes("never");
        const advs = vg.filter(x => !/^(not|never)$/.test(x) && (AVX[x] || X.av.has(x)) && !V0b(x)).map(x => AVX[x] || X.av.get(x));
        const vs = vg.filter(x => V0b(x) && !/^(not|never)$/.test(x) && !(AVX[x] && !V0.get(x)));
        if (!vs.length)
            return [subj, rest(w, vi, { p }, unk)].filter(Boolean).join(" ");
        const x0 = vs[0], last = vs[vs.length - 1], B0 = V0b(x0), T0 = V0.get(x0).t;
        let tense = "pres", main = B0, mod = null;
        const BE = /^(am|is|are|was|were|be|being|been)$/, past0 = /^(was|were|did|had|could|would)$/.test(x0) || T0 === "past";
        if (BE.test(x0) && vs.length > 1 && V0.get(last).t === "ing") {
            main = V0b(last);
            tense = /^(was|were)$/.test(x0) ? "imp" : "pres";
        }
        else if (BE.test(x0) && vg.includes("going") && vs.length > 2) {
            mod = { inf: "aller", tense: /^(was|were)$/.test(x0) ? "imp" : "pres" };
            main = V0b(last);
        }
        else if (BE.test(x0) && vs.length > 1 && V0.get(last).t === "past") {
            main = "être";
            tense = /^(was|were)$/.test(x0) ? "imp" : "pres";
            R.unshift("__pp:" + V0b(last));
        }
        else if (BE.test(x0)) {
            main = "être";
            tense = /^(was|were)$/.test(x0) ? "imp" : "pres";
        }
        else if (T0 === "modal") {
            const M = { can: ["pouvoir", "pres"], could: ["pouvoir", "imp"], must: ["devoir", "pres"], should: ["devoir", "cond"], may: ["pouvoir", "cond"], might: ["pouvoir", "cond"] };
            main = vs.length > 1 ? V0b(last) : "faire";
            if (x0 === "will" || x0 === "shall")
                tense = "fut";
            else if (x0 === "would") {
                tense = "cond";
                if (main === "like") {
                    main = "want";
                }
            }
            else
                mod = { inf: M[x0][0], tense: M[x0][1] };
        }
        else if (B0 === "do" && vs.length > 1) {
            main = V0b(last);
            tense = x0 === "did" ? "pc" : "pres";
        }
        else if (B0 === "have" && vs.includes("been") && vs.length > 2 && V0.get(last).t === "ing") {
            main = V0b(last);
            tense = x0 === "had" ? "imp" : "pres";
        }
        else if (B0 === "have" && vs.length > 1 && last === "been") {
            main = "être";
            tense = x0 === "had" ? "pqp" : "pc";
        }
        else if (B0 === "have" && vs.length > 1 && V0.get(last).t === "past" && last !== "got") {
            main = V0b(last);
            tense = x0 === "had" ? "pqp" : "pc";
        }
        else if (B0 === "have") {
            main = "have";
            tense = x0 === "had" ? "imp" : "pres";
        }
        else {
            main = B0;
            tense = T0 === "past" ? (/^(be|have|like|love|want|know|think|hate|need|seem|feel)$/.test(B0) ? "imp" : "pc") : "pres";
        }
        // « depuis » : present perfect + since / for → présent en français (il habite ici depuis 2020)
        const depuis = /^(have|has)$/.test(x0) && R.some((x, i) => (x === "since" || (x === "for" && /^(a|an|one|two|three|four|five|six|seven|eight|nine|ten|twenty|several|many|\d+|ages)$/.test(R[i + 1] || ""))));
        if (depuis && tense === "pc")
            tense = "pres";
        // locutions
        let inf = vinf(main) || main, eat = 0, cl = "", special = null, R2 = R.slice();
        const two = (R2[0] || "") + " " + (R2[1] || "");
        for (const len of [3, 2, 1]) {
            const k = [main, ...R2.slice(0, len)].join(" ");
            if (R2.length >= len && X.ph.has(k) && !(len === 1 && /^(on|in|off|up|down|out)$/.test(R2[0]) && np(R2, 1) && !/^(put on|take off|get on|get off|turn on|turn off|pick up)$/.test(k))) {
                inf = X.ph.get(k);
                eat = len;
                break;
            }
        }
        R2 = R2.slice(eat);
        if (eat && /\s(avec|à|de|sur|dans|pour|contre)$/.test(inf) && OBJ[R2[0]] && !(R2[0] === "her" && np(R2, 1))) {
            special = STR[R2[0]];
            R2 = R2.slice(1);
        }
        if (main === "walk" && /^(dog|dogs|puppy|pet)$/.test((np(R2, 0) || {}).n || ""))
            inf = "promener";
        if (IND.has(main) && !eat) {
            const a = np(R2, 0);
            if (a && !OBJ[R2[0]]) {
                const b2 = np(R2, a.j);
                if (b2)
                    R2 = [...R2.slice(a.j, b2.j), "to", ...R2.slice(0, a.j), ...R2.slice(b2.j)];
            }
        }
        if (main === "look" && !eat && R2[0] && (X.a.has(R2[0]) || /^(very|so|really)$/.test(R2[0]))) {
            inf = "avoir l'air";
        }
        if (main === "ride" && (np(R2, 0) || {}).n && /^(bike|bicycle|horse|pony)s?$/.test(np(R2, 0).n)) {
            inf = /horse|pony/.test(np(R2, 0).n) ? "faire du cheval" : "faire du vélo";
            R2 = R2.slice(np(R2, 0).j);
        }
        if (main === "play" && !eat && R2.length) {
            const G = np(R2, 0);
            if (G && (GAMES.has(G.n) || (X.n.get(G.n) || {}).cat === "sports")) {
                inf = "jouer";
                const D = np(R2, 0, { bare: "def" });
                const s = D.s.replace(/^(un |une |des |son |sa |ses |mon |ma |mes )/, (m) => /^(un |une )/.test(m) ? (/^un /.test(m) ? "le " : "la ") : /^des /.test(m) ? "les " : m);
                special = "à " + s;
                R2 = R2.slice(G.j);
            }
            else if (G && INSTR.has(G.n)) {
                inf = "jouer";
                const D = np(R2, 0, { bare: "def" });
                special = "de " + D.s.replace(/^(un |une |son |sa |mon |ma )/, (m) => /^un |^son |^mon /.test(m) ? "le " : "la ");
                R2 = R2.slice(G.j);
            }
        }
        if (/^(brush|wash|comb|dry)$/.test(main) && /^(his|her|my|your|their|our)$/.test(R2[0] || "") && /^(teeth|tooth|hair|hands|hand|face|feet)$/.test(R2[1] || "")) {
            inf = "se " + vinf(main);
            R2[0] = "the";
        }
        if (main === "have" && !neg) {
            const MEAL = { breakfast: "prendre le petit-déjeuner", lunch: "déjeuner", dinner: "dîner", fun: "s'amuser", tea: "goûter" };
            const k = R2[0] === "a" || R2[0] === "his" ? R2[1] : R2[0];
            if (MEAL[R2[0]]) {
                inf = MEAL[R2[0]];
                R2 = R2.slice(1);
            }
            else if (R2[0] === "a" && /^(shower|bath|rest|temperature|cold|fever|good)$/.test(R2[1] || "")) {
                inf = { shower: "prendre une douche", bath: "prendre un bain", rest: "se reposer", temperature: "avoir de la fièvre", fever: "avoir de la fièvre", cold: "avoir un rhume", good: "passer un bon moment" }[R2[1]];
                R2 = R2.slice(R2[1] === "good" ? 3 : 2);
            }
        }
        if (main === "go" && R2[0] && /ing$/.test(R2[0])) {
            const GO = { skiing: "faire du ski", swimming: "aller nager", shopping: "faire les courses", hiking: "faire de la randonnée", surfing: "faire du surf", fishing: "aller à la pêche", camping: "faire du camping", cycling: "faire du vélo", running: "aller courir", sailing: "faire de la voile", skating: "faire du patin" };
            if (GO[R2[0]]) {
                inf = GO[R2[0]];
                R2 = R2.slice(1);
            }
        }
        // être : cas particuliers
        if (main === "être" && !mod && tense !== "fut" && tense !== "cond" && R2[0] && !/^__pp/.test(R2[0])) {
            if (isThere) {
                const s = (neg ? "il n'y " : "il y ") + (tense === "imp" ? "avait" : "a") + (neg ? " pas" : "");
                const r = rest(R2, 0, { p: 2, negObj: neg }, unk);
                return (s + " " + r).trim();
            }
            if (isIt) {
                let k = 0;
                if (/^(very|so|really)$/.test(R2[0]))
                    k = 1;
                if (WEA[R2[k]] && R2.length === k + 1 && !(c.k > 0 && /^(nice|hot|cold|warm|dark|late|early)$/.test(R2[k]))) {
                    let s = WEA[R2[k]];
                    if (k)
                        s = s.replace(/(beau|chaud|froid|bon|nuit|tard|tôt)$/, (AVX[R2[0]] || "très") + " $1");
                    if (tense === "imp")
                        s = s.replace(/fait/, "faisait").replace(/y a/, "y avait").replace(/pleut/, "pleuvait").replace(/neige/, "neigeait").replace(/est /, "était ");
                    if (neg)
                        s = s.replace(/^il (y )?(\S+)/, (m, y, v) => "il " + (y ? "n'y " : "ne ") + v + " pas").replace(/ne (est|était)/, "n'$1");
                    return s;
                }
            }
            {
                let k = 0;
                const ad = [];
                while (/^(very|really|so|quite)$/.test(R2[k] || "")) {
                    ad.push(AVX[R2[k]] || "");
                    k++;
                }
                const GA = { good: ["doué", "douée"], great: ["très doué", "très douée"], brilliant: ["très doué", "très douée"], bad: ["nul", "nulle"], terrible: ["très nul", "très nulle"] }[R2[k]];
                if (GA && R2[k + 1] === "at" && R2[k + 2]) {
                    const nx = R2.slice(k + 2), ib = ingB(nx[0]);
                    let tail;
                    if (ib)
                        tail = "pour " + sub(nx, 1, vinf(ib) || nx[0], { p, g }, unk);
                    else {
                        const G = np(nx, 0, { bare: "none" });
                        tail = "en " + (G ? G.s + (G.j < nx.length ? " " + rest(nx, G.j, { p }, unk) : "") : rest(nx, 0, { p }, unk));
                    }
                    const F = vform("être", tense, p, { neg, never, adv: advs });
                    return [subj, ...F.pre, F.v, ...F.post, [...ad, GA[g === "f" ? 1 : 0] + (p >= 3 ? "s" : "")].join(" ").trim(), tail].filter(Boolean).join(" ");
                }
            }
            {
                let pre = null, a = null, k2 = 0;
                const CM = cmpMap();
                if (/^(more|less)$/.test(R2[0]) && X.a.has(R2[1] || "") && R2[2] === "than") {
                    pre = R2[0] === "more" ? "plus" : "moins";
                    a = X.a.get(R2[1]);
                    k2 = 3;
                }
                else if (R2[0] === "as" && X.a.has(R2[1] || "") && R2[2] === "as") {
                    pre = "aussi";
                    a = X.a.get(R2[1]);
                    k2 = 3;
                }
                else if (CM.has(R2[0]) && R2[1] === "than") {
                    const c0 = CM.get(R2[0]);
                    pre = c0.pre;
                    a = c0.a;
                    k2 = 2;
                }
                if (a) {
                    const F = vform("être", tense, p, { neg, never, adv: advs }), tail = rest(R2.slice(k2), 0, { p }, unk), q = vow(tail.replace(/^<i>/, "")) ? "qu'" : "que ";
                    return ([subj, ...F.pre, F.v, ...F.post, (pre ? pre + " " : "") + aform(a, g, p >= 3)].join(" ") + " " + q + tail).replace("qu' ", "qu'");
                }
            }
            let k = 0, ad = "";
            if (/^(very|so|really)$/.test(R2[0]) && BEAV[R2[1]]) {
                ad = AVX[R2[0]] + " ";
                k = 1;
            }
            if (!c.implied && vi === 1 && /^(he|she)$/.test(w[0]) && /^(a|an)$/.test(R2[0]) && R2.length === 2) {
                const N2 = X.n.get(R2[1]);
                if (N2 && /^(jobs|family)$/.test(N2.cat)) {
                    const F = vform("être", tense, p, { neg, never, adv: advs });
                    return [subj, ...F.pre, F.v, ...F.post, N2.n].join(" ");
                }
            }
            if (!c.implied && vi === 1 && /^(he|she|it|this|that)$/.test(w[0]) && /^(a|an)$/.test(R2[0]))
                subj = neg ? "ce" : "c'";
            if (BEAV[R2[k]] && !isIt && R2.length === k + 1) {
                const F = vform("avoir", tense, p, { neg, never, adv: advs });
                return [subj, ...F.pre, F.v, ...F.post, ad + BEAV[R2[k]]].join(" ");
            }
            if (/^\d+$|^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen)$/.test(R2[0]) && R2[1] === "years") {
                const F = vform("avoir", tense, p, { neg, never, adv: advs });
                return [subj, ...F.pre, F.v, ...F.post, (NUM[R2[0]] || R2[0]) + " ans"].join(" ");
            }
        }
        // pronom complément
        if (R2[0] && OBJ[R2[0]] && !(R2[0] === "her" && np(R2, 1)) && main !== "être") {
            cl = IND.has(main) ? (R2[0] === "them" ? "leur" : /^(me|you|us)$/.test(R2[0]) ? OBJ[R2[0]] : "lui") : OBJ[R2[0]];
            R2 = R2.slice(1);
        }
        // verbe + infinitif (« likes playing », « wants to eat »)
        let inf2 = null;
        if (!special && R2[0] === "to" && R2[1] && V0b(R2[1]) && CATP[main] !== undefined) {
            inf2 = { f: vinf(V0b(R2[1])), p: CATP[main] };
            R2 = R2.slice(2);
        }
        else if (!special && R2[0] && ingB(R2[0]) && CATP[main] !== undefined && main !== "go") {
            inf2 = { f: vinf(ingB(R2[0])), p: CATP[main] };
            R2 = R2.slice(1);
        }
        // stative : « is sitting » → « est assis »
        let F;
        const ST = STATIVE[main];
        if (ST && BE.test(x0) && vs.length > 1 && V0.get(last).t === "ing") {
            F = vform("être", tense, p, { neg, never, adv: advs });
            F.post.push(ST + (g === "f" ? "e" : "") + (p >= 3 ? "s" : ""));
        }
        else if (mod) {
            F = vform(mod.inf, mod.tense, p, { neg, never, adv: advs });
            F.post.push(infp(inf, p, { cl }));
        }
        else
            F = vform(inf, tense, p, { neg, never, adv: advs, cl, g });
        if (cl && mod)
            F.pre = F.pre.filter(x => x !== cl);
        // participe passé après « être » (voix passive)
        if (R2[0] && /^__pp:/.test(R2[0])) {
            const b = R2.shift().slice(5);
            let x = pp(vinf(b) || b);
            if (g === "f")
                x += "e";
            if (p >= 3 && !/s$/.test(x))
                x += "s";
            F.post.push(x);
        }
        if (inf2 && inf2.f) {
            F.post.push(((inf2.p ? inf2.p + " " : "") + infp(inf2.f, p)).trim());
        }
        if (special)
            F.post.push(special);
        const r = rest(R2, 0, { p, g, pl, depuis, pred: main === "être", negObj: neg && main !== "être", bare: /^(like|love|hate|prefer|enjoy)$/.test(main) && !inf2 ? "def" : null }, unk);
        return [subj, ...F.pre, F.v, ...F.post, r].filter(Boolean).join(" ");
    }
    function fix(s) {
        return s.replace(/\s+/g, " ").replace(/(^|\s)à les(?=\s|$)/g, "$1aux").replace(/(^|\s)à le(?=\s|$)/g, "$1au").replace(/(^|\s)des autres(?=\s)/g, "$1d'autres").replace(/\bde les\b/g, "des").replace(/\bde le\b/g, "du").replace(/\bde (des|de)\b/g, "de").replace(/\bde (un|une)\b/g, "d'$1")
            .replace(/\b(je|me|te|se|ne|de|le|la|que|jusque) ([aeiouyéèêàâîïôûh]\S*)/gi, (m, a, b) => HASP.test(b.toLowerCase()) ? m : a.slice(0, -1) + "'" + b)
            .replace(/\bsi (il|ils)\b/g, "s'$1").replace(/' /g, "'").replace(/ ,/g, ",").replace(/ \./g, ".").trim();
    }
    /* plusieurs phrases, plusieurs propositions reliées par des connecteurs */
    const CONF = { "and": "et", "but": "mais", "or": "ou", "so": "donc", "then": "puis", "and then": "et puis", "yet": "pourtant", "because": "parce que", "when": "quand", "while": "pendant que", "if": "si", "although": "même si", "though": "même si", "even though": "même si", "whereas": "alors que", "as soon as": "dès que", "before": "avant que", "after": "après que", "until": "jusqu'à ce que", "since": "depuis que", "so that": "pour que", "unless": "sauf si", "as": "comme", "once": "une fois que", "that's why": "c'est pourquoi", "however": "cependant", "first": "d'abord", "firstly": "d'abord", "next": "ensuite", "finally": "enfin", "also": "aussi", "moreover": "de plus", "therefore": "donc", "besides": "en plus", "afterwards": "ensuite", "for example": "par exemple", "in conclusion": "pour conclure", "of course": "bien sûr", "in fact": "en fait", "suddenly": "soudain", "later": "plus tard" };
    function sentences(S) {
        const unk = UNK = [];
        const out = S.map(sn => {
            let sp = null;
            const parts = sn.parts.map((pt, k) => {
                if (pt.implied && sp)
                    pt.sp = sp;
                pt.k = k;
                let s = clause(pt, unk);
                if (!pt.implied)
                    sp = pt.sp;
                else
                    pt.sp = sp;
                const c = pt.con ? (CONF[pt.con.en] || lex().con.get(pt.con.en) || pt.con.en) : "";
                return { s, c, comma: pt.comma || (pt.con && pt.con.k === "intro" && /^(however|first|firstly|secondly|finally|moreover|furthermore|therefore|besides|for example|in conclusion|of course|in fact|first of all)$/.test(pt.con.en)), lead: pt.lead, k };
            });
            let txt = "";
            parts.forEach((x, k) => {
                if (k === 0) {
                    txt = (x.c ? x.c + (x.comma ? ", " : " ") : "") + x.s;
                    if (x.lead && parts.length > 1)
                        txt += ",";
                }
                else if (!x.c && !parts[k - 1].lead) {
                    txt += ". " + x.s.charAt(0).toUpperCase() + x.s.slice(1);
                }
                else {
                    txt += (parts[k - 1].lead ? " " : x.comma ? ", " : " ") + (x.c ? x.c + " " : "") + x.s;
                }
            });
            if (sn.q)
                txt = "est-ce que " + txt;
            txt = fix(txt);
            return txt.charAt(0).toUpperCase() + txt.slice(1) + (sn.end === "?" ? " ?" : sn.end === "!" ? " !" : ".");
        });
        return { fr: out.join(" "), unk: [...new Set(unk)] };
    }
    return { sentences, pres, pp, vform, lex, conFr: en => CONF[en] || lex().con.get(en) || "" };
})();
