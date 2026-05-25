'use client';

import { useState, useEffect } from 'react';
import { useWorkspace, useUpdateWorkspace } from '@/lib/hooks/useWorkspace';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useGitHubInstallation, useDisconnectGitHub } from '@/lib/hooks/useGitHub';
import { githubApi } from '@/lib/api/github';
import { useSearchParams } from 'next/navigation';

export default function SettingsPage() {
  const { data: workspace, isLoading } = useWorkspace();
  const { user } = useAuth();
  const updateWorkspace = useUpdateWorkspace();
  const { data: githubInstallation } = useGitHubInstallation();
  const disconnectGitHub = useDisconnectGitHub();
  const searchParams = useSearchParams();
  
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const githubStatus = searchParams.get('github');
    if (githubStatus === 'connected') {
      setSuccess('GitHub App connected successfully!');
    } else if (githubStatus === 'error') {
      setError('Failed to connect GitHub App');
    }
  }, [searchParams]);

  const handleConnectGitHub = () => {
    githubApi.connectGitHub();
  };

  const handleDisconnectGitHub = async () => {
    if (!confirm('Are you sure you want to disconnect GitHub? This will stop automatic PR linking.')) {
      return;
    }

    try {
      await disconnectGitHub.mutateAsync();
      setSuccess('GitHub App disconnected successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to disconnect GitHub');
    }
  };

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

        {/* GitHub App Integration */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">GitHub App Integration</h2>
          <p className="mt-1 text-[13px] text-text-dim">
            Connect GitHub App once - all repos auto-link PRs forever
          </p>

          {!githubInstallation?.connected ? (
            <div className="mt-6">
              <div className="rounded-lg border border-border bg-background p-4">
                <h3 className="text-[14px] font-medium text-foreground">How it works</h3>
                <ul className="mt-3 space-y-2 text-[13px] text-text-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-soft">1.</span>
                    <span>Click "Connect GitHub App" below</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-soft">2.</span>
                    <span>Select your organization and repositories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-soft">3.</span>
                    <span>Grant access - done forever!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-soft">4.</span>
                    <span>All PRs auto-link to features/bugs automatically</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 p-4">
                <h3 className="text-[14px] font-medium text-primary-soft">✨ Zero Developer Effort</h3>
                <p className="mt-2 text-[13px] text-text-muted">
                  Developers just create branches like <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px]">feature/[uuid]</code> and open PRs. Everything else is automatic.
                </p>
              </div>

              <button
                onClick={handleConnectGitHub}
                className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-[14px] font-medium text-foreground transition-colors hover:bg-primary-hover"
              >
                Connect GitHub App
              </button>

              <div className="mt-4 rounded-lg border border-border bg-background p-4">
                <h3 className="text-[13px] font-medium text-foreground">Fallback: Manual Linking</h3>
                <p className="mt-2 text-[12px] text-text-muted">
                  If you prefer not to install the GitHub App, you can manually link PRs in the Pull Requests page.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <div className="rounded-lg border border-success/30 bg-success/10 p-4">
                <h3 className="text-[14px] font-medium text-success">✓ GitHub App Connected</h3>
                <p className="mt-2 text-[13px] text-text-muted">
                  All PRs in connected repos will automatically link to features and bugs based on branch names.
                </p>
              </div>

              {githubInstallation.projects && githubInstallation.projects.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-[13px] font-medium text-foreground">Connected Repositories ({githubInstallation.projects.length})</h3>
                  <div className="mt-2 space-y-2">
                    {githubInstallation.projects.map((project) => (
                      <div key={project.id} className="rounded-lg border border-border bg-background p-3">
                        <p className="text-[13px] font-medium text-foreground">{project.name}</p>
                        <p className="mt-1 text-[12px] text-text-dim">{project.githubRepoUrl}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-lg border border-border bg-background p-4">
                <h3 className="text-[13px] font-medium text-foreground">Branch Naming Patterns</h3>
                <div className="mt-2 space-y-2 text-[12px]">
                  <div>
                    <span className="font-medium text-foreground">For Features:</span>
                    <code className="ml-2 rounded bg-surface-2 px-2 py-1 font-mono text-[11px] text-text-muted">feature/[feature-uuid]</code>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">For Bugs:</span>
                    <code className="ml-2 rounded bg-surface-2 px-2 py-1 font-mono text-[11px] text-text-muted">bug/[bug-uuid]</code>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <button
                  onClick={handleDisconnectGitHub}
                  disabled={disconnectGitHub.isPending}
                  className="mt-6 w-full rounded-lg border border-danger bg-danger/10 px-4 py-3 text-[14px] font-medium text-danger transition-colors hover:bg-danger/20 disabled:opacity-50"
                >
                  {disconnectGitHub.isPending ? 'Disconnecting...' : 'Disconnect GitHub App'}
                </button>
              )}
            </div>
          )}
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
