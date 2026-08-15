"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Bug as BugIcon, CircleDot, GitCommitHorizontal, ShieldAlert } from "lucide-react";
import { PageHeader, EmptyState, Section } from "@/components/clearloop/primitives";
import { DetailShell, RailGroup, RailRow, Stat, Timeline } from "@/components/clearloop/detail";
import { SeverityChip, BugStatusChip, Chip } from "@/components/clearloop/status";
import {
  BUG_STATUSES,
  StatusAdvanceButton,
  StatusSelect,
  nextBugStatus,
} from "@/components/clearloop/status-select";
import { useBug, useUpdateBug } from "@/lib/hooks/useBugs";
import type { UpdateBugReportData } from "@/lib/api/bugs";
import { getErrorMessage } from "@/lib/api/errors";
import { useState } from "react";

export default function BugDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: bug, isLoading, error } = useBug(params.id as string);
  const updateBug = useUpdateBug();
  const [statusError, setStatusError] = useState("");

  const changeStatus = (status: string) => {
    setStatusError("");
    updateBug.mutate(
      {
        id: params.id as string,
        data: { status: status as UpdateBugReportData["status"] },
      },
      {
        onError: (mutationError) =>
          setStatusError(
            getErrorMessage(mutationError, "Could not update the status."),
          ),
      },
    );
  };

  if (isLoading) return <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">Loading…</div>;
  if (error || !bug) return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Bug not found</p>
        <button onClick={() => router.push("/dashboard/bugs")} className="mt-4 text-[13px] text-primary hover:underline">← Back to Bugs</button>
      </div>
    </div>
  );

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const sourceMatch = bug.description?.match(/\*\*Source:\*\*\s*(.+?)\n/);
  const source = sourceMatch ? sourceMatch[1] : "Unknown";
  const description = bug.description?.replace(/\*\*Source:\*\*\s*.+?\n\n/, "") ?? "";
  const advance = nextBugStatus(bug.status);

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/dashboard/bugs" className="hover:text-foreground">Bugs</Link>}
        title={bug.title}
        description={description}
        meta={
          <>
            <SeverityChip severity={bug.severity} />
            <BugStatusChip status={bug.status} />
            <Chip label={source} tone="slate" dot={false} />
          </>
        }
        actions={
          advance ? (
            <StatusAdvanceButton
              label={advance.label}
              pending={updateBug.isPending}
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
            <Section title="What happens" icon={BugIcon}>
              <div className="px-4 py-3.5">
                <p className="text-[13px] leading-relaxed">{description}</p>
              </div>
            </Section>

            {bug.feature && (
              <Section title="Caused by" icon={CircleDot}>
                <Link href={`/dashboard/features/${bug.feature.id}`} className="row-hover flex items-center gap-3 px-4 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-[13px]">{bug.feature.title}</span>
                  {bug.feature.project && <span className="font-mono text-[12px] text-muted-foreground">{bug.feature.project.name}</span>}
                </Link>
              </Section>
            )}

            <Section title="Activity" icon={GitCommitHorizontal}>
              <Timeline
                events={[
                  { icon: BugIcon, actor: bug.reportedBy?.name, text: <>filed this bug from {source}</>, time: fmt(bug.createdAt) },
                  // Only stamped transitions appear — an undated "status
                  // changed" row told the reader nothing it could act on.
                  ...(bug.resolvedAt
                    ? [{ icon: ShieldAlert, text: <>marked resolved</>, time: fmt(bug.resolvedAt) }]
                    : []),
                  ...(bug.closedAt
                    ? [{ icon: ShieldAlert, text: <>closed</>, time: fmt(bug.closedAt) }]
                    : []),
                ]}
              />
            </Section>
          </>
        }
        rail={
          <>
            <RailGroup title="Properties">
              <RailRow label="Status">
                <StatusSelect
                  value={bug.status}
                  options={BUG_STATUSES}
                  pending={updateBug.isPending}
                  onSelect={changeStatus}
                  renderChip={(status) => <BugStatusChip status={status} />}
                />
              </RailRow>
              <RailRow label="Severity"><SeverityChip severity={bug.severity} /></RailRow>
              <RailRow label="Source"><Chip label={source} tone="slate" dot={false} /></RailRow>
              <RailRow label="Filed"><span className="font-mono text-[12px] text-muted-foreground">{fmt(bug.createdAt)}</span></RailRow>
              {bug.resolvedAt && <RailRow label="Resolved"><span className="font-mono text-[12px] text-muted-foreground">{fmt(bug.resolvedAt)}</span></RailRow>}
            </RailGroup>

            <RailGroup title="People">
              {bug.reportedBy && <RailRow label="Reporter"><span className="text-[13px]">{bug.reportedBy.name}</span></RailRow>}
            </RailGroup>

            <div className="grid grid-cols-3 divide-x divide-border">
              <Stat label="Status" value={bug.status === "RESOLVED" ? "✓" : "○"} />
              <Stat label="Severity" value={bug.severity.charAt(0)} />
              <Stat label="Comments" value={bug.comments?.length ?? 0} />
            </div>
          </>
        }
      />
    </>
  );
}
