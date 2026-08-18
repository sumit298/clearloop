import Link from "next/link";
import {
  ArrowRight,
  Bug,
  CircleDot,
  Command,
  FolderGit2,
  GitMerge,
  GitPullRequest,
  Keyboard,
  Radar,
  Sparkles,
  Tag,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/landing/Logo";
import { GithubIcon } from "@/components/icons/GithubIcon";

const steps = [
  {
    icon: FolderGit2,
    label: "Project",
    text: "Connect a repo. ClearLoop mirrors branches, PRs and commits.",
  },
  {
    icon: CircleDot,
    label: "Feature",
    text: "Write the why, set priority, assign. Work becomes traceable.",
  },
  {
    icon: GitPullRequest,
    label: "Pull request",
    text: "PRs auto-link and arrive with a summary of the diff.",
  },
  {
    icon: Tag,
    label: "Release",
    text: "Shipped features roll up into notes you did not have to write.",
  },
];

const features = [
  {
    icon: Command,
    title: "Command palette",
    text: "Cmd+K navigates, searches entities, or starts a feature without touching the mouse.",
  },
  {
    icon: Sparkles,
    title: "AI pull request summaries",
    text: "Every PR gets structured context keyed to the head SHA.",
  },
  {
    icon: Radar,
    title: "Attention needed",
    text: "Overdue features and unresolved critical bugs surface themselves.",
  },
  {
    icon: GitMerge,
    title: "Two-way GitHub sync",
    text: "Branches, commits and merge state mirror through a durable webhook queue.",
  },
  {
    icon: Keyboard,
    title: "Built for velocity",
    text: "Lists are filterable, sortable, and remember your view.",
  },
  {
    icon: Zap,
    title: "Release notes, generated",
    text: "Cut a release and get a clean changelog grouped by feature and severity.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
          <Link href="/" aria-label="ClearLoop home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-5 text-[13px] text-text-muted md:flex">
            <a href="#how" className="hover:text-foreground">
              How it works
            </a>
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <Link href="/dashboard" className="hover:text-foreground">
              Product
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/signin"
              className="inline-flex h-8 items-center rounded-md px-3 text-[13px] hover:bg-[var(--surface-raised)]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground"
            >
              <GithubIcon className="size-3.5" /> Continue with GitHub
            </Link>
          </div>
        </div>
      </header>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent_75%)]" />
        <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[11px] text-text-muted">
            <span className="size-1.5 rounded-full bg-primary" />
            v2.4.0 — command palette shipped
          </div>
          <h1 className="mt-6 max-w-3xl text-[44px] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[58px]">
            <span className="bg-linear-to-b from-foreground to-foreground/55 bg-clip-text text-transparent">
              The loop between
            </span>
            <br />
            <span className="bg-linear-to-b from-foreground to-foreground/55 bg-clip-text text-transparent">
              GitHub and what you shipped.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-text-muted">
            ClearLoop tracks features, bugs, pull requests and releases against
            the repos they actually live in — so the plan and the diff never
            drift apart.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-[13px] font-medium text-primary-foreground"
            >
              <GithubIcon />
              Continue with GitHub
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-[13px] font-medium hover:bg-[var(--surface-raised)]"
            >
              Explore the product <ArrowRight className="size-4" />
            </Link>
            <span className="flex items-center gap-1.5 pl-1 text-[12px] text-text-muted">
              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px]">
                ⌘K
              </kbd>
              works everywhere
            </span>
          </div>
          <ProductPreview />
        </div>
      </section>
      <section id="how" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="font-mono text-[12px] text-primary">
            01 — the loop
          </div>
          <h2 className="mt-3 max-w-lg text-[28px] font-semibold leading-tight">
            Four objects. One direction of travel.
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
            {steps.map(({ icon: Icon, label, text }, index) => (
              <div key={label} className="relative bg-surface p-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-md border border-border bg-[var(--surface-raised)]">
                    <Icon className="size-3.5 text-primary" />
                  </span>
                  <span className="font-mono text-[12px] text-text-muted">
                    0{index + 1}
                  </span>
                  {index < steps.length - 1 && (
                    <ArrowRight className="ml-auto hidden size-3.5 text-text-muted md:block" />
                  )}
                </div>
                <h3 className="mt-4 text-[15px] font-semibold">{label}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="features" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="font-mono text-[12px] text-primary">
            02 — the surface
          </div>
          <h2 className="mt-3 max-w-lg text-[28px] font-semibold leading-tight">
            Dense where it counts, quiet everywhere else.
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="bg-surface p-6 transition-colors hover:bg-[var(--surface-raised)]"
              >
                <Icon className="size-4 text-primary" />
                <h3 className="mt-4 text-[14px] font-semibold">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-14">
          <div>
            <h2 className="text-[24px] font-semibold leading-tight">
              Install the GitHub App. Ship the loop.
            </h2>
            <p className="mt-2 text-[13px] text-text-muted">
              Two minutes to connect a repo. No agent, no CI changes.
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-[13px] font-medium text-primary-foreground"
          >
            <GithubIcon />
            Continue with GitHub
          </Link>
        </div>
      </section>
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-8 text-[12px] text-text-muted">
        <span className="flex items-center gap-2">
          <Logo className="[&>span]:hidden" />
          ClearLoop
        </span>
        <span>·</span>
        <Link href="/dashboard" className="hover:text-foreground">
          Product
        </Link>
        <Link href="/signin" className="hover:text-foreground">
          Sign in
        </Link>
        <a href="#how" className="hover:text-foreground">
          Docs
        </a>
        <span className="ml-auto font-mono">© 2026 ClearLoop, Inc.</span>
      </footer>
      <div aria-hidden className="select-none overflow-hidden px-6 pb-2">
        <div className="mx-auto max-w-6xl">
          <span
            className="block bg-linear-to-b from-foreground/20 to-foreground/0 bg-clip-text text-center font-semibold leading-[0.85] tracking-[-0.04em] text-transparent"
            style={{ fontSize: "clamp(3.5rem, 16vw, 15rem)" }}
          >
            clearloop
          </span>
        </div>
      </div>
    </div>
  );
}

function ProductPreview() {
  const rows = [
    "Make workspace activity searchable",
    "Release notes for version 2.4",
    "GitHub App repository sync",
    "Improve pull request linking",
  ];
  return (
    <div className="relative mt-14 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="flex gap-1.5">
          <i className="size-2 rounded-full bg-border-strong" />
          <i className="size-2 rounded-full bg-border-strong" />
          <i className="size-2 rounded-full bg-border-strong" />
        </span>
        <span className="ml-2 font-mono text-[11px] text-text-muted">
          clearloop.app/features
        </span>
      </div>
      <div className="grid md:grid-cols-[200px_minmax(0,1fr)]">
        <div className="hidden flex-col gap-1 border-r border-border p-3 md:flex">
          {[
            [CircleDot, "Features"],
            [Bug, "Bugs"],
            [GitPullRequest, "Pull Requests"],
            [Tag, "Releases"],
          ].map(([Icon, label], index) => {
            const ItemIcon = Icon as typeof CircleDot;
            return (
              <div
                key={label as string}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12px] ${index === 0 ? "bg-[var(--surface-raised)]" : "text-text-muted"}`}
              >
                <ItemIcon
                  className={`size-3.5 ${index === 0 ? "text-primary" : ""}`}
                />
                {label as string}
              </div>
            );
          })}
        </div>
        <div>
          {rows.map((row, index) => (
            <div
              key={row}
              className="flex items-center gap-3 border-b border-border px-4 py-2.5 text-[13px]"
            >
              <span className="w-[74px] shrink-0 font-mono text-[12px] text-text-muted">
                WEB-{153 - index}
              </span>
              <span className="min-w-0 flex-1 truncate">{row}</span>
              <span className="rounded-full bg-[var(--surface-raised)] px-2 py-0.5 text-[10px] text-text-muted">
                In progress
              </span>
            </div>
          ))}
          <div className="flex items-center gap-3 bg-primary/10 px-4 py-3 text-[12px] text-text-muted">
            <Sparkles className="size-3.5 text-primary" />
            AI summary · structured pull request context
          </div>
        </div>
      </div>
    </div>
  );
}
