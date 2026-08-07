"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Bug as BugIcon, CircleDot, ExternalLink, GitBranch, Trash2 } from "lucide-react";
import { PageHeader, EmptyState, Section } from "@/components/clearloop/primitives";
import { DetailShell, RailGroup, RailRow, Stat } from "@/components/clearloop/detail";
import { Chip, StatusChip, PriorityChip, BugStatusChip } from "@/components/clearloop/status";
import { useProject, useDeleteProject } from "@/lib/hooks/useProjects";
import { useGitHubInstallation, useConnectRepositoryToProject } from "@/lib/hooks/useGitHub";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading, error } = useProject(projectId);
  const deleteProject = useDeleteProject();
  const { data: githubInstallation } = useGitHubInstallation();
  const connectRepo = useConnectRepositoryToProject();
  const [repositoryId, setRepositoryId] = useState("");

  const unlinkedRepos = githubInstallation?.installations?.flatMap((i) => i.repositories.filter((r) => !r.projectId)) ?? [];

  const handleLinkRepo = async () => {
    if (!repositoryId) return;
    await connectRepo.mutateAsync({ repositoryId, projectId });
    setRepositoryId("");
  };

  const handleDelete = async () => {
    if (!confirm(`Delete project "${project?.name}"? This cannot be undone.`)) return;
    await deleteProject.mutateAsync(projectId);
    router.push("/dashboard/projects");
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (isLoading) return <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">Loading…</div>;
  if (error || !project) return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Project not found</p>
        <button onClick={() => router.push("/dashboard/projects")} className="mt-4 text-[13px] text-primary hover:underline">← Back to Projects</button>
      </div>
    </div>
  );

  const repo = project.repositories?.[0];

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/dashboard/projects" className="hover:text-foreground">Projects</Link>}
        title={project.name}
        description={project.description}
        meta={
          <>
            {project.key && <span className="rounded border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-[12px] text-muted-foreground">{project.key}</span>}
            {repo && (
              <span className="flex items-center gap-1.5 rounded border border-border px-1.5 py-0.5">
                <GitBranch className="size-3 text-muted-foreground" />
                <span className="font-mono text-[12px]">{repo.fullName}</span>
              </span>
            )}
            {repo ? (repo.webhookActive ? <Chip label="Synced" tone="green" solidDot /> : <Chip label="Not connected" tone="amber" solidDot />) : null}
          </>
        }
        actions={
          <button onClick={handleDelete} disabled={deleteProject.isPending} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-destructive/40 px-3 text-[12px] text-destructive hover:bg-destructive/10 disabled:opacity-50">
            <Trash2 className="size-3.5" /> {deleteProject.isPending ? "Deleting…" : "Delete"}
          </button>
        }
      />

      <DetailShell
        main={
          <>
            <Section
              title={`Features · ${project.features?.length ?? 0}`}
              icon={CircleDot}
              action={<Link href="/dashboard/features" className="text-[12px] text-muted-foreground hover:text-foreground">Open board</Link>}
            >
              {!project.features?.length ? (
                <EmptyState icon={CircleDot} title="No features yet" description="Features carry the why behind a change and give pull requests something to attach to." />
              ) : (
                project.features.map((f) => (
                  <Link key={f.id} href={`/dashboard/features/${f.id}`} className="row-hover flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
                    <span className="min-w-0 flex-1 truncate text-[13px]">{f.title}</span>
                    <StatusChip status={f.status} />
                    <PriorityChip priority={f.priority} />
                  </Link>
                ))
              )}
            </Section>

            <Section title={`Bugs · ${project.bugReports?.length ?? 0}`} icon={BugIcon}>
              {!project.bugReports?.length ? (
                <EmptyState icon={BugIcon} title="No bugs filed" description="Bugs filed against this project collect here." />
              ) : (
                project.bugReports.map((b) => (
                  <Link key={b.id} href={`/dashboard/bugs/${b.id}`} className="row-hover flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
                    <span className="min-w-0 flex-1 truncate text-[13px]">{b.title}</span>
                    <BugStatusChip status={b.status} />
                  </Link>
                ))
              )}
            </Section>
          </>
        }
        rail={
          <>
            <RailGroup title="Repository">
              {repo ? (
                <>
                  <RailRow label="Repo">
                    <a href={`https://github.com/${repo.fullName}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-mono text-[12px] hover:text-primary">
                      {repo.fullName} <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                    </a>
                  </RailRow>
                  <RailRow label="Status">
                    {repo.webhookActive ? <Chip label="Mirroring" tone="green" solidDot /> : <Chip label="Reconnect" tone="amber" solidDot />}
                  </RailRow>
                  <RailRow label="Visibility">
                    <span className="font-mono text-[12px] text-muted-foreground">{repo.isPrivate ? "Private" : "Public"}</span>
                  </RailRow>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-[12px] text-muted-foreground">No repository linked</p>
                  {unlinkedRepos.length > 0 && (
                    <>
                      <select value={repositoryId} onChange={(e) => setRepositoryId(e.target.value)} className="h-8 w-full rounded-md border border-border bg-surface px-2 text-[12px] outline-none">
                        <option value="">Select a repository</option>
                        {unlinkedRepos.map((r) => <option key={r.id} value={r.id}>{r.fullName}</option>)}
                      </select>
                      <button onClick={handleLinkRepo} disabled={!repositoryId || connectRepo.isPending} className="h-7 w-full rounded-md bg-primary text-[12px] font-medium text-primary-foreground disabled:opacity-50">
                        {connectRepo.isPending ? "Linking…" : "Link repository"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </RailGroup>

            <RailGroup title="Details">
              <RailRow label="Created"><span className="font-mono text-[12px] text-muted-foreground">{fmt(project.createdAt)}</span></RailRow>
              {(project.members?.length ?? 0) > 0 && (
                <RailRow label="Members"><span className="font-mono text-[12px]">{project.members!.length}</span></RailRow>
              )}
            </RailGroup>

            <div className="grid grid-cols-2 divide-x divide-border">
              <Stat label="Features" value={project.features?.length ?? 0} />
              <Stat label="Bugs" value={project.bugReports?.length ?? 0} />
            </div>

            <RailGroup title="Danger zone">
              <button onClick={handleDelete} disabled={deleteProject.isPending} className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-destructive/40 text-[12px] text-destructive hover:bg-destructive/10 disabled:opacity-50">
                <Trash2 className="size-3.5" /> Delete project
              </button>
            </RailGroup>
          </>
        }
      />
    </>
  );
}
