import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from '@prisma/client';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { CartService } from 'src/cart/cart.service';
import { SearchOrderDto } from './dto/search.order.dto';

export enum OrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
  ) { }

  // Créer une commande
  async create(data: CreateOrderDto): Promise<Order> {
    return await this.prisma.$transaction(async (tx: any) => {
      // 1. Récupérer le produit avec verrouillage (si possible, sinon simple lecture)
      // Note: Prisma ne supporte pas nativement le "SELECT FOR UPDATE" facilement sans raw query,
      // mais on peut vérifier le stock dans la transaction.
      const product = await tx.product.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        throw new NotFoundException('Produit non trouvé');
      }

      if (!product.Is_available) {
        throw new BadRequestException('Produit non disponible à la vente');
      }

      if (product.stockFinal < data.quantity) {
        throw new BadRequestException(`Stock insuffisant. Disponible: ${product.stockFinal}`);
      }

      // 2. Décrémenter le stock
      await tx.product.update({
        where: { id: data.productId },
        data: {
          stockFinal: {
            decrement: data.quantity,
          },
        },
      });

      // 3. Créer la commande
      const priceAsNumber = parseFloat(product.price);
      const total = priceAsNumber * data.quantity;

      return tx.order.create({
        data: {
          productId: data.productId,
          userId: data.userId,
          quantity: data.quantity,
          price: priceAsNumber,
          total: total,
          status: OrderStatus.PENDING,
        },
      });
    }).then(async (order) => {
      // 4. Après la création de la commande, ajouter le produit au panier
      try {
        const activeCart = await this.prisma.cart.findFirst({
          where: {
            userId: data.userId,
            status: 'ACTIVE',
          },
        });

        if (activeCart) {
          await this.cartService.addProductToCart(activeCart.id, data.productId);
        }
      } catch (error) {
        // Si l'ajout au panier échoue, on ignore l'erreur car la commande a déjà été créée
        console.error('Erreur lors de l\'ajout du produit au panier:', error);
      }

      return order;
    });
  }

  // obtenir tous les orders avec pagination
  async findAllOrders(query: SearchOrderDto) {
    const { page = 1, limit = 10, search, dateCreationDebut, dateCreationFin } = query || {};
    const take = Math.max(1, Number(limit || 10));
    const skip = (Math.max(1, Number(page || 1)) - 1) * take;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (dateCreationDebut || dateCreationFin) {
      where.createdAt = {};
      if (dateCreationDebut) where.createdAt.gte = new Date(dateCreationDebut);
      if (dateCreationFin) where.createdAt.lte = new Date(dateCreationFin);
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

  return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take),
      },
    };
}


  // Obtenir un order par ID
  async findOne(id: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,

      },
    });

    if (!order) {
      throw new NotFoundException(`Commande avec l'ID ${id} non trouvée`);
    }

    return order;
  }

  // Mettre à jour le statut d'une commande
  async  updateOrderStatus(
    id: string,
    status: OrderStatus,
    dto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException(`Commande avec l'ID ${id} non trouvée`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Seules les commandes en attente peuvent être modifiées');
    }

    if (status !== OrderStatus.APPROVED && status !== OrderStatus.REJECTED) {
      throw new BadRequestException('Le statut doit être APPROVED ou REJECTED');
    }

    const reason = dto.reason;

    if (status === OrderStatus.REJECTED && (!reason || reason.trim() === '')) {
      throw new BadRequestException('Une raison de rejet est requise pour rejeter une commande');
    }

    if (status === OrderStatus.APPROVED) {
      return this.prisma.order.update({
        where: { id },
        data: {
          status: status,
        },
      });
    } else if (status === OrderStatus.REJECTED) {
      return this.prisma.$transaction(async (tx: any) => {
        const orderWithProduct = await tx.order.findUnique({
          where: { id },
          select: {
            productId: true,
            quantity: true,
          },
        });

        if (!orderWithProduct) {
          throw new NotFoundException(`Commande avec l'ID ${id} non trouvée`);
        }

        await tx.product.update({
          where: { id: orderWithProduct.productId },
          data: {
            stockFinal: {
              increment: orderWithProduct.quantity,
            },
          },
        });

        return tx.order.update({
          where: { id },
          data: {
            status: status,
            statusReason: reason,
          },
        });
      });
    }

    throw new BadRequestException('Statut de commande invalide');
  }

  // Supprimer un order par ID
  async remove(id: string): Promise<Order> {
    try {
      return await this.prisma.order.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Commande avec l'ID ${id} non trouvée`);
    }
  }
}





