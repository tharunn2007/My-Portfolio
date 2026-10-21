import test from "node:test";
import assert from "node:assert/strict";
import { getRunningDockApps } from "../src/lib/dock-state.js";
import { DEFAULT_DOCK_IDS } from "../src/constants/dock.js";

const idsFor = (windows, order = DEFAULT_DOCK_IDS) => getRunningDockApps(windows, order).map((app) => app.id);

test("default Dock applications remain visible before launch and after quit", () => {
  assert.deepEqual(idsFor({}), DEFAULT_DOCK_IDS);
  const windows = { finder: { isOpen: true }, safari: { isOpen: true, isMinimized: true } };
  assert.deepEqual(idsFor(windows), DEFAULT_DOCK_IDS);
  windows.finder.isOpen = false;
  windows.safari.isOpen = false;
  assert.deepEqual(idsFor(windows), DEFAULT_DOCK_IDS);
});

test("only unpinned apps appear on launch, remain minimized, and disappear on quit", () => {
  const windows = { calculator: { isOpen: false } };
  assert.deepEqual(idsFor(windows), DEFAULT_DOCK_IDS);
  windows.calculator.isOpen = true;
  const running = [...DEFAULT_DOCK_IDS.slice(0, -1), "calculator", "trash"];
  assert.deepEqual(idsFor(windows), running);
  windows.calculator.isMinimized = true;
  assert.deepEqual(idsFor(windows), running);
  windows.calculator.isMinimized = false;
  assert.deepEqual(idsFor(windows), running);
  windows.calculator.isOpen = false;
  assert.deepEqual(idsFor(windows), DEFAULT_DOCK_IDS);
});

test("temporary apps in saved ordering do not become pins; preview apps are supported", () => {
  const order = [...DEFAULT_DOCK_IDS, "calculator", "calculator", "txtfile"];
  const windows = { calculator: { isOpen: false }, txtfile: { isOpen: true } };
  const apps = getRunningDockApps(windows, order);
  assert.deepEqual(apps.map((app) => app.id), [...DEFAULT_DOCK_IDS.slice(0, -1), "txtfile", "trash"]);
  assert.ok(apps.every((app) => app.canOpen && app.icon));
});

test("pinned Dock apps retain their reordered positions", () => {
  const order = ["terminal", "finder", "launchpad", "safari", "contact", "trash"];
  assert.deepEqual(idsFor({}, order), order);
});
