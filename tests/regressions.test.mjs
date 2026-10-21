import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  readStoredCollection,
  readStoredArrayText,
  writeStoredCollection,
  isStoredNote,
  sessionState,
} from "../src/lib/storage.js";
import { catGeometry, renderCatFrame } from "../src/lib/terminalBanner.js";

// Exercise hook actions through rerenders without mounting the full desktop.
function hookHarness(file, name, dependencies = {}) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8")
    .replace(/^import[\s\S]*?;\s*/gm, "")
    .replace("export default function", "function")
    .replace(/^export default \w+;\s*$/gm, "");
  const state = [];
  let cursor = 0;
  const useState = (initial) => {
    const index = cursor++;
    if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial;
    return [
      state[index],
      (next) => {
        state[index] = typeof next === "function" ? next(state[index]) : next;
      },
    ];
  };
  const args = { useState, useEffect: () => {}, ...dependencies };
  const hook = new Function(...Object.keys(args), `${source}\nreturn ${name};`)(
    ...Object.values(args),
  );
  const render = () => {
    cursor = 0;
    return hook();
  };
  let current = render();
  return {
    get current() {
      return current;
    },
    act(action, ...params) {
      current[action](...params);
      current = render();
    },
  };
}

for (const platform of ["desktop", "mobile"]) {
  const calculator = () =>
    hookHarness(
      `../src/module/${platform}/apps/calculator/hooks/useCalculator.js`,
      "useCalculator",
    );
  test(`${platform}: decimal arithmetic produces readable results`, () => {
    const app = calculator();
    app.act("inputDigit", 0);
    app.act("inputDot");
    app.act("inputDigit", 1);
    app.act("performOperation", "+");
    app.act("inputDigit", 0);
    app.act("inputDot");
    app.act("inputDigit", 2);
    app.act("performOperation", "=");
    assert.equal(app.current.displayValue, "0.3");
  });
  test(`${platform}: calculator recovers after division by zero`, () => {
    const app = calculator();
    app.act("inputDigit", 9);
    app.act("performOperation", "/");
    app.act("inputDigit", 0);
    app.act("performOperation", "=");
    assert.equal(app.current.displayValue, "Error");
    app.act("inputDigit", 7);
    app.act("performOperation", "+");
    app.act("inputDigit", 2);
    app.act("performOperation", "=");
    assert.equal(app.current.displayValue, "9");
  });
  const calendar = () =>
    hookHarness(`../src/module/${platform}/apps/calendar/hooks/useCalendar.js`, "useCalendar", {
      OWNER_FIRST_NAME: "Owner",
      readStoredArrayText: () => null,
      writeStoredCollection: () => true,
    });
  test(`${platform}: calendar starts on today's month and date`, () => {
    const app = calendar();
    const today = new Date();
    assert.equal(app.current.month, today.getMonth());
    assert.equal(app.current.year, today.getFullYear());
    assert.equal(app.current.selectedDate.getDate(), today.getDate());
  });
  test(`${platform}: calendar dates stay local, including leap day`, () => {
    const app = calendar();
    app.act("triggerAddEventOnDate", new Date(2024, 1, 29));
    assert.equal(app.current.eventDate, "2024-02-29");
    app.act("setEventTitle", "  Leap day  ");
    app.act("handleAddEvent", { preventDefault() {} });
    assert.ok(
      app.current.events.some((event) => event.date === "2024-02-29" && event.title === "Leap day"),
    );
  });
}

test("saved notes reject malformed JSON and invalid collections", () => {
  const fallback = [{ id: "default", title: "Welcome", body: "Hello" }];
  for (const raw of ["broken", "null", "{}", "[null]", '[{"id":"bad"}]']) {
    globalThis.window = { localStorage: { getItem: () => raw } };
    assert.equal(readStoredCollection("notes", fallback, isStoredNote), fallback);
  }
  window.localStorage.getItem = () => "[]";
  assert.deepEqual(readStoredCollection("notes", fallback, isStoredNote), []);
  delete globalThis.window;
});

test("blocked storage and quota failures keep the app usable", () => {
  const fail = () => {
    throw new Error("Storage denied");
  };
  globalThis.window = {
    localStorage: { getItem: fail, setItem: fail },
    sessionStorage: { getItem: fail, setItem: fail, removeItem: fail },
  };
  assert.equal(readStoredArrayText("calendar"), null);
  assert.equal(writeStoredCollection("notes", []), false);
  assert.equal(sessionState.getItem("login"), null);
  assert.doesNotThrow(() => sessionState.setItem("login", "true"));
  assert.doesNotThrow(() => sessionState.removeItem("login"));
  delete globalThis.window;
});

test("saved conversations reject invalid message lists", () => {
  globalThis.window = { localStorage: { getItem: () => '[{"id":"chat","messages":"invalid"}]' } };
  assert.equal(readStoredArrayText("macos_portfolio_messages"), null);
  window.localStorage.getItem = () => '[{"id":"chat","messages":[{"text":"Hello"}]}]';
  assert.ok(readStoredArrayText("macos_portfolio_messages"));
  delete globalThis.window;
});

test("animated cat fits narrow terminals and keeps its frame size", () => {
  for (const cols of [22, 30, 44, 80])
    for (const rows of [20, 40]) {
      const geometry = catGeometry(cols, rows);
      for (const phase of [0, 1, 3]) {
        const frame = renderCatFrame(phase, 0, geometry);
        assert.equal(frame.length, geometry.height);
        for (const line of frame)
          assert.equal([...line.replace(/\x1b\[[0-9;]*m/g, "")].length, geometry.width);
      }
    }
});
