import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FeaturesModule } from './features/features.module';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';
import { GithubModule } from './github/github.module';
import { BugReportsModule } from './bug-reports/bug-report.module';
import { ReleasesModule } from './releases/releases.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FeaturesModule,
    ProjectsModule,
    UsersModule,
    GithubModule,
    BugReportsModule,
    ReleasesModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
