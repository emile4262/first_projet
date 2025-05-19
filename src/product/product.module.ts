import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { PrismaService } from 'src/prisma.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
// Import votre repository/module de base de données si nécessaire
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Product } from './entities/product.entity';

@Module({
  imports: [ JwtModule,
    // TypeOrmModule.forFeature([Product]), // Décommentez si vous utilisez TypeORM
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/products';
          // Création du dossier pour garder les  upload
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `product-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  ],
  controllers: [ProductController],
  providers: [ProductService,PrismaService,JwtService],
  exports: [ProductService], // important si un autre module utilise ProductService
})
export class ProductModule {}