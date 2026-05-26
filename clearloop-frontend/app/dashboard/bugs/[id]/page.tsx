"use client";

import { useParams, useRouter } from 'next/navigation';
import { useBug } from '@/lib/hooks/useBugs';
import Link from 'next/link';

export default function BugDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bugId = params.id as string;
  
  const { data: bug, isLoading, error } = useBug(bugId);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  if (error || !bug) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Bug not found</p>
          <button
            onClick={() => router.push('/dashboard/bugs')}
            className="mt-4 text-[13px] text-primary-soft hover:underline"
          >
            Back to Bugs
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

  // Extract source from description (we prepended it in create form)
  const sourceMatch = bug.description.match(/\*\*Source:\*\*\s*(.+?)\n/);
  const source = sourceMatch ? sourceMatch[1] : 'Unknown';
  const descriptionWithoutSource = bug.description.replace(/\*\*Source:\*\*\s*.+?\n\n/, '');

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard/bugs')}
          className="mb-4 text-[13px] text-text-dim hover:text-foreground"
        >
          ← Back to Bugs
        </button>
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-semibold tracking-tight">{bug.title}</h1>
            <div className="mt-3 flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-[12px] font-medium ${
                  bug.status === 'RESOLVED'
                    ? 'bg-success/10 text-success'
                    : bug.status === 'IN_PROGRESS'
                    ? 'bg-primary/10 text-primary-soft'
                    : bug.status === 'CLOSED'
                    ? 'bg-surface-2 text-text-muted'
                    : 'bg-danger/10 text-danger'
                }`}
              >
                {bug.status.replace('_', ' ')}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-[12px] font-medium ${
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
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Bug Info */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Bug Details</h2>
            
            <div className="mt-4">
              <h3 className="text-[13px] font-medium text-text-dim">Source</h3>
              <p className="mt-2 text-[14px] text-foreground">
                {source}
              </p>
            </div>

            <div className="mt-4">
              <h3 className="text-[13px] font-medium text-text-dim">Description</h3>
              <p className="mt-2 text-[14px] text-foreground whitespace-pre-wrap">
                {descriptionWithoutSource}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-[13px] font-medium text-text-dim">Reported By</h3>
                <p className="mt-1 text-[14px] text-foreground">{bug.reportedBy?.name}</p>
              </div>
              <div>
                <h3 className="text-[13px] font-medium text-text-dim">Reported</h3>
                <p className="mt-1 text-[14px] text-foreground">{formatDate(bug.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Linked Feature */}
          {bug.feature && (
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="text-lg font-semibold">Linked Feature</h2>
              <p className="mt-1 text-[13px] text-text-dim">This bug is related to a feature</p>
              
              <Link
                href={`/dashboard/features/${bug.feature.id}`}
                className="mt-4 block rounded-lg border border-border bg-background p-4 transition-colors hover:bg-surface-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{bug.feature.title}</h3>
                    {bug.feature.project && (
                      <div className="mt-2 text-[12px] text-text-dim">
                        Project: {bug.feature.project.name}
                      </div>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                      bug.feature.status === 'DONE'
                        ? 'bg-success/10 text-success'
                        : bug.feature.status === 'IN_PROGRESS'
                        ? 'bg-primary/10 text-primary-soft'
                        : 'bg-surface-2 text-text-muted'
                    }`}
                  >
                    {bug.feature.status?.replace('_', ' ')}
                  </span>
                </div>
              </Link>
            </div>
          )}

          {/* Comments */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Comments ({bug.comments?.length || 0})</h2>
            
            {!bug.comments || bug.comments.length === 0 ? (
              <div className="mt-4 text-[13px] text-text-muted">No comments yet</div>
            ) : (
              <div className="mt-4 space-y-4">
                {bug.comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-[12px] font-medium text-primary-soft">
                        {(comment.user?.name?.charAt(0) ?? '?').toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-foreground">
                            {comment.user?.name ?? 'Unknown user'}
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Journey Status */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Bug Journey</h2>
            <p className="mt-1 text-[13px] text-text-dim">Track from report to resolution</p>
            
            <div className="mt-4 space-y-4">
              {/* Reported */}
              <div className="flex gap-3">
                <div className="relative z-10 mt-1 h-4 w-4 rounded-full border-2 border-success bg-success" />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-foreground">Bug Reported</p>
                  <p className="mt-1 text-[11px] text-text-dim">
                    {formatDate(bug.createdAt)}
                  </p>
                  <p className="mt-1 text-[12px] text-text-muted">
                    Source: {source}
                  </p>
                </div>
              </div>

              {/* In Progress */}
              {(bug.status === 'IN_PROGRESS' || bug.status === 'RESOLVED' || bug.status === 'CLOSED') && (
                <div className="flex gap-3">
                  <div className="relative z-10 mt-1 h-4 w-4 rounded-full border-2 border-primary bg-primary" />
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-foreground">Fix In Progress</p>
                    <p className="mt-1 text-[12px] text-text-muted">
                      Developer working on fix
                    </p>
                  </div>
                </div>
              )}

              {/* Resolved */}
              {(bug.status === 'RESOLVED' || bug.status === 'CLOSED') && (
                <div className="flex gap-3">
                  <div className="relative z-10 mt-1 h-4 w-4 rounded-full border-2 border-success bg-success" />
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-foreground">Bug Resolved</p>
                    <p className="mt-1 text-[12px] text-text-muted">
                      Fix merged to main
                    </p>
                  </div>
                </div>
              )}

              {/* Pending */}
              {bug.status === 'OPEN' && (
                <div className="flex gap-3">
                  <div className="relative z-10 mt-1 h-4 w-4 rounded-full border-2 border-border bg-background" />
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-text-muted">Awaiting Fix</p>
                    <p className="mt-1 text-[12px] text-text-dim">
                      Create branch: bug/{bug.id}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Quick Info</h2>
            
            <div className="mt-4 space-y-3">
              <div>
                <h3 className="text-[12px] font-medium text-text-dim">Severity</h3>
                <p className="mt-1 text-[14px] text-foreground">{bug.severity}</p>
              </div>
              <div>
                <h3 className="text-[12px] font-medium text-text-dim">Status</h3>
                <p className="mt-1 text-[14px] text-foreground">{bug.status.replace('_', ' ')}</p>
              </div>
              <div>
                <h3 className="text-[12px] font-medium text-text-dim">Source</h3>
                <p className="mt-1 text-[14px] text-foreground">{source}</p>
              </div>
              {bug.feature && (
                <div>
                  <h3 className="text-[12px] font-medium text-text-dim">Related Feature</h3>
                  <Link
                    href={`/dashboard/features/${bug.feature.id}`}
                    className="mt-1 text-[14px] text-primary-soft hover:underline"
                  >
                    {bug.feature.title}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
