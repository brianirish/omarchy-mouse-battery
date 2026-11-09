# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-11-09

Omarchy 4.5 support. 2.0 needs Omarchy 4.5 or newer; on 4.0, stay on 1.1.1
(`git -C ~/.config/omarchy/plugins/brianirish.mouse-battery checkout v1.1.1`).

### Fixed

- On Omarchy 4.5 the bar showed three dots instead of `󰍽 55% 󰁿`: 4.5 fits a
  bar icon's text into a single icon box, so the whole string shrank. The
  battery glyph is now the icon, and the device glyph and percentage are drawn
  as a label beside it, the way the built-in battery widget does.
- `showPercentage` accepts the `"true"`/`"false"` strings that
  `omarchy bar set` stores without `--json`; `"true"` used to hide the
  percentage.

### Added

- Translations. The tooltip, state words and fallback device names follow
  Omarchy's display language (Setup › Language) live, in all 50 of its
  languages, with numbers in the language's digits. English is the source;
  the other catalogs are machine-translated and corrections are welcome.
- `scripts/qml-api-lint` type-checks the QML against a real Omarchy shell's
  components, which plain qmllint can't resolve. `scripts/check` runs it on an
  Omarchy machine, and a new CI job runs it on Arch's Qt and Quickshell
  against Omarchy v4.5.0 for every change and against the newest Omarchy
  release every week.
- `tests/i18n_test.js` checks the catalogs the way Omarchy checks its own:
  every key used is defined, placeholders and plural forms match English, and
  (with `I18N_STRICT=1`, for releases) every language is complete.

### Changed

- The vendored `omarchy-plugin-validate` is refreshed from Omarchy v4.5.0 and
  knows the new `centerBegin`, `centerEnd` and `tray` sections.
- `actions/setup-node` is bumped to v7.1.0.

### Removed

- Support for Omarchy 4.0 and earlier.

## [1.1.1] - 2026-09-22

### Fixed

- The Solaar fallback no longer fails on multi-monitor setups. Each bar runs
  its own copy of the widget, and simultaneous `solaar show` runs corrupt
  each other's HID++ requests (they crash or hang), so the widget stayed
  hidden. Polls are now serialised with `flock` and capped with `timeout`.
- A failed poll keeps the last good reading, and when there is none yet it
  retries after 30 seconds instead of waiting a full `solaarInterval`.

## [1.1.0] - 2026-09-22

### Added

- Solaar fallback for Logi Bolt receivers, which the kernel's
  `hid-logitech-dj` driver doesn't bind, so UPower never sees their devices.
  While UPower reports no mouse or keyboard, the widget polls `solaar show`
  (if installed) and parses its battery lines. The new `solaarInterval`
  setting sets the poll period in seconds (default 300, `0` disables it).

## [1.0.0] - 2026-09-13

### Added

- Bar widget showing the battery level of the first wireless mouse, keyboard,
  touchpad, or gaming-input device UPower reports, bound to Quickshell's
  `UPower.devices` — no polling, no vendor daemon.
- Device glyph, percentage, and level/charging-aware battery glyph in the bar;
  tooltip with model, percentage, and state. Hidden when no device is present.
- `showPercentage` setting (glyph-only mode; always used on vertical bars).
- `onClick` setting — command run on left-click, defaulting to OpenLogi's
  desktop app.
- `Model.js` holds the pure logic, unit-tested under Node
  (`tests/model_test.js`); `scripts/check` runs those tests plus `qmllint`,
  Omarchy's vendored plugin validator and QML `textFormat` scanner,
  manifest/CHANGELOG version agreement, ShellCheck, and YAML validation.
