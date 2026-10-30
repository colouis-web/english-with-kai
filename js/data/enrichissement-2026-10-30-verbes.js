/* Enrichissement du 30/10/2026 — lot 1, verbes (voir enrichissement-2026-10-30.js et docs/enrichissement/plan.md) */
const D0_ENR1=DICT.length;
DICT.push(...[
{"v":"practise","fr":"s'entraîner, pratiquer","ipa":"ˈpræktɪs","pr":"PRAK-tiss","pt":"practised","pp":"practised","irr":false,"ex":[["I *practise* the piano every day.","Je *m'entraîne* au piano tous les jours."],["We *practised* our English with Kai.","Nous *avons pratiqué* notre anglais avec Kai."]],"q":1},
{"v":"revise","fr":"réviser (une leçon)","ipa":"rɪˈvaɪz","pr":"ri-VAÏZ","pt":"revised","pp":"revised","irr":false,"ex":[["I *revise* my words before a test.","Je *révise* mes mots avant un contrôle."],["She *revised* her history lesson last night.","Elle *a révisé* sa leçon d'histoire hier soir."]],"q":1},
{"v":"chat","fr":"bavarder, discuter","ipa":"tʃæt","pr":"tchatt","pt":"chatted","pp":"chatted","irr":false,"ex":[["I *chat* with my friends at break time.","Je *discute* avec mes amis à la récré."],["We *chatted* for hours on Saturday.","Nous *avons bavardé* pendant des heures samedi."]],"q":1}
]);
DICT.slice(D0_ENR1).forEach((d,k)=>indexVerb(d,D0_ENR1+k));
