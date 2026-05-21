'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api/client';
import type { Feature } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    projects: 0,
    features: 0,
    inProgress: 0,
    done: 0,
  });
  const [recentFeatures, setRecentFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = auth.getToken();
      if (!token) return;

      const [projects, features] = await Promise.all([
        api.getProjects(token),
        api.getFeatures(token),
      ]);

      setStats({
        projects: projects.length,
        features: features.length,
        inProgress: features.filter(f => f.status === 'IN_PROGRESS').length,
        done: features.filter(f => f.status === 'DONE').length,
      });

      setRecentFeatures(features.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
          <div className="mt-2 text-3xl font-semibold text-foreground">{stats.projects}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="text-[13px] font-medium text-text-muted">Total Features</div>
          <div className="mt-2 text-3xl font-semibold text-foreground">{stats.features}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="text-[13px] font-medium text-text-muted">In Progress</div>
          <div className="mt-2 text-3xl font-semibold text-primary-soft">{stats.inProgress}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="text-[13px] font-medium text-text-muted">Completed</div>
          <div className="mt-2 text-3xl font-semibold text-success">{stats.done}</div>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Features</h2>
          <Link
            href="/dashboard/features"
            className="text-[13px] font-medium text-primary-soft transition-colors hover:text-primary-hover"
          >
            View all →
          </Link>
        </div>

        {recentFeatures.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-12 text-center">
            <p className="text-text-muted">No features yet</p>
            <Link
              href="/dashboard/features"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover"
            >
              Create your first feature
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentFeatures.map((feature) => (
              <Link
                key={feature.id}
                href={`/dashboard/features/${feature.id}`}
                className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground">{feature.title}</h3>
                    {feature.description && (
                      <p className="mt-1 text-[13px] text-text-muted line-clamp-1">
                        {feature.description}
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
