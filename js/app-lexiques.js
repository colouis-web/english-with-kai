/* Code — tranche de l'ancien index.html (lignes 2030–2044). Script classique : l'ordre des <script> compte. */
"use strict";
document.getElementById("toAdv").addEventListener("click", () => {
    ADV.open();
    show("adverbs");
});
document.getElementById("toPrep").addEventListener("click", () => {
    PREP.open();
    show("prepositions");
});
document.getElementById("backP").addEventListener("click", () => show("words", true));
document.getElementById("toCon").addEventListener("click", () => {
    CON.open();
    show("connectors");
});
document.getElementById("backA").addEventListener("click", () => show("words", true));
document.getElementById("backJ").addEventListener("click", () => show("words", true));
document.getElementById("toAdj").addEventListener("click", () => {
    ADJ.open();
    show("adjectives");
});
/* Dictionary : app du menu ; Quiz : tuile de Test yourself (PO 11/11, ex-page Words) */
document.getElementById("toDico").addEventListener("click", () => show("words"));
document.getElementById("toQuizzes").addEventListener("click", () => show("quizzes"));
document.getElementById("backW").addEventListener("click", () => show("menu", true));   /* Dictionary est une app du menu (PO 11/11) */
document.getElementById("backZ").addEventListener("click", () => show("ty", true));   /* Quiz est dans Test yourself (PO 11/11) */
document.getElementById("backC").addEventListener("click", () => show("words", true));
bubbles.forEach(b => {
    const go = () => speak([+b.dataset.i]);
    b.addEventListener("click", go);
    b.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            go();
        }
    });
});
/* ===== bouton « remonter en haut » (listes de mots, leçons) ===== */
