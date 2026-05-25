'use client';

import { useState } from 'react';
import { useWorkspace, useUpdateWorkspace } from '@/lib/hooks/useWorkspace';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function SettingsPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const { user } = useAuth();
  const updateWorkspace = useUpdateWorkspace();
  
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateWorkspace.mutateAsync({ name });
      setSuccess('Workspace updated successfully');
      setName('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update workspace');
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
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Workspace Settings</h1>
        <p className="mt-2 text-[15px] text-text-dim">
          Manage your workspace configuration
        </p>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* Workspace Info */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">Workspace Information</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-text-muted">
                Workspace Name
              </label>
              <div className="mt-2 text-[15px] text-foreground">{workspace?.name}</div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-muted">
                Workspace Slug
              </label>
              <div className="mt-2 text-[15px] text-foreground font-mono">{workspace?.slug}</div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-muted">
                Plan
              </label>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[13px] font-medium text-primary-soft">
                  {workspace?.plan}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* GitHub Integration */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">GitHub Integration</h2>
          <p className="mt-1 text-[13px] text-text-muted">
            Connect GitHub to auto-link PRs to features and bugs
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-border bg-background p-4">
              <h3 className="text-[14px] font-medium text-foreground">How it works</h3>
              <ul className="mt-3 space-y-2 text-[13px] text-text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-primary-soft">1.</span>
                  <span>Add GitHub repo URL when creating a project</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-soft">2.</span>
                  <span>Create branch with name: <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px]">feature/[feature-id]</code> or <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px]">bug/[bug-id]</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-soft">3.</span>
                  <span>Open PR on GitHub - webhook auto-links to ClearLoop</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-soft">4.</span>
                  <span>PR merged → Status auto-updates in ClearLoop</span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
              <h3 className="text-[14px] font-medium text-warning">Setup Required</h3>
              <p className="mt-2 text-[13px] text-text-muted">
                To enable automatic PR linking, configure GitHub webhook:
              </p>
              <ol className="mt-3 space-y-2 text-[13px] text-text-muted">
                <li>1. Go to your GitHub repo → Settings → Webhooks</li>
                <li>2. Add webhook URL: <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px]">https://clearloop.duckdns.org/github/webhook</code></li>
                <li>3. Content type: <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px]">application/json</code></li>
                <li>4. Select events: <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px]">Pull requests</code></li>
                <li>5. Save webhook</li>
              </ol>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <h3 className="text-[14px] font-medium text-foreground">Branch Naming Patterns</h3>
              <div className="mt-3 space-y-2 text-[13px]">
                <div>
                  <span className="font-medium text-foreground">For Features:</span>
                  <div className="mt-1 space-y-1">
                    <code className="block rounded bg-surface-2 px-2 py-1 font-mono text-[12px] text-text-muted">feature/[feature-uuid]</code>
                    <code className="block rounded bg-surface-2 px-2 py-1 font-mono text-[12px] text-text-muted">feat/[feature-uuid]</code>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-medium text-foreground">For Bugs:</span>
                  <div className="mt-1 space-y-1">
                    <code className="block rounded bg-surface-2 px-2 py-1 font-mono text-[12px] text-text-muted">bug/[bug-uuid]</code>
                    <code className="block rounded bg-surface-2 px-2 py-1 font-mono text-[12px] text-text-muted">fix/[bug-uuid]</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Update Workspace (Admin Only) */}
        {isAdmin && (
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Update Workspace</h2>
            <p className="mt-1 text-[13px] text-text-muted">
              Change your workspace name
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-danger">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-[13px] text-success">
                  {success}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-[13px] font-medium text-foreground">
                  New Workspace Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder={workspace?.name}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-[14px] text-foreground placeholder:text-text-muted focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                />
              </div>

              <button
                type="submit"
                disabled={updateWorkspace.isPending || !name}
                className="rounded-lg bg-primary px-4 py-2.5 text-[14px] font-medium text-foreground transition-all hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateWorkspace.isPending ? 'Updating...' : 'Update Workspace'}
              </button>
            </form>
          </div>
        )}

        {!isAdmin && (
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="text-[13px] text-text-muted">
              Only workspace admins can update workspace settings.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
