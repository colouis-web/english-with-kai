/* =====================================================================================
   Enrichissement du 30/10/2026 — lot 1 (Matt, sprint Kai 1). Plan : docs/enrichissement/plan.md
   À RELIRE par le scrum master avant branchement. Entrées dont je ne suis pas sûr : marquées « À VÉRIFIER ».

   Contenu :
   - NDICT : 34 noms du programme de 6e absents du dictionnaire (famille, école, maison, santé, vêtements,
     loisirs, ville, heure).
   - DICT  : 3 verbes (practise, revise, chat), avec "q":1 pour entrer dans les quiz.
   - LBANK.be : 24 exercices « there is / there are » (affirmatif, négatif avec any, questions, réponses
     courtes, how many, prétérit there was / there were). Il n'en existait que 6, tous affirmatifs.
     Chaque exercice porte sa traduction ("fr"), comme ceux de LBANK.quant.

   ORDRE DE CHARGEMENT (pour Ludo) — important :
   1. après les fichiers qui définissent NDICT, DICT et LBANK ;
   2. AVANT le code qui indexe les données, sinon les nouvelles entrées n'ont ni index ni clés de recherche :
      - DICT.forEach((d,i)=>{d.i=i;DMAP[d.v]=d;d.keys=…})   (index.html l. 1184, juste après DICT.push)
      - QPOOL=DICT.filter(d=>d.q||…)                         (l. 1216)
      - NDICT.forEach((n,i)=>{n.i=i;n.keys=…;n.lkeys=…})     (l. 1971)
      - lessonBank(id) met la banque en cache au premier appel : charger avant toute leçon.
   Format : identique aux entrées existantes (mêmes champs, même ordre). Catégories : clés existantes de NCAT.
   ===================================================================================== */

NDICT.push(...[
/* --- famille et personnes --- */
{"w":"grandma","pl":"grandmas","fr":"une mamie","e":"👵","ipa":"ˈɡrænmɑː","pr":"GRANN-mâ","cat":"family","t":"c","ipl":false,"ex":[["My *grandma* makes great pancakes.","Ma *mamie* fait de super crêpes."],["Both my *grandmas* live in Lyon.","Mes deux *mamies* habitent à Lyon."]]},
{"w":"grandpa","pl":"grandpas","fr":"un papi","e":"👴","ipa":"ˈɡrænpɑː","pr":"GRANN-pâ","cat":"family","t":"c","ipl":false,"ex":[["My *grandpa* takes me fishing.","Mon *papi* m'emmène à la pêche."],["My two *grandpas* love football.","Mes deux *papis* adorent le foot."]]},
{"w":"stepmother","pl":"stepmothers","fr":"une belle-mère (la femme du père)","e":"👩","ipa":"ˈstepmʌðə","pr":"STÈP-meu-zeur","cat":"family","t":"c","ipl":false,"ex":[["My *stepmother* is very kind.","Ma *belle-mère* est très gentille."],["Some of my friends have got *stepmothers*.","Certains de mes amis ont une *belle-mère*."]]},
{"w":"stepfather","pl":"stepfathers","fr":"un beau-père (le mari de la mère)","e":"👨","ipa":"ˈstepfɑːðə","pr":"STÈP-fâ-zeur","cat":"family","t":"c","ipl":false,"ex":[["My *stepfather* helps me with my homework.","Mon *beau-père* m'aide à faire mes devoirs."],["*Stepfathers* are part of the family too.","Les *beaux-pères* font aussi partie de la famille."]]},
{"w":"only child","pl":"only children","fr":"un enfant unique","e":"🧒","ipa":"ˌəʊnli ˈtʃaɪld","pr":"ôoun-li TCHAÏLD","cat":"family","t":"c","ipl":true,"ex":[["I'm an *only child*: I haven't got any brothers or sisters.","Je suis *enfant unique* : je n'ai ni frère ni sœur."],["There are three *only children* in my class.","Il y a trois *enfants uniques* dans ma classe."]]},
{"w":"best friend","pl":"best friends","fr":"un meilleur ami / une meilleure amie","e":"🤝","ipa":"ˌbest ˈfrend","pr":"bèst FRÈNND","cat":"family","t":"c","ipl":false,"ex":[["Tom is my *best friend*.","Tom est mon *meilleur ami*."],["Emma and Lily are *best friends*.","Emma et Lily sont *meilleures amies*."]]},
{"w":"nickname","pl":"nicknames","fr":"un surnom","e":"🏷","ipa":"ˈnɪkneɪm","pr":"NIK-néïm","cat":"identity","t":"c","ipl":false,"ex":[["My name is Thomas, but my *nickname* is Tom.","Je m'appelle Thomas, mais mon *surnom*, c'est Tom."],["Kai gives funny *nicknames* to his friends.","Kai donne des *surnoms* rigolos à ses amis."]]},
/* --- école --- */
{"w":"corridor","pl":"corridors","fr":"un couloir","e":"🚪","ipa":"ˈkɒrɪdɔː","pr":"KO-ri-dôr","cat":"school","t":"c","ipl":false,"ex":[["Don't run in the *corridor*!","Ne cours pas dans le *couloir* !"],["Our school has long *corridors*.","Notre collège a de longs *couloirs*."]],"also":["house"]},
{"w":"language","pl":"languages","fr":"une langue (qu'on parle)","e":"🗣","ipa":"ˈlæŋɡwɪdʒ","pr":"LANN-gouidj","cat":"school","t":"c","ipl":false,"ex":[["English is my favourite *language*.","L'anglais est ma *langue* préférée."],["Kai speaks three *languages*.","Kai parle trois *langues*."]],"also":["countries"]},
/* --- maison --- */
{"w":"toothbrush","pl":"toothbrushes","fr":"une brosse à dents","e":"🪥","ipa":"ˈtuːθbrʌʃ","pr":"TOUTH-breuch","cat":"house","t":"c","ipl":false,"ex":[["Don't forget your *toothbrush*!","N'oublie pas ta *brosse à dents* !"],["Our *toothbrushes* are in the bathroom.","Nos *brosses à dents* sont dans la salle de bains."]]},
{"w":"toothpaste","pl":"—","fr":"le dentifrice","e":"🪥","ipa":"ˈtuːθpeɪst","pr":"TOUTH-péïst","cat":"house","t":"u","ipl":false,"ex":[["There isn't any *toothpaste* left.","Il n'y a plus de *dentifrice*."],["I like mint *toothpaste*.","J'aime le *dentifrice* à la menthe."]]},
{"w":"cooker","pl":"cookers","fr":"une cuisinière (l'appareil)","e":"🍳","ipa":"ˈkʊkə","pr":"KOU-keur","cat":"house","t":"c","ipl":false,"ex":[["Be careful, the *cooker* is hot!","Attention, la *cuisinière* est chaude !"],["A cook uses a *cooker*: *cookers* are not people!","Un cuisinier utilise une *cuisinière* : les *cuisinières* ne sont pas des personnes !"]]},
{"w":"bookcase","pl":"bookcases","fr":"une bibliothèque (le meuble)","e":"📚","ipa":"ˈbʊkkeɪs","pr":"BOUK-kéïss","cat":"house","t":"c","ipl":false,"ex":[["My comics are on the *bookcase*.","Mes BD sont dans la *bibliothèque*."],["There are two *bookcases* in the living room.","Il y a deux *bibliothèques* dans le salon."]]},
/* --- corps et santé --- */
{"w":"tummy","pl":"tummies","fr":"le ventre (mot familier)","e":"🧍","ipa":"ˈtʌmi","pr":"TEU-mi","cat":"body","t":"c","ipl":false,"ex":[["I ate too much: my *tummy* hurts!","J'ai trop mangé : j'ai mal au *ventre* !"],["The puppies have got round *tummies*.","Les chiots ont le *ventre* tout rond."]],"r":"c"},
{"w":"headache","pl":"headaches","fr":"un mal de tête","e":"🤕","ipa":"ˈhedeɪk","pr":"HÈD-éïk","cat":"body","t":"c","ipl":false,"ex":[["I've got a *headache*.","J'ai *mal à la tête*."],["Loud music gives me *headaches*.","La musique forte me donne des *maux de tête*."]]},
{"w":"toothache","pl":"—","fr":"le mal de dents","e":"🦷","ipa":"ˈtuːθeɪk","pr":"TOUTH-éïk","cat":"body","t":"u","ipl":false,"ex":[["I've got *toothache*: I need to see the dentist.","J'ai *mal aux dents* : je dois aller chez le dentiste."],["Too many sweets can give you *toothache*.","Trop de bonbons peuvent donner *mal aux dents*."]]},
{"w":"sore throat","pl":"sore throats","fr":"un mal de gorge","e":"🤒","ipa":"ˌsɔː ˈθrəʊt","pr":"sôr THRÔOUT","cat":"body","t":"c","ipl":false,"ex":[["I've got a *sore throat* and a cold.","J'ai *mal à la gorge* et un rhume."],["In winter, lots of children have *sore throats*.","En hiver, beaucoup d'enfants ont *mal à la gorge*."]]},
{"w":"fever","pl":"fevers","fr":"de la fièvre","e":"🤒","ipa":"ˈfiːvə","pr":"FÎ-veur","cat":"body","t":"c","ipl":false,"ex":[["Lily has got a *fever*: she's staying at home today.","Lily a de la *fièvre* : elle reste à la maison aujourd'hui."],["Babies often get *fevers*.","Les bébés ont souvent de la *fièvre*."]]},
/* --- vêtements --- */
{"w":"sweatshirt","pl":"sweatshirts","fr":"un sweat","e":"👕","ipa":"ˈswetʃɜːt","pr":"SOUÈT-cheurt","cat":"clothes","t":"c","ipl":false,"ex":[["I'm wearing my blue *sweatshirt*.","Je porte mon *sweat* bleu."],["Our football club has got red *sweatshirts*.","Notre club de foot a des *sweats* rouges."]]},
{"w":"raincoat","pl":"raincoats","fr":"un imperméable / un ciré","e":"🧥","ipa":"ˈreɪnkəʊt","pr":"RÉÏNN-kôout","cat":"clothes","t":"c","ipl":false,"ex":[["It's raining: put on your *raincoat*!","Il pleut : mets ton *imperméable* !"],["The children are wearing yellow *raincoats*.","Les enfants portent des *cirés* jaunes."]],"also":["weather"]},
{"w":"sunglasses","pl":"sunglasses","fr":"des lunettes de soleil (f)","e":"🕶","ipa":"ˈsʌnɡlɑːsɪz","pr":"SEUNN-glâ-siz","cat":"clothes","t":"p","ipl":false,"ex":[["Kai is wearing *sunglasses* on the beach.","Kai porte des *lunettes de soleil* à la plage."],["Where are my *sunglasses*?","Où sont mes *lunettes de soleil* ?"]],"also":["weather"]},
{"w":"necklace","pl":"necklaces","fr":"un collier","e":"📿","ipa":"ˈnekləs","pr":"NÈK-leuss","cat":"clothes","t":"c","ipl":false,"ex":[["My sister has got a silver *necklace*.","Ma sœur a un *collier* en argent."],["We made *necklaces* with shells.","Nous avons fabriqué des *colliers* avec des coquillages."]]},
/* --- loisirs --- */
{"w":"hobby","pl":"hobbies","fr":"un loisir / un passe-temps","e":"🎨","ipa":"ˈhɒbi","pr":"HO-bi","cat":"games","t":"c","ipl":false,"ex":[["What's your favourite *hobby*?","Quel est ton *loisir* préféré ?"],["My *hobbies* are drawing and swimming.","Mes *loisirs*, ce sont le dessin et la natation."]]},
{"w":"party","pl":"parties","fr":"une fête","e":"🎉","ipa":"ˈpɑːti","pr":"PÂR-ti","cat":"games","t":"c","ipl":false,"ex":[["Are you coming to my birthday *party*?","Tu viens à ma *fête* d'anniversaire ?"],["We have two *parties* this weekend!","Nous avons deux *fêtes* ce week-end !"]]},
{"w":"magazine","pl":"magazines","fr":"un magazine","e":"📰","ipa":"ˌmæɡəˈziːn","pr":"ma-geu-ZÎNN","cat":"arts","t":"c","ipl":false,"ex":[["I read a football *magazine* every month.","Je lis un *magazine* de foot tous les mois."],["There are lots of *magazines* at the library.","Il y a beaucoup de *magazines* à la bibliothèque."]]},
{"w":"badminton","pl":"—","fr":"le badminton","e":"🏸","ipa":"ˈbædmɪntən","pr":"BAD-minn-teunn","cat":"sports","t":"u","ipl":false,"ex":[["I play *badminton* on Wednesdays.","Je joue au *badminton* le mercredi."],["*Badminton* is very popular in Asia.","Le *badminton* est très populaire en Asie."]]},
{"w":"picnic","pl":"picnics","fr":"un pique-nique","e":"🧺","ipa":"ˈpɪknɪk","pr":"PIK-nik","cat":"food","t":"c","ipl":false,"ex":[["Let's have a *picnic* in the park!","Faisons un *pique-nique* au parc !"],["We love *picnics* in summer.","Nous adorons les *pique-niques* en été."]],"also":["nature"]},
{"w":"hot chocolate","pl":"hot chocolates","fr":"un chocolat chaud","e":"☕","ipa":"ˌhɒt ˈtʃɒklət","pr":"hott TCHOK-leutt","cat":"food","t":"c","ipl":false,"ex":[["I drink a *hot chocolate* every morning.","Je bois un *chocolat chaud* tous les matins."],["Two *hot chocolates*, please!","Deux *chocolats chauds*, s'il vous plaît !"]]},
/* --- ville --- */
{"w":"zoo","pl":"zoos","fr":"un zoo","e":"🦒","ipa":"zuː","pr":"zou","cat":"places","t":"c","ipl":false,"ex":[["We saw a panda at the *zoo*.","Nous avons vu un panda au *zoo*."],["There are two *zoos* near Paris.","Il y a deux *zoos* près de Paris."]],"also":["animals"]},
{"w":"market","pl":"markets","fr":"un marché","e":"🧺","ipa":"ˈmɑːkɪt","pr":"MÂR-kit","cat":"places","t":"c","ipl":false,"ex":[["We buy fruit at the *market* on Saturdays.","Nous achetons des fruits au *marché* le samedi."],["Christmas *markets* are beautiful.","Les *marchés* de Noël sont magnifiques."]]},
{"w":"café","pl":"cafés","fr":"un café (l'endroit)","e":"☕","ipa":"ˈkæfeɪ","pr":"KA-féï","cat":"places","t":"c","ipl":false,"ex":[["Let's meet at the *café* near the station.","Retrouvons-nous au *café* près de la gare."],["There are lots of *cafés* in London.","Il y a beaucoup de *cafés* à Londres."]]},
{"w":"sports centre","pl":"sports centres","fr":"un centre sportif / un gymnase","e":"🏟","ipa":"ˈspɔːts ˌsentə","pr":"SPÔRTS sènn-teur","cat":"places","t":"c","ipl":false,"ex":[["I go to the *sports centre* after school.","Je vais au *centre sportif* après les cours."],["Our town has got two *sports centres*.","Notre ville a deux *centres sportifs*."]],"also":["sports"]},
/* --- heure et objets du quotidien --- */
{"w":"quarter","pl":"quarters","fr":"un quart (d'heure)","e":"🕒","ipa":"ˈkwɔːtə","pr":"KOUÔ-teur","cat":"time","t":"c","ipl":false,"ex":[["It's a *quarter* past seven.","Il est sept heures et *quart*."],["Cut the pizza into *quarters*.","Coupe la pizza en *quarts*."]],"also":["numbers"]},
{"w":"mobile phone","pl":"mobile phones","fr":"un téléphone portable","e":"📱","ipa":"ˌməʊbaɪl ˈfəʊn","pr":"môou-baïl FÔOUN","cat":"science","t":"c","ipl":false,"ex":[["Switch off your *mobile phone* in class.","Éteins ton *téléphone portable* en classe."],["*Mobile phones* are not allowed at school.","Les *téléphones portables* sont interdits au collège."]]}
]);

DICT.push(...[
{"v":"practise","fr":"s'entraîner, pratiquer","ipa":"ˈpræktɪs","pr":"PRAK-tiss","pt":"practised","pp":"practised","irr":false,"ex":[["I *practise* the piano every day.","Je *m'entraîne* au piano tous les jours."],["We *practised* our English with Kai.","Nous *avons pratiqué* notre anglais avec Kai."]],"q":1},
{"v":"revise","fr":"réviser (une leçon)","ipa":"rɪˈvaɪz","pr":"ri-VAÏZ","pt":"revised","pp":"revised","irr":false,"ex":[["I *revise* my words before a test.","Je *révise* mes mots avant un contrôle."],["She *revised* her history lesson last night.","Elle *a révisé* sa leçon d'histoire hier soir."]],"q":1},
{"v":"chat","fr":"bavarder, discuter","ipa":"tʃæt","pr":"tchatt","pt":"chatted","pp":"chatted","irr":false,"ex":[["I *chat* with my friends at break time.","Je *discute* avec mes amis à la récré."],["We *chatted* for hours on Saturday.","Nous *avons bavardé* pendant des heures samedi."]],"q":1}
]);

/* --- leçon « To be » : there is / there are (section « Bonus : il y a ») --- */
LBANK.be.push(...[
{"q":"___ a clock on the wall.","o":["There is","There are","It is"],"e":"Une horloge (singulier) → there is.","fr":"Il y a une horloge au mur.","t":"there"},
{"q":"___ twenty-five pupils in my class.","o":["There are","There is","They are"],"e":"Pupils (pluriel) → there are.","fr":"Il y a vingt-cinq élèves dans ma classe.","t":"there"},
{"q":"___ two bathrooms in our house.","o":["There are","There is","It has"],"e":"« Il y a » ne se traduit pas avec have : there are + pluriel.","fr":"Il y a deux salles de bains dans notre maison.","t":"there"},
{"q":"___ a big tree in front of our school.","o":["There is","It has","There are"],"e":"« Il y a » ne se traduit pas avec have : there is + singulier.","fr":"Il y a un grand arbre devant notre collège.","t":"there"},
{"q":"There ___ a lot of children in the park.","o":["are","is","be"],"e":"Children est un pluriel (irrégulier) → there are.","fr":"Il y a beaucoup d'enfants dans le parc.","t":"there"},
{"q":"There ___ some water in the bottle.","o":["is","are","be"],"e":"Water ne se compte pas → there is.","fr":"Il y a de l'eau dans la bouteille.","t":"there"},
{"q":"Look! ___ a spider on your head!","o":["There's","There are","It's"],"e":"There's = there is (forme courte, très courante à l'oral).","fr":"Regarde ! Il y a une araignée sur ta tête !","t":"there"},
{"q":"___ a computer in the classroom, but there isn't a printer.","o":["There's","There are","Theres"],"e":"There's = there is : n'oublie pas l'apostrophe.","fr":"Il y a un ordinateur dans la salle, mais il n'y a pas d'imprimante.","t":"there"},
{"q":"___ any bread in the kitchen.","o":["There isn't","There aren't","It isn't"],"e":"Bread ne se compte pas → there isn't any.","fr":"Il n'y a pas de pain dans la cuisine.","t":"there"},
{"q":"___ any shops in my street.","o":["There aren't","There isn't","They aren't"],"e":"Shops (pluriel) → there aren't any.","fr":"Il n'y a pas de magasins dans ma rue.","t":"there"},
{"q":"There ___ any homework today. Great!","o":["isn't","aren't","not"],"e":"Homework ne se compte pas → there isn't any.","fr":"Il n'y a pas de devoirs aujourd'hui. Génial !","t":"there"},
{"q":"There ___ no lessons on Sundays.","o":["are","is","aren't"],"e":"No = pas de : there are no lessons (on ne met pas aussi not).","fr":"Il n'y a pas cours le dimanche.","t":"there"},
{"q":"___ a swimming pool in your town?","o":["Is there","Are there","There is"],"e":"Question : on inverse → Is there + singulier ?","fr":"Est-ce qu'il y a une piscine dans ta ville ?","t":"there"},
{"q":"___ any eggs in the fridge?","o":["Are there","Is there","There are"],"e":"Question : on inverse → Are there + pluriel ?","fr":"Est-ce qu'il y a des œufs dans le frigo ?","t":"there"},
{"q":"___ milk for breakfast? — No, sorry!","o":["Is there any","Are there any","There is any"],"e":"Milk ne se compte pas → Is there any…?","fr":"Il y a du lait pour le petit-déjeuner ? — Non, désolé !","t":"there"},
{"q":"___ a problem? You look sad.","o":["Is there","Are there","Has it"],"e":"« Il y a… ? » → Is there…? (pas de have).","fr":"Il y a un problème ? Tu as l'air triste.","t":"there"},
{"q":"Is there a cinema near here? — Yes, ___.","o":["there is","there's","it is"],"e":"Réponse courte affirmative : pas de forme courte → Yes, there is.","fr":"Est-ce qu'il y a un cinéma près d'ici ? — Oui.","t":"there"},
{"q":"Are there any sweets in the bag? — No, ___.","o":["there aren't","there isn't","they aren't"],"e":"Sweets (pluriel) → No, there aren't.","fr":"Est-ce qu'il y a des bonbons dans le sac ? — Non.","t":"there"},
{"q":"How many people ___ in your family?","o":["are there","there are","is there"],"e":"How many + pluriel + are there ?","fr":"Combien de personnes y a-t-il dans ta famille ?","t":"there"},
{"q":"How many days ___ in a week? — Seven.","o":["are there","there are","is there"],"e":"How many + pluriel + are there ?","fr":"Combien y a-t-il de jours dans une semaine ? — Sept.","t":"there"},
{"q":"There ___ a lot of snow last winter.","o":["was","were","is"],"e":"Au passé : there was + singulier ou nom qui ne se compte pas.","fr":"Il y a eu beaucoup de neige l'hiver dernier.","t":"there"},
{"q":"There ___ thirty pupils on the school trip yesterday.","o":["were","was","are"],"e":"Au passé : there were + pluriel.","fr":"Il y avait trente élèves à la sortie scolaire hier.","t":"there"},
{"q":"___ a lot of people at the party last Saturday?","o":["Were there","Was there","There were"],"e":"Question au passé : Were there + pluriel ?","fr":"Il y avait beaucoup de monde à la fête samedi dernier ?","t":"there"},
{"q":"There ___ any clouds in the sky this morning.","o":["weren't","wasn't","aren't"],"e":"Passé + pluriel, à la forme négative → there weren't.","fr":"Il n'y avait pas de nuages dans le ciel ce matin.","t":"there"}
]);
