import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma.service';
import { ConfigModule } from '@nestjs/config';
// import { APP_GUARD } from '@nestjs/core';
// import { AuthGuard } from './auth/auth.module';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { UsersService } from './users/users.service';
import { UsersController } from 'src/users/users.controller';
import { UsersModule } from './users/users.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static'; // Importez ServeStaticModule
import { ProductModule } from './product/product.module';
import { ProductService } from './product/product.service';
import { ProductController } from './product/product.controller';
import { JwtModule } from '@nestjs/jwt/dist/jwt.module';
import { CategoryModule } from './category/category.module';
import { CategoryController } from './category/category.controller';
import { CategoryService } from './category/category.service';
import { OrderModule } from './order/order.module';
import { OrderController } from './order/order.controller';
import { OrderService } from './order/order.service';
// import { CartModule } from './cart/cart.module';
import { ReviewModule } from './review/review.module';
import { ReviewController } from './review/review.controller';
import { ReviewService } from './review/review.service';
import { PaymentService } from './payement/payement.service';
import { PaymentController } from './payement/payement.controller';
import { PaymentModule } from './payement/payement.module';
import { CartModule } from './cart/cart.module';
import { CartController } from './cart/cart.controller';
import { CartService } from './cart/cart.service';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    //UsersModule,
    AuthModule,
    UsersModule, ProductModule,CategoryModule, PaymentModule , CartModule,
    ServeStaticModule.forRoot({ // Configurez ServeStaticModule ici
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    // CartModule,
    OrderModule,
    ReviewModule,
    CartModule,
    
  ],
  controllers: [AppController, UsersController, ProductController, OrderController,CategoryController, ReviewController, PaymentController, CartController],
  providers: [AppService, UsersService, ProductService, OrderService, CategoryService,ReviewService, PaymentService, CartService
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthGuard('jwt'),
    // },

  ],
})
export class AppModule {
  async onModuleInit() {
    const app = await NestFactory.create(AppModule); // Créez une instance de l'application ici

    const config = new DocumentBuilder()
      .setTitle('Mon API NestJS')
      .setDescription('La description de mon API')
      .setVersion('1.0')
      .addBearerAuth() // Si vous utilisez Bearer token pour l'authentification
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document); // Définit la route pour accéder à l'UI Swagger ('/api')

    //   await app.listen(5001); // Assurez-vous que votre application écoute après la configuration de Swagger
  }
}