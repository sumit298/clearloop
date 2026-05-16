import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FeaturesModule } from './features/features.module';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, AuthModule, FeaturesModule, ProjectsModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
