"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CircleDot,
  ExternalLink,
  GitBranch,
  GitPullRequest,
  Link2,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { PageHeader, Section } from "@/components/clearloop/primitives";
import { Markdown } from "@/components/clearloop/markdown";
import {
  DetailShell,
  RailGroup,
  RailRow,
  Timeline,
  type TimelineEvent,
} from "@/components/clearloop/detail";
import { Chip, PrStatusChip, StatusChip } from "@/components/clearloop/status";
import { usePullRequest } from "@/lib/hooks/usePullRequests";

export default function PullRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: pr, isLoading, error } = usePullRequest(params.id as string);

  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
        Loading…
      </div>
    );

  if (error || !pr)
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Pull request not found</p>
          <button
            onClick={() => router.push("/dashboard/pull-requests")}
            className="mt-4 text-[13px] text-primary hover:underline"
          >
            ← Back to pull requests
          </button>
        </div>
      </div>
    );

  const fmt = (value?: string) =>
    value
      ? new Date(value).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  const opened = pr.githubCreatedAt ?? pr.createdAt;

  // Only events with a real timestamp make it onto the timeline — a merged
  // marker on an open PR would be a fabrication.
  const events: TimelineEvent[] = [
    {
      icon: GitPullRequest,
      text: <>opened this pull request</>,
      time: fmt(opened),
    },
  ];
  if (pr.mergedAt)
    events.push({ icon: GitBranch, text: <>merged</>, time: fmt(pr.mergedAt) });
  if (pr.closedAt && !pr.mergedAt)
    events.push({
      icon: GitPullRequest,
      text: <>closed without merging</>,
      time: fmt(pr.closedAt),
    });

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/dashboard/pull-requests" className="hover:text-foreground">
            Pull requests
          </Link>
        }
        title={pr.title}
        description={pr.repository?.fullName}
        meta={
          <>
            {pr.githubPrNumber != null && (
              <span className="rounded border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-[12px] text-muted-foreground">
                #{pr.githubPrNumber}
              </span>
            )}
            {pr.branchName && (
              <span className="flex items-center gap-1.5 rounded border border-border px-1.5 py-0.5">
                <GitBranch className="size-3 text-muted-foreground" />
                <span className="font-mono text-[12px]">{pr.branchName}</span>
              </span>
            )}
            <PrStatusChip status={pr.status} />
            {pr.isDraft && <Chip label="Draft" tone="slate" />}
          </>
        }
        actions={
          pr.githubPrUrl ? (
            <a
              href={pr.githubPrUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-[12px] hover:bg-surface-raised"
            >
              <ExternalLink className="size-3.5" /> Open on GitHub
            </a>
          ) : undefined
        }
      />

      <DetailShell
        main={
          <>
            {pr.aiSummary && (
              <Section title="AI summary" icon={Sparkles}>
                <div className="px-4 py-3.5">
                  <Markdown className="text-[13px]">{pr.aiSummary}</Markdown>
                  {pr.aiRisk && (
                    <p className="mt-3 flex gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
                      <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" />
                      {pr.aiRisk}
                    </p>
                  )}
                </div>
              </Section>
            )}

            {pr.description && (
              <Section title="Description" icon={GitPullRequest}>
                <div className="px-4 py-3.5">
                  <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-muted-foreground">
                    {pr.description}
                  </pre>
                </div>
              </Section>
            )}

            <Section title="Linked feature" icon={Link2}>
              {pr.feature ? (
                <Link
                  href={`/dashboard/features/${pr.feature.id}`}
                  className="row-hover flex items-center gap-3 px-4 py-2.5"
                >
                  <CircleDot className="size-3.5 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-[13px]">
                    {pr.feature.title}
                  </span>
                  {pr.feature.project && (
                    <span className="hidden font-mono text-[12px] text-muted-foreground md:block">
                      {pr.feature.project.name}
                    </span>
                  )}
                  <StatusChip status={pr.feature.status} />
                </Link>
              ) : (
                <div className="px-4 py-6 text-center text-[13px] text-muted-foreground">
                  Not linked to a feature yet.{" "}
                  <Link
                    href="/dashboard/pull-requests"
                    className="text-primary hover:underline"
                  >
                    Link it
                  </Link>
                </div>
              )}
            </Section>

            <Section title="Activity" icon={GitBranch}>
              <Timeline events={events} />
            </Section>
          </>
        }
        rail={
          <>
            <RailGroup title="Details">
              {pr.repository?.fullName && (
                <RailRow label="Repository">
                  <span className="truncate font-mono text-[12px]">
                    {pr.repository.fullName}
                  </span>
                </RailRow>
              )}
              <RailRow label="Status">
                <PrStatusChip status={pr.status} />
              </RailRow>
              {pr.headBranch && (
                <RailRow label="Head">
                  <span className="truncate font-mono text-[12px]">
                    {pr.headBranch}
                  </span>
                </RailRow>
              )}
              {pr.baseBranch && (
                <RailRow label="Base">
                  <span className="truncate font-mono text-[12px]">
                    {pr.baseBranch}
                  </span>
                </RailRow>
              )}
            </RailGroup>

            <RailGroup title="People">
              <RailRow label="Author">
                <span className="text-[13px]">
                  {pr.authorGithubLogin ?? pr.author ?? "Unknown"}
                </span>
              </RailRow>
            </RailGroup>

            <RailGroup title="Timeline">
              <RailRow label="Opened">
                <span className="font-mono text-[12px] text-muted-foreground">
                  {fmt(opened)}
                </span>
              </RailRow>
              {pr.mergedAt && (
                <RailRow label="Merged">
                  <span className="font-mono text-[12px] text-muted-foreground">
                    {fmt(pr.mergedAt)}
                  </span>
                </RailRow>
              )}
              {pr.closedAt && !pr.mergedAt && (
                <RailRow label="Closed">
                  <span className="font-mono text-[12px] text-muted-foreground">
                    {fmt(pr.closedAt)}
                  </span>
                </RailRow>
              )}
            </RailGroup>
          </>
        }
      />
    </>
  );
}
