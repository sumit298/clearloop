import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryNotificationsDto {
  @IsIn(['INFO', 'WARNING', 'ALERT'])
  severity: 'INFO' | 'WARNING' | 'ALERT' = 'INFO';

  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  size?: number = 16;
}

export class MarkReadDTO {
  @IsOptional()
  @IsUUID(undefined, { each: true })
  uuids?: string[];

  @IsOptional()
  @IsBoolean()
  markAllAsRead?: boolean;
}

export class CreateNotificationDTO {
  eventType!: string;
  title!: string;
  message!: string;
  severity!: 'INFO' | 'WARNING' | 'ALERT';
  actorName?: string;
  deduplicationKey?: string;
  featureId?: string; // ← make optional
  bugReportId?: string;
  pullRequestId?: string;
}
