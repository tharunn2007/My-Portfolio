import test from "node:test";
import assert from "node:assert/strict";
import { getRunningDockApps } from "../src/lib/dock-state.js";

test("Dock follows launch, minimize, restore, and quit for unpinned apps", () => {
  const windows = { calculator: { isOpen: false }, finder: { isOpen: false } };
  const ids = () => getRunningDockApps(windows, ["finder"]).map((app) => app.id);
  assert.deepEqual(ids(), []);
  windows.calculator.isOpen = true;
  assert.deepEqual(ids(), ["calculator"]);
  windows.calculator.isMinimized = true;
  assert.deepEqual(ids(), ["calculator"]);
  windows.calculator.isMinimized = false;
  assert.deepEqual(ids(), ["calculator"]);
  windows.calculator.isOpen = false;
  assert.deepEqual(ids(), []);
});

test("Dock orders running apps without duplicate Finder aliases and supports previews", () => {
  const windows = { finder: { isOpen: true }, txtfile: { isOpen: true }, terminal: { isOpen: true } };
  const apps = getRunningDockApps(windows, ["finder", "folder", "trash", "finder"]);
  assert.deepEqual(apps.map((app) => app.id), ["finder", "txtfile", "terminal"]);
  assert.ok(apps.every((app) => app.canOpen && app.icon));
});
