"use client";

import { ArrowUpDown, LayoutGrid, Rows3, Search, SlidersHorizontal, Table2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 py-2.5">{children}</div>;
}

export function SearchField({ value, onChange, placeholder = "Search…" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full max-w-[260px]">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full rounded-md border border-border bg-surface pr-2.5 pl-8 text-[13px] outline-none transition-colors placeholder:text-muted-foreground focus:border-border-strong"
      />
    </div>
  );
}

export function FilterMenu({ label, options, selected, onToggle }: {
  label: string;
  options: { value: string; label: string; color?: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="relative">
      <details className="group">
        <summary className={cn(
          "inline-flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium transition-colors",
          selected.length > 0 ? "border-border-strong bg-surface-raised text-foreground" : "border-border text-muted-foreground hover:text-foreground"
        )}>
          <SlidersHorizontal className="size-3.5" />
          {label}
          {selected.length > 0 && <span className="ml-0.5 rounded bg-primary/15 px-1 font-mono text-[10px] text-primary tnum">{selected.length}</span>}
        </summary>
        <div className="absolute top-full left-0 z-50 mt-1 w-48 rounded-md border border-border bg-surface shadow-lg">
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</div>
          <div className="border-t border-border" />
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => onToggle(o.value)}
              className="flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-surface-raised"
            >
              <span className={cn("flex size-4 items-center justify-center rounded border border-border", selected.includes(o.value) && "bg-primary border-primary")}>
                {selected.includes(o.value) && <span className="size-2 rounded-sm bg-white" />}
              </span>
              {o.color && <span className="size-1.5 rounded-full" style={{ backgroundColor: o.color }} />}
              {o.label}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}

export function SortMenu({ value, options, onChange }: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <details className="group">
        <summary className="inline-flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-md border border-border px-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowUpDown className="size-3.5" />
          {current?.label ?? "Sort"}
        </summary>
        <div className="absolute top-full right-0 z-50 mt-1 w-40 rounded-md border border-border bg-surface shadow-lg">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={cn("flex w-full items-center justify-between px-3 py-2 text-[13px] hover:bg-surface-raised", o.value === value && "text-primary")}
            >
              {o.label}
              {o.value === value && <span className="size-1.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}

export type ViewMode = "table" | "card" | "board";

export function ViewToggle({ value, onChange, modes = ["table", "card", "board"] }: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
  modes?: ViewMode[];
}) {
  const icons = { table: Table2, card: Rows3, board: LayoutGrid } as const;
  return (
    <div className="flex h-8 items-center rounded-md border border-border bg-surface p-0.5">
      {modes.map((m) => {
        const Icon = icons[m];
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            aria-label={`${m} view`}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-[5px] px-2 text-[12px] font-medium capitalize transition-colors",
              value === m ? "bg-surface-raised text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            <span className="hidden sm:inline">{m}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ResultCount({ count, noun }: { count: number; noun: string }) {
  return <span className="ml-auto font-mono text-[11px] text-muted-foreground tnum">{count} {noun}{count === 1 ? "" : "s"}</span>;
}
