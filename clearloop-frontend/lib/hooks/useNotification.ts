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
        (old) => {
          if (!old || old.pages.length === 0)
            return { pages: [fresh], pageParams: [undefined] };
          const [firstPage, ...rest] = old.pages;
          const seen = new Set(
            old.pages.flatMap((p) => p.data.map((n) => n.id)),
          );
          const added = fresh.data.filter((n) => !seen.has(n.id));
          return {
            ...old,
            pages: [
              {
                ...firstPage,
                meta: fresh.meta,
                data: [...added, ...firstPage.data],
              },
              ...rest,
            ],
          };
        },
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
      severity: NotificationSeverity;
    }) => notificationsApi.markRead(uuids, all),
    onError: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: notificationQueryKey(vars.severity),
      });
    },
    onSettled: (_, __, vars) => {
      mergeNewNotifications(vars.severity);
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

  

  const unreadCount = (
    ["WARNING", "ALERT", "INFO"] as NotificationSeverity[]
  ).reduce(
    (sum, s) => sum + (queries[s].data?.pages[0]?.meta.unreadCount ?? 0),
    0,
  );

  return { queries, unreadCount, markAsRead, mergeNewNotifications };
}
