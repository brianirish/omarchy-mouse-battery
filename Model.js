// Pure helpers for the mouse-battery widget. No QML imports, so the same
// file runs under Node for tests/model_test.js. Quickshell's UPower enums
// are passed in as plain objects (`types`, `states`) rather than imported.

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

function stateLabel(device, states) {
  if (!device || !device.isPresent) return ""
  switch (device.state) {
    case states.Charging: return "Charging"
    case states.Discharging: return "Discharging"
    case states.FullyCharged: return "Fully charged"
    case states.Empty: return "Empty"
    default: return "Unknown"
  }
}

function deviceName(device, types) {
  var model = device && device.model ? String(device.model).trim() : ""
  if (model) return model
  if (types && device && device.type === types.Keyboard) return "Wireless keyboard"
  return "Wireless mouse"
}

function tooltip(device, states, types) {
  if (!device || !device.isPresent) return ""
  return deviceName(device, types) + " · " + percent(device) + "% · " + stateLabel(device, states)
}

function barText(device, layout, types, states) {
  var icon = batteryIcon(device, states)
  if (!icon) return ""
  if (layout.showPercentage && !layout.vertical) {
    return deviceIcon(device, types) + " " + percent(device) + "% " + icon
  }
  return icon
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
    tooltip: tooltip,
    barText: barText,
    parseSolaar: parseSolaar
  }
}
