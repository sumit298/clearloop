"use client";

import { useState } from 'react';
import { useBugs, useCreateBug } from '@/lib/hooks/useBugs';
import { useFeatures } from '@/lib/hooks/useFeatures';
import Link from 'next/link';

export default function BugsPage() {
  const { data: bugs, isLoading } = useBugs();
  const { data: features } = useFeatures();
  const createBug = useCreateBug();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "MEDIUM",
    source: "",
    featureId: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { source, ...bugData } = formData;
      // Add source to description for now (we can enhance backend later to store source separately)
      const descriptionWithSource = `**Source:** ${source}\n\n${bugData.description}`;
      
      await createBug.mutateAsync({
        ...bugData,
        description: descriptionWithSource,
        featureId: bugData.featureId || undefined,
        severity: bugData.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      });
      
      setShowCreateModal(false);
      setFormData({ title: "", description: "", severity: "MEDIUM", source: "", featureId: "" });
    } catch (error) {
      console.error("Failed to create bug:", error);
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
          <h1 className="text-3xl font-semibold tracking-tight">Bugs</h1>
          <p className="mt-2 text-[15px] text-text-dim">
            Track bugs from any source to resolution
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover"
        >
          Report Bug
        </button>
      </div>

      {!bugs || bugs.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <p className="text-text-muted">No bugs reported yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover"
          >
            Report your first bug
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bugs.map((bug) => (
            <Link
              key={bug.id}
              href={`/dashboard/bugs/${bug.id}`}
              className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{bug.title}</h3>
                  {bug.description && (
                    <p className="mt-1 text-[13px] text-text-muted line-clamp-2">
                      {bug.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-[12px] text-text-dim">
                    {bug.feature && (
                      <span>Feature: {bug.feature.title}</span>
                    )}
                    {bug.reportedBy && (
                      <span>Reported by: {bug.reportedBy.name}</span>
                    )}
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
                    {bug.status.replace('_', ' ')}
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold">Report Bug</h2>
            <p className="mt-1 text-[13px] text-text-muted">Track bugs from any source - Excel, email, client calls, QA testing</p>
            
            <form onSubmit={handleCreate} className="mt-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-[13px] font-medium text-foreground">
                  Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Login button not working on mobile"
                  required
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-text-dim focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[13px] font-medium text-foreground">
                  Description <span className="text-danger">*</span>
                </label>
                <p className="mt-1 text-[12px] text-text-dim">Full bug details, steps to reproduce, expected vs actual behavior</p>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the bug in detail..."
                  rows={4}
                  required
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-text-dim focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-[13px] font-medium text-foreground">
                  Source <span className="text-danger">*</span>
                </label>
                <p className="mt-1 text-[12px] text-text-dim">Where did this bug come from?</p>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g., Client email, Excel sheet, QA testing, Production monitoring"
                  required
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-text-dim focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                />
              </div>

              {/* Severity */}
              <div>
                <label className="block text-[13px] font-medium text-foreground">
                  Severity <span className="text-danger">*</span>
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  required
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              {/* Link to Feature (Optional) */}
              <div>
                <label className="block text-[13px] font-medium text-foreground">
                  Link to Feature (Optional)
                </label>
                <p className="mt-1 text-[12px] text-text-dim">If this bug is related to an existing feature, link it for traceability</p>
                <select
                  value={formData.featureId}
                  onChange={(e) => setFormData({ ...formData, featureId: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-primary-soft focus:outline-none focus:ring-2 focus:ring-primary-soft/20"
                >
                  <option value="">No feature linked</option>
                  {features?.map((feature) => (
                    <option key={feature.id} value={feature.id}>
                      {feature.title}
                    </option>
                  ))}
                </select>
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
                  disabled={createBug.isPending}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
                >
                  {createBug.isPending ? "Reporting..." : "Report Bug"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
