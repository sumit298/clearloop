"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CircleDot, Copy, Tag } from "lucide-react";
import { useState } from "react";
import { PageHeader, Section } from "@/components/clearloop/primitives";
import { DetailShell, RailGroup, RailRow, Stat } from "@/components/clearloop/detail";
import { Chip, StatusChip, PriorityChip } from "@/components/clearloop/status";
import { useRelease } from "@/lib/hooks/useReleases";

export default function ReleaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: release, isLoading, error } = useRelease(params.id as string);
  const [copied, setCopied] = useState(false);

  if (isLoading) return <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">Loading…</div>;
  if (error || !release) return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Release not found</p>
        <button onClick={() => router.push("/dashboard/releases")} className="mt-4 text-[13px] text-primary hover:underline">← Back to Releases</button>
      </div>
    </div>
  );

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const copyNotes = () => {
    navigator.clipboard.writeText(`## ${release.version} — ${release.title}\n\n${release.description ?? ""}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/dashboard/releases" className="hover:text-foreground">Releases</Link>}
        title={release.title}
        description={release.releasedAt ? `Released ${fmt(release.releasedAt)}` : undefined}
        meta={
          <>
            <span className="rounded border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-[12px] text-muted-foreground">{release.version}</span>
            <Chip label="Shipped" tone="green" solidDot />
          </>
        }
        actions={
          <button onClick={copyNotes} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-[12px] hover:bg-surface-raised">
            <Copy className="size-3.5" /> {copied ? "Copied!" : "Copy notes"}
          </button>
        }
      />

      <DetailShell
        main={
          <>
            {release.description && (
              <Section title="Release notes" icon={Tag}>
                <div className="px-4 py-3.5">
                  <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-muted-foreground">{release.description}</pre>
                </div>
              </Section>
            )}

            <Section title={`Features included · ${release.features?.length ?? 0}`} icon={CircleDot}>
              {!release.features?.length ? (
                <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">No features in this release</div>
              ) : (
                release.features.map((item) => (
                  <Link key={item.feature.id} href={`/dashboard/features/${item.feature.id}`} className="row-hover flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
                    <span className="min-w-0 flex-1 truncate text-[13px]">{item.feature.title}</span>
                    {item.feature.project && <span className="hidden font-mono text-[12px] text-muted-foreground md:block">{item.feature.project.name}</span>}
                    <StatusChip status={item.feature.status} />
                    <PriorityChip priority={item.feature.priority} />
                  </Link>
                ))
              )}
            </Section>
          </>
        }
        rail={
          <>
            <RailGroup title="Release info">
              <RailRow label="Version"><span className="font-mono text-[12px]">{release.version}</span></RailRow>
              <RailRow label="Status"><Chip label="Shipped" tone="green" solidDot /></RailRow>
              {release.releasedAt && <RailRow label="Released"><span className="font-mono text-[12px] text-muted-foreground">{fmt(release.releasedAt)}</span></RailRow>}
              <RailRow label="Created"><span className="font-mono text-[12px] text-muted-foreground">{fmt(release.createdAt)}</span></RailRow>
            </RailGroup>

            <div className="grid grid-cols-3 divide-x divide-border">
              <Stat label="Features" value={release.features?.length ?? 0} />
              <Stat label="Done" value={release.features?.filter((f) => f.feature.status === "DONE").length ?? 0} />
              <Stat label="Review" value={release.features?.filter((f) => f.feature.status === "IN_REVIEW").length ?? 0} />
            </div>
          </>
        }
      />
    </>
  );
}
