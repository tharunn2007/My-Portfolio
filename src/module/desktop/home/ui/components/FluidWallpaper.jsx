import { useEffect, useRef } from "react";

// Hold a decoded frame while the next player starts; dissolve without an end flash.
const FluidWallpaper = () => {
  const players = useRef([]);
  useEffect(() => {
    const videos = players.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame;
    let active = 0;
    let blending = false;
    let disposed = false;
    const end = 10;
    const blend = 0.6;
    const play = (video) => video?.play().catch(() => {});

    const tick = () => {
      if (disposed || document.hidden || motion.matches) return;
      const current = videos[active];
      const next = videos[1 - active];
      if (current && next && current.currentTime >= end - blend) {
        if (!blending) {
          next.currentTime = 0;
          play(next);
          blending = true;
        }
        // Use incoming playback progress so a slow decoder never reveals a blank frame.
        const amount = next.readyState >= 2 ? Math.min(1, next.currentTime / blend) : 0;
        if (current.currentTime >= end) current.pause();
        videos[1].style.opacity = String(active === 0 ? amount : 1 - amount);
        if (amount >= 1) {
          current.pause();
          current.currentTime = 0;
          active = 1 - active;
          blending = false;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      if (document.hidden || motion.matches) {
        videos.forEach((video) => video?.pause());
        return;
      }
      play(videos[active]);
      if (blending) play(videos[1 - active]);
      frame = requestAnimationFrame(tick);
    };
    resume();
    document.addEventListener("visibilitychange", resume);
    motion.addEventListener("change", resume);
    document.addEventListener("pointerdown", resume, { once: true });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      videos.forEach((video) => video?.pause());
      document.removeEventListener("visibilitychange", resume);
      motion.removeEventListener("change", resume);
      document.removeEventListener("pointerdown", resume);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ background: "#030b20 url('/wallpapers/neon-shadow-poster.png') center / cover" }}
    >
      {[0, 1].map((index) => (
        <video
          key={index}
          ref={(el) => {
            players.current[index] = el;
          }}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          poster="/wallpapers/neon-shadow-poster.png"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: index === 0 ? 1 : 0 }}
          src="/wallpapers/neon-shadow.mp4"
        />
      ))}
    </div>
  );
};
export default FluidWallpaper;
