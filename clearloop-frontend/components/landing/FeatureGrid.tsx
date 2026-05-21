import { SectionLabel } from "./WorkflowSection";

const features = [
  {
    icon: (
      <path d="M3 6h10M3 10h6M3 14h10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    ),
    title: "Unified activity log",
    body: "Every PR, deploy, incident, and decision in one ordered record, scoped by service or team.",
  },
  {
    icon: (
      <>
        <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.25" />
        <circle cx="11" cy="11" r="2" stroke="currentColor" strokeWidth="1.25" />
        <path d="M5 7v2a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.25" />
      </>
    ),
    title: "Bidirectional links",
    body: "Features ↔ PRs ↔ commits ↔ releases ↔ incidents, resolved automatically and kept current.",
  },
  {
    icon: (
      <>
        <rect x="2.5" y="3" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <path d="M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </>
    ),
    title: "Decision records",
    body: "Lightweight ADRs that attach to the work they shape, so context survives team turnover.",
  },
  {
    icon: (
      <>
        <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.25" />
      </>
    ),
    title: "Release lineage",
    body: "Trace any bug back to the exact commit, PR, reviewer, and rollout window that introduced it.",
  },
  {
    icon: (
      <>
        <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <path d="M5.5 8l2 2 3-4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    title: "Audit-ready exports",
    body: "Signed, immutable activity exports for SOC 2, ISO 27001, and internal change review.",
  },
  {
    icon: (
      <>
        <path d="M3 11l4-4 3 3 3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    title: "Operational metrics",
    body: "Lead time, change failure rate, and MTTR — derived from the timeline, not a separate pipeline.",
  },
];

export function FeatureGrid() {
  return (
    <section id="product" className="mx-auto max-w-[1200px] px-6 py-24">
      <SectionLabel index="05" label="Capabilities" />
      <div className="mt-6 flex items-end justify-between gap-8">
        <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Built for teams that operate, not just ship.
        </h2>
        <p className="hidden max-w-sm text-[14px] text-text-dim md:block">
          The same primitives that power your timeline also power dashboards,
          retrospectives, and compliance.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 divide-y divide-border border border-border sm:grid-cols-2 sm:divide-y-0 md:grid-cols-3">
        {features.map((f, i) => (
          <div
            key={f.title}
            className={`p-7 ${
              i % 3 !== 2 ? "md:border-r md:border-border" : ""
            } ${i % 2 !== 1 ? "sm:border-r sm:border-border" : ""} ${
              i >= 3 ? "md:border-t md:border-border" : ""
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface-2 text-primary-soft">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                {f.icon}
              </svg>
            </div>
            <h3 className="mt-5 text-[15px] font-semibold tracking-tight text-foreground">
              {f.title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-text-dim">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
