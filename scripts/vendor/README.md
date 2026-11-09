# Vendored upstream files

Verbatim copies of files from [basecamp/omarchy](https://github.com/basecamp/omarchy)
(MIT), used by `scripts/check` and the tests. They are unmodified, so
refreshing one is a plain download; the commit column is the upstream revision
the copy was taken from.

| File | Upstream path | Commit | Used by |
|------|---------------|--------|---------|
| `omarchy-plugin-validate` | `bin/omarchy-plugin-validate` | `b7e900c` (v4.5.0) | `scripts/check` |
| `qml-text-format-scan.py` | `test/shell.d/qml-text-format-scan.py` | `4be440b` (unchanged in v4.5.0) | `scripts/check` |
| `Plural.js` | `shell/Commons/Plural.js` | `84cfb93` (v4.5.0) | `tests/tr.js`, `tests/i18n_test.js` |
| `locales.json` | `default/i18n/locales.json` | `84cfb93` (v4.5.0) | `tests/i18n_test.js` |

Refresh from a release tag (not HEAD, which runs ahead of what users have):

```bash
tag=v4.5.0
base=https://raw.githubusercontent.com/basecamp/omarchy/$tag
curl -fsSL -o scripts/vendor/omarchy-plugin-validate "$base/bin/omarchy-plugin-validate"
curl -fsSL -o scripts/vendor/qml-text-format-scan.py "$base/test/shell.d/qml-text-format-scan.py"
curl -fsSL -o scripts/vendor/Plural.js "$base/shell/Commons/Plural.js"
curl -fsSL -o scripts/vendor/locales.json "$base/default/i18n/locales.json"
```

Then update the commit column and run `scripts/check`. A new language in
`locales.json` needs a catalog in `i18n/` before `I18N_STRICT=1` passes.
