import { useEffect, useRef } from "react";
import { createRainStream, MATRIX_CHARACTERS } from "@lib/matrix-rain";

export default function MatrixRain({ active = true }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let streams = [],
      frame,
      previous = 0,
      lastPaint = 0,
      width = 0,
      height = 0;
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      streams = Array.from({ length: Math.ceil(width / 24) }, (_, i) =>
        createRainStream(i * 24 + Math.random() * 8, height),
      );
    };
    const paint = (time, elapsed = 0) => {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#020303";
      ctx.fillRect(0, 0, width, height);
      streams.forEach((stream) => {
        if (elapsed) {
          stream.y += stream.speed * elapsed;
          if (stream.y - stream.length * stream.size > height)
            Object.assign(stream, createRainStream(stream.x, height), { y: -stream.size });
          if (time > stream.mutationAt) {
            const index = Math.floor(Math.random() * stream.length);
            stream.glyphs[index] =
              MATRIX_CHARACTERS[Math.floor(Math.random() * MATRIX_CHARACTERS.length)];
            stream.mutationAt = time + 160 + Math.random() * 800;
          }
          if (time > stream.glitchAt) {
            stream.glitchUntil = time + 90;
            stream.glitchAt = time + 5000 + Math.random() * 11000;
          }
        }
        const glitch = elapsed > 0 && time < stream.glitchUntil;
        const pulse = motion.matches
          ? 0.9
          : 0.85 + Math.sin((time / stream.period) * Math.PI * 2 + stream.phase) * 0.15;
        ctx.font = `${stream.size}px "Roboto Mono", monospace`;
        for (let index = stream.length - 1; index >= 0; index--) {
          const y = stream.y - index * stream.size;
          if (y < -stream.size || y > height + stream.size) continue;
          const trail = Math.pow(1 - index / stream.length, 1.6);
          const alpha = stream.opacity * trail * pulse;
          ctx.fillStyle = `rgba(${index === 0 ? "235,245,242" : "176,191,186"},${alpha})`;
          ctx.shadowColor = "rgba(194,232,215,.25)";
          ctx.shadowBlur = index === 0 ? 3 : 0;
          ctx.fillText(stream.glyphs[index], stream.x + (glitch ? 2 : 0), y);
          if (glitch && index === 1) {
            ctx.fillStyle = `rgba(161,201,216,${alpha * 0.25})`;
            ctx.fillText(stream.glyphs[(index + 3) % stream.glyphs.length], stream.x - 2, y);
          }
        }
      });
      ctx.shadowBlur = 0;
      // A static, low-contrast scanline texture; never a full-screen flash.
      ctx.fillStyle = "rgba(0,0,0,.12)";
      for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 1);
    };
    const tick = (time) => {
      if (document.hidden || !active || motion.matches) return;
      if (time - lastPaint >= 33) {
        const elapsed = previous ? Math.min((time - previous) / 1000, 0.1) : 0;
        previous = time;
        lastPaint = time;
        paint(time, elapsed);
      }
      frame = requestAnimationFrame(tick);
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      lastPaint = 0;
      paint(performance.now());
      if (active && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick);
    };
    const reset = () => {
      resize();
      resume();
    };
    reset();
    window.addEventListener("resize", reset);
    document.addEventListener("visibilitychange", resume);
    motion.addEventListener("change", resume);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", reset);
      document.removeEventListener("visibilitychange", resume);
      motion.removeEventListener("change", resume);
    };
  }, [active]);
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ zIndex: -1, background: "#020303" }}
    />
  );
}
