import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from '@prisma/client';
import { UpdateOrderStatusDto } from './dto/update-order.dto';

export enum OrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  // Créer une commande
  async create(data: CreateOrderDto): Promise<Order> {
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
      select: {
        price: true,
        stockInitial: true,
        stockFinal: true,
        Is_available: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    if (!product.Is_available) {
      throw new BadRequestException('Produit non disponible');
    }

    if (data.quantity <= 0) {
      throw new BadRequestException('La quantité demandée doit être supérieure à zéro');
    }

    if (product.stockFinal <= 0) {
      throw new BadRequestException('Le produit n\'a plus de stock disponible');
    }

    if (data.quantity > product.stockFinal) {
      throw new BadRequestException('Quantité demandée supérieure au stock disponible');
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: data.productId },
        data: {
          stockFinal: product.stockFinal - data.quantity,
        },
      });

      const price = product.price;
      const total = price * data.quantity;

      return tx.order.create({
        data: {
          productId: data.productId,
          quantity: data.quantity,
          price,
          total,
          status: OrderStatus.PENDING,
          userId: data.userId,
        },
      });
    });
  }

  // obtenir tous les orders
  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        products: true,
        user: true,
      },
    });
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
  async updateOrderStatus(
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
      return this.prisma.$transaction(async (tx) => {
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





