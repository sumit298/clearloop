import { SectionLabel } from "./WorkflowSection";

const prompts = [
  {
    q: "Why was this feature added?",
    a: [
      { t: "FEAT-2841", k: "feature" },
      { t: "proposed by j.okafor in #product-platform, 11 Mar", k: "context" },
      { t: "linked to Q1 goal · reduce review cycle time", k: "goal" },
    ],
  },
  {
    q: "Which PR introduced this bug?",
    a: [
      { t: "INC-318 · 5xx on /reviews/diff", k: "incident" },
      { t: "first seen 14m after deploy of review-service 1.84.0", k: "context" },
      { t: "→ PR #4127 · feat(review): inline diff renderer", k: "cause" },
    ],
  },
  {
    q: "Generate release summary",
    a: [
      { t: "review-service 1.84.1 · 6 PRs · 1 incident · 0 reverts", k: "summary" },
      { t: "highlights · inline diff review, audit export", k: "context" },
      { t: "fix · empty-hunk crash on /reviews/diff", k: "cause" },
    ],
  },
];

const kindClass: Record<string, string> = {
  feature: "text-primary-soft",
  incident: "text-danger",
  cause: "text-warning",
  context: "text-text-dim",
  goal: "text-success",
  summary: "text-foreground",
};

export function AISection() {
  return (
    <section className="border-y border-border bg-surface-2/30">
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <SectionLabel index="04" label="Assisted" />
            <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Ask the timeline,<br />not a chatbot.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-text-dim">
              ClearLoop's assistant only answers from the linked record — PRs, ADRs,
              releases, incidents. No invented context, no hallucinated owners. Every
              answer cites the source events it was built from.
            </p>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-wider text-text-muted">
              grounded · cited · auditable
            </p>
          </div>

          <div className="md:col-span-8">
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className="divide-y divide-border">
                {prompts.map((p, i) => (
                  <div key={i} className="grid grid-cols-1 lg:grid-cols-12">
                    <div className="border-b border-border bg-surface-2/40 p-5 lg:col-span-5 lg:border-b-0 lg:border-r">
                      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                        <span className="h-1 w-1 rounded-full bg-primary-soft" />
                        ask
                      </div>
                      <p className="mt-2 text-[14px] text-foreground">{p.q}</p>
                    </div>
                    <div className="p-5 lg:col-span-7">
                      <ul className="space-y-2">
                        {p.a.map((line, j) => (
                          <li
                            key={j}
                            className="flex items-start gap-3 text-[13px] text-text-dim"
                          >
                            <span
                              className={`mt-0.5 w-16 shrink-0 font-mono text-[10px] uppercase tracking-wider ${
                                kindClass[line.k] ?? "text-text-muted"
                              }`}
                            >
                              {line.k}
                            </span>
                            <span>{line.t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
