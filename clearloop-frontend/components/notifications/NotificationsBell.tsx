"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/lib/hooks/useNotification";
import { cn } from "@/lib/utils";
import type { Notification, NotificationSeverity } from "@/types";

const severityIcon = {
  INFO:    { Icon: Info,          cls: "text-blue-500" },
  WARNING: { Icon: AlertTriangle, cls: "text-amber-500" },
  ALERT:   { Icon: AlertCircle,   cls: "text-red-500" },
};

function NotificationRow({ n, onClose }: { n: Notification; onClose: () => void }) {
  const router = useRouter();
  const { markAsRead } = useNotifications();
  const { Icon, cls } = severityIcon[n.severity];
  const dest = n.featureId ? `/dashboard/features/${n.featureId}`
    : n.bugReportId ? `/dashboard/bugs/${n.bugReportId}`
    : n.pullRequestId ? `/dashboard/pull-requests/${n.pullRequestId}`
    : null;

  function handle() {
    if (!n.readAt) markAsRead(n.severity as NotificationSeverity, n.id);
    if (dest) router.push(dest);
    onClose();
  }

  return (
    <button onClick={handle} className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-raised)]", !n.readAt && "bg-[var(--surface-raised)]/50")}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", cls)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[13px] font-medium leading-snug">{n.title}</span>
          {!n.readAt && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">{n.message}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {n.actorName && `${n.actorName} · `}
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </p>
      </div>
    </button>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { queries, unreadCount, markAsRead } = useNotifications();

  const notifications = (["WARNING", "ALERT", "INFO"] as NotificationSeverity[])
    .flatMap((s) => queries[s].data?.pages[0]?.data ?? [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof MouseEvent && ref.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", handler); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex size-8 items-center justify-center rounded-md hover:bg-[var(--surface-raised)]"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-lg border border-border bg-[var(--popover)] shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-[13px] font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => (["WARNING", "ALERT", "INFO"] as NotificationSeverity[]).forEach((s) => markAsRead(s))}
                className="text-[12px] text-muted-foreground hover:text-foreground"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[420px] divide-y divide-border overflow-y-auto">
            {notifications.length === 0
              ? <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">No notifications</p>
              : notifications.map((n) => <NotificationRow key={n.id} n={n} onClose={() => setOpen(false)} />)
            }
          </div>
          <div className="border-t border-border">
            <Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="flex w-full items-center justify-center py-3 text-[12px] text-muted-foreground hover:text-foreground">
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
