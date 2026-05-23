import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateWorkspaceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(['FREE', 'PRO'])
  @IsOptional()
  plan?: 'FREE' | 'PRO';
}
