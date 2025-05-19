// src/order/order.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaModule } from 'src/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
// import { Order, OrderItem } from './entities/order.entity';

@Module({
  imports: [PrismaModule,AuthModule,],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}
