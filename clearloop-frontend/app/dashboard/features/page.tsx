"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CircleDot, Plus } from "lucide-react";
import { PageHeader, EmptyState, Section } from "@/components/clearloop/primitives";
import { Toolbar, SearchField, FilterMenu, SortMenu, ViewToggle, ResultCount, type ViewMode } from "@/components/clearloop/toolbar";
import { StatusChip, PriorityChip, toneColor } from "@/components/clearloop/status";
import { useFeatures, useCreateFeature } from "@/lib/hooks/useFeatures";
import { useProjects } from "@/lib/hooks/useProjects";
import { useUsers } from "@/lib/hooks/useUsers";

const STATUS_OPTIONS = [
  { value: "PLANNED", label: "Planned", color: toneColor("slate") },
  { value: "IN_PROGRESS", label: "In Progress", color: toneColor("blue") },
  { value: "IN_REVIEW", label: "In Review", color: toneColor("amber") },
  { value: "DONE", label: "Done", color: toneColor("green") },
  { value: "CANCELLED", label: "Cancelled", color: toneColor("slate") },
];
const PRIORITY_OPTIONS = [
  { value: "CRITICAL", label: "Critical", color: toneColor("red") },
  { value: "HIGH", label: "High", color: toneColor("orange") },
  { value: "MEDIUM", label: "Medium", color: toneColor("blue") },
  { value: "LOW", label: "Low", color: toneColor("slate") },
];
const SORT_OPTIONS = [
  { value: "priority", label: "Priority" },
  { value: "status", label: "Status" },
  { value: "newest", label: "Newest" },
];
const PRIORITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const STATUS_ORDER = ["PLANNED", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"];

export default function FeaturesPage() {
  const searchParams = useSearchParams();
  const { data: features, isLoading } = useFeatures();
  const { data: projects } = useProjects();
  const { data: users } = useUsers();
  const createFeature = useCreateFeature();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [sort, setSort] = useState("priority");
  const [view, setView] = useState<ViewMode>("table");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", reason: "", projectId: "", assignedToId: "", priority: "MEDIUM" });

  useEffect(() => { if (searchParams.get("create") === "1") setShowCreate(true); }, [searchParams]);

  const toggle = (set: (fn: (v: string[]) => string[]) => void) => (v: string) =>
    set((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  const rows = (features || [])
    .filter((f) => q ? f.title.toLowerCase().includes(q.toLowerCase()) : true)
    .filter((f) => statusFilter.length ? statusFilter.includes(f.status) : true)
    .filter((f) => priorityFilter.length ? priorityFilter.includes(f.priority) : true)
    .sort((a, b) => {
      if (sort === "priority") return PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
      if (sort === "status") return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const clearAll = () => { setQ(""); setStatusFilter([]); setPriorityFilter([]); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await createFeature.mutateAsync(form); setShowCreate(false); setForm({ title: "", description: "", reason: "", projectId: "", assignedToId: "", priority: "MEDIUM" }); }
    catch { /* error shown via mutation state */ }
  };

  if (isLoading) return <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">Loading features…</div>;

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Features"
        description="Every planned, in-flight and shipped change, with the reasoning attached."
        actions={
          <button onClick={() => setShowCreate(true)} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground">
            <Plus className="size-3.5" /> New feature
          </button>
        }
      />

      <Toolbar>
        <SearchField value={q} onChange={setQ} placeholder="Search features…" />
        <FilterMenu label="Status" selected={statusFilter} onToggle={toggle(setStatusFilter)} options={STATUS_OPTIONS} />
        <FilterMenu label="Priority" selected={priorityFilter} onToggle={toggle(setPriorityFilter)} options={PRIORITY_OPTIONS} />
        <SortMenu value={sort} onChange={setSort} options={SORT_OPTIONS} />
        <ViewToggle value={view} onChange={setView} modes={["table", "card"]} />
        <ResultCount count={rows.length} noun="feature" />
      </Toolbar>

      <div className="p-6">
        {rows.length === 0 ? (
          <div className="panel">
            <EmptyState
              icon={CircleDot}
              title="Nothing matches those filters"
              description="Loosen the filters, or create a feature to start a new thread of work."
              action={
                <div className="flex gap-2">
                  <button onClick={clearAll} className="inline-flex h-8 items-center rounded-md border border-border px-3 text-[12px]">Clear filters</button>
                  <button onClick={() => setShowCreate(true)} className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground">New feature</button>
                </div>
              }
            />
          </div>
        ) : view === "table" ? (
          <div className="panel overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border bg-surface-raised px-4 py-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              <span className="flex-1">Feature</span>
              <span className="hidden w-[120px] lg:block">Project</span>
              <span className="w-[110px]">Status</span>
              <span className="w-[90px]">Priority</span>
            </div>
            {rows.map((f) => (
              <Link key={f.id} href={`/dashboard/features/${f.id}`} className="row-hover flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
                <span className="min-w-0 flex-1 truncate text-[13px]">{f.title}</span>
                <span className="hidden w-[120px] shrink-0 truncate font-mono text-[12px] text-muted-foreground lg:block">{f.project?.name}</span>
                <span className="w-[110px] shrink-0"><StatusChip status={f.status} /></span>
                <span className="w-[90px] shrink-0"><PriorityChip priority={f.priority} /></span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((f) => (
              <Link key={f.id} href={`/dashboard/features/${f.id}`} className="panel lift block p-3.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px] text-muted-foreground">{f.project?.name}</span>
                </div>
                <h3 className="mt-2 text-[13.5px] font-medium leading-snug">{f.title}</h3>
                {f.reason && <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">{f.reason}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <PriorityChip priority={f.priority} />
                  <StatusChip status={f.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-lg border border-border bg-[var(--popover)] p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-[16px] font-semibold">New feature</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">Track a new feature from client request to release.</p>
            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              {createFeature.isError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                  Failed to create feature. Please try again.
                </div>
              )}
              <div>
                <label className="text-[12px] font-medium">Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Add dark mode support" className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[12px] font-medium">Reason (Why) *</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required rows={2} placeholder="Why is this being built?" className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[12px] font-medium">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Full requirement details…" className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium">Project *</label>
                  <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} required className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none">
                    <option value="">Select project</option>
                    {projects?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-medium">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none">
                    {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[12px] font-medium">Assign to</label>
                <select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })} className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none">
                  <option value="">Unassigned</option>
                  {users?.filter((u) => u.isActive).map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="h-8 rounded-md border border-border px-3 text-[12px]">Cancel</button>
                <button type="submit" disabled={createFeature.isPending} className="h-8 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground disabled:opacity-50">
                  {createFeature.isPending ? "Creating…" : "Create feature"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
