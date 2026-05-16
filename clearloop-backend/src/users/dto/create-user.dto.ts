import { UserRole } from "@prisma/client";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateUserDto {
    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @IsString()
    name!: string;
 
    @IsEnum(UserRole)
    role!: UserRole

    @IsString()
    @IsOptional()
    designation?: string;

    @IsString()
    @IsOptional()
    githubUsername?: string

}