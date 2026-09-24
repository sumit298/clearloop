"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { formatDistanceToNow, isToday } from "date-fns";
import { PageHeader, EmptyState } from "@/components/clearloop/primitives";
import { useNotifications } from "@/lib/hooks/useNotification";
import { cn } from "@/lib/utils";
import type { Notification, NotificationSeverity } from "@/types";

type Tab = "ALL" | NotificationSeverity;

const TABS: { label: string; value: Tab }[] = [
  { label: "All",     value: "ALL" },
  { label: "Info",    value: "INFO" },
  { label: "Warning", value: "WARNING" },
  { label: "Alert",   value: "ALERT" },
];

const severityIcon = {
  INFO:    { Icon: Info,          cls: "text-blue-500" },
  WARNING: { Icon: AlertTriangle, cls: "text-amber-500" },
  ALERT:   { Icon: AlertCircle,   cls: "text-red-500" },
};

function NotificationRow({ n, markAsRead }: { n: Notification; markAsRead: (severity: NotificationSeverity, id?: string) => void }) {
  const router = useRouter();
  const { Icon, cls } = severityIcon[n.severity];
  const dest = n.featureId ? `/dashboard/features/${n.featureId}`
    : n.bugReportId ? `/dashboard/bugs/${n.bugReportId}`
    : n.pullRequestId ? `/dashboard/pull-requests/${n.pullRequestId}`
    : null;

  function handle() {
    if (!n.readAt) markAsRead(n.severity, n.id);
    if (dest) router.push(dest);
  }

  return (
    <button onClick={handle} className={cn("flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--surface-raised)]", !n.readAt && "bg-[var(--surface-raised)]/50")}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", cls)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[13px] font-medium">{n.title}</span>
          {!n.readAt && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />}
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">{n.message}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {n.actorName && `${n.actorName} · `}
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </p>
      </div>
    </button>
  );
}

export default function NotificationsPage() {
  const [tab, setTab] = useState<Tab>("ALL");
  const { queries, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const severities: NotificationSeverity[] = tab === "ALL" ? ["WARNING", "ALERT", "INFO"] : [tab];

  const all = severities
    .flatMap((s) => queries[s].data?.pages.flatMap((p) => p.data) ?? [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const today = all.filter((n) => isToday(new Date(n.createdAt)));
  const earlier = all.filter((n) => !isToday(new Date(n.createdAt)));

  const isLoading = severities.some((s) => !queries[s].isFetched);
  const isError = severities.some((s) => queries[s].isError);
  const activeQuery = tab !== "ALL" ? queries[tab] : null;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Activity and updates from your workspace."
        actions={
          unreadCount > 0 ? (
            <button
              onClick={markAllAsRead}
              className="text-[13px] text-muted-foreground hover:text-foreground"
            >
              Mark all as read
            </button>
          ) : undefined
        }
      />

      <div className="px-6 pt-4">
        <div className="flex gap-1 border-b border-border">
          {TABS.map((t) => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={cn("px-3 py-2 text-[13px] font-medium transition-colors",
                tab === t.value ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 p-6">
        {isLoading ? (
          <p className="text-[13px] text-muted-foreground">Loading…</p>
        ) : isError ? (
          <EmptyState icon={Bell} title="Failed to load notifications" description="Something went wrong. Please refresh the page." />
        ) : all.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
        ) : (
          <>
            {today.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Today</p>
                <div className="panel overflow-hidden divide-y divide-border">
                  {today.map((n) => <NotificationRow key={n.id} n={n} markAsRead={markAsRead} />)}
                </div>
              </div>
            )}
            {earlier.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Earlier</p>
                <div className="panel overflow-hidden divide-y divide-border">
                  {earlier.map((n) => <NotificationRow key={n.id} n={n} markAsRead={markAsRead} />)}
                </div>
              </div>
            )}
            {tab === "ALL"
              ? (["WARNING", "ALERT", "INFO"] as NotificationSeverity[]).map((s) =>
                  queries[s].hasNextPage ? (
                    <button key={s}
                      onClick={() => queries[s].fetchNextPage()}
                      disabled={queries[s].isFetchingNextPage}
                      className="w-full rounded-md border border-border py-2.5 text-[13px] text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      {queries[s].isFetchingNextPage ? "Loading…" : `Load more ${s.toLowerCase()}`}
                    </button>
                  ) : null
                )
              : activeQuery?.hasNextPage && (
                  <button
                    onClick={() => activeQuery.fetchNextPage()}
                    disabled={activeQuery.isFetchingNextPage}
                    className="w-full rounded-md border border-border py-2.5 text-[13px] text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {activeQuery.isFetchingNextPage ? "Loading…" : "Load more"}
                  </button>
                )
            }
          </>
        )}
      </div>
    </>
  );
}
