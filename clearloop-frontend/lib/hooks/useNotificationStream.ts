import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { openNotificationStream } from "@/lib/api/notification";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  useNotifications,
  notificationQueryKey,
} from "@/lib/hooks/useNotification";
import type {
  Notification,
  NotificationPage,
  NotificationSeverity,
} from "@/types";

type NotificationCache = { pages: NotificationPage[]; pageParams: unknown[] };
const SEVERITIES: NotificationSeverity[] = ["WARNING", "ALERT", "INFO"];

export function useNotificationStream() {
  const { token, isAuthenticated, logout } = useAuth();
  const queryClient = useQueryClient();
  const { mergeNewNotifications } = useNotifications();
  const stopRef = useRef<{ close: () => void } | null>(null);
  const logoutRef = useRef(logout);

  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    stopRef.current = openNotificationStream(token, {
      onMessage: (message) => {
        if (message.type === "NOTIFICATION") {
          const notification = message.data as Notification;
          queryClient.setQueryData<NotificationCache>(
            notificationQueryKey(notification.severity),
            (old) => {
              if (!old) return old;
              const [first, ...rest] = old.pages;
              if (first?.data.some((n) => n.id === notification.id)) return old;
              return {
                ...old,
                pages: [
                  {
                    ...first,
                    meta: {
                      ...first.meta,
                      // Only increment for genuinely unread notifications
                      unreadCount: notification.readAt
                        ? first.meta.unreadCount
                        : first.meta.unreadCount + 1,
                    },
                    data: [notification, ...(first?.data ?? [])],
                  },
                  ...rest,
                ],
              };
            },
          );
        } else if (message.type === "SUMMARY") {
          SEVERITIES.filter((s) => (message.data[s] ?? 0) > 0).forEach((s) =>
            mergeNewNotifications(s),
          );
        }
      },
      onError: (error) => {
        if (error instanceof Error && error.message === "Unauthorized") {
          logoutRef.current();
          return;
        }
        console.error('Notification stream error:', error);
      },
    });

    return () => {
      stopRef.current?.close();
      stopRef.current = null;
    };
  }, [isAuthenticated, token, queryClient, mergeNewNotifications]);
}
