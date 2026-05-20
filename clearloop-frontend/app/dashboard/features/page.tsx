'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api/client';
import  { Feature, Project, FeatureStatus, FeaturePriority } from '@/types';

export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    reason: string;
    projectId: string;
    priority: FeaturePriority;
  }>({
    title: '',
    description: '',
    reason: '',
    projectId: '',
    priority: FeaturePriority.MEDIUM,
  });
  const [creating, setCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FeatureStatus | 'ALL'>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = auth.getToken();
      if (!token) return;

      const [featuresData, projectsData] = await Promise.all([
        api.getFeatures(token),
        api.getProjects(token),
      ]);

      setFeatures(featuresData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load data:', error);
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

      await api.createFeature(token, formData);
      setShowCreateModal(false);
      setFormData({ title: '', description: '', reason: '', projectId: '', priority: FeaturePriority.MEDIUM });
      loadData();
    } catch (error) {
      console.error('Failed to create feature:', error);
    } finally {
      setCreating(false);
    }
  };

  const filteredFeatures = filterStatus === 'ALL' 
    ? features 
    : features.filter(f => f.status === filterStatus);

  if (loading) {
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
          <h1 className="text-3xl font-semibold tracking-tight">Features</h1>
          <p className="mt-2 text-[15px] text-text-dim">
            Track and manage feature development
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover"
        >
          New Feature
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {['ALL', 'PLANNED', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as any)}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
              filterStatus === status
                ? 'bg-primary/10 text-primary-soft'
                : 'bg-surface text-text-muted hover:bg-surface-2 hover:text-foreground'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filteredFeatures.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-text-muted">No features found</p>
          {filterStatus === 'ALL' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover"
            >
              Create your first feature
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFeatures.map((feature) => (
            <div
              key={feature.id}
              className="rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{feature.title}</h3>
                  {feature.description && (
                    <p className="mt-1 text-[13px] text-text-muted line-clamp-2">
                      {feature.description}
                    </p>
                  )}
                  {feature.reason && (
                    <p className="mt-2 text-[12px] text-text-dim">
                      <span className="font-medium">Why:</span> {feature.reason}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                      feature.status === 'DONE'
                        ? 'bg-success/10 text-success'
                        : feature.status === 'IN_PROGRESS'
                        ? 'bg-primary/10 text-primary-soft'
                        : feature.status === 'IN_REVIEW'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-surface-2 text-text-muted'
                    }`}
                  >
                    {feature.status.replace('_', ' ')}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                      feature.priority === 'CRITICAL'
                        ? 'bg-danger/10 text-danger'
                        : feature.priority === 'HIGH'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-surface-2 text-text-muted'
                    }`}
                  >
                    {feature.priority}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6">
            <h2 className="text-xl font-semibold">Create Feature</h2>
            <form onSubmit={handleCreate} className="mt-6 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-foreground">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-foreground">
                  Why is this needed?
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={2}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-foreground">
                  Project
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  required
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-foreground">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as FeaturePriority })}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg border border-border bg-surface-2 px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
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
