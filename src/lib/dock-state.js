import { dockApps, DEFAULT_DOCK_IDS } from "../constants/dock.js";

// Default pins stay visible; other apps follow their window lifecycle.
export function getRunningDockApps(windows, preferredIds = []) {
  const pinned = new Set(DEFAULT_DOCK_IDS);
  const ids = [...new Set([...preferredIds, ...DEFAULT_DOCK_IDS, ...Object.keys(windows)])];
  // Keep Trash at the trailing edge, after temporary running applications.
  const visibleIds = ids.filter((id) => id !== "trash" && (pinned.has(id) || windows[id]?.isOpen));
  visibleIds.push("trash");
  return visibleIds.map((id) =>
    dockApps.find((app) => app.id === id) ?? {
      id,
      name: { txtfile: "Text Preview", imgfile: "Image Preview", resume: "Resume", chrome: "Chrome" }[id] ?? id,
      icon: id === "imgfile" ? "photos.webp" : "finder.webp",
      canOpen: true,
    },
  );
}
