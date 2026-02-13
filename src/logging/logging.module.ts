// src/logging/logging.module.ts
import { Module } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { LoggingController } from './logging.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LoggingController],
  providers: [LoggingService],
  exports: [LoggingService], 
})
export class LoggingModule {}