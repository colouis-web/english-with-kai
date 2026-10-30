/* Code — tranche de l'ancien index.html (lignes 2587–2965). Script classique : l'ordre des <script> compte. */
"use strict";
/* ===== LET'S TALK ENGLISH : une image, l'élève dit une phrase, on vérifie sa structure ===== */
const TKPICS = [
    { img: "kai-dog", d: "Kai, a boy, is crouching and stroking a big golden dog. The dog looks happy.", q: "Tell me something about Kai and his dog!", k: "dog,puppy,pet,stroke,touch,play,love,happy,golden,big,friend", w: [["a dog", "un chien"], ["to stroke", "caresser"], ["happy", "content"]], m: ["Kai is stroking his dog.", "The dog is big and happy.", "Kai loves his dog."] },
    { img: "kai-cat", d: "Kai is sitting cross-legged on the floor with a tabby cat on his legs. He is stroking the cat.", q: "What is Kai doing with the cat?", k: "cat,kitten,sit,stroke,legs,floor,pet,love", w: [["a cat", "un chat"], ["to sit", "être assis"], ["on his legs", "sur ses jambes"]], m: ["Kai is sitting with his cat.", "The cat is on his legs.", "He is stroking the cat."] },
    { img: "kai-eat", d: "Kai is eating noodles from a bowl with chopsticks. He looks very happy.", q: "What is Kai eating?", k: "eat,noodle,chopstick,bowl,soup,hungry,lunch,dinner,happy", w: [["noodles", "des nouilles"], ["chopsticks", "des baguettes"], ["a bowl", "un bol"]], m: ["Kai is eating noodles.", "He is using chopsticks.", "He loves noodles!"] },
    { img: "kai-drink", d: "Kai is drinking from a can with his eyes closed.", q: "What is Kai doing?", k: "drink,can,soda,juice,thirsty,lemonade", w: [["to drink", "boire"], ["a can", "une canette"], ["thirsty", "assoiffé"]], m: ["Kai is drinking a can of soda.", "He is thirsty.", "He likes cold drinks."] },
    { img: "kai-read", d: "Kai is sitting on a bench and reading a big book.", q: "Where is Kai and what is he doing?", k: "read,book,bench,sit,story,park", w: [["to read", "lire"], ["a bench", "un banc"], ["a book", "un livre"]], m: ["Kai is reading a book.", "He is sitting on a bench.", "He loves reading."] },
    { img: "sc-bike", d: "Kai is riding a bicycle with a basket on the front.", q: "Tell me something about the picture!", k: "ride,bike,bicycle,cycle,basket,wheel", w: [["to ride a bike", "faire du vélo"], ["a basket", "un panier"], ["a wheel", "une roue"]], m: ["Kai is riding a bike.", "His bike has a basket.", "He goes to school by bike."] },
    { img: "sc-beach", d: "Kai is lying on a towel on the beach under an umbrella and reading a book. The sea is behind him.", q: "Where is Kai? What is he doing?", k: "beach,sea,sand,read,book,towel,umbrella,sun,sunny,lie,holiday,summer", w: [["the beach", "la plage"], ["a towel", "une serviette"], ["to lie", "être allongé"]], m: ["Kai is on the beach.", "He is reading a book on his towel.", "It is sunny."] },
    { img: "sc-icecream", d: "Kai is sitting on a bench in a park and eating an ice cream cone.", q: "What is Kai eating?", k: "ice cream,ice-cream,eat,cone,park,bench,summer,sit", w: [["an ice cream", "une glace"], ["a bench", "un banc"], ["the park", "le parc"]], m: ["Kai is eating an ice cream.", "He is sitting in the park.", "He likes strawberry ice cream."] },
    { img: "sc-ski", d: "Kai is skiing down a snowy slope, wearing a helmet and goggles. There is a sailing boat in the background.", q: "What is Kai doing?", k: "ski,snow,mountain,helmet,cold,winter,slope,goggles", w: [["to ski", "skier"], ["snow", "la neige"], ["a helmet", "un casque"]], m: ["Kai is skiing.", "There is a lot of snow.", "He is wearing a helmet."] },
    { img: "sc-sleep", d: "Kai is sleeping in his bed under a blanket.", q: "What is Kai doing?", k: "sleep,bed,tired,night,blanket,pillow,dream", w: [["to sleep", "dormir"], ["a bed", "un lit"], ["tired", "fatigué"]], m: ["Kai is sleeping.", "He is in his bed.", "He is very tired."] },
    { img: "sc-plane", d: "Kai is sitting in a plane seat next to the window, with a sleep mask on his eyes.", q: "Where is Kai?", k: "plane,fly,travel,window,seat,mask,sleep,trip,holiday", w: [["a plane", "un avion"], ["a window", "un hublot / une fenêtre"], ["to travel", "voyager"]], m: ["Kai is on a plane.", "He is sleeping next to the window.", "He is travelling."] },
    { img: "sc-zoo", d: "Kai, with a backpack, is looking at a tall giraffe at the zoo.", q: "Tell me something about the picture!", k: "giraffe,zoo,look,tall,animal,backpack,neck", w: [["a giraffe", "une girafe"], ["the zoo", "le zoo"], ["tall", "grand"]], m: ["Kai is looking at a giraffe.", "The giraffe is very tall.", "They are at the zoo."] },
    { img: "sc-shop", d: "Kai is standing in a bookshop and reading a comic.", q: "What is Kai doing?", k: "shop,bookshop,comic,book,read,manga,buy", w: [["a bookshop", "une librairie"], ["a comic", "une BD"], ["to read", "lire"]], m: ["Kai is reading a comic.", "He is in a bookshop.", "He wants to buy a manga."] },
    { img: "sc-surf", d: "Kai is surfing on a wave.", q: "What is Kai doing?", k: "surf,wave,sea,board,water,beach,summer", w: [["to surf", "surfer"], ["a wave", "une vague"], ["the sea", "la mer"]], m: ["Kai is surfing.", "The wave is big.", "He is on his surfboard."] },
    { img: "sc-tidy", d: "Kai is tidying his messy bedroom: clothes and books are on the floor.", q: "What is Kai doing in his room?", k: "tidy,room,bedroom,clothes,messy,floor,book,clean", w: [["to tidy", "ranger"], ["messy", "en désordre"], ["the floor", "le sol"]], m: ["Kai is tidying his room.", "His room is very messy.", "There are clothes on the floor."] },
    { img: "sc-hike", d: "Kai is hiking in the mountains with a big backpack.", q: "Where is Kai?", k: "mountain,hike,walk,backpack,climb,nature,trip", w: [["the mountains", "la montagne"], ["to hike", "faire de la randonnée"], ["a backpack", "un sac à dos"]], m: ["Kai is in the mountains.", "He is hiking with a backpack.", "The mountains are beautiful."] },
    { img: "sc-train", d: "Kai is sitting on a train with other passengers. We can see the countryside through the window.", q: "Tell me something about the picture!", k: "train,travel,window,passenger,sit,seat,trip,journey", w: [["a train", "un train"], ["a passenger", "un passager"], ["the window", "la fenêtre"]], m: ["Kai is on a train.", "He is travelling with other passengers.", "He is looking out of the window."] },
    { img: "sc-bathroom", d: "Kai is brushing his teeth in front of the mirror in the bathroom.", q: "What is Kai doing?", k: "brush,teeth,tooth,toothbrush,mirror,bathroom,morning,wash", w: [["to brush your teeth", "se brosser les dents"], ["a mirror", "un miroir"], ["the bathroom", "la salle de bains"]], m: ["Kai is brushing his teeth.", "He is in the bathroom.", "He brushes his teeth every morning."] },
    { img: "sc-buy", d: "Kai is at the market holding a paper bag full of vegetables and a bunch of carrots.", q: "What is Kai buying?", k: "buy,carrot,vegetable,market,bag,shop,food", w: [["vegetables", "des légumes"], ["carrots", "des carottes"], ["the market", "le marché"]], m: ["Kai is buying vegetables.", "He has a lot of carrots.", "He is at the market."] },
    { img: "sc-game", d: "Kai is sitting on the floor and playing video games with a controller in front of a TV.", q: "What is Kai doing?", k: "play,video game,game,console,controller,tv,television,screen", w: [["video games", "les jeux vidéo"], ["a controller", "une manette"], ["the TV", "la télé"]], m: ["Kai is playing video games.", "He has a controller in his hands.", "He loves video games."] },
    { img: "sc-drive", d: "Kai is driving a car, with both hands on the steering wheel.", q: "What is Kai doing?", k: "drive,car,steering wheel,wheel,road,driver", w: [["to drive", "conduire"], ["a car", "une voiture"], ["the steering wheel", "le volant"]], m: ["Kai is driving a car.", "His hands are on the steering wheel.", "He is a good driver."] },
    { img: "sc-basket", d: "Kai is playing basketball in a green shirt with the number 7.", q: "What sport is Kai playing?", k: "basketball,basket,ball,play,sport,shirt,seven,team", w: [["basketball", "le basket"], ["a ball", "un ballon"], ["a shirt", "un maillot"]], m: ["Kai is playing basketball.", "His shirt is green.", "He has a ball in his hand."] },
    { img: "sc-chill", d: "Kai is lying on his bed and listening to music with headphones.", q: "What is Kai doing?", k: "listen,music,headphones,bed,relax,lie,song", w: [["to listen to music", "écouter de la musique"], ["headphones", "un casque"], ["to relax", "se détendre"]], m: ["Kai is listening to music.", "He is lying on his bed.", "He is relaxing."] },
    { img: "sc-ill", d: "Kai is in bed with a thermometer in his mouth. He is ill.", q: "How is Kai today?", k: "ill,sick,thermometer,bed,temperature,fever,cold,flu", w: [["ill / sick", "malade"], ["a thermometer", "un thermomètre"], ["a temperature", "de la fièvre"]], m: ["Kai is ill today.", "He is in bed.", "He has a temperature."] },
];
let TK = { i: -1, seen: [], noAI: false, micOff: false, busy: false, mic: false };
const TK_SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
let TKREC = null;
const MICSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M8.5 21h7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
function tkPick() {
    let ids = TKPICS.map((_, i) => i).filter(i => !TK.seen.includes(i));
    if (!ids.length) {
        TK.seen = [];
        ids = TKPICS.map((_, i) => i).filter(i => i !== TK.i);
    }
    TK.i = ids[Math.floor(Math.random() * ids.length)];
    TK.seen.push(TK.i);
}
function renderTalk() {
    const P = TKPICS[TK.i], mic = TK_SR && !TK.micOff;
    TK.mic = false;
    document.getElementById("talkbody").innerHTML = `<div class="tkpic"><img src="img/${P.img}.webp" alt="${esc(P.d)}"></div>
<div class="tkq"><button class="snd" data-say="${esc(P.q)}" aria-label="Listen">${SPK}</button><p>${esc(P.q)}<small>Say one sentence about the picture.</small></p></div>
<div class="tkhelp"><p class="tkhint"><b>💡 Word ideas</b><span>Ce ne sont que des idées : tu peux utiliser d'autres mots !</span></p>
<div class="tkwords">${P.w.map(([en, fr]) => `<button class="tkw" data-say="${esc(en)}"><b>${esc(en)}</b><i>${esc(fr)}</i></button>`).join("")}</div></div>
${mic ? `<div class="tkmic"><button class="mic" id="tkmic" type="button" aria-label="Speak">${MICSVG}</button><p id="tkmicmsg">Tap the microphone and speak</p></div>`
        : `<p class="tkmsg">${TK_SR ? "Le micro n'est pas autorisé ici :" : "La reconnaissance vocale n'existe pas sur ce navigateur :"} touche le micro 🎤 de ton clavier pour dicter ta phrase, ou écris-la.</p>`}
<textarea id="tktext" rows="2" placeholder="Your sentence: Kai is…" autocomplete="off" autocapitalize="sentences" spellcheck="false" aria-label="Your sentence"></textarea>
<button class="listen tkcheck" id="tkcheck" type="button">Check my sentence${GOSVG}</button>
<div id="tkfb" aria-live="polite"></div>
<div class="endbtns"><button class="ghost sm" id="tkex" type="button">Examples</button><button class="ghost sm" id="tknext" type="button">New picture</button></div>
<div class="tkex" id="tkexbox" hidden><p class="tkhint"><span>Des exemples parmi d'autres : invente ta propre phrase !</span></p>${P.m.map(m => `<button class="tkm" data-say="${esc(m)}">${SPK}<span>${esc(m)}</span></button>`).join("")}</div>`;
}
function openTalk() {
    if (TK.i < 0)
        tkPick();
    renderTalk();
    show("talk");
    setTimeout(() => {
        const P = TKPICS[TK.i];
        sayOne(P.q, document.querySelector("#talkbody .tkq .snd"));
    }, 450);
}
/* reconnaissance vocale */
function tkListen() {
    const b = document.getElementById("tkmic"), msg = document.getElementById("tkmicmsg"), box = document.getElementById("tktext");
    if (!b || !TK_SR)
        return;
    if (TKREC) {
        try {
            TKREC.stop();
        }
        catch (e) {
        }
        return;
    }
    try {
        stopSpeech();
    }
    catch (e) {
    }
    const r = new TK_SR();
    TKREC = r;
    r.lang = "en-GB";
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    b.classList.add("on");
    msg.textContent = "I'm listening…";
    r.onresult = e => {
        let t = "";
        for (const x of e.results)
            t += x[0].transcript;
        box.value = t.trim();
        TK.mic = true;
    };
    r.onerror = e => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "audio-capture") {
            TK.micOff = true;
            const v = box.value;
            renderTalk();
            document.getElementById("tktext").value = v;
        }
        else if (e.error === "no-speech")
            msg.textContent = "I didn't hear anything. Try again!";
        else
            msg.textContent = "Oops, try again!";
    };
    r.onend = () => {
        TKREC = null;
        const bb = document.getElementById("tkmic");
        if (bb)
            bb.classList.remove("on");
        const m = document.getElementById("tkmicmsg");
        if (m && m.textContent === "I'm listening…")
            m.textContent = box.value.trim() ? "Now check your sentence!" : "Tap the microphone and speak";
        if (box.value.trim())
            document.getElementById("tkcheck").focus({ preventScroll: true });
    };
    try {
        r.start();
    }
    catch (e) {
        TKREC = null;
        b.classList.remove("on");
    }
}
/* ---------- vérification par règles (sans connexion) ---------- */
let TKV = null, TKPPS = null;
const tkS3 = b => b === "have" ? "has" : b === "be" ? "is" : b === "do" ? "does" : b === "go" ? "goes" : /(s|x|z|ch|sh|o)$/.test(b) ? b + "es" : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + "ies" : b + "s";
const tkIng = b => b === "be" ? "being" : /ie$/.test(b) ? b.slice(0, -2) + "ying" : /[^aeiou]e$/.test(b) && !/^(see|be)$/.test(b) ? b.slice(0, -1) + "ing" : /^[^aeiou]*[aeiou][bdgmnpt]$/.test(b) ? b + b.slice(-1) + "ing" : b + "ing";
const tkEd = b => /e$/.test(b) ? b + "d" : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + "ied" : /^[^aeiou]*[aeiou][bdgmnpt]$/.test(b) ? b + b.slice(-1) + "ed" : b + "ed";
function tkVerbs() {
    if (TKV)
        return TKV;
    const m = new Map(), pp = new Set(), add = (f, b, t) => {
        f = String(f || "").trim().toLowerCase();
        if (f && !m.has(f))
            m.set(f, { b, t });
    };
    ["am", "is", "are", "was", "were", "be", "being", "been"].forEach(x => m.set(x, { b: "be", t: "be" }));
    ["can", "could", "will", "would", "should", "must", "may", "might", "shall"].forEach(x => m.set(x, { b: x, t: "modal" }));
    m.set("has", { b: "have", t: "s" });
    m.set("does", { b: "do", t: "s" });
    m.set("do", { b: "do", t: "base" });
    m.set("have", { b: "have", t: "base" });
    m.set("had", { b: "have", t: "past" });
    m.set("did", { b: "do", t: "past" });
    const one = (b, pt, ppf) => {
        add(b, b, "base");
        add(tkS3(b), b, "s");
        add(tkIng(b), b, "ing");
        if (/[aeiou]l$/.test(b))
            add(b + "ling", b, "ing");
        String(pt || tkEd(b)).split("/").forEach(x => add(x, b, "past"));
        String(ppf || tkEd(b)).split("/").forEach(x => {
            add(x, b, "past");
            pp.add(x.trim().toLowerCase());
        });
        if (/[aeiou]l$/.test(b)) {
            add(b + "led", b, "past");
            pp.add(b + "led");
        }
    };
    for (const d of DICT) {
        if (d.modal)
            continue;
        const b = d.v.toLowerCase();
        if (b.includes(" ") || b === "be" || b === "have" || b === "do")
            continue;
        one(b, d.pt, d.pp);
    }
    "stroke,pet,hug,cuddle,crouch,ski,surf,hike,tidy,brush,relax,chill,cycle,smile,stand,hold,wear,sail,pat,lie,look,wait,shop,skate,swim,climb".split(",").forEach(b => {
        if (!m.has(b))
            one(b);
    });
    ["been", "done", "had", "got", "gone"].forEach(x => pp.add(x));
    TKPPS = pp;
    return TKV = m;
}
function tkPP() {
    tkVerbs();
    return TKPPS;
}
const tkPastOf = b => {
    const d = DICT.find(x => x.v === b);
    return d ? String(d.pt).split("/")[0].trim() : tkEd(b);
};
const TK_DET = new Set("the a an his her my your our their its this that these those some two three four five one every each no another any".split(" "));
const TK_ADV = new Set("not never always often sometimes usually really just also still already even probably rarely".split(" "));
const TK_PL = new Set("children people men women mice teeth feet".split(" "));
const TK_SUBJ = new Set("i you he she it we they kai there".split(" "));
const TK_NAMES = new Set("kai english french monday tuesday wednesday thursday friday saturday sunday january february april june july august september october november december london paris france england christmas british scottish irish welsh american canadian australian spanish italian german portuguese dutch belgian swiss greek polish russian swedish chinese japanese korean indian turkish moroccan algerian tunisian senegalese brazilian mexican egyptian".split(" "));
const TK_BENO = new Set("like near round home back out in up down over off well right fine free open close clean dry warm cool wet empty last first sure alone ready kind mean fun cold hot".split(" "));
const TK_TOV = new Set("want need decide hope plan learn forget refuse promise agree".split(" ")), TK_INGV = new Set("enjoy finish stop mind keep avoid practise practice".split(" ")), TK_LIKE = new Set("like love hate prefer".split(" "));
const TK_THAT = new Set("think know say believe hope feel guess see hear tell mean remember forget wish imagine notice realize understand show find decide agree promise explain".split(" "));
const TK_NEG = { "don't": "do", "doesn't": "does", "didn't": "did", "isn't": "is", "aren't": "are", "wasn't": "was", "weren't": "were", "can't": "can", "cannot": "can", "couldn't": "could", "won't": "will", "wouldn't": "would", "shouldn't": "should", "haven't": "have", "hasn't": "has", "hadn't": "had", "mustn't": "must" };
const TK_NEGOUT = { do: "don't", does: "doesn't", did: "didn't", is: "isn't", are: "aren't", was: "wasn't", were: "weren't", can: "can't", could: "couldn't", will: "won't", would: "wouldn't", should: "shouldn't", have: "haven't", has: "hasn't", had: "hadn't", must: "mustn't" };
const TK_NOAP = { dont: "don't", doesnt: "doesn't", didnt: "didn't", isnt: "isn't", arent: "aren't", wasnt: "wasn't", werent: "weren't", cant: "can't", couldnt: "couldn't", wouldnt: "wouldn't", shouldnt: "shouldn't", havent: "haven't", hasnt: "hasn't", im: "I'm", ive: "I've", youre: "you're", theyre: "they're", hes: "he's", shes: "she's", thats: "that's", theres: "there's", whats: "what's" };
const TK_CS = { "'m": "am", "'re": "are", "'ve": "have", "'ll": "will", "'d": "would" };
/* mots et ponctuation */
function tkTok(raw) {
    const s = String(raw || "").replace(/[’‘`´]/g, "'");
    const re = /[A-Za-zÀ-ÿ]+(?:'[A-Za-z]+)?|\d+|[.,!?;:]/g;
    let m;
    const T = [], ap = [];
    const nextW = () => ((s.slice(re.lastIndex).match(/^\s*([A-Za-z]+)/) || [])[1] || "").toLowerCase();
    while ((m = re.exec(s))) {
        let o = m[0];
        if (/^[.,!?;:]$/.test(o)) {
            T.push({ t: o, o, p: 1 });
            continue;
        }
        let l = o.toLowerCase();
        const cap = /^[A-Z]/.test(o);
        if (TK_NOAP[l]) {
            ap.push([o, TK_NOAP[l]]);
            o = TK_NOAP[l];
            l = o.toLowerCase();
        }
        if (l === "its" && /^(a|an|the|very|so|really|not|raining|snowing|sunny|cold|hot|time|my|his|her|big|small|late|early|nice|fun|great|cool|good|bad|windy|cloudy|beautiful)$/.test(nextW())) {
            ap.push([o, "it's"]);
            o = "it's";
            l = "it's";
        }
        if (TK_NEG[l]) {
            T.push({ t: TK_NEG[l], o, cap, neg: 1 });
            T.push({ t: "not", o: "", half: 1 });
            continue;
        }
        let mm = l.match(/^([a-z]+)('m|'re|'ve|'ll|'d)$/);
        if (mm) {
            T.push({ t: mm[1], o, cap, cs: 1 });
            T.push({ t: TK_CS[mm[2]], o: "", half: 1 });
            continue;
        }
        mm = l.match(/^([a-z]+)'s$/);
        if (mm) {
            if (/^(he|she|it|that|there|what|who|here|where|how)$/.test(mm[1])) {
                T.push({ t: mm[1], o, cap, cs: 1 });
                T.push({ t: /^(got|been)$/.test(nextW()) ? "has" : "is", o: "", half: 1 });
            }
            else
                T.push({ t: l, o, cap, poss: 1 });
            continue;
        }
        T.push({ t: l, o, cap });
    }
    return { T, ap, sp: /\s[!?;:]/.test(s) };
}
function tkIsV(w, i) {
    const x = tkVerbs().get(w[i]);
    if (!x)
        return false;
    const pv = w[i - 1] || "", X = TKFR.lex();
    if (TK_DET.has(pv) || /'s$/.test(pv))
        return false;
    if (x.t === "base" && pv === "to")
        return false;
    if (x.t !== "be" && x.t !== "modal" && X.a.has(w[i]) && (/^(am|is|are|was|were|be|very|so|too|really|quite|looks?|seems?|feels?)$/.test(pv)))
        return false;
    if (x.t !== "be" && x.t !== "modal" && x.t !== "ing" && X.n.has(w[i]) && X.a.has(pv))
        return false;
    return true;
}
const tkHasV = w => w.some((_, k) => tkIsV(w, k));
function tkSubjLen(w, i, strict) {
    const t = w[i];
    if (!t)
        return 0;
    if (TK_SUBJ.has(t) && t !== "there" || t === "there" && /^(is|are|was|were)$/.test(w[i + 1] || ""))
        return 1;
    if (strict)
        return 0;
    if (TK_DET.has(t) || /'s$/.test(t)) {
        let k = i + 1;
        while (k < w.length && k < i + 5 && !tkIsV(w, k))
            k++;
        return k < w.length && k > i + 1 ? k - i : 0;
    }
    return 0;
}
function tkStartsSubj(w, i, strict) {
    i = i || 0;
    const n = tkSubjLen(w, i, strict);
    if (!n)
        return false;
    let k = i + n;
    while (k < w.length && TK_ADV.has(w[k]))
        k++;
    return tkIsV(w, k) && tkVerbs().get(w[k]).t !== "ing";
}
function tkSharedOK(rem, prev) {
    let k = 0;
    while (k < rem.length && TK_ADV.has(rem[k]))
        k++;
    if (!tkIsV(rem, k))
        return false;
    const t = rem[k], x = tkVerbs().get(t), X = TKFR.lex();
    if (x.t === "ing" || x.t === "past" || x.t === "be" || x.t === "modal")
        return true;
    if (!X.n.has(t))
        return true;
    const nx = rem[k + 1] || "";
    if (TK_DET.has(nx) || TKFR.lex().pr.has(nx) || /^(him|her|it|them|me|us|to|very|well|a)$/.test(nx))
        return true;
    return !!prev.length && tkIsV(prev, prev.length - 1) && !nx;
}
const TK_CL = [["as", "soon", "as"], ["even", "though"], ["so", "that"], ["and", "then"], ["that", "is", "why"], ["because"], ["when"], ["while"], ["if"], ["although"], ["though"], ["whereas"], ["unless"], ["since"], ["before"], ["after"], ["until"], ["once"], ["and"], ["but"], ["or"], ["so"], ["then"], ["yet"]];
const TK_CK = { "and then": "coord", "that is why": "coord", "and": "coord", "but": "coord", "or": "coord", "so": "coord", "then": "coord", "yet": "coord" };
const TK_PREPLIKE = new Set(["before", "after", "since", "until", "once", "so", "then", "yet"]), TK_SHARE = new Set(["and", "but", "or", "then", "and then", "yet"]);
const TK_INTRO = [["first", "of", "all"], ["for", "example"], ["in", "conclusion"], ["of", "course"], ["in", "fact"], ["however"], ["first"], ["firstly"], ["secondly"], ["next"], ["finally"], ["moreover"], ["furthermore"], ["therefore"], ["besides"], ["afterwards"], ["suddenly"], ["later"], ["also"], ["then"], ["so"], ["but"], ["and"]];
const TK_INTROCOMMA = new Set(["first of all", "for example", "in conclusion", "of course", "in fact", "however", "firstly", "secondly", "finally", "moreover", "furthermore", "therefore", "besides"]);
const tkEn = c => {
    const k = c.join(" ");
    return k === "that is why" ? "that's why" : k;
};
const tkKind = k => TK_CK[k] || "sub";
function tkIsQ(w) {
    return /^(is|are|am|was|were|do|does|did|can|could|will|would|should|has|have)$/.test(w[0] || "") && (TK_SUBJ.has(w[1] || "") || TK_DET.has(w[1] || "")) || /^(what|where|who|why|how|which)$/.test(w[0] || "") && tkVerbs().has(w[1] || "");
}
/* découpe une phrase en propositions : connecteurs et ponctuation */
function tkSplit(ts) {
    const W = ts.map(x => x.t);
    const parts = [];
    const np = (con, comma) => ({ con, ws: [], tk: [], ca: new Set(), comma: !!comma });
    let cur = np(null), i = 0;
    const ml = (L, i) => {
        for (const c of L)
            if (c.every((x, k) => W[i + k] === x))
                return c;
        return null;
    };
    const isQ = tkIsQ(W.filter(x => !/^[,;:]$/.test(x)));
    let c = ml(TK_CL, 0);
    if (c && tkKind(c.join(" ")) === "sub" && !isQ) {
        cur.con = { en: tkEn(c), k: "sub" };
        cur.lead = true;
        i = c.length;
    }
    else if ((c = ml(TK_INTRO, 0)) && !isQ) {
        cur.con = { en: tkEn(c), k: "intro" };
        i = c.length;
        if (W[i] === ",") {
            cur.icomma = true;
            i++;
        }
    }
    let pend = false;
    for (; i < W.length; i++) {
        const t = W[i];
        if (/^[,;:]$/.test(t)) {
            pend = true;
            continue;
        }
        const hasV = tkHasV(cur.ws), rem = W.slice(i).filter(x => !/^[,;:]$/.test(x));
        const cc = hasV ? ml(TK_CL, i) : null;
        if (cc) {
            const key = cc.join(" "), r2 = rem.slice(cc.length), rv = tkHasV(r2), rs = tkStartsSubj(r2, 0);
            let ok;
            if (TK_SHARE.has(key))
                ok = rv && (rs || tkSharedOK(r2, cur.ws));
            else if (key === "so" || key === "that is why" || TK_PREPLIKE.has(key))
                ok = rv && rs;
            else
                ok = true;
            if (ok) {
                parts.push(cur);
                cur = np({ en: tkEn(cc), k: tkKind(key) }, pend);
                pend = false;
                i += cc.length - 1;
                continue;
            }
        }
        if (hasV && cur.ws.length && (pend || !isQ)) {
            const lastB = (() => {
                for (let k = cur.ws.length - 1; k >= 0; k--) {
                    if (tkIsV(cur.ws, k))
                        return tkVerbs().get(cur.ws[k]).b;
                }
                return "";
            })();
            const strict = !pend && !(cur.lead && !parts.length);
            if (tkStartsSubj(rem, 0, strict) && !(TK_THAT.has(lastB) && !pend)) {
                parts.push(cur);
                cur = np(null, pend);
                cur.cut = true;
                pend = false;
            }
        }
        if (pend && cur.ws.length)
            cur.ca.add(cur.ws.length - 1);
        pend = false;
        cur.ws.push(t);
        cur.tk.push(ts[i]);
    }
    parts.push(cur);
    return parts.filter(p => p.ws.length || p.con);
}
/* une proposition : sujet, verbe, accords */
function tkPer(subj, w, vi) {
    const head = subj[subj.length - 1] || "", X = TKFR.lex();
    let per = "3s";
    const n = X.n.get(head);
    if (subj.includes("and") || ["you", "we", "they"].includes(head) || TK_PL.has(head) || (n && (n.ipl || n.pl)) || (!n && /s$/.test(head) && !/(ss|us|is|'s)$/.test(head) && !TK_DET.has(head) && head.length > 3) || /^(these|those|two|three|four|five)$/.test(subj[0] || ""))
        per = "p";
    if (head === "i" && subj.length === 1)
        per = "1s";
    if (head === "there") {
        per = "";
        for (let k = vi + 1; k < w.length; k++) {
            const x = w[k];
            if (TK_ADV.has(x))
                continue;
            if ((x === "a" && w[k + 1] === "lot" && w[k + 2] === "of") || (x === "lots" && w[k + 1] === "of")) {
                k += x === "a" ? 2 : 1;
                continue;
            }
            if (/^(a|an|one)$/.test(x)) {
                per = "3s";
                break;
            }
            if (/^(two|three|four|five|six|seven|eight|nine|ten|many|several|some|lots|\d+)$/.test(x) && x !== "1") {
                per = x === "some" ? "" : "p";
                if (per)
                    break;
                continue;
            }
            if (TK_DET.has(x) || TKFR.lex().a.has(x))
                continue;
            const m = X.n.get(x);
            if (m) {
                per = (m.ipl || m.pl) ? "p" : "3s";
                break;
            }
            break;
        }
        if (!per)
            per = "?";
    }
    return per;
}
function tkClause(w, ctx) {
    const V = tkVerbs(), X = TKFR.lex(), tips = [], out = w.slice();
    let ok = true;
    let vi = -1;
    for (let i = 0; i < w.length; i++) {
        if (tkIsV(w, i)) {
            vi = i;
            break;
        }
    }
    const con = ctx.con && ctx.con.en;
    if (vi < 0)
        return { ok: false, tips: [ctx.con && ctx.con.k === "sub" ? `Après « ${con} », il faut une vraie phrase avec un sujet et un verbe : ${con} he is…` : "Il manque un verbe conjugué : is, has, likes, plays…"], out, vi: -1, vEnd: 0, per: "3s", kind: "", implied: false };
    const implied = vi === 0 && !!ctx.shared;
    if (vi === 0 && !implied && !ctx.q) {
        ok = false;
        tips.push(ctx.con ? `Après « ${con} », dis qui fait l'action : ${con} he…` : "Il manque le sujet au début de la phrase : Kai, he, she, the dog…");
    }
    const subj = implied ? [] : w.slice(0, vi);
    const per = implied ? ctx.shared.per : tkPer(subj, w, vi);
    const sj = implied ? ctx.shared.label : subj.join(" ").replace(/\bkai\b/, "Kai").replace(/^i$/, "I");
    const x0 = V.get(w[vi]);
    let j = vi + 1;
    const adv = () => {
        while (j < w.length && TK_ADV.has(w[j]))
            j++;
    };
    let kind = "pres", vEnd = vi + 1;
    const fix = (i, v, tip) => {
        if (out[i] !== v) {
            out[i] = v;
            ok = false;
            if (tip && !tips.includes(tip))
                tips.push(tip);
        }
    };
    const nAt = k => {
        let q = k;
        while (q < w.length && TK_ADV.has(w[q]))
            q++;
        return q;
    };
    if (x0.t === "be") {
        const past = /^(was|were)$/.test(w[vi]);
        if (!/^(be|been|being)$/.test(w[vi]) && per !== "?") {
            const want = per === "1s" ? (past ? "was" : "am") : per === "3s" ? (past ? "was" : "is") : (past ? "were" : "are");
            fix(vi, want, `Avec « ${sj} », on dit « ${want} » et pas « ${w[vi]} ».`);
        }
        adv();
        const nx = V.get(w[j]);
        if (w[j] === "going" && w[j + 1] === "to" && V.get(w[j + 2])) {
            kind = "going";
            if (V.get(w[j + 2]).t !== "base" && V.get(w[j + 2]).t !== "be")
                fix(j + 2, V.get(w[j + 2]).b, "Après going to, le verbe reste à la base.");
            vEnd = j + 3;
        }
        else if (nx && nx.t === "ing") {
            kind = past ? "pcont" : "cont";
            vEnd = j + 1;
        }
        else if (nx && (nx.t === "base" || nx.t === "s") && !X.a.has(w[j]) && !TK_BENO.has(w[j]) && !/^(be|have|do)$/.test(nx.b) && !(X.n.has(w[j]) && (TK_DET.has(w[j - 1]) || nx.t === "s"))) {
            const g = tkIng(nx.b);
            fix(j, g, `Après be, le verbe prend -ing : « ${out[vi]} ${g} » (présent continu).`);
            kind = "cont";
            vEnd = j + 1;
        }
        else if (nx && nx.t === "past" && tkPP().has(w[j]) && !X.a.has(w[j])) {
            kind = "passive";
            vEnd = j + 1;
        }
        else
            kind = past ? "bepast" : "be";
    }
    else if (x0.t === "modal") {
        adv();
        if (w[j] === "to" && V.get(w[j + 1])) {
            out[j] = "";
            ok = false;
            tips.push(`Pas de « to » après « ${w[vi]} » : ${w[vi]} ${V.get(w[j + 1]).b}.`);
            j++;
        }
        const nx = V.get(w[j]);
        if (nx && !TK_DET.has(w[j - 1])) {
            if (nx.t === "be" && w[j] !== "be")
                fix(j, "be", `Après « ${w[vi]} », on dit « be ».`);
            else if (nx.t !== "base" && nx.t !== "be" && nx.t !== "modal")
                fix(j, nx.b, `Après « ${w[vi]} », le verbe reste à la base : « ${w[vi]} ${nx.b} ».`);
            vEnd = j + 1;
        }
        kind = "modal";
    }
    else if (x0.b === "do" && (() => {
        const k = nAt(j), n = V.get(w[k]);
        return n && n.t !== "modal" && n.t !== "be";
    })()) {
        if (w[vi] !== "did" && per !== "?") {
            const want = per === "3s" ? "does" : "do";
            fix(vi, want, `Avec « ${sj} », on dit « ${want} ».`);
        }
        adv();
        const nx = V.get(w[j]);
        if (nx.t !== "base")
            fix(j, nx.b, `Après do / does / did, le verbe reste à la base : « ${nx.b} ».`);
        vEnd = j + 1;
        kind = w[vi] === "did" ? "past" : "pres";
    }
    else if (x0.b === "have" && (() => {
        const k = nAt(j);
        return w[k] === "got" || tkPP().has(w[k]) && V.get(w[k]).t === "past";
    })()) {
        if (w[vi] !== "had") {
            const want = per === "3s" ? "has" : "have";
            fix(vi, want, `Avec « ${sj} », on dit « ${want} ».`);
        }
        adv();
        vEnd = j + 1;
        kind = w[j] === "got" ? "pres" : "perfect";
    }
    else if (x0.t === "ing") {
        if (implied && /cont/.test(ctx.shared.kind))
            kind = "cont";
        else {
            const be = per === "1s" ? "am" : per === "p" ? "are" : "is";
            fix(vi, be + " " + w[vi], `Avec -ing, il faut be : « ${be} ${w[vi]} ».`);
            kind = "cont";
        }
    }
    else if (x0.t === "base" || x0.t === "s") {
        const isPast = x0.t === "base" && !(implied && ctx.shared.kind === "pres") && String((DICT.find(d => d.v === x0.b) || {}).pt || "").split("/").map(x => x.trim()).includes(w[vi]);
        if (implied && /past/.test(ctx.shared.kind)) {
            const f = tkPastOf(x0.b);
            fix(vi, f, `Garde le même temps que le début de la phrase (passé) : « ${f} ».`);
            kind = "past";
        }
        else if (x0.b === "have") {
            if (per === "3s" && w[vi] === "have")
                fix(vi, "has", "Avec he, she, it (ou un seul nom), on dit « has ».");
            else if (per !== "3s" && w[vi] === "has")
                fix(vi, "have", `Avec « ${sj} », on dit « have ».`);
        }
        else if (per === "3s" && x0.t === "base" && !isPast) {
            const f = tkS3(x0.b);
            fix(vi, f, `Avec he, she, it (ou un seul nom), on ajoute -s au présent : « ${f} ».`);
        }
        else if ((per === "p" || per === "1s") && x0.t === "s") {
            fix(vi, x0.b, `Avec « ${sj} », pas de -s : « ${x0.b} ».`);
        }
        if (kind !== "past")
            kind = isPast ? "past" : "pres";
    }
    else if (x0.t === "past")
        kind = "past";
    // verbe + verbe : want to, enjoy -ing, like -ing
    const mb = (V.get(out[vEnd - 1]) || V.get(w[vEnd - 1]) || {}).b, n1 = w[vEnd], n2 = w[vEnd + 1], v1 = n1 && V.get(n1), cNoun = x => {
        const n = X.n.get(x);
        return n && n.t !== "c";
    };
    if (mb && n1 && !TK_DET.has(n1)) {
        if (TK_TOV.has(mb) && v1 && v1.t === "ing") {
            fix(vEnd, "to " + v1.b, `Après « ${mb} », on met to + verbe : ${mb} to ${v1.b}.`);
        }
        else if (TK_INGV.has(mb) && n1 === "to" && n2 && V.get(n2) && V.get(n2).t === "base") {
            out[vEnd] = "";
            fix(vEnd + 1, tkIng(V.get(n2).b), `Après « ${mb} », le verbe prend -ing : ${mb} ${tkIng(V.get(n2).b)}.`);
        }
        else if (TK_TOV.has(mb) && v1 && v1.t === "base" && !cNoun(n1)) {
            fix(vEnd, "to " + n1, `Après « ${mb} », on met to devant le verbe : ${mb} to ${n1}.`);
        }
        else if (TK_LIKE.has(mb) && v1 && v1.t === "base" && !cNoun(n1)) {
            fix(vEnd, tkIng(n1), `Après « ${mb} », le verbe prend -ing : ${mb} ${tkIng(n1)}.`);
        }
    }
    // a / an
    for (let i = 0; i < out.length - 1; i++) {
        const a = out[i], n = (out[i + 1] || "").split(" ")[0];
        if (!n)
            continue;
        if (a === "a" && /^[aeiou]/.test(n) && !/^(uni|use|usu|eu|one|u[^n])/.test(n)) {
            out[i] = "an";
            ok = false;
            const t = `Devant un son voyelle, « a » devient « an » : an ${n}.`;
            if (!tips.includes(t))
                tips.push(t);
        }
        else if (a === "an" && /^[^aeiou]/.test(n) && !/^(hour|honest|honour)/.test(n)) {
            out[i] = "a";
            ok = false;
            const t = `Devant une consonne, on dit « a » : a ${n}.`;
            if (!tips.includes(t))
                tips.push(t);
        }
    }
    return { ok, tips, out, vi, vEnd, per, kind, implied };
}
function tkAbout(P, w) {
    const V = tkVerbs(), K = new Set(), st = x => x.replace(/ies$/, "y").replace(/(s|es)$/, "");
    const add = s => String(s).toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).forEach(x => {
        if (x.length > 2 && !/^(the|and|with|his|her|has|have|very|this|that|there|are|was|for|from|into|front|its|one|two|they|him|but|not|can|out|other|some|both|lot|looks?|like|likes)$/.test(x)) {
            K.add(st(x));
            const b = V.get(x);
            if (b)
                K.add(b.b);
        }
    });
    add(P.k.replace(/,/g, " "));
    P.w.forEach(([en]) => add(en));
    P.m.forEach(add);
    add(P.d);
    return w.some(x => {
        const b = V.get(x);
        return K.has(st(x)) || (b && K.has(b.b)) || /^(kai|he|his|him)$/.test(x);
    });
}
const tkCap = s => s.charAt(0).toUpperCase() + s.slice(1);
/* ---------- v51 : mots inconnus, phrase en français, homophones, since / for ---------- */
const TK_FUNC = new Set(("i you he she it we they me him her us them my your his its our their mine yours hers ours theirs myself yourself himself herself itself ourselves themselves " +
    "this that these those a an the some any no not and or but so because if when while then than there here what where who whom whose which why how yes please thank thanks hello hi bye ok okay oh wow " +
    "very too also just to of at in on for with from by up down out off over about into onto as like do does did am is are was were be been being has have had will would can could should must may might shall " +
    "o'clock years year old one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty hundred thousand " +
    "first second third every each all both lot lots many much more most less few little other another same such own something someone somebody anything anyone nothing nobody everything everyone everybody ago since until till cannot let's lets").split(" "));
let TKKN = null;
function tkKnownSet() {
    if (TKKN)
        return TKKN;
    const X = TKFR.lex(), S = new Set(TK_FUNC);
    const add = w => String(w || "").toLowerCase().split(/[\s\/]+/).forEach(x => {
        if (x)
            S.add(x.replace(/[^a-z'-]/g, ""));
    });
    for (const k of tkVerbs().keys())
        add(k);
    for (const k of X.n.keys())
        add(k);
    for (const k of X.a.keys())
        add(k);
    for (const k of X.av.keys())
        add(k);
    for (const k of X.pr.keys())
        add(k);
    for (const k of X.con.keys())
        add(k);
    try {
        for (const d of ADJ.data) {
            add(d.cmp);
            add(d.sup);
        }
    }
    catch (e) {
    }
    TK_NAMES.forEach(add);
    return TKKN = S;
}
function tkKnown(w) {
    const S = tkKnownSet();
    w = String(w).toLowerCase().replace(/'s$/, "");
    if (S.has(w) || /^\d+$/.test(w))
        return true;
    if (/ly$/.test(w) && (S.has(w.slice(0, -2)) || S.has(w.slice(0, -3) + "y") || S.has(w.slice(0, -2) + "e")))
        return true;
    if (/s$/.test(w) && S.has(w.slice(0, -1)))
        return true;
    return false;
}
function tkLev(a, b, max) {
    if (Math.abs(a.length - b.length) > max)
        return max + 1;
    let p = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
        const c = [i];
        let mn = i;
        for (let j = 1; j <= b.length; j++) {
            c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
                c[j] = Math.min(c[j], p[j - 2] + 1);
            if (c[j] < mn)
                mn = c[j];
        }
        if (mn > max)
            return max + 1;
        p = c;
    }
    return p[b.length];
}
function tkLevW(a, b) {
    let p = Array.from({ length: b.length + 1 }, (_, j) => j), pp = null;
    for (let i = 1; i <= a.length; i++) {
        const c = [i];
        for (let j = 1; j <= b.length; j++) {
            c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1.2));
            if (pp && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
                c[j] = Math.min(c[j], pp[j - 2] + 1);
        }
        pp = p;
        p = c;
    }
    return p[b.length];
}
function tkSuggest(w, pv) {
    w = w.toLowerCase();
    const max = w.length <= 4 ? 1 : 2, X = TKFR.lex(), V = tkVerbs();
    let best = null, bd = 9;
    for (const k of tkKnownSet()) {
        if (k.length < 2 || k.includes(" ") || Math.abs(k.length - w.length) > max)
            continue;
        let d = tkLevW(w, k);
        if (d > max + .4)
            continue;
        if (k[0] !== w[0])
            d += .5;
        const isN = X.n.has(k), isA = X.a.has(k), isV = V.has(k);
        if (pv && (TK_DET.has(pv) || /'s$/.test(pv))) {
            if (isN || isA)
                d -= .3;
            else
                d += .3;
        }
        else if (pv && (TK_SUBJ.has(pv) || /^(can|will|to|not|does|do|did)$/.test(pv))) {
            if (isV)
                d -= .3;
        }
        if (d < bd) {
            bd = d;
            best = k;
        }
    }
    return bd <= max + (w.length <= 4 ? 0 : .2) ? best : null;
}
/* phrase en français ? */
const TK_FRW = new Set("est et le les des du une avec dans sur pour pas très mais il elle je tu nous vous ils elles ses mon ma mes ton ta tes fait fais joue mange aime chien chat qui que quoi au aux ce cette sont suis ai va vont peut veut garçon fille maison école plage mer avec chez de il y lui leur caresse regarde dort boit lit".split(" "));
function tkFrench(T) {
    const W = T.filter(x => !x.p);
    const fr = W.filter(x => TK_FRW.has(x.t) && !(tkKnown(x.t) && !/^(est|le|les|des|du|une|il|elle|je|ce|mon|ma|mes|ses|qui|que|lit|fait|pas|sur|pour|mais|sont|suis|ai|va|lui|leur|chez|de|et)$/.test(x.t))).length;
    const acc = W.some(x => /[éèêàâçùûîôœ]/i.test(x.o));
    return fr >= 2 || (fr >= 1 && acc) || (W.length && fr / W.length >= .4);
}
/* homophones fréquents (see / sea, there / their…) : corrigés d'après la place du mot */
function tkHomo(T) {
    const tips = [], W = T.map(x => x.t), X = TKFR.lex(), V = tkVerbs();
    const set = (i, to, tip) => {
        const x = T[i];
        x.o = x.cap ? to.charAt(0).toUpperCase() + to.slice(1) : to;
        x.t = to;
        x.homo = 1;
        if (!tips.includes(tip))
            tips.push(tip);
    };
    for (let i = 0; i < T.length; i++) {
        if (T[i].p)
            continue;
        const t = W[i], pv = W[i - 1] || "", nx = W[i + 1] || "";
        if (t === "see" && (TK_DET.has(pv) || /^(in|on|into|by|across|near)$/.test(pv)))
            set(i, "sea", "Attention à l'orthographe : « sea » (la mer) et pas « see » (voir).");
        else if (t === "sea" && (/^(can|could|will|to|i|you|we|they|he|she|cannot|not)$/.test(pv)))
            set(i, "see", "Attention à l'orthographe : « see » (voir) et pas « sea » (la mer).");
        else if (t === "there" && nx && X.n.has(nx) && !V.has(nx) && !/^(is|are|was|were)$/.test(nx))
            set(i, "their", "Attention : « their » (leur, leurs) devant un nom ; « there » veut dire « là ».");
        else if (t === "their" && /^(is|are|was|were)$/.test(nx))
            set(i, "there", "Attention : « there is / there are » (il y a) s'écrit avec « there ».");
        else if (t === "hear" && (!nx || /^[.,!?]$/.test(nx) || /^(come|over|is|are|from)$/.test(pv)))
            set(i, "here", "Attention : « here » (ici) et pas « hear » (entendre).");
        else if (t === "here" && /^(can|could|will|to|cannot|not|i|you|we|they)$/.test(pv) && nx && !/^[.,!?]$/.test(nx))
            set(i, "hear", "Attention : « hear » (entendre) et pas « here » (ici).");
        else if (t === "weak" && /^(next|last|every|this|a)$/.test(pv))
            set(i, "week", "Attention : « week » (semaine) et pas « weak » (faible).");
        else if (t === "buy" && /^(bike|bus|car|train|plane|boat|taxi|tram)$/.test(nx) && !/^(to|will|can|i|you|we|they|he|she)$/.test(pv))
            set(i, "by", "Attention : « by bike » (à vélo) s'écrit « by », pas « buy » (acheter).");
        else if (t === "to" && (!nx || /^[.,!?]$/.test(nx)) && i > 1)
            set(i, "too", "Attention : « too » (aussi, trop) en fin de phrase, pas « to ».");
        else if (t === "too" && V.get(nx) && V.get(nx).t === "base" && !X.a.has(nx))
            set(i, "to", "Attention : « to » devant un verbe, pas « too ».");
    }
    return tips;
}
/* since + durée → for ; since + point de départ ou since + phrase : le present perfect */
const TK_DUR = /^(seconds?|minutes?|hours?|days?|weeks?|months?|years?|ages|time)$/, TK_STATE = new Set("be have know like love live want own belong need hate understand".split(" "));
function tkPerfect(r, ws, tips) {
    const out = r.out, V = tkVerbs(), vi = r.vi;
    if (vi < 0)
        return false;
    const per = r.per, h = per === "3s" ? "has" : "have";
    const x = V.get(ws[vi]);
    if (!x)
        return false;
    if (r.kind === "cont") {
        const j = r.vEnd - 1;
        out[vi] = h + " been";
        if (out[j] && !/ing$/.test(out[j].split(" ").pop()))
            out[j] = tkIng(V.get(ws[j]).b);
        return true;
    }
    if (r.kind === "be") {
        out[vi] = h + " been";
        return true;
    }
    if (r.kind === "pres" && (x.t === "base" || x.t === "s")) {
        const b = x.b;
        if (b === "have") {
            out[vi] = h + " had";
            return true;
        }
        const d = DICT.find(q => q.v === b), pp = d ? String(d.pp).split("/")[0].trim() : tkEd(b);
        out[vi] = TK_STATE.has(b) ? h + " " + pp : h + " been " + tkIng(b);
        return true;
    }
    return false;
}
function tkSinceFix(sents, tips) {
    let bad = false;
    const add = t => {
        if (!tips.includes(t))
            tips.push(t);
    };
    for (const sn of sents) {
        const P = sn.parts || [];
        P.forEach(p => {
            const r = p.r;
            if (!r || !r.out)
                return;
            const ws = p.ws;
            for (let i = 0; i < ws.length; i++) {
                if (ws[i] !== "since")
                    continue;
                const a = ws[i + 1] || "", b = ws[i + 2] || "", c = ws[i + 3] || "";
                const dur = (/^(a|an|one|two|three|four|five|six|seven|eight|nine|ten|twenty|several|many|\d+)$/.test(a) && (TK_DUR.test(b) || (b === "long" && c === "time"))) || (/^(a)$/.test(a) && b === "few" && TK_DUR.test(c)) || a === "ages";
                if (dur) {
                    r.out[i] = "for";
                    bad = true;
                    add("Avec une durée (two hours, three days), on dit « for » : for two hours. « Since » (depuis) se met devant un point de départ : since Monday, since 9 o'clock.");
                }
                if (/^(pres|cont|be)$/.test(r.kind) && tkPerfect(r, ws, tips)) {
                    bad = true;
                    add("Pour une action qui a commencé dans le passé et qui continue encore, l'anglais utilise le present perfect : he has been surfing for two hours, he has lived here since 2020.");
                }
            }
        });
        const sp = P.find(p => p.con && p.con.en === "since"), others = P.filter(p => p !== sp && p.r && p.r.out);
        if (sp && sp.r && sp.r.out) {
            const r = sp.r, V = tkVerbs();
            if (others.some(o => o.r.kind === "perfect") && /^(pres|be|cont)$/.test(r.kind) && r.vi >= 0) {
                const w = sp.ws[r.vi], x = V.get(w);
                if (x && x.t === "be")
                    r.out[r.vi] = r.per === "p" ? "were" : "was";
                else if (x)
                    r.out[r.vi] = tkPastOf(x.b);
                bad = true;
                add("Après « since » (depuis que), le verbe est au passé : since he was a child.");
            }
            if (r.kind === "past" || r.kind === "bepast")
                others.forEach(o => {
                    if (/^(pres|cont|be)$/.test(o.r.kind) && tkPerfect(o.r, o.ws, tips)) {
                        bad = true;
                        add("Avec « since » + une date ou un moment passé, l'anglais utilise le present perfect : Kai has surfed since he was a child.");
                    }
                });
        }
    }
    return bad;
}
/* S-01 : la phrase corrigée par les règles locales n'est PAS validée si elle contient un nom d'objet / d'animal singulier
   sans article (« see elephant ») ou un adjectif placé après le nom (« elephant big »). Dans ce cas Kai propose, il
   n'affirme pas, et la phrase n'est jamais lue à voix haute. Choix prudent : seules les catégories où le nom est
   vraiment comptable sont contrôlées (le lexique marque « comptable » presque tout, nourriture comprise), et le doute
   ne porte que sur un nom juste après un verbe ou une préposition (pas de fausse alerte sur « skate park »). */
const TK_NODET = /^(in|at|to|by|on|from) (bed|school|class|town|hospital|church|prison|bus|car|train|plane|bike|foot|home|work|night|sea)$/;
const TK_DETX = /^(\d+|several|many|much|all|both|lots|enough|most|other|what|whose)$/;
const TK_COUNTCAT = new Set(["animals", "family", "body", "clothes", "house", "school", "transport", "places", "jobs"]);
function tkShaky(sentence) {
    const X = TKFR.lex(), V = tkVerbs();
    const isDet = w => TK_DET.has(w) || /'s$/.test(w) || TK_DETX.test(w);
    const isCount = w => { const n = X.n.get(w); return !!n && n.t === "c" && !n.ipl && TK_COUNTCAT.has(n.cat) && !V.has(w) && w !== "kai" && !TK_NAMES.has(w); };
    return String(sentence || "").toLowerCase().split(/[.!?,;:]+/).some(seg => {
        const W = seg.replace(/[^a-z' ]/g, " ").split(/\s+/).filter(Boolean);
        return W.some((w, i) => {
            if (!X.n.has(w) || X.n.get(w).t !== "c" || X.n.get(w).ipl)
                return false;
            const nx = W[i + 1];
            if (nx && X.a.has(nx) && !X.n.has(nx) && !V.has(nx) && !X.av.has(nx))
                return true;
            if (!isCount(w))
                return false;
            let j = i - 1;
            while (j >= 0 && X.a.has(W[j]) && !isDet(W[j]))
                j--;
            if (j >= 0 && isDet(W[j]))
                return false;
            const governed = j < 0 || ((V.has(W[j]) || X.pr.has(W[j]) || X.con.has(W[j])) && W[j] !== "of" && !X.n.has(W[j]) && !(j > 0 && isDet(W[j - 1])));
            return governed && !(j === i - 1 && TK_NODET.test(W[j] + " " + w));
        });
    });
}
function tkLocal(P, raw, mic) {
    const { T, ap, sp } = tkTok(raw);
    if (tkFrench(T))
        return { ok: false, french: true, about: true, corrected: "", tips_fr: [], punct_fr: [], parts: [], fr: "", unk: [] };
    const htips = tkHomo(T), unknown = [];
    T.forEach((x, i) => {
        if (x.p || x.homo)
            return;
        const w = x.t.replace(/'s$/, "");
        if (tkKnown(w))
            return;
        if (x.cap && i > 0 && !mic)
            return;
        if (x.cap && mic && i > 0)
            return;
        const prv = T.slice(0, i).filter(y => !y.p), pv = (prv[prv.length - 1] || {}).t, pv2 = (prv[prv.length - 2] || {}).t;
        if (pv === "called" || pv === "named" || (pv === "is" && pv2 === "name")) {
            x.o = x.o.charAt(0).toUpperCase() + x.o.slice(1);
            x.cap = true;
            return;
        }
        const s = tkSuggest(w, pv);
        unknown.push({ w: x.o, s });
        if (s) {
            x.t = x.poss ? s + "'s" : s;
            x.o = x.cap ? s.charAt(0).toUpperCase() + s.slice(1) : s;
            x.sug = 1;
        }
    });
    const words = T.filter(x => !x.p).map(x => x.t);
    if (words.length < 3)
        return { ok: false, about: false, corrected: raw, tips_fr: ["Ta phrase est trop courte : dis au moins un sujet, un verbe et un complément (Kai is playing…)."], punct_fr: [], parts: [], fr: "", unk: [] };
    const S = [];
    let cur = [];
    for (const x of T) {
        if (x.p && /[.!?]/.test(x.t)) {
            if (cur.length)
                S.push({ ts: cur, end: x.t });
            cur = [];
            continue;
        }
        cur.push(x);
    }
    if (cur.length)
        S.push({ ts: cur, end: "" });
    const tips = [], pt = [], sents = [];
    let ok = true;
    for (const sn of S) {
        const W = sn.ts.filter(x => !x.p).map(x => x.t), q = tkIsQ(W);
        sn.q = q;
        if (q && /^(what|where|who|why|how|which)$/.test(W[0])) {
            sn.parts = [{ con: null, ws: W, tk: sn.ts.filter(x => !x.p), ca: new Set(), r: { ok: true, tips: [], out: W.slice(), vi: -1, vEnd: 0, kind: "q" } }];
            sn.wh = true;
            sents.push(sn);
            continue;
        }
        const parts = tkSplit(sn.ts);
        let shared = null;
        parts.forEach(p => {
            let ws = p.ws;
            if (q) {
                /* question oui / non : on remet dans l'ordre d'une phrase pour la vérifier */ const X = TKFR.lex();
                let s = 1;
                if (TK_DET.has(ws[1])) {
                    s = 2;
                    while (X.a.has(ws[s]) && !X.n.has(ws[s]))
                        s++;
                    if (X.n.has(ws[s]))
                        s++;
                    s--;
                }
                p.qws = ws;
                ws = [...ws.slice(1, 1 + s), ws[0], ...ws.slice(1 + s)];
                p.ws = ws;
            }
            const ctx = { con: p.con, q, shared: p.con && TK_SHARE.has(p.con.en) ? shared : null };
            const r = tkClause(ws, ctx);
            if (!r.ok)
                ok = false;
            r.tips.forEach(t => {
                if (!tips.includes(t))
                    tips.push(t);
            });
            if (!r.implied && r.vi > 0)
                shared = { per: r.per, kind: r.kind, label: ws.slice(0, r.vi).join(" ").replace(/\bkai\b/, "Kai") };
            else if (shared && r.kind)
                shared.kind = r.kind;
            p.r = r;
        });
        sn.parts = parts;
        sents.push(sn);
    }
    if (tkSinceFix(sents, tips))
        ok = false;
    if (htips.length) {
        ok = false;
        htips.forEach(t => {
            if (!tips.includes(t))
                tips.unshift(t);
        });
    }
    // ponctuation : seulement quand la phrase est écrite (la reconnaissance vocale ne la donne pas)
    if (!mic) {
        if (sp)
            pt.push("En anglais, pas d'espace avant ! ? : ; (c'est une règle du français).");
        ap.forEach(([a, b]) => {
            const t = `Il manque l'apostrophe : « ${b} » et pas « ${a} ».`;
            if (!pt.includes(t))
                pt.push(t);
        });
        if (sents.some(sn => {
            const f = sn.ts.find(x => !x.p);
            return f && /^[a-z]/.test(f.o);
        }))
            pt.push("Une phrase commence toujours par une majuscule.");
        if (T.some(x => x.t === "i" && x.o === "i"))
            pt.push("« I » (je) s'écrit toujours en majuscule.");
        const nms = [...new Set(T.filter(x => TK_NAMES.has(x.t) && /^[a-z]/.test(x.o)).map(x => tkCap(x.t)))];
        if (nms.length)
            pt.push(nms.length === 1 ? `« ${nms[0]} » prend une majuscule.` : `${nms.map(x => "« " + x + " »").join(", ")} prennent une majuscule (en anglais, les prénoms, les pays et les nationalités en ont toujours une).`);
        const lastS = sents[sents.length - 1];
        if (lastS && !lastS.end)
            pt.push(lastS.q ? "C'est une question : termine par un point d'interrogation « ? »." : "Termine ta phrase par un point « . ».");
        else if (lastS && lastS.q && lastS.end === "." && !lastS.wh)
            pt.push("C'est une question : termine par « ? » et pas par un point.");
        sents.forEach(sn => (sn.parts || []).forEach((p, k) => {
            if (k === 0 && p.con && p.con.k === "intro" && TK_INTROCOMMA.has(p.con.en) && !p.icomma)
                pt.push(`Après « ${tkCap(p.con.en)} » en début de phrase, on met une virgule.`);
            if (k > 0 && !p.con && sn.parts[k - 1].lead && !p.comma)
                pt.push(`Quand la phrase commence par « ${tkCap(sn.parts[k - 1].con.en)} … », on met une virgule avant la suite.`);
            if (k > 0 && !p.con && !sn.parts[k - 1].lead)
                pt.push(p.comma ? "Deux phrases complètes ne se séparent pas par une simple virgule : mets un point, ou relie-les avec un connecteur (and, because, so…)." : "Il y a deux phrases collées : mets un point entre les deux, ou relie-les avec un connecteur (and, because, so…).");
        }));
    }
    // la phrase corrigée
    const nameCap = (x, tok, first) => {
        if (x === "i")
            return "I";
        if (x === "i'm" || x === "i've" || x === "i'll" || x === "i'd")
            return "I" + x.slice(1);
        if (TK_NAMES.has(x) || /^kai's$/.test(x))
            return tkCap(x);
        if (tok && tok.cap && !first && !TKFR.lex().n.has(x) && !tkVerbs().has(x) && !TK_SUBJ.has(x))
            return tkCap(x);
        return x;
    };
    const outWords = p => {
        const r = p.r, res = [], ws = p.qws || p.ws, map = p.qws ? null : r.out;
        let skip = false;
        for (let i = 0; i < ws.length; i++) {
            const tok = p.tk[i], orig = ws[i];
            let o = map ? map[i] : orig;
            if (tok && tok.half) {
                if (skip) {
                    skip = false;
                    continue;
                }
                if (o !== "")
                    res.push(o);
                continue;
            }
            skip = false;
            if (o === "")
                continue;
            const same = o === orig;
            if (tok && tok.neg) {
                o = same ? tok.o.toLowerCase() : (TK_NEGOUT[o] || o + " not");
                skip = true;
            }
            else if (tok && tok.cs) {
                const hs = !map || map[i + 1] === ws[i + 1];
                o = hs ? tok.o.toLowerCase() : tok.t;
                skip = hs;
            }
            else if (tok && tok.poss && same)
                o = tok.o.toLowerCase();
            res.push(nameCap(o, tok, i === 0));
            if (p.ca && p.ca.has(i))
                res[res.length - 1] += ",";
        }
        return res.join(" ");
    };
    const corrected = sents.map(sn => {
        let s = "";
        const P = sn.parts;
        P.forEach((p, k) => {
            const words = outWords(p);
            if (k === 0) {
                s = (p.con ? p.con.en + (p.con.k === "intro" && (TK_INTROCOMMA.has(p.con.en) || p.icomma) ? "," : "") + " " : "") + words;
                if (p.lead && P.length > 1)
                    s += ",";
            }
            else if (p.con)
                s += (p.comma ? ", " : " ") + p.con.en + " " + words;
            else if (P[k - 1].lead)
                s += " " + words;
            else
                s += ". " + tkCap(words);
        });
        s = s.replace(/\s+/g, " ").replace(/ ,/g, ",").replace(/,,/g, ",").trim();
        return tkCap(s) + (sn.end || (sn.q ? "?" : "."));
    }).join(" ");
    // la structure, pour l'affichage
    const parts = [];
    sents.forEach((sn, si) => {
        let last = "";
        (sn.parts || []).forEach((p, k) => {
            const r = p.r, o = r.out || p.ws, cap = x => x.split(" ").map(y => nameCap(y)).join(" ");
            if (sn.wh) {
                parts.push({ con: null, q: true, subject: "", verb: "", rest: tkCap(p.ws.join(" ")) });
                return;
            }
            const sep = !p.con && ((k > 0 && !sn.parts[k - 1].lead) || (k === 0 && si > 0)) ? "." : "";
            const subj = cap(o.slice(0, Math.max(r.vi, 0)).filter(Boolean).join(" "));
            if (!r.implied && subj)
                last = subj;
            parts.push({ con: p.con ? { en: p.con.en, fr: TKFR.conFr(p.con.en) } : null, sep, q: sn.q, implied: r.implied, subject: r.implied ? (last ? "(" + last + ")" : "") : subj, verb: cap(o.slice(Math.max(r.vi, 0), r.vEnd).filter(Boolean).join(" ")), rest: cap(o.slice(r.vEnd).filter(Boolean).join(" ")) });
        });
    });
    // la traduction
    let fr = "", unk = [];
    try {
        const tr = TKFR.sentences(sents.filter(sn => !sn.wh).map(sn => ({ end: sn.end || (sn.q ? "?" : "."), q: sn.q, parts: sn.parts.map(p => {
                const r = p.r, w = [], m = [];
                (r.out || p.ws).forEach((x, i) => {
                    m[i] = w.length;
                    String(x).split(" ").filter(Boolean).forEach(y => w.push(y));
                });
                m[(r.out || p.ws).length] = w.length;
                return { w, vi: r.vi < 0 ? -1 : m[r.vi], vEnd: r.vi < 0 ? 0 : m[r.vEnd], implied: r.implied, con: p.con, lead: p.lead, comma: p.comma };
            }) })));
        fr = tr.fr;
        unk = tr.unk;
    }
    catch (e) {
        fr = "";
    }
    return { ok, unsure: unknown.length > 0 || tkShaky(corrected), unknown, about: tkAbout(P, words), corrected, tips_fr: tips.slice(0, 4), punct_fr: pt.slice(0, 4), parts, fr, unk };
}
async function tkClaude(P, raw, mic) {
    if (TK.noAI || !window.claude || !window.claude.use)
        return null;
    let S = null;
    try {
        S = await window.claude.use("sample");
    }
    catch (e) {
        S = null;
    }
    if (!S) {
        TK.noAI = true;
        return null;
    }
    const prompt = `You are a kind English teacher for a French child (11 years old, level A1-A2).
The picture shows: ${P.d}
The question was: "${P.q}"
The child's sentence (${mic ? "spoken with speech-to-text: ignore capital letters and punctuation, and ignore obvious speech-recognition slips" : "typed on a keyboard: also check punctuation, capital letters and apostrophes"}): "${raw}"
Check the sentence structure. First find the connectors (and, but, because, so, when, then…) and the punctuation (commas, full stops) that split it into clauses; then check each clause: subject, verb (tense and agreement), word order, articles, prepositions. A subject can be shared after and / but / or. Also say if it talks about the picture; any words are fine, the child does not have to use the suggested words. If the child answered in French, set ok to false, put the English version in "corrected" and explain in tips_fr that the sentence must be in English. Watch for typical French-speaker mistakes: since + a duration (since two hours → for two hours) and the present tense with since / for (he is surfing since… → he has been surfing for…).
Reply with only this JSON:
{"ok": true or false (true when the grammar is correct; punctuation alone does not make it false), "about": true or false, "corrected": "the corrected sentence with correct punctuation, simple English, same meaning", "clauses": [{"connector": "connector before this clause or empty", "subject": "subject words (empty if shared)", "verb": "verb group", "rest": "the rest"}], "tips_fr": ["at most 3 very short grammar explanations in French for a child; empty list if correct"], "punct_fr": [${mic ? "" : "\"at most 2 very short punctuation explanations in French; empty list if correct\""}], "fr": "translation of the corrected sentence into simple everyday French, with basic words a French 11-year-old knows", "praise": "one short encouraging sentence in simple English"}`;
    try {
        const r = await S.json(prompt, { modelTier: "quick" });
        if (r && typeof r === "object" && typeof r.corrected === "string")
            return r;
        return null;
    }
    catch (e) {
        if (["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].includes(e && e.code))
            TK.noAI = true;
        return null;
    }
}
function tkStructHtml(parts) {
    return `<div class="tkstruct">${parts.map(p => `<div class="tkcl">${p.con ? `<span class="k"><i>Connector</i><b>${esc(p.con.en)}</b>${p.con.fr ? `<small>${esc(p.con.fr)}</small>` : ""}</span>` : p.sep ? `<span class="k p"><i>Full stop</i><b>.</b></span>` : ""}${p.q && !p.verb ? `<span class="c"><i>Question</i><b>${esc(p.rest)}</b></span>` : `<span class="s${p.implied ? " im" : ""}"><i>Subject</i><b>${esc(p.subject || "–")}</b></span><span class="v"><i>Verb</i><b>${esc(p.verb || "–")}</b></span>${p.rest ? `<span class="c"><i>Rest</i><b>${esc(p.rest)}</b></span>` : ""}`}</div>`).join("")}</div>`;
}
/* S-01 : phrase corrigée. Validée (Claude, ou règles sans doute) : « Correct sentence », avec son bouton audio.
   Pas sûre (risky) : « Kai's suggestion », affichée sans bouton audio, car on ne lit jamais une phrase non validée. */
function tkCorrHtml(text, risky, better) {
    if (risky)
        return `<div class="tkcorr"><i>Kai's suggestion</i><p class="tkm tksug">${esc(text)}</p></div>`;
    return `<div class="tkcorr"><i>${better ? "Even better" : "Correct sentence"}</i><button class="tkm" data-say="${esc(text)}">${SPK}<span>${esc(text)}</span></button></div>`;
}
async function tkCheck() {
    const box = document.getElementById("tktext"), raw = box.value.trim(), fb = document.getElementById("tkfb"), P = TKPICS[TK.i];
    if (TK.busy)
        return;
    if (!raw) {
        box.focus();
        box.classList.add("shake");
        setTimeout(() => box.classList.remove("shake"), 400);
        return;
    }
    TK.busy = true;
    const btn = document.getElementById("tkcheck");
    btn.disabled = true;
    fb.innerHTML = `<p class="tkwait">Kai is checking your sentence…</p>`;
    const mic = TK.mic;
    const L = tkLocal(P, raw, mic);
    let r = await tkClaude(P, raw, mic), src = "claude";
    if (r) {
        if (!Array.isArray(r.clauses) || !r.clauses.length)
            r.parts = L.parts;
        else
            r.parts = r.clauses.map(c => ({ con: c.connector ? { en: String(c.connector), fr: TKFR.conFr(String(c.connector).toLowerCase()) } : null, subject: String(c.subject || ""), verb: String(c.verb || ""), rest: String(c.rest || ""), implied: !c.subject }));
        if (!r.fr) {
            const L2 = tkLocal(P, r.corrected, true);
            r.frLocal = L2.fr;
            r.unk = L2.unk;
        }
    }
    else {
        r = L;
        src = "local";
    }
    if (src === "local" && r.french) {
        TK.busy = false;
        btn.disabled = false;
        const ex = P.m[0];
        fb.innerHTML = `<div class="tkres ko"><p class="verdict ko">IN ENGLISH, PLEASE!</p><p class="tkcon more">Ta phrase est en français 🇫🇷. Essaie de la dire en anglais ! Tu peux t'aider des idées de mots en haut. Par exemple :</p><button class="tkm" data-say="${esc(ex)}">${SPK}<span>${esc(ex)}</span></button><p class="tksrc">Checked by Kai's grammar rules</p></div>`;
        try {
            sayOne("In English, please! For example: " + ex, null);
        }
        catch (e) {
        }
        fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
    }
    TK.busy = false;
    btn.disabled = false;
    const uns = src === "local" && !!r.ok && !!r.unsure, risky = src === "local" && !!r.unsure, good = !!r.ok && !uns, about = r.about !== false && L.about !== false || r.about === true, same = (r.corrected || "").toLowerCase().replace(/[^a-z]/g, "") === raw.toLowerCase().replace(/[^a-z]/g, "");
    const li = a => (Array.isArray(a) ? a : []).filter(Boolean).slice(0, 3).map(x => `<li>${esc(String(x))}</li>`).join("");
    const tips = li(r.tips_fr), ptips = mic ? "" : (Array.isArray(r.punct_fr) ? r.punct_fr : []).filter(Boolean).slice(0, 4).map(x => `<li>${esc(String(x))}</li>`).join("");
    const cons = (r.parts || []).filter(p => p.con).map(p => `<b>${esc(p.con.en)}</b>${p.con.fr ? ` (${esc(p.con.fr)})` : ""}`);
    const praise = String(r.praise || (uns ? "Hmm, I'm not sure about one word." : good ? (about ? "Great sentence!" : "Good sentence!") : "Nice try! Let's fix it."));
    const frTxt = src === "claude" && r.fr ? esc(String(r.fr)) : (r.fr || r.frLocal || "");
    const unk = (r.unk || []).filter(Boolean);
    const unkL = src === "local" && (r.unknown || []).length ? `<div class="tkunk"><i>🔎 ${uns ? "Is this what you meant?" : "Check these words"}</i><ul class="tktips">${r.unknown.map(u => `<li>Kai ne connaît pas « ${esc(u.w)} »${u.s ? ` : tu voulais dire « <b>${esc(u.s)}</b> » ?` : ". Vérifie l'orthographe, ou essaie un autre mot."}</li>`).join("")}</ul></div>` : "";
    fb.innerHTML = `<div class="tkres ${good ? "ok" : uns ? "un" : "ko"}"><p class="verdict ${good ? "ok" : uns ? "un" : "ko"}">${uns ? "HMM… KAI ISN'T SURE" : good ? (about ? "GREAT SENTENCE!" : "GOOD SENTENCE!") : "ALMOST!"}</p>
${(r.parts || []).length ? tkStructHtml(r.parts) : ""}
${cons.length ? `<p class="tkcon">🔗 Tes idées sont reliées par ${cons.join(", ")}. Bravo !</p>` : good && (r.parts || []).length === 1 ? `<p class="tkcon more">🔗 Pour aller plus loin, relie deux idées avec un connecteur : and, but, because, so… <i>Kai is happy <b>because</b> he is playing.</i></p>` : ""}
${(!same || ptips || uns || risky) && r.corrected ? tkCorrHtml(r.corrected, risky, good && !ptips) : ""}
${risky && P.m[0] ? `<div class="tkcorr"><i>Example for this picture</i><button class="tkm" data-say="${esc(P.m[0])}">${SPK}<span>${esc(P.m[0])}</span></button></div>` : ""}
${unkL}${tips ? `<ul class="tktips">${tips}</ul>` : ""}
${ptips ? `<div class="tkpunct"><i>✏️ Ponctuation</i><ul class="tktips">${ptips}</ul></div>` : ""}
${frTxt ? `<div class="tkfr"><i>🇫🇷 En français</i><p>${frTxt}</p>${unk.length && src !== "claude" || unk.length && !r.fr ? `<small>Mots pas encore dans le lexique de Kai : ${unk.map(esc).join(", ")}</small>` : ""}<small>${src === "claude" && r.fr ? "Traduction de Claude, avec des mots simples." : "Traduction automatique avec les mots de Kai : elle peut être un peu maladroite."}</small></div>` : ""}
${!about ? `<p class="tktip2">Ta phrase doit parler de l'image ! Tu peux utiliser tes propres mots, ou t'aider des idées en haut.</p>` : ""}
<p class="tksrc">${src === "claude" ? "Checked by Claude" : "Checked by Kai's grammar rules"}</p></div>`;
    try {
        sayOne(praise + (risky ? (P.m[0] ? " For example: " + P.m[0] : "") : !good && r.corrected ? " " + r.corrected : ""), null);
    }
    catch (e) {
    }
    fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
document.getElementById("toTalk").addEventListener("click", openTalk);
document.getElementById("backTk").addEventListener("click", () => {
    if (TKREC)
        try {
            TKREC.abort();
        }
        catch (e) {
        }
    show("ty", true);
});
document.getElementById("talkbody").addEventListener("click", e => {
    const t = e.target;
    if (t.closest("#tkmic")) {
        tkListen();
        return;
    }
    if (t.closest("#tkcheck")) {
        tkCheck();
        return;
    }
    if (t.closest("#tknext")) {
        if (TKREC)
            try {
                TKREC.abort();
            }
            catch (err) {
            }
        tkPick();
        renderTalk();
        scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => sayOne(TKPICS[TK.i].q, document.querySelector("#talkbody .tkq .snd")), 300);
        return;
    }
    if (t.closest("#tkex")) {
        const x = document.getElementById("tkexbox");
        x.hidden = !x.hidden;
        return;
    }
    const s = t.closest("[data-say]");
    if (s) {
        document.querySelectorAll(".talk").forEach(x => x.classList.remove("talk"));
        sayOne(s.dataset.say, s);
    }
});
document.getElementById("talkbody").addEventListener("input", e => {
    if (e.target.id === "tktext" && e.inputType !== undefined)
        TK.mic = false;
});
document.getElementById("talkbody").addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.id === "tktext" && !e.shiftKey) {
        e.preventDefault();
        tkCheck();
    }
});
