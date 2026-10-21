const targets = new Map();

export function rememberDockTarget(windowKey) {
  if (typeof document === "undefined") return null;
  const icon = document.querySelector(`[data-app-id="${windowKey}"] .dock-icon`);
  if (!icon) return null;
  const rect = icon.getBoundingClientRect();
  const target = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2,
    width: rect.width, height: rect.height };
  targets.set(windowKey, target);
  return target;
}

export function getDockTarget(windowKey, closing = false) {
  return (closing ? targets.get(windowKey) : rememberDockTarget(windowKey)) ??
    targets.get(windowKey) ?? { x: window.innerWidth / 2, y: window.innerHeight - 36, width: 40, height: 40 };
}
