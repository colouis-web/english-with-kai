#!/usr/bin/env python3
"""Cohérence des données de « Learning English with Kai » (lues EN MÉMOIRE, via les globales JS).

  python3 tests/test_donnees.py [--app <dossier>]

Couvre : fiches de mots (fr, ipa, pr, ex), doublons, exercices (bonne réponse dans les options, réponses
écrites acceptées par le correcteur de l'application), banques de leçons, quiz générés, voix (KV -> voice/),
images (img/), listes de contrôle de classe, images de « Let's talk ».
Un KO ici est une vraie anomalie de contenu ou de code : à confier à Ouss (code) ou Matt (contenu).
"""
import base64
import json
import re
import urllib.request

from kai_common import Bilan, open_app, new_context, Collector, run_suite, http_status, js_available

# Globales que le découpage de index.html doit conserver au niveau global (scripts classiques).
GLOBALES = ["DICT", "NDICT", "ADJ", "ADV", "CON", "PREP", "PHR", "IDI", "QTY", "LESSONS", "LBANK", "TTYPE", "LORDER",
            "KV", "FRT", "T6", "TKPICS", "MOODS", "END_L", "ROT", "SCN", "IRR100", "DMAP", "lessonBank", "tmatch",
            "pickWords", "buildQs", "kTags", "pickMix", "pqHash", "frOf", "RW", "medalSvg", "MEDALS", "LV", "KINDS"]

# Fiches de mots : (nom, expression JS de la liste, champ-clé, ipa/pr obligatoires ?)
# Connecteurs et expressions (phrases entières) : pas de prononciation à afficher, c'est le choix de conception
# actuel (l'écran fait `n.ipa ? … : ""`). On exige seulement que ipa et pr vont ensemble.
LEXIQUES = [
    ("verbes", "DICT", "v", True), ("noms", "NDICT", "w", True), ("adjectifs", "ADJ.data", "w", True),
    ("adverbes", "ADV.data", "w", True), ("prépositions", "PREP.data", "w", True),
    ("verbes à particule", "PHR.data", "w", True), ("quantificateurs", "QTY.data || QTY", "w", True),
    ("connecteurs", "CON.data", "w", False), ("expressions", "IDI.data", "w", False),
]

JS_LEXIQUES = r"""
([nom, cle, pron]) => {
  const L = __LISTE__;
  const bad = { fr: [], ipa_pr: [], ex: [], ex_forme: [], ex_etoiles: [], doublons: [], cle: [] };
  const vus = new Map();
  const etoiles = s => (String(s).match(/\*/g) || []).length;
  for (const d of L) {
    const id = d[cle];
    if (typeof id !== 'string' || !id.trim()) { bad.cle.push(JSON.stringify(id)); continue; }
    if (id !== id.trim()) bad.cle.push('espace en trop : « ' + id + ' »');
    if (typeof d.fr !== 'string' || !d.fr.trim()) bad.fr.push(id);
    const hasI = !!(d.ipa && String(d.ipa).trim()), hasP = !!(d.pr && String(d.pr).trim());
    if (pron ? !(hasI && hasP) : hasI !== hasP) bad.ipa_pr.push(id + (hasI ? '' : ' (sans ipa)') + (hasP ? '' : ' (sans pr)'));
    if (!Array.isArray(d.ex) || !d.ex.length) bad.ex.push(id);
    else for (const e of d.ex) {
      if (!Array.isArray(e) || e.length < 2 || typeof e[0] !== 'string' || typeof e[1] !== 'string' || !e[0].trim() || !e[1].trim()) { bad.ex_forme.push(id); break; }
      if (etoiles(e[0]) % 2 || etoiles(e[1]) % 2 || !etoiles(e[0]) || !etoiles(e[1])) { bad.ex_etoiles.push(id + ' : ' + e[0]); break; }
    }
    const k = id.toLowerCase();
    if (vus.has(k)) bad.doublons.push(id); vus.set(k, 1);
  }
  return { n: L.length, bad };
}
"""

JS_EXERCICES = r"""
() => {
  const r = { forme: [], doublons: [], petites: [], inconnues: [], ordre: [], tmatch: [], typed_forme: [], sans_ttype: [],
              opts_dupliquees: [], q_vide: [], bonne_absente: [], fr_manquantes: 0, total: 0, parLecon: {} };
  const ids = Object.keys(LESSONS);
  for (const kind of Object.keys(LORDER)) for (const id of LORDER[kind]) {
    if (!LESSONS[id]) r.inconnues.push(kind + ':' + id + ' (LORDER sans LESSONS)');
    if (!LBANK[id]) r.inconnues.push(kind + ':' + id + ' (LORDER sans LBANK)');
    if (!((TTYPE[kind] || {})[id] || []).length) r.sans_ttype.push(kind + ':' + id);
  }
  for (const id of ids) {
    if (!LORDER[LESSONS[id].type] || !LORDER[LESSONS[id].type].includes(id)) r.ordre.push(id + ' absente de LORDER');
    const L = LESSONS[id];
    for (const f of ['title', 'fr', 'say', 'intro']) if (typeof L[f] !== 'string' || !L[f].trim()) r.forme.push(id + ' : champ ' + f + ' vide');
    if (!Array.isArray(L.sections) || !L.sections.length) r.forme.push(id + ' : aucune section');
    const brut = [...(L.practice || []), ...(LBANK[id] || [])], vus = new Set();
    for (const x of brut) {
      r.total++;
      const cle = x.q + '|' + (x.o && x.o[0]);
      if (vus.has(cle)) r.doublons.push(id + ' : ' + x.q + ' -> ' + (x.o && x.o[0])); vus.add(cle);
      if (!x.q || !String(x.q).trim()) { r.q_vide.push(id); continue; }
      if (!Array.isArray(x.o) || x.o.length < 2) { r.forme.push(id + ' : moins de 2 options : ' + x.q); continue; }
      if (x.o.some(o => typeof o !== 'string' || o === '')) r.forme.push(id + ' : option vide : ' + x.q);
      if (new Set(x.o).size !== x.o.length) r.opts_dupliquees.push(id + ' : ' + x.q + ' ' + JSON.stringify(x.o));
      if (!x.o.includes(x.o[0])) r.bonne_absente.push(id + ' : ' + x.q);   // garde-fou : la bonne réponse est o[0]
      if (!x.e || !String(x.e).trim()) r.forme.push(id + ' : explication manquante : ' + x.q);
      if (!x.q.includes('___') && !x.q.includes('→') && !/^Quelle .+ correcte\s*\?$/.test(x.q)) r.forme.push(id + ' : ni trou ni consigne connue : ' + x.q);
      if (x.q.includes('___') && !frOf(x)) r.fr_manquantes++;
    }
    const n = lessonBank(id).length; r.parLecon[id] = n;
    if (n < 50) r.petites.push(id + ' : ' + n + ' questions');
  }
  for (const kind of Object.keys(TTYPE)) for (const id of Object.keys(TTYPE[kind])) for (const t of TTYPE[kind][id]) {
    if (!t.q || !t.q.includes('___') || !Array.isArray(t.a) || !t.a.length || t.a.some(a => typeof a !== 'string' || !a.trim()) || !t.i) { r.typed_forme.push(kind + ':' + id + ' ' + t.q); continue; }
    for (const a of t.a) if (!tmatch(t, a)) r.tmatch.push(kind + ':' + id + ' « ' + t.q + ' » refuse sa propre réponse « ' + a + ' »');
  }
  return r;
}
"""

JS_QUIZ = r"""
(rep) => {
  const r = { gen: 0, mal_forme: [], vides: [], mix: [] };
  const kinds = ['verbs', 'nouns', 'adjectives', 'adverbs', 'connectors', 'prepositions'];
  const sauve = QNUM; QNUM = 20;
  try {
    for (const k of kinds) for (const [tag, , n] of kTags(k)) {
      if (n < 5) continue;
      for (let t = 0; t < rep; t++) {
        const words = pickWords(k, tag);
        if (!words.length) { r.vides.push(k + '/' + tag); continue; }
        const ds = words.map(w => w.d);
        if (new Set(ds).size !== ds.length) r.mal_forme.push(k + '/' + tag + ' : mot tiré deux fois');
        const [p1, p2] = buildQs(k, tag, words); r.gen++;
        for (const [ph, P] of [[1, p1], [2, p2]]) for (const q of P) {
          const i = q.opts.indexOf(q.d), id = k + '/' + tag + ' partie ' + ph + ' « ' + (q.d.v || q.d.w) + ' »';
          if (i < 0) { r.mal_forme.push(id + ' : bonne réponse absente des options'); continue; }
          if (q.labels.length !== q.opts.length || q.subs.length !== q.opts.length) r.mal_forme.push(id + ' : labels/subs de longueur différente');
          if (q.labels[i] !== q.ans) r.mal_forme.push(id + ' : ans ≠ libellé de la bonne option (' + q.labels[i] + ' / ' + q.ans + ')');
          if (new Set(q.labels).size !== q.labels.length) r.mal_forme.push(id + ' : deux options identiques ' + JSON.stringify(q.labels));
          if (q.opts.length < 3) r.mal_forme.push(id + ' : seulement ' + q.opts.length + ' options');
          if (q.labels.some(l => !String(l).trim())) r.mal_forme.push(id + ' : option vide');
        }
      }
    }
    for (let t = 0; t < rep; t++) {
      const m = pickMix(10);
      const cles = m.map(x => x.k + ':' + (x.d.v || x.d.w));
      if (m.length !== 10 || new Set(cles).size !== 10) r.mix.push('pickMix(10) a rendu ' + m.length + ' mots dont ' + new Set(cles).size + ' distincts');
      const [a, b] = buildQs('mix', 'all', m);
      for (const q of [...a, ...b]) if (q.opts.indexOf(q.d) < 0 || new Set(q.labels).size !== q.labels.length) r.mix.push('mix : question mal formée ' + (q.d.v || q.d.w));
    }
  } finally { QNUM = sauve; }
  return r;
}
"""

JS_AUTRES = r"""
() => {
  const r = { t6: [], t6vide: 0, talk: [], irr: [], moods: [], kv_forme: [], irr_forme: [] };
  for (const t of T6) {
    if (!t.id || !t.title || !t.date || !/^\d{4}-\d{2}-\d{2}$/.test(t.date) || isNaN(new Date(t.date))) r.t6.push(t.id + ' : id/titre/date invalide');
    if (!Array.isArray(t.sections) || !t.sections.length) r.t6.push(t.id + ' : sans sections');
    const vus = new Set();
    for (const s of t.sections || []) for (const w of s.w || []) {
      if (!Array.isArray(w) || typeof w[0] !== 'string' || typeof w[1] !== 'string' || !w[0].trim() || !w[1].trim()) r.t6.push(t.id + ' : mot mal formé ' + JSON.stringify(w));
      else { const k = w[0].toLowerCase(); if (vus.has(k)) r.t6.push(t.id + ' : doublon « ' + w[0] + ' »'); vus.add(k); }
    }
  }
  for (const [i, p] of TKPICS.entries()) {
    if (!p.img || !p.d || !p.q || !p.k || !Array.isArray(p.w) || !p.w.length || !Array.isArray(p.m) || !p.m.length) r.talk.push('image #' + i + ' (' + p.img + ') : champ manquant');
  }
  for (const v of IRR100) { const d = DMAP[v]; if (!d) r.irr.push(v + ' absent du dictionnaire'); else if (!d.pt || !d.pp) r.irr.push(v + ' sans pt/pp'); else if (!d.irr) r.irr.push(v + ' est dans IRR100 mais irr=false'); }
  for (const d of DICT) if (!d.pt || !d.pp) r.irr_forme.push(d.v);
  for (const m of MOODS) if (!m.id || !m.img || !m.say) r.moods.push(m.id);
  return r;
}
"""

JS_IMAGES = r"""
() => {
  const out = new Set(), add = f => { if (f) out.add(String(f)); };
  const face = f => add('img/kai-' + f + '.webp');
  Object.keys(END_L).forEach(face);
  MOODS.forEach(m => face(m.img));
  Object.values(ROT).flat().forEach(face);
  Object.values(LESSONS).forEach(L => face(L.img));
  TKPICS.forEach(p => add('img/' + p.img + '.webp'));
  for (const g of Object.values(SCN)) for (const f of Object.values(g)) add('img/' + f + '.webp');
  const rw = h => { for (const m of String(h).matchAll(/img\/[A-Za-z0-9._-]+\.(?:webp|png|jpg|svg)/g)) add(m[0]); };
  rw(RW('star')); rw(RW('flame')); rw(RW('bolt')); rw(trophySvg());
  MEDALS.forEach(m => rw(medalSvg(m[1])));
  add(KAI.src);
  return [...out];
}
"""

JS_FONTFACE = r"""
() => {
  const out = [];
  for (const sh of document.styleSheets) {
    let rules; try { rules = sh.cssRules; } catch (e) { continue; }
    for (const r of rules) if (r.type === CSSRule.FONT_FACE_RULE)
      for (const m of r.cssText.matchAll(/url\(["']?([^"')]+)["']?\)/g)) if (!m[1].startsWith('data:')) out.push(new URL(m[1], sh.href || location.href).href);
  }
  return [...new Set(out)];
}
"""

JS_SOURCES = r"""
async () => {
  const parts = [document.documentElement.outerHTML];
  for (const s of document.scripts) if (s.src) parts.push(await (await fetch(s.src)).text()); else parts.push(s.textContent);
  for (const l of document.querySelectorAll('link[rel=stylesheet]')) if (l.href.startsWith(location.origin)) parts.push(await (await fetch(l.href)).text());
  return parts.join('\n');
}
"""


def premiers(liste, n=6):
    liste = list(liste)
    return "; ".join(str(x) for x in liste[:n]) + (f" … (+{len(liste) - n})" if len(liste) > n else "")


def http_get(url):
    with urllib.request.urlopen(url, timeout=60) as r:
        return r.read()


def run(args, base, browser, bilan, collector):
    ctx = new_context(browser, base, (1280, 800), collector, seed=args.seed)
    page = ctx.new_page()
    open_app(page, base)

    manquantes = js_available(page, GLOBALES)
    if not bilan.check("DN-00", "Les globales JS attendues existent (contrat avec le découpage)", not manquantes,
                       "globales absentes : " + ", ".join(manquantes) + " — le découpage doit garder des scripts classiques globaux"):
        return

    # ---- DN-01 .. : fiches de mots
    for i, (nom, expr, cle, pron) in enumerate(LEXIQUES, 1):
        res = page.evaluate(JS_LEXIQUES.replace("__LISTE__", expr), [nom, cle, pron])
        bad, n = res["bad"], res["n"]
        base_id = f"DN-1{i}"
        bilan.check(f"{base_id}a", f"{nom} ({n}) : chaque fiche a une clé propre, sans espace en trop", not bad["cle"], premiers(bad["cle"]))
        bilan.check(f"{base_id}b", f"{nom} : chaque fiche a une traduction « fr »", not bad["fr"], premiers(bad["fr"]))
        bilan.check(f"{base_id}c", f"{nom} : ipa et pr " + ("présents" if pron else "présents ensemble ou absents ensemble"),
                    not bad["ipa_pr"], premiers(bad["ipa_pr"]))
        bilan.check(f"{base_id}d", f"{nom} : au moins un exemple « ex » par fiche", not bad["ex"], premiers(bad["ex"]))
        bilan.check(f"{base_id}e", f"{nom} : exemples = [anglais, français] non vides", not bad["ex_forme"], premiers(bad["ex_forme"]))
        bilan.check(f"{base_id}f", f"{nom} : mot mis en évidence (*mot*) dans les deux langues, étoiles par paires",
                    not bad["ex_etoiles"], premiers(bad["ex_etoiles"]))
        bilan.check(f"{base_id}g", f"{nom} : pas de doublon (sans tenir compte de la casse)", not bad["doublons"], premiers(bad["doublons"]))
        if not pron:
            sans = page.evaluate(f"() => ({expr}).filter(d => !d.ipa).length")
            bilan.note(f"{base_id}h", f"{nom} : fiches sans prononciation (choix actuel, à confirmer par Matt)", f"{sans} sur {n}")

    # ---- DN-2x : verbes irréguliers et formes
    r = page.evaluate(JS_AUTRES)
    bilan.check("DN-21", "Chaque verbe a un prétérit et un participe passé", not r["irr_forme"], premiers(r["irr_forme"]))
    bilan.check("DN-22", "Les 100 verbes irréguliers (IRR100) existent, sont marqués irréguliers et ont pt/pp", not r["irr"], premiers(r["irr"]))
    bilan.check("DN-23", "Listes de contrôle de classe (T6) : id, titre, date ISO, mots [en, fr] sans doublon", not r["t6"], premiers(r["t6"]))
    bilan.check("DN-24", "« Let's talk English » : chaque image a description, question, mots-clés, vocabulaire et modèles", not r["talk"], premiers(r["talk"]))
    bilan.check("DN-25", "Humeurs (MOODS) complètes", not r["moods"], premiers(r["moods"]))

    # ---- DN-3x : exercices
    e = page.evaluate(JS_EXERCICES)
    bilan.note("DN-30", "Volume d'exercices", f"{e['total']} questions brutes dans {len(e['parLecon'])} leçons ; "
               f"banque (après dédoublonnage de l'app) : mini {min(e['parLecon'].values())}, maxi {max(e['parLecon'].values())}")
    bilan.check("DN-31", "LORDER, LESSONS, LBANK et TTYPE sont cohérents (aucune leçon orpheline ou sans questions à écrire)",
                not e["inconnues"] and not e["ordre"] and not e["sans_ttype"], premiers(e["inconnues"] + e["ordre"] + e["sans_ttype"]))
    bilan.check("DN-32", "Chaque leçon a titre, traduction, phrase de Kai, introduction et sections", not [x for x in e["forme"] if "champ" in x or "section" in x],
                premiers([x for x in e["forme"] if "champ" in x or "section" in x]))
    bilan.check("DN-33", "Chaque question à choix a ≥ 2 options non vides, une explication, un trou ou une consigne connue",
                not [x for x in e["forme"] if not ("champ" in x or "section" in x)] and not e["q_vide"],
                premiers([x for x in e["forme"] if not ("champ" in x or "section" in x)] + e["q_vide"]))
    bilan.check("DN-34", "Chaque question à choix : la bonne réponse figure dans les options", not e["bonne_absente"], premiers(e["bonne_absente"]))
    bilan.check("DN-35", "Aucune question n'a deux options identiques (sinon deux « bonnes » réponses)", not e["opts_dupliquees"], premiers(e["opts_dupliquees"]))
    bilan.check("DN-36", "Pas de question en double dans une même leçon (leçon + banque)", not e["doublons"], premiers(e["doublons"]))
    bilan.check("DN-37", "Chaque leçon propose au moins 50 questions (annonce du code)", not e["petites"], premiers(e["petites"]))
    bilan.check("DN-38", "Questions à écrire (TTYPE) : forme complète et réponse acceptée par le correcteur de l'application",
                not e["typed_forme"] and not e["tmatch"], premiers(e["typed_forme"] + e["tmatch"]))
    bilan.note("DN-39", "Traductions françaises (FRT) manquantes pour des questions à trou", f"{e['fr_manquantes']} sur {e['total']}")

    # ---- DN-4x : quiz générés
    q = page.evaluate(JS_QUIZ, 4)
    bilan.check("DN-41", f"Quiz : {q['gen']} séries générées (6 types x thèmes), aucune vide", not q["vides"] and q["gen"] > 30, premiers(q["vides"]) or f"{q['gen']} séries seulement")
    bilan.check("DN-42", "Quiz : bonne réponse dans les options, libellés distincts, mots non répétés", not q["mal_forme"], premiers(q["mal_forme"]))
    bilan.check("DN-43", "Mots du jour (pickMix) : 10 mots distincts, questions bien formées", not q["mix"], premiers(q["mix"]))

    # ---- DN-5x : voix
    kv = page.evaluate("Object.entries(KV)")
    paquets = sorted({v[0] for _, v in kv})
    contenu, erreurs_v, vus = {}, [], set()
    for n in range(1, max(paquets) + 1):
        url = f"{base}voice/kai-{n}.json"
        try:
            contenu[n] = json.loads(http_get(url))
        except Exception as ex:   # noqa: BLE001
            erreurs_v.append(f"voice/kai-{n}.json illisible ({type(ex).__name__})")
    bilan.check("DN-51", f"Les paquets de voix référencés ({paquets}) existent et sont du JSON valide", not erreurs_v and set(contenu) >= set(paquets), premiers(erreurs_v))
    absents, invalides = [], []
    for texte, (n, vid) in kv:
        b64 = (contenu.get(n) or {}).get(vid)
        if not b64:
            absents.append(f"« {texte} » -> voice/kai-{n}.json#{vid}")
            continue
        vus.add((n, vid))
        try:
            octets = base64.b64decode(b64, validate=True)
            if not (octets[:3] == b"ID3" or (octets[0] == 0xFF and octets[1] & 0xE0 == 0xE0)) or len(octets) < 500:
                invalides.append(f"« {texte} » n'est pas un MP3 plausible ({len(octets)} octets)")
        except Exception:   # noqa: BLE001
            invalides.append(f"« {texte} » : base64 invalide")
    bilan.check("DN-52", f"Chaque son référencé dans KV ({len(kv)}) existe dans voice/", not absents, premiers(absents))
    bilan.check("DN-53", "Chaque son est un MP3 en base64 plausible (ID3 ou trame MPEG, > 500 octets)", not invalides, premiers(invalides))
    orphelins = sum(len(c) for c in contenu.values()) - len(vus)
    bilan.note("DN-54", "Enregistrements de voix présents mais jamais demandés par KV", f"{orphelins}")

    # ---- DN-6x : images
    sources = page.evaluate(JS_SOURCES)
    statiques = set(re.findall(r"""["'`(=]\s*(?:\./)?(img/[A-Za-z0-9._-]+\.(?:webp|png|jpg|jpeg|svg|gif))""", sources))
    dynamiques = set(page.evaluate(JS_IMAGES))
    # Visages passés en 2e argument de headSvg("…", "visage")
    visages = set(re.findall(r"""headSvg\((?:[^()]|\([^()]*\))*?,\s*["']([a-z0-9-]+)["']\s*[,)]""", sources))
    dynamiques |= {f"img/kai-{v}.webp" for v in visages}
    toutes = sorted(statiques | dynamiques)
    absentes = [f for f in toutes if http_status(base + f) != 200]
    bilan.check("DN-61", f"Chaque image référencée ({len(toutes)}) existe dans img/ et se charge en HTTP",
                not absentes and len(toutes) > 60, premiers(absentes) or f"seulement {len(toutes)} images repérées")
    bilan.note("DN-62", "Origine des références d'images", f"{len(statiques)} écrites en toutes lettres, {len(dynamiques)} construites par le code ({len(visages)} visages)")
    for f in ("manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"):
        if f in sources or f.split(".")[0] in sources:
            if http_status(base + f) != 200:
                bilan.ko("DN-63", f"Fichier de la racine référencé introuvable : {f}")
    manifest = json.loads(http_get(base + "manifest.webmanifest"))
    icones = [i["src"] for i in manifest.get("icons", []) if http_status(base + i["src"]) != 200]
    bilan.check("DN-64", "Le manifeste est un JSON valide et ses icônes existent", not icones, premiers(icones))

    # polices auto-hébergées : chaque @font-face local pointe vers un fichier qui existe
    polices = page.evaluate(JS_FONTFACE)
    manque = [u for u in polices if http_status(u) != 200]
    bilan.check("DN-65", f"Chaque police locale déclarée par @font-face ({len(polices)}) existe", not manque, premiers(manque))
    n = page.evaluate("() => ({ verbes: DICT.length, irr: IRR100.length, phr: PHR.data.length, idi: IDI.data.length, conj: LORDER.conj.length, gram: LORDER.grammar.length, "
                      "noms: NDICT.length, adj: ADJ.data.length, adv: ADV.data.length, con: CON.data.length, prep: PREP.data.length })")
    bilan.note("DN-66", "Compteurs réels (le README annonce 13 leçons de conjugaison, 19 de grammaire, 100 verbes irréguliers, 44 phrasal verbs, 27 expressions)", json.dumps(n))

    erreurs = collector.errors
    bilan.check("DN-99", "Aucune erreur console / requête en échec pendant le chargement et l'analyse", not erreurs, premiers(erreurs))
    ctx.close()


if __name__ == "__main__":
    raise SystemExit(run_suite("Données", __doc__, run))
