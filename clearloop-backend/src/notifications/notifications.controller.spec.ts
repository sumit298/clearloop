import { EMPTY, firstValueFrom, of, take } from 'rxjs';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { NotificationsController } from './notifications.controller';
import { NotificationsService, type SseEvent } from './notifications.service';

describe('NotificationsController', () => {
  it('passes Last-Event-ID to the persisted stream and emits notification ids', async () => {
    const notification = { id: 'notification-id' };
    const event: SseEvent = { type: 'NOTIFICATION', data: notification };
    const getPersistedStream = jest.fn().mockReturnValue(of(event));
    const notificationsService = {
      getStream: jest.fn().mockReturnValue(EMPTY),
      getPersistedStream,
      removeStream: jest.fn(),
    } as unknown as NotificationsService;
    const controller = new NotificationsController(notificationsService);
    const getHeader = jest.fn().mockReturnValue('notification-id');
    const req = {
      user: { memberId: 'member-id' },
      get: getHeader,
    } as unknown as AuthenticatedRequest;

    const message = await firstValueFrom(controller.stream(req).pipe(take(1)));

    expect(getHeader).toHaveBeenCalledWith('Last-Event-ID');
    expect(getPersistedStream).toHaveBeenCalledWith(
      'member-id',
      'notification-id',
    );
    expect(message).toEqual({ id: 'notification-id', data: event });
  });
});
