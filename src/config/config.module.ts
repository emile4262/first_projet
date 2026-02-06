import { Module } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ProductController } from 'src/product/product.controller';
import { UsersController } from 'src/users/users.controller';
import { ProductModule } from 'src/product/product.module';
import { UsersModule } from 'src/users/users.module';


@Module({
  imports: [ ConfigModule,
    PassportModule,ProductModule,UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'mon_secret_jwt_par_defaut',
      signOptions: { expiresIn: '48h' },
    }),
  ],
  controllers:[ProductController, UsersController],
  providers: [JwtStrategy],
   exports: [JwtModule],
})
export class ConfigModule {}

