"use client";

import { useState } from "react";
import Link from "next/link";
import { Bug as BugIcon, CircleDot, FolderGit2, GitBranch, GitPullRequest, Plus } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/clearloop/primitives";
import { Toolbar, SearchField, ViewToggle, ResultCount, type ViewMode } from "@/components/clearloop/toolbar";
import { Chip } from "@/components/clearloop/status";
import { useProjects, useCreateProject, useDeleteProject } from "@/lib/hooks/useProjects";
import { useGitHubInstallation, useConnectRepositoryToProject } from "@/lib/hooks/useGitHub";

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const { data: githubInstallation } = useGitHubInstallation();
  const connectRepo = useConnectRepositoryToProject();

  const [q, setQ] = useState("");
  const [view, setView] = useState<ViewMode>("card");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [repositoryId, setRepositoryId] = useState("");
  const [error, setError] = useState("");

  const unlinkedRepos = githubInstallation?.installations?.flatMap((i) => i.repositories.filter((r) => !r.projectId)) ?? [];

  const rows = (projects || []).filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const project = await createProject.mutateAsync(form);
      if (repositoryId) {
        try { await connectRepo.mutateAsync({ repositoryId, projectId: project.id }); }
        catch { setError("Project created, but linking the repository failed. Link it from the project page."); setShowCreate(false); return; }
      }
      setShowCreate(false);
      setForm({ name: "", description: "" });
      setRepositoryId("");
    } catch { setError("Failed to create project. Please try again."); }
  };

  if (isLoading) return <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">Loading projects…</div>;

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        description="Each project mirrors one GitHub repository. Features, bugs and pull requests hang off it."
        actions={
          <button onClick={() => setShowCreate(true)} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground">
            <Plus className="size-3.5" /> New project
          </button>
        }
      />

      <Toolbar>
        <SearchField value={q} onChange={setQ} placeholder="Search projects…" />
        <ViewToggle value={view} onChange={setView} modes={["card", "table"]} />
        <ResultCount count={rows.length} noun="project" />
      </Toolbar>

      <div className="p-6">
        {rows.length === 0 ? (
          <div className="panel">
            <EmptyState
              icon={FolderGit2}
              title={q ? "No projects match that search" : "No projects yet"}
              description={q ? "Try a different name or clear the search." : "Create a project and connect a GitHub repository to start tracking work."}
              action={
                <button onClick={() => { setQ(""); if (!q) setShowCreate(true); }} className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground">
                  {q ? "Clear search" : "New project"}
                </button>
              }
            />
          </div>
        ) : view === "card" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((p) => {
              const repo = p.repositories?.[0];
              return (
                <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="panel lift block p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {p.key && <span className="rounded border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{p.key}</span>}
                        <span className="truncate text-[14px] font-semibold">{p.name}</span>
                      </div>
                      {p.description && <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">{p.description}</p>}
                    </div>
                  </div>

                  {repo ? (
                    <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-surface-raised px-2.5 py-1.5">
                      <GitBranch className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate font-mono text-[12px]">{repo.fullName}</span>
                      {repo.webhookActive
                        ? <Chip label="Synced" tone="green" solidDot className="ml-auto" />
                        : <Chip label="Not connected" tone="amber" solidDot className="ml-auto" />}
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-2 rounded-md border border-dashed border-border px-2.5 py-1.5 text-[12px] text-muted-foreground">
                      <GitBranch className="size-3.5" /> No repository linked
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-4 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CircleDot className="size-3.5" /><span className="tnum">{p.features?.length ?? 0}</span></span>
                    <span className="flex items-center gap-1.5"><BugIcon className="size-3.5" /><span className="tnum">{p.bugReports?.length ?? 0}</span></span>

                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="panel overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border bg-surface-raised px-4 py-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              <span className="flex-1">Project</span>
              <span className="hidden w-[200px] md:block">Repository</span>
              <span className="w-[52px] text-right">Feat</span>
              <span className="w-[52px] text-right">Bugs</span>
            </div>
            {rows.map((p) => {
              const repo = p.repositories?.[0];
              return (
                <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="row-hover flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
                  <span className="min-w-0 flex-1 truncate text-[13px]">{p.name}</span>
                  <span className="hidden w-[200px] shrink-0 truncate font-mono text-[12px] text-muted-foreground md:block">{repo?.fullName ?? "—"}</span>
                  <span className="w-[52px] shrink-0 text-right font-mono text-[12px]">{p.features?.length ?? 0}</span>
                  <span className="w-[52px] shrink-0 text-right font-mono text-[12px]">{p.bugReports?.length ?? 0}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-lg border border-border bg-[var(--popover)] p-5 shadow-xl">
            <h2 className="text-[16px] font-semibold">New project</h2>
            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{error}</div>}
              <div>
                <label className="text-[12px] font-medium">Project name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[12px] font-medium">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[12px] font-medium">GitHub repository</label>
                {unlinkedRepos.length > 0 ? (
                  <select value={repositoryId} onChange={(e) => setRepositoryId(e.target.value)} className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none">
                    <option value="">No repository — link later</option>
                    {unlinkedRepos.map((r) => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                  </select>
                ) : (
                  <p className="mt-1.5 text-[12px] text-muted-foreground">{githubInstallation?.connected ? "No unlinked repositories available." : "Connect GitHub in Settings to link a repository."}</p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => { setShowCreate(false); setError(""); }} className="h-8 rounded-md border border-border px-3 text-[12px]">Cancel</button>
                <button type="submit" disabled={createProject.isPending || connectRepo.isPending} className="h-8 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground disabled:opacity-50">
                  {createProject.isPending || connectRepo.isPending ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
