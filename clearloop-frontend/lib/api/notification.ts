import apiClient from './client';
import type { NotificationPage, NotificationSeverity } from '@/types';

const STREAM_RECONNECT_DELAY = 3000;

export type NotificationStreamMessage =
  | { type: 'NOTIFICATION'; data: unknown }
  | { type: 'SUMMARY'; data: Partial<Record<NotificationSeverity, number>> }
  | { type: 'HEARTBEAT'; data: '' };

function makeSearchParams(params: { severity?: string; cursor?: string; size?: number }) {
  const q: Record<string, string> = {};
  if (params.severity) q.severity = params.severity;
  if (params.cursor) q.cursor = params.cursor;
  if (params.size != null) q.size = String(params.size);
  const qs = new URLSearchParams(q).toString();
  return qs ? `?${qs}` : '';
}

function parseEventData(event: string) {
  return event
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trimStart())
    .join('\n');
}

export async function fetchNotificationPage(params: {
  severity: NotificationSeverity | 'ALL';
  cursor?: string;
  size?: number;
  timeDelay?: number;
}): Promise<NotificationPage> {
  if (params.timeDelay) await new Promise((r) => setTimeout(r, params.timeDelay));
  const res = await apiClient.get(`/notifications${makeSearchParams(params)}`);
  return res.data;
}

export const notificationsApi = {
  markRead: async (uuids?: string[], markAllAsRead?: boolean): Promise<void> => {
    await apiClient.patch('/notifications/read', { uuids, markAllAsRead });
  },
};

export function openNotificationStream(
  token: string,
  handlers: {
    onMessage: (message: NotificationStreamMessage) => void;
    onError?: (error: unknown) => void;
  },
): { close: () => void } {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
  let closed = false;
  let controller = new AbortController();

  async function readStream() {
    controller = new AbortController();
    const res = await fetch(`${base}/notifications/stream`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
      signal: controller.signal,
    });
    if (!res.ok || !res.body) throw new Error(`Stream failed: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (!closed) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      const events = buf.split('\n\n');
      buf = events.pop() ?? '';
      for (const event of events) {
        const data = parseEventData(event);
        if (!data) continue;
        const payload = JSON.parse(data) as NotificationStreamMessage;
        if (!payload?.type) continue;
        handlers.onMessage(payload);
      }
    }
  }

  async function keepConnected() {
    while (!closed) {
      try {
        await readStream();
      } catch (error) {
        if (!closed) handlers.onError?.(error);
      }
      if (!closed) await new Promise((r) => setTimeout(r, STREAM_RECONNECT_DELAY));
    }
  }

  keepConnected();
  return { close: () => { closed = true; controller.abort(); } };
}
