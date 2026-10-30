# Relecture : IPA et prononciation des 68 connecteurs (bug C5) — Ludo, 30/10/2026

- **Fichier** : `js/data/lexiques.js`, ligne `const CON=…` ; champs `ipa` et `pr` ajoutés après `fr`, même ordre que
  l'entrée existante `ultimately`.
- **Référence** : anglais britannique, forme de citation des dictionnaires d'apprenant (Cambridge, Oxford Learner's).
  Pour les expressions de plusieurs mots, transcription « en phrase » : mots grammaticaux en forme faible
  (`to` /tə/, `of` /əv/, `as` /əz/, `for` /fə(r)/), comme les prépositions déjà présentes (`because of /bɪˈkɒz əv/`,
  `in front of /ɪn ˈfrʌnt əv/`).
- **Prononciation « à la française »** : style des adverbes et prépositions existants (syllabe accentuée en
  MAJUSCULES, `eu` pour /ə/ et /ʌ/, `ou` pour /w/, `dh` + « (th doux) » pour /ð/, `zeu` / `zi` pour *the* comme dans
  `in the middle of`). Un mot d'une syllabe reste en minuscules (`since` → « sinns »).
- **Cohérence** : `despite`, `since`, `yet`, `so`, `because of`, `thanks to` reprennent mot pour mot la transcription
  déjà présente dans les prépositions ou adverbes.

## Entrées à vérifier (doute réel)

| Entrée | Choix fait | Doute | Alternative |
|---|---|---|---|
| `and` | /ænd/ · « annd (vite : eunn) » | Forme forte de citation ; en phrase on dit presque toujours /ən/. | /ənd/ seul, ou garder les deux. |
| `but` | /bʌt/ · « beutt » | Forme forte ; forme faible /bət/ en phrase. Pas de note « vite » pour ne pas surcharger. | Ajouter « (vite : beut) » comme pour *and*. |
| `because` | /bɪˈkɒz/ | Cambridge donne /bɪˈkɒz/ et /bɪˈkəz/ ; Oxford /bɪˈkɒz/. Gardé comme dans `because of`. | — |
| `in other words` | /ɪn ˈʌðə wɜːdz/ | Accent principal : sur *other* (usage courant) ou sur *words* (/ɪn ˌʌðə ˈwɜːdz/) ? Les dictionnaires ne transcrivent pas l'expression. | /ɪn ˌʌðə ˈwɜːdz/ |
| `on the one hand` / `on the other hand` | accent sur *one* / *other* | Accent contrastif (le plus fréquent à l'oral) ; en lecture neutre, accent sur *hand*. | /ɒn ðə ˌwʌn ˈhænd/ |
| `whereas` | /ˌweərˈæz/ | Oxford /ˌweərˈæz/, Cambridge /weəˈræz/ : même son, découpage différent. « ouèr-AZ » couvre les deux. | — |
| `due to` | /ˈdjuː tə/ | Britannique de référence /djuː/ ; beaucoup de Britanniques disent /dʒuː/ (« djou »). | « DJOU teu » |
| `so that` | /ˈsəʊ ðət/ | *that* en forme faible ; certains locuteurs accentuent *that*. | /səʊ ˈðæt/ |
| `thanks to` | /ˈθæŋks tə/ · « THANKS tou » | Repris tel quel de la préposition existante : l'IPA a /tə/ mais la prononciation écrit « tou ». Incohérence ancienne, gardée pour que les deux fiches soient identiques. | Passer les deux en « THANKS teu ». |
| `furthermore`, `nevertheless` | /ˌfɜːðəˈmɔː/, /ˌnevəðəˈles/ | Accent principal sur la dernière syllabe (Cambridge, Oxford). À confirmer à l'écoute. | — |
| `as a matter of fact` | /əz ə ˌmætər əv ˈfækt/ | /r/ de liaison devant *of* (britannique) ; « MA-teur ov » le suggère sans l'écrire. | /ˌmætə(r) əv/ |
| `that is to say` | /ˌðæt ɪz tə ˈseɪ/ | *that* en forme forte (démonstratif). | — |
| `contrary to` | /ˈkɒntrəri tə/ | Accent sur la 1re syllabe (Cambridge) ; Oxford signale aussi /kənˈtreəri/ dans *on the contrary* (sens « au contraire » emphatique). | — |

Toutes les autres entrées (*first, also, besides, moreover, in addition, for example, for instance, such as, indeed,
next, then, secondly, however, although, even though, even if, in spite of, while, otherwise, unlike, likewise,
meanwhile, as if, if, unless, as long as, provided that, whether, in case, supposing, since, as soon as, so, in order
to, so as to, therefore, consequently, as a result, that's why, finally, lastly, in conclusion, to conclude, in short,
to sum up, all in all*) : pas de doute particulier, transcription standard des deux dictionnaires.
