import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FeaturesModule } from './features/features.module';

@Module({
  imports: [PrismaModule, AuthModule, FeaturesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
