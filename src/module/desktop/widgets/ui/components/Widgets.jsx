import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useWindowsStore from "@store/window";
import useWidgetsStore from "@store/widgets";
import useTimeStore from "@store/time";
import AnalogClockFace from "./AnalogClockFace";
import LeetCodeWidget from "./LeetCodeWidget";
import gsap from "gsap";
import WEATHER_DATA from "@module/desktop/apps/weather/data/weatherData";
import { GITHUB_PROFILE } from "@constants";
import { useGSAP } from "@gsap/react";
import { Draggable } from "gsap/Draggable";

// ---------------------------------------------------------------------------
// GitHub contribution heatmap — GitHub's official green palette (dark UI).
// Data: live GitHub contributions (jogruber API); unavailable data is labeled.
// ---------------------------------------------------------------------------
const GITHUB_USER =
  (GITHUB_PROFILE || "https://github.com/tharunn2007").replace(/\/$/, "").split("/").pop() ||
  "tharunn2007";

// GitHub dark-theme contribution scale: empty → #0e4429 → #006d32 → #26a641 → #39d353.
const HEAT_COLORS = [
  "#161b22", // 0 — no contributions
  "#0e4429", // 1
  "#006d32", // 2
  "#26a641", // 3
  "#39d353", // 4 — most contributions
];

const GithubHeatmapWidget = () => {
  const year = new Date().getFullYear();
  const [contributions, setContributions] = useState(null);
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=${year}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("GitHub unavailable");
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data.contributions)) throw new Error("Invalid calendar");
        if (mounted) setContributions(data.contributions);
      })
      .catch(() => {
        if (mounted) setContributions([]);
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      mounted = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [year]);
  const { cells, columns, labels, total } = useMemo(() => {
    const entries = new Map((contributions || []).map((day) => [day.date, day]));
    const first = new Date(year, 0, 1);
    const last = new Date(year, 11, 31);
    const count = Math.round((Date.UTC(year, 11, 31) - Date.UTC(year, 0, 1)) / 86400000) + 1;
    const columns = Math.ceil((first.getDay() + count) / 7);
    const cells = Array.from({ length: columns * 7 }, (_, i) => {
      const date = new Date(year, 0, i - first.getDay() + 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const entry = entries.get(key);
      return {
        key,
        valid: date >= first && date <= last,
        future: date > new Date(),
        count: entry?.count || 0,
        level: Math.max(0, Math.min(4, entry?.level || 0)),
      };
    });
    const labels = Array.from({ length: 12 }, (_, month) => {
      const day = new Date(year, month, 1);
      const offset = Math.round((Date.UTC(year, month, 1) - Date.UTC(year, 0, 1)) / 86400000);
      return {
        name: day.toLocaleDateString("en-US", { month: "short" }),
        column: Math.floor((first.getDay() + offset) / 7),
      };
    });
    return {
      cells,
      columns,
      labels,
      total: cells.filter((d) => d.valid).reduce((sum, d) => sum + d.count, 0),
    };
  }, [year, contributions]);
  return (
    <button
      type="button"
      onClick={() => window.open(GITHUB_PROFILE, "_blank", "noopener,noreferrer")}
      className="liquid-glass flex h-full w-full flex-col rounded-2xl p-3 text-left text-white shadow-lg"
      aria-label={`${GITHUB_USER}'s ${year} GitHub contributions, January through December`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-emerald-300">@{GITHUB_USER}</span>
        <span className="text-[10px] text-white/65">
          {contributions === null
            ? "Loading…"
            : contributions.length
              ? `${total} contributions`
              : "Data unavailable"}
        </span>
      </div>
      <div className="my-auto w-full py-3">
        <div
          className="mb-2 grid h-3 text-[7px] text-white/65"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {labels.map((label) => (
            <span
              key={label.name}
              style={{ gridColumn: `${label.column + 1} / span 3`, gridRow: 1 }}
            >
              {label.name}
            </span>
          ))}
        </div>
        <div
          className="grid w-full gap-[1px]"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridTemplateRows: "repeat(7, auto)",
            gridAutoFlow: "column",
          }}
        >
          {cells.map((day) => (
            <span
              key={day.key}
              title={
                day.valid
                  ? `${day.key}: ${day.future ? "upcoming" : `${day.count} contributions`}`
                  : undefined
              }
              style={{
                aspectRatio: "1",
                borderRadius: 1,
                opacity: day.valid ? (day.future ? 0.25 : 1) : 0,
                background: HEAT_COLORS[day.level],
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between text-[8px] text-white/60">
        <span>Jan – Dec {year}</span>
        <span className="flex items-center gap-1">
          Less{" "}
          {HEAT_COLORS.map((color) => (
            <span key={color} className="h-2 w-2 rounded-sm" style={{ background: color }} />
          ))}{" "}
          More
        </span>
      </div>
    </button>
  );
};

const getCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  return [...Array(firstDay).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];
};

const ClockCalendarWidget = ({ time }) => {
  const monthName = time.toLocaleDateString("en-US", { month: "long" });
  const dateHeader = time
    .toLocaleDateString("en-US", { month: "long", day: "numeric", weekday: "long" })
    .toUpperCase();
  const days = getCalendarDays(time.getFullYear(), time.getMonth());
  const timeString = `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="flex h-full w-full flex-col items-center text-center font-sans text-white">
      <div className="text-[12px] font-semibold tracking-wider text-white/80">{dateHeader}</div>
      <div className="mt-1 text-[56px] font-extralight leading-none tracking-tight">
        {timeString}
      </div>
      <div className="mt-4 text-[12px] font-bold uppercase tracking-wider text-white/50">
        {monthName}
      </div>
      <div className="mt-2.5 grid w-full grid-cols-7 gap-x-2.5 gap-y-2 text-[11px] font-semibold text-white/40">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <div key={`${day}-${index}`} className="w-7 text-center">
            {day}
          </div>
        ))}
      </div>
      <div className="mt-2 grid w-full grid-cols-7 gap-x-2.5 gap-y-2 text-[13px]">
        {days.map((day, index) => (
          <div key={index} className="relative flex h-7 w-7 items-center justify-center">
            {day && (
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full font-semibold ${
                  day === time.getDate()
                    ? "scale-105 bg-white text-zinc-900 shadow-md"
                    : "text-white/80"
                }`}
              >
                {day}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ClockWidget = ({ time }) => (
  <div className="flex h-full flex-col items-center justify-center text-white">
    <div className="text-[48px] font-extralight tracking-tight">
      {String(time.getHours()).padStart(2, "0")}:{String(time.getMinutes()).padStart(2, "0")}
    </div>
    <div className="text-xs font-medium text-white/65">
      {time.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
    </div>
  </div>
);

const AnalogClockWidget = ({ time }) => (
  <div className="flex h-full w-full items-center justify-center">
    <AnalogClockFace
      time={time}
      className="h-full max-h-[184px] w-full max-w-[184px] drop-shadow-[0_6px_12px_rgba(0,0,0,0.25)]"
    />
  </div>
);

const WeatherWidget = () => {
  const weather = WEATHER_DATA.delhi;
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-white/20 bg-gradient-to-br from-sky-500/35 to-blue-800/45 p-4 text-white shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between text-xs font-medium text-white/75">
        <span>{weather.name}</span>
        <span>Today</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-5xl font-light">{weather.tempC}°</div>
          <div className="mt-1 text-sm text-white/80">{weather.condition}</div>
        </div>
        <img src="/weather/sunny-sky.webp" alt="" className="h-16 w-16 rounded-full object-cover" />
      </div>
      <div className="text-xs text-white/70">
        H:{weather.highC}° &nbsp; L:{weather.lowC}°
      </div>
    </div>
  );
};

const BatteryWidget = () => {
  const [battery, setBattery] = useState({ level: null, charging: false, supported: false });

  useEffect(() => {
    let manager;
    let mounted = true;
    const updateBattery = () => {
      if (!manager || !mounted) return;
      setBattery({
        level: Math.round(manager.level * 100),
        charging: manager.charging,
        supported: true,
      });
    };

    if (!navigator.getBattery) return undefined;

    navigator
      .getBattery()
      .then((batteryManager) => {
        if (!mounted) return;
        manager = batteryManager;
        updateBattery();
        manager.addEventListener("levelchange", updateBattery);
        manager.addEventListener("chargingchange", updateBattery);
      })
      .catch(() => {});

    return () => {
      mounted = false;
      if (manager) {
        manager.removeEventListener("levelchange", updateBattery);
        manager.removeEventListener("chargingchange", updateBattery);
      }
    };
  }, []);

  return (
    <div className="flex h-full flex-col justify-between p-3 text-white">
      <div className="flex items-center justify-between text-xs font-medium text-white/65">
        <span>Battery</span>
        {battery.charging && <span className="text-green-300">Charging</span>}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative h-8 w-[58px] rounded-[7px] border-2 border-white/80 p-[3px]">
          <span
            className="block h-full rounded-[3px] bg-green-400 transition-[width]"
            style={{ width: `${battery.level ?? 0}%` }}
          />
          <span className="absolute -right-[5px] top-2 h-3 w-[3px] rounded-r-sm bg-white/80" />
        </div>
        <span className="text-2xl font-light">
          {battery.supported && battery.level !== null ? `${battery.level}%` : "--%"}
        </span>
      </div>
      <span className="text-[10px] text-white/55">
        {battery.supported
          ? battery.charging
            ? "Power adapter"
            : "On battery"
          : "Battery status unavailable"}
      </span>
    </div>
  );
};

const NotesWidget = () => {
  const openWindow = useWindowsStore((state) => state.openWindow);
  const [note, setNote] = useState({
    title: "Quick Note",
    preview: "Open Notes to capture an idea.",
  });

  useEffect(() => {
    try {
      const savedNotes = JSON.parse(localStorage.getItem("macos_portfolio_notes") || "[]");
      const recentNote = savedNotes[0];
      if (recentNote) {
        setNote({
          title: recentNote.title || "Quick Note",
          preview: recentNote.preview || recentNote.title || "Open Notes to capture an idea.",
        });
      }
    } catch {
      // Keep the Notes widget available if saved note data is invalid.
    }
  }, []);

  return (
    <button
      type="button"
      onClick={() => openWindow("notes")}
      className="flex h-full w-full flex-col items-start rounded-2xl border border-amber-100/60 bg-[#f9e7a6]/95 p-3 text-left text-zinc-800 shadow-md"
    >
      <span className="text-xs font-semibold">{note.title}</span>
      <span className="mt-2 line-clamp-4 text-[11px] leading-relaxed text-zinc-600">
        {note.preview}
      </span>
    </button>
  );
};

const WIDGET_SIZES = {
  leetcode: { width: 360, height: 400 },
  "github-heatmap": { width: 344, height: 200 },
  "clock-calendar": { width: 264, height: 310 },
  clock: { width: 190, height: 130 },
  "analog-clock": { width: 200, height: 200 },
  weather: { width: 220, height: 170 },
  battery: { width: 190, height: 130 },
  notes: { width: 220, height: 150 },
};

const WIDGET_SIZE_OPTIONS = {
  leetcode: {
    small: { width: 328, height: 400 },
    medium: { width: 360, height: 400 },
    large: { width: 400, height: 430 },
  },
  "github-heatmap": {
    small: { width: 280, height: 170 },
    medium: { width: 344, height: 200 },
    large: { width: 400, height: 230 },
  },
  "clock-calendar": {
    medium: { width: 264, height: 310 },
    large: { width: 300, height: 350 },
  },
  clock: {
    small: { width: 150, height: 100 },
    medium: { width: 190, height: 130 },
    large: { width: 240, height: 160 },
  },
  "analog-clock": {
    small: { width: 150, height: 150 },
    medium: { width: 200, height: 200 },
    large: { width: 260, height: 260 },
  },
  weather: {
    small: { width: 180, height: 140 },
    medium: { width: 220, height: 170 },
    large: { width: 280, height: 210 },
  },
  battery: {
    small: { width: 150, height: 100 },
    medium: { width: 190, height: 130 },
    large: { width: 230, height: 155 },
  },
  notes: {
    small: { width: 160, height: 120 },
    medium: { width: 220, height: 150 },
    large: { width: 280, height: 200 },
  },
};

const WIDGET_LABELS = {
  leetcode: "LeetCode",
  "github-heatmap": "GitHub Heatmap",
  "clock-calendar": "Time & Calendar",
  clock: "Clock",
  "analog-clock": "Analog Clock",
  weather: "Weather",
  battery: "Battery",
  notes: "Notes",
};

const WIDGET_LINKS = {
  "clock-calendar": { label: "Open Calendar", app: "calendar" },
  weather: { label: "Open Weather", app: "weather" },
  notes: { label: "Open Notes", app: "notes" },
};

const WidgetContextMenu = ({ menu, onClose, onRemove, onResize, onOpen, size }) => {
  const menuRef = useRef(null);
  const type = menu?.type;
  const sizeOptions = WIDGET_SIZE_OPTIONS[type] || {};
  const link = WIDGET_LINKS[type];

  useEffect(() => {
    if (!menu) return undefined;
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) onClose();
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", onClose);
    };
  }, [menu, onClose]);

  if (!menu || typeof document === "undefined") return null;

  const width = 208;
  const height = 90 + Object.keys(sizeOptions).length * 27 + (link ? 36 : 0);
  const left = Math.max(8, Math.min(menu.x, window.innerWidth - width - 8));
  const top = Math.max(8, Math.min(menu.y, window.innerHeight - height - 8));

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[100001] w-[208px] select-none rounded-[10px] border border-white/15 p-1 font-sans text-[13px] leading-tight text-white shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
      style={{
        left,
        top,
        background: "rgba(22, 22, 26, 0.86)",
        backdropFilter: "blur(14px) saturate(120%)",
        WebkitBackdropFilter: "blur(14px) saturate(120%)",
        boxShadow: "0 18px 40px rgba(0, 0, 0, 0.45), 0 4px 14px rgba(0, 0, 0, 0.25)",
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div className="px-2.5 py-1.5 text-[11px] font-medium text-white/55">
        {WIDGET_LABELS[type]}
      </div>
      {link && (
        <button
          type="button"
          className="widget-menu-item"
          onClick={() => {
            onOpen(link.app);
            onClose();
          }}
        >
          {link.label}
        </button>
      )}
      <div className="my-1 h-px bg-white/15" />
      <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">
        Size
      </div>
      {Object.entries(sizeOptions).map(([option, dimensions]) => (
        <button
          key={option}
          type="button"
          className="widget-menu-item justify-between"
          aria-pressed={size === option}
          onClick={() => {
            onResize(type, option, dimensions);
            onClose();
          }}
        >
          <span className="capitalize">{option}</span>
          {size === option && <span aria-hidden="true">✓</span>}
        </button>
      ))}
      <div className="my-1 h-px bg-white/15" />
      <button
        type="button"
        className="widget-menu-item"
        onClick={() => {
          onRemove(type);
          onClose();
        }}
      >
        Remove Widget
      </button>
    </div>,
    document.body,
  );
};

const WIDGET_COMPONENTS = {
  leetcode: LeetCodeWidget,
  "github-heatmap": GithubHeatmapWidget,
  "clock-calendar": ClockCalendarWidget,
  clock: ClockWidget,
  "analog-clock": AnalogClockWidget,
  weather: WeatherWidget,
  battery: BatteryWidget,
  notes: NotesWidget,
};

const DesktopWidgets = () => {
  const widgets = useWidgetsStore((state) => state.widgets);
  const moveWidget = useWidgetsStore((state) => state.moveWidget);
  const toggleWidget = useWidgetsStore((state) => state.toggleWidget);
  const replaceWidget = useWidgetsStore((state) => state.replaceWidget);
  const time = useTimeStore((state) => state.time);
  const windows = useWindowsStore((state) => state.windows);
  const openWindow = useWindowsStore((state) => state.openWindow);
  const widgetsLayerRef = useRef(null);
  const [widgetMenu, setWidgetMenu] = useState(null);
  const [widgetSizes, setWidgetSizes] = useState({});
  const widgetIds = widgets.join(",");

  useEffect(() => {
    if (widgets.includes("clock-calendar")) replaceWidget("clock-calendar", "github-heatmap");
    else if (widgets.includes("calendar")) replaceWidget("calendar", "github-heatmap");
    else if (widgets.includes("projects")) replaceWidget("projects", "github-heatmap");
  }, [widgets, replaceWidget]);
  const isAnyWindowOpen = useMemo(
    () => Object.values(windows).some((win) => win.isOpen && !win.isMinimized),
    [windows],
  );

  useGSAP(() => {
    const elements = [...(widgetsLayerRef.current?.querySelectorAll(".desktop-widget") || [])];
    if (!elements.length) return;
    const instances = elements.flatMap((element) =>
      Draggable.create(element, {
        trigger: element.querySelector(".widget-drag-handle"),
        bounds: widgetsLayerRef.current,
        allowContextMenu: true,
        dragClickables: true,
        cursor: "grab",
        activeCursor: "grabbing",
        onDragStart() {
          document.body.classList.add("widget-dragging");
          this.target.style.zIndex = "5";
        },
        onDragEnd() {
          const candidate = elements.find(
            (other) => other !== this.target && this.hitTest(other, "35%"),
          );
          if (candidate)
            moveWidget(this.target.dataset.widget, widgets.indexOf(candidate.dataset.widget));
          // Reordering snaps back into grid tracks; no overlapping resting positions.
          gsap.set(this.target, { x: 0, y: 0 });
          this.target.style.zIndex = "";
          document.body.classList.remove("widget-dragging");
        },
        onRelease() {
          document.body.classList.remove("widget-dragging");
        },
      }),
    );
    return () => {
      document.body.classList.remove("widget-dragging");
      instances.forEach((instance) => instance.kill());
    };
  }, [widgetIds, moveWidget]);

  const columnWidth = Math.max(
    280,
    ...widgets.map((type) => (widgetSizes[type]?.dimensions || WIDGET_SIZES[type])?.width || 0),
  );

  return (
    <div
      ref={widgetsLayerRef}
      className={`desktop-widget-grid pointer-events-none absolute bottom-[112px] left-[160px] right-4 top-[55px] z-[2] grid items-start gap-4 overflow-y-auto p-2 ${isAnyWindowOpen ? "desktop-dimmed" : ""}`}
      aria-label="Desktop widgets"
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${columnWidth}px), ${columnWidth}px))`,
        justifyContent: "end",
        alignContent: "start",
      }}
    >
      {widgets.map((type, index) => {
        const Widget = WIDGET_COMPONENTS[type];
        const size = widgetSizes[type]?.dimensions || WIDGET_SIZES[type];
        if (!Widget || !size) return null;
        return (
          <div
            key={type}
            data-widget={type}
            className="widget-container desktop-widget pointer-events-auto"
            onContextMenu={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setWidgetMenu({ type, x: event.clientX, y: event.clientY });
            }}
            style={{
              position: "relative",
              width: `min(100%, ${size.width}px)`,
              height: `${size.height + 14}px`,
              padding: "14px 0 0",
              justifySelf: "end",
            }}
          >
            <button
              type="button"
              className="widget-drag-handle absolute left-1/2 top-0 flex h-3 w-12 -translate-x-1/2 items-center justify-center rounded-full text-white/50 hover:bg-white/10"
              aria-label={`Move ${WIDGET_LABELS[type]} widget; use arrow keys to reorder`}
              title="Drag to reorder, or use arrow keys"
              onKeyDown={(event) => {
                if (["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"].includes(event.key)) {
                  event.preventDefault();
                  moveWidget(type, index + (["ArrowUp", "ArrowLeft"].includes(event.key) ? -1 : 1));
                }
              }}
            >
              <span className="h-0.5 w-6 rounded-full bg-white/35" />
            </button>
            {type === "clock" || type === "analog-clock" || type === "clock-calendar" ? (
              <Widget time={time} />
            ) : (
              <Widget />
            )}
          </div>
        );
      })}
      <WidgetContextMenu
        menu={widgetMenu}
        size={widgetSizes[widgetMenu?.type]?.option || "medium"}
        onClose={() => setWidgetMenu(null)}
        onRemove={toggleWidget}
        onResize={(type, option, dimensions) => {
          setWidgetSizes((current) => ({
            ...current,
            [type]: { option, dimensions },
          }));
        }}
        onOpen={openWindow}
      />
    </div>
  );
};

export default DesktopWidgets;
export { DesktopWidgets };
