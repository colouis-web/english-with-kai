/* Kai's voyage : les noms des ports (PO, 21/11 : « en mode amusant, genre le premier Ground Zero, le deuxième Pirates' Harbour »).
   Le port 1 s'appelle Square One (« le point de départ ») : « Ground Zero » désigne aussi le lieu d'une catastrophe (PO, 21/11 : d'accord).
   Les premiers ports de chaque île ont un nom choisi à la main, dans le thème de l'île ; au-delà, un nom est composé
   (« Sleepy Pelican Wharf ») avec des mots simples (niveau A1-A2), toujours le même pour un même port, jamais deux fois
   le même sur une île. Anglais britannique (harbour). */
"use strict";
const VY_NAMES = {
    nouns: ["Square One", "Pirates' Harbour", "Seagull Pier", "Lighthouse Point", "Fishermen's Wharf", "Treasure Cove",
        "Coconut Corner", "Parrot Bay", "Sandcastle Quay", "Lobster Landing", "Crab Creek", "Mermaid Rock", "Old Anchor Port",
        "Smugglers' Inn", "Sleepy Turtle Bay", "Captain's Rest", "Rainy Day Dock", "Rope Bridge Port", "Seashell Harbour",
        "Windmill Wharf", "Pancake Pier", "Bottle Message Bay", "Ship in a Bottle", "Lost Sock Landing", "Muddy Boots Quay"],
    verbs: ["Lava Landing", "Smoky Pier", "Dragon's Breath", "Hot Rock Harbour", "Ember Bay", "Thunder Port", "Fire Ant Wharf",
        "Magma Quay", "Boiling Bay", "Steam Train Dock", "Red Glow Point", "Popcorn Crater", "Sizzling Sausage Pier",
        "Grumpy Giant's Door", "Rumble Rock", "Hot Chocolate Cove"],
    adjectives: ["Rainbow Pier", "Paint Pot Bay", "Pink Flamingo Port", "Lemon Wharf", "Sunset Quay", "Bubblegum Beach",
        "Blueberry Bay", "Candy Stripe Dock", "Peacock Point", "Golden Sand Port", "Jelly Bean Jetty", "Marshmallow Marina",
        "Watermelon Wharf", "Crayon Corner"],
    adverbs: ["Flying Fish Port", "Turbo Turtle Bay", "Dolphin Dash", "Coral Speedway", "Jellyfish Jump", "Wave Rider Wharf",
        "Shark Fin Point", "Zoom Lagoon", "Seahorse Sprint", "Starfish Station", "Splash Harbour", "Whirlpool Quay"]
};
const VY_NAME_PARTS = {
    a: ["Sleepy", "Giggling", "Grumpy", "Dancing", "Lucky", "Hungry", "Sneaky", "Brave", "Tiny", "Jolly", "Windy", "Muddy",
        "Silver", "Secret", "Lazy", "Noisy", "Shiny", "Sunny"],
    b: ["Seagull", "Crab", "Octopus", "Penguin", "Pelican", "Whale", "Lobster", "Seal", "Parrot", "Turtle", "Dolphin", "Puffin"],
    c: ["Bay", "Harbour", "Pier", "Wharf", "Quay", "Dock", "Point", "Cove", "Landing", "Port"]
};
/* le nom du port n (à partir de 1) sur l'île k */
function vyName(k, n) {
    const L = VY_NAMES[k] || [];
    if (n <= L.length)
        return L[n - 1];
    const i = n - L.length - 1, P = VY_NAME_PARTS, A = P.a.length, B = P.b.length;
    /* chaque paire (adjectif, animal) une seule fois ; le lieu tourne ; décalage par île pour varier d'une île à l'autre */
    const off = { nouns: 0, verbs: 5, adjectives: 9, adverbs: 13 }[k] || 0, j = (i + off) % (A * B);
    return `${P.a[j % A]} ${P.b[Math.floor(j / A) % B]} ${P.c[(i + off) % P.c.length]}`;
}
