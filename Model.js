// Pure helpers for the mouse-battery widget. No QML imports, so the same
// file runs under Node for tests/model_test.js. Quickshell's UPower enums
// are passed in as plain objects (`types`, `states`) rather than imported.
//
// Text comes from the i18n/ catalogs through `tr`, anything with t(key) and
// tn(key, count): the widget's Commons.Translations in the shell, the
// tests/tr.js stand-in under Node. Numbers come through `formatNumber`
// (Commons.I18n.formatNumber in the shell), so they take the language's
// digits; it defaults to plain String() here.

// Fills %1, %2, … from values, the way QML's String.arg() does; Node has no
// arg(). Only %<digit> is a placeholder, so "%%1" in a Turkish catalog
// reads "%55".
function fill(template, values) {
  return String(template).replace(/%(\d)/g, function(match, n) {
    var value = values[Number(n) - 1]
    return value === undefined ? match : String(value)
  })
}

function number(value, formatNumber) {
  return formatNumber ? formatNumber(value) : String(value)
}

// A boolean setting. `omarchy bar set <id> <key> true` without --json
// stores the string "true", so the strings count as well.
function flag(value, fallback) {
  if (value === true || value === "true") return true
  if (value === false || value === "false") return false
  return fallback
}

function pickDevice(list, types) {
  var values = list || []
  for (var i = 0; i < values.length; i++) {
    var d = values[i]
    if (!d || !d.isPresent) continue
    if (d.type === types.Mouse
        || d.type === types.Keyboard
        || d.type === types.Touchpad
        || d.type === types.GamingInput) return d
  }
  return null
}

function fraction(device) {
  if (!device || !device.isPresent) return 0
  return Math.max(0, Math.min(1, Number(device.percentage) || 0))
}

function percent(device) {
  return Math.round(fraction(device) * 100)
}

function charging(device, states) {
  if (!device || !device.isPresent) return false
  return device.state === states.Charging || device.state === states.FullyCharged
}

function deviceIcon(device, types) {
  if (!device || !device.isPresent) return ""
  if (device.type === types.Keyboard) return "󰌌"
  if (device.type === types.GamingInput) return "󰊗"
  return "󰍽"
}

function batteryIcon(device, states) {
  if (!device || !device.isPresent) return ""
  var chargingIcons = ["󰢜", "󰂆", "󰂇", "󰂈", "󰢝", "󰂉", "󰢞", "󰂊", "󰂋", "󰂅"]
  var defaultIcons = ["󰁺", "󰁻", "󰁼", "󰁽", "󰁾", "󰁿", "󰂀", "󰂁", "󰂂", "󰁹"]
  var index = Math.max(0, Math.min(9, Math.floor(fraction(device) * 10)))
  if (device.state === states.FullyCharged) return "󰂅"
  return charging(device, states) ? chargingIcons[index] : defaultIcons[index]
}

function stateLabel(device, states, tr) {
  if (!device || !device.isPresent) return ""
  switch (device.state) {
    case states.Charging: return tr.t("state.charging")
    case states.Discharging: return tr.t("state.discharging")
    case states.FullyCharged: return tr.t("state.full")
    case states.Empty: return tr.t("state.empty")
    default: return tr.t("state.unknown")
  }
}

// The device's own model name, or a generic one. The model name comes from
// the device, so it is only ever shown as plain text.
function deviceName(device, types, tr) {
  var model = device && device.model ? String(device.model).trim() : ""
  if (model) return model
  if (types && device && device.type === types.Keyboard) return tr.t("device.keyboard")
  return tr.t("device.mouse")
}

function percentText(device, tr, formatNumber) {
  return fill(tr.t("percent"), [number(percent(device), formatNumber)])
}

function tooltip(device, states, types, tr, formatNumber) {
  if (!device || !device.isPresent) return ""
  return fill(tr.t("tooltip"), [deviceName(device, types, tr), percentText(device, tr, formatNumber), stateLabel(device, states, tr)])
}

// The bar shows the battery glyph as its icon and, horizontally with
// showPercentage on, a label before it: the device glyph and the percent.
function barIcon(device, states) {
  return batteryIcon(device, states)
}

function showsLabel(layout) {
  return layout.showPercentage === true && !layout.vertical
}

function barLabel(device, layout, types, tr, formatNumber) {
  if (!device || !device.isPresent || !showsLabel(layout)) return ""
  return deviceIcon(device, types) + " " + percentText(device, tr, formatNumber)
}

// Fallback source: `solaar show` talks HID++ over hidraw, so it can read
// devices behind receivers the kernel driver doesn't bind (Logi Bolt), which
// UPower never sees. Returns objects shaped like UPower devices so every
// helper above works on them unchanged.
var SOLAAR_KINDS = { mouse: "Mouse", trackball: "Mouse", touchpad: "Touchpad", keyboard: "Keyboard", numpad: "Keyboard" }
// Solaar's names for coarse HID++ levels (BatteryLevelApproximation).
var SOLAAR_LEVELS = { empty: 0, critical: 5, low: 20, average: 50, good: 50, full: 90 }

function solaarState(status, states) {
  var s = String(status).replace(/^BatteryStatus\./, "").trim().toLowerCase().replace(/ /g, "_")
  if (s === "full") return states.FullyCharged
  if (s === "recharging" || s === "almost_full" || s === "slow_recharge") return states.Charging
  if (s === "discharging") return states.Discharging
  return states.Unknown || 0
}

function parseSolaar(text, types, states) {
  var devices = []
  var current = null
  var lines = String(text || "").split("\n")
  function flush() {
    if (current && current.type !== undefined && current.percentage !== undefined) devices.push(current)
    current = null
  }
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i]
    var m
    if ((m = /^ {2}\d+: (.+?)\s*$/.exec(line))) {
      flush()
      current = { isPresent: true, model: m[1] }
    } else if (!current) {
      continue
    } else if ((m = /^ {5}Kind\s*: (\S+)/.exec(line))) {
      var kind = SOLAAR_KINDS[m[1].toLowerCase()]
      if (kind) current.type = types[kind]
    } else if ((m = /^ {5}Battery: ([^,]+), (.+?)(?:, next level .*)?\.\s*$/.exec(line))) {
      var level = m[1].trim()
      var pct = /^(\d+)%/.exec(level)
      var value = pct ? Number(pct[1]) : SOLAAR_LEVELS[level.toLowerCase()]
      if (value === undefined) continue
      current.percentage = value / 100
      current.state = solaarState(m[2], states)
    }
  }
  flush()
  return devices
}

if (typeof module !== "undefined") {
  module.exports = {
    pickDevice: pickDevice,
    fraction: fraction,
    percent: percent,
    charging: charging,
    deviceIcon: deviceIcon,
    batteryIcon: batteryIcon,
    stateLabel: stateLabel,
    deviceName: deviceName,
    percentText: percentText,
    tooltip: tooltip,
    barIcon: barIcon,
    showsLabel: showsLabel,
    barLabel: barLabel,
    fill: fill,
    flag: flag,
    parseSolaar: parseSolaar
  }
}
