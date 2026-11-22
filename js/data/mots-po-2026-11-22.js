/* Mots demandés par le PO (22/11/2026 : « il manque encore des mots : persévérant, persévérance, animosité, bande dessinée,
   ignorance, clairvoyance »).
   - bande dessinée : déjà là (comic) ; sa traduction « une BD (bande dessinée) » n'était pas trouvée par la recherche, qui
     ignore les parenthèses. Corrigée dans ndict.js : « une BD / une bande dessinée ».
   - clairvoyance : FAUX AMI. L'anglais « clairvoyance » veut dire la voyance (voir l'avenir). Le sens français
     (la lucidité, la perspicacité) se dit « insight », ajouté ici.
   - persévérant : deux adjectifs, persevering (le mot exact) et persistent (plus courant, aussi « tenace »).
   Anglais britannique ; IPA britannique (Cambridge, Oxford) ; exemples pour un enfant de 11-12 ans.
   Mots de lycée : lv 2 (dès Intermediate) ou 3 (Advanced), f 1 ; dans Kai's voyage, ils viennent après les mots courants
   et ne décalent aucun port commencé.
   Chargé après data/adjectifs-habilete-2026-11-20.js ; ajouts EN FIN de tableau : les index existants ne bougent pas. */
"use strict";
(function () {
    const n0 = NDICT.length;
    NDICT.push(...[
{"w":"perseverance","lv":2,"pl":"—","fr":"la persévérance","e":"🧗","ipa":"ˌpɜːsɪˈvɪərəns","pr":"peur-si-VI-reunns","cat":"feelings","t":"u","ipl":false,"f":1,"ex":[["With *perseverance*, you can learn to play any instrument.","Avec de la *persévérance*, tu peux apprendre à jouer de n'importe quel instrument."],["Her *perseverance* paid off: she finally won the race.","Sa *persévérance* a payé : elle a enfin gagné la course."]]},
{"w":"animosity","lv":3,"pl":"—","fr":"l'animosité (f)","e":"😤","ipa":"ˌænɪˈmɒsəti","pr":"a-ni-MO-seu-ti","cat":"feelings","t":"u","ipl":false,"f":1,"ex":[["There's no *animosity* between the two teams: they shake hands after every match.","Il n'y a aucune *animosité* entre les deux équipes : elles se serrent la main après chaque match."],["The old *animosity* between the two neighbours ended when they became friends.","La vieille *animosité* entre les deux voisins a pris fin quand ils sont devenus amis."]]},
{"w":"ignorance","lv":2,"pl":"—","fr":"l'ignorance (f)","e":"🙈","ipa":"ˈɪɡnərəns","pr":"IG-neu-reunns","cat":"studies","t":"u","ipl":false,"f":1,"ex":[["*Ignorance* is no excuse: read the rules before you play.","L'*ignorance* n'est pas une excuse : lis les règles avant de jouer."],["Many fears come from *ignorance*: learn about spiders and you'll be less scared!","Beaucoup de peurs viennent de l'*ignorance* : renseigne-toi sur les araignées et tu auras moins peur !"]]},
{"w":"insight","lv":2,"pl":"insights","fr":"la clairvoyance / la perspicacité / un aperçu","e":"💡","ipa":"ˈɪnsaɪt","pr":"INN-saïtt","cat":"studies","t":"c","ipl":false,"f":1,"ex":[["My grandma has great *insight*: she always knows when something is wrong.","Ma grand-mère a une grande *clairvoyance* : elle sait toujours quand quelque chose ne va pas."],["This book gives an *insight* into life in a medieval castle.","Ce livre donne un *aperçu* de la vie dans un château médiéval."]]}
    ]);
    NDICT.slice(n0).forEach((n, k) => indexNoun(n, n0 + k));
    const add = (L, items) => items.forEach(d => {
        d.i = L.data.length;
        d.keys = [d.w, ...d.fr.split("/").map(x => x.replace(/\(.*?\)/g, ""))].map(norm).filter(Boolean);
        d.lkeys = [d.cat, ...(d.also || [])].map(c => norm(L.cats[c].label));
        L.data.push(d);
    });
    add(ADJ, [
{"w":"persevering","lv":3,"cmp":"more persevering","sup":"the most persevering","fr":"persévérant(e)","ipa":"ˌpɜːsɪˈvɪərɪŋ","pr":"peur-si-VI-ring","cat":"personality","f":1,"ex":[["Be *persevering*: practise every day and you'll get better.","Sois *persévérant* : entraîne-toi tous les jours et tu progresseras."],["She's a *persevering* pupil who never gives up.","C'est une élève *persévérante* qui n'abandonne jamais."]]},
{"w":"persistent","lv":2,"cmp":"more persistent","sup":"the most persistent","fr":"tenace / persévérant(e)","ipa":"pəˈsɪstənt","pr":"peur-SISS-teunnt","cat":"personality","f":1,"ex":[["Tom is *persistent*: he asked his parents for a dog every day for a year!","Tom est *tenace* : il a demandé un chien à ses parents tous les jours pendant un an !"],["You have to be *persistent* to solve a hard puzzle.","Il faut être *persévérant* pour résoudre un casse-tête difficile."]]}
    ]);
})();
