// src/order/order.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaModule } from 'src/prisma.module';
import { ConfigModule } from '@nestjs/config';
// import { Order, OrderItem } from './entities/order.entity';

@Module({
  imports: [PrismaModule,ConfigModule,],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}
