import { useEffect, useRef } from "react";

export default function MatrixRain() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let drops = [],
      frame,
      previous = 0;
    let width, height;
    const resize = () => {
      width = innerWidth;
      height = innerHeight;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.fillStyle = "#020908";
      ctx.fillRect(0, 0, width, height);
      drops = Array.from({ length: Math.ceil(width / 20) }, () => ({
        y: Math.random() * height,
        speed: 1 + Math.random() * 2,
      }));
    };
    const draw = (time) => {
      if (document.hidden) return;
      if (time - previous > 70) {
        previous = time;
        ctx.fillStyle = "rgba(2,9,8,0.10)";
        ctx.fillRect(0, 0, width, height);
        ctx.font = "14px monospace";
        const pulse = 0.34 + Math.sin(time / 6500) * 0.045;
        drops.forEach((drop, i) => {
          ctx.fillStyle = `rgba(89,204,151,${pulse})`;
          const glitch = !motion.matches && Math.random() < 0.0008;
          ctx.fillText(
            String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96)),
            i * 20 + (glitch ? 2 : 0),
            drop.y,
          );
          drop.y += drop.speed * 5;
          if (drop.y > height + 40 && Math.random() > 0.98) {
            drop.y = -20;
            drop.speed = 1 + Math.random() * 2;
          }
        });
      }
      if (!motion.matches) frame = requestAnimationFrame(draw);
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      resize();
      draw(100);
    };
    const visibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) {
        previous = 0;
        draw(100);
      }
    };
    reset();
    document.addEventListener("visibilitychange", visibility);
    addEventListener("resize", reset);
    motion.addEventListener("change", reset);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      cancelAnimationFrame(frame);
      removeEventListener("resize", reset);
      motion.removeEventListener("change", reset);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ zIndex: -1, background: "#020908" }}
    />
  );
}
