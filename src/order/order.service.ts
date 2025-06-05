import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from '@prisma/client';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { order } from './entities/order.entity';

// Define OrderStatus enum
export enum OrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
// export enum DeliveryStatus {
//   PENDING = 'PENDING',
//   SHIPPED = 'SHIPPED',
//   DELIVERED = 'DELIVERED',
//   CANCELED = 'CANCELED',
// }

@Injectable()
export class OrderService  {
  constructor(private readonly prisma: PrismaService) {}

  // Créer un order 
 async create(data: CreateOrderDto): Promise<Order> {
  // Récupérer le produit pour obtenir son prix
  const product = await this.prisma.product.findUnique({
    where: { id: data.productId },
    select: { 
      price: true,
      stock: true,
      Is_available: true
    },
  });

  // Vérifier si le produit existe
  if (!product) {
    throw new NotFoundException('Produit non trouvé');
  }

  // Vérifier si le produit est disponible
  if (!product.Is_available) {
    throw new BadRequestException('Produit non disponible');
  }

  // Vérifier si le produit a encore du stock
  if (product.stock === 0) {
    throw new BadRequestException('Le produit n\'a plus de stock disponible');
  }

  // Vérifier si la quantité demandée est disponible
  if (data.quantity > product.stock) {
    throw new BadRequestException('Quantité demandée supérieure au stock disponible');
  }

  
  return await this.prisma.$transaction(async (tx) => {
    // Mettre à jour le stock
    await tx.product.update({
      where: { id: data.productId },
      data: {
        stock: product.stock - data.quantity,
      },
    });

    // Créer la commande dans la même transaction
    return tx.order.create({
      data: {
        productId: data.productId,
        quantity: data.quantity,
        price: product.price * data.quantity,
        status: OrderStatus.PENDING,
        userId: data.userId,
        // deliveryStatus: 'PENDING',
        // deliveryAddress: data.deliveryAddress,
      },
    });
  });
}

  // Obtenir tous les orders
  async getAllOrders(): Promise<Order[]> {
    return this.prisma.order.findMany({
      include: {
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
  // Mettre à jour le statut d'une commande

 async updateOrderStatus(
  id: string,
  status: OrderStatus,
  dto: UpdateOrderStatusDto
): Promise<Order> {
  const order = await this.prisma.order.findUnique({ where: { id } });

  // verification de l'existence de la commande
  if (!order) {
    throw new NotFoundException(`Commande avec l'ID ${id} non trouvée`);
  }

  // verification du statut de la commande
  if (order.status !== OrderStatus.PENDING) {
    throw new BadRequestException('Seules les commandes en attente peuvent être modifiées');
  }

  // Vérification du statut
  if (status !== OrderStatus.APPROVED && status !== OrderStatus.REJECTED) {
    throw new BadRequestException('Le statut doit être APPROVED ou REJECTED');
  }

  // Vérification de la raison pour le statut REJECTED
  const reason = dto.reason;

 if (status === OrderStatus.REJECTED && (!reason || reason.trim() === '')) {
  throw new BadRequestException('Une raison de rejet est requise pour rejeter une commande');
}

  if (status === OrderStatus.APPROVED) {
    // Simple update sans remboursement de stock
    return this.prisma.order.update({
      where: { id },
      data: {
        status: status,
      },
    });
  } else if (status === OrderStatus.REJECTED) {
    // 🧠 On utilise une transaction pour remettre le stock + mettre à jour la commande
    return this.prisma.$transaction(async (tx) => {
      // Récupération de la commande complète avec le produit
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

      // Remettre le stock du produit
      await tx.product.update({
        where: { id: orderWithProduct.productId },
        data: {
          stock: {
            increment: orderWithProduct.quantity, // 👈 On ajoute la quantité
          },
        },
      });

      // Mettre à jour le statut de la commande
       return tx.order.update({
        where: { id },
        data: {
        status: status,
        statusReason: reason, // ✅ on stocke la raison ici
       },
       });
       
      });
      }

  // Ajout d'une exception explicite si aucun chemin précédent n'est pris
  throw new BadRequestException('Statut de commande invalide');
 }
// async updateDeliveryStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
//   const order = await this.prisma.order.findUnique({ where: { id } });

//   if (!order) {
//     throw new NotFoundException(`Commande avec l'ID ${id} non trouvée`);
//   }

//   return this.prisma.order.update({
//     where: { id },
//     data: {
//       deliveryStatus: dto.deliveryStatus,
//       deliveryDate: dto.deliveryStatus === 'DELIVERED' ? new Date() : null,
//     },
//   });
 }





