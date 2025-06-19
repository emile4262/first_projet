import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DeliveryController],
  providers: [DeliveryService],
})
export class DeliveryModule {}
