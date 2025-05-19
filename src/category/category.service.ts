import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ creer une categorie
  async create(data: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        name: data.name
      },
    });
  }

  // ✅ recuperer toutes les categories avec leurs produits
  async findAll() {
    return this.prisma.category.findMany({
      include: { product: true }, 
    });
  }

  // ✅ recuperer une categorie par son id
  async findOne(id: string) {
    return this.prisma.category.findUnique({
      where: { id: id}, 
      include: { product: true }, 
    });
  }

  // ✅ modifier une categorie
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id: id.toString() },
      data: updateCategoryDto,
    });
  }

  // ✅ supprimer une categorie
  async remove(id: string) {
    return this.prisma.category.delete({
      where: { id: id.toString() },
    });
  }
}