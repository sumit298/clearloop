import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  Sse,
  UseGuards,
  Req,
} from '@nestjs/common';

import { Observable, filter, finalize, interval, map, merge } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto, MarkReadDTO } from './dto/notifications.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('notifications')
@UseGuards(JwtAuthGuard, TenantGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.list(
      req.user.memberId,
      query.severity,
      query.cursor,
      query.size,
    );
  }

  @Patch('read')
  markRead(@Req() req: AuthenticatedRequest, @Body() dto: MarkReadDTO) {
    return this.notificationsService.markRead(
      req.user.memberId,
      dto.uuids,
      dto.markAllAsRead,
    );
  }

  @Sse('stream')
  stream(@Req() req: AuthenticatedRequest): Observable<MessageEvent> {
    const memberId = req.user.memberId;
    const lastEventId = req.get('Last-Event-ID')?.trim() || undefined;

    // Bounded dedup set — only tracks NOTIFICATION ids, capped at 500 entries.
    const seen = new Set<string>();

    const notifications$ = merge(
      this.notificationsService.getStream(memberId),
      this.notificationsService.getPersistedStream(memberId, lastEventId),
    ).pipe(
      filter((event) => {
        if (event.type !== 'NOTIFICATION') return true;
        const id = event.data['id'] as string;
        if (seen.has(id)) return false;
        if (seen.size >= 500) seen.clear();
        seen.add(id);
        return true;
      }),
      map(
        (event) =>
          ({
            data: event,
            ...(event.type === 'NOTIFICATION' && { id: event.data['id'] }),
          }) as MessageEvent,
      ),
    );

    const heartbeat$ = interval(30000).pipe(
      map(() => ({ data: { type: 'HEARTBEAT', data: '' } }) as MessageEvent),
    );
    return merge(notifications$, heartbeat$).pipe(
      finalize(() => this.notificationsService.removeStream(memberId)),
    );
  }
}
