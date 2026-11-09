# Contributing

Thanks for helping improve the Omarchy mouse battery widget!

## Development setup

The plugin is developed in place — clone it where Omarchy loads plugins from:

```bash
git clone https://github.com/brianirish/omarchy-mouse-battery.git \
  ~/.config/omarchy/plugins/brianirish.mouse-battery
omarchy-shell shell rescanPlugins
omarchy plugin enable brianirish.mouse-battery
```

(If you installed via `omarchy plugin add`, that directory is already a git
checkout — fork, add your remote, and work there.)

## Iterating

- Saving files under `~/.config/omarchy/plugins/` triggers the shell's
  hot-reload, **but** the QML engine can keep serving a cached component even
  after `rescanPlugins`. When a change doesn't show up, run
  `omarchy restart shell` — that always picks it up.
- Watch for QML errors with `journalctl --user -f | grep -i qml`.
- Keep logic in `Model.js` and keep it free of QML imports so
  `node tests/model_test.js` keeps running. `Widget.qml` should stay a thin
  binding layer: read UPower, hand plain values to `Model`, render.
- Add or update a test in `tests/model_test.js` for every behaviour change in
  `Model.js`.
- Style: follow the stock widgets in `/usr/share/omarchy/shell/plugins/`
  (`omarchy.system-update` and the power panel were this widget's templates).
  Use the `qs.Ui` kit and `Style`/`Color` tokens instead of hardcoded values
  so themes keep working.
- Run `scripts/check` before opening a PR — it is exactly what CI runs. On an
  Omarchy machine it also lints the QML against the installed shell's
  components (`scripts/qml-api-lint`); elsewhere that step is skipped and CI
  runs it.

## Strings and translations

Every string the widget shows lives in `i18n/en.json` and is read through
`strings.t("key")` in QML, or `tr.t("key")` in `Model.js`, which takes the
translator as an argument so tests can render any language
(`tests/tr.js`). To add or change one:

1. Add the key and its English text to `i18n/en.json`. Keep the sentence
   whole, with `%1`, `%2` for the values; never glue fragments together.
   A string that counts something is a plural entry
   (`{ "one": "%1 device", "other": "%1 devices" }`) read with `tn`.
2. Use it with a literal key (`tr.t("state.full")`, not
   `tr.t("state." + name)`), so `tests/i18n_test.js` can check that every key
   is used and defined.
3. Run `scripts/check`. Other languages may lag behind; until they catch up
   they show the English text.

Translations into the other languages are welcome as PRs that edit
`i18n/<code>.json`. The check keeps each translation's `%1` placeholders and
plural forms in line with English.

## Testing without hardware

`Model.js` takes plain device objects, so the tests cover every branch
without a mouse attached. To exercise the QML layer, any UPower device of
type mouse/keyboard works — a Bluetooth keyboard is enough.

## Releasing

1. Move the `Unreleased` notes under a new version heading in `CHANGELOG.md`
   and set the same version in `manifest.json`.
2. Run `I18N_STRICT=1 scripts/check`, which also requires every catalog to
   be complete.
3. Tag `vX.Y.Z`, push, and publish a GitHub release with the changelog
   notes.

## Pull requests

- One logical change per PR.
- Update `CHANGELOG.md` under an `Unreleased` heading.
- Include a screenshot for visual changes (`omarchy capture screenshot`).
- Note the Omarchy version you tested on.

## Bugs and ideas

Open an issue using the templates. For security problems, see
[SECURITY.md](SECURITY.md) — please don't open public issues for those.
