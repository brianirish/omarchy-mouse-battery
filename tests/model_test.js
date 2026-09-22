// Unit tests for Model.js (the widget's pure helpers). Run with: node tests/model_test.js
// Model.js is a QML JavaScript library; it exports through `module.exports`
// only when loaded by Node, so it can be required directly here.
"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");

const Model = require(path.join(__dirname, "..", "Model.js"));

// Mirrors Quickshell's UPowerDeviceType / UPowerDeviceState enums by value.
const Type = { Unknown: 0, LinePower: 1, Battery: 2, Mouse: 5, Keyboard: 6, Tablet: 10, GamingInput: 12, Touchpad: 14 };
const State = { Unknown: 0, Charging: 1, Discharging: 2, Empty: 3, FullyCharged: 4, PendingCharge: 5 };

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("ok   " + name); }
  catch (e) { console.log("FAIL " + name + "\n     " + (e && e.message)); process.exitCode = 1; }
}

const mouse = { isPresent: true, type: Type.Mouse, percentage: 0.55, state: State.Discharging, model: "Logitech MX Master 2S" };
const laptop = { isPresent: true, type: Type.Battery, percentage: 0.8, state: State.Discharging, model: "BAT0" };
const keyboard = { isPresent: true, type: Type.Keyboard, percentage: 0.2, state: State.Discharging, model: "MX Keys" };

// pickDevice
test("pickDevice skips the laptop battery and finds the mouse", () => {
  assert.equal(Model.pickDevice([laptop, mouse], Type), mouse);
});
test("pickDevice returns the first matching device in list order", () => {
  assert.equal(Model.pickDevice([keyboard, mouse], Type), keyboard);
});
test("pickDevice ignores devices that are not present", () => {
  assert.equal(Model.pickDevice([{ ...mouse, isPresent: false }], Type), null);
});
test("pickDevice accepts touchpads and gaming input", () => {
  assert.equal(Model.pickDevice([{ ...mouse, type: Type.Touchpad }], Type).type, Type.Touchpad);
  assert.equal(Model.pickDevice([{ ...mouse, type: Type.GamingInput }], Type).type, Type.GamingInput);
});
test("pickDevice tolerates null entries and an empty or missing list", () => {
  assert.equal(Model.pickDevice([null, undefined], Type), null);
  assert.equal(Model.pickDevice([], Type), null);
  assert.equal(Model.pickDevice(undefined, Type), null);
});

// fraction / percent
test("fraction clamps to 0..1 and is 0 without a device", () => {
  assert.equal(Model.fraction(mouse), 0.55);
  assert.equal(Model.fraction({ ...mouse, percentage: 1.4 }), 1);
  assert.equal(Model.fraction({ ...mouse, percentage: -0.1 }), 0);
  assert.equal(Model.fraction(null), 0);
});
test("percent rounds to a whole number", () => {
  assert.equal(Model.percent(mouse), 55);
  assert.equal(Model.percent({ ...mouse, percentage: 0.049 }), 5);
});

// charging
test("charging is true while charging or fully charged, false otherwise", () => {
  assert.equal(Model.charging({ ...mouse, state: State.Charging }, State), true);
  assert.equal(Model.charging({ ...mouse, state: State.FullyCharged }, State), true);
  assert.equal(Model.charging(mouse, State), false);
  assert.equal(Model.charging(null, State), false);
});

// deviceIcon
test("deviceIcon picks a glyph by device type", () => {
  assert.equal(Model.deviceIcon(mouse, Type), "󰍽");
  assert.equal(Model.deviceIcon(keyboard, Type), "󰌌");
  assert.equal(Model.deviceIcon({ ...mouse, type: Type.GamingInput }, Type), "󰊗");
  assert.equal(Model.deviceIcon({ ...mouse, type: Type.Touchpad }, Type), "󰍽");
  assert.equal(Model.deviceIcon(null, Type), "");
});

// batteryIcon
test("batteryIcon steps through ten levels while discharging", () => {
  assert.equal(Model.batteryIcon({ ...mouse, percentage: 0.0 }, State), "󰁺");
  assert.equal(Model.batteryIcon({ ...mouse, percentage: 0.55 }, State), "󰁿");
  assert.equal(Model.batteryIcon({ ...mouse, percentage: 0.99 }, State), "󰁹");
  assert.equal(Model.batteryIcon({ ...mouse, percentage: 1.0 }, State), "󰁹");
});
test("batteryIcon uses the charging set while charging", () => {
  assert.equal(Model.batteryIcon({ ...mouse, state: State.Charging, percentage: 0.55 }, State), "󰂉");
});
test("batteryIcon shows the full-charge glyph when fully charged", () => {
  assert.equal(Model.batteryIcon({ ...mouse, state: State.FullyCharged, percentage: 0.9 }, State), "󰂅");
});
test("batteryIcon is empty without a device", () => {
  assert.equal(Model.batteryIcon(null, State), "");
});

// stateLabel / tooltip
test("stateLabel maps every known state and falls back to Unknown", () => {
  assert.equal(Model.stateLabel({ ...mouse, state: State.Charging }, State), "Charging");
  assert.equal(Model.stateLabel(mouse, State), "Discharging");
  assert.equal(Model.stateLabel({ ...mouse, state: State.FullyCharged }, State), "Fully charged");
  assert.equal(Model.stateLabel({ ...mouse, state: State.Empty }, State), "Empty");
  assert.equal(Model.stateLabel({ ...mouse, state: State.PendingCharge }, State), "Unknown");
  assert.equal(Model.stateLabel(null, State), "");
});
test("tooltip joins model, percent and state", () => {
  assert.equal(Model.tooltip(mouse, State), "Logitech MX Master 2S · 55% · Discharging");
});
test("tooltip falls back to a generic name when the model is blank", () => {
  assert.equal(Model.tooltip({ ...mouse, model: "" }, State), "Wireless mouse · 55% · Discharging");
  assert.equal(Model.tooltip({ ...keyboard, model: "" }, State, Type), "Wireless keyboard · 20% · Discharging");
});
test("tooltip is empty without a device", () => {
  assert.equal(Model.tooltip(null, State), "");
});

// barText
test("barText shows device glyph, percent and battery glyph horizontally", () => {
  assert.equal(Model.barText(mouse, { showPercentage: true, vertical: false }, Type, State), "󰍽 55% 󰁿");
});
test("barText falls back to the battery glyph alone when vertical or percent is off", () => {
  assert.equal(Model.barText(mouse, { showPercentage: true, vertical: true }, Type, State), "󰁿");
  assert.equal(Model.barText(mouse, { showPercentage: false, vertical: false }, Type, State), "󰁿");
});

// parseSolaar — fallback for receivers the kernel driver doesn't bind (Bolt)
const fs = require("node:fs");
const boltShow = fs.readFileSync(path.join(__dirname, "fixtures", "solaar-show-bolt.txt"), "utf8");

test("parseSolaar reads a Bolt-paired mouse from real `solaar show` output", () => {
  const devices = Model.parseSolaar(boltShow, Type, State);
  assert.equal(devices.length, 1);
  assert.deepEqual(devices[0], {
    isPresent: true, type: Type.Mouse, percentage: 1, state: State.Discharging,
    model: "LIFT VERTICAL ERGONOMIC MOUSE"
  });
});
test("parseSolaar maps kinds, coarse levels and charge states", () => {
  const text = [
    "Bolt Receiver",
    "  Device path  : /dev/hidraw5",
    "",
    "  1: MX Keys",
    "     Kind         : keyboard",
    "     Battery: 20%, BatteryStatus.RECHARGING.",
    "  2: MX Master 2S",
    "     Kind         : mouse",
    "     Battery: good, BatteryStatus.DISCHARGING, next level 20%.",
    "  3: MX Ergo",
    "     Kind         : trackball",
    "     Battery: 90% 4012mV , full.",
  ].join("\n");
  const [keys, master, ergo] = Model.parseSolaar(text, Type, State);
  assert.deepEqual([keys.type, keys.percentage, keys.state], [Type.Keyboard, 0.2, State.Charging]);
  assert.deepEqual([master.type, master.percentage, master.state], [Type.Mouse, 0.5, State.Discharging]);
  assert.deepEqual([ergo.type, ergo.percentage, ergo.state], [Type.Mouse, 0.9, State.FullyCharged]);
});
test("parseSolaar skips devices without a readable battery or of other kinds", () => {
  const text = [
    "  1: Offline Mouse",
    "     Kind         : mouse",
    "     Battery status unavailable.",
    "  2: G435 Headset",
    "     Kind         : headset",
    "     Battery: 80%, BatteryStatus.DISCHARGING.",
    "  3: Asleep Mouse",
    "     Kind         : mouse",
    "     Battery: N/A, None.",
  ].join("\n");
  assert.deepEqual(Model.parseSolaar(text, Type, State), []);
});
test("parseSolaar ignores the per-feature battery line and tolerates junk", () => {
  const text = "  1: M720\n     Kind         : mouse\n            Battery: 10%, discharging.\n     Battery: 55%, discharging.\n";
  assert.equal(Model.parseSolaar(text, Type, State)[0].percentage, 0.55);
  assert.deepEqual(Model.parseSolaar("", Type, State), []);
  assert.deepEqual(Model.parseSolaar(undefined, Type, State), []);
});

console.log(process.exitCode ? "some tests failed" : passed + " tests passed");
