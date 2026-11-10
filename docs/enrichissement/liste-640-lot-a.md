# Liste 640 du PO, lot A : compte rendu (Matt, 10/11/2026)

Source : `liste-640-lot-a.csv` (209 lignes). Fichiers écrits : `js/data/liste-640-a.js` (noms, adjectifs, idioms, phrasal verb) et `js/data/liste-640-a-verbes.js` (verbes).
« last but not least » : lot C (non traité ici).

## Chiffres
- Lignes du CSV : 209 ; gardées : 163 ; écartées : 45 ; renvoyée au lot C : 1.
- Fiches ajoutées : 164 = **120 noms** (NDICT : 1290 -> 1410 pour ce lot), **21 adjectifs** (ADJ), **18 idioms** (IDI), **1 phrasal verb** (PHR : boot up), **4 verbes** (DICT : click, confer, steer, debug).
  « click » donne deux fiches (nom + verbe) pour une seule ligne.
- Ajouts en fin de tableau seulement. Aucun doublon de mot vedette.

## Corrections de la fiche source
| Fiche | Fiche corrigée | Raison |
|---|---|---|
| cruising | **cruise** (une croisière) | le nom est « cruise » |
| snorkeling | **snorkelling** | orthographe britannique |
| usb drive | **USB stick** | forme britannique usuelle |
| torch = chalumeau | **torch = lampe de poche** | en anglais britannique, torch = lampe de poche (chalumeau = blowtorch, écarté car adulte) |
| stool = escabeau | **tabouret / escabeau** | stool = tabouret |
| tile = tuile | **carreau / tuile** | les deux sens |
| go through the ceiling | **go through the roof** | « ceiling » n'est pas l'idiome |
| cutting-edge technology | adjectif **cutting-edge** | collocation libre ; l'adjectif est la vraie entrée |
| first aid kit | « premiers **secours** » | la fiche disait « soins » |
| when it rains, it pours | « un malheur n'arrive jamais seul » | « jamais deux sans trois » est inexact |
| nippy = piquant | frisquet (familier), r « i » | |
| bow | proue / révérence, prononciation /baʊ/ | avertissement : bow = arc se prononce /bəʊ/ |
| scope / master / balance / course / current / script / speaker / application / bug / cookie / plaster / domain | plusieurs sens courants donnés dans « fr » | mots polysémiques |

## Écartés (45)
| Terme | Raison |
|---|---|
| bearing, fathom, sextant, waypoint | trop techniques (navigation, unités anciennes) |
| harbor | doublon : « harbour » existe déjà dans NDICT |
| anchor diving | pas une expression établie ; doublon de « diving » |
| deep-sea diving | doublon de « diving » |
| bilge pump, nautical chart, navigation lights | trop techniques |
| emergency radio, safety line, safety whistle, safety drill, weather map | collocations libres sans intérêt lexical (safety drill : voir fire drill) |
| flare gun | pistolet : thème à éviter, et technique |
| man overboard | cri technique, pas du vocabulaire courant |
| burn your boats, sailing close to the wind, slow boat to china, chase rainbows | idioms trop rares ou vieillis pour un ado ; (burn your bridges est la forme usuelle) |
| get in the sea | pas un idiome anglais ; la traduction de la fiche (« aller se faire voir ») est grossière |
| steer toward something | collocation libre ; le verbe « steer » est ajouté |
| jackhammer | américanisme technique ; peu utile à un collégien |
| array, compile, framework, bandwidth, hosting, plug-and-play, plugin | jargon de programmation ou d'hébergement, trop technique |
| lifehack | doublon de « life hack » (gardé) |
| user interface | doublon de « interface » (gardé) |
| computer geek | péjoratif possible (geek) |
| anemometer, hygrometer, isobar, dew point, rain gauge, temperature gradient | trop techniques (météorologie) |
| nighttime | doublon de sens avec « night » |
| twilight | doublon de sens avec « dusk » (gardé) |
| sultry | sens second adulte (sensuel) ; « sweltering », « humidity » suffisent |
| storm in a teapot | variante non standard ; « storm in a teacup » est gardé |
| (x°c × 9 | rebut de lecture du PDF (formule de conversion, pas un terme) |

## Choix de niveau
- Sans lv, f 2-3 : mots courants (anchor, cabin, deck, rope, tide, brick, hammer, saw, tile, stool, torch, printer, charger, browser, code, update, webcam, Wi-Fi, chilly, freezing, drizzle, blizzard, dawn, thermometer, satellite...).
- lv 1 : mots un peu plus difficiles (cement, concrete, algorithm, database, firewall, network, router, humidity, drought, lifeboat, lifebuoy, fire extinguisher, first aid kit, gangway, mast, social media...).
- lv 2 (techniques mais gardés) : buoyancy, flare, helm, hull, keel, rudder, stern, starboard, latitude, longitude, scaffolding, interface, encryption, syntax, variable, operating system, barometer, balmy, brisk, tepid, cutting-edge, low-tech, debug, steer.
- Mots du PO : way, path, deep, click, meeting : f 3, sans lv ; imagination, conference (lv 1), balance (lv 1) ; master (lv 2), scope (lv 2, r « e », f 1), steer (lv 2) ; confer : lv 3, r « f » (formel, rare).
- r « i » (informel, donc pas au niveau 0) : life hack, nippy, off the wall, take a rain check, whatever floats your boat.
- Thèmes utilisés : aucun thème sensible (war, justice, finance, endoflife).

## Points de doute pour le PO
- Les verbes n'ayant pas de thème dans `verbes-themes.js` (fichier hors de mon périmètre), click, confer, steer et debug tombent dans « Everyday verbs ». À ranger dans « Work & tech » (click, debug), « Talking & people » (confer), « Travel » (steer) si le PO le souhaite.
- Noms seuls pour balance, master, update, current, object : les verbes (balance, master, update) ou l'adjectif (current) pourraient être ajoutés plus tard.
- Les idioms et le phrasal verb sont ajoutés à DOMContentLoaded (IDI et PHR sont créés après mon fichier) ; même procédé que le lot C.
- Pronunciation « bow » : une seule entrée (proue), le sens « arc / nœud » n'est pas traité.

## Vérification (Playwright, Chromium)
Aucune erreur JS ni erreur console ; index existants inchangés (préfixes identiques à l'état précédent pour NDICT, DICT, ADJ, IDI, PHR) ; index `i` cohérents ; aucun doublon ; chaque fiche ajoutée (120 + 21 + 18 + 1 + 4) est trouvée par le champ de recherche de son dictionnaire.

## Relecture Ani (10/11/2026)
39 fiches corrigées (champs lv, f, r, ordre et mécanisme d'ajout inchangés). Playwright : aucune erreur JS ni console ; fiches corrigées trouvées par la recherche « Words » ; astérisques appariés dans tous les exemples.
- **be smooth sailing → be plain sailing** : forme britannique (smooth sailing = américain, signalé dans « mean ») ; exemples refaits, astérisques recalés.
- **stool** : « escabeau » faux (stepladder) → « un tabouret (step stool : un marchepied) ».
- **antivirus** : « an antivirus / antiviruses » peu idiomatique → *antivirus software*, pl « — », t « u ».
- **confer** : « me consulter avec » (incorrect) → « m'entretenir avec » ; fr complété (conférer un titre).
- **steer** : pr « stir » → « stieur » (/ɪə/, comme deer) ; exemple au présent narratif remplacé (« Can you steer… ? ») ; fr + « orienter ».
- **clear** : pr « klir » → « klieur » (/ɪə/).
- **object** : pr « OB-djèkt » → « OB-djikt » (/ɪ/). **database** : pr « DÉÏ-teu-béïss » (schwa).
- **cutting-edge** : pr « keu-ting ÈDJ » (accent principal sur edge, cohérent avec l'IPA). **boot up** : IPA ˌbuːt ˈʌp ; traduction « met une minute à démarrer ».
- **bow** : pr précise que bow = arc **ou nœud** se dit /bəʊ/ ; fiche cohérente (proue, révérence = /baʊ/).
- **longitude** : « London is on the zero line of longitude » (faux et maladroit) → la ligne de longitude zéro passe par Greenwich.
- **latitude** : « at about 49 degrees north latitude » → « at a latitude of about 49 degrees north ».
- **lifeboat** : « carries a lifeboat » → « carries lifeboats ». **mast** : « A big sailing ship has three masts » (généralisation fausse) → « This big sailing ship… ».
- **windsurfing** : « is learning windsurfing » → « is having windsurfing lessons ». **operating system** : « a new operating system update » → « an operating system update ».
- **social media** : « before you join social media » → « before you start using social media ». **locksmith** : « because I'd lost my key » (plus-que-parfait).
- **tiler** : « put new tiles » → « laid new tiles ». **concrete** : « The playground floor is hard concrete » → « The playground is made of hard concrete ».
- **off the wall** : emploi attributif « off the wall ideas » (devrait être off-the-wall) → exemple prédicatif. **whatever floats your boat** : astérisques sur toute l'expression.
- **when it rains, it pours** : variante britannique *it never rains but it pours* ajoutée dans « mean ».
- **diving** : fr + « le plongeon (sport) ». **gangway** : fr + « une allée (entre des sièges) », sens britannique courant. **scope** : fr + « le cadre » (utilisé dans l'exemple). **brisk** : fr « vif (vent) / rapide (marche) ».
- **buoyancy** : « life jacket » → « lifejacket » (cohérent avec la fiche lifejacket).
- Traductions françaises reprises : deck (sont montés en courant), fishing (aller à la pêche), flare (« mer noire » ambigu), gangway, jet skiing (palpitant), brick (en briques), scaffolding (sur l'échafaudage), humidity (l'air est moite), master (maître d'échecs), deep (Inspire profondément), hit the roof.
- **Au PO** : *take a rain check* est d'origine américaine (r « i » seul, sans « a ») ; *lifejacket* en un mot est accepté en anglais britannique (RNLI) mais les dictionnaires donnent plutôt *life jacket* ; la fiche verbe **steer** est niveau 2 alors que « steer » est utile dès le collège.

## Décisions du PO (10/11)

- `lifejacket` gardé en un mot.
- `steer` sans niveau minimum : proposé dès le collège.
