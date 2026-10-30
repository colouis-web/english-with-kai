/* Code — tranche de l'ancien index.html (lignes 2062–2106). Script classique : l'ordre des <script> compte. */
"use strict";
const PHR = makeLex({ id: "phr", unit: "phrasal verb", data: PHRD.data, cats: PHRD.cats });
const IDI = makeLex({ id: "idi", unit: "idiom", data: IDID.data, cats: IDID.cats, forms: n => `<div class="imean"><i>Meaning</i><p>${esc(n.mean)}</p></div>` });
document.getElementById("toPhr").addEventListener("click", () => {
    PHR.open();
    show("phrasals");
});
document.getElementById("toIdi").addEventListener("click", () => {
    IDI.open();
    show("idioms");
});
document.getElementById("backPh").addEventListener("click", () => show("words", true));
document.getElementById("backId").addEventListener("click", () => show("words", true));
Object.assign(KINDS, { phrasal: { title: "Quiz phrasal verbs", ask: "Which phrasal verb is it?", unit: "phrasal verb", lex: () => PHR }, idioms: { title: "Quiz idioms", ask: "Which idiom is it?", unit: "idiom", lex: () => IDI } });
Object.assign(KSHORT, { phrasal: "phr.", idioms: "idiom" });
[["toQPh", "phrasal"], ["toQI", "idioms"]].forEach(([id, k]) => document.getElementById(id).addEventListener("click", () => {
    DAILY = false;
    renderTopics(k);
    show("quiz");
}));
/* quiz des verbes : un thème « Essay verbs » */
(function () {
    const V = KINDS.verbs, t0 = V.tags, in0 = V.inTag;
    const isE = d => /e/.test(useOf("verbs", d).r);
    V.tags = () => {
        const t = t0();
        t.push(["essay", "Essay verbs", QPOOL.filter(isE).length]);
        return t;
    };
    V.inTag = (d, t) => t === "essay" ? isE(d) : in0(d, t);
})();
/* ===== fenêtre modale (traduction, aide, confirmation) ===== */
const MODAL = document.getElementById("modal");
let MLAST = null, MACT = null;
function openModal(title, html) {
    MLAST = document.activeElement;
    document.getElementById("mtitle").innerHTML = title;
    document.getElementById("mbody").innerHTML = html;
    MODAL.classList.add("on");
    document.documentElement.classList.add("mlock");
    document.getElementById("mbody").scrollTop = 0;
    setTimeout(() => {
        const x = MODAL.querySelector(".mx");
        if (x)
            try {
                x.focus({ preventScroll: true });
            }
            catch (e) {
            }
    }, 40);
}
function closeModal() {
    if (!MODAL.classList.contains("on"))
        return;
    MODAL.classList.remove("on");
    document.documentElement.classList.remove("mlock");
    MACT = null;
    if (MLAST && MLAST.focus)
        try {
            MLAST.focus({ preventScroll: true });
        }
        catch (e) {
        }
}
function confirmModal(title, text, yes, no, onYes) {
    openModal(title, `<p class="mtxt">${text}</p><div class="endbtns"><button class="listen sm" data-mact="yes">${yes}</button><button class="ghost sm" data-mclose>${no}</button></div>`);
    MACT = { yes: onYes };
}
MODAL.addEventListener("click", e => {
    const t = e.target;
    if (t === MODAL || t.closest("[data-mclose]")) {
        closeModal();
        return;
    }
    const a = t.closest("[data-mact]");
    if (a) {
        const f = MACT && MACT[a.dataset.mact];
        closeModal();
        if (f)
            f();
        return;
    }
    const s = t.closest("[data-say]");
    if (s)
        sayOne(s.dataset.say, s);
});
document.addEventListener("keydown", e => {
    if (e.key === "Escape" && MODAL.classList.contains("on")) {
        e.preventDefault();
        closeModal();
    }
});
/* ===== aide : étoiles, trophée, médailles ===== */
const PODIUM = '<svg class="st" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 20h20M4 20v-6h5v6M9.5 20V9h5v11M15 20v-8h5v8" fill="#f5b301" stroke="#1d1b2e" stroke-width="1.6" stroke-linejoin="round"/></svg>';
function rewardsHelp() {
    const L = LV[lvOf(curProf())];
    openModal("Stars, trophy &amp; medals", `<div class="hlp">
<div class="hrow"><span class="hico">${STAR}</span><div><b>Stars · les étoiles</b><p>Tu en gagnes chaque jour :</p><ul>
<li><b>+1</b> tous les 5 mots maîtrisés</li><li><b>+3</b> quand tu gagnes le trophée du jour</li><li><b>+2</b> pour chaque leçon réussie (${PASS}&nbsp;% ou plus)</li><li><b>+1</b> pour chaque quiz réussi sans faute (100&nbsp;%)</li><li><b>+1</b> pour chaque quiz bonus</li></ul></div></div>
<div class="hrow"><span class="hico">${trophySvg()}</span><div><b>Trophy · le trophée</b><p>Tu le gagnes quand tu atteins ton objectif de mots du jour : <b>${L.words} mots</b> au niveau ${L.name}. Il rapporte 3 étoiles.</p></div></div>
<div class="hrow"><span class="hico">${BOLT}</span><div><b>Bonus quizzes · les quiz bonus</b><p>Une fois le trophée gagné, chaque quiz, leçon ou test fait en plus le même jour est un quiz bonus : +1 étoile chacun.</p></div></div>
<div class="hrow"><span class="hico">${medalSvg("Bronze")}</span><div><b>Medals · les médailles</b><p>Elles comptent tes quiz bonus du jour :</p><div class="hmed">${MEDALS.map(([n, l]) => `<span>${medalSvg(l)}<b>${l}</b><i>${n} quiz bonus</i></span>`).join("")}</div><p>Elles repartent de zéro chaque matin.</p></div></div>
<div class="hrow"><span class="hico">${FLAME}</span><div><b>Day streak · la série</b><p>Le nombre de jours d'affilée où tu as fait au moins un tour de mots : un tour par jour suffit ! Le trophée, lui, demande l'objectif complet. Si tu sautes un jour, la série repart à zéro.</p></div></div>
<div class="hrow"><span class="hico">${PODIUM}</span><div><b>Rank · le rang</b><p>Toutes tes étoiles s'additionnent depuis le début :</p><p class="hrk">${RANKS.map(([n, r]) => `<span>${r} <i>${n}</i></span>`).join("")}</p></div></div>
<div class="hrow"><span class="hico">${starRow(3)}</span><div><b>Lesson stars · les étoiles des leçons</b><p>Chaque leçon de grammaire et de conjugaison a 3 étoiles : <b>1 étoile</b> quand tu réussis l'entraînement avec 80&nbsp;% ou plus, <b>2 étoiles</b> après 3 réussites, <b>3 étoiles</b> après 6.</p></div></div>
<p class="hnote">Ton niveau (Beginner, Practicer…) est différent : il monte avec ta régularité, les mots que tu connais, tes scores et les leçons réussies. Regarde « My level ».</p></div>`);
}
document.addEventListener("click", e => {
    const h = e.target.closest("[data-help]");
    if (h) {
        e.preventDefault();
        e.stopPropagation();
        if (h.dataset.help === "usage")
            usageHelp();
        else
            rewardsHelp();
    }
}, true);
/* ===== étoiles des leçons : 1 réussite à 80 % = 1 étoile, 3 = 2 étoiles, 6 = 3 étoiles ===== */
const LSTAR = [1, 3, 6], LGOOD = 80;
const starsFor = g => LSTAR.filter(n => g >= n).length;
function lessonGood(id) {
    const p = curProf(), o = p && p.lessons && p.lessons[id];
    return !o ? 0 : Number.isInteger(o.g) ? o.g : ((o.best || 0) >= LGOOD ? 1 : 0);
}
const starRow = (n, cls) => `<span class="lstars${cls ? " " + cls : ""}" role="img" aria-label="${n} star${n === 1 ? "" : "s"} out of 3">${[0, 1, 2].map(i => `<img class="${i < n ? "on" : "off"}" src="img/rw-star.webp" alt="">`).join("")}</span>`;
function starHint(g) {
    const s = starsFor(g);
    if (s >= 3)
        return "3 stars: you master this lesson!";
    const need = LSTAR[s] - g;
    return s === 0 ? "Get 80% or more in a practice to win your first star!" : `${need} more practice${need > 1 ? "s" : ""} at 80% or more for star number ${s + 1}!`;
}
