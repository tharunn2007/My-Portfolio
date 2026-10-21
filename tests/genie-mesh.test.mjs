import test from "node:test";
import assert from "node:assert/strict";
import { createGenieGrid, deformGenieGrid, genieEase } from "../src/lib/genie-mesh.js";

const rect = { left: 100, top: 80, width: 800, height: 500 };
const target = { x: 900, y: 850, width: 48, height: 48 };
const near = (a, b) => assert.ok(Math.abs(a - b) < 0.001, `${a} != ${b}`);

test("mesh starts at the original window and ends exactly at the Dock icon", () => {
  const grid = createGenieGrid();
  const allocation = grid.positions;
  for (const p of [0, 1]) {
    deformGenieGrid(grid, rect, target, p);
    assert.equal(grid.positions, allocation);
    for (let i = 0; i < grid.uv.length; i += 2) {
      const u = grid.uv[i], v = grid.uv[i + 1];
      near(grid.positions[i], p === 0 ? rect.left + u * rect.width : target.x + (u - 0.5) * target.width);
      near(grid.positions[i + 1], p === 0 ? rect.top + v * rect.height : target.y + (v - 0.5) * target.height);
    }
  }
});

test("lower rows compress before upper rows without mesh folds", () => {
  const grid = createGenieGrid();
  deformGenieGrid(grid, rect, target, 0.4);
  const width = (row) => grid.positions[(row * 33 + 32) * 2] - grid.positions[row * 33 * 2];
  assert.ok(width(80) < width(0));
  for (let frame = 0; frame <= 120; frame++) {
    deformGenieGrid(grid, rect, target, frame / 120);
    for (let row = 1; row <= 80; row++) {
      assert.ok(grid.positions[row * 33 * 2 + 1] >= grid.positions[(row - 1) * 33 * 2 + 1]);
    }
    assert.ok(grid.positions.every(Number.isFinite));
  }
});

test("cubic easing has exact endpoints and is monotonic at 60/120 Hz", () => {
  assert.equal(genieEase(0), 0);
  assert.equal(genieEase(1), 1);
  assert.ok(genieEase(0.5) > 0.9);
  for (const hz of [60, 120]) {
    let previous = 0;
    for (let frame = 0; frame <= hz; frame++) {
      const value = genieEase(frame / hz);
      assert.ok(value >= previous && value <= 1);
      previous = value;
    }
  }
});
