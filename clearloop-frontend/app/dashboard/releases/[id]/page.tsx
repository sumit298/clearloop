"use client";

import { useParams, useRouter } from 'next/navigation';
import { useRelease } from '@/lib/hooks/useReleases';
import Link from 'next/link';

export default function ReleaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const releaseId = params.id as string;
  
  const { data: release, isLoading, error } = useRelease(releaseId);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  if (error || !release) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Release not found</p>
          <button
            onClick={() => router.push('/dashboard/releases')}
            className="mt-4 text-[13px] text-primary-soft hover:underline"
          >
            Back to Releases
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/releases')}
          className="mb-4 text-[13px] text-text-dim hover:text-foreground"
        >
          ← Back to Releases
        </button>
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[13px] font-medium text-primary-soft">
                {release.version}
              </span>
              <h1 className="text-3xl font-semibold tracking-tight">{release.title}</h1>
            </div>
            {release.releasedAt && (
              <p className="mt-2 text-[15px] text-text-dim">
                Released on {formatDate(release.releasedAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Release Notes */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Release Notes</h2>
            
            {release.description ? (
              <div className="mt-4 prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-[14px] text-foreground font-sans">
                  {release.description}
                </pre>
              </div>
            ) : (
              <p className="mt-4 text-[13px] text-text-muted">No release notes available</p>
            )}
          </div>

          {/* Features Included */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Features Included ({release.features?.length || 0})</h2>
            
            {!release.features || release.features.length === 0 ? (
              <p className="mt-4 text-[13px] text-text-muted">No features in this release</p>
            ) : (
              <div className="mt-4 space-y-3">
                {release.features.map((item) => (
                  <Link
                    key={item.feature.id}
                    href={`/dashboard/features/${item.feature.id}`}
                    className="block rounded-lg border border-border bg-background p-4 transition-colors hover:bg-surface-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{item.feature.title}</h3>
                        {item.feature.description && (
                          <p className="mt-1 text-[13px] text-text-muted line-clamp-2">
                            {item.feature.description}
                          </p>
                        )}
                        {item.feature.project && (
                          <div className="mt-2 text-[12px] text-text-dim">
                            Project: {item.feature.project.name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                            item.feature.status === 'DONE'
                              ? 'bg-success/10 text-success'
                              : item.feature.status === 'IN_REVIEW'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-surface-2 text-text-muted'
                          }`}
                        >
                          {item.feature.status.replace('_', ' ')}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                            item.feature.priority === 'CRITICAL'
                              ? 'bg-danger/10 text-danger'
                              : item.feature.priority === 'HIGH'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-surface-2 text-text-muted'
                          }`}
                        >
                          {item.feature.priority}
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
          {/* Release Info */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Release Info</h2>
            
            <div className="mt-4 space-y-3">
              <div>
                <h3 className="text-[12px] font-medium text-text-dim">Version</h3>
                <p className="mt-1 text-[14px] text-foreground font-mono">{release.version}</p>
              </div>
              <div>
                <h3 className="text-[12px] font-medium text-text-dim">Release Date</h3>
                <p className="mt-1 text-[14px] text-foreground">
                  {release.releasedAt ? formatDate(release.releasedAt) : 'Not released yet'}
                </p>
              </div>
              <div>
                <h3 className="text-[12px] font-medium text-text-dim">Features</h3>
                <p className="mt-1 text-[14px] text-foreground">{release.features?.length || 0}</p>
              </div>
              <div>
                <h3 className="text-[12px] font-medium text-text-dim">Created</h3>
                <p className="mt-1 text-[14px] text-foreground">{formatDate(release.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Statistics</h2>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-muted">Total Features</span>
                <span className="text-[14px] font-medium text-foreground">
                  {release.features?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-muted">Done</span>
                <span className="text-[14px] font-medium text-success">
                  {release.features?.filter(f => f.feature.status === 'DONE').length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-muted">In Review</span>
                <span className="text-[14px] font-medium text-warning">
                  {release.features?.filter(f => f.feature.status === 'IN_REVIEW').length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-muted">High Priority</span>
                <span className="text-[14px] font-medium text-danger">
                  {release.features?.filter(f => f.feature.priority === 'HIGH' || f.feature.priority === 'CRITICAL').length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
