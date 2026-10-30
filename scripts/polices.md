# Régénérer les polices (hors exécution, outil de dev)

Sources : `github.com/google/fonts` (`ofl/robotocondensed`, `ofl/notoemoji`), licence OFL.
Outil : `pip install fonttools` (brotli absent ici : sortie WOFF/zlib ; avec `brotli`, remplacer par `--flavor=woff2`).

- Roboto Condensed : `python3 -m fontTools.subset "RobotoCondensed[wght].ttf" --unicodes=<latin + ponctuation> --flavor=woff --layout-features='*'`
- Noto Emoji : fixer `wght=500` (`fontTools.varLib.instancer`), puis sous-ensemble = emojis présents dans l'app + blocs U+1F300-1FAFF.
  Si de nouveaux emojis sont ajoutés aux données, relancer la commande (sinon l'emoji système s'affiche, sans casse).
