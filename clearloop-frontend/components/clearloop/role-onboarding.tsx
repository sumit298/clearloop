"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bug,
  Check,
  CircleDot,
  Eye,
  GitBranch,
  GitPullRequest,
  Rocket,
  Tag,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMe, useUpdateMe } from "@/lib/hooks/useUsers";
import { useWorkspaceStats } from "@/lib/hooks/useWorkspace";
import { useGitHubInstallation } from "@/lib/hooks/useGitHub";

interface Step {
  icon: LucideIcon;
  title: string;
  body: string;
  href: string;
  cta: string;
  /**
   * Whether the step is satisfied. Left undefined for steps that are places to
   * look rather than things to do — those render as a tour entry with no
   * checkbox, so nobody is shown a box they have no permission to tick.
   */
  done?: boolean;
}

interface Track {
  greeting: string;
  blurb: string;
  steps: Step[];
}

function buildTrack(
  role: string,
  signals: {
    githubConnected: boolean;
    hasProjects: boolean;
    hasTeam: boolean;
    hasFeatures: boolean;
    hasBugs: boolean;
    hasReleases: boolean;
    githubUsername: boolean;
  },
): Track {
  switch (role) {
    case "ADMIN":
      return {
        greeting: "Welcome in.",
        blurb:
          "You own this workspace. Four things turn ClearLoop from empty to self-updating.",
        steps: [
          {
            icon: GitBranch,
            title: "Connect GitHub",
            body: "Pull requests and commits start linking themselves to features.",
            href: "/dashboard/settings",
            cta: "Connect",
            done: signals.githubConnected,
          },
          {
            icon: Rocket,
            title: "Create a project",
            body: "Projects are where repositories, features and releases hang together.",
            href: "/dashboard/projects",
            cta: "Create",
            done: signals.hasProjects,
          },
          {
            icon: Users,
            title: "Invite your team",
            body: "Everyone sees the same delivery picture without a status meeting.",
            href: "/dashboard/team",
            cta: "Invite",
            done: signals.hasTeam,
          },
          {
            icon: CircleDot,
            title: "Plan the first feature",
            body: "The loop starts filling in once there is work to track.",
            href: "/dashboard/features",
            cta: "Plan",
            done: signals.hasFeatures,
          },
        ],
      };

    case "MANAGER":
      return {
        greeting: "Welcome in.",
        blurb:
          "Plan the work and let the loop report on itself. Start with a project.",
        steps: [
          {
            icon: Rocket,
            title: "Create a project",
            body: "Group the work your team is delivering.",
            href: "/dashboard/projects",
            cta: "Create",
            done: signals.hasProjects,
          },
          {
            icon: CircleDot,
            title: "Plan the first feature",
            body: "Capture what is being built and why.",
            href: "/dashboard/features",
            cta: "Plan",
            done: signals.hasFeatures,
          },
          {
            icon: Users,
            title: "Invite your team",
            body: "Assign work and let progress report itself.",
            href: "/dashboard/team",
            cta: "Invite",
            done: signals.hasTeam,
          },
          {
            icon: Tag,
            title: "Cut a release",
            body: "Bundle shipped features into something you can share.",
            href: "/dashboard/releases",
            cta: "Open releases",
            done: signals.hasReleases,
          },
        ],
      };

    case "DEVELOPER":
      return {
        greeting: "Welcome in, developer.",
        blurb:
          "ClearLoop reads your branches. Press ⌘K anywhere to jump around.",
        steps: [
          {
            icon: GitBranch,
            title: "Add your GitHub username",
            body: "Lets ClearLoop match your pull requests to your name.",
            href: "/dashboard/settings",
            cta: "Add",
            done: signals.githubUsername,
          },
          {
            icon: CircleDot,
            title: "Pick up a feature",
            body: "See what is planned and move it into progress.",
            href: "/dashboard/features",
            cta: "Browse",
            done: signals.hasFeatures,
          },
          {
            icon: GitPullRequest,
            title: "Check the pull request queue",
            body: "Open PRs with an AI summary of what changed.",
            href: "/dashboard/pull-requests",
            cta: "Open queue",
          },
          {
            icon: Bug,
            title: "File a bug",
            body: "Regressions link back to the feature that caused them.",
            href: "/dashboard/bugs",
            cta: "Open bugs",
            done: signals.hasBugs,
          },
        ],
      };

    default:
      // Viewers cannot create anything, so this is a tour rather than a
      // checklist — every entry is somewhere useful to look.
      return {
        greeting: "Welcome in.",
        blurb:
          "You have read access to this workspace. Here is where the delivery picture lives.",
        steps: [
          {
            icon: Eye,
            title: "Read the delivery overview",
            body: "Throughput, pipeline and open bugs at a glance.",
            href: "/dashboard",
            cta: "Open",
          },
          {
            icon: CircleDot,
            title: "Browse the feature pipeline",
            body: "What is planned, in progress, in review and done.",
            href: "/dashboard/features",
            cta: "Browse",
          },
          {
            icon: Tag,
            title: "See what shipped",
            body: "Releases with the features they included.",
            href: "/dashboard/releases",
            cta: "Browse",
          },
          {
            icon: Bug,
            title: "Track open bugs",
            body: "What is broken and how severe it is.",
            href: "/dashboard/bugs",
            cta: "Browse",
          },
        ],
      };
  }
}

export type OnboardingSignals = Parameters<typeof buildTrack>[1];

/** Data container: works out the role and which steps are already satisfied. */
export function RoleOnboarding() {
  const { data: me } = useMe();
  const { data: stats } = useWorkspaceStats();
  const { data: installation } = useGitHubInstallation();
  const updateMe = useUpdateMe();

  // Nothing to show until we know who they are — guessing a role and
  // re-rendering a different checklist a moment later is worse than waiting.
  if (!me || me.onboardingDismissedAt) return null;

  return (
    <RoleOnboardingView
      role={me.role}
      signals={{
        githubConnected: Boolean(installation?.connected),
        hasProjects: (stats?.projects.total ?? 0) > 0,
        hasTeam: (stats?.users.total ?? 0) > 1,
        hasFeatures: (stats?.features.total ?? 0) > 0,
        hasBugs: (stats?.bugs.total ?? 0) > 0,
        hasReleases: (stats?.releases.total ?? 0) > 0,
        githubUsername: Boolean(me.githubUsername),
      }}
      dismissing={updateMe.isPending}
      onDismiss={() => updateMe.mutate({ dismissOnboarding: true })}
    />
  );
}

/** Presentational half — no data fetching, so it can be previewed per role. */
export function RoleOnboardingView({
  role,
  signals,
  onDismiss,
  dismissing = false,
}: {
  role: string;
  signals: OnboardingSignals;
  onDismiss: () => void;
  dismissing?: boolean;
}) {
  const track = buildTrack(role, signals);

  const checkable = track.steps.filter((step) => step.done !== undefined);
  const completed = checkable.filter((step) => step.done).length;

  // Once every actionable step is done the panel has nothing left to say, so
  // it retires itself rather than waiting to be dismissed.
  if (checkable.length > 0 && completed === checkable.length) return null;

  return (
    <section className="panel overflow-hidden">
      <header className="flex items-start gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-semibold">{track.greeting}</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
            {track.blurb}
          </p>
        </div>
        {checkable.length > 0 && (
          <span className="shrink-0 rounded-full bg-surface-raised px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
            {completed}/{checkable.length}
          </span>
        )}
        <button
          type="button"
          onClick={onDismiss}
          disabled={dismissing}
          aria-label="Dismiss onboarding"
          title="Dismiss"
          className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <X className="size-3.5" />
        </button>
      </header>

      <ol>
        {track.steps.map((step) => (
          <li
            key={step.title}
            className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
          >
            {step.done === undefined ? (
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border">
                <step.icon className="size-3 text-muted-foreground" />
              </span>
            ) : (
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${
                  step.done
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border"
                }`}
              >
                {step.done ? (
                  <Check className="size-3" />
                ) : (
                  <step.icon className="size-3 text-muted-foreground" />
                )}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <div
                className={`text-[13px] font-medium ${
                  step.done ? "text-muted-foreground line-through" : ""
                }`}
              >
                {step.title}
              </div>
              <p className="mt-0.5 text-[12px] text-muted-foreground">{step.body}</p>
            </div>

            {!step.done && (
              <Link
                href={step.href}
                className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-border px-2.5 text-[12px] hover:bg-surface-raised"
              >
                {step.cta}
                <ArrowRight className="size-3" />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
