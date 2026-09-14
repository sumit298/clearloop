import { IsBoolean, IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryNotificationsDto {
  @IsIn(['ALL', 'INFO', 'WARNING', 'ALERT'])
  severity: 'ALL' | 'INFO' | 'WARNING' | 'ALERT' = 'ALL';

  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
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
