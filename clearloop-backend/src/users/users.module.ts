import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersController } from "./users.controller";
import { UserService } from "./users.service";

@Module({
    imports: [PrismaModule],
    controllers: [UsersController],
    providers: [UserService],
    exports: [UserService]
})

export class UsersModule {}