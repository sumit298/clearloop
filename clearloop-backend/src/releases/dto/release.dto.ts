import { IsNotEmpty, IsOptional, IsString, IsDateString, IsArray, IsUUID, IsBoolean } from 'class-validator';

export class CreateReleaseDto {
  @IsString()
  @IsNotEmpty()
  version!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  releasedAt?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  featureIds?: string[];

  @IsBoolean()
  @IsOptional()
  useAI?: boolean; // If true, generate notes with AI
}

export class UpdateReleaseDto {
  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  releasedAt?: string;
}

export class AddFeatureToReleaseDto {
  @IsUUID()
  @IsNotEmpty()
  featureId!: string;
}

export class GenerateReleaseNotesDto {
  @IsDateString()
  @IsOptional()
  sinceDate?: string; // Generate notes for PRs merged since this date
}
