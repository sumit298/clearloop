import { Nav } from "@/components/landing/Nav";
import { HeroTimeline } from "@/components/landing/HeroTimeline";
import { ContextTimeline } from "@/components/landing/ContextTimeLine";
import { WorkflowSection, SectionLabel } from "@/components/landing/WorkflowSection";
import { AISection } from "@/components/landing/AISection";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 grid-bg grid-bg-fade opacity-60" />
        <div className="relative mx-auto max-w-[1200px] px-6 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary-soft" />
            v1.4 · audit-grade event timeline now in beta
          </div>

          <h1 className="mt-7 max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-tightest text-foreground md:text-[68px]">
            Engineering context,<br />
            <span className="text-text-dim">finally connected.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-text-dim">
            Track features, pull requests, releases, bugs, and decisions in one
            continuous operational timeline.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#start"
              className="inline-flex items-center gap-2 rounded-md border border-primary-soft/30 bg-primary px-4 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover"
            >
              Start free
              <span className="text-primary-soft">→</span>
            </a>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-surface px-4 py-2.5 text-[13px] font-medium text-text-dim transition-colors hover:border-primary-soft/30 hover:text-foreground"
            >
              View demo
            </a>
            <span className="ml-1 font-mono text-[11px] text-text-muted">
              no credit card · self-hosted available
            </span>
          </div>

          {/* Hero visual */}
          <div className="mt-14">
            <HeroTimeline />
          </div>

          {/* Logo row */}
          <div className="mt-14 flex flex-col items-start gap-5 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
            <p className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
              In use at engineering teams shipping serious software
            </p>
            <div className="flex flex-wrap items-center gap-x-10 gap-y-3 text-[13px] font-medium text-text-muted">
              {["northwind", "axiom labs", "meridian", "octolab", "fieldwire", "halcyon"].map(
                (l) => (
                  <span key={l} className="tracking-tight">
                    {l}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <WorkflowSection />

      {/* Context Timeline */}
      <section id="timeline" className="border-y border-border bg-surface-2/20">
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <SectionLabel index="03" label="Timeline" />
              <h2 className="mt-6 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                One canonical view of how work actually flows.
              </h2>
            </div>
            <p className="max-w-sm text-[14px] text-text-dim">
              Lanes for features, PRs, releases, incidents, and decisions —
              correlated across services and rendered in real time.
            </p>
          </div>
          <div className="mt-12">
            <ContextTimeline />
          </div>
        </div>
      </section>

      {/* AI */}
      <AISection />

      {/* Features */}
      <FeatureGrid />

      {/* Final CTA */}
      <section id="start" className="relative border-y border-border bg-background">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_60%_70%_at_50%_50%,black_20%,transparent_75%)]" />
        <div className="relative mx-auto max-w-[1100px] px-6 py-28 text-center">
          <SectionLabel index="06" label="Get started" />
          <h2 className="mx-auto mt-8 max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tightest text-foreground sm:text-5xl">
            Stop reconstructing context.<br />
            <span className="text-text-dim">Start operating on it.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[15px] text-text-dim">
            Connect a repo in under five minutes. ClearLoop indexes your last
            ninety days of activity into a working timeline.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-md border border-primary-soft/30 bg-primary px-5 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-primary-hover"
            >
              Start free
              <span className="text-primary-soft">→</span>
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-surface px-5 py-2.5 text-[13px] font-medium text-text-dim transition-colors hover:border-primary-soft/30 hover:text-foreground"
            >
              Book a walkthrough
            </a>
          </div>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-wider text-text-muted">
            cloud · self-hosted · single-tenant
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
