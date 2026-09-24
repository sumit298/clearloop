import { firstValueFrom, take } from 'rxjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const notification = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };
  const service = new NotificationsService({
    notification,
  } as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scopes a list cursor to the active severity', async () => {
    const createdAt = new Date('2026-09-14T00:00:00.000Z');
    notification.findFirst.mockResolvedValue({ id: 'cursor-id', createdAt });
    notification.findMany.mockResolvedValue([]);
    notification.count.mockResolvedValue(0);

    await service.list('member-id', 'ALERT', 'cursor-id');

    expect(notification.findFirst).toHaveBeenCalledWith({
      where: { id: 'cursor-id', memberId: 'member-id', severity: 'ALERT' },
      select: { id: true, createdAt: true },
    });
  });

  it('resumes persisted notifications after the supplied event id', async () => {
    const cursorCreatedAt = new Date('2026-09-14T00:00:00.000Z');
    const nextNotification = {
      id: 'next-id',
      memberId: 'member-id',
      createdAt: new Date('2026-09-14T00:01:00.000Z'),
    };
    notification.findFirst.mockResolvedValue({
      id: 'cursor-id',
      createdAt: cursorCreatedAt,
    });
    notification.findMany.mockResolvedValue([nextNotification]);

    const event = await firstValueFrom(
      service.getPersistedStream('member-id', 'cursor-id').pipe(take(1)),
    );

    expect(notification.findFirst).toHaveBeenCalledWith({
      where: { id: 'cursor-id', memberId: 'member-id' },
      select: { id: true, createdAt: true },
    });
    expect(notification.findMany).toHaveBeenCalledWith({
      where: {
        memberId: 'member-id',
        OR: [
          { createdAt: { gt: cursorCreatedAt } },
          { createdAt: cursorCreatedAt, id: { gt: 'cursor-id' } },
        ],
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: 100,
    });
    expect(event).toEqual({
      type: 'NOTIFICATION',
      data: nextNotification,
    });
  });

  it('broadcasts only after a notification is newly created', async () => {
    const created = {
      id: 'new-id',
      memberId: 'member-id',
      eventType: 'TEST',
      severity: 'INFO',
    };
    notification.create.mockResolvedValue(created);

    const event = firstValueFrom(
      service.getStream('member-id').pipe(take(1)),
    );
    await service.create('tenant-id', 'member-id', {
      eventType: 'TEST',
      title: 'Test',
      message: 'Test message',
      severity: 'INFO',
      deduplicationKey: 'test-key',
    });

    await expect(event).resolves.toEqual({
      type: 'NOTIFICATION',
      data: created,
    });
  });

  it('does not broadcast when the unique key was already inserted concurrently', async () => {
    const existing = {
      id: 'existing-id',
      memberId: 'member-id',
      eventType: 'TEST',
      severity: 'INFO',
    };
    notification.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '5.22.0',
      }),
    );
    notification.findUnique.mockResolvedValue(existing);
    const received: unknown[] = [];
    const subscription = service.getStream('member-id').subscribe((event) => {
      received.push(event);
    });

    await service.create('tenant-id', 'member-id', {
      eventType: 'TEST',
      title: 'Test',
      message: 'Test message',
      severity: 'INFO',
      deduplicationKey: 'test-key',
    });
    subscription.unsubscribe();

    expect(received).toEqual([]);
    expect(notification.findUnique).toHaveBeenCalledWith({
      where: {
        memberId_deduplicationKey: {
          memberId: 'member-id',
          deduplicationKey: 'test-key',
        },
      },
    });
  });
});
