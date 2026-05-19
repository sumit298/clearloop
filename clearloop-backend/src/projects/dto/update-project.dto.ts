import { IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";

export class UpdateProjectDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsUrl()
    @IsOptional()
    githubRepoUrl?: string;

    @IsString()
    @IsOptional()
    githubRepoId?: string;

    @IsString()
    @IsOptional()
    githubInstallationId?: string;
}

export class AddMemberDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
