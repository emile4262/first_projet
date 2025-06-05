import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express/interfaces';
import { RolesGuard } from './auth/roles.guard';

async function bootstrap() {



  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('The API description')
    .setVersion('1.0')
    .addTag('api')
    .addBearerAuth()
    .build();
    app.enableCors({
      origin: '*', 
    });
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  const port = process.env.PORT ?? 5000;
  await app.listen(port);
}
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
   ],
})
export class RootModule {}
bootstrap();
