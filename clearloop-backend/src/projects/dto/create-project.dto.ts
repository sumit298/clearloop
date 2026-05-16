import { IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";

export class CreateProjectDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsUrl()
    @IsOptional()
    githubRepoUrl?: string;
}