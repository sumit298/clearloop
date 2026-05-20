'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api/client';
import type { Project } from '@/types';
import Link from 'next/link';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    githubRepoUrl: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const token = auth.getToken();
      if (!token) return;

      const data = await api.getProjects(token);
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const token = auth.getToken();
      if (!token) return;

      await api.createProject(token, formData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', githubRepoUrl: '' });
      loadProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className=\"flex h-full items-center justify-center\">
        <div className=\"text-text-muted\">Loading...</div>
      </div>
    );
  }

  return (
    <div className=\"p-8\">
      <div className=\"mb-8 flex items-center justify-between\">
        <div>
          <h1 className=\"text-3xl font-semibold tracking-tight\">Projects</h1>
          <p className=\"mt-2 text-[15px] text-text-dim\">
            Manage your engineering projects
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className=\"rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover\"
        >
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className=\"rounded-xl border border-border bg-surface p-12 text-center\">
          <p className=\"text-text-muted\">No projects yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className=\"mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover\"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className=\"grid gap-6 sm:grid-cols-2 lg:grid-cols-3\">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className=\"block rounded-xl border border-border bg-surface p-6 transition-colors hover:bg-surface-2\"
            >
              <h3 className=\"font-semibold text-foreground\">{project.name}</h3>
              {project.description && (
                <p className=\"mt-2 text-[13px] text-text-muted line-clamp-2\">
                  {project.description}
                </p>
              )}
              {project.githubRepoUrl && (
                <div className=\"mt-4 flex items-center gap-2 text-[12px] text-text-muted\">
                  <span>⚡</span>
                  <span className=\"truncate\">{project.githubRepoUrl.replace('https://github.com/', '')}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className=\"fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4\">
          <div className=\"w-full max-w-md rounded-xl border border-border bg-surface p-6\">
            <h2 className=\"text-xl font-semibold\">Create Project</h2>
            <form onSubmit={handleCreate} className=\"mt-6 space-y-4\">
              <div>
                <label className=\"block text-[13px] font-medium text-foreground\">
                  Project Name
                </label>
                <input
                  type=\"text\"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className=\"mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20\"
                />
              </div>
              <div>
                <label className=\"block text-[13px] font-medium text-foreground\">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className=\"mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20\"
                />
              </div>
              <div>
                <label className=\"block text-[13px] font-medium text-foreground\">
                  GitHub Repository URL
                </label>
                <input
                  type=\"url\"
                  value={formData.githubRepoUrl}
                  onChange={(e) => setFormData({ ...formData, githubRepoUrl: e.target.value })}
                  placeholder=\"https://github.com/user/repo\"
                  className=\"mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20\"
                />
              </div>
              <div className=\"flex gap-3\">
                <button
                  type=\"button\"
                  onClick={() => setShowCreateModal(false)}
                  className=\"flex-1 rounded-lg border border-border bg-surface-2 px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-surface\"
                >
                  Cancel
                </button>
                <button
                  type=\"submit\"
                  disabled={creating}
                  className=\"flex-1 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover disabled:opacity-50\"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
