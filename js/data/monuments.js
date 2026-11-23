/* Mission spéciale « Around the world » (PO, 23/11 : « la géographie est un excellent thème, 1 quiz de 5 questions sur
   où se trouve un monument célèbre ») : la banque de monuments.
   - m : le nom anglais, avec son article (« the Eiffel Tower »), dit dans la réponse ; pl : pluriel (« Where are… ») ;
   - q : la question quand le nom donne la réponse (« the Sydney Opera House ») : on montre le dessin et on le décrit ;
     fr traduit alors la question, pas le nom ;
   - img : numéro d'un dessin de port du voyage (les images « voyage-lieu » du dossier img) où l'on voit le monument ;
   - city, cty : la ville et le pays, en anglais britannique (« the USA », « England ») ; fr : le nom français.
   Faits vérifiés (ville et pays de chaque monument). Un nom qui contient la ville ou le pays n'est jamais dans la question. */
"use strict";
const VY_MONU = [
    { id: "liberty", m: "the Statue of Liberty", fr: "la statue de la Liberté", city: "New York", cty: "the USA", img: 59 },
    { id: "goldengate", m: "the Golden Gate Bridge", fr: "le pont du Golden Gate", city: "San Francisco", cty: "the USA", img: 61 },
    { id: "opera", m: "the Sydney Opera House", q: "Where is this famous opera house?", fr: "cet opéra célèbre", city: "Sydney", cty: "Australia", img: 13 },
    { id: "gateway", m: "the Gateway of India", q: "Where is this big stone gate by the sea?", fr: "cette grande porte en pierre au bord de la mer", city: "Mumbai", cty: "India", img: 53 },
    { id: "mbs", m: "Marina Bay Sands", q: "Where is this hotel with a boat on its roof?", fr: "cet hôtel avec un bateau sur le toit", city: "Singapore", cty: "Singapore", img: 22 },
    { id: "elbphil", m: "the Elbphilharmonie", q: "Where is this concert hall on the river?", fr: "cette salle de concert sur le fleuve", city: "Hamburg", cty: "Germany", img: 68 },
    { id: "hallgrim", m: "Hallgrímskirkja church", q: "Where is this tall white church?", fr: "cette grande église blanche", city: "Reykjavik", cty: "Iceland", img: 69 },
    { id: "frontenac", m: "the Château Frontenac", fr: "le Château Frontenac (un hôtel)", city: "Quebec City", cty: "Canada", img: 65 },
    { id: "ndgarde", m: "the basilica of Notre-Dame de la Garde", fr: "la basilique Notre-Dame-de-la-Garde", city: "Marseille", cty: "France", img: 60 },
    { id: "columbus", m: "the Columbus Monument", q: "Where is this tall column with Christopher Columbus on top?", fr: "cette colonne avec Christophe Colomb en haut", city: "Barcelona", cty: "Spain", img: 64 },
    { id: "skytower", m: "the Sky Tower", fr: "la Sky Tower", city: "Auckland", cty: "New Zealand", img: 21 },
    { id: "pearl", m: "the Oriental Pearl Tower", fr: "la tour de la Perle de l'Orient", city: "Shanghai", cty: "China", img: 14 },
    { id: "beehive", m: "the Beehive", q: "Where is the Beehive, this round parliament building?", fr: "la Ruche, ce parlement tout rond", city: "Wellington", cty: "New Zealand", img: 29 },
    { id: "abril", m: "the 25 de Abril Bridge", q: "Where is this long red bridge over the river?", fr: "ce long pont rouge sur le fleuve", city: "Lisbon", cty: "Portugal", img: 62 },
    { id: "canadaplace", m: "Canada Place", q: "Where is this building with white sails?", fr: "ce bâtiment aux voiles blanches", city: "Vancouver", cty: "Canada", img: 63 },
    { id: "helcath", m: "Helsinki Cathedral", q: "Where is this white cathedral with green domes?", fr: "cette cathédrale blanche aux dômes verts", city: "Helsinki", cty: "Finland", img: 15 },
    { id: "kobetower", m: "Kobe Port Tower", q: "Where is this red tower by the sea?", fr: "cette tour rouge au bord de la mer", city: "Kobe", cty: "Japan", img: 38 },
    { id: "eiffel", m: "the Eiffel Tower", fr: "la tour Eiffel", city: "Paris", cty: "France" },
    { id: "arc", m: "the Arc de Triomphe", fr: "l'Arc de triomphe", city: "Paris", cty: "France" },
    { id: "bigben", m: "Big Ben", fr: "Big Ben", city: "London", cty: "England" },
    { id: "towerbridge", m: "Tower Bridge", fr: "Tower Bridge", city: "London", cty: "England" },
    { id: "buckingham", m: "Buckingham Palace", fr: "le palais de Buckingham", city: "London", cty: "England" },
    { id: "eye", m: "the London Eye", q: "Where is this big wheel, the Eye?", fr: "cette grande roue, la « Eye »", city: "London", cty: "England" },
    { id: "colosseum", m: "the Colosseum", fr: "le Colisée", city: "Rome", cty: "Italy" },
    { id: "pisa", m: "the Leaning Tower", fr: "la tour penchée", city: "Pisa", cty: "Italy" },
    { id: "sagrada", m: "the Sagrada Família", fr: "la Sagrada Família", city: "Barcelona", cty: "Spain" },
    { id: "alhambra", m: "the Alhambra", fr: "l'Alhambra", city: "Granada", cty: "Spain" },
    { id: "brandenburg", m: "the Brandenburg Gate", fr: "la porte de Brandebourg", city: "Berlin", cty: "Germany" },
    { id: "parthenon", m: "the Parthenon", fr: "le Parthénon", city: "Athens", cty: "Greece" },
    { id: "pyramids", m: "the Great Pyramids", pl: true, fr: "les grandes pyramides", city: "Giza", cty: "Egypt" },
    { id: "tajmahal", m: "the Taj Mahal", fr: "le Taj Mahal", city: "Agra", cty: "India" },
    { id: "christ", m: "the statue of Christ the Redeemer", fr: "la statue du Christ Rédempteur", city: "Rio de Janeiro", cty: "Brazil" },
    { id: "kremlin", m: "the Kremlin", fr: "le Kremlin", city: "Moscow", cty: "Russia" },
    { id: "atomium", m: "the Atomium", fr: "l'Atomium", city: "Brussels", cty: "Belgium" },
    { id: "mermaid", m: "the Little Mermaid statue", fr: "la statue de la Petite Sirène", city: "Copenhagen", cty: "Denmark" },
    { id: "cntower", m: "the CN Tower", fr: "la tour CN", city: "Toronto", cty: "Canada" },
    { id: "petronas", m: "the Petronas Towers", pl: true, fr: "les tours Petronas", city: "Kuala Lumpur", cty: "Malaysia" },
    { id: "burj", m: "the Burj Khalifa", fr: "la Burj Khalifa", city: "Dubai", cty: "the United Arab Emirates" },
    { id: "forbidden", m: "the Forbidden City", fr: "la Cité interdite", city: "Beijing", cty: "China" },
    { id: "whitehouse", m: "the White House", fr: "la Maison-Blanche", city: "Washington, D.C.", cty: "the USA" },
    { id: "hollywood", m: "the Hollywood sign", fr: "le panneau Hollywood", city: "Los Angeles", cty: "the USA" },
    { id: "empire", m: "the Empire State Building", fr: "l'Empire State Building", city: "New York", cty: "the USA" },
    { id: "bluemosque", m: "the Blue Mosque", fr: "la Mosquée bleue", city: "Istanbul", cty: "Turkey" }
];
