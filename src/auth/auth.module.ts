import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [ AuthModule,
    JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '1d' }, // Durée du token
   }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
