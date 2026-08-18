"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Rocket, Sparkles, Tag } from "lucide-react";
import { PageHeader, EmptyState, Section } from "@/components/clearloop/primitives";
import { Toolbar, SearchField, ResultCount } from "@/components/clearloop/toolbar";
import { Chip, StatusChip } from "@/components/clearloop/status";
import { useReleases, useCreateRelease, useGenerateReleaseNotes } from "@/lib/hooks/useReleases";
import { useFeatures } from "@/lib/hooks/useFeatures";
import { getErrorMessage } from "@/lib/api/errors";
import { Markdown } from "@/components/clearloop/markdown";

export default function ReleasesPage() {
  const { data: releases, isLoading } = useReleases();
  const { data: features } = useFeatures();
  const createRelease = useCreateRelease();
  const generateNotes = useGenerateReleaseNotes();

  const [q, setQ] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ version: "", title: "", description: "", releasedAt: new Date().toISOString().split("T")[0], featureIds: [] as string[] });
  const [copied, setCopied] = useState<string | null>(null);

  const rows = (releases || []).filter((r) => (r.version + r.title).toLowerCase().includes(q.toLowerCase()));
  const releaseReadyFeatures = (features || []).filter((f) => f.status === "DONE" || f.status === "IN_REVIEW");

  const toggleFeature = (id: string) =>
    setForm((prev) => ({ ...prev, featureIds: prev.featureIds.includes(id) ? prev.featureIds.filter((x) => x !== id) : [...prev.featureIds, id] }));

  const handleGenerateNotes = async () => {
    if (!form.featureIds.length) return;
    try { const result = await generateNotes.mutateAsync({ featureIds: form.featureIds, title: form.title }); setForm((prev) => ({ ...prev, description: result.notes })); }
    catch { /* mutation state retains error */ }
  };

  const versionTaken =
    createRelease.isError &&
    /already exists/i.test(getErrorMessage(createRelease.error, ""));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRelease.mutateAsync(form);
      setShowCreate(false);
      setForm({ version: "", title: "", description: "", releasedAt: new Date().toISOString().split("T")[0], featureIds: [] });
    } catch { /* mutation state retains error */ }
  };

  const copyNotes = (r: typeof rows[0]) => {
    navigator.clipboard.writeText(`## ${r.version} — ${r.title}\n\n${r.description ?? ""}`).then(() => { setCopied(r.id); setTimeout(() => setCopied(null), 2000); });
  };

  if (isLoading) return <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">Loading releases…</div>;

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Releases"
        description="Notes are assembled from the features shipped and the bugs closed — not written the morning of the ship."
        actions={
          <button onClick={() => setShowCreate(true)} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground">
            <Rocket className="size-3.5" /> Cut release
          </button>
        }
      />

      <Toolbar>
        <SearchField value={q} onChange={setQ} placeholder="Search versions…" />
        <ResultCount count={rows.length} noun="release" />
      </Toolbar>

      <div className="p-6">
        {rows.length === 0 ? (
          <div className="panel">
            <EmptyState
              icon={Tag}
              title={q ? "No releases match" : "No releases yet"}
              description={q ? "Try a version like v1.2.0, or clear the search." : "Cut a release from features currently marked done."}
              action={
                <button onClick={() => { setQ(""); if (!q) setShowCreate(true); }} className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground">
                  {q ? "Clear search" : "Cut release"}
                </button>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {rows.map((r) => (
              <Section
                key={r.id}
                title={`${r.version} — ${r.title}`}
                icon={Tag}
                action={
                  <button onClick={() => copyNotes(r)} className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground">
                    <Copy className="size-3" /> {copied === r.id ? "Copied!" : "Copy notes"}
                  </button>
                }
              >
                <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
                  <Chip label="Shipped" tone="green" solidDot />
                  {r.releasedAt && <span className="font-mono text-[12px] text-muted-foreground">{new Date(r.releasedAt).toLocaleDateString()}</span>}
                  <span className="ml-auto font-mono text-[12px] text-muted-foreground">{r.features?.length ?? 0} features</span>
                </div>
                {r.description && <Markdown className="px-4 py-3 text-[13px] text-muted-foreground">{r.description}</Markdown>}
                {(r.features?.length ?? 0) > 0 && (
                  <div className="border-t border-border">
                    {r.features!.map((item) => (
                      <Link key={item.feature.id} href={`/dashboard/features/${item.feature.id}`} className="row-hover flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
                        <span className="min-w-0 flex-1 truncate text-[13px]">{item.feature.title}</span>
                        <StatusChip status={item.feature.status} />
                      </Link>
                    ))}
                  </div>
                )}
              </Section>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="w-full max-w-2xl rounded-lg border border-border bg-[var(--popover)] p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-[16px] font-semibold">Cut release</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">Select features and generate AI-powered release notes.</p>
            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              {generateNotes.isError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                  Failed to generate notes. Please try again.
                </div>
              )}
              {createRelease.isError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                  {getErrorMessage(createRelease.error, "Failed to publish release. Please try again.")}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-medium">Version *</label>
                  <input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} required placeholder="e.g. v1.2.0" className={`mt-1.5 h-9 w-full rounded-md border bg-surface px-3 text-[13px] outline-none focus:border-primary ${versionTaken ? "border-destructive" : "border-border"}`} />
                </div>
                <div>
                  <label className="text-[12px] font-medium">Release date *</label>
                  <input type="date" value={form.releasedAt} onChange={(e) => setForm({ ...form, releasedAt: e.target.value })} required className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="text-[12px] font-medium">Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Dark Mode & Performance Improvements" className="mt-1.5 h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[12px] font-medium">Select features * <span className="font-normal text-muted-foreground">({releaseReadyFeatures.length} available)</span></label>
                <div className="mt-1.5 max-h-40 overflow-y-auto rounded-md border border-border bg-surface p-2 space-y-1">
                  {releaseReadyFeatures.length === 0
                    ? <p className="px-2 py-1 text-[13px] text-muted-foreground">No features ready for release</p>
                    : releaseReadyFeatures.map((f) => (
                      <label key={f.id} className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 hover:bg-surface-raised">
                        <input type="checkbox" checked={form.featureIds.includes(f.id)} onChange={() => toggleFeature(f.id)} className="size-3.5" />
                        <span className="flex-1 text-[13px]">{f.title}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{f.status}</span>
                      </label>
                    ))
                  }
                </div>
              </div>
              <button type="button" onClick={handleGenerateNotes} disabled={generateNotes.isPending || form.featureIds.length === 0} className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-primary bg-primary/10 text-[12px] font-medium text-primary disabled:opacity-50">
                <Sparkles className="size-3.5" /> {generateNotes.isPending ? "Generating…" : "Generate release notes with AI"}
              </button>
              <div>
                <label className="text-[12px] font-medium">Release notes</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={6} placeholder="AI-generated notes will appear here…" className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-[12px] outline-none focus:border-primary" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="h-8 rounded-md border border-border px-3 text-[12px]">Cancel</button>
                <button type="submit" disabled={createRelease.isPending || form.featureIds.length === 0} className="h-8 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground disabled:opacity-50">
                  {createRelease.isPending ? "Publishing…" : "Publish release"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
