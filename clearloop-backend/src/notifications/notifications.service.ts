import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Observable,
  Subject,
  catchError,
  defer,
  EMPTY,
  exhaustMap,
  from,
  interval,
  map,
  mergeMap,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import type { CreateNotificationDTO } from './dto/notifications.dto';

export type SseEvent =
  | { type: 'NOTIFICATION'; data: Record<string, unknown> }
  | {
      type: 'SUMMARY';
      data: Partial<Record<'INFO' | 'WARNING' | 'ALERT', number>>;
    }
  | { type: 'HEARTBEAT'; data: '' };

@Injectable()
export class NotificationsService {
  private streams = new Map<string, Subject<SseEvent>>();
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, memberId: string, dto: CreateNotificationDTO) {
    try {
      // Upsert so webhook retries do not create duplicate notifications.
      const notification = await this.prisma.notification.upsert({
        where: {
          memberId_deduplicationKey: {
            memberId,
            deduplicationKey:
              dto.deduplicationKey ??
              `${dto.eventType}-${memberId}-${Date.now()}`,
          },
        },
        create: { tenantId, memberId, ...dto },
        update: {},
      });

      // Send the full persisted record so SSE consumers can update without a
      // follow-up request. Keep SUMMARY for existing consumers.
      this.logger.log(
        JSON.stringify({
          event: 'notification.created',
          id: notification.id,
          eventType: notification.eventType,
          severity: notification.severity,
          memberId,
          tenantId,
          deduplicationKey: notification.deduplicationKey,
        }),
      );
      this.push(memberId, { type: 'NOTIFICATION', data: notification });
      this.push(memberId, {
        type: 'SUMMARY',
        data: { [notification.severity]: 1 },
      });

      return notification;
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'notification.create.failed',
          tenantId,
          memberId,
          eventType: dto.eventType,
          deduplicationKey: dto.deduplicationKey,
        }),
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async list(memberId: string, severity = 'ALL', cursor?: string, size = 16) {
    const severityFilter =
      severity === 'ALL'
        ? {}
        : { severity: severity as 'INFO' | 'WARNING' | 'ALERT' };

    const cursorRow = cursor
      ? await this.prisma.notification.findFirst({
          where: { id: cursor, memberId, ...severityFilter },
          select: { id: true, createdAt: true },
        })
      : null;

    if (cursor && !cursorRow) {
      throw new BadRequestException('Invalid notification cursor');
    }

    const items = await this.prisma.notification.findMany({
      where: {
        memberId,
        ...severityFilter,
        ...(cursorRow && {
          OR: [
            { createdAt: { lt: cursorRow.createdAt } },
            { createdAt: cursorRow.createdAt, id: { lt: cursorRow.id } },
          ],
        }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: size + 1,
    });

    const hasMore = items.length > size;
    const data = hasMore ? items.slice(0, size) : items;

    const [totalCount, unreadCount] = await Promise.all([
      this.prisma.notification.count({
        where: { memberId, ...severityFilter },
      }),
      this.prisma.notification.count({
        where: {
          memberId,
          ...severityFilter,
          readAt: null,
        },
      }),
    ]);
    return {
      data,
      meta: {
        totalCount,
        unreadCount,
        hasMore,
        nextCursor: hasMore ? data[data.length - 1]?.id : undefined,
      },
    };
  }

  /**
   * Poll persisted notifications as a fallback for SSE connections handled by
   * a different backend instance than the one that created the notification.
   * The in-memory stream remains the low-latency path for single-instance use.
   */
  getPersistedStream(
    memberId: string,
    lastEventId?: string,
  ): Observable<SseEvent> {
    return defer(async () => {
      if (lastEventId) {
        const resumeCursor = await this.prisma.notification.findFirst({
          where: { id: lastEventId, memberId },
          select: { id: true, createdAt: true },
        });

        if (resumeCursor) {
          return resumeCursor;
        }
      }

      return this.prisma.notification.findFirst({
        where: { memberId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: { id: true, createdAt: true },
      });
    }).pipe(
      switchMap((latest) => {
        let cursor = latest;

        return interval(5000).pipe(
          startWith(0),
          exhaustMap(() =>
            from(
              this.prisma.notification.findMany({
                where: {
                  memberId,
                  ...(cursor && {
                    OR: [
                      { createdAt: { gt: cursor.createdAt } },
                      { createdAt: cursor.createdAt, id: { gt: cursor.id } },
                    ],
                  }),
                },
                orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
                take: 100,
              }),
            ).pipe(
              map((rows) => {
                if (rows.length > 0) {
                  cursor = rows[rows.length - 1] ?? cursor;
                }
                return rows;
              }),
              mergeMap((rows) => from(rows)),
              map((notification) => ({
                type: 'NOTIFICATION' as const,
                data: notification,
              })),
              catchError((error: unknown) => {
                this.logger.error(
                  JSON.stringify({
                    event: 'notification.stream.poll.failed',
                    memberId,
                  }),
                  error instanceof Error ? error.stack : String(error),
                );
                return of<SseEvent>();
              }),
            ),
          ),
        );
      }),
      catchError((error: unknown) => {
        this.logger.error(
          JSON.stringify({
            event: 'notification.stream.initialise.failed',
            memberId,
          }),
          error instanceof Error ? error.stack : String(error),
        );
        return EMPTY;
      }),
    );
  }

  async markRead(memberId: string, uuids?: string[], markAllAsRead?: boolean) {
    const now = new Date();
    if (markAllAsRead) {
      await this.prisma.notification.updateMany({
        where: { memberId, readAt: null },
        data: { readAt: now },
      });
    } else if (uuids?.length) {
      await this.prisma.notification.updateMany({
        where: { memberId, id: { in: uuids }, readAt: null },
        data: { readAt: now },
      });
    }
    return { ok: true };
  }

  getStream(memberId: string) {
    if (!this.streams.has(memberId)) {
      this.streams.set(memberId, new Subject<SseEvent>());
    }
    return this.streams.get(memberId)!.asObservable();
  }

  removeStream(memberId: string) {
    const subject = this.streams.get(memberId);
    if (subject && !subject.observed) {
      this.streams.delete(memberId);
    }
  }

  private push(memberId: string, event: SseEvent) {
    this.streams.get(memberId)?.next(event);
  }
}
