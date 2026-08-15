"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";

export interface StatusOption {
  value: string;
  label: string;
}

/**
 * The control that actually moves work through the pipeline. Every status in
 * the workflow is reachable, not just the forward one — work gets reopened,
 * and a dropdown that only advances forces people to edit records by hand.
 */
export function StatusSelect({
  value,
  options,
  onSelect,
  renderChip,
  pending = false,
  disabled = false,
}: {
  value: string;
  options: StatusOption[];
  onSelect: (next: string) => void;
  renderChip: (status: string) => React.ReactNode;
  pending?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 hover:bg-surface-raised disabled:opacity-60"
      >
        {renderChip(value)}
        {pending ? (
          <Loader2 className="size-3 animate-spin text-muted-foreground" />
        ) : (
          <ChevronDown className="size-3 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-20 mt-1 min-w-44 overflow-hidden rounded-md border border-border bg-surface-elevated py-1 shadow-md"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                setOpen(false);
                if (option.value !== value) onSelect(option.value);
              }}
              className="row-hover flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px]"
            >
              <Check
                className={`size-3 shrink-0 ${
                  option.value === value ? "text-primary" : "invisible"
                }`}
              />
              <span className="flex-1">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * One-click shortcut for the transition people make most often, so closing
 * work does not require opening a menu.
 */
export function StatusAdvanceButton({
  label,
  onClick,
  pending = false,
}: {
  label: string;
  onClick: () => void;
  pending?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground disabled:opacity-60"
    >
      {pending && <Loader2 className="size-3.5 animate-spin" />}
      {label}
    </button>
  );
}

export const FEATURE_STATUSES: StatusOption[] = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "PLANNED", label: "Planned" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "DONE", label: "Done" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const BUG_STATUSES: StatusOption[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

/** The status the primary button offers next, or null when there is nothing obvious. */
export function nextFeatureStatus(current: string) {
  const flow: Record<string, { value: string; label: string }> = {
    BACKLOG: { value: "PLANNED", label: "Move to planned" },
    PLANNED: { value: "IN_PROGRESS", label: "Start work" },
    IN_PROGRESS: { value: "IN_REVIEW", label: "Send to review" },
    IN_REVIEW: { value: "DONE", label: "Mark as done" },
  };
  return flow[current] ?? null;
}

export function nextBugStatus(current: string) {
  const flow: Record<string, { value: string; label: string }> = {
    OPEN: { value: "IN_PROGRESS", label: "Start fixing" },
    IN_PROGRESS: { value: "RESOLVED", label: "Mark resolved" },
    RESOLVED: { value: "CLOSED", label: "Close bug" },
  };
  return flow[current] ?? null;
}
