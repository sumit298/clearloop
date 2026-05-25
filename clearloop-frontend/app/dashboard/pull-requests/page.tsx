"use client";

import { useState } from 'react';
import { usePullRequests, useLinkPRToFeature, useUnlinkPRFromFeature } from '@/lib/hooks/usePullRequests';
import { useFeatures } from '@/lib/hooks/useFeatures';
import Link from 'next/link';

export default function PullRequestsPage() {
  const { data: pullRequests, isLoading } = usePullRequests();
  const { data: features } = useFeatures();
  const linkPR = useLinkPRToFeature();
  const unlinkPR = useUnlinkPRFromFeature();
  
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedPR, setSelectedPR] = useState<string | null>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState('');

  const filteredPRs = pullRequests?.filter(pr => {
    if (statusFilter === 'ALL') return true;
    return pr.status === statusFilter;
  });

  const handleLinkClick = (prId: string) => {
    setSelectedPR(prId);
    setShowLinkModal(true);
  };

  const handleLink = async () => {
    if (!selectedPR || !selectedFeatureId) return;

    try {
      await linkPR.mutateAsync({ prId: selectedPR, featureId: selectedFeatureId });
      setShowLinkModal(false);
      setSelectedPR(null);
      setSelectedFeatureId('');
    } catch (error) {
      console.error('Failed to link PR:', error);
    }
  };

  const handleUnlink = async (prId: string) => {
    if (!confirm('Are you sure you want to unlink this PR?')) return;

    try {
      await unlinkPR.mutateAsync(prId);
    } catch (error) {
      console.error('Failed to unlink PR:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <h1 className="text-3xl font-semibold tracking-tight">Pull Requests</h1>
          <p className="mt-2 text-[15px] text-text-dim">
            Auto-linked from GitHub webhook
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
            statusFilter === 'ALL'
              ? 'bg-primary/10 text-primary-soft'
              : 'bg-surface-2 text-text-muted hover:bg-surface'
          }`}
        >
          All ({pullRequests?.length || 0})
        </button>
        <button
          onClick={() => setStatusFilter('OPEN')}
          className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
            statusFilter === 'OPEN'
              ? 'bg-primary/10 text-primary-soft'
              : 'bg-surface-2 text-text-muted hover:bg-surface'
          }`}
        >
          Open ({pullRequests?.filter(pr => pr.status === 'OPEN').length || 0})
        </button>
        <button
          onClick={() => setStatusFilter('MERGED')}
          className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
            statusFilter === 'MERGED'
              ? 'bg-primary/10 text-primary-soft'
              : 'bg-surface-2 text-text-muted hover:bg-surface'
          }`}
        >
          Merged ({pullRequests?.filter(pr => pr.status === 'MERGED').length || 0})
        </button>
        <button
          onClick={() => setStatusFilter('CLOSED')}
          className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
            statusFilter === 'CLOSED'
              ? 'bg-primary/10 text-primary-soft'
              : 'bg-surface-2 text-text-muted hover:bg-surface'
          }`}
        >
          Closed ({pullRequests?.filter(pr => pr.status === 'CLOSED').length || 0})
        </button>
      </div>

      {!filteredPRs || filteredPRs.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-text-muted">
            {statusFilter === 'ALL' ? 'No pull requests yet' : `No ${statusFilter.toLowerCase()} pull requests`}
          </p>
          <p className="mt-2 text-[13px] text-text-dim">
            PRs will appear here automatically when GitHub webhook is configured
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPRs.map((pr) => (
            <div
              key={pr.id}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{pr.title}</h3>
                      {pr.description && (
                        <p className="mt-1 text-[13px] text-text-muted line-clamp-2">
                          {pr.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-[12px] text-text-dim">
                        <span>by {pr.author}</span>
                        <span>•</span>
                        <span>{formatDate(pr.createdAt)}</span>
                        {pr.mergedAt && (
                          <>
                            <span>•</span>
                            <span>Merged {formatDate(pr.mergedAt)}</span>
                          </>
                        )}
                      </div>
                      
                      {/* Linked Feature */}
                      {pr.feature ? (
                        <div className="mt-3 flex items-center gap-2">
                          <Link
                            href={`/dashboard/features/${pr.feature.id}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] text-foreground transition-colors hover:bg-surface-2"
                          >
                            <span>🔗</span>
                            <span>{pr.feature.title}</span>
                          </Link>
                          <button
                            onClick={() => handleUnlink(pr.id)}
                            disabled={unlinkPR.isPending}
                            className="text-[12px] text-danger hover:underline disabled:opacity-50"
                          >
                            Unlink
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleLinkClick(pr.id)}
                          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-1.5 text-[12px] text-text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                        >
                          <span>🔗</span>
                          <span>Link to Feature</span>
                        </button>
                      )}
                    </div>
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

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6">
            <h2 className="text-xl font-semibold">Link PR to Feature</h2>
            <p className="mt-1 text-[13px] text-text-dim">
              Select a feature to link this pull request
            </p>
            
            <div className="mt-6">
              <label className="block text-[13px] font-medium text-foreground">
                Feature
              </label>
              <select
                value={selectedFeatureId}
                onChange={(e) => setSelectedFeatureId(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
              >
                <option value="">Select a feature</option>
                {features?.map((feature) => (
                  <option key={feature.id} value={feature.id}>
                    {feature.title} ({feature.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowLinkModal(false);
                  setSelectedPR(null);
                  setSelectedFeatureId('');
                }}
                className="flex-1 rounded-lg border border-border bg-surface-2 px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleLink}
                disabled={linkPR.isPending || !selectedFeatureId}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {linkPR.isPending ? 'Linking...' : 'Link to Feature'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
