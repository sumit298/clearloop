import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCommentsDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsUUID()
  @IsOptional()
  featureId?: string;

  @IsUUID()
  @IsOptional()
  bugReportId?: string;


}

export class UpdateCommentsDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}
