#!/usr/bin/env python3
"""Banque des certificats (js/data/certificats.js, Matt) : contrôle du CONTENU par un testeur (Dédé, sprint B).

  python3 tests/test_certificats_banque.py [--app <dossier>] [-v]

Règle 3 du projet (« pédagogie juste ») : le test ne remplace pas la relecture du scrum master, il attrape ce qu'une machine voit :
mots qui n'existent pas dans les dictionnaires, périmètres trop grands, phrases sans cible ou avec deux cibles, phrases `fix` dont
l'erreur ne se corrige pas en un seul mot, images partagées (donc ambiguës), orthographe américaine, mots inadaptés à un enfant de 11–12 ans,
quantités suffisantes pour tirer une épreuve (quotas de la conception §5.2), doublons.

  BQ-0x  fichier chargé, trois certificats (Colours, Family 1, Animals 1), périmètres exacts de la conception §5.5 ;
  BQ-1x  chaque mot : clé existante dans les données, au moins une phrase à compléter / à remettre dans l'ordre / à corriger ;
  BQ-2x  phrases à compléter : une seule cible, la cible est une forme du mot (ou une réponse déclarée) ;
  BQ-3x  phrases à remettre dans l'ordre : 4 à 8 mots, sans virgule, sans complément de temps déplaçable ;
  BQ-4x  phrases à corriger : un seul mot faux, présent une seule fois, qui se corrige en remplaçant UN mot ;
  BQ-5x  images : uniques dans le certificat, pas d'émoji trompeur (puppy, kitten), assez pour les quotas ;
  BQ-6x  anglais britannique (grey, mum), variantes américaines déclarées en `us` ; vocabulaire adapté à un enfant ;
  BQ-7x  quantités pour tirer 20 questions : traductions, images, phrases, ordres, corrections.
"""
import json

from kai_common import open_app, run_suite
from kai_certs import contexte, reference

ATTENDU = {   # conception §5.5
    "adjectives:colours": {"red", "blue", "green", "yellow", "orange", "pink", "purple", "brown", "black", "white", "grey"},
    "nouns:family-1": {"family", "parent", "mother", "mum", "father", "dad", "brother", "sister", "son", "daughter", "grandmother", "grandfather",
                       "grandma", "grandpa", "grandparents", "uncle", "aunt", "cousin"},
    "nouns:animals-1": {"pet", "dog", "puppy", "cat", "kitten", "rabbit", "mouse", "goldfish", "parrot", "tortoise", "horse", "pony", "donkey", "cow",
                        "pig", "sheep", "lamb", "goat", "hen", "duck"},
}

ANALYSE = r"""() => {
  const B = CERTBANK, A = allWords(), out = { certs: [], pb: {} };
  const P = (id, msg) => { (out.pb[id] = out.pb[id] || []).push(msg) };
  const norm = t => String(t || '').toLowerCase().replace(/[’']/g, "'").replace(/[.,!?;:"]/g, ' ').replace(/\s+/g, ' ').trim();
  const tg = s => { const m = String(s).match(/\*([^*]+)\*/g); return m ? m.map(x => x.slice(1, -1)) : [] };
  const BAD = /\b(die|died|dead|death|kill|killed|blood|war|gun|weapon|hate|ugly|stupid|fat|cry|cries|sad|funeral|divorce|divorced|drunk|beer|wine|sex)\b/i;
  const US = /\b(gray|color|colors|colorful|mom|favorite|neighbor|center)\b/i;
  const MOV = /\b(today|tomorrow|yesterday|every day|always|never|often|sometimes|usually|on (monday|tuesday|wednesday|thursday|friday|saturday|sunday)|at the weekend|every (morning|night|week))\b/i;
  for (const c of B.certs) {
    const words = c.words || [], info = { id: c.id, n: words.length, title: c.title, pic: 0, gap: 0, ord: 0, fix: 0, picEmojis: [], keys: [] };
    if (words.length > 20) P('BQ-02', c.id + ' : ' + words.length + ' mots (> 20)');
    if (!c.title || !c.titleFr) P('BQ-03', c.id + ' : titre ou sous-titre français manquant');
    const emojis = {};
    for (const w of words) {
      const e = A.byKey.get(w.k);
      info.keys.push(w.k);
      if (!e) { P('BQ-10', c.id + ' : clé inconnue ' + w.k); continue }
      const d = e.d, forms = new Set([d.w, d.v, d.pl, d.cmp].filter(x => x && x !== '—').map(norm));
      (w.ok ? Object.values(w.ok).flat() : []).forEach(x => forms.add(norm(x)));
      (w.us ? Object.values(w.us).flat() : []).forEach(x => forms.add(norm(x)));
      const word = d.w || d.v;
      if (!(w.gap && w.gap.length)) P('BQ-11', c.id + ' : ' + word + ' n\'a aucune phrase à compléter');
      if (!(w.ord && w.ord.length)) P('BQ-12', c.id + ' : ' + word + ' n\'a aucune phrase à remettre dans l\'ordre');
      if (!(w.fix && w.fix.length)) P('BQ-13', c.id + ' : ' + word + ' n\'a aucune phrase à corriger');
      // phrases à compléter
      (w.gap || []).forEach(g => {
        info.gap++;
        const T = tg(g[0]), Tf = tg(g[1]);
        if (T.length !== 1) { P('BQ-20', c.id + ' : « ' + g[0] + ' » a ' + T.length + ' cibles'); return }
        if (!g[1]) P('BQ-21', c.id + ' : « ' + g[0] + ' » sans phrase française');
        else if (Tf.length < 1) P('BQ-21', c.id + ' : « ' + g[1] + ' » : cible française non marquée');
        if (!forms.has(norm(T[0])) && !(g[2] || []).map(norm).includes(norm(T[0]))) P('BQ-22', c.id + ' : la cible « ' + T[0] + ' » n\'est pas une forme de ' + word + ' (' + [...forms].join('/') + ')');
        if (norm(g[0]).split(' ').length > 12) P('BQ-23', c.id + ' : phrase trop longue pour A1 : ' + g[0]);
      });
      // ordre
      (w.ord || []).forEach(o => {
        info.ord++;
        const s = String(o[0]).replace(/[.!?]+$/, ''), n = s.split(/\s+/).length;
        if (n < 4 || n > 8) P('BQ-30', c.id + ' : « ' + o[0] + ' » a ' + n + ' mots (4 à 8 attendus)');
        if (/[,:;]/.test(s)) P('BQ-31', c.id + ' : « ' + o[0] + ' » contient une virgule ou deux-points');
        if (MOV.test(s) && !(o[2] && o[2].length)) P('BQ-32', c.id + ' : « ' + o[0] + ' » a un complément déplaçable sans autre ordre déclaré');
        if (!o[1]) P('BQ-33', c.id + ' : « ' + o[0] + ' » sans phrase française');
        if (!new RegExp('(^|[^a-z])' + word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '|' + (d.pl && d.pl !== '—' ? d.pl : '§§') , 'i').test(s)) P('BQ-34', c.id + ' : « ' + o[0] + ' » ne contient pas ' + word);
      });
      // correction
      (w.fix || []).forEach(f => {
        info.fix++;
        const toks = f.s.replace(/\*/g, '').split(/\s+/).map(t => t.replace(/[.,!?;:]+$/, ''));
        const at = toks.filter(t => norm(t) === norm(f.bad)).length;
        if (at !== 1) P('BQ-40', c.id + ' : « ' + f.s + ' » : le mot faux « ' + f.bad + ' » apparaît ' + at + ' fois');
        if (norm(f.bad) === norm(f.good)) P('BQ-41', c.id + ' : « ' + f.s + ' » : bad = good');
        const fixed = toks.map(t => norm(t) === norm(f.bad) ? f.good : t).join(' ');
        if (!f.fr || !f.why || !f.whyFr) P('BQ-42', c.id + ' : « ' + f.s + ' » : fr / why / whyFr manquant');
        if (!(forms.has(norm(f.good)) || forms.has(norm(f.bad)) || norm(f.good) === norm(word))) P('BQ-43', c.id + ' : « ' + f.s + ' » : l\'erreur ne porte pas sur le mot ' + word + ' (bad ' + f.bad + ', good ' + f.good + ')');
        if (norm(fixed) === norm(f.s.replace(/\*/g, ''))) P('BQ-44', c.id + ' : « ' + f.s + ' » : la correction ne change rien');
        if (f.good.indexOf(' ') >= 0) P('BQ-45', c.id + ' : « ' + f.s + ' » : la correction « ' + f.good + ' » n\'est pas un seul mot');
        if (US.test(f.s) || US.test(f.good)) P('BQ-60', c.id + ' : fix en anglais américain : ' + f.s);
      });
      // images
      if (w.pic) {
        info.pic++;
        const em = w.pic === true ? d.e : w.pic.e || null;
        if (w.pic.tree) { /* case de l'arbre : l'image est dessinée par l'écran */ }
        else if (!em) P('BQ-50', c.id + ' : ' + word + ' : pic sans émoji');
        else {
          (emojis[em] = emojis[em] || []).push(word);
          info.picEmojis.push(em);
          if (w.pic === true) {
            const sameDict = A.filter(x => x.k === e.k && x.d.e === em && x.key !== w.k).map(x => x.d.w || x.d.v);
            const declared = (w.pic.ok || []).concat(w.ok ? Object.values(w.ok).flat() : []);
            if (sameDict.length && !sameDict.every(x => declared.includes(x))) P('BQ-51n', c.id + ' : ' + word + ' : émoji ' + em + ' partagé avec ' + sameDict.join(', ') + ' (réponses non déclarées)');
          }
        }
      }
      // texte à surveiller
      const all = [...(w.gap || []).flat(2), ...(w.ord || []).flat(2), ...(w.fix || []).flatMap(f => [f.s, f.fr, f.why, f.whyFr]), w.say || ''].filter(x => typeof x === 'string');
      all.forEach(t => { if (BAD.test(t)) P('BQ-61', c.id + ' : mot à éviter pour un enfant de 11–12 ans : « ' + t + ' »'); });
      const en = [...(w.gap || []).map(g => g[0]), ...(w.ord || []).map(o => o[0]), ...(w.fix || []).flatMap(f => [f.s, f.why]), w.say || ''];
      en.forEach(t => { if (US.test(t)) P('BQ-62', c.id + ' : anglais américain : « ' + t + ' »'); });
      if (w.say && !tg(w.say).length && !new RegExp(word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') , 'i').test(w.say) && !(d.pl && new RegExp(d.pl, 'i').test(w.say))) P('BQ-14', c.id + ' : dictée « ' + w.say + ' » ne contient pas le mot ' + word);
      // doublons de phrases
      const seen = (info.seen = info.seen || new Set());
      [...(w.gap || []).map(g => g[0].replace(/\*/g, '')), ...(w.ord || []).map(o => o[0])].forEach(s => { /* un même texte dans gap ET ord est voulu ; deux fois dans le même format non */ });
    }
    for (const [em, ws] of Object.entries(emojis)) if (ws.length > 1) P('BQ-52', c.id + ' : émoji ' + em + ' utilisé pour ' + ws.join(' et '));
    const dup = (L, nom) => { const s = new Set(), d = []; L.forEach(x => { const k = norm(x); if (s.has(k)) d.push(x); s.add(k) }); if (d.length) P('BQ-15', c.id + ' : phrases en double (' + nom + ') : ' + d.slice(0, 3).join(' | ')) };
    dup(words.flatMap(w => (w.gap || []).map(g => g[0])), 'à compléter');
    dup(words.flatMap(w => (w.ord || []).map(o => o[0])), 'ordre');
    dup(words.flatMap(w => (w.fix || []).map(f => f.s)), 'corrections');
    out.certs.push(info);
  }
  return out;
}"""


def run(args, base, browser, bilan, collector):
    def ck(titre, cond, detail=""):
        cid, _, t = titre.partition(" ")
        return bilan.check(cid, t, bool(cond), str(detail)[:1300])

    LS = reference()["ls"]
    m0 = collector.mark()
    ctx = contexte(browser, base, collector, LS)
    page = open_app(ctx.new_page(), base)
    if not page.evaluate("() => typeof CERTBANK === 'object'"):
        try:
            page.add_script_tag(url=base + "js/data/certificats.js")
        except Exception as ex:   # noqa: BLE001
            pass
    present = page.evaluate("() => typeof CERTBANK === 'object' && Array.isArray(CERTBANK.certs)")
    ck("BQ-00 [Matt] js/data/certificats.js se charge comme script classique et déclare CERTBANK", present, "fichier absent ou erreur de syntaxe")
    charge = page.evaluate("() => [...document.scripts].some(s => /data\\/certificats\\.js/.test(s.src))") if present else False
    # La banque est-elle chargée par index.html (sinon le moteur ne la voit pas) ?
    brut = page.evaluate("() => fetch('index.html').then(r => r.text()).then(t => /data\\/certificats\\.js/.test(t))")
    ck("BQ-01 [Ludo/Ouss] index.html charge js/data/certificats.js (sinon le moteur ne voit pas la banque)", brut, "aucune balise <script src=\"js/data/certificats.js\"> dans index.html")
    if not present:
        ctx.close()
        return
    R = page.evaluate(ANALYSE)
    by_id = {c["id"]: c for c in R["certs"]}
    ck("BQ-02a [Matt] Les trois premiers certificats sont dans la banque : Colours, Family 1, Animals 1", set(ATTENDU) <= set(by_id), sorted(by_id))
    for cid, mots in ATTENDU.items():
        if cid not in by_id:
            continue
        cles = {k.split(":", 1)[1] for k in by_id[cid]["keys"]}
        ck(f"BQ-02b [Matt] {cid} : exactement les mots de la conception §5.5 ({len(mots)}), pas plus de 20", cles == mots and by_id[cid]["n"] <= 20, f"en trop {sorted(cles - mots)} ; en moins {sorted(mots - cles)}")
    pb = R["pb"]
    LIBELLES = {
        "BQ-02": "Un certificat de plus de 20 mots", "BQ-03": "Titre et sous-titre français présents", "BQ-10": "Chaque mot est une clé existante des dictionnaires",
        "BQ-11": "Chaque mot a au moins une phrase à compléter", "BQ-12": "Chaque mot a au moins une phrase à remettre dans l'ordre", "BQ-13": "Chaque mot a au moins une phrase à corriger",
        "BQ-14": "La phrase de dictée contient le mot", "BQ-15": "Aucune phrase en double dans un même format",
        "BQ-20": "Phrase à compléter : une seule cible *…*", "BQ-21": "Phrase à compléter : phrase française avec sa cible", "BQ-22": "La cible est une forme du mot (ou une réponse déclarée)",
        "BQ-23": "Phrases de 12 mots au plus (A1)", "BQ-30": "Ordre : 4 à 8 mots", "BQ-31": "Ordre : ni virgule ni deux-points", "BQ-32": "Ordre : pas de complément de temps déplaçable sans autre ordre déclaré",
        "BQ-33": "Ordre : phrase française présente", "BQ-34": "Ordre : la phrase contient le mot du certificat",
        "BQ-40": "Correction : le mot faux apparaît une seule fois", "BQ-41": "Correction : bad ≠ good", "BQ-42": "Correction : traduction et explications présentes",
        "BQ-43": "Correction : l'erreur porte sur le mot du certificat", "BQ-44": "Correction : la phrase corrigée diffère de la fautive", "BQ-45": "Correction : en remplaçant UN mot",
        "BQ-50": "Image : émoji présent", "BQ-52": "Image : un émoji n'est utilisé qu'une fois par certificat",
        "BQ-60": "Anglais britannique dans les corrections", "BQ-61": "Rien d'inadapté à un enfant de 11–12 ans", "BQ-62": "Anglais britannique (pas de gray / color / mom hors variantes déclarées)",
    }
    for code, lib in sorted(LIBELLES.items()):
        ck(f"{code} [Matt] {lib}", not pb.get(code), pb.get(code, [])[:4])
    if pb.get("BQ-51n"):
        bilan.note("BQ-51", "Images dont l'émoji est partagé avec d'autres mots des dictionnaires : le moteur doit accepter ces autres mots (conception §2.2)", "; ".join(pb["BQ-51n"][:6]))
    # puppy / kitten : émojis d'adultes
    for cid in ("nouns:animals-1",):
        if cid in by_id:
            mots = page.evaluate("""(cid) => { const c = CERTBANK.certs.find(x => x.id === cid); return c.words.filter(w => /puppy|kitten/.test(w.k)).map(w => [w.k, !!w.pic]) }""", cid)
            ck("BQ-53 [Matt] Animals 1 : pas d'image pour « puppy » ni « kitten » (l'émoji montre un adulte : ambigu, conception §2.2)", all(not p for _, p in mots), mots)
    # quantités pour tirer l'épreuve (quotas §5.2 Beginner sans son : 6 traductions, 4 images, 5 phrases, 3 ordres, 2 corrections)
    for cid, c in by_id.items():
        ok = c["pic"] >= 4 and c["gap"] >= 5 and c["ord"] >= 3 and c["fix"] >= 2
        ck(f"BQ-70 [Matt] {cid} : de quoi tirer 20 questions sans son (≥ 4 images, ≥ 5 phrases à compléter, ≥ 3 ordres, ≥ 2 corrections)", ok, {k: c[k] for k in ("pic", "gap", "ord", "fix")})
    # variantes américaines déclarées
    us = page.evaluate("""() => { const o = {}; CERTBANK.certs.forEach(c => c.words.forEach(w => { if (w.us) o[w.k] = w.us })); return o }""")
    ck("BQ-63 [Matt] Variantes américaines acceptées avec une note (Q9) : grey → gray, mum → mom", "gray" in json.dumps(us.get("adjectives:grey", "")) and "mom" in json.dumps(us.get("nouns:mum", "")), us)
    errs = collector.since(m0)
    ck("BQ-99 Aucune erreur console ni exception JS", not errs, errs[:4])
    ctx.close()


if __name__ == "__main__":
    raise SystemExit(run_suite("certificats-banque", __doc__, run))
