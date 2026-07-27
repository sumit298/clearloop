"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useProject, useDeleteProject } from "@/lib/hooks/useProjects";
import {
  useGitHubInstallation,
  useConnectRepositoryToProject,
} from "@/lib/hooks/useGitHub";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading, error } = useProject(projectId);
  const deleteProject = useDeleteProject();
  const { data: githubInstallation } = useGitHubInstallation();
  const connectRepo = useConnectRepositoryToProject();

  const [repositoryId, setRepositoryId] = useState("");

  const unlinkedRepos =
    githubInstallation?.installations?.flatMap((installation) =>
      installation.repositories.filter((repo) => !repo.projectId),
    ) ?? [];

  const handleLinkRepo = async () => {
    if (!repositoryId) return;
    await connectRepo.mutateAsync({ repositoryId, projectId });
    setRepositoryId("");
  };

  const handleDelete = async () => {
    if (!confirm(`Delete project "${project?.name}"? This cannot be undone.`)) {
      return;
    }
    await deleteProject.mutateAsync(projectId);
    router.push("/dashboard/projects");
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Project not found</p>
          <button
            onClick={() => router.push("/dashboard/projects")}
            className="mt-4 text-[13px] text-primary-soft hover:underline"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/projects")}
          className="mb-4 text-[13px] text-text-dim hover:text-foreground"
        >
          ← Back to Projects
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-2 text-[15px] text-text-dim">
                {project.description}
              </p>
            )}
          </div>
          <button
            onClick={handleDelete}
            disabled={deleteProject.isPending}
            className="rounded-lg border border-danger/30 px-4 py-2 text-[13px] font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
          >
            {deleteProject.isPending ? "Deleting..." : "Delete Project"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Features */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">
              Features ({project.features?.length || 0})
            </h2>

            {!project.features || project.features.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-border bg-background p-8 text-center">
                <p className="text-[13px] text-text-muted">No features yet</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {project.features.map((feature) => (
                  <Link
                    key={feature.id}
                    href={`/dashboard/features/${feature.id}`}
                    className="block rounded-lg border border-border bg-background p-4 transition-colors hover:bg-surface-2"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-medium text-foreground">
                        {feature.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                            feature.status === "DONE"
                              ? "bg-success/10 text-success"
                              : feature.status === "IN_PROGRESS"
                              ? "bg-primary/10 text-primary-soft"
                              : "bg-surface-2 text-text-muted"
                          }`}
                        >
                          {feature.status.replace("_", " ")}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                            feature.priority === "CRITICAL"
                              ? "bg-danger/10 text-danger"
                              : feature.priority === "HIGH"
                              ? "bg-warning/10 text-warning"
                              : "bg-surface-2 text-text-muted"
                          }`}
                        >
                          {feature.priority}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Bugs */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">
              Bugs ({project.bugReports?.length || 0})
            </h2>

            {!project.bugReports || project.bugReports.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-border bg-background p-8 text-center">
                <p className="text-[13px] text-text-muted">No bugs reported</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {project.bugReports.map((bug) => (
                  <Link
                    key={bug.id}
                    href={`/dashboard/bugs/${bug.id}`}
                    className="block rounded-lg border border-border bg-background p-4 transition-colors hover:bg-surface-2"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-medium text-foreground">
                        {bug.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                            bug.status === "RESOLVED"
                              ? "bg-success/10 text-success"
                              : bug.status === "IN_PROGRESS"
                              ? "bg-primary/10 text-primary-soft"
                              : "bg-surface-2 text-text-muted"
                          }`}
                        >
                          {bug.status.replace("_", " ")}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                            bug.severity === "CRITICAL"
                              ? "bg-danger/10 text-danger"
                              : bug.severity === "HIGH"
                              ? "bg-warning/10 text-warning"
                              : "bg-surface-2 text-text-muted"
                          }`}
                        >
                          {bug.severity}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* GitHub Repository */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">GitHub Repository</h2>

            {project.repositories && project.repositories.length > 0 ? (
              <div className="mt-4 space-y-3">
                {project.repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="rounded-lg border border-border bg-background p-3"
                  >
                    <p className="text-[13px] font-medium text-foreground">
                      {repo.fullName}
                    </p>
                    <p className="mt-1 text-[12px] text-text-dim">
                      {repo.isPrivate ? "Private" : "Public"} ·{" "}
                      {repo.webhookActive ? "Webhook active" : "Webhook inactive"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-[13px] text-text-muted">
                  No repository linked
                </p>
                {unlinkedRepos.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    <select
                      value={repositoryId}
                      onChange={(e) => setRepositoryId(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                    >
                      <option value="">Select a repository</option>
                      {unlinkedRepos.map((repo) => (
                        <option key={repo.id} value={repo.id}>
                          {repo.fullName}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleLinkRepo}
                      disabled={!repositoryId || connectRepo.isPending}
                      className="w-full rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
                    >
                      {connectRepo.isPending ? "Linking..." : "Link Repository"}
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-[12px] text-text-dim">
                    {githubInstallation?.connected
                      ? "No unlinked repositories available. Connect more in Settings."
                      : "Connect GitHub in Settings to link a repository."}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Members */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">
              Members ({project.members?.length || 0})
            </h2>

            {!project.members || project.members.length === 0 ? (
              <div className="mt-4 text-[13px] text-text-muted">
                No members yet
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {project.members.map((pm) => (
                  <div key={pm.id} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-[12px] font-medium text-primary-soft">
                      {(pm.member.name?.charAt(0) ?? "?").toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-foreground">
                        {pm.member.name}
                      </p>
                      <p className="text-[12px] text-text-dim">
                        {pm.member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Details</h2>
            <div className="mt-4 space-y-3">
              {project.key && (
                <div>
                  <h3 className="text-[13px] font-medium text-text-dim">Key</h3>
                  <p className="mt-1 text-[14px] text-foreground">
                    {project.key}
                  </p>
                </div>
              )}
              <div>
                <h3 className="text-[13px] font-medium text-text-dim">
                  Created
                </h3>
                <p className="mt-1 text-[14px] text-foreground">
                  {formatDate(project.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
