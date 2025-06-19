import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Delivery, DeliveryStatus } from '@prisma/client';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';

@Injectable()
export class DeliveryService {
  findManyByDeliveryDate(date: string) {
    throw new Error('Method not implemented.');
  }
  constructor(private readonly prisma: PrismaService) {}

  // Créer une livraison
  async create(data: CreateDeliveryDto): Promise<Delivery> {
    if (!data.orderId) {
      throw new BadRequestException("L'identifiant de la commande est requis");
    }

    // Vérifier que la commande existe
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      select: { id: true },
    });
    if (!order) {
      throw new NotFoundException("Commande non trouvée");
    }

    // Validation et parsing des dates
    const deliveryDate = this.parseDate(data.deliveryDate);
    const deliveredAt = this.parseDate(data.deliveredAt);

    // Validation du status enum (valeurs possibles : PENDING, APPROVED, DELIVERED, CANCELED)
    const status: DeliveryStatus = Object.values(DeliveryStatus).includes(data.status as DeliveryStatus)
      ? (data.status as DeliveryStatus)
      : DeliveryStatus.PENDING;

    return this.prisma.delivery.create({
      data: {
        address: data.address,
        method: data.method ?? null,
        status,
        deliveryDate,
        deliveredAt,
        order: { connect: { id: order.id } },
      },
    });
  }

  private parseDate(date?: string | Date): Date | null {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) {
      throw new BadRequestException(`Date invalide: ${date}`);
    }
    return d;
  }

  // Trouver toutes les livraisons
  async findAll(): Promise<Delivery[]> {
    return this.prisma.delivery.findMany();
  }

  // Trouver les livraisons par date de livraison
async findDeliveriesByExactDate(dateString: string): Promise<Delivery[]> {
  const parsedDate = new Date(dateString);
 

  const startOfDay = new Date(parsedDate);
  startOfDay.setHours(0, 0, 0, 0);

  

  const endOfDay = new Date(parsedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const deliveries = await this.prisma.delivery.findMany({
    where: {
      deliveryDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      order: true,
    },
  });

  if (deliveries.length === 0) {
    throw new NotFoundException(
      `Aucune livraison trouvée à la date exacte : ${dateString}`,
    );
  }

  return deliveries;
}


  // Trouver une livraison par son id
  async findOne(id: string): Promise<Delivery> {
    const delivery = await this.prisma.delivery.findUnique({ where: { id } });
    if (!delivery) {
      throw new NotFoundException('Livraison non trouvée');
    }
    return delivery;
  }

  // Mettre à jour une livraison
  async update(id: string, dto: UpdateDeliveryDto): Promise<Delivery> {
    if (!id) {
      throw new BadRequestException("L'identifiant de la livraison est requis");
    }

    // Vérifie que la livraison existe
    const existingDelivery = await this.prisma.delivery.findUnique({
      where: { id },
    });

    if (!existingDelivery) {
      throw new NotFoundException('Livraison non trouvée');
    }

    // Vérifie que la commande existe si un orderId est fourni
    if (dto.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
      });

      if (!order) {
        throw new NotFoundException("Commande liée non trouvée");
      }
    }

    // Construction sécurisée des données de mise à jour
    const updateData: any = {
      address: dto.address,
      method: dto.method,
      deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : undefined,
      deliveredAt: dto.deliveredAt ? new Date(dto.deliveredAt) : undefined,
    };

    // Si un statut est fourni, on s’assure qu’il est correct
    if (dto.status && Object.values(DeliveryStatus).includes(dto.status as DeliveryStatus)) {
      updateData.status = {
        set: dto.status as DeliveryStatus,
      };
    }

    // Connexion à une autre commande si fourni
    if (dto.orderId) {
      updateData.order = {
        connect: {
          id: dto.orderId,
        },
      };
    }

    // Mise à jour
    return this.prisma.delivery.update({
      where: { id },
      data: updateData,
      include: { order: true },
    });
  }

  // Supprimer une livraison
  async remove(id: string): Promise<{ message: string }> {
    const existing = await this.prisma.delivery.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Livraison non trouvée');
    }
    await this.prisma.delivery.delete({ where: { id } });
    return { message: 'Livraison supprimée avec succès' };
  }
}
function startOfDay(date: Date): any {
  throw new Error('Function not implemented.');
}

function endOfDay(date: Date): any {
  throw new Error('Function not implemented.');
}

