# Security Policy

## Supported versions

Only the latest release on `main` is supported. Omarchy plugins are installed
as git checkouts and updated with `omarchy plugin update`, so staying current
is one command.

## Reporting a vulnerability

Please **do not** open a public issue for security problems. Instead, use
GitHub's private vulnerability reporting:

**[Report a vulnerability](https://github.com/brianirish/omarchy-mouse-battery/security/advisories/new)**

You should get a response within a week. Please include reproduction steps and
the Omarchy version (`omarchy version`).

## Threat model notes

Useful context for assessing findings:

- Omarchy shell plugins run **unsandboxed** inside `omarchy-shell` as the
  logged-in user — this is true of every plugin and is warned about by
  `omarchy plugin add`.
- The widget reads UPower over the session D-Bus through Quickshell's built-in
  service. It never writes to UPower, sysfs, or the device.
- The only command it executes is the `onClick` setting from the user's own
  `~/.config/omarchy/shell.json` (default `openlogi-desktop`), run through the
  bar's standard `run()` helper on a left-click. A user who can edit that file
  can already run arbitrary commands in their session, so this adds no
  privilege — but reports about the value being reachable from anywhere else
  are welcome.
- The plugin handles no secrets, opens no sockets, and makes no network
  requests.
