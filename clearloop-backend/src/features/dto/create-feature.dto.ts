import { FeatureStatus, FeaturePriority } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateFeatureDto {
    @IsString()
    @IsNotEmpty({ message: 'Title is required' })
    title!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    reason?: string;

    @IsUUID()
    @IsNotEmpty()
    projectId!: string;

    @IsEnum(FeaturePriority)
    @IsOptional()
    priority?: FeaturePriority;

    @IsUUID()
    @IsOptional()
    assignedToId?: string;
}


export class UpdateFeatureDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsEnum(FeatureStatus)
  @IsOptional()
  status?: FeatureStatus;

  @IsEnum(FeaturePriority)
  @IsOptional()
  priority?: FeaturePriority;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}