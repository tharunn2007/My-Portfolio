import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { LEETCODE_PROFILE, LEETCODE_USERNAME } from "@lib/leetcode";

const COLORS = { Easy: "#36d399", Medium: "#f5b94c", Hard: "#f87171" };
const linkClass =
  "inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[10px] text-white/85 transition-colors hover:bg-white/20";

export default function LeetCodeWidget() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let mounted = true;
    setLoading(true);
    setError(false);
    fetch("/api/leetcode", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unavailable");
        return response.json();
      })
      .then((data) => {
        if (mounted) setStats(data);
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        clearTimeout(timeout);
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);
  const all = stats?.solved?.find((item) => item.difficulty === "All");
  const levels = stats?.solved?.filter((item) => item.difficulty !== "All") || [];
  const circumference = 2 * Math.PI * 43;
  return (
    <section
      aria-label="LeetCode profile and daily problem"
      className="liquid-glass flex h-full min-w-0 flex-col gap-3 rounded-2xl p-4 text-white"
    >
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-amber-300/80">
            LeetCode
          </p>
          <p className="mt-0.5 text-sm font-semibold">@{LEETCODE_USERNAME}</p>
        </div>
        <a href={LEETCODE_PROFILE} target="_blank" rel="noopener noreferrer" className={linkClass}>
          View profile <ExternalLink size={11} />
        </a>
      </header>
      <div className="rounded-xl border border-white/15 bg-black/15 p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] text-white/65">Daily problem</h3>
          {stats?.daily && (
            <a
              href={stats.daily.url}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              View problem <ExternalLink size={10} />
            </a>
          )}
        </div>
        <p className="mt-2 text-xs font-medium leading-relaxed">
          {stats?.daily
            ? `${stats.daily.number}. ${stats.daily.title}`
            : loading
              ? "Loading today’s challenge…"
              : "Visit LeetCode for today’s challenge"}
        </p>
        {stats?.daily && (
          <p
            className="mt-1 text-[11px]"
            style={{ color: COLORS[stats.daily.difficulty] || "#e5e7eb" }}
          >
            {stats.daily.difficulty}
          </p>
        )}
      </div>
      <div className="flex-1 rounded-xl border border-white/15 bg-black/15 p-3">
        <h3 className="text-[11px] text-white/65">Solved problems</h3>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div
            className="relative h-[104px] w-[104px] shrink-0"
            role="img"
            aria-label={
              all ? `${all.solved} of ${all.total} problems solved` : "Statistics unavailable"
            }
          >
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r="43"
                fill="none"
                stroke="rgba(255,255,255,.14)"
                strokeWidth="8"
              />
              {levels.map((level, index) => {
                const length = all?.total ? (level.solved / all.total) * circumference : 0;
                const start = all?.total
                  ? (levels.slice(0, index).reduce((sum, item) => sum + item.solved, 0) /
                      all.total) *
                    circumference
                  : 0;
                return (
                  <circle
                    key={level.difficulty}
                    cx="50"
                    cy="50"
                    r="43"
                    fill="none"
                    stroke={COLORS[level.difficulty]}
                    strokeWidth="8"
                    strokeDasharray={`${length} ${circumference}`}
                    strokeDashoffset={-start}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[9px] text-white/55">All</span>
              <strong className="text-2xl font-semibold tabular-nums">{all?.solved ?? "—"}</strong>
              <span className="text-[9px] text-white/45">/ {all?.total ?? "—"}</span>
            </div>
          </div>
          <dl className="min-w-0 flex-1 space-y-3 text-[11px]">
            {["Easy", "Medium", "Hard"].map((difficulty) => {
              const item = levels.find((level) => level.difficulty === difficulty);
              return (
                <div key={difficulty} className="flex justify-between gap-2">
                  <dt style={{ color: COLORS[difficulty] }}>{difficulty}</dt>
                  <dd className="whitespace-nowrap tabular-nums">
                    <span className="font-semibold">{item?.solved ?? "—"}</span>
                    <span className="text-white/40"> / {item?.total ?? "—"}</span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
      <footer
        role="status"
        className="flex min-h-4 items-center justify-between gap-2 text-[9px] text-white/50"
      >
        <span>
          {loading
            ? "Loading public stats…"
            : error
              ? "Stats unavailable"
              : stats?.ranking
                ? `Global rank #${stats.ranking.toLocaleString()}`
                : "Live public statistics"}
        </span>
        {error && (
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-amber-200 hover:bg-white/10"
          >
            <RefreshCw size={10} /> Retry
          </button>
        )}
      </footer>
    </section>
  );
}
