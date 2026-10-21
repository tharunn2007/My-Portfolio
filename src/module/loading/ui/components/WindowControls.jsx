import useWindowsStore from "@store/window";
import { ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";

const WindowControls = ({ target, onBack }) => {
  const closeWindow = useWindowsStore((state) => state.closeWindow);
  const toggleMaximize = useWindowsStore((state) => state.toggleMaximize);
  const minimizeWindow = useWindowsStore((state) => state.minimizeWindow);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return (
      <button
        type="button"
        aria-label="Go back"
        onClick={(e) => {
          if (onBack) {
            onBack(e);
          } else {
            closeWindow(target);
          }
        }}
        style={{
          border: "none",
          background: "none",
          color: "#27272a",
          display: "flex",
          alignItems: "center",
          gap: 2,
          fontSize: 12,
          fontWeight: 500,
          padding: "8px 4px",
          cursor: "pointer",
          position: "relative",
          zIndex: 30,
          pointerEvents: "auto",
        }}
      >
        <ChevronLeft size={14} />
        <span>Back</span>
      </button>
    );
  }

  return (
    <div id="window-controls">
      <button
        type="button"
        className="close"
        aria-label="Close window"
        title="Close"
        onClick={() => closeWindow(target)}
      />
      <button
        type="button"
        className="minimize"
        aria-label="Minimize window"
        onClick={() => minimizeWindow(target)}
        title="Minimize"
      />
      <button
        type="button"
        className="maximize"
        aria-label="Toggle maximize window"
        onClick={() => toggleMaximize(target)}
        title="Zoom"
      />
    </div>
  );
};

export default WindowControls;
