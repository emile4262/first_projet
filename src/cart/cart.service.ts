import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /** -------------------- CRÉATION -------------------- */
  async create(createCartDto: CreateCartDto) {

// verifie que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
       where: { id: createCartDto.userId },
    })

    if(!user) {
      throw new NotFoundException(`Utilisateur avec identifiant ${createCartDto.userId} pas trouvé`);
    }

    // Vérifie si un panier actif existe déjà pour l'utilisateur
   const existingActiveCart = await this.prisma.cart.findFirst({
    where: {
      userId: createCartDto.userId,
      status: 'ACTIVE',
    },
  });

  if(existingActiveCart){
    throw new ConflictException(`Un panier actif existe déjà pour l'utilisateur ${createCartDto.userId}`);
  }

    return this.prisma.cart.create({
      data: {
        ...createCartDto,
        status: 'ACTIVE',
        total: 0,
      },
      include: { products: true },
    });
  }

  /** -------------------- LECTURE -------------------- */
  async findAll() {
    return this.prisma.cart.findMany({
      include: {
        products: true,
        user: true,
      },
    });
  }


  async findByUserId(userId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { 
        userId,
        status: 'ACTIVE',
      },
      include: { products: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!cart) {
      throw new NotFoundException(`Active cart not found for user ${userId}`);
    }

    return cart;
  }

  async getProductCount(id: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id },
      include: { 
        products: {
          select: { id: true },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException(`Cart with id ${id} not found`);
    }

    return cart.products.length;
  }

  async hasProduct(cartId: string, productId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { 
        products: {
          where: { id: productId },
          select: { id: true },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException(`Cart with id ${cartId} not found`);
    }

    return cart.products.length > 0;
  }

  /** -------------------- MISE À JOUR -------------------- */
  async update(id: string, updateCartDto: UpdateCartDto) {
    return this.prisma.cart.update({
      where: { id },
      data: updateCartDto,
      include: { products: true },
    });
  }

  async updateCartTotal(id: string, newTotal: number) {
    return this.prisma.cart.update({
      where: { id },
      data: { total: newTotal },
    });
  }

  async changeCartStatus(
    id: string,
    status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED',
  ) {
    return this.prisma.cart.update({
      where: { id },
      data: { status },
    });
  }

  async addProduct(cartId: string, productId: string) {
    // Vérifie que le produit existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    // Ajoute le produit au panier
    const updatedCart = await this.prisma.cart.update({
      where: { id: cartId },
      data: {
        products: {
          connect: { id: productId },
        },
        total: {
          increment: product.price, // Met à jour le total
        },
      },
      include: { products: true },
    });

    return updatedCart;
  }

  async removeProduct(cartId: string, productId: string) {
    // Vérifie que le produit existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    // Supprime le produit du panier
    const updatedCart = await this.prisma.cart.update({
      where: { id: cartId },
      data: {
        products: {
          disconnect: { id: productId },
        },
        total: {
          decrement: product.price, // Met à jour le total
        },
      },
      include: { products: true },
    });

    return updatedCart;
  }

  async findOne(id: string) {
  const cart = await this.prisma.cart.findUnique({
    where: { id },
    include: { products: true },
  });

  if (!cart) {
    throw new NotFoundException(`Cart with id ${id} not found`);
  }

  const total = cart.products.reduce((sum, product) => {
    return sum + product.price;
  }, 0);

  return { ...cart, total };
}


  /** -------------------- SUPPRESSION -------------------- */
  async remove(id: string) {
    return this.prisma.cart.delete({
      where: { id },
      include: { products: true },
    });
  }

  async clearCart(cartId: string) {
    // Récupère le panier avec les produits pour calculer le total
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { products: true },
    });

    if (!cart) {
      throw new NotFoundException(`Cart with id ${cartId} not found`);
    }

    // Vide le panier et réinitialise le total
    return this.prisma.cart.update({
      where: { id: cartId },
      data: {
        products: {
          set: [],
        },
        total: 0,
      },
    });
  }
}