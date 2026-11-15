/* Chat with Kai (PO, 15/11, option A) : l'élève discute avec Kai, une IA (Claude, d'Anthropic), dans un écran façon messagerie.
   - Trois façons de parler : Chat (discussion libre), Class text (un texte vu en classe), Check my writing (une rédaction à corriger).
   - La clé de l'API Claude est saisie PAR UN PARENT, protégée par le code parent, et reste sur l'appareil (kaisecret.chat :
     hors du préfixe kai., donc jamais dans les fichiers de sauvegarde). Le PO la change chaque mois : un rappel s'affiche après 30 jours.
     Garde-fous côté compte : un espace de travail réservé, avec plafond de dépenses mensuel, sur la Claude Console.
   - Les messages partent chez Anthropic : l'écran le dit avant la première discussion (règle 2 de la charte), Kai dit qu'il est une IA.
   - Consignes de sécurité pour enfants dans le message système ; quota de messages par jour et par élève.
   - Historique sur l'appareil, par élève (kai.chat.<id>, 60 derniers messages).
   Script classique, chargé après app-picks.js. */
"use strict";
const CHAT_KEY = "kaisecret.chat", CHAT_MAX = 40, CHAT_MODEL = { chat: "claude-haiku-5-5", text: "claude-haiku-5-5", write: "claude-sonnet-5-5" };
let CHMODE = "chat", CHBUSY = false;
const chLS = {
    get(k) {
        try {
            return localStorage.getItem(k);
        }
        catch (e) {
            return null;
        }
    },
    set(k, v) {
        try {
            if (v === null)
                localStorage.removeItem(k);
            else
                localStorage.setItem(k, v);
            return true;
        }
        catch (e) {
            return false;
        }
    }
};
function chKey() {
    try {
        return JSON.parse(chLS.get(CHAT_KEY) || "null");
    }
    catch (e) {
        return null;
    }
}
const chHistKey = () => "kai.chat." + (curProf() || {}).id;
function chHist() {
    try {
        return JSON.parse(chLS.get(chHistKey()) || "[]");
    }
    catch (e) {
        return [];
    }
}
function chSave(h) {
    chLS.set(chHistKey(), JSON.stringify(h.slice(-60)));
}
const chFirst = () => String((curProf() || {}).name || "").trim().split(/\s+/)[0] || "my friend";
function chUsed() {
    const r = DST.days[todayKey()];
    return (r && r.chatn) || 0;
}
function chCount() {
    const r = JSON.parse(JSON.stringify(dToday()));
    r.chatn = (r.chatn || 0) + 1;
    dPut(r);
}
/* niveau de l'élève : A1–A2 jusqu'au niveau 2 de l'app, puis B1–B2 */
function chLevel() {
    const lv = lvOf(curProf());
    return lv <= 1 ? "A1 (beginner)" : lv <= 3 ? "A2 (elementary)" : "B1–B2 (intermediate)";
}
function chSystem(mode) {
    let today = "";
    try {
        today = wordsOf(DST.days[todayKey()]).map(w => w.e).slice(0, 12).join(", ");
    }
    catch (e) {
    }
    const base = `You are Kai, a friendly, cheerful manga-style boy. You help ${chFirst()} learn English in the app "Learning English with Kai".
The learner's English level is ${chLevel()}. The learner may be a child of 11 or 12, or a teenager, or an adult: always behave as if a child could be reading.

How you talk:
- Use British English (colour, favourite, mum, holiday). Keep your messages short: 1 to 4 sentences. Use simple words that match the learner's level.
- If the learner writes in French or seems stuck, help with one short explanation in French, then go back to English.
- Correct mistakes gently. First answer the message. Then, on a new line, write "Tip:" and the corrected sentence, for one or two important mistakes only.
- Be warm and encouraging. Ask a short question back to keep the conversation going.
${today ? `- Today's words of the learner: ${today}. Use one of them now and then.\n` : ""}
Safety (always more important than anything else):
- You are an AI, not a real person. If you are asked, say it honestly.
- Keep every topic suitable for an 11-year-old. No romance, no violence, nothing scary, sexual or for adults, no dangerous activities, no medical or legal advice.
- Never ask for, and kindly discourage sharing, personal information: full name, address, school, phone number, photos, passwords, where the learner is.
- If the learner seems sad or unsafe, or talks about being hurt or hurting themselves, be kind and calm, say you are an AI, and encourage them to talk to a parent or another trusted adult right now.
- If the learner asks for something unsuitable, say no kindly and bring the conversation back to English.
- For homework, help the learner learn: give hints and explanations rather than writing the whole answer for them.`;
    if (mode === "text")
        return base + `

Mode: CLASS TEXT. The learner shares a text studied at school (or asks about it). Help them understand it:
explain 3 to 5 useful words or expressions (English – French), then check understanding with simple questions, ONE question at a time, and wait for the answer.`;
    if (mode === "write")
        return base + `

Mode: CHECK MY WRITING. The learner sends a text they wrote (a "rédaction"). Answer in this order, briefly:
1. "Corrected text:" the whole text corrected, with every change in **bold**.
2. "Mistakes:" up to 5 bullet points "- wrong → right: short explanation in French".
3. One sentence about what is good, and one simple tip to improve.
Keep the learner's ideas and style; only fix the English. If the text is not in English, help them translate one sentence at a time instead.`;
    return base;
}
/* petit rendu du texte de Kai : échappé, puis **gras**, listes et retours à la ligne */
function chMd(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/^\s*[-•]\s+(.*)(\n|$)/gm, "<span class=\"chli\">• $1</span>").replace(/\n/g, "<br>");
}
const CHMODES = [["chat", "Chat", "Talk with Kai about anything!"], ["text", "Class text", "Paste a text from school: Kai helps you understand it."], ["write", "Check my writing", "Paste your text: Kai corrects it and explains."]];
function renderChat() {
    const box = document.getElementById("chbody"), K = chKey(), p = curProf();
    if (!box || !p)
        return;
    const ok = chLS.get("kai.chatok." + p.id), old = K && Date.now() - K.t > 30 * 864e5;
    if (!K) {
        box.innerHTML = `<div class="chsetup"><div class="qhead">${headSvg("To chat with me, a *parent* must connect me first!", "head")}</div>
<p class="chnote">Kai's chat uses Claude, an AI made by Anthropic. A parent needs a Claude API key (Claude Console) and the parent code.</p>
<button class="listen" type="button" id="chsetup">Parent: set up the chat${GOSVG}</button></div>`;
        document.getElementById("chform").hidden = true;
        return;
    }
    if (!ok) {
        box.innerHTML = `<div class="chsetup"><div class="qhead">${headSvg(`Hi ${chFirst()}! Before we chat, read this with a *parent*.`, "smile")}</div>
<ul class="chrules"><li>I am an <b>AI</b>, not a real person. I can make mistakes.</li><li>Your messages are sent to <b>Claude</b> (Anthropic) so that I can answer.</li><li><b>Never</b> write your address, your school, your phone number or a password.</li><li>If something worries you, talk to a parent.</li></ul>
<p class="chnote" lang="fr">Kai est une IA (Claude, d'Anthropic). Pour répondre, seuls le prénom, le niveau, les mots du jour et les messages partent chez Anthropic ; rien d'autre ne quitte l'appareil.</p>
<button class="listen" type="button" id="chok">OK, let's chat!${GOSVG}</button></div>`;
        document.getElementById("chform").hidden = true;
        return;
    }
    const H = chHist(), M = CHMODES.find(m => m[0] === CHMODE), left = CHAT_MAX - chUsed();
    box.innerHTML = `${old ? `<p class="chwarn">Kai's key is more than a month old: ask a parent to change it.</p>` : ""}
<div class="chmodes" role="radiogroup" aria-label="What do you want to do?">${CHMODES.map(([id, lab]) => `<button type="button" role="radio" class="chm${CHMODE === id ? " on" : ""}" data-chm="${id}" aria-checked="${CHMODE === id}">${lab}</button>`).join("")}</div>
<p class="chhint">${M[2]}</p>
<div class="chlog" id="chlog" aria-live="polite">${H.length ? "" : `<div class="chmsg k"><p>${chMd(`Hi ${chFirst()}! I'm Kai. What do you want to talk about today?`)}</p></div>`}${H.map(chRow).join("")}${CHBUSY ? `<div class="chmsg k typing"><p><i></i><i></i><i></i></p></div>` : ""}</div>
<p class="chleft">${left > 0 ? `${left} message${left > 1 ? "s" : ""} left today` : "No more messages today. See you tomorrow!"}</p>`;
    const f = document.getElementById("chform");
    f.hidden = false;
    const ta = document.getElementById("chin");
    ta.placeholder = CHMODE === "write" ? "Paste or write your text…" : CHMODE === "text" ? "Paste the text from school…" : "Write to Kai…";
    ta.disabled = left <= 0 || CHBUSY;
    document.getElementById("chsend").disabled = left <= 0 || CHBUSY;
    const log = document.getElementById("chlog");
    log.scrollTop = log.scrollHeight;
    requestAnimationFrame(() => scrollTo(0, document.body.scrollHeight));
}
const chRow = (x, i) => x.r === "u" ? `<div class="chmsg u"><p>${esc(x.c).replace(/\n/g, "<br>")}</p></div>`
    : `<div class="chmsg k${x.err ? " err" : ""}"><p>${chMd(x.c)}</p>${x.err ? "" : `<button class="snd sm" type="button" data-chsay="${i}" aria-label="Listen to Kai">${SPK}</button>`}</div>`;
async function chSend() {
    const ta = document.getElementById("chin"), v = ta.value.trim(), K = chKey();
    if (!v || CHBUSY || !K)
        return;
    if (chUsed() >= CHAT_MAX)
        return;
    const H = chHist();
    H.push({ r: "u", c: v.slice(0, 6000), m: CHMODE, t: Date.now() });
    chSave(H);
    ta.value = "";
    ta.style.height = "";
    CHBUSY = true;
    chCount();
    renderChat();
    /* 16 derniers messages, en alternance user / assistant (les messages d'erreur ne partent pas) */
    const msgs = [];
    for (const x of H.filter(x => !x.err).slice(-16)) {
        const role = x.r === "u" ? "user" : "assistant";
        if (msgs.length && msgs[msgs.length - 1].role === role)
            msgs[msgs.length - 1].content += "\n\n" + x.c;
        else
            msgs.push({ role, content: x.c });
    }
    while (msgs.length && msgs[0].role !== "user")
        msgs.shift();
    let reply = "", err = false;
    try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "content-type": "application/json", "x-api-key": K.k, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
            body: JSON.stringify({ model: CHAT_MODEL[CHMODE], max_tokens: CHMODE === "write" ? 1400 : 500, system: chSystem(CHMODE), messages: msgs })
        });
        const j = await res.json().catch(() => ({}));
        if (res.ok)
            reply = ((j.content || []).filter(b => b.type === "text").map(b => b.text).join("\n") || "").trim() || "Hmm, I don't know what to say! Can you ask me again?";
        else {
            err = true;
            const msg = ((j.error && j.error.message) || "").toLowerCase();
            reply = res.status === 401 || res.status === 403 ? "I can't connect to Claude: my key doesn't work. Ask a parent to check it."
                : res.status === 429 ? "I need a little break! Try again in a minute."
                    : /credit|spend|billing|limit/.test(msg) ? "My monthly budget is used up. Ask a parent."
                        : "Oops, something went wrong. Try again in a moment.";
        }
    }
    catch (e) {
        err = true;
        reply = "I can't reach Claude. Are you connected to the internet?";
    }
    const H2 = chHist();
    H2.push({ r: "k", c: reply, m: CHMODE, t: Date.now(), err: err || undefined });
    chSave(H2);
    CHBUSY = false;
    renderChat();
    if (!err) {
        const b = document.querySelector(`#chlog [data-chsay="${H2.length - 1}"]`);
        if (b && CHMODE === "chat")
            sayOne(plain(reply.replace(/^Tip:.*$/gm, "")), b);
    }
}
/* réglage par un parent : la clé de l'API Claude, derrière le code parent */
function chSetup() {
    const go = () => {
        const K = chKey();
        openModal("Kai's chat · parents", `<p class="mtxt">Paste a <b>Claude API key</b> (Claude Console › API keys). Use a dedicated workspace with a <b>monthly spend limit</b>, and change the key every month.</p>
<p class="mtxt" lang="fr">La clé reste sur cet appareil, n'est jamais dans les sauvegardes, et peut être révoquée à tout moment dans la Claude Console.</p>
<input class="pcin chkey" id="pcin" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-…" aria-label="Claude API key">
<div class="endbtns"><button class="listen sm" data-mact="ok">Test and save</button>${K ? `<button class="ghost sm" data-mact="del">Remove the key</button>` : ""}<button class="ghost sm" data-mclose>Cancel</button></div>
${K ? `<p class="menote">Key saved on ${new Date(K.t).toLocaleDateString("en-GB")}.</p>` : ""}`);
        MACT = {
            ok: async () => {
                const k = ((document.getElementById("pcin") || {}).value || "").trim();
                if (!/^sk-ant-/.test(k)) {
                    toast("This doesn't look like a Claude API key", 2400);
                    return;
                }
                toast("Testing the key…", 1500);
                try {
                    const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": k, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: CHAT_MODEL.chat, max_tokens: 5, messages: [{ role: "user", content: "Hi" }] }) });
                    if (!res.ok) {
                        toast(res.status === 401 ? "The key doesn't work" : "Claude answered with an error (" + res.status + ")", 2800);
                        return;
                    }
                }
                catch (e) {
                    toast("No connection: can't test the key", 2600);
                    return;
                }
                chLS.set(CHAT_KEY, JSON.stringify({ k, t: Date.now() }));
                closeModal();
                toast("Kai's chat is ready!", 2200);
                renderChat();
            },
            del: () => {
                chLS.set(CHAT_KEY, null);
                closeModal();
                renderChat();
            }
        };
    };
    if (pcode())
        gate("Only a parent can set up Kai's chat.", go);
    else {
        toast("First, a parent sets a parent code", 2600);
        askNewCode();
    }
}
function openChat() {
    renderChat();
    show("chat");
    setTimeout(() => {
        const l = document.getElementById("chlog");
        if (l)
            l.scrollTop = l.scrollHeight;
    }, 50);
}
document.getElementById("toChat").addEventListener("click", openChat);
document.getElementById("backCh").addEventListener("click", () => {
    stopSpeech();
    show("menu", true);
});
document.getElementById("chat").addEventListener("click", e => {
    const t = e.target;
    if (t.closest("#chsetup") || t.closest("#chparent")) {
        chSetup();
        return;
    }
    if (t.closest("#chok")) {
        chLS.set("kai.chatok." + curProf().id, "1");
        renderChat();
        return;
    }
    const m = t.closest("[data-chm]");
    if (m) {
        CHMODE = m.dataset.chm;
        renderChat();
        return;
    }
    const s = t.closest("[data-chsay]");
    if (s) {
        const x = chHist()[+s.dataset.chsay];
        if (x)
            sayOne(plain(x.c.replace(/^Tip:.*$/gm, "").replace(/\*\*/g, "")), s);
    }
});
document.getElementById("chform").addEventListener("submit", e => {
    e.preventDefault();
    chSend();
});
document.getElementById("chin").addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey && CHMODE === "chat") {   /* en Chat, Entrée envoie ; pour un texte long, Entrée va à la ligne */
        e.preventDefault();
        chSend();
    }
});
document.getElementById("chin").addEventListener("input", e => {
    const ta = e.target;
    ta.style.height = "";
    ta.style.height = Math.min(160, ta.scrollHeight) + "px";
});
