import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Subject } from 'rxjs';
import type { CreateNotificationDTO } from './dto/notifications.dto';

export interface SseEvent {
  type: 'NOTIFICATION' | 'SUMMARY' | 'HEARTBEAT';
  data: any;
}

@Injectable()
export class NotificationsService {
  private streams = new Map<string, Subject<SseEvent>>();
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, memberId: string, dto: CreateNotificationDTO) {
    // upsert - if deduplication key exists, update the existing notification, else create a new one
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

    this.push(memberId, {
      type: 'SUMMARY',
      data: { [dto.severity]: 1 },
    });

    return notification;
  }

  async list(memberId: string, severity: string, cursor?: string, size = 16) {
    const cursorRow = cursor
      ? await this.prisma.notification.findUnique({ where: { id: cursor } })
      : null;

    const items = await this.prisma.notification.findMany({
      where: {
        memberId,
        severity: severity as 'INFO' | 'WARNING' | 'ALERT',
        ...(cursorRow && {
          OR: [
            { createdAt: { lt: cursorRow.createdAt } },
            { createdAt: cursorRow.createdAt, id: { lt: cursorRow.id } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: size + 1,
    });

    const hasMore = items.length > size;
    const data = hasMore ? items.slice(0, size) : items;

    const [totalCount, unreadCount] = await Promise.all([
      this.prisma.notification.count({
        where: { memberId, severity: severity as 'INFO' | 'WARNING' | 'ALERT' },
      }),
      this.prisma.notification.count({
        where: {
          memberId,
          severity: severity as 'INFO' | 'WARNING' | 'ALERT',
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
