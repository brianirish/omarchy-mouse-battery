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
    barText: barText
  }
}
