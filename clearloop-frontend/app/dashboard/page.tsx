"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkspaceStats } from "@/lib/hooks/useWorkspace";
import { useFeatures } from "@/lib/hooks/useFeatures";
import { useBugs } from "@/lib/hooks/useBugs";
import { usePullRequests } from "@/lib/hooks/usePullRequests";
import Link from "next/link";
import {
  AlertTriangle,
  Bug,
  CircleAlert,
  CircleDot,
  Flame,
  GitPullRequest,
  Info,
  Layers,
  Rocket,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import {
  EmptyState,
  MetricTile,
  PageHeader,
  Section,
} from "@/components/clearloop/primitives";
import {
  ChartCard,
  PipelineBar,
  SeverityBreakdown,
  StackTable,
  TrendChart,
  TrendTable,
  type ChartSeries,
  type SeverityRow,
  type StackSegment,
} from "@/components/clearloop/charts";
import { RoleOnboarding } from "@/components/clearloop/role-onboarding";
import { RANGES, weeklyBuckets } from "@/lib/charts/series";

// Ordered pipeline stages get the ordinal ramp — the colour carries the order.
// CANCELLED is an exit from the pipeline, not a stage in it, so it sits in the
// neutral slate instead of continuing the ramp.
const PIPELINE_STAGES = [
  { key: "BACKLOG", label: "Backlog", color: "var(--chart-ord-1)", ink: "var(--chart-ord-1-ink)" },
  { key: "PLANNED", label: "Planned", color: "var(--chart-ord-2)", ink: "var(--chart-ord-2-ink)" },
  { key: "IN_PROGRESS", label: "In progress", color: "var(--chart-ord-3)", ink: "var(--chart-ord-3-ink)" },
  { key: "IN_REVIEW", label: "In review", color: "var(--chart-ord-4)", ink: "var(--chart-ord-4-ink)" },
  { key: "DONE", label: "Done", color: "var(--chart-ord-5)", ink: "var(--chart-ord-5-ink)" },
  { key: "CANCELLED", label: "Cancelled", color: "var(--hue-slate)", ink: "var(--chart-slate-ink)" },
];

// Severity is a status scale, not series identity, so it uses the reserved
// status hues and every row ships an icon plus a text label.
const SEVERITIES = [
  { key: "LOW", label: "Low", color: "var(--hue-slate)", icon: Info },
  { key: "MEDIUM", label: "Medium", color: "var(--hue-amber)", icon: CircleAlert },
  { key: "HIGH", label: "High", color: "var(--hue-orange)", icon: ShieldAlert },
  { key: "CRITICAL", label: "Critical", color: "var(--hue-red)", icon: Flame },
];

const isUnresolved = (status: string) =>
  status !== "RESOLVED" && status !== "CLOSED";

export default function DashboardPage() {
  const { data: stats, isLoading } = useWorkspaceStats();
  const { data: features } = useFeatures();
  const { data: bugs } = useBugs();
  const { data: pullRequests } = usePullRequests();
  const [weeks, setWeeks] = useState<number>(12);

  // Week labels come from the clock, and this route prerenders — so the trend
  // chart only renders once mounted, otherwise the build-time weeks would not
  // match the ones the browser computes on hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const openBugs = useMemo(
    () => (bugs || []).filter((bug) => isUnresolved(bug.status)),
    [bugs],
  );

  const trendSeries: ChartSeries[] = useMemo(
    () => !mounted
      ? []
      : [
      {
        key: "shipped",
        label: "Features shipped",
        color: "var(--chart-1)",
        buckets: weeklyBuckets(
          (features || []).map((feature) => feature.completedAt),
          weeks,
        ),
      },
      {
        key: "resolved",
        label: "Bugs resolved",
        color: "var(--chart-2)",
        buckets: weeklyBuckets(
          (bugs || []).map((bug) => bug.resolvedAt),
          weeks,
        ),
      },
    ],
    [features, bugs, weeks, mounted],
  );

  const pipeline: StackSegment[] = useMemo(
    () =>
      PIPELINE_STAGES.map((stage) => ({
        ...stage,
        value: (features || []).filter((feature) => feature.status === stage.key)
          .length,
      })),
    [features],
  );

  const severityRows: SeverityRow[] = useMemo(
    () =>
      SEVERITIES.map((severity) => ({
        ...severity,
        value: openBugs.filter((bug) => bug.severity === severity.key).length,
      })),
    [openBugs],
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const openPrCount = (pullRequests || []).filter((pr) => pr.status === "OPEN")
    .length;

  return (
    <>
      <PageHeader
        eyebrow="ClearLoop workspace"
        title="Overview"
        description="Delivery signal across your engineering workspace."
        actions={
          <>
            <Link
              href="/dashboard/releases"
              className="inline-flex h-8 items-center rounded-md border border-border px-3 text-[12px] font-medium hover:bg-(--surface-raised)"
            >
              Releases
            </Link>
            <Link
              href="/dashboard/features"
              className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground"
            >
              Plan work
            </Link>
          </>
        }
      />
      <div className="grid gap-px border-b border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={CircleDot}
          label="Features in flight"
          value={stats?.features.byStatus?.IN_PROGRESS || 0}
        />
        <MetricTile
          icon={GitPullRequest}
          label="Open pull requests"
          value={openPrCount}
          tone="success"
        />
        <MetricTile
          icon={Bug}
          label="Unresolved bugs"
          value={openBugs.length}
          tone="warning"
        />
        <MetricTile
          icon={Rocket}
          label="Projects"
          value={stats?.projects.total || 0}
        />
      </div>

      <div className="grid gap-5 p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <RoleOnboarding />

          <ChartCard
            title="Delivery throughput"
            icon={TrendingUp}
            subtitle="Completed per week"
            legend={trendSeries.map((item) => ({
              label: item.label,
              color: item.color,
            }))}
            table={<TrendTable series={trendSeries} />}
            action={
              // One range control, sitting above the only chart it scopes. The
              // snapshot charts below say so in their own subtitles.
              <div
                role="group"
                aria-label="Trend range"
                className="flex items-center rounded-md border border-border p-0.5"
              >
                {RANGES.map((option) => (
                  <button
                    key={option.weeks}
                    type="button"
                    onClick={() => setWeeks(option.weeks)}
                    aria-pressed={weeks === option.weeks}
                    className={`h-5 rounded px-1.5 font-mono text-[10px] ${
                      weeks === option.weeks
                        ? "bg-surface-raised text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            }
          >
            {mounted ? (
              <TrendChart series={trendSeries} />
            ) : (
              // Same height as the plot, so mounting does not shift the page.
              <div className="h-57" />
            )}
          </ChartCard>

          <ChartCard
            title="Feature pipeline"
            icon={Layers}
            subtitle="Current snapshot"
            table={<StackTable segments={pipeline} unit="Stage" />}
          >
            <PipelineBar segments={pipeline} />
          </ChartCard>

          <Section
            title="Features in progress"
            icon={CircleDot}
            action={
              <Link
                href="/dashboard/features"
                className="text-[12px] text-muted-foreground hover:text-foreground"
              >
                All features
              </Link>
            }
          >
            {!features?.length ? (
              <EmptyState
                icon={CircleDot}
                title="No features yet"
                description="Create the first feature to start tracking your delivery loop."
                action={
                  <Link
                    href="/dashboard/features"
                    className="rounded-md bg-primary px-3 py-2 text-[12px] font-medium text-primary-foreground"
                  >
                    Create feature
                  </Link>
                }
              />
            ) : (
              features.slice(0, 6).map((feature) => (
                <Link
                  key={feature.id}
                  href={`/dashboard/features/${feature.id}`}
                  className="row-hover flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
                >
                  <span className="min-w-0 flex-1 truncate text-[13px]">
                    {feature.title}
                  </span>
                  <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {feature.status.replace("_", " ")}
                  </span>
                </Link>
              ))
            )}
          </Section>

          <Section
            title="Attention needed"
            icon={AlertTriangle}
            action={
              <span className="font-mono text-[12px] text-muted-foreground">
                {openBugs.length} items
              </span>
            }
          >
            {!openBugs.length ? (
              <EmptyState
                icon={AlertTriangle}
                title="Nothing is on fire"
                description="There are no unresolved bugs in this workspace."
              />
            ) : (
              openBugs.slice(0, 5).map((bug) => (
                <Link
                  key={bug.id}
                  href={`/dashboard/bugs/${bug.id}`}
                  className="row-hover flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
                >
                  <Bug className="size-3.5 text-destructive" />
                  <span className="min-w-0 flex-1 truncate text-[13px]">
                    {bug.title}
                  </span>
                  <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                    {bug.status}
                  </span>
                </Link>
              ))
            )}
          </Section>
        </div>

        <div className="space-y-5">
          <ChartCard
            title="Open bugs by severity"
            icon={Bug}
            subtitle="Current snapshot"
            table={
              <StackTable
                segments={severityRows.map(({ key, label, color, value }) => ({
                  key,
                  label,
                  color,
                  value,
                }))}
                unit="Severity"
              />
            }
          >
            <SeverityBreakdown rows={severityRows} />
          </ChartCard>

          <Section title="Workspace health" icon={Rocket}>
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3 text-[13px]">
                <span className="text-muted-foreground">Team members</span>
                <span className="font-mono">
                  {stats?.users.active || 0}
                  <span className="text-muted-foreground">
                    {" "}
                    / {stats?.users.total || 0}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-[13px]">
                <span className="text-muted-foreground">Bug reports</span>
                <span className="font-mono">{stats?.bugs.total || 0}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-[13px]">
                <span className="text-muted-foreground">Releases</span>
                <span className="font-mono">{stats?.releases.total || 0}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-[13px]">
                <span className="text-muted-foreground">Merged pull requests</span>
                <span className="font-mono">
                  {(pullRequests || []).filter((pr) => pr.status === "MERGED").length}
                </span>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}
