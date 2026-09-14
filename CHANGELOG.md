# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
