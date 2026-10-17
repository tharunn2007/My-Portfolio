// ============================================================================
// TERMINAL BANNER — "donut" — a scaled-down tribute to Andy Sloane's (a1k0n)
// famous donut.c: a spinning 3D ASCII torus rendered with a z-buffer and the
// classic luminance ramp ".,-~:;=!*#$@".
//
//   Original: https://www.a1k0n.net/2011/07/20/donut-math.html
//   This port: dynamic size (fits terminal cols), ANSI gray shading, plus the
//   welcome pill. The flappy game still uses BANNER_COLORS.fill (orange bird).
// ============================================================================

// Classic donut.c luminance ramp — dim "." to bright "@".
export const DONUT_CHARS = ".,-~:;=!*#$@";

// Gray ramp matching the characters (zinc → white), used for ANSI shading.
const GRAY_RAMP = [
  "63", "63", "82", "82", "105", "113", "133", "148",
  "161", "177", "196", "212", "228", "244", "250", "250",
];

// Shared palette (flappy keeps the orange accent).
export const BANNER_COLORS = {
  fill: [242, 100, 44], // bright Claude orange (flappy bird + HUD)
  accent: [57, 211, 83], // GitHub green (welcome pill, heatmap coherence)
};

const ansi = ([r, g, b], text) => `\x1b[38;2;${r};${g};${b}m${text}`;

const gray = (index, text) => `\x1b[38;2;${GRAY_RAMP[index]};${GRAY_RAMP[index]};${GRAY_RAMP[index]}m${text}`;

// Torus / camera constants from donut.c.
const R1 = 1; // tube radius
const R2 = 2; // torus radius
const K2 = 5; // distance of torus from viewer

/**
 * Pick donut geometry for a terminal width — a scaled-down donut.c
 * (original: 80x22 with K1 = 30). Widths < 26 get the tiny ring.
 */
export const donutGeometry = (cols = 80) => {
  if (cols >= 46) {
    const width = 44;
    return { width, height: 12, k1: width * 0.375, k1y: (width * 0.375) / 2 };
  }
  if (cols >= 30) {
    const width = 30;
    return { width, height: 9, k1: width * 0.375, k1y: (width * 0.375) / 2 };
  }
  const width = 22;
  return { width, height: 7, k1: width * 0.375, k1y: (width * 0.375) / 2 };
};

/**
 * Render one frame of the spinning donut (donut.c algorithm).
 * A = rotation around the x-axis, B = rotation around the z-axis.
 * Returns an array of ANSI line strings, height rows tall.
 */
export const renderDonutFrame = (A, B, geometry = donutGeometry()) => {
  const { width, height, k1, k1y } = geometry;
  const cosA = Math.cos(A);
  const sinA = Math.sin(A);
  const cosB = Math.cos(B);
  const sinB = Math.sin(B);

  // z-buffer + luminance buffer (donut.c approach, scaled down).
  const zBuffer = Array.from({ length: height }, () => Array(width).fill(0));
  const lumBuffer = Array.from({ length: height }, () => Array(width).fill(-1));

  const cx = width / 2;
  const cy = height / 2;

  for (let theta = 0; theta < 6.28; theta += 0.08) {
    const costheta = Math.cos(theta);
    const sintheta = Math.sin(theta);

    for (let phi = 0; phi < 6.28; phi += 0.03) {
      const cosphi = Math.cos(phi);
      const sinphi = Math.sin(phi);

      // The circle in the x/y plane before rotation.
      const circlex = R2 + R1 * costheta;
      const circley = R1 * sintheta;

      // 3D position after rotations (donut.c math).
      const x = circlex * (cosB * cosphi + sinA * sinB * sinphi) - circley * sinA * cosB;
      const y = circlex * (sinB * cosphi - sinA * cosB * sinphi) + circley * cosA * sinB;
      const z = K2 + cosA * circlex * sinphi + circley * sinA;
      const ooz = 1 / z;

      const xp = Math.floor(cx + k1 * ooz * x);
      const yp = Math.floor(cy - k1y * ooz * y);

      // Luminance — donut.c's surface-normal dot product with the light.
      const L =
        cosphi * costheta * sinB -
        cosA * costheta * sinphi -
        sinA * sintheta +
        cosB * (cosA * sintheta - costheta * sinA * sinphi);

      if (yp >= 0 && yp < height && xp >= 0 && xp < width && ooz > zBuffer[yp][xp]) {
        zBuffer[yp][xp] = ooz;
        // Map L in [-sqrt(2), sqrt(2)] onto the 12-char ramp.
        const lumIndex = Math.floor(((L + 1.4143) / 2.8286) * DONUT_CHARS.length);
        lumBuffer[yp][xp] = Math.max(0, Math.min(DONUT_CHARS.length - 1, lumIndex));
      }
    }
  }

  // Emit rows, batching runs of the same shade into single ANSI sequences.
  return lumBuffer.map((row) => {
    let line = "";
    let currentShade = null;
    row.forEach((lumIndex) => {
      if (lumIndex < 0) {
        if (currentShade !== "") {
          line += "\x1b[0m";
          currentShade = "";
        }
        line += " ";
        return;
      }
      if (lumIndex !== currentShade) {
        line += gray(lumIndex, "");
        currentShade = lumIndex;
      }
      line += DONUT_CHARS[lumIndex];
    });
    return line + "\x1b[0m";
  });
};

// The welcome pill — GitHub-green accent to match the contribution heatmap.
export const bannerWelcomeLines = (message = "Welcome to Tharunn's portfolio!") => {
  const inner = ` ✳ ${message} `;
  return [
    ansi(BANNER_COLORS.accent, `╭${"─".repeat(inner.length)}╮`),
    `${ansi(BANNER_COLORS.accent, "│")}\x1b[1m${ansi(BANNER_COLORS.accent, inner)}\x1b[0m${ansi(BANNER_COLORS.accent, "│")}`,
    ansi(BANNER_COLORS.accent, `╰${"─".repeat(inner.length)}╯`),
  ];
};
