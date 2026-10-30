/* Code — tranche de l'ancien index.html (lignes 2047–2059). Script classique : l'ordre des <script> compte. */
"use strict";
const UFREQ = { 3: ["Very common", "très courant"], 2: ["Common", "courant"], 1: ["Less common", "peu courant, plutôt rare"] };
const UREG = { i: ["Informal", "familier", "inf"], s: ["Slang", "argot", "inf"], f: ["Formal", "soutenu", "for"], e: ["Essay", "mot de dissertation", "ess"], l: ["Literary", "littéraire", "for"], o: ["Old-fashioned", "vieilli", "old"], u: ["Euphemism", "euphémisme : mot adouci", "soft"], c: ["Childish", "langage enfantin", "soft"], x: ["Can be rude", "péjoratif : peut blesser", "rude"], b: ["UK", "anglais britannique", "geo"], a: ["US", "anglais américain", "geo"] };
const LEXKIND = { adj: "adjectives", adv: "adverbs", con: "connectors", prep: "prepositions", phr: "phrasal", idi: "idioms" };
function useOf(kind, d) {
    if (!d)
        return { f: 2, r: "" };
    if (d._u)
        return d._u;
    let s = (USAGE[kind] || {})[kind === "verbs" ? d.v : d.w];
    const u = { f: d.f || (s ? +s[0] : 2), r: d.r !== undefined ? d.r : (s ? s.slice(1) : "") };
    return d._u = u;
}
function useLine(kind, d) {
    const u = useOf(kind, d), R = [...new Set(u.r)].filter(c => UREG[c]);
    if (!R.length)
        return "";
    return `<button class="use" type="button" data-help="usage" aria-label="Usage: ${R.map(c => UREG[c][0]).join(", ")}. What does it mean?">${R.map(c => `<em class="rg ${UREG[c][2]}">${c === "e" ? "✍ " : ""}${UREG[c][0]}</em>`).join("")}</button>`;
}
function usageHelp() {
    openModal("How is this word used?", `<div class="hlp">
<div class="hrow"><span class="hico"><em class="rg ess">✍</em></span><div><b>Registre</b><p>Une étiquette apparaît quand le mot n'est pas neutre (pas d'étiquette = mot de tous les jours) :</p><ul class="hreg">${Object.entries(UREG).map(([c, [en, fr, cl]]) => `<li><em class="rg ${cl}">${c === "e" ? "✍ " : ""}${en}</em> ${fr}</li>`).join("")}</ul></div></div>
<p class="hnote">Les mots du jour s'adaptent à ton niveau : un Beginner reçoit d'abord les mots les plus utilisés ; les mots soutenus, de dissertation ou rares arrivent aux niveaux suivants.</p></div>`);
}
/* les mots du jour selon le niveau : d'abord les mots courants et neutres */
function lvOkWord(kind, d, lv) {
    const u = useOf(kind, d);
    if (lv <= 0)
        return u.f >= 2 && !/[sfelox]/.test(u.r);
    if (lv === 1)
        return u.f >= 2 && !/[slox]/.test(u.r);
    if (lv === 2)
        return (u.f >= 2 || /e/.test(u.r)) && !/[so]/.test(u.r);
    return true;
}
