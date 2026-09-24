import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import {
  fetchNotificationPage,
  notificationsApi,
} from "@/lib/api/notification";
import { useAuth } from "@/lib/contexts/AuthContext";
import type { NotificationPage, NotificationSeverity } from "@/types";

const PAGE_SIZE = 16;
const SEVERITIES: NotificationSeverity[] = ["WARNING", "ALERT", "INFO"];

type NotificationCache = { pages: NotificationPage[]; pageParams: unknown[] };

export function notificationQueryKey(severity: NotificationSeverity | "ALL") {
  return ["notifications", severity] as const;
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const warning = useInfiniteQuery<NotificationPage>({
    queryKey: notificationQueryKey("WARNING"),
    queryFn: ({ pageParam }) =>
      fetchNotificationPage({
        severity: "WARNING",
        cursor: pageParam as string | undefined,
        size: PAGE_SIZE,
      }),
    getNextPageParam: (last) =>
      last.meta.hasMore ? (last.meta.nextCursor ?? undefined) : undefined,
    initialPageParam: undefined,
    enabled: isAuthenticated,
  });

  const alert = useInfiniteQuery<NotificationPage>({
    queryKey: notificationQueryKey("ALERT"),
    queryFn: ({ pageParam }) =>
      fetchNotificationPage({
        severity: "ALERT",
        cursor: pageParam as string | undefined,
        size: PAGE_SIZE,
      }),
    getNextPageParam: (last) =>
      last.meta.hasMore ? (last.meta.nextCursor ?? undefined) : undefined,
    initialPageParam: undefined,
    enabled: isAuthenticated && warning.isFetched,
  });

  const info = useInfiniteQuery<NotificationPage>({
    queryKey: notificationQueryKey("INFO"),
    queryFn: ({ pageParam }) =>
      fetchNotificationPage({
        severity: "INFO",
        cursor: pageParam as string | undefined,
        size: PAGE_SIZE,
      }),
    getNextPageParam: (last) =>
      last.meta.hasMore ? (last.meta.nextCursor ?? undefined) : undefined,
    initialPageParam: undefined,
    enabled: isAuthenticated && alert.isFetched,
  });

  const queries = { WARNING: warning, ALERT: alert, INFO: info } as const;

  const mergeNewNotifications = useCallback(
    async (severity: NotificationSeverity) => {
      const fresh = await fetchNotificationPage({ severity, size: PAGE_SIZE });
      queryClient.setQueryData<NotificationCache>(
        notificationQueryKey(severity),
        // Replacing the cache avoids overlapping pages and keeps page 1 at
        // PAGE_SIZE after new rows shift the cursor boundary.
        () => ({ pages: [fresh], pageParams: [undefined] }),
      );
    },
    [queryClient],
  );

  const { mutate: markReadMutate } = useMutation({
    mutationFn: ({
      uuids,
      all,
    }: {
      uuids?: string[];
      all?: boolean;
      severity: NotificationSeverity | "ALL";
    }) => notificationsApi.markRead(uuids, all),
    onError: (_, vars) => {
      if (vars.severity === "ALL") {
        SEVERITIES.forEach((severity) =>
          queryClient.invalidateQueries({ queryKey: notificationQueryKey(severity) }),
        );
      } else {
        queryClient.invalidateQueries({
          queryKey: notificationQueryKey(vars.severity),
        });
      }
    },
    onSettled: (_, __, vars) => {
      if (vars.severity === "ALL") {
        void Promise.all(SEVERITIES.map((severity) => mergeNewNotifications(severity)));
      } else {
        void mergeNewNotifications(vars.severity);
      }
    },
  });

  const markAsRead = useCallback(
    (severity: NotificationSeverity, id?: string) => {
      const now = new Date().toISOString();
      queryClient.setQueryData<NotificationCache>(
        notificationQueryKey(severity),
        (old) =>
          old && {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              meta: {
                ...page.meta,
                unreadCount: id ? Math.max(0, page.meta.unreadCount - 1) : 0,
              },
              data: page.data.map((n) =>
                !n.readAt && (!id || n.id === id) ? { ...n, readAt: now } : n,
              ),
            })),
          },
      );
      markReadMutate(id ? { uuids: [id], severity } : { all: true, severity });
    },
    [queryClient, markReadMutate],
  );

  const markAllAsRead = useCallback(() => {
    const now = new Date().toISOString();
    SEVERITIES.forEach((severity) => {
      queryClient.setQueryData<NotificationCache>(
        notificationQueryKey(severity),
        (old) =>
          old && {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              meta: { ...page.meta, unreadCount: 0 },
              data: page.data.map((notification) =>
                notification.readAt ? notification : { ...notification, readAt: now },
              ),
            })),
          },
      );
    });
    markReadMutate({ all: true, severity: "ALL" });
  }, [markReadMutate, queryClient]);

  

  const unreadCount = (
    ["WARNING", "ALERT", "INFO"] as NotificationSeverity[]
  ).reduce(
    (sum, s) => sum + (queries[s].data?.pages[0]?.meta.unreadCount ?? 0),
    0,
  );

  return { queries, unreadCount, markAsRead, markAllAsRead, mergeNewNotifications };
}
