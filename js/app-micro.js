/* ===== Micro partagé : « Let's talk English » et Kai's voyage (PO, 21/11) =====
   Reconnaissance vocale du navigateur, en anglais britannique. Selon le navigateur, la voix part chez Google (Chrome),
   Apple (Safari) ou Microsoft (Edge) pour être transformée en texte. Pas de traitement sur l'appareil
   (SpeechRecognition.available / processLocally) : l'appel fait planter l'onglet de Chromium 153 en test (21/11).
   Charte « enfant d'abord » (revue d'Ani I-1, 29/10) : avant le premier usage du micro sur l'appareil, un message dit
   à l'enfant où part sa voix et l'invite à prévenir ses parents. Choix du PO (21/11) : un simple message, sans code
   parent. Il n'est montré qu'une fois par appareil (clé kai.micinfo). L'app n'enregistre jamais la voix. */
const MIC_SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
const MIC_INFO = "kai.micinfo";
const MICSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M8.5 21h7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
function micInfoSeen() {
    try {
        return localStorage.getItem(MIC_INFO) === "1";
    }
    catch (e) {
        return false;
    }
}
/* go() est appelé dans le clic du bouton (geste de l'utilisateur), comme le demande le navigateur */
function micAsk(go) {
    if (micInfoSeen()) {
        go();
        return;
    }
    openModal("The microphone", `<p class="mtxt">Pour comprendre ce que tu dis, ton navigateur envoie souvent ta voix sur Internet, chez <b>Google</b> (Chrome), <b>Apple</b> (Safari) ou <b>Microsoft</b> (Edge), qui la transforment en texte. Kai, lui, n'enregistre pas ta voix.</p>
<p class="mtxt"><b>Dis à tes parents que tu utilises le micro.</b> Tu peux toujours écrire tes réponses à la place.</p>
<div class="endbtns"><button class="listen sm" data-mact="ok">OK, I've got it!</button><button class="ghost sm" data-mclose>Not now</button></div>`);
    MACT = { ok: () => {
            try {
                localStorage.setItem(MIC_INFO, "1");
            }
            catch (e) {
            }
            go();
        } };
}
/* une reconnaissance réglée pour l'app (anglais britannique, une phrase) */
function micNew(alts, interim) {
    const r = new MIC_SR();
    r.lang = "en-GB";
    r.interimResults = !!interim;
    r.continuous = false;
    r.maxAlternatives = alts || 1;
    return r;
}
/* erreurs : « off » = micro refusé ou absent (on n'affiche plus le bouton), « none » = rien entendu, « again » = réessayer */
function micErr(e) {
    const x = e && e.error;
    if (x === "not-allowed" || x === "service-not-allowed" || x === "audio-capture")
        return "off";
    return x === "no-speech" ? "none" : "again";
}
/* le navigateur écrit souvent les nombres en chiffres (« 7 », « 3rd ») : on propose aussi la forme en lettres */
const MIC_N = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
const MIC_T = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const MIC_O = { 1: "first", 2: "second", 3: "third", 5: "fifth", 8: "eighth", 9: "ninth", 12: "twelfth", 20: "twentieth" };
const micNum = n => n < 20 ? MIC_N[n] : n < 100 ? MIC_T[Math.floor(n / 10)] + (n % 10 ? "-" + MIC_N[n % 10] : "") : n === 100 ? "a hundred" : n === 1000 ? "a thousand" : null;
const micOrd = n => n >= 1 && n <= 20 ? MIC_O[n] || micNum(n) + "th" : null;
function micVariants(s) {
    const a = String(s || "").trim(), b = a.replace(/\b(\d+)(st|nd|rd|th)\b/gi, (m, d) => micOrd(+d) || m).replace(/\b\d+\b/g, d => micNum(+d) || d);
    return b !== a ? [a, b] : [a];
}
