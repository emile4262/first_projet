import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma.service';
import { Category } from './entities/category.entity';
import { SearchDto } from 'src/users/dto/search.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  // creer une categorie
  async create(data: CreateCategoryDto): Promise<Category> {
    const { name } = data;

    // Vérifier si la catégorie existe déjà
    const existingCategory = await this.prisma.category.findFirst({
      where: { name },
    });

    if (existingCategory) {
      throw new BadRequestException('Cette catégorie existe déjà');
    }

    const category = await this.prisma.category.create({
      data: {
        name,
      },
    });

    return category;
  }

  // obtention de toutes les categories
  async findAll(query: SearchDto) {
    const { page = 1, limit = 10, search, dateCreationDebut, dateCreationFin } = query || {};
    const take = Math.max(1, Number(limit || 10));
    const skip = (Math.max(1, Number(page || 1)) - 1) * take;

    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (dateCreationDebut || dateCreationFin) {
      where.createdAt = {};
      if (dateCreationDebut) where.createdAt.gte = new Date(dateCreationDebut);
      if (dateCreationFin) where.createdAt.lte = new Date(dateCreationFin);
    }
    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take,
      }),
      this.prisma.category.count({ where }),
    ]);
    return {
      data, 
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take),
      }
    }
    
  }
  // async findAllWithProducts(): Promise<any[]> {
  //   return this.prisma.category.findMany({
  //     include: {
  //       product: true,
  //     },
  //   });
  // }

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

  // supprimer une categorie
  async remove(id: string) {
    await this.prisma.category.delete({
      where: { id: id },
    });
    return { message: `Catégorie avec l'ID ${id} supprimée avec succès` };
  }
}