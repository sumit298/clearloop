import { firstValueFrom, take } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const notification = {
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
});
