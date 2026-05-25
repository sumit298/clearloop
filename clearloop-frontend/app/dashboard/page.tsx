'use client';

import { useWorkspaceStats } from '@/lib/hooks/useWorkspace';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: stats, isLoading } = useWorkspaceStats();

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
        <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-2 text-[15px] text-text-dim">
          Track your engineering context in one place
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="text-[13px] font-medium text-text-muted">Projects</div>
          <div className="mt-2 text-3xl font-semibold text-foreground">{stats?.projects.total || 0}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="text-[13px] font-medium text-text-muted">Total Features</div>
          <div className="mt-2 text-3xl font-semibold text-foreground">{stats?.features.total || 0}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="text-[13px] font-medium text-text-muted">In Progress</div>
          <div className="mt-2 text-3xl font-semibold text-primary-soft">
            {stats?.features.byStatus?.IN_PROGRESS || 0}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="text-[13px] font-medium text-text-muted">Completed</div>
          <div className="mt-2 text-3xl font-semibold text-success">
            {stats?.features.byStatus?.DONE || 0}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Quick Stats</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-[13px] font-medium text-text-muted">Team Members</div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{stats?.users.active || 0}</div>
            <div className="mt-1 text-[12px] text-text-muted">{stats?.users.total || 0} total</div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-[13px] font-medium text-text-muted">Bug Reports</div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{stats?.bugs.total || 0}</div>
            <div className="mt-1 text-[12px] text-text-muted">
              {stats?.bugs.byStatus?.OPEN || 0} open
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-[13px] font-medium text-text-muted">Releases</div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{stats?.releases.total || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
