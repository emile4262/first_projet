import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './config/roles.guard';
import { UsersService } from './users/users.service';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ProductModule } from './product/product.module';
import { ProductService } from './product/product.service';
import { ProductController } from './product/product.controller';
import { CategoryModule } from './category/category.module';
import { CategoryController } from './category/category.controller';
import { CategoryService } from './category/category.service';
import { OrderModule } from './order/order.module';
import { OrderController } from './order/order.controller';
import { OrderService } from './order/order.service';
import { CartModule } from './cart/cart.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma.module';
import { LoggingModule } from './logging/logging.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    //UsersModule,
    AuthModule,
    UsersModule, ProductModule,CategoryModule,
    ServeStaticModule.forRoot({ // Configurez ServeStaticModule ici
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    CartModule,
    OrderModule,
    LoggingModule,
    
  ],
  controllers: [AppController, UsersController, ProductController, OrderController,CategoryController],
  providers: [
    AppService, 
    UsersService, 
    ProductService, 
    OrderService, 
    CategoryService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}