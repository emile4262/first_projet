import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma.service';
import { product } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: CreateProductDto, imageUrl?: string): Promise<product> {
    const category = await this.prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Catégorie avec l'ID ${data.categoryId} non trouvée`);
    }

    // Convertir les strings en nombres (venant de multipart/form-data)
    const stockInitial = parseInt(String(data.stockInitial), 10);
    const stockFinal = parseInt(String(data.stockInitial), 10);
    const price = parseFloat(String(data.price));

    if (stockInitial <= 0) {
      throw new BadRequestException('Le produit doit avoir un stock initial supérieur à 0');
    }

    if (!data.userId) {
      throw new BadRequestException('L\'ID utilisateur est requis');
    }

    const product = await this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: price,
        stockInitial: stockInitial,
        stockFinal: stockFinal,
        imageUrl: imageUrl,
        category: {
          connect: { id: data.categoryId },
        },
        user: {
          connect: { id: data.userId },
        },
      },
    });

    return product;

  }

  // Tous les produits avec pagination
  async findAll(): Promise<product[]> {
    return this.prisma.product.findMany({
      include: {
        category: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        }
      },
    });
  }

  async findAllWithCategory() {
    return this.prisma.product.findMany({
      include: {
        category: true,
      },
    });
  }

  // Produits filtrés par mot-clé
  // async searchProducts(search: string) {
  //   return this.prisma.product.findMany({
  //     where: {
  //       OR: [
  //         { name: { contains: search, mode: 'insensitive' } },
  //         { description: { contains: search, mode: 'insensitive' } },
  //       ],
  //     },
  //   });
  // }

  // obtenir un produit par son id
  async findOne(id: string): Promise<product | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stockInitial: true,
        stockFinal: true,
        categoryId: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        Is_available: true,
        user: {
          select: {
            id: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }

    return product;
  }

  // modifier un produit
  async update(id: string, data: UpdateProductDto): Promise<product> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description && { description: data.description }),
        ...(data.price !== undefined && { price: parseFloat(String(data.price)) }),
        ...(data.stockInitial !== undefined && { stockInitial: data.stockInitial }),
        ...(data.categoryId && { category: { connect: { id: data.categoryId } } }),
      },
    });
  }

  // Mettre à jour l'image d'un produit
  // async updateProductImage(productId: string, imageUrl: string): Promise<product> {
  //   const product = await this.prisma.product.findUnique({
  //     where: { id: productId },
  //   });

  //   if (!product) {
  //     throw new NotFoundException(`Produit avec l'ID ${productId} non trouvé`);
  //   }

  //   return this.prisma.product.update({
  //     where: { id: productId },
  //     data: {
  //       imageUrl: imageUrl
  //     }
  //   });
  // }

  // supprimer un produit
  async remove(id: string): Promise<product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }
}