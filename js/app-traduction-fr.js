/* Code — tranche de l'ancien index.html (lignes 2109–2112). Script classique : l'ordre des <script> compte. */
"use strict";
const frHash = s => {
    let h = 5381;
    for (let i = 0; i < s.length; i++)
        h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
};
function frOf(q) {
    if (q.fr)
        return q.fr;
    if (!q.q || !q.q.includes("___") || !q.o)
        return "";
    return FRT[frHash(q.q + "|" + q.o[0])] || "";
}
const frBtn = q => frOf(q) ? `<button class="frb" type="button" data-fr aria-label="French translation">FR</button>` : "";
function showFr(q) {
    const fr = frOf(q);
    if (fr)
        openModal("En français", `<p class="mfr">${esc(fr)}</p><p class="mnote">La traduction t'aide à comprendre la phrase. À toi de trouver la réponse en anglais !</p><div class="endbtns"><button class="listen sm" data-mclose>OK</button></div>`);
}
