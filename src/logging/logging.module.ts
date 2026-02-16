import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "src/prisma.module";
import { LoggingService } from "./logging.service";
import { LoggingController } from "./logging.controller";


@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [LoggingService],
  controllers: [LoggingController],
})
export class LoggingModule {}