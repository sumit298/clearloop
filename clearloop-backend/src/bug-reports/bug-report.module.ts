import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { BugReportsController } from "./bug-report.controller";
import { BugReportsService } from "./bug-report.service";


@Module({
    imports: [PrismaModule],
    controllers: [BugReportsController],
    providers: [BugReportsService],
    exports: [BugReportsService]
})

export class BugReportsModule {}