import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma.module';
import { PaymentController } from './payement.controller';
import { PaymentService } from './payement.service';

@Module({
  imports: [PrismaModule,AuthModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
