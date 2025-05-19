import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma.service';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  imports: [ UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' }, // Durée du token
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, PrismaService,JwtService],
  exports: [JwtModule,UsersService],
})
export class UsersModule {}
