import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from '@prisma/client';
import { UpdateOrderStatusDto } from './dto/update-order.dto';

// Define OrderStatus enum
export enum OrderStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Injectable()
export class OrderService {
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


    // Créer la commande avec le prix du produit et status PENDING
    const order = await this.prisma.order.create({
      data: {
        productId: data.productId,
        quantity: data.quantity,
        price: product.price * data.quantity,
        status: OrderStatus.PENDING, // Utiliser l'énumération au lieu d'une chaîne
         },
    });
    return order;
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
id: string, status: OrderStatus, dto: UpdateOrderStatusDto): Promise<Order> {
  const order = await this.prisma.order.findUnique({ where: { id } });

  // Extraire la raison du DTO
  const reason = dto.reason;

  // Vérifier si la commande existe
  if (!order) {
    throw new NotFoundException(`Commande avec l'ID ${id} non trouvée`);
  }

  // Vérifier que la commande est bien en statut PENDING
  if (order.status !== OrderStatus.PENDING) {
    throw new BadRequestException('Seules les commandes en attente peuvent être modifiées');
  }

  // Valider le nouveau statut
  if (status !== OrderStatus.APPROVED && status !== OrderStatus.REJECTED) {
    throw new BadRequestException('Le statut doit être APPROVED ou REJECTED');
  }

  // Validation spécifique au statut
  if (status === OrderStatus.REJECTED && (!reason || reason.trim() === '')) {
    throw new BadRequestException('Une raison de rejet est requise pour rejeter une commande');
  }

if (status === OrderStatus.APPROVED) {
  // Mettre à jour le statut de la commande avec la raison
  return this.prisma.order.update({
    where: { id },
    data: {
      status: status
    },
  });
} else if (status === OrderStatus.REJECTED) {
  // Mettre à jour le statut de la commande avec la raison de rejet
  return this.prisma.order.update({
    where: { id },
    data: {
      status: status,
      statusReason: reason
    },
  });
}

// Si aucun des statuts n'est valide, lever une exception (ce cas ne devrait pas arriver à cause des validations précédentes)
throw new BadRequestException('Statut de commande invalide');
}
  }
