type Lane = {
  name: string;
  color: string;
  items: { day: number; span: number; label: string; tone?: "muted" | "accent" | "warn" | "ok" }[];
};

const lanes: Lane[] = [
  {
    name: "Features",
    color: "#B1A3FA",
    items: [
      { day: 0, span: 5, label: "FEAT-2814 · Saved views", tone: "accent" },
      { day: 6, span: 4, label: "FEAT-2841 · Inline diff review", tone: "accent" },
      { day: 11, span: 3, label: "FEAT-2852 · Audit export", tone: "muted" },
    ],
  },
  {
    name: "Pull requests",
    color: "#8739D5",
    items: [
      { day: 1, span: 2, label: "#4101 saved-views/api" },
      { day: 3, span: 2, label: "#4112 saved-views/ui" },
      { day: 7, span: 2, label: "#4127 review/diff" },
      { day: 10, span: 1, label: "#4131 fix/hunks", tone: "warn" },
      { day: 12, span: 2, label: "#4138 audit/export" },
    ],
  },
  {
    name: "Releases",
    color: "#C5BFCC",
    items: [
      { day: 4, span: 1, label: "1.83.0" },
      { day: 8, span: 1, label: "1.84.0" },
      { day: 9, span: 1, label: "1.84.1", tone: "warn" },
      { day: 13, span: 1, label: "1.85.0" },
    ],
  },
  {
    name: "Incidents",
    color: "#DA4545",
    items: [{ day: 9, span: 1, label: "INC-318 · 5xx /reviews", tone: "warn" }],
  },
  {
    name: "Decisions",
    color: "#8B93A7",
    items: [
      { day: 2, span: 1, label: "ADR-44 · Diff renderer" },
      { day: 11, span: 1, label: "ADR-45 · Audit retention" },
    ],
  },
];

const DAYS = 14;

const toneClass = (tone?: string) =>
  tone === "warn"
    ? "border-warning/40 bg-warning/10 text-warning"
    : tone === "ok"
      ? "border-success/40 bg-success/10 text-success"
      : tone === "accent"
        ? "border-primary/40 bg-primary/15 text-primary-soft"
        : "border-border-strong bg-surface-2 text-text-dim";

export function ContextTimeline() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2/60 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
            project
          </span>
          <span className="text-[13px] font-medium text-foreground">review-service</span>
          <span className="text-text-muted">·</span>
          <span className="text-[12px] text-text-dim">14-day window</span>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-background/40 p-0.5">
          {["Day", "Week", "Sprint", "Quarter"].map((v, i) => (
            <button
              key={v}
              className={`rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
                i === 1
                  ? "bg-surface-2 text-foreground"
                  : "text-text-muted hover:text-text-dim"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* day ruler */}
      <div className="grid grid-cols-[140px_1fr] border-b border-border">
        <div className="border-r border-border bg-surface-2/30" />
        <div
          className="grid font-mono text-[10px] text-text-muted"
          style={{ gridTemplateColumns: `repeat(${DAYS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: DAYS }).map((_, i) => (
            <div
              key={i}
              className={`flex h-8 items-center justify-center border-r border-border/60 ${
                i === 8 ? "bg-primary/5 text-primary-soft" : ""
              }`}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
          ))}
        </div>
      </div>

      {/* lanes */}
      <div className="divide-y divide-border">
        {lanes.map((lane) => (
          <div key={lane.name} className="grid grid-cols-[140px_1fr]">
            <div className="flex items-center gap-2 border-r border-border bg-surface-2/30 px-4 py-3">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: lane.color }}
              />
              <span className="text-[12px] text-text-dim">{lane.name}</span>
            </div>
            <div
              className="relative grid h-14"
              style={{ gridTemplateColumns: `repeat(${DAYS}, minmax(0, 1fr))` }}
            >
              {/* grid bg */}
              {Array.from({ length: DAYS }).map((_, i) => (
                <div
                  key={i}
                  className={`border-r border-border/40 ${i === 8 ? "bg-primary/[0.04]" : ""}`}
                />
              ))}
              {/* items */}
              {lane.items.map((it, i) => (
                <div
                  key={i}
                  className={`absolute top-1/2 -translate-y-1/2 truncate rounded border px-2 py-1 text-[11px] font-medium ${toneClass(
                    it.tone,
                  )}`}
                  style={{
                    left: `calc(${(it.day / DAYS) * 100}% + 4px)`,
                    width: `calc(${(it.span / DAYS) * 100}% - 8px)`,
                  }}
                  title={it.label}
                >
                  {it.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* footer legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border bg-surface-2/40 px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-soft" /> linked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" /> regression
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> shipped
        </span>
        <span className="ml-auto text-text-muted">142 events · 23 contributors</span>
      </div>
    </div>
  );
}
