"use client";

import { useParams, useRouter } from 'next/navigation';
import { useFeature } from '@/lib/hooks/useFeatures';
import Link from 'next/link';

export default function FeatureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const featureId = params.id as string;
  
  const { data: feature, isLoading, error } = useFeature(featureId);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  if (error || !feature) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Feature not found</p>
          <button
            onClick={() => router.push('/dashboard/features')}
            className="mt-4 text-[13px] text-primary-soft hover:underline"
          >
            Back to Features
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/features')}
          className="mb-4 text-[13px] text-text-dim hover:text-foreground"
        >
          ← Back to Features
        </button>
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-semibold tracking-tight">{feature.title}</h1>
            <div className="mt-3 flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-[12px] font-medium ${
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
                className={`rounded-full px-3 py-1 text-[12px] font-medium ${
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
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Feature Info */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Feature Details</h2>
            
            {feature.description && (
              <div className="mt-4">
                <h3 className="text-[13px] font-medium text-text-dim">Description</h3>
                <p className="mt-2 text-[14px] text-foreground whitespace-pre-wrap">
                  {feature.description}
                </p>
              </div>
            )}

            {feature.reason && (
              <div className="mt-4">
                <h3 className="text-[13px] font-medium text-text-dim">Reason (Why)</h3>
                <p className="mt-2 text-[14px] text-foreground whitespace-pre-wrap">
                  {feature.reason}
                </p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-[13px] font-medium text-text-dim">Project</h3>
                <p className="mt-1 text-[14px] text-foreground">{feature.project?.name}</p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium text-text-dim">Created By</h3>
                <p className="mt-1 text-[14px] text-foreground">{feature.createdBy?.name}</p>
              </div>
              {feature.assignedTo && (
                <div>
                  <h3 className="text-[13px] font-medium text-text-dim">Assigned To</h3>
                  <p className="mt-1 text-[14px] text-foreground">{feature.assignedTo.name}</p>
                </div>
              )}
              <div>
                <h3 className="text-[13px] font-medium text-text-dim">Created</h3>
                <p className="mt-1 text-[14px] text-foreground">{formatDate(feature.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Pull Requests */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Pull Requests ({feature.pullRequests?.length || 0})</h2>
            <p className="mt-1 text-[13px] text-text-dim">Auto-linked from GitHub webhook</p>
            
            {!feature.pullRequests || feature.pullRequests.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-border bg-background p-8 text-center">
                <p className="text-[13px] text-text-muted">No PRs linked yet</p>
                <p className="mt-1 text-[12px] text-text-dim">
                  Create a branch with name: <code className="rounded bg-surface-2 px-2 py-1">feature/{feature.id}</code>
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {feature.pullRequests.map((pr) => (
                  <div
                    key={pr.id}
                    className="rounded-lg border border-border bg-background p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{pr.title}</h3>
                        <div className="mt-2 flex items-center gap-3 text-[12px] text-text-dim">
                          <span>by {pr.author}</span>
                          <span>•</span>
                          <span>{formatDate(pr.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                            pr.status === 'MERGED'
                              ? 'bg-success/10 text-success'
                              : pr.status === 'OPEN'
                              ? 'bg-primary/10 text-primary-soft'
                              : 'bg-surface-2 text-text-muted'
                          }`}
                        >
                          {pr.status}
                        </span>
                        <a
                          href={pr.githubPrUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] text-primary-soft hover:underline"
                        >
                          View on GitHub →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bugs */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Bugs ({feature.bugReports?.length || 0})</h2>
            <p className="mt-1 text-[13px] text-text-dim">Bugs reported in this feature</p>
            
            {!feature.bugReports || feature.bugReports.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-border bg-background p-8 text-center">
                <p className="text-[13px] text-text-muted">No bugs reported</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {feature.bugReports.map((bug) => (
                  <Link
                    key={bug.id}
                    href={`/dashboard/bugs/${bug.id}`}
                    className="block rounded-lg border border-border bg-background p-4 transition-colors hover:bg-surface-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{bug.title}</h3>
                        <div className="mt-2 text-[12px] text-text-dim">
                          {formatDate(bug.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                            bug.status === 'RESOLVED'
                              ? 'bg-success/10 text-success'
                              : bug.status === 'IN_PROGRESS'
                              ? 'bg-primary/10 text-primary-soft'
                              : 'bg-surface-2 text-text-muted'
                          }`}
                        >
                          {bug.status}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                            bug.severity === 'CRITICAL'
                              ? 'bg-danger/10 text-danger'
                              : bug.severity === 'HIGH'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-surface-2 text-text-muted'
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
          {/* Activity Timeline */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Activity Timeline</h2>
            <p className="mt-1 text-[13px] text-text-dim">Full audit trail</p>
            
            {!feature.activityLogs || feature.activityLogs.length === 0 ? (
              <div className="mt-4 text-[13px] text-text-muted">No activity yet</div>
            ) : (
              <div className="mt-4 space-y-4">
                {feature.activityLogs.map((log, index) => (
                  <div key={log.id} className="relative">
                    {index !== feature.activityLogs!.length - 1 && (
                      <div className="absolute left-2 top-6 h-full w-px bg-border" />
                    )}
                    <div className="flex gap-3">
                      <div className="relative z-10 mt-1 h-4 w-4 rounded-full border-2 border-primary bg-background" />
                      <div className="flex-1 pb-4">
                        <p className="text-[13px] font-medium text-foreground">
                          {log.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="mt-1 text-[12px] text-text-dim">
                          by {log.user.name}
                        </p>
                        <p className="mt-1 text-[11px] text-text-dim">
                          {formatDate(log.createdAt)}
                        </p>
                        {log.metadata && (
                          <div className="mt-2 rounded bg-surface-2 p-2 text-[11px] text-text-muted font-mono">
                            {JSON.stringify(log.metadata, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Comments ({feature.comments?.length || 0})</h2>
            
            {!feature.comments || feature.comments.length === 0 ? (
              <div className="mt-4 text-[13px] text-text-muted">No comments yet</div>
            ) : (
              <div className="mt-4 space-y-4">
                {feature.comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-[12px] font-medium text-primary-soft">
                        {comment.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-foreground">
                            {comment.user.name}
                          </span>
                          <span className="text-[11px] text-text-dim">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-[13px] text-text-muted whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
