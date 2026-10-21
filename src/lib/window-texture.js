const assets = new Map();
const windows = new WeakMap();

// Copy rendered properties, not hundreds of defaults, transitions, custom
// variables, and vendor duplicates for every node in the application.
const properties = [
  "display", "position", "top", "right", "bottom", "left", "z-index", "box-sizing",
  "width", "height", "min-width", "min-height", "max-width", "max-height",
  "margin", "padding", "overflow", "overflow-x", "overflow-y", "opacity", "visibility",
  "background-color", "background-image", "background-size", "background-position", "background-repeat",
  "border-top", "border-right", "border-bottom", "border-left", "border-radius", "box-shadow",
  "color", "font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing",
  "text-align", "text-transform", "text-decoration", "text-overflow", "white-space", "word-break",
  "flex-direction", "flex-wrap", "flex-grow", "flex-shrink", "flex-basis", "align-items", "align-self",
  "justify-content", "order", "gap", "grid-template-columns", "grid-template-rows", "grid-column", "grid-row",
  "object-fit", "object-position", "vertical-align", "transform", "transform-origin", "filter",
  "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "aspect-ratio", "list-style",
];
const yieldTask = () => new Promise((resolve) => setTimeout(resolve, 0));

async function embeddedAsset(url) {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  const absolute = new URL(url, document.baseURI).href;
  if (!assets.has(absolute)) {
    assets.set(absolute, fetch(absolute, { signal: AbortSignal.timeout(1000) })
      .then((response) => {
        if (!response.ok) throw new Error("Asset unavailable");
        return response.blob();
      }).then((blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })).catch(() => ""));
    if (assets.size > 64) assets.delete(assets.keys().next().value);
  }
  return assets.get(absolute);
}

function getRecord(element) {
  let record = windows.get(element);
  if (record) return record;
  record = { version: 0, texture: null, captured: -1, width: 0, height: 0 };
  record.update = (mutations) => {
    // Root opacity/transform belongs to the animation, not its captured content.
    if (mutations.some((entry) => {
      if (entry.target !== element) return true;
      if (entry.type === "childList") {
        const nodes = [...entry.addedNodes, ...entry.removedNodes];
        if (nodes.every((node) => node instanceof Element && node.classList.contains("resize-handle"))) return false;
      }
      if (["style", "inert"].includes(entry.attributeName)) return false;
      if (entry.attributeName === "class") {
        const normalize = (value) => (value ?? "").replace(/window-(visible|hidden)/g, "").trim();
        return normalize(entry.oldValue) !== normalize(element.className);
      }
      return true;
    })) {
      record.version++;
      record.texture = null;
    }
  };
  record.observer = new MutationObserver(record.update);
  record.observer.observe(element, { attributes: true, attributeOldValue: true, childList: true, characterData: true, subtree: true });
  windows.set(element, record);
  return record;
}

export function releaseWindowTexture(element) {
  windows.get(element)?.observer.disconnect();
  windows.delete(element);
}

export async function snapshotWindow(element, rect, signal) {
  signal?.throwIfAborted();
  const record = getRecord(element);
  record.update(record.observer.takeRecords());
  if (record.texture && record.captured === record.version &&
      record.width === rect.width && record.height === rect.height) return record.texture;
  const version = record.version;
  const clone = element.cloneNode(true);
  const originals = [element, ...element.querySelectorAll("*")];
  const copies = [clone, ...clone.querySelectorAll("*")];
  const pending = [];
  let budgetStart = performance.now();
  // All writes target a detached clone. Yield after a small batch so capture
  // cannot monopolize the main thread or delay input for a large app window.
  for (let i = 0; i < originals.length; i++) {
    signal?.throwIfAborted();
    const original = originals[i];
    const copy = copies[i];
    if (!(copy instanceof HTMLElement || copy instanceof SVGElement)) continue;
    const computed = getComputedStyle(original);
    let css = "";
    for (const property of properties) {
      const value = computed.getPropertyValue(property);
      if (value) css += `${property}:${value};`;
    }
    copy.style.cssText = css;
    copy.removeAttribute("inert");
    if (original instanceof HTMLImageElement) {
      copy.removeAttribute("srcset");
      copy.removeAttribute("loading");
      pending.push(embeddedAsset(original.currentSrc || original.src).then((src) => {
        if (src) copy.setAttribute("src", src);
        else copy.removeAttribute("src");
      }));
    }
    if (original instanceof HTMLInputElement) copy.setAttribute("value", original.value);
    if (original instanceof HTMLTextAreaElement) copy.textContent = original.value;
    if (original instanceof HTMLCanvasElement) {
      const image = document.createElement("img");
      image.style.cssText = copy.style.cssText;
      try { image.src = original.toDataURL(); } catch { /* Protected canvases remain blank. */ }
      copy.replaceWith(image);
    }
    if (original instanceof HTMLIFrameElement || original instanceof HTMLVideoElement) {
      const placeholder = document.createElement("div");
      placeholder.style.cssText = copy.style.cssText;
      copy.replaceWith(placeholder);
    }
    const background = computed.backgroundImage;
    if (background.includes("url(")) {
      pending.push((async () => {
        let result = background;
        for (const match of background.matchAll(/url\(["']?(.*?)["']?\)/g)) {
          const embedded = await embeddedAsset(match[1]);
          result = result.replace(match[0], embedded ? `url("${embedded}")` : "none");
        }
        copy.style.backgroundImage = result;
      })());
    }
    if (performance.now() - budgetStart >= 3) {
      await yieldTask();
      budgetStart = performance.now();
    }
  }
  Object.assign(clone.style, { position: "relative", left: "0", top: "0", right: "auto", bottom: "auto",
    margin: "0", width: `${rect.width}px`, height: `${rect.height}px`, transform: "none",
    maxWidth: "none", maxHeight: "none", visibility: "visible", opacity: "1", display: "block" });
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  await Promise.all(pending);
  signal?.throwIfAborted();
  const markup = new XMLSerializer().serializeToString(clone);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}"><foreignObject width="100%" height="100%">${markup}</foreignObject></svg>`;
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();
  signal?.throwIfAborted();
  const canvas = document.createElement("canvas");
  // Bound texture upload cost on large/high-DPI windows.
  const scale = Math.min(window.devicePixelRatio || 1, 1.25, 1600 / Math.max(rect.width, rect.height));
  canvas.width = Math.max(1, Math.round(rect.width * scale));
  canvas.height = Math.max(1, Math.round(rect.height * scale));
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  record.update(record.observer.takeRecords());
  if (record.version === version) {
    record.texture = canvas;
    record.captured = version;
    record.width = rect.width;
    record.height = rect.height;
  }
  return canvas;
}
