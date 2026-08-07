import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-6 py-5">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-text-muted">{eyebrow}</div>}
        <h1 className="truncate text-[19px] font-semibold leading-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[13px] text-text-muted">{description}</p>}
        {meta && <div className="mt-2.5 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Section({ title, icon: Icon, action, children, className }: {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel overflow-hidden", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <h2 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-text-muted">
          {Icon && <Icon className="size-3.5" />}{title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return <div className="flex flex-col items-center justify-center px-6 py-14 text-center"><div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-border bg-[var(--surface-raised)]"><Icon className="size-5 text-text-muted" /></div><h3 className="text-[15px] font-semibold">{title}</h3><p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-text-muted">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function MetricTile({ icon: Icon, label, value, tone = "primary" }: { icon: LucideIcon; label: string; value: number; tone?: "primary" | "success" | "warning" | "danger" }) {
  const tones = { primary: "text-primary", success: "text-success", warning: "text-warning", danger: "text-danger" };
  return <div className="bg-background px-6 py-5"><div className="flex items-center gap-2 text-[12px] text-text-muted"><Icon className="size-3.5" />{label}</div><div className="mt-3 flex items-end justify-between"><span className="font-mono text-[30px] leading-none tnum">{value}</span><span className={cn("text-[11px] font-medium", tones[tone])}>Live</span></div></div>;
}
