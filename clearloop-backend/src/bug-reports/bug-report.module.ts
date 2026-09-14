import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { BugReportsController } from "./bug-report.controller";
import { BugReportsService } from "./bug-report.service";
import { NotificationsModule } from "../notifications/notifications.module";


@Module({
    imports: [PrismaModule, NotificationsModule],
    controllers: [BugReportsController],
    providers: [BugReportsService],
    exports: [BugReportsService]
})

export class BugReportsModule {}