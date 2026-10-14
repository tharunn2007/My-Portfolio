// ============================================================================
// TERMINAL BANNER — runtime-generated ascii art from the owner's first name.
// The block letters are rendered row by row (5 rows) so the banner always
// matches whatever name is set in src/constants/profile.js. No hardcoded
// ascii art lives in the components anymore.
// ============================================================================

import { OWNER_FIRST_NAME } from "@constants/env";

// 5x5 block font (filled = "█"). Only the letters a banner can contain.
const BLOCK_FONT = {
  A: [" ███ ", "█   █", "█████", "█   █", "█   █"],
  B: ["████ ", "█   █", "████ ", "█   █", "████ "],
  C: [" ████", "█    ", "█    ", "█    ", " ████"],
  D: ["████ ", "█   █", "█   █", "█   █", "████ "],
  E: ["█████", "█    ", "████ ", "█    ", "█████"],
  F: ["█████", "█    ", "████ ", "█    ", "█    "],
  G: [" ████", "█    ", "█  ██", "█   █", " ████"],
  H: ["█   █", "█   █", "█████", "█   █", "█   █"],
  I: ["█████", "  █  ", "  █  ", "  █  ", "█████"],
  J: [" ████", "    █", "    █", "█   █", " ███ "],
  K: ["█   █", "█  █ ", "███  ", "█  █ ", "█   █"],
  L: ["█    ", "█    ", "█    ", "█    ", "█████"],
  M: ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
  N: ["█   █", "██  █", "█ █ █", "█  ██", "█   █"],
  O: [" ███ ", "█   █", "█   █", "█   █", " ███ "],
  P: ["████ ", "█   █", "████ ", "█    ", "█    "],
  Q: [" ███ ", "█   █", "█ █ █", "█  █ ", " ██ █"],
  R: ["████ ", "█   █", "████ ", "█  █ ", "█   █"],
  S: [" ████", "█    ", " ███ ", "    █", "████ "],
  T: ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
  U: ["█   █", "█   █", "█   █", "█   █", " ███ "],
  V: ["█   █", "█   █", "█   █", " █ █ ", "  █  "],
  W: ["█   █", "█   █", "█ █ █", "██ ██", "█   █"],
  X: ["█   █", " █ █ ", "  █  ", " █ █ ", "█   █"],
  Y: ["█   █", " █ █ ", "  █  ", "  █  ", "  █  "],
  Z: ["█████", "   █ ", "  █  ", " █   ", "█████"],
  " ": ["     ", "     ", "     ", "     ", "     "],
};

const BLANK_GLYPH = BLOCK_FONT[" "];

export const buildBlockBanner = (name = OWNER_FIRST_NAME) => {
  const glyphs = String(name ?? "")
    .toUpperCase()
    .split("")
    .map((char) => BLOCK_FONT[char] ?? BLANK_GLYPH);

  const rows = ["", "", "", "", ""];
  glyphs.forEach((glyph, index) => {
    const gap = index > 0 ? " " : "";
    for (let row = 0; row < 5; row += 1) {
      rows[row] += gap + glyph[row];
    }
  });
  return rows;
};

// Width (in terminal columns) needed to display the banner comfortably.
export const bannerColumns = (name = OWNER_FIRST_NAME) =>
  (buildBlockBanner(name)[0]?.length ?? 0) + 4;
