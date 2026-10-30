/* Langue des textes français (S-10, accessibilité).
   Pourquoi : la page est <html lang="en"> ; sans balise lang="fr" un lecteur d'écran lit les phrases françaises
   (traductions, introductions de leçon, explications) avec l'accent anglais, ce qui est incompréhensible pour l'élève.
   Comment : au lieu de modifier chaque gabarit HTML des écrans, un observateur pose lang="fr" sur les éléments qui
   portent du texte français, dès qu'ils apparaissent. Pour couvrir un nouvel élément français, ajouter son
   sélecteur CSS dans FR_SELECTORS : c'est le seul réglage. Les phrases françaises dans les bulles SVG de Kai sont
   balisées par headSvg(…, "fr"). Script classique (pas de module) : l'app doit tourner en file:// et sur GitHub Pages. */
"use strict";
const FR_SELECTORS = [
    ".fr", ".t3fr",                     /* traductions sous les exemples, mot à retrouver en français */
    ".lintro", ".lrule", ".lnote", ".tfr",                   /* leçons : introduction, règle, remarque, pièges des francophones */
    ".vh .tr", ".mood i", ".mymood small",           /* traduction d'un mot, humeurs (« Bien », « Triste »…) */
    ".tkfr p", ".tktips", ".tkpunct ul", ".tkhint span", ".tkmsg", ".tktip2", ".tkcon", ".tkw i" /* Let's talk : conseils en français */
].join(",");
function markFrench(root) {
    if (!root || root.nodeType !== 1)
        return;
    const els = root.matches(FR_SELECTORS) ? [root] : [];
    root.querySelectorAll(FR_SELECTORS).forEach(el => els.push(el));
    els.forEach(el => {
        if (!el.hasAttribute("lang"))
            el.setAttribute("lang", "fr");
    });
}
(function () {
    let pending = new Set(), planned = false;
    /* on regroupe les ajouts d'une même image (un écran entier est réécrit d'un coup) */
    const flush = () => {
        planned = false;
        const nodes = pending;
        pending = new Set();
        nodes.forEach(markFrench);
    };
    new MutationObserver(list => {
        list.forEach(m => m.addedNodes.forEach(n => pending.add(n)));
        if (!planned) {
            planned = true;
            requestAnimationFrame(flush);
        }
    }).observe(document.body, { childList: true, subtree: true });
    markFrench(document.body);
})();
