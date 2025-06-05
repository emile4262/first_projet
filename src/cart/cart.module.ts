import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';

@Module({
    imports: [ JwtModule], 
  controllers: [CartController],
  providers: [CartService, PrismaService, JwtService],
  exports: [CartService],
})
export class CartModule {}
