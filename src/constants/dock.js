// ============================================================================
// APP REGISTRY — every app this portfolio ships with.
// ----------------------------------------------------------------------------
// This list is the single source of truth for apps: the desktop Dock reads
// DEFAULT_DOCK_IDS below, while Launchpad, Siri and the mobile app grid use
// the full registry. Add a new app here and it becomes available everywhere.
// ============================================================================
export const dockApps = [
  { id: "finder", name: "Finder", icon: "finder.webp", canOpen: true },
  { id: "launchpad", name: "Launchpad", icon: "/system/icons/dock/launchpad.webp", canOpen: true },
  { id: "safari", name: "Safari", icon: "safari.webp", canOpen: true },
  { id: "photos", name: "Gallery", icon: "photos.webp", canOpen: true },
  { id: "contact", name: "Contact", icon: "contact.webp", canOpen: true },
  { id: "terminal", name: "Terminal", icon: "terminal.webp", canOpen: true },
  { id: "settings", name: "Settings", icon: "settings.webp", canOpen: true },
  { id: "calculator", name: "Calculator", icon: "calculator.webp", canOpen: true },
  { id: "notes", name: "Notes", icon: "notes.webp", canOpen: true },
  { id: "call", name: "FaceTime", icon: "call.webp", canOpen: true },
  { id: "messages", name: "Messages", icon: "message.webp", canOpen: true },
  { id: "appletv", name: "Apple TV", icon: "appletv.webp", canOpen: true },
  { id: "appstore", name: "App Store", icon: "appstore.webp", canOpen: true },
  { id: "calendar", name: "Calendar", icon: "calendar.png", canOpen: true },
  { id: "weather", name: "Weather", icon: "weather.webp", canOpen: true },
  { id: "vscode", name: "VS Code", icon: "vscode.webp", canOpen: true },
  { id: "postman", name: "Postman", icon: "postman.webp", canOpen: true },
  { id: "map", name: "Maps", icon: "map.webp", canOpen: true },
  { id: "font", name: "Font Book", icon: "font.webp", canOpen: true },
  { id: "telegram", name: "Telegram", icon: "telegram.webp", canOpen: true },
  { id: "music", name: "Music", icon: "music.webp", canOpen: true },
  { id: "folder", name: "Folder", icon: "/system/icons/files/folder.webp", canOpen: true },
  { id: "trash", name: "Trash", icon: "/system/icons/dock/trash.webp", canOpen: true },
];

// ---------------------------------------------------------------------------
// DEFAULT DOCK LAYOUT — what visitors actually see on the desktop.
// Deliberately minimal: this is a portfolio first, not a macOS remake.
// Every app stays reachable via Launchpad / Siri — the dock only pins the
// ones that tell Tharunn's story:
//   finder    -> browse the projects
//   launchpad -> discover the rest of the apps
//   safari    -> live demos & project sites
//   terminal  -> the developer behind it (try `projects`, `techstack`)
//   contact   -> get in touch
//   trash     -> a touch of macOS authenticity
// Reorder freely; apps not listed here simply live in the Launchpad.
// ---------------------------------------------------------------------------
export const DEFAULT_DOCK_IDS = [
  "finder",
  "launchpad",
  "safari",
  "terminal",
  "contact",
  "trash",
];
