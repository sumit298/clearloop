"use client";

import { useWorkspaceStats } from "@/lib/hooks/useWorkspace";
import { useFeatures } from "@/lib/hooks/useFeatures";
import { useBugs } from "@/lib/hooks/useBugs";
import { usePullRequests } from "@/lib/hooks/usePullRequests";
import Link from "next/link";
import {
  AlertTriangle,
  Bug,
  CircleDot,
  GitPullRequest,
  Rocket,
} from "lucide-react";
import {
  EmptyState,
  MetricTile,
  PageHeader,
  Section,
} from "@/components/clearloop/primitives";

export default function DashboardPage() {
  const { data: stats, isLoading } = useWorkspaceStats();
  const { data: features } = useFeatures();
  const { data: bugs } = useBugs();
  const { data: pullRequests } = usePullRequests();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

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
          value={
            (pullRequests || []).filter((pr) => pr.status === "OPEN").length
          }
          tone="success"
        />
        <MetricTile
          icon={Bug}
          label="Unresolved bugs"
          value={
            (bugs || []).filter(
              (bug) => bug.status !== "RESOLVED" && bug.status !== "CLOSED",
            ).length
          }
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
                {
                  (bugs || []).filter(
                    (bug) =>
                      bug.status !== "RESOLVED" && bug.status !== "CLOSED",
                  ).length
                }{" "}
                items
              </span>
            }
          >
            {(bugs || [])
              .filter(
                (bug) => bug.status !== "RESOLVED" && bug.status !== "CLOSED",
              )
              .slice(0, 5)
              .map((bug) => (
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
              )) || (
              <EmptyState
                icon={AlertTriangle}
                title="Nothing is on fire"
                description="There are no unresolved bugs in this workspace."
              />
            )}
          </Section>
        </div>
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
          </div>
        </Section>
      </div>
    </>
  );
}
