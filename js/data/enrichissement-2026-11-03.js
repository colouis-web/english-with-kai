/* Enrichissement du 03/11/2026 (demande du PO) — le nom « sweat » (la sueur).
   Chargé juste après enrichissement-2026-10-30.js ; ajouté en fin de NDICT (les index des noms déjà appris ne bougent pas). */
"use strict";
const N0_ENR2 = NDICT.length;
NDICT.push(...[
{"w":"sweat","pl":"—","fr":"la sueur","e":"💦","ipa":"swet","pr":"souètt","cat":"body","t":"u","ipl":false,"ex":[["After the race, my T-shirt was wet with *sweat*.","Après la course, mon tee-shirt était trempé de *sueur*."],["Wipe the *sweat* off your face.","Essuie la *sueur* de ton visage."]]}
]);
NDICT.slice(N0_ENR2).forEach((n, k) => indexNoun(n, N0_ENR2 + k));
