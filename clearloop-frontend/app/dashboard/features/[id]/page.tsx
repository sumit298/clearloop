"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Bug as BugIcon, CircleDot, GitCommitHorizontal, GitPullRequest } from "lucide-react";
import { PageHeader, EmptyState, Section } from "@/components/clearloop/primitives";
import { DetailShell, RailGroup, RailRow, Stat, Timeline } from "@/components/clearloop/detail";
import { StatusChip, PriorityChip, PrStatusChip } from "@/components/clearloop/status";
import {
  FEATURE_STATUSES,
  StatusAdvanceButton,
  StatusSelect,
  nextFeatureStatus,
} from "@/components/clearloop/status-select";
import { useFeature, useUpdateFeature } from "@/lib/hooks/useFeatures";
import { getErrorMessage } from "@/lib/api/errors";
import { useState } from "react";

export default function FeatureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: feature, isLoading, error } = useFeature(params.id as string);
  const updateFeature = useUpdateFeature();
  const [statusError, setStatusError] = useState("");

  const changeStatus = (status: string) => {
    setStatusError("");
    updateFeature.mutate(
      { id: params.id as string, data: { status } },
      {
        onError: (mutationError) =>
          setStatusError(
            getErrorMessage(mutationError, "Could not update the status."),
          ),
      },
    );
  };

  if (isLoading) return <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">Loading…</div>;
  if (error || !feature) return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Feature not found</p>
        <button onClick={() => router.push("/dashboard/features")} className="mt-4 text-[13px] text-primary hover:underline">← Back to Features</button>
      </div>
    </div>
  );

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const advance = nextFeatureStatus(feature.status);

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/dashboard/features" className="hover:text-foreground">Features</Link>}
        title={feature.title}
        description={feature.reason}
        meta={
          <>
            {feature.project && (
              <Link href={`/dashboard/projects/${feature.project.id}`} className="rounded border border-border px-1.5 py-0.5 font-mono text-[12px] hover:text-foreground">
                {feature.project.name}
              </Link>
            )}
            <StatusChip status={feature.status} />
            <PriorityChip priority={feature.priority} />
          </>
        }
        actions={
          advance ? (
            <StatusAdvanceButton
              label={advance.label}
              pending={updateFeature.isPending}
              onClick={() => changeStatus(advance.value)}
            />
          ) : undefined
        }
      />

      {statusError && (
        <div className="border-b border-destructive/40 bg-destructive/10 px-6 py-2 text-[12px] text-destructive">
          {statusError}
        </div>
      )}

      <DetailShell
        main={
          <>
            <Section title="Why this exists" icon={CircleDot}>
              <div className="px-4 py-3.5">
                <p className="text-[13px] leading-relaxed">{feature.reason}</p>
                {feature.description && <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{feature.description}</p>}
              </div>
            </Section>

            <Section title={`Pull requests · ${feature.pullRequests?.length ?? 0}`} icon={GitPullRequest}>
              {!feature.pullRequests?.length ? (
                <EmptyState icon={GitPullRequest} title="No pull requests linked yet" description={`Push a branch named feature/${feature.id} and ClearLoop will link it automatically.`} />
              ) : (
                feature.pullRequests.map((pr) => (
                  <div key={pr.id} className="border-b border-border last:border-b-0">
                    <a href={pr.githubPrUrl} target="_blank" rel="noreferrer" className="row-hover flex items-center gap-3 px-4 py-2.5">
                      <span className="min-w-0 flex-1 truncate text-[13px]">{pr.title}</span>
                      <span className="hidden font-mono text-[12px] text-muted-foreground md:block">{pr.author}</span>
                      <PrStatusChip status={pr.status} />
                    </a>
                  </div>
                ))
              )}
            </Section>

            <Section title={`Linked bugs · ${feature.bugReports?.length ?? 0}`} icon={BugIcon}>
              {!feature.bugReports?.length ? (
                <EmptyState icon={BugIcon} title="No bugs linked" description="Regressions filed against this work show up here." />
              ) : (
                feature.bugReports.map((b) => (
                  <Link key={b.id} href={`/dashboard/bugs/${b.id}`} className="row-hover flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
                    <span className="min-w-0 flex-1 truncate text-[13px]">{b.title}</span>
                    <span className="font-mono text-[12px] text-muted-foreground">{b.severity}</span>
                  </Link>
                ))
              )}
            </Section>

            {(feature.activityLogs?.length ?? 0) > 0 && (
              <Section title="Activity" icon={GitCommitHorizontal}>
                <Timeline
                  events={feature.activityLogs!.map((log) => ({
                    icon: CircleDot,
                    actor: log.user?.name,
                    text: <>{log.action.replace(/_/g, " ").toLowerCase()}</>,
                    time: fmt(log.createdAt),
                  }))}
                />
              </Section>
            )}
          </>
        }
        rail={
          <>
            <RailGroup title="Properties">
              <RailRow label="Status">
                <StatusSelect
                  value={feature.status}
                  options={FEATURE_STATUSES}
                  pending={updateFeature.isPending}
                  onSelect={changeStatus}
                  renderChip={(status) => <StatusChip status={status} />}
                />
              </RailRow>
              <RailRow label="Priority"><PriorityChip priority={feature.priority} /></RailRow>
              <RailRow label="Created"><span className="font-mono text-[12px] text-muted-foreground">{fmt(feature.createdAt)}</span></RailRow>
              {feature.startedAt && <RailRow label="Started"><span className="font-mono text-[12px] text-muted-foreground">{fmt(feature.startedAt)}</span></RailRow>}
              {feature.completedAt && <RailRow label="Completed"><span className="font-mono text-[12px] text-muted-foreground">{fmt(feature.completedAt)}</span></RailRow>}
              {feature.assignedTo && <RailRow label="Assignee"><span className="text-[13px]">{feature.assignedTo.name}</span></RailRow>}
              {feature.createdBy && <RailRow label="Created by"><span className="text-[13px]">{feature.createdBy.name}</span></RailRow>}
            </RailGroup>

            <div className="grid grid-cols-3 divide-x divide-border">
              <Stat label="PRs" value={feature.pullRequests?.length ?? 0} />
              <Stat label="Bugs" value={feature.bugReports?.length ?? 0} />
              <Stat label="Logs" value={feature.activityLogs?.length ?? 0} />
            </div>
          </>
        }
      />
    </>
  );
}
