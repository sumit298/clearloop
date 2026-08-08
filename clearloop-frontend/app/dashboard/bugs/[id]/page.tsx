"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Bug as BugIcon, CircleDot, GitCommitHorizontal, ShieldAlert } from "lucide-react";
import { PageHeader, EmptyState, Section } from "@/components/clearloop/primitives";
import { DetailShell, RailGroup, RailRow, Stat, Timeline } from "@/components/clearloop/detail";
import { SeverityChip, BugStatusChip, Chip } from "@/components/clearloop/status";
import { useBug } from "@/lib/hooks/useBugs";

export default function BugDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: bug, isLoading, error } = useBug(params.id as string);

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
      />

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
                  ...(bug.status === "IN_PROGRESS" || bug.status === "RESOLVED"
                    ? [{ icon: ShieldAlert, text: <>status changed to {bug.status.replace("_", " ").toLowerCase()}</>, time: "—" }]
                    : []),
                ]}
              />
            </Section>
          </>
        }
        rail={
          <>
            <RailGroup title="Properties">
              <RailRow label="Status"><BugStatusChip status={bug.status} /></RailRow>
              <RailRow label="Severity"><SeverityChip severity={bug.severity} /></RailRow>
              <RailRow label="Source"><Chip label={source} tone="slate" dot={false} /></RailRow>
              <RailRow label="Filed"><span className="font-mono text-[12px] text-muted-foreground">{fmt(bug.createdAt)}</span></RailRow>
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
