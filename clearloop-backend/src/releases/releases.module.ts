import { Module } from '@nestjs/common';
import { ReleaseService } from './releases.service';
import { ReleasesController } from './releases.controller';
import { AIService } from './ai.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReleasesController],
  providers: [ReleaseService, AIService],
  exports: [ReleaseService, AIService],
})
export class ReleasesModule {}
