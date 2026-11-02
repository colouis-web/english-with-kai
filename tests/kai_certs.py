"""Outils communs aux tests d'acceptation des certificats et de « My daily work » (Dédé, sprint B).

Pas de règle métier ici : de la plomberie (contexte avec la progression de référence, horloge simulée,
espion sur le tirage d'une épreuve) et des « oracles » qui calculent la bonne réponse À PARTIR DES DONNÉES du dépôt
(jamais à partir de l'écran testé), pour que le test puisse répondre comme un élève et comparer à ce que l'écran affiche.
"""
import json

from kai_common import FIXED_NOW, FIXTURES, new_context

FIXTURE = FIXTURES / "progression-reference.json"
CAMILLE = "kmvm3z7k0vnx6"      # niveau 0 (Beginner), élève en cours dans la progression de référence
NOE = "kmvuqrhc0w5vp"          # niveau 1 (Elementary)
SEED = 20261102

# Lundi 2 novembre 2026, 10 h (Europe/Paris) : jour du sprint B. Les durées de validité s'en déduisent :
#   Beginner / Elementary : 2026-11-02 + 3 mois = 2027-02-02 ; Intermediate / Upper : + 6 mois = 2027-05-02.
JOUR0 = "2026-11-02"
T0 = "2026-11-02T10:00:00"

LS_DUMP = ("() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i);"
           " if (k.startsWith('kai.')) o[k] = localStorage.getItem(k) } return o }")

# Hasard reproductible rejoué juste avant un tirage.
RESEED = """(seed) => { let a = seed >>> 0; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }"""


def reference():
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


def contexte(browser, base, collector, ls=None, now=T0, viewport=(390, 844), mobile=True, seed=SEED, **kw):
    """Contexte isolé dont le stockage est rempli UNE fois (au premier chargement) avec `ls`, horloge figée à `now`.
    ls=None : appareil vierge. Les rechargements gardent le stockage (le test peut recharger la page)."""
    ctx = new_context(browser, base, viewport, collector, seed=seed, now=now, mobile=mobile, **kw)
    if ls is not None:
        ctx.add_init_script("(() => { try { if (!sessionStorage.getItem('__seeded')) { localStorage.clear(); const d = "
                            + json.dumps(ls) + "; for (const k in d) localStorage.setItem(k, d[k]); sessionStorage.setItem('__seeded', '1'); } } catch (e) {} })();")
    return ctx


def jour(page, iso_jour, heure="10:00:00"):
    """Avance (ou recule) l'horloge simulée de la page : « le lendemain », « dans trois mois »."""
    page.clock.set_fixed_time(f"{iso_jour}T{heure}")


# Espion : mémorise ce que Cert.pickExam / Cert.pickRenewal rendent, dans l'ordre, pour que le test connaisse les questions
# réellement posées (et leurs réponses) sans lire l'écran. N'altère pas le résultat.
SPY_JS = r"""
(() => {
  if (window.__spy || typeof Cert !== 'object') return !!window.__spy;
  window.__spy = { exams: [], renewals: [] };
  for (const [fn, bucket] of [['pickExam', 'exams'], ['pickRenewal', 'renewals']]) {
    if (typeof Cert[fn] !== 'function') continue;
    const orig = Cert[fn];
    Cert[fn] = function () {
      const r = orig.apply(this, arguments);
      try { window.__spy[bucket].push({ args: JSON.parse(JSON.stringify(Array.from(arguments).filter(a => typeof a !== 'function'))),
                                         qs: JSON.parse(JSON.stringify(Array.isArray(r) ? r : (r && (r.questions || r.qs || r.items)) || [])) }); } catch (e) {}
      return r;
    };
  }
  return true;
})()
"""

# Oracle (dans la page) : réponse attendue d'une question tirée, calculée d'après les DONNÉES (allWords, ex).
# Renvoie { shown: texte de la phrase, target: mot à taper, words: mots de la phrase à remettre dans l'ordre, bad, good }.
ORACLE_JS = r"""
(q) => {
  const A = allWords(), w = A.byKey.get(q.key), d = w && w.d;
  const word = d ? (d.w || d.v) : null;
  const findStr = x => { if (typeof x === 'string') return x.includes('*') ? x : null;
    if (Array.isArray(x)) { for (const y of x) { const r = findStr(y); if (r) return r } return null }
    if (x && typeof x === 'object') { for (const k of Object.keys(x)) { const r = findStr(x[k]); if (r) return r } } return null };
  let en = null;
  if (q.ex !== undefined && q.ex !== null) {
    if (typeof q.ex === 'number' && d && d.ex && d.ex[q.ex]) en = d.ex[q.ex][0];
    else en = findStr(q.ex);
  }
  const m = en && en.match(/\*([^*]+)\*/);
  const out = { word, fmt: q.fmt, key: q.key, en };
  if (m) { out.target = m[1]; out.sentence = en.replace(/\*/g, ''); out.words = out.sentence.replace(/[.!?]+$/, '').split(/\s+/); }
  if (q.fmt === 'fix') { out.bad = q.bad || (q.ex && q.ex.bad) || null; out.good = q.good || (q.ex && q.ex.good) || null; }
  return out;
}
"""
