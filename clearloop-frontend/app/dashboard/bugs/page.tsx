"use client";

import { useState } from "react";
import Link from "next/link";
import { Bug as BugIcon, Plus } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/clearloop/primitives";
import { Toolbar, SearchField, FilterMenu, SortMenu, ResultCount } from "@/components/clearloop/toolbar";
import { SeverityChip, BugStatusChip, toneColor } from "@/components/clearloop/status";
import { useBugs, useCreateBug } from "@/lib/hooks/useBugs";
import { useFeatures } from "@/lib/hooks/useFeatures";
import { useProjects } from "@/lib/hooks/useProjects";

const SEV_OPTIONS = [
  { value: "CRITICAL", label: "Critical", color: toneColor("red") },
  { value: "HIGH", label: "High", color: toneColor("orange") },
  { value: "MEDIUM", label: "Medium", color: toneColor("amber") },
  { value: "LOW", label: "Low", color: toneColor("slate") },
];
const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open", color: toneColor("red") },
  { value: "IN_PROGRESS", label: "In Progress", color: toneColor("blue") },
  { value: "RESOLVED", label: "Resolved", color: toneColor("green") },
  { value: "CLOSED", label: "Closed", color: toneColor("slate") },
];
const SEV_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const STATUS_ORDER = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export default function BugsPage() {
  const { data: bugs, isLoading } = useBugs();
  const { data: projects } = useProjects();
  const createBug = useCreateBug();

  const [q, setQ] = useState("");
  const [sevFilter, setSevFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sort, setSort] = useState("severity");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", severity: "MEDIUM", source: "", projectId: "", featureId: "" });
  const { data: features } = useFeatures(form.projectId || undefined);

  const toggle = (set: (fn: (v: string[]) => string[]) => void) => (v: string) =>
    set((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  const rows = (bugs || [])
    .filter((b) => q ? b.title.toLowerCase().includes(q.toLowerCase()) : true)
    .filter((b) => sevFilter.length ? sevFilter.includes(b.severity) : true)
    .filter((b) => statusFilter.length ? statusFilter.includes(b.status) : true)
    .sort((a, b) =>
      sort === "severity" ? SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)
        : sort === "status" ? STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { source, ...rest } = form;
      await createBug.mutateAsync({ ...rest, description: `**Source:** ${source}\n\n${rest.description}`, featureId: rest.featureId || undefined, severity: rest.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" });
      setShowCreate(false);
      setForm({ title: "", description: "", severity: "MEDIUM", source: "", projectId: "", featureId: "" });
    } catch { /* mutation state retains error */ }
  };

  if (isLoading) return <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">Loading bugs…</div>;

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Bugs"
        description="Severity-first triage. Every bug can point at the feature and pull request that introduced it."
        actions={
          <button onClick={() => setShowCreate(true)} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground">
            <Plus className="size-3.5" /> Report bug
          </button>
        }
      />

      <Toolbar>
        <SearchField value={q} onChange={setQ} placeholder="Search bugs…" />
        <FilterMenu label="Severity" selected={sevFilter} onToggle={toggle(setSevFilter)} options={SEV_OPTIONS} />
        <FilterMenu label="Status" selected={statusFilter} onToggle={toggle(setStatusFilter)} options={STATUS_OPTIONS} />
        <SortMenu value={sort} onChange={setSort} options={[{ value: "severity", label: "Severity" }, { value: "status", label: "Status" }, { value: "newest", label: "Newest" }]} />
        <ResultCount count={rows.length} noun="bug" />
      </Toolbar>

      <div className="p-6">
        {rows.length === 0 ? (
          <div className="panel">
            <EmptyState
              icon={BugIcon}
              title="Clean queue"
              description="Nothing matches these filters. Either the build is healthy or the filters are too tight."
              action={
                <button onClick={() => { setQ(""); setSevFilter([]); setStatusFilter([]); }} className="inline-flex h-8 items-center rounded-md border border-border px-3 text-[12px]">
                  Clear filters
                </button>
              }
            />
          </div>
        ) : (
          <div className="panel overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border bg-surface-raised px-4 py-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              <span className="flex-1">Bug</span>
              <span className="w-[90px]">Severity</span>
              <span className="w-[110px]">Status</span>
              <span className="hidden w-[80px] lg:block">Source</span>
            </div>
            {rows.map((b) => {
              const sourceMatch = b.description?.match(/\*\*Source:\*\*\s*(.+?)\n/);
              const source = sourceMatch ? sourceMatch[1] : "—";
              return (
                <Link key={b.id} href={`/dashboard/bugs/${b.id}`} className="row-hover flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
                  <span className="min-w-0 flex-1 truncate text-[13px]">{b.title}</span>
                  <span className="w-[90px] shrink-0"><SeverityChip severity={b.severity} /></span>
                  <span className="w-[110px] shrink-0"><BugStatusChip status={b.status} /></span>
                  <span className="hidden w-[80px] shrink-0 truncate font-mono text-[12px] text-muted-foreground lg:block">{source}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-lg border border-border bg-[var(--popover)] p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-[16px] font-semibold">Report bug</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">Track bugs from any source — Excel, email, client calls, QA testing.</p>
            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              {createBug.isError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                  Failed to report bug. Please try again.
                </div>
              )}
              <div>
                <label className="text-[12px] font-medium">Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Login button not working on mobile" className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[12px] font-medium">Source *</label>
                <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} required placeholder="e.g. Client email, QA testing, Sentry" className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[12px] font-medium">Description *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} placeholder="Steps to reproduce, expected vs actual…" className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium">Severity</label>
                  <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none">
                    {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-medium">Project *</label>
                  <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value, featureId: "" })} required className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none">
                    <option value="">Select project</option>
                    {projects?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[12px] font-medium">Link to feature (optional)</label>
                <select value={form.featureId} onChange={(e) => setForm({ ...form, featureId: e.target.value })} disabled={!form.projectId} className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none disabled:opacity-50">
                  <option value="">No feature linked</option>
                  {features?.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="h-8 rounded-md border border-border px-3 text-[12px]">Cancel</button>
                <button type="submit" disabled={createBug.isPending} className="h-8 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground disabled:opacity-50">
                  {createBug.isPending ? "Reporting…" : "Report bug"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
