/* Code parent haché — Learning English with Kai (script classique, pas de module ES).
 *
 * Le code parent (4 à 8 chiffres) n'est plus stocké en clair dans localStorage["kai.pcode"] :
 *   "pbkdf2$150000$<sel base64>$<hash base64>"   (WebCrypto : PBKDF2-SHA256, sel aléatoire 16 octets)
 *   "sha256js$10000$<sel>$<hash>"                 (repli si WebCrypto indisponible : SHA-256 salé itéré, JS pur)
 * Ancien format : le code en clair (ex. "1234"). Migration transparente : au premier code saisi correct,
 * la valeur en clair est remplacée par le haché. La clé et le format de la progression ne changent pas.
 *
 * WebCrypto (crypto.subtle) n'existe qu'en contexte sécurisé : https (GitHub Pages), localhost, file://
 * selon les navigateurs. Sur http non local, on bascule sur le repli JS (moins coûteux, donc moins fort).
 *
 * Limite à dire aux parents : un code à 4–8 chiffres reste devinable par quelqu'un qui lit le localStorage et
 * lance un calcul hors ligne ; ce haché protège d'une lecture à l'œil, pas d'un attaquant motivé.
 * Le but est d'arrêter un enfant curieux, pas de protéger un secret.
 *
 * API (tout est asynchrone sauf has/isHashed) :
 *   KaiSecurity.has()            -> bool        un code parent existe
 *   KaiSecurity.set(code)        -> Promise<void>  enregistre le haché
 *   KaiSecurity.verify(saisie)   -> Promise<bool>  vérifie (+ migre l'ancien format si correct)
 *   KaiSecurity.remove()         -> void
 *   KaiSecurity.isHashed(v)      -> bool
 */
(function (global) {
  "use strict";
  var KEY = "kai.pcode";
  var ITER_SUBTLE = 150000;
  var ITER_JS = 10000;

  function store() { try { return global.localStorage; } catch (e) { return null; } }
  function lire() { var s = store(); try { return (s && s.getItem(KEY)) || ""; } catch (e) { return ""; } }
  function ecrire(v) { var s = store(); if (!s) throw new Error("localStorage indisponible"); s.setItem(KEY, v); }

  function subtle() {
    var c = global.crypto;
    return c && c.subtle && typeof c.subtle.importKey === "function" ? c.subtle : null;
  }

  // --- base64 <-> octets
  function b64(octets) { var s = ""; for (var i = 0; i < octets.length; i++) s += String.fromCharCode(octets[i]); return btoa(s); }
  function deb64(t) { var s = atob(t), o = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) o[i] = s.charCodeAt(i); return o; }
  function utf8(t) { return new TextEncoder().encode(t); }
  function alea(n) {
    var o = new Uint8Array(n);
    if (global.crypto && global.crypto.getRandomValues) global.crypto.getRandomValues(o);
    else throw new Error("aucune source aléatoire sûre"); // jamais de Math.random pour un sel
    return o;
  }

  // --- SHA-256 en JS pur (repli uniquement)
  var K = new Uint32Array([
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  function sha256(m) {
    var l = m.length, n = ((l + 9 + 63) >> 6) << 6, p = new Uint8Array(n), i, j;
    p.set(m); p[l] = 0x80;
    var bits = l * 8; p[n - 4] = bits >>> 24; p[n - 3] = bits >>> 16; p[n - 2] = bits >>> 8; p[n - 1] = bits;
    var h = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
    var w = new Uint32Array(64);
    function rr(x, k) { return (x >>> k) | (x << (32 - k)); }
    for (i = 0; i < n; i += 64) {
      for (j = 0; j < 16; j++) w[j] = (p[i+4*j] << 24) | (p[i+4*j+1] << 16) | (p[i+4*j+2] << 8) | p[i+4*j+3];
      for (j = 16; j < 64; j++) {
        var s0 = rr(w[j-15],7) ^ rr(w[j-15],18) ^ (w[j-15] >>> 3), s1 = rr(w[j-2],17) ^ rr(w[j-2],19) ^ (w[j-2] >>> 10);
        w[j] = (w[j-16] + s0 + w[j-7] + s1) | 0;
      }
      var a=h[0],b=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],k=h[7];
      for (j = 0; j < 64; j++) {
        var t1 = (k + (rr(e,6)^rr(e,11)^rr(e,25)) + ((e&f)^(~e&g)) + K[j] + w[j]) | 0;
        var t2 = ((rr(a,2)^rr(a,13)^rr(a,22)) + ((a&b)^(a&c)^(b&c))) | 0;
        k=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0;
      }
      h[0]+=a; h[1]+=b; h[2]+=c; h[3]+=d; h[4]+=e; h[5]+=f; h[6]+=g; h[7]+=k;
    }
    var out = new Uint8Array(32);
    for (i = 0; i < 8; i++) { out[4*i]=h[i]>>>24; out[4*i+1]=h[i]>>>16; out[4*i+2]=h[i]>>>8; out[4*i+3]=h[i]; }
    return out;
  }
  function hashJs(code, sel, iter) {
    var d = sha256(concat(sel, utf8(code)));
    for (var i = 1; i < iter; i++) d = sha256(concat(d, sel));
    return d;
  }
  function concat(a, b) { var o = new Uint8Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; }

  // --- PBKDF2-SHA256 via WebCrypto
  function hashSubtle(code, sel, iter) {
    var s = subtle();
    return s.importKey("raw", utf8(code), "PBKDF2", false, ["deriveBits"]).then(function (cle) {
      return s.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: sel, iterations: iter }, cle, 256);
    }).then(function (bits) { return new Uint8Array(bits); });
  }

  function egal(a, b) { // comparaison en temps constant
    if (a.length !== b.length) return false;
    var r = 0; for (var i = 0; i < a.length; i++) r |= a[i] ^ b[i];
    return r === 0;
  }

  function isHashed(v) { return /^(pbkdf2|sha256js)\$\d+\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/.test(v || ""); }

  function fabriquer(code) {
    var sel = alea(16);
    if (subtle()) {
      return hashSubtle(code, sel, ITER_SUBTLE).then(function (h) { return "pbkdf2$" + ITER_SUBTLE + "$" + b64(sel) + "$" + b64(h); });
    }
    return Promise.resolve("sha256js$" + ITER_JS + "$" + b64(sel) + "$" + b64(hashJs(code, sel, ITER_JS)));
  }

  function calculer(code, stocke) {
    var p = stocke.split("$"), iter = parseInt(p[1], 10), sel = deb64(p[2]);
    // Plafond : un champ modifié à la main ne doit pas figer l'onglet.
    if (!(iter > 0 && iter <= 1000000)) return Promise.resolve(null);
    if (p[0] === "pbkdf2") return subtle() ? hashSubtle(code, sel, iter) : Promise.resolve(null);
    return Promise.resolve(hashJs(code, sel, iter));
  }

  var KaiSecurity = {
    KEY: KEY,
    isHashed: isHashed,
    has: function () { return lire() !== ""; },
    remove: function () { var s = store(); try { if (s) s.removeItem(KEY); } catch (e) {} },
    set: function (code) {
      return fabriquer(String(code)).then(function (v) { ecrire(v); });
    },
    verify: function (saisie) {
      saisie = String(saisie == null ? "" : saisie);
      var stocke = lire();
      if (!stocke) return Promise.resolve(false);
      if (!isHashed(stocke)) {
        // Ancien format : code en clair. Si correct, on le remplace par le haché (migration transparente).
        var ok = egal(utf8(saisie), utf8(stocke));
        if (!ok) return Promise.resolve(false);
        return fabriquer(saisie).then(function (v) { try { ecrire(v); } catch (e) {} return true; },
                                       function () { return true; }); // migration impossible : on laisse passer, on réessaiera
      }
      var attendu;
      try { attendu = deb64(stocke.split("$")[3]); } catch (e) { return Promise.resolve(false); }
      return calculer(saisie, stocke).then(function (h) { return !!h && egal(h, attendu); }, function () { return false; });
    }
  };

  global.KaiSecurity = KaiSecurity;
  if (typeof module !== "undefined" && module.exports) module.exports = KaiSecurity;
})(typeof window !== "undefined" ? window : globalThis);
