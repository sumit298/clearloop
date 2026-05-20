export function WorkflowSection() {
  return (
    <section id="integrations" className="mx-auto max-w-[1200px] px-6 py-24">
      <SectionLabel index="02" label="Workflow" />
      <div className="mt-6 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Lives on top of the tools your team already runs.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-text-dim">
            ClearLoop reads from GitHub, your deploy pipeline, and your incident tooling.
            No new workflow, no migrations. Just one canonical record of what shipped,
            who shipped it, and why.
          </p>
          <ul className="mt-8 space-y-3 text-[14px] text-text-dim">
            {[
              "Two-way PR linking with auto-detected feature scope",
              "Release tracking across services and environments",
              "Tamper-evident audit trail for every change",
              "Ownership inferred from CODEOWNERS and commit history",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-2 h-1 w-3 shrink-0 bg-primary-soft" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-7">
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border bg-surface-2/60 px-4 py-2.5">
              <span className="font-mono text-[11px] text-text-muted">
                octolab/review-service · pull/4127
              </span>
              <span className="rounded bg-success/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-success">
                merged
              </span>
            </div>
            <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="p-5">
                <p className="text-[13px] font-medium text-foreground">
                  feat(review): inline diff renderer
                </p>
                <p className="mt-1 font-mono text-[11px] text-text-muted">
                  j.okafor · 14 files · +482 −96
                </p>
                <div className="mt-4 space-y-2 rounded-md border border-border bg-background/40 p-3 font-mono text-[11px] leading-relaxed">
                  <div className="flex gap-3">
                    <span className="text-text-muted">−</span>
                    <span className="text-danger/90">renderFlatDiff(hunks)</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-text-muted">+</span>
                    <span className="text-success/90">renderInlineDiff(hunks, opts)</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-text-muted">+</span>
                    <span className="text-success/90">
                      if (!hunks.length) return EmptyState
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[12px] text-text-muted">
                  <span className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-dim">
                    CODEOWNERS
                  </span>
                  @platform-review
                </div>
              </div>

              <div className="p-5">
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                  Linked context
                </p>
                <ul className="mt-3 space-y-3">
                  {[
                    { k: "FEAT", v: "2841 · Inline diff review for PR comments", c: "text-primary-soft" },
                    { k: "ADR", v: "44 · Diff renderer architecture", c: "text-text-dim" },
                    { k: "REL", v: "review-service 1.84.0 · deployed 11:46 UTC", c: "text-success" },
                    { k: "INC", v: "318 · 5xx on /reviews/diff · resolved", c: "text-warning" },
                  ].map((l) => (
                    <li
                      key={l.k}
                      className="flex items-start gap-3 rounded-md border border-border bg-surface-2/40 px-3 py-2"
                    >
                      <span className={`font-mono text-[10px] font-medium ${l.c}`}>
                        {l.k}
                      </span>
                      <span className="text-[12px] text-text-dim">{l.v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
      <span>{index}</span>
      <span className="h-px w-8 bg-border" />
      <span>{label}</span>
    </div>
  );
}
