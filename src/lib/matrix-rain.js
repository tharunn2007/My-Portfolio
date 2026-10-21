export const MATRIX_CHARACTERS = "012345789abcdefghijklmnopqrstuvwxyz{}[]<>/\\|:;+=*%$#@!?";

export function createRainStream(x, height, random = Math.random) {
  const depth = random();
  const size = Math.round(10 + depth * 12);
  return {
    x,
    y: random() * (height + 280) - 140,
    size,
    speed: 16 + depth * 43 + random() * 22,
    length: 5 + Math.floor(random() * 13),
    opacity: 0.15 + depth * 0.5,
    phase: random() * Math.PI * 2,
    period: 5500 + random() * 5000,
    mutationAt: 0,
    glitchAt: 2500 + random() * 9000,
    glitchUntil: 0,
    glyphs: Array.from(
      { length: 18 },
      () => MATRIX_CHARACTERS[Math.floor(random() * MATRIX_CHARACTERS.length)],
    ),
  };
}
