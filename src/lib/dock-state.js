import { dockApps } from "../constants/dock.js";

// Derive visibility from window state so launch, minimize, and quit stay atomic.
export function getRunningDockApps(windows, preferredIds = []) {
  const ids = [...new Set([...preferredIds, ...Object.keys(windows)])];
  return ids.filter((id) => windows[id]?.isOpen).map((id) =>
    dockApps.find((app) => app.id === id) ?? {
      id,
      name: { txtfile: "Text Preview", imgfile: "Image Preview", resume: "Resume", chrome: "Chrome" }[id] ?? id,
      icon: id === "imgfile" ? "photos.webp" : "finder.webp",
      canOpen: true,
    },
  );
}
