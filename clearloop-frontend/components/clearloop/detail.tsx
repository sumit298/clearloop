"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DetailShell({ main, rail }: { main: ReactNode; rail: ReactNode }) {
  return (
    <div className="grid items-start gap-6 px-6 py-6 lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]">
      <div className="min-w-0 space-y-5">{main}</div>
      <aside className="lg:sticky lg:top-[72px]">
        <div className="panel divide-y divide-border">{rail}</div>
      </aside>
    </div>
  );
}

export function RailGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="p-4">
      <div className="mb-3 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function RailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[86px] shrink-0 text-[12px] text-muted-foreground">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function Stat({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn("px-4 py-3", className)}>
      <div className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{label}</div>
      <div className="mt-1 font-mono text-[18px] tnum">{value}</div>
    </div>
  );
}

export interface TimelineEvent {
  icon: LucideIcon;
  actor?: string;
  text: ReactNode;
  time: string;
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative px-4 py-3">
      <span className="absolute top-6 bottom-6 left-[27px] w-px bg-border" />
      {events.map((e, i) => (
        <li key={i} className="relative flex gap-3 py-2">
          <span className="z-10 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-surface">
            <e.icon className="size-3" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5 text-[13px]">
            <span className="text-muted-foreground">
              {e.actor && <span className="font-medium text-foreground">{e.actor} </span>}
              {e.text}
            </span>
          </div>
          <span className="shrink-0 pt-0.5 font-mono text-[12px] text-muted-foreground">{e.time}</span>
        </li>
      ))}
    </ol>
  );
}
