import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaService } from 'src/prisma.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
// import { Category } from './entities/category.entity';
@Module({
  imports: [JwtModule],
  controllers: [CategoryController],
  providers: [PrismaService, CategoryService,JwtService],
  exports: [ CategoryService ],
  

})
export class CategoryModule {}
