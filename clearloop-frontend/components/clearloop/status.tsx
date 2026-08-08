import { cn } from "@/lib/utils";

type Tone = "slate" | "blue" | "amber" | "green" | "red" | "violet" | "orange";

const TONE_VAR: Record<Tone, string> = {
  slate: "var(--hue-slate)",
  blue: "var(--hue-blue)",
  amber: "var(--hue-amber)",
  green: "var(--hue-green)",
  red: "var(--hue-red)",
  violet: "var(--hue-violet)",
  orange: "var(--hue-orange)",
};

export function toneColor(tone: Tone) {
  return TONE_VAR[tone];
}

export function Chip({ label, tone, className, dot = true, solidDot = false }: {
  label: string; tone: Tone; className?: string; dot?: boolean; solidDot?: boolean;
}) {
  const c = TONE_VAR[tone];
  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] leading-5 font-medium whitespace-nowrap", className)}
      style={{ color: c, backgroundColor: `color-mix(in oklab, ${c} 12%, transparent)`, borderColor: `color-mix(in oklab, ${c} 26%, transparent)` }}
    >
      {dot && <span className="size-1.5 rounded-full" style={{ backgroundColor: solidDot ? c : "transparent", boxShadow: solidDot ? undefined : `inset 0 0 0 1.5px ${c}` }} />}
      {label}
    </span>
  );
}

// Feature status — backend uses PLANNED, IN_PROGRESS, IN_REVIEW, DONE, CANCELLED
const FEATURE_STATUS: Record<string, { label: string; tone: Tone }> = {
  PLANNED: { label: "Planned", tone: "slate" },
  IN_PROGRESS: { label: "In Progress", tone: "blue" },
  IN_REVIEW: { label: "In Review", tone: "amber" },
  DONE: { label: "Done", tone: "green" },
  CANCELLED: { label: "Cancelled", tone: "slate" },
};

export function StatusChip({ status, className }: { status: string; className?: string }) {
  const s = FEATURE_STATUS[status] ?? { label: status, tone: "slate" as Tone };
  return <Chip label={s.label} tone={s.tone} className={className} solidDot={status === "DONE" || status === "IN_PROGRESS"} />;
}

// Priority — LOW, MEDIUM, HIGH, CRITICAL
const PRIORITY: Record<string, { label: string; tone: Tone }> = {
  LOW: { label: "Low", tone: "slate" },
  MEDIUM: { label: "Medium", tone: "blue" },
  HIGH: { label: "High", tone: "orange" },
  CRITICAL: { label: "Critical", tone: "red" },
};

export function PriorityChip({ priority, className }: { priority: string; className?: string }) {
  const p = PRIORITY[priority] ?? { label: priority, tone: "slate" as Tone };
  return <Chip label={p.label} tone={p.tone} className={className} solidDot={priority === "CRITICAL" || priority === "HIGH"} />;
}

// Severity — LOW, MEDIUM, HIGH, CRITICAL
const SEVERITY: Record<string, { label: string; tone: Tone }> = {
  LOW: { label: "Low", tone: "slate" },
  MEDIUM: { label: "Medium", tone: "amber" },
  HIGH: { label: "High", tone: "orange" },
  CRITICAL: { label: "Critical", tone: "red" },
};

export function SeverityChip({ severity, className }: { severity: string; className?: string }) {
  const s = SEVERITY[severity] ?? { label: severity, tone: "slate" as Tone };
  return <Chip label={s.label} tone={s.tone} className={className} solidDot />;
}

// Bug status — OPEN, IN_PROGRESS, RESOLVED, CLOSED
const BUG_STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: "Open", tone: "red" },
  IN_PROGRESS: { label: "In Progress", tone: "blue" },
  RESOLVED: { label: "Resolved", tone: "green" },
  CLOSED: { label: "Closed", tone: "slate" },
};

export function BugStatusChip({ status, className }: { status: string; className?: string }) {
  const s = BUG_STATUS[status] ?? { label: status, tone: "slate" as Tone };
  return <Chip label={s.label} tone={s.tone} className={className} solidDot={status === "OPEN"} />;
}

// PR status — OPEN, MERGED, CLOSED
const PR_STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: "Open", tone: "green" },
  MERGED: { label: "Merged", tone: "violet" },
  CLOSED: { label: "Closed", tone: "red" },
  DRAFT: { label: "Draft", tone: "slate" },
};

export function PrStatusChip({ status, className }: { status: string; className?: string }) {
  const s = PR_STATUS[status] ?? { label: status, tone: "slate" as Tone };
  return <Chip label={s.label} tone={s.tone} className={className} solidDot={status !== "DRAFT"} />;
}

// Role chip
const ROLE_TONE: Record<string, Tone> = {
  ADMIN: "violet", MANAGER: "blue", DEVELOPER: "green", VIEWER: "slate",
};

export function RoleChip({ role }: { role: string }) {
  return <Chip label={role} tone={ROLE_TONE[role] ?? "slate"} dot={false} />;
}
