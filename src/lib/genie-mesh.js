const clamp = (value) => Math.min(1, Math.max(0, value));
const cubic = (a, b, c, d, t) => {
  const s = 1 - t;
  return s * s * s * a + 3 * s * s * t * b + 3 * s * t * t * c + t * t * t * d;
};

// Solve x(t), then evaluate y(t): CSS cubic-bezier(.25, 1, .5, 1).
export function genieEase(progress) {
  const x = clamp(progress);
  let low = 0;
  let high = 1;
  for (let i = 0; i < 16; i++) {
    const t = (low + high) / 2;
    if (cubic(0, 0.25, 0.5, 1, t) < x) low = t;
    else high = t;
  }
  return x === 0 || x === 1 ? x : cubic(0, 1, 1, 1, (low + high) / 2);
}

export function createGenieGrid(columns = 32, rows = 80) {
  const uv = new Float32Array((columns + 1) * (rows + 1) * 2);
  const positions = new Float32Array(uv.length);
  const indices = new Uint16Array(columns * rows * 6);
  for (let y = 0; y <= rows; y++) {
    for (let x = 0; x <= columns; x++) {
      const i = (y * (columns + 1) + x) * 2;
      uv[i] = x / columns;
      uv[i + 1] = y / rows;
    }
  }
  let i = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const a = y * (columns + 1) + x;
      const b = a + columns + 1;
      indices.set([a, b, a + 1, a + 1, b, b + 1], i);
      i += 6;
    }
  }
  return { uv, positions, indices };
}

// Each horizontal row follows its own cubic Bézier trajectory. The lower edge
// leads, pulling a continuous neck behind it; no clipping or uniform scaling.
export function deformGenieGrid(grid, rect, target, progress) {
  const p = clamp(progress);
  const center = rect.left + rect.width / 2;
  const bend = Math.max(60, Math.abs(target.y - rect.top) * 0.38);
  for (let i = 0; i < grid.uv.length; i += 2) {
    const u = grid.uv[i];
    const v = grid.uv[i + 1];
    const delay = 0.24 * (1 - v);
    const t = clamp((p - delay) / (1 - delay));
    const q = t * t * (3 - 2 * t);
    const startY = rect.top + v * rect.height;
    const endY = target.y + (v - 0.5) * target.height;
    const cx = cubic(center, center, target.x, target.x, q);
    const cy = cubic(startY, startY + bend, endY - bend * 0.35, endY, q);
    const width = rect.width * (1 - q) + target.width * q;
    grid.positions[i] = cx + (u - 0.5) * width;
    grid.positions[i + 1] = cy;
  }
  return grid.positions;
}
