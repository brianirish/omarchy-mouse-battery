import QtQuick
import Quickshell
import Quickshell.Services.UPower
import qs.Commons
import qs.Ui
import "Model.js" as Model

// Battery level of the first wireless mouse/keyboard UPower knows about.
// The kernel hid-logitech-hidpp driver exposes Unifying-receiver and
// Bluetooth HID++ devices as power_supply nodes, and UPower pushes changes
// over D-Bus, so nothing here polls the device. Many Logitech mice only
// report coarse levels (critical/low/normal/full), which UPower maps to
// fixed percentages — expect the number to step, not tick.
BarWidget {
  id: root
  moduleName: "brianirish.mouse-battery"

  readonly property bool showPercentage: setting("showPercentage", true) === true
  readonly property string clickCommand: String(setting("onClick", "openlogi-desktop") || "")

  function types() {
    return {
      Mouse: UPowerDeviceType.Mouse,
      Keyboard: UPowerDeviceType.Keyboard,
      Touchpad: UPowerDeviceType.Touchpad,
      GamingInput: UPowerDeviceType.GamingInput
    }
  }

  function states() {
    return {
      Charging: UPowerDeviceState.Charging,
      Discharging: UPowerDeviceState.Discharging,
      FullyCharged: UPowerDeviceState.FullyCharged,
      Empty: UPowerDeviceState.Empty
    }
  }

  readonly property var device: Model.pickDevice(UPower.devices.values, types())
  readonly property bool present: device !== null

  // QML tracks the device.percentage/state reads inside Model.*, so these
  // re-evaluate when UPower reports a change.
  readonly property string barText: present
    ? Model.barText(device, { showPercentage: showPercentage, vertical: vertical }, types(), states())
    : ""
  readonly property string tooltip: present ? Model.tooltip(device, states(), types()) : ""

  function activate() {
    if (root.bar && root.clickCommand !== "") root.bar.run(root.clickCommand)
  }

  visible: present
  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight

  BarIconButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: root.barText
    slotSize: Style.bar.iconSlot * (root.showPercentage && !vertical ? 3 : 1)
    tooltipText: root.tooltip
    onPressed: root.activate()
  }
}
