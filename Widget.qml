import QtQuick
import Quickshell
import Quickshell.Io
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
//
// Logi Bolt receivers have no kernel driver, so UPower never sees their
// devices. Only while UPower has nothing, the widget falls back to polling
// `solaar show` (if Solaar is installed) every `solaarInterval` seconds.
BarWidget {
  id: root
  moduleName: "brianirish.mouse-battery"

  readonly property bool showPercentage: setting("showPercentage", true) === true
  readonly property string clickCommand: String(setting("onClick", "openlogi-desktop") || "")
  readonly property int solaarInterval: Math.max(0, Number(setting("solaarInterval", 300)) || 0)

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
      Empty: UPowerDeviceState.Empty,
      Unknown: UPowerDeviceState.Unknown
    }
  }

  readonly property var upowerDevice: Model.pickDevice(UPower.devices.values, types())
  property var solaarDevices: []
  readonly property bool useSolaar: upowerDevice === null && solaarInterval > 0
  readonly property var device: upowerDevice !== null
    ? upowerDevice
    : (useSolaar ? Model.pickDevice(solaarDevices, types()) : null)
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

  Timer {
    interval: root.solaarInterval * 1000
    repeat: true
    running: root.useSolaar
    triggeredOnStart: true
    onTriggered: if (!solaarProc.running) solaarProc.running = true
  }

  // A sleeping device can stall HID++ requests; never let a poll hang.
  Timer {
    interval: 30000
    running: solaarProc.running
    onTriggered: solaarProc.running = false
  }

  Process {
    id: solaarProc
    command: ["solaar", "show"]
    stdout: StdioCollector { id: solaarOut; waitForEnd: true }
    onExited: function(code) {
      root.solaarDevices = code === 0 ? Model.parseSolaar(solaarOut.text, root.types(), root.states()) : []
    }
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
