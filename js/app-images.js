/* Images de Kai : jamais d'image cassée (PO, 13/11 : « en cas d'erreur, une image en erreur sans dessin de Kai »).
   1. Les visages des quiz, des fins de partie et des humeurs sont préchargés peu après le démarrage : sur un réseau lent,
      le visage d'une mauvaise réponse (grumpy, bored…) était téléchargé au moment même où il s'affichait.
   2. Une image qui n'arrive pas est redemandée une fois ; si elle échoue encore, Kai garde un visage connu (kai-head).
   Script classique, chargé après app-menu-cartes.js. */
"use strict";
(function () {
    const KAI = /(^|\/)img\/kai-[a-z0-9-]+\.webp(\?.*)?$/, SPARE = "img/kai-head.webp";
    const srcOf = el => el.tagName === "IMG" ? el.getAttribute("src") : el.getAttribute("href") || el.getAttribute("xlink:href");
    const setSrc = (el, s) => el.tagName === "IMG" ? el.setAttribute("src", s) : el.setAttribute("href", s);
    addEventListener("error", e => {
        const el = e.target;
        if (!el || (el.tagName !== "IMG" && el.tagName !== "image"))
            return;
        const s = srcOf(el) || "";
        if (!KAI.test(s))
            return;
        const n = +(el.dataset.kaiTry || 0);
        el.dataset.kaiTry = n + 1;
        if (n === 0)
            setTimeout(() => setSrc(el, s.split("?")[0] + "?r=" + Date.now()), 400);   /* 2e essai, sans le cache */
        else if (n === 1 && !s.startsWith(SPARE))
            setSrc(el, SPARE);
    }, true);
    function preload() {
        const set = new Set(["head", "smile", "joy", "congrats"]);
        try {
            Object.values(ROT).flat().forEach(f => set.add(f));
            Object.keys(END_L).forEach(k => set.add(k));
            MOODS.forEach(m => set.add(m.img));
        }
        catch (e) {
        }
        set.forEach(f => {
            const i = new Image();
            i.decoding = "async";
            i.src = `img/kai-${f}.webp`;
        });
    }
    const later = () => "requestIdleCallback" in window ? requestIdleCallback(preload, { timeout: 4000 }) : setTimeout(preload, 2500);
    if (document.readyState === "complete")
        later();
    else
        addEventListener("load", later);
})();
