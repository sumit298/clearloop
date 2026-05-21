type Event = {
  time: string;
  kind: "feature" | "pr" | "deploy" | "incident" | "fix" | "release";
  title: string;
  meta: string;
  author: string;
  badge?: string;
};

const events: Event[] = [
  {
    time: "09:14",
    kind: "feature",
    title: "FEAT-2841 · Inline diff review for PR comments",
    meta: "proposed in #product-platform",
    author: "j.okafor",
  },
  {
    time: "11:02",
    kind: "pr",
    title: "PR #4127 · feat(review): inline diff renderer",
    meta: "+482 −96 · 14 files · linked to FEAT-2841",
    author: "j.okafor",
    badge: "merged",
  },
  {
    time: "11:46",
    kind: "deploy",
    title: "Deploy · review-service @ 1.84.0",
    meta: "us-east-1 · canary 5% → 100% in 14m",
    author: "deploy-bot",
  },
  {
    time: "13:21",
    kind: "incident",
    title: "INC-318 · Elevated 5xx on /reviews/diff",
    meta: "p95 latency 1.8s · attributed to 1.84.0",
    author: "pager",
    badge: "sev-3",
  },
  {
    time: "13:58",
    kind: "fix",
    title: "PR #4131 · fix(review): guard against empty hunks",
    meta: "+22 −4 · 2 files · resolves INC-318",
    author: "a.lindgren",
    badge: "merged",
  },
  {
    time: "16:30",
    kind: "release",
    title: "Release notes · review-service 1.84.1",
    meta: "auto-generated from 6 PRs · 1 incident",
    author: "clearloop",
  },
];

const kindStyle: Record<Event["kind"], { label: string; dot: string; ring: string }> = {
  feature: { label: "feature", dot: "bg-primary-soft", ring: "ring-primary/40" },
  pr: { label: "pull request", dot: "bg-[#8739D5]", ring: "ring-[#8739D5]/40" },
  deploy: { label: "deploy", dot: "bg-success", ring: "ring-success/30" },
  incident: { label: "incident", dot: "bg-danger", ring: "ring-danger/30" },
  fix: { label: "fix", dot: "bg-warning", ring: "ring-warning/30" },
  release: { label: "release", dot: "bg-text-dim", ring: "ring-text-muted/30" },
};

export function HeroTimeline() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_1px_0_0_rgba(255,255,255,0.03),0_30px_60px_-40px_rgba(0,0,0,0.8)]">
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-border bg-surface-2/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1B2330]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#1B2330]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#1B2330]" />
          </div>
          <span className="ml-3 font-mono text-[11px] text-text-muted">
            clearloop · timeline · review-service
          </span>
        </div>
        <div className="hidden items-center gap-3 font-mono text-[11px] text-text-muted sm:flex">
          <span className="rounded border border-border bg-background/60 px-1.5 py-0.5">
            today
          </span>
          <span>UTC−05</span>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-[180px_1fr] divide-x divide-border">
        {/* Side filters */}
        <aside className="hidden flex-col gap-1 p-4 sm:flex">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Streams
          </p>
          {[
            { label: "All activity", n: 142, active: true },
            { label: "Features", n: 18 },
            { label: "Pull requests", n: 47 },
            { label: "Deploys", n: 12 },
            { label: "Incidents", n: 3 },
            { label: "Releases", n: 6 },
          ].map((s) => (
            <button
              key={s.label}
              className={`flex items-center justify-between rounded-md px-2 py-1.5 text-[12px] transition-colors ${
                s.active
                  ? "bg-surface-2 text-foreground"
                  : "text-text-dim hover:bg-surface-2/60 hover:text-foreground"
              }`}
            >
              <span>{s.label}</span>
              <span className="font-mono text-[10px] text-text-muted">{s.n}</span>
            </button>
          ))}
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Owners
            </p>
            {["platform", "growth", "infra"].map((o) => (
              <div
                key={o}
                className="flex items-center gap-2 px-2 py-1 text-[12px] text-text-dim"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary-soft/70" />
                {o}
              </div>
            ))}
          </div>
        </aside>

        {/* Timeline */}
        <div className="relative p-5">
          {/* spine */}
          <div className="absolute left-[34px] top-5 bottom-5 w-px bg-border" />
          <ul className="flex flex-col gap-4">
            {events.map((e, i) => {
              const s = kindStyle[e.kind];
              return (
                <li key={i} className="relative flex gap-4">
                  <div className="relative z-10 flex w-[18px] justify-center pt-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${s.dot} ring-4 ${s.ring} ring-offset-0`}
                    />
                  </div>
                  <div className="font-mono text-[11px] tabular text-text-muted pt-0.5 w-10">
                    {e.time}
                  </div>
                  <div className="min-w-0 flex-1 rounded-md border border-border bg-surface-2/40 px-3 py-2 transition-colors hover:border-border-strong">
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {e.title}
                      </p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="rounded border border-border bg-background/50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                          {s.label}
                        </span>
                        {e.badge && (
                          <span
                            className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                              e.badge === "merged"
                                ? "bg-success/10 text-success"
                                : "bg-danger/10 text-danger"
                            }`}
                          >
                            {e.badge}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-text-muted">
                      {e.meta} · <span className="text-text-dim">{e.author}</span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
