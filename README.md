# Omarchy Mouse Battery

[![CI](https://github.com/brianirish/omarchy-mouse-battery/actions/workflows/ci.yml/badge.svg)](https://github.com/brianirish/omarchy-mouse-battery/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A bar widget for [Omarchy](https://omarchy.org) that shows the battery level
of your wireless mouse (or keyboard) — read straight from UPower, with no
polling and no vendor daemon. Devices on a Logi Bolt receiver, which the
kernel can't read, are picked up through [Solaar](https://github.com/pwr-Solaar/Solaar).

![The widget in the bar](docs/bar.png)

Omarchy's stock `omarchy.power` widget only shows the *display device* (your
laptop battery / AC). Peripheral batteries that the kernel already knows about
are invisible. This widget fills that gap:

- **Mouse glyph · percentage · battery glyph** in the bar, following your theme
- Battery glyph tracks level and charging state, same icon set as the stock
  power widget
- Tooltip with the device model, percentage, and state
  (`Logitech MX Master 2S · 55% · Discharging`)
- Hides itself when no wireless mouse/keyboard is connected
- Left-click launches a configurable command (defaults to
  [OpenLogi](https://github.com/AprilNEA/OpenLogi)'s desktop app)
- Works with any device UPower classifies as a mouse, keyboard, touchpad, or
  gaming input — Logitech Unifying/Bolt receivers, Bluetooth HID++ devices,
  anything the `hid-logitech-hidpp` driver or Bluetooth battery profile exposes
- Logi Bolt receivers too, via an optional `solaar show` fallback (see
  [Bolt receivers](#bolt-receivers))

## Install

```bash
omarchy plugin add https://github.com/brianirish/omarchy-mouse-battery.git --enable --yes
```

The widget lands in the bar's right section. Move it with

```bash
omarchy bar move brianirish.mouse-battery --before omarchy.bluetooth
```

or any other `omarchy bar move` placement.

### Requirements

- Omarchy 4.x (the Quickshell-based shell with `omarchy plugin`; developed on 4.0.3)
- `upower` running (it is, on every Omarchy install)
- A peripheral that shows up in `upower -e` — check with:

  ```bash
  upower -e | grep -v -e DisplayDevice -e line_power -e BAT
  ```

  If nothing is listed, the kernel has no battery information for the device
  and the widget stays hidden, unless Solaar can read it (see
[Bolt receivers](#bolt-receivers)). See [Troubleshooting](#troubleshooting).

## Settings

Settings live inline on the widget's `shell.json` entry and can be changed with
`omarchy bar set`:

| Key | Default | Meaning |
|---|---|---|
| `showPercentage` | `true` | Show `󰍽 55% 󰁿`. Set to `false` for the battery glyph alone (the percentage stays in the tooltip). Vertical bars always use the glyph-only form. |
| `onClick` | `"openlogi-desktop"` | Command run on left-click. Set to `""` to disable. |
| `solaarInterval` | `300` | Seconds between `solaar show` polls while UPower has no device (see [Bolt receivers](#bolt-receivers)). `0` disables the fallback. |

```bash
omarchy bar set brianirish.mouse-battery showPercentage false
omarchy bar set brianirish.mouse-battery onClick "solaar"
```

## How it works

```
mouse ─radio─▶ receiver ─▶ kernel hid-logitech-hidpp ─▶ /sys/class/power_supply/hidpp_battery_N
                                                                │
                                                        upowerd (D-Bus)
                                                                │
                                        Quickshell.Services.UPower ─▶ this widget
```

The widget binds to `UPower.devices` from Quickshell's UPower service and picks
the first present device whose type is Mouse, Keyboard, Touchpad, or
GamingInput. Everything to the left of the widget in the diagram is already
running on a stock Omarchy install; the widget adds no polling, no timers, and
never talks to the device. Updates arrive as D-Bus property-change signals.
The one exception is the [Bolt fallback](#bolt-receivers), which only runs
when UPower has no device to offer.

### Bolt receivers

The kernel's `hid-logitech-dj` driver supports Unifying and Nano receivers
but not **Logi Bolt** (`046d:c548`). Devices paired to a Bolt receiver still
work as a mouse, but no battery information reaches `/sys/class/power_supply`,
so UPower never sees them.

For those, the widget falls back to [Solaar](https://github.com/pwr-Solaar/Solaar),
which speaks HID++ to the receiver directly:

```bash
sudo pacman -S solaar   # also installs the udev rules that let your user open the receiver
```

The fallback only runs while UPower reports no mouse or keyboard. It then runs
`solaar show` every `solaarInterval` seconds (5 minutes by default; each run
takes a few seconds) and shows the first mouse, trackball, touchpad or
keyboard that reports a battery level. Without Solaar installed nothing
happens and the widget stays hidden as before. Devices UPower can see always
take priority, and for them nothing is polled.

### Why does it say 55% when my mouse app says 50%?

Many Logitech mice (the MX Master 2S among them) only report **coarse battery
levels** over HID++ — critical / low / normal / full — not a real percentage.
The kernel driver maps those to fixed values (5 / 20 / 55 / 90), and vendor
tools use their own mapping (OpenLogi says 50 for "normal"). Same information,
different labels. Expect the number to step between those values rather than
tick down smoothly. Newer devices with the unified-battery feature report true
percentages and the widget shows them as-is.

## Troubleshooting

**Widget doesn't appear.** It's hidden when no device matches. Run
`upower -e`; if your mouse isn't listed, UPower can't see it. On a Bolt
receiver (`lsusb | grep -i bolt`) install Solaar and check that `solaar show`
prints a `Battery:` line for the device. For Logitech
receivers make sure `hid-logitech-hidpp` is loaded (`lsmod | grep hidpp`) —
it is on stock Arch kernels. For Bluetooth mice the device must expose the
Battery Service profile.

**Wrong device.** The widget picks the first matching device in UPower's
order. If you have several, the model name in the tooltip tells you which one
won. Per-device selection is on the [roadmap](#roadmap) — open an issue if you
need it.

**Errors.** `journalctl --user -f | grep -i -e qml -e mouse-battery` shows
QML load errors. `omarchy restart shell` forces a clean reload.

## Roadmap

- Choose which device to show when several are present
- Optional low-battery notification

## Development

```bash
git clone https://github.com/brianirish/omarchy-mouse-battery.git \
  ~/.config/omarchy/plugins/brianirish.mouse-battery
scripts/check        # unit tests, qmllint, manifest validation — same as CI
```

The pure logic (device selection, icon choice, labels) lives in `Model.js` and
is unit-tested with plain Node (`node tests/model_test.js`). `Widget.qml` is a
thin binding layer over it. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Uninstall

```bash
omarchy plugin remove brianirish.mouse-battery
```

## License

[MIT](LICENSE)
