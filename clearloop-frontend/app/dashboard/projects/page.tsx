"use client";

import { useState } from "react";
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
} from "@/lib/hooks/useProjects";
import {
  useGitHubInstallation,
  useConnectRepositoryToProject,
} from "@/lib/hooks/useGitHub";
import Link from "next/link";

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const { data: githubInstallation } = useGitHubInstallation();
  const connectRepo = useConnectRepositoryToProject();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [repositoryId, setRepositoryId] = useState("");
  const [error, setError] = useState("");

  // Repos that are already synced from GitHub but not yet linked to any
  // project. Without this step, a synced repo's PRs will always be
  // rejected at the "not linked to a project" check, regardless of how
  // correctly a branch is named.
  const unlinkedRepos =
    githubInstallation?.installations?.flatMap((installation) =>
      installation.repositories.filter((repo) => !repo.projectId),
    ) ?? [];

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setRepositoryId("");
    setError("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const project = await createProject.mutateAsync(formData);

      if (repositoryId) {
        try {
          await connectRepo.mutateAsync({ repositoryId, projectId: project.id });
        } catch (err: any) {
          // Project was created successfully; only the repo link failed.
          // Don't roll back the project for this — surface it and let the
          // person retry the link from Settings instead.
          setError(
            "Project created, but linking the repository failed. You can link it from Settings.",
          );
          setShowCreateModal(false);
          resetForm();
          return;
        }
      }

      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create project:", error);
      setError("Failed to create project. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-2 text-[15px] text-text-dim">
            Manage your engineering projects
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover"
        >
          New Project
        </button>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-text-muted">No projects yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="block rounded-xl border border-border bg-surface p-6 transition-colors hover:bg-surface-2"
            >
              <h3 className="font-semibold text-foreground">{project.name}</h3>
              {project.description && (
                <p className="mt-2 text-[13px] text-text-muted line-clamp-2">
                  {project.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6">
            <h2 className="text-xl font-semibold">Create Project</h2>
            <form onSubmit={handleCreate} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-danger">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[13px] font-medium text-foreground">
                  Project Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-foreground">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-foreground">
                  GitHub Repository
                </label>
                {unlinkedRepos.length > 0 ? (
                  <select
                    value={repositoryId}
                    onChange={(e) => setRepositoryId(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                  >
                    <option value="">No repository — link later in Settings</option>
                    {unlinkedRepos.map((repo) => (
                      <option key={repo.id} value={repo.id}>
                        {repo.fullName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-2 text-[12px] text-text-dim">
                    {githubInstallation?.connected
                      ? "No unlinked repositories available. Connect more in Settings."
                      : "Connect GitHub in Settings to link a repository."}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 rounded-lg border border-border bg-surface-2 px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProject.isPending || connectRepo.isPending}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
                >
                  {createProject.isPending || connectRepo.isPending
                    ? "Creating..."
                    : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}