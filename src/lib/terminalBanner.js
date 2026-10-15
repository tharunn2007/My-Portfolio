// ============================================================================
// TERMINAL BANNER — runtime-generated ascii art from the owner's first name.
// Style: "Claude Code CLI" — chunky solid block letters in bright orange with
// two offset hollow-outline copies stacked behind (down-right), like a printed
// poster. Everything is derived from src/constants/profile.js — no hardcoded
// ascii art in components.
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

// Claude Code palette — bright orange fill with rust-orange stacked outlines.
export const BANNER_COLORS = {
  fill: [242, 100, 44], // bright Claude orange
  outlineNear: [176, 62, 22], // mid rust
  outlineFar: [112, 38, 14], // deep rust
  accent: [242, 100, 44],
};

// Two outline layers offset down-right, like the reference poster art.
const LAYERS = [
  { dx: 4, dy: 2, color: BANNER_COLORS.outlineFar, mode: "outline" },
  { dx: 2, dy: 1, color: BANNER_COLORS.outlineNear, mode: "outline" },
  { dx: 0, dy: 0, color: BANNER_COLORS.fill, mode: "fill" },
];

const ansi = ([r, g, b], text) => `\x1b[38;2;${r};${g};${b}m${text}`;

const glyphMatrix = (name) =>
  String(name ?? "")
    .toUpperCase()
    .split("")
    .map((char) => BLOCK_FONT[char] ?? BLANK_GLYPH);

const isFilled = (glyphs, row, col) => {
  if (row < 0 || row > 4 || col < 0) return false;
  const letterIndex = Math.floor(col / 6);
  const inLetter = col % 6;
  if (inLetter === 5) return false; // inter-letter gap column
  const glyph = glyphs[letterIndex];
  if (!glyph) return false;
  return glyph[row][inLetter] === "█";
};

// A perimeter cell = filled but touching an empty neighbour (poster outline).
const isOutline = (glyphs, row, col) => {
  if (!isFilled(glyphs, row, col)) return false;
  return (
    !isFilled(glyphs, row - 1, col) ||
    !isFilled(glyphs, row + 1, col) ||
    !isFilled(glyphs, row, col - 1) ||
    !isFilled(glyphs, row, col + 1)
  );
};

/**
 * Build the layered banner as ANSI-colored rows.
 * Returns { rows, columns } — rows are terminal-ready escape sequences.
 */
export const buildClaudeBanner = (name = OWNER_FIRST_NAME) => {
  const glyphs = glyphMatrix(name);
  const textWidth = glyphs.length * 6 - 1; // 5 cols per letter + 1 gap
  const gridW = textWidth + LAYERS[0].dx; // extra room for far outline
  const gridH = 5 + LAYERS[0].dy;

  // cell: null | { ch, color } — painted back-to-front so the fill wins.
  const grid = Array.from({ length: gridH }, () => Array(gridW).fill(null));

  for (const layer of LAYERS) {
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < textWidth; col += 1) {
        const want =
          layer.mode === "fill"
            ? isFilled(glyphs, row, col)
            : isOutline(glyphs, row, col);
        if (!want) continue;
        const targetRow = row + layer.dy;
        const targetCol = col + layer.dx;
        if (targetRow >= 0 && targetRow < gridH && targetCol < gridW) {
          grid[targetRow][targetCol] = { ch: "█", color: layer.color };
        }
      }
    }
  }

  const rows = grid.map((line) => {
    let out = "";
    let currentColor = null;
    line.forEach((cell) => {
      const color = cell?.color ?? null;
      const ch = cell?.ch ?? " ";
      if (ch === " ") {
        out += "\x1b[0m ";
        currentColor = null;
        return;
      }
      if (color !== currentColor) {
        out += ansi(color, "");
        currentColor = color;
      }
      out += ch;
    });
    return out + "\x1b[0m";
  });

  return { rows, columns: gridW };
};

// Compact single-layer banner (fallback for narrow terminals).
export const buildBlockBanner = (name = OWNER_FIRST_NAME) => {
  const glyphs = glyphMatrix(name);
  const rows = ["", "", "", "", ""];
  glyphs.forEach((glyph, index) => {
    const gap = index > 0 ? " " : "";
    for (let row = 0; row < 5; row += 1) {
      rows[row] += gap + glyph[row];
    }
  });
  return rows;
};

// Width (in terminal columns) needed to display the layered banner.
export const bannerColumns = (name = OWNER_FIRST_NAME) =>
  buildClaudeBanner(name).columns + 4;

// The banner plus a Claude-style welcome pill, ready to print.
export const bannerWelcomeLines = (message = "Welcome to Tharunn's portfolio!") => {
  const inner = ` ✳ ${message} `;
  return [
    ansi(BANNER_COLORS.accent, `╭${"─".repeat(inner.length)}╮`),
    `${ansi(BANNER_COLORS.accent, "│")}\x1b[1m${ansi(BANNER_COLORS.accent, inner)}\x1b[0m${ansi(BANNER_COLORS.accent, "│")}`,
    ansi(BANNER_COLORS.accent, `╰${"─".repeat(inner.length)}╯`),
  ];
};
