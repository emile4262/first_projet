import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [ReviewController],
  providers: [ReviewService,PrismaService,JwtService],
  exports: [ReviewService], // important si un autre module utilise ReviewService
})
export class ReviewModule {}
