import { BugSeverity, BugStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBugReportDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(BugSeverity)
  @IsOptional()
  severity?: BugSeverity;

  @IsUUID()
  @IsOptional()
  featureId?: string;
}

export class UpdateBugReportDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(BugSeverity)
  @IsOptional()
  severity?: BugSeverity;

  @IsEnum(BugStatus)
  @IsOptional()
  status?: BugStatus;

  @IsUUID()
  @IsOptional()
  featureId?: string;
}
