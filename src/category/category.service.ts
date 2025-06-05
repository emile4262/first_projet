import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma.service';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ creer une categorie
  async create(CreateCategoryDto: CreateCategoryDto): Promise<Category> {
    const { name } = CreateCategoryDto;

    // Vérifier si la catégorie existe déjà

    const existingCategory = await this.prisma.category.findFirst({
      where: { name },
    });

    if (existingCategory) {
      throw new NotFoundException('Cette catégorie existe déjà');
    }
    return this.prisma.category.create({
      data: {
        name: CreateCategoryDto.name
      },
    });

    // return this.prisma.category.create({
    //   data: CreateCategoryDto,
    // });
  }

  // obtention de toutes les categories
  async findAll() {
    return this.prisma.category.findMany({
      include: { product: true },
    });
  }
  async findAllWithProducts(): Promise<any[]> {
    return this.prisma.category.findMany({
      include: {
        product: true,
      },
    });
  }

  // obtention d'une categorie par son id
  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: id}, 
      include: { product: true }, 
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
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