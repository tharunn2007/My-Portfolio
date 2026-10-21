export function readStoredCollection(key, fallback, isValidItem) {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const value = JSON.parse(raw);
    return Array.isArray(value) && value.every(isValidItem) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredCollection(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const isStoredNote = (item) =>
  item !== null &&
  typeof item === "object" &&
  typeof item.id === "string" &&
  typeof item.title === "string" &&
  typeof item.body === "string";
export const isStoredFolder = (item) =>
  item !== null &&
  typeof item === "object" &&
  typeof item.id === "string" &&
  typeof item.name === "string";

// Existing app initializers still merge their own defaults with saved collections.
export function readStoredArrayText(key) {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(key);
    const value = JSON.parse(raw);
    const isValid = (item) => {
      if (key === "macos_portfolio_pinned_messages") return typeof item === "string";
      if (!item || typeof item !== "object") return false;
      if (key === "macos_portfolio_telegram_calls") return typeof item.name === "string";
      if (typeof item.id !== "string") return false;
      if (key === "macos_portfolio_calendar_events")
        return typeof item.title === "string" && typeof item.date === "string";
      return (
        Array.isArray(item.messages) &&
        item.messages.every((message) => message && typeof message === "object")
      );
    };
    return Array.isArray(value) && value.every(isValid) ? raw : null;
  } catch {
    return null;
  }
}

export const sessionState = {
  getItem(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      /* Storage may be unavailable in private mode. */
    }
  },
  removeItem(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      /* Keep the desktop usable without storage. */
    }
  },
};
