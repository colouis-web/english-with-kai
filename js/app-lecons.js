/* Code — tranche de l'ancien index.html (lignes 1868–1885). Script classique : l'ordre des <script> compte. */
"use strict";
const LORDER = { conj: ["be", "have", "psimple", "pcont", "imperative", "past", "pastcont", "usedto", "pperf", "ppcont", "pastperf", "future", "iffirst", "futperf", "cond", "condperf"], grammar: ["articles", "plurals", "pronouns", "possessive", "demonstr", "thereis", "questions", "negative", "can", "likeing", "linking", "exclam", "order", "prepos", "time", "genitive", "comparat", "superlat", "adverbs", "reflexive", "modals", "on", "relative", "verbing", "passive", "reported", "wantto"] };
/* Sprint 3 · US4 : classe de chaque leçon, d'après les programmes de langues vivantes (cycle 3 = 6e, niveau A1 ;
   cycle 4 = 5e-3e, niveau A2, B1 visé sur certaines activités ; lycée B1-B2). Proposition de l'équipe, à valider par le PO
   (docs/backlog/2026-11-09-us4-classes-lecons.md). Une leçon absente de la table est rangée au lycée. */
const LCLASSES = [["6e", "A1", "Sixième"], ["5e", "A1–A2", "Cinquième"], ["4e", "A2", "Quatrième"], ["3e", "A2–B1", "Troisième"], ["lycee", "B1", "Seconde, Première, Terminale"]];
const LCLASS = {
    be: "6e", have: "6e", psimple: "6e", pcont: "6e", imperative: "6e",
    past: "5e", future: "5e",
    pastcont: "4e", pperf: "4e", usedto: "4e", iffirst: "4e", cond: "4e",
    ppcont: "3e", pastperf: "3e",
    futperf: "lycee", condperf: "lycee",
    thereis: "6e", can: "6e", linking: "6e", exclam: "6e", verbing: "4e", wantto: "3e",
    articles: "6e", plurals: "6e", pronouns: "6e", possessive: "6e", demonstr: "6e", questions: "6e", negative: "6e", likeing: "6e", prepos: "6e", time: "6e", genitive: "6e",
    quant: "5e", comparat: "5e", superlat: "5e", adverbs: "5e", modals: "5e", order: "5e",
    relative: "4e", reflexive: "4e",
    on: "3e", passive: "3e", reported: "3e"
};
const lclass = id => LCLASS[id] || "lycee";
const lclassName = c => c === "lycee" ? "Lycée" : c;
/* l'ordre des leçons suit les classes (tri stable : à classe égale, on garde l'ordre de LORDER) */
function lessonsByClass(type) {
    const rank = Object.fromEntries(LCLASSES.map(([c], i) => [c, i]));
    return LORDER[type].filter(id => LESSONS[id]).sort((a, b) => rank[lclass(a)] - rank[lclass(b)]);
}
let LES = null, LQ = null;
const exRow = (en, fr) => `<div class="ex"><button class="snd sm" data-say="${esc(plain(en))}" aria-label="Listen">${SPK}</button><div><p class="en">${hl(en)}</p><p class="fr">${hl(fr)}</p></div></div>`;
function lessonBest(id) {
    const p = curProf();
    return p && p.lessons && p.lessons[id] ? p.lessons[id].best : null;
}
const lessonState = id => {
    const b = lessonBest(id);
    return b === null ? "new" : b >= PASS ? "pass" : "try";
};
function secHtml(s) {
    const head = s.h ? `<div class="dsec"><h2>${s.h}</h2></div>` : "", note = s.note ? `<p class="lnote">${s.note}</p>` : "";
    if (s.t === "ex")
        return head + (s.rule ? `<p class="lrule plain">${s.rule}</p>` : "") + `<div class="exs">${s.items.map(([en, fr, lab, warn]) => lab ? `<div class="use${warn ? " warn" : ""}"><p class="ulab">${lab}</p>${exRow(en, fr)}</div>` : exRow(en, fr)).join("")}</div>` + note;
    if (s.t === "table")
        return head + `<div class="ltwrap"><table class="ltable"><thead><tr>${s.cols.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>${s.rows.map((r, i) => `<tr class="${(s.hot || []).includes(i) ? "hot" : ""}">${r.map((c, j) => `<td>${(s.say || []).includes(j) ? `<button class="lsay" data-say="${esc(c.replace(/ \/ /g, ", "))}">${esc(c)}</button>` : esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` + (s.rule ? `<p class="lrule">${s.rule}</p>` : "") + note;
    if (s.t === "qa")
        return head + (s.rule ? `<p class="lrule plain">${s.rule}</p>` : "") + `<div class="exs">${s.items.map(([qq, a, fr]) => `<div class="ex qa"><button class="snd sm" data-say="${esc(plain(qq) + " " + plain(a))}" aria-label="Listen">${SPK}</button><div><p class="en">${hl(qq)}</p><p class="en ans">${hl(a)}</p><p class="fr">${esc(fr)}</p></div></div>`).join("")}</div>` + note;
    if (s.t === "traps")
        return head + (s.intro ? `<p class="lrule plain">${s.intro}</p>` : "") + `<div class="traps">${s.rows.map(([fr, ok, ko]) => `<div class="trap"><p class="tfr">${esc(fr)}</p><button class="tok" data-say="${esc(plain(ok))}">${CHECK}<span>${hl(ok)}</span></button><p class="tko">${CROSS}<s>${esc(ko)}</s></p></div>`).join("")}</div>`;
    return "";
}
function renderLesson() {
    const L = LESSONS[LES], best = lessonBest(LES);
    document.getElementById("ltitle").textContent = L.title;
    document.getElementById("lessonbody").innerHTML = `<div class="qhead">${headSvg(L.say, L.img)}</div>
<p class="lintro">${L.intro}</p>
${L.sections.map(secHtml).join("")}
<div class="lgo"><div class="lsbox">${starRow(starsFor(lessonGood(LES)), "big")}<p>${starHint(lessonGood(LES))} <button class="qhelp sm" type="button" data-help="rewards" aria-label="How do lesson stars work?">?</button></p></div><p>${best === null ? `Ready? ${PQN} questions to check you've got it! New ones every time (${lessonBank(LES).length} in all).` : best >= PASS ? (best === 100 ? `Lesson passed with <b>100%</b>. Bravo!` : `Lesson passed: best score <b>${best}%</b>. Can you get 100%?`) : `Your best score: <b>${best}%</b>. You need ${PASS}% to pass the lesson.`}</p><button class="listen" id="lpractice">Practise${GOSVG}</button></div>`;
}
let LFROM = null;   /* page d'où la leçon a été ouverte : "tests" (liste à revoir de My weekly review) ; null : la liste de la leçon */
function openLesson(id, back) {
    if (LFROM && !(document.getElementById(LFROM) || document.body).classList.contains("on"))
        LFROM = null;
    LES = id;
    LQ = null;
    renderLesson();
    show("lesson", back);
    setTimeout(() => sayOne(plain(LESSONS[id].say), document.querySelector("#lessonbody .bb")), 450);
}
