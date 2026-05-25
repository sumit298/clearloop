"use client";

import { useState } from 'react';
import { useReleases, useCreateRelease, useGenerateReleaseNotes } from '@/lib/hooks/useReleases';
import { useFeatures } from '@/lib/hooks/useFeatures';
import { useBugs } from '@/lib/hooks/useBugs';
import Link from 'next/link';

export default function ReleasesPage() {
  const { data: releases, isLoading } = useReleases();
  const { data: features } = useFeatures();
  const { data: bugs } = useBugs();
  const createRelease = useCreateRelease();
  const generateNotes = useGenerateReleaseNotes();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    version: "",
    title: "",
    description: "",
    releasedAt: new Date().toISOString().split('T')[0],
    featureIds: [] as string[],
    useAI: true,
  });

  // Filter features that are DONE or IN_REVIEW
  const releaseReadyFeatures = features?.filter(
    f => f.status === 'DONE' || f.status === 'IN_REVIEW'
  ) || [];

  // Filter bugs that are RESOLVED
  const resolvedBugs = bugs?.filter(b => b.status === 'RESOLVED') || [];

  const handleFeatureToggle = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      featureIds: prev.featureIds.includes(featureId)
        ? prev.featureIds.filter(id => id !== featureId)
        : [...prev.featureIds, featureId]
    }));
  };

  const handleGenerateNotes = async () => {
    if (formData.featureIds.length === 0) {
      alert('Please select at least one feature');
      return;
    }

    try {
      const result = await generateNotes.mutateAsync({});
      setFormData(prev => ({ ...prev, description: result.notes }));
    } catch (error) {
      console.error('Failed to generate notes:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createRelease.mutateAsync(formData);
      setShowCreateModal(false);
      setFormData({
        version: "",
        title: "",
        description: "",
        releasedAt: new Date().toISOString().split('T')[0],
        featureIds: [],
        useAI: true,
      });
    } catch (error) {
      console.error("Failed to create release:", error);
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Releases</h1>
          <p className="mt-2 text-[15px] text-text-dim">
            Create releases with AI-generated notes
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover"
        >
          New Release
        </button>
      </div>

      {!releases || releases.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-text-muted">No releases yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover"
          >
            Create your first release
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {releases.map((release) => (
            <Link
              key={release.id}
              href={`/dashboard/releases/${release.id}`}
              className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary-soft">
                      {release.version}
                    </span>
                    <h3 className="font-medium text-foreground">{release.title}</h3>
                  </div>
                  {release.description && (
                    <p className="mt-2 text-[13px] text-text-muted line-clamp-3">
                      {release.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-[12px] text-text-dim">
                    {release.features && (
                      <span>{release.features.length} features</span>
                    )}
                    {release.releasedAt && (
                      <span>Released: {new Date(release.releasedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-surface p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold">Create Release</h2>
            <p className="mt-1 text-[13px] text-text-muted">Select features and generate AI-powered release notes</p>
            
            <form onSubmit={handleCreate} className="mt-6 space-y-5">
              {/* Version */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-foreground">
                    Version <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="e.g., v1.2.0"
                    required
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-text-dim focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-foreground">
                    Release Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.releasedAt}
                    onChange={(e) => setFormData({ ...formData, releasedAt: e.target.value })}
                    required
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[13px] font-medium text-foreground">
                  Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Dark Mode & Performance Improvements"
                  required
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-text-dim focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                />
              </div>

              {/* Select Features */}
              <div>
                <label className="block text-[13px] font-medium text-foreground">
                  Select Features <span className="text-danger">*</span>
                </label>
                <p className="mt-1 text-[12px] text-text-dim">
                  Choose features with status DONE or IN_REVIEW ({releaseReadyFeatures.length} available)
                </p>
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border bg-background p-3 space-y-2">
                  {releaseReadyFeatures.length === 0 ? (
                    <p className="text-[13px] text-text-muted">No features ready for release</p>
                  ) : (
                    releaseReadyFeatures.map((feature) => (
                      <label
                        key={feature.id}
                        className="flex items-start gap-3 cursor-pointer hover:bg-surface-2 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.featureIds.includes(feature.id)}
                          onChange={() => handleFeatureToggle(feature.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="text-[13px] font-medium text-foreground">{feature.title}</div>
                          <div className="text-[11px] text-text-dim">
                            {feature.status} • {feature.priority}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* AI Generate Button */}
              <div>
                <button
                  type="button"
                  onClick={handleGenerateNotes}
                  disabled={generateNotes.isPending || formData.featureIds.length === 0}
                  className="w-full rounded-lg border border-primary bg-primary/10 px-4 py-2 text-[13px] font-medium text-primary-soft transition-colors hover:bg-primary/20 disabled:opacity-50"
                >
                  {generateNotes.isPending ? "Generating with Gemini AI..." : "🤖 Generate Release Notes with AI"}
                </button>
              </div>

              {/* Description / Release Notes */}
              <div>
                <label className="block text-[13px] font-medium text-foreground">
                  Release Notes
                </label>
                <p className="mt-1 text-[12px] text-text-dim">AI-generated notes (you can edit before publishing)</p>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Click 'Generate Release Notes with AI' to auto-generate from PRs..."
                  rows={8}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-text-dim focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20 font-mono"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg border border-border bg-surface-2 px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRelease.isPending || formData.featureIds.length === 0}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
                >
                  {createRelease.isPending ? "Publishing..." : "Publish Release"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
