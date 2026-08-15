import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

// Users can update their own profile with these fields
export class UpdateOwnProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsString()
  @IsOptional()
  githubUsername?: string;

  // A boolean, not a timestamp: the client says what happened and the server
  // decides when. Sending `false` un-dismisses, so the panel can be brought
  // back from settings without another endpoint.
  @IsBoolean()
  @IsOptional()
  dismissOnboarding?: boolean;
}

// Admins/Managers can update these fields for others
export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsString()
  @IsOptional()
  githubUsername?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
