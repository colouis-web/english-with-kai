/* Code — tranche de l'ancien index.html (lignes 1868–1885). Script classique : l'ordre des <script> compte. */
"use strict";
const LORDER = { conj: ["be", "have", "psimple", "pcont", "imperative", "past", "pastcont", "pperf", "ppcont", "future", "futperf", "cond", "condperf"], grammar: ["articles", "plurals", "pronouns", "possessive", "demonstr", "questions", "negative", "order", "prepos", "genitive", "comparat", "superlat", "adverbs", "reflexive", "modals", "on", "relative", "passive", "reported"] };
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
function openLesson(id, back) {
    LES = id;
    LQ = null;
    renderLesson();
    show("lesson", back);
    setTimeout(() => sayOne(plain(LESSONS[id].say), document.querySelector("#lessonbody .bb")), 450);
}
