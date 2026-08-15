"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, GitPullRequest, Link2, Sparkles } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/clearloop/primitives";
import { Toolbar, SearchField, FilterMenu, ResultCount } from "@/components/clearloop/toolbar";
import { PrStatusChip, toneColor } from "@/components/clearloop/status";
import { useFeatures } from "@/lib/hooks/useFeatures";
import { useLinkPRToFeature, usePullRequests, useUnlinkPRFromFeature } from "@/lib/hooks/usePullRequests";

const STATE_OPTIONS = [
  { value: "OPEN", label: "Open", color: toneColor("green") },
  { value: "MERGED", label: "Merged", color: toneColor("violet") },
  { value: "CLOSED", label: "Closed", color: toneColor("red") },
];

export default function PullRequestsPage() {
  const { data: pullRequests, isLoading } = usePullRequests();
  const { data: features } = useFeatures();
  const linkMutation = useLinkPRToFeature();
  const unlinkMutation = useUnlinkPRFromFeature();

  const [q, setQ] = useState("");
  const [stateFilter, setStateFilter] = useState<string[]>([]);
  const [prId, setPrId] = useState<string | null>(null);
  const [featureId, setFeatureId] = useState("");

  const rows = (pullRequests || [])
    .filter((pr) => q ? pr.title.toLowerCase().includes(q.toLowerCase()) : true)
    .filter((pr) => stateFilter.length ? stateFilter.includes(pr.status) : true);

  const handleLink = async () => {
    if (!prId || !featureId) return;
    try { await linkMutation.mutateAsync({ prId, featureId }); setPrId(null); setFeatureId(""); }
    catch { /* mutation state retains API error */ }
  };

  const handleUnlink = async (id: string) => {
    if (window.confirm("Unlink this pull request from its feature?")) await unlinkMutation.mutateAsync(id);
  };

  if (isLoading) return <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">Loading pull requests…</div>;

  return (
    <>
      <PageHeader
        eyebrow="GitHub sync"
        title="Pull requests"
        description="Mirrored from GitHub within seconds, linked to the work they deliver."
      />

      <Toolbar>
        <SearchField value={q} onChange={setQ} placeholder="Search pull requests…" />
        <FilterMenu
          label="State"
          selected={stateFilter}
          onToggle={(v) => setStateFilter((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v])}
          options={STATE_OPTIONS}
        />
        <ResultCount count={rows.length} noun="pull request" />
      </Toolbar>

      <div className="p-6">
        {rows.length === 0 ? (
          <div className="panel">
            <EmptyState
              icon={GitPullRequest}
              title="No pull requests here"
              description="Nothing matches this filter. Open PRs appear the moment GitHub sends the webhook."
              action={
                <button onClick={() => { setQ(""); setStateFilter([]); }} className="inline-flex h-8 items-center rounded-md border border-border px-3 text-[12px]">
                  Clear filters
                </button>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((pr) => (
              <div key={pr.id} className="panel lift overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <GitPullRequest
                    className={`size-4 shrink-0 ${
                      pr.status === "MERGED" ? "text-[var(--hue-violet)]"
                      : pr.status === "OPEN" ? "text-[var(--hue-green)]"
                      : "text-muted-foreground"
                    }`}
                  />
                  <Link href={`/dashboard/pull-requests/${pr.id}`} className="min-w-0 flex-1 truncate text-[13.5px] font-medium hover:underline">
                    {pr.title}
                  </Link>
                  {pr.feature && (
                    <span className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground lg:block">
                      {pr.feature.title}
                    </span>
                  )}
                  <PrStatusChip status={pr.status} />
                </div>

                <div className="border-t border-border bg-surface-raised px-4 py-2.5">
                  {pr.aiSummary && (
                    <p className="text-[12px] leading-relaxed text-muted-foreground">
                      <Sparkles className="mr-1.5 -mt-0.5 inline size-3 text-primary" />
                      {pr.aiSummary}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-[12px] text-muted-foreground">by {pr.author}</span>
                    {pr.branchName && <span className="font-mono text-[12px] text-muted-foreground">{pr.branchName}</span>}
                    <span className="font-mono text-[12px] text-muted-foreground">{new Date(pr.createdAt).toLocaleDateString()}</span>
                    <div className="ml-auto flex items-center gap-2">
                      {pr.feature ? (
                        <>
                          <Link href={`/dashboard/features/${pr.feature.id}`} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-surface-raised">
                            <Link2 className="size-3 text-primary" />{pr.feature.title}
                          </Link>
                          <button onClick={() => handleUnlink(pr.id)} disabled={unlinkMutation.isPending} className="text-[11px] text-destructive hover:underline disabled:opacity-50">
                            Unlink
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setPrId(pr.id)} className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-surface-raised">
                          <Link2 className="size-3" /> Link feature
                        </button>
                      )}
                      <a href={pr.githubPrUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                        GitHub <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {prId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-lg border border-border bg-[var(--popover)] p-5 shadow-xl">
            <h2 className="text-[16px] font-semibold">Link pull request</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">Select the feature this pull request delivers.</p>
            {linkMutation.isError && (
              <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                Failed to link pull request. Please try again.
              </div>
            )}
            <select value={featureId} onChange={(e) => setFeatureId(e.target.value)} className="mt-5 h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] outline-none focus:border-primary">
              <option value="">Select a feature</option>
              {features?.map((f) => <option key={f.id} value={f.id}>{f.title} · {f.status}</option>)}
            </select>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setPrId(null); setFeatureId(""); }} className="h-8 rounded-md border border-border px-3 text-[12px]">Cancel</button>
              <button onClick={handleLink} disabled={!featureId || linkMutation.isPending} className="h-8 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground disabled:opacity-50">
                {linkMutation.isPending ? "Linking…" : "Link feature"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
