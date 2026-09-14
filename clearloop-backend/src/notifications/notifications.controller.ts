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

import {
  Observable,
  distinct,
  finalize,
  interval,
  map,
  merge,
} from 'rxjs';
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

    const notifications$ = merge(
      this.notificationsService.getStream(memberId),
      this.notificationsService.getPersistedStream(memberId),
    ).pipe(
      // The persisted poll can observe the same event already delivered by
      // the local Subject. Suppress that duplicate per SSE connection.
      distinct((event) =>
        event.type === 'NOTIFICATION' ? event.data.id : event,
      ),
      map((event) => ({ data: event }) as MessageEvent),
    );

    const heartbeat$ = interval(30000).pipe(
      map(() => ({ data: { type: 'HEARTBEAT', data: '' } }) as MessageEvent),
    );
    return merge(notifications$, heartbeat$).pipe(
      finalize(() => this.notificationsService.removeStream(memberId)),
    );
  }
}
