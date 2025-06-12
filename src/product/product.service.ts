import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma.service';
import { product } from '@prisma/client'; // Utilisation du nom en minuscule

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProductDto): Promise<product> {
    // Vérifier si la catégorie existe
    const category = await this.prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Catégorie avec l'ID ${data.categoryId} non trouvée`);
    }

    // Vérifier si le stock initial est valide
    if (data.stockInitial <= 0) {
      throw new BadRequestException('Le produit doit avoir un stock initial supérieur à 0');
    }

    // Créer le produit avec stockInitial et stockFinal
    const product = await this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        stockInitial: data.stockInitial,
        stockFinal: data.stockInitial,
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


 // Tous les produits
 async findAll() {
    return this.prisma.product.findMany();
  }

  async findAllWithCategory() {
    return this.prisma.product.findMany({
      include: {
        category: true,
      },
    });
  }

// Produits filtrés par mot-clé
async searchProducts(search: string) {
  return this.prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    },
  });
}


   
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
    // Vérifier si le produit existe
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });
    
    if (!existingProduct) {
      throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
    }
    
    // Mettre à jour le produit
    return this.prisma.product.update({
      where: { id },
      data
    });
  }
  
  // Mettre à jour l'image d'un produit
  async updateProductImage(productId: string, imageUrl: string): Promise<product> {
  const product = await this.prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundException(`Produit avec l'ID ${productId} non trouvé`);
  }

  return this.prisma.product.update({
    where: { id: productId },
    data: {
      imageUrl: imageUrl
    }
  });
}

  
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