import { Module } from "@nestjs/common";
import { GithubService } from "./github.service";
import { GithubController } from "./github.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { ReleasesModule } from "../releases/releases.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
    imports: [PrismaModule, ReleasesModule, NotificationsModule],
    controllers: [GithubController],
    providers: [GithubService],
    exports: [GithubService]
})

export class GithubModule {}