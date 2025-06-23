import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreatePayementDto, PayementStatus } from './dto/create-payement.dto';
import { UpdatePayementDto } from './dto/update-payement.dto';
import axios from 'axios';

// Constantes
const DEFAULT_PAGINATION_LIMIT = 50;
const MAX_PAGINATION_LIMIT = 100;

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export interface PaymentStatistics {
  totalPayments: number;
  totalAmount: number;
  averageAmount: number;
  paymentsByStatus: Record<PaymentStatus, number>;
  monthlyRevenue: number;
}

export interface UserPaymentStatistics extends PaymentStatistics {
  userId: string;
  totalOrders: number;
  averageOrderValue: number;
  lastPayementDate?: Date;
  firstPayementDate?: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

@Injectable()
export class PaymentService {
  findAll() {
    throw new Error('Method not implemented.');
  }
  getById(id: number) {
    throw new Error('Method not implemented.');
  }
  private readonly logger = new Logger(PaymentService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Crée un nouveau paiement
   * @param createPaymentDto DTO de création de paiement
   * @param userId ID de l'utilisateur (optionnel pour vérification d'accès)
   * @returns Le paiement créé
   */
  async create(createPaymentDto: CreatePayementDto, userId?: string) {
    const { orderId, amount } = createPaymentDto;

    // Validation des données
    if (amount <= 0) {
      throw new BadRequestException('Le montant doit être positif');
    }

    // Vérifier que la commande existe
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true }
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    // Vérifier les droits d'accès si userId fourni
    if (userId && order.userId !== userId) {
      throw new ForbiddenException('Accès non autorisé à cette commande');
    }

    // Vérifier que le paiement ne dépasse pas le montant dû
    const totalPaid = order.payments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + p.amount, 0);
    const remaining = order.total - totalPaid;

    if (amount > remaining) {
      throw new BadRequestException(`Montant trop élevé. Reste à payer: ${remaining}`);
    }

    try {
      const payment = await this.prisma.payment.create({
        data: {
          amount,
          orderId,
          status: PaymentStatus.PENDING,
          createdAt: new Date(),
        },
        include: {
          order: true
        }
      });

      this.logger.log(`Paiement créé: ${payment.id} pour la commande ${orderId}`);
      return payment;
    } catch (error) {
      this.logger.error(`Erreur lors de la création du paiement: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère un paiement par son ID
   * @param id ID du paiement
   * @param userId ID de l'utilisateur (optionnel pour vérification d'accès)
   * @returns Le paiement trouvé
   */
  async findById(id: string, userId?: string) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              user: true
            }
          }
        }
      });

      if (!payment) {
        throw new NotFoundException('Paiement non trouvé');
      }

      // Vérifier les droits d'accès
      if (userId && payment.order.userId !== userId) {
        throw new ForbiddenException('Accès non autorisé à ce paiement');
      }

      return payment;
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération du paiement ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Met à jour un paiement
   * @param id ID du paiement
   * @param updatePaymentDto DTO de mise à jour
   * @param userId ID de l'utilisateur (optionnel pour vérification d'accès)
   * @returns Le paiement mis à jour
   */
  async updatePayment(id: string, updatePaymentDto: UpdatePayementDto, userId?: string) {
    const payment = await this.findById(id, userId);

    const { amount, status } = updatePaymentDto;

    // Validation du montant si fourni
    if (amount !== undefined && amount <= 0) {
      throw new BadRequestException('Le montant doit être positif');
    }

    // Validation du statut
    if (status && !Object.values(PayementStatus).includes(status)) {
      throw new BadRequestException('Statut de paiement invalide');
    }

    try {
      const updatedPayement = await this.prisma.payement.update({
        where: { id },
        data: {
          ...(amount && { amount }),
          ...(status && { status }),
          updatedAt: new Date(),
        },
        include: {
          order: true
        }
      });

      this.logger.log(`Paiement mis à jour: ${id}`);
      return updatedPayement;
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour du paiement ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Supprime un paiement
   * @param id ID du paiement
   * @param userId ID de l'utilisateur (optionnel pour vérification d'accès)
   * @returns Le paiement supprimé
   */
  async deletePayment(id: string, userId?: string) {
    const payment = await this.findById(id, userId);

    // Ne pas supprimer un paiement confirmé
    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Impossible de supprimer un paiement confirmé');
    }

    try {
      const deletedPayment = await this.prisma.payment.delete({
        where: { id }
      });

      this.logger.log(`Paiement supprimé: ${id}`);
      return deletedPayment;
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression du paiement ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Annule un paiement
   * @param id ID du paiement
   * @param userId ID de l'utilisateur (optionnel pour vérification d'accès)
   * @returns Le paiement annulé
   */
  async cancelPayement(id: string, userId?: string) {
    const payement = await this.findById(id, userId);

    if (payement.status === PayementStatus.COMPLETED) {
      throw new BadRequestException('Impossible d\'annuler un paiement confirmé. Utilisez le remboursement.');
    }

    try {
      const cancelledPayement = await this.updatePayment(id, { status: PayementStatus.CANCELLED }, userId);
      this.logger.log(`Paiement annulé: ${id}`);
      return cancelledPayement;
    } catch (error) {
      this.logger.error(`Erreur lors de l'annulation du paiement ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Confirme un paiement
   * @param id ID du paiement
   * @returns Le paiement confirmé
   */
  async confirmPayement(id: string) {
    try {
      const confirmedPayement = await this.updatePayment(id, { status: PayementStatus.COMPLETED });
      this.logger.log(`Paiement confirmé: ${id}`);
      return confirmedPayement;
    } catch (error) {
      this.logger.error(`Erreur lors de la confirmation du paiement ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Traite un remboursement
   * @param id ID du paiement à rembourser
   * @param refundAmount Montant à rembourser (optionnel, par défaut le montant total)
   * @param userId ID de l'utilisateur (optionnel pour vérification d'accès)
   * @returns Le remboursement créé
   */
  async processRefund(id: string, refundAmount?: number, userId?: string) {
    return this.prisma.$transaction(async (prisma) => {
      const payment = await prisma.payment.findUnique({
        where: { id },
        include: { 
          order: { 
            include: { user: true } 
          } 
        }
      });

      if (!payment) {
        throw new NotFoundException('Paiement non trouvé');
      }

      if (userId && payment.order.userId !== userId) {
        throw new ForbiddenException('Accès non autorisé à ce paiement');
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new BadRequestException('Seuls les paiements confirmés peuvent être remboursés');
      }

      const amountToRefund = refundAmount ?? payment.amount;

      if (amountToRefund > payment.amount) {
        throw new BadRequestException('Le montant du remboursement ne peut pas dépasser le montant du paiement');
      }

      // Créer un paiement négatif pour le remboursement
      const refund = await prisma.payment.create({
        data: {
          amount: -amountToRefund,
          orderId: payment.orderId,
          status: PaymentStatus.REFUNDED,
          createdAt: new Date(),
        }
      });

      // Mettre à jour le statut du paiement original si remboursement total
      if (amountToRefund === payment.amount) {
        await prisma.payment.update({
          where: { id },
          data: { status: PaymentStatus.REFUNDED }
        });
      }

      this.logger.log(`Remboursement traité: ${refund.id} pour le paiement ${id}`);
      return refund;
    });
  }

  /**
   * Récupère les paiements par période
   * @param startDate Date de début
   * @param endDate Date de fin
   * @param userId ID de l'utilisateur (optionnel pour filtrage)
   * @param options Options de pagination
   * @returns Les paiements paginés
   */
  async getPaymentsByDateRange(
    startDate: Date, 
    endDate: Date, 
    userId?: string,
    options: PaginationOptions = {}
  ) {
    const { page = 1, limit = DEFAULT_PAGINATION_LIMIT } = options;
    const validatedLimit = Math.min(limit, MAX_PAGINATION_LIMIT);
    const skip = (page - 1) * validatedLimit;

    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      }
    };

    if (userId) {
      whereClause.order = {
        userId: userId
      };
    }

    try {
      const [payments, total] = await Promise.all([
        this.prisma.payment.findMany({
          where: whereClause,
          include: {
            order: {
              include: {
                user: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: validatedLimit,
        }),
        this.prisma.payment.count({ where: whereClause })
      ]);
      
      
      return {
        payments,
        pagination: {
          page,
          limit: validatedLimit,
          total,
          totalPages: Math.ceil(total / validatedLimit)
        }
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des paiements par date: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère les paiements par statut
   * @param status Statut des paiements
   * @param userId ID de l'utilisateur (optionnel pour filtrage)
   * @param options Options de pagination
   * @returns Les paiements paginés
   */
  async getPaymentsByStatus(
    status: PaymentStatus, 
    userId?: string,
    options: PaginationOptions = {}
  ) {
    const { page = 1, limit = DEFAULT_PAGINATION_LIMIT } = options;
    const validatedLimit = Math.min(limit, MAX_PAGINATION_LIMIT);
    const skip = (page - 1) * validatedLimit;

    const whereClause: any = { status };

    if (userId) {
      whereClause.order = {
        userId: userId
      };
    }

    try {
      const [payments, total] = await Promise.all([
        this.prisma.payment.findMany({
          where: whereClause,
          include: {
            order: {
              include: {
                user: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: validatedLimit,
        }),
        this.prisma.payment.count({ where: whereClause })
      ]);

      return {
        payments,
        pagination: {
          page,
          limit: validatedLimit,
          total,
          totalPages: Math.ceil(total / validatedLimit)
        }
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération des paiements par statut: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère les statistiques générales des paiements
   * @param userId ID de l'utilisateur (optionnel pour filtrage)
   * @returns Les statistiques des paiements
   */
  async getPaymentStatistics(userId?: string): Promise<PaymentStatistics> {
    const whereClause: any = {};

    if (userId) {
      whereClause.order = {
        userId: userId
      };
    }

    try {
      const payments = await this.prisma.payment.findMany({
        where: whereClause,
        select: {
          amount: true,
          status: true,
          createdAt: true
        }
      });

      const totalPayments = payments.length;

      // Calcul correct : COMPLETED positifs, REFUNDED négatifs
      const completedPayments = payments.filter(p => p.status === PaymentStatus.COMPLETED);
      const refundedPayments = payments.filter(p => p.status === PaymentStatus.REFUNDED);
      
      const totalCompleted = completedPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalRefunded = Math.abs(refundedPayments.reduce((sum, p) => sum + p.amount, 0));
      const totalAmount = totalCompleted - totalRefunded;

      const validPayments = completedPayments.length + refundedPayments.length;
      const averageAmount = validPayments > 0 ? totalAmount / validPayments : 0;

      const paymentsByStatus = Object.values(PaymentStatus).reduce((acc, status) => {
        acc[status] = payments.filter(p => p.status === status).length;
        return acc;
      }, {} as Record<PaymentStatus, number>);

      // Revenus du mois en cours
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyPayments = payments.filter(p => p.createdAt >= startOfMonth);
      const monthlyCompleted = monthlyPayments.filter(p => p.status === PaymentStatus.COMPLETED);
      const monthlyRefunded = monthlyPayments.filter(p => p.status === PaymentStatus.REFUNDED);
      
      const monthlyCompletedAmount = monthlyCompleted.reduce((sum, p) => sum + p.amount, 0);
      const monthlyRefundedAmount = Math.abs(monthlyRefunded.reduce((sum, p) => sum + p.amount, 0));
      const monthlyRevenue = monthlyCompletedAmount - monthlyRefundedAmount;

      return {
        totalPayments,
        totalAmount,
        averageAmount,
        paymentsByStatus,
        monthlyRevenue
      };
    } catch (error) {
      this.logger.error(`Erreur lors du calcul des statistiques: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère les statistiques détaillées d'un utilisateur spécifique
   * @param userId ID de l'utilisateur
   * @returns Les statistiques détaillées de l'utilisateur
   */
  async getUserPaymentStatistics(userId: string): Promise<UserPaymentStatistics> {
    try {
      // Récupérer les statistiques de base
      const baseStats = await this.getPaymentStatistics(userId);

      // Récupérer les données spécifiques à l'utilisateur
      const [orders, payments] = await Promise.all([
        this.prisma.order.findMany({
          where: { userId },
          select: { total: true }
        }),
        this.prisma.payment.findMany({
          where: {
            order: { userId }
          },
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' }
        })
      ]);

      const totalOrders = orders.length;
      const totalOrderValue = orders.reduce((sum, order) => sum + order.total, 0);
      const averageOrderValue = totalOrders > 0 ? totalOrderValue / totalOrders : 0;

      const firstPaymentDate = payments.length > 0 ? payments[0].createdAt : undefined;
      const lastPaymentDate = payments.length > 0 ? payments[payments.length - 1].createdAt : undefined;

      return {
        ...baseStats,
        userId,
        totalOrders,
        averageOrderValue,
        firstPayementDate: firstPaymentDate,
        lastPayementDate: lastPaymentDate
      };
    } catch (error) {
      this.logger.error(`Erreur lors du calcul des statistiques utilisateur ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère l'historique des paiements d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param options Options de pagination
   * @returns L'historique des paiements
   */
  async getPaymentHistory(userId: string, options: PaginationOptions = {}) {
    return this.getUserPaymentHistory(userId, options);
  }

  /**
   * Récupère l'historique des paiements d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param options Options de pagination
   * @returns L'historique des paiements
   */
  async getUserPaymentHistory(userId: string, options: PaginationOptions = {}) {
    const { page = 1, limit = DEFAULT_PAGINATION_LIMIT } = options;
    const validatedLimit = Math.min(limit, MAX_PAGINATION_LIMIT);
    const skip = (page - 1) * validatedLimit;

    try {
      const [orders, totalOrders] = await Promise.all([
        this.prisma.order.findMany({
          where: { userId },
          include: { 
            payments: {
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: validatedLimit,
        }),
        this.prisma.order.count({ where: { userId } })
      ]);

      const totalCommandes = orders.reduce((sum, order) => sum + order.total, 0);
      const totalPayé = orders
        .flatMap(order => order.payments)
        .filter(p => p.status === PaymentStatus.COMPLETED)
        .reduce((sum, p) => sum + p.amount, 0);
      const reste = totalCommandes - totalPayé;

      return {
        orders,
        summary: {
          totalCommandes,
          totalPayé,
          reste,
          estRemboursé: reste <= 0
        },
        pagination: {
          page,
          limit: validatedLimit,
          total: totalOrders,
          totalPages: Math.ceil(totalOrders / validatedLimit)
        }
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération de l'historique pour l'utilisateur ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
 * Récupère tous les utilisateurs avec leurs soldes
 * @param options Options de pagination
 * @returns Les utilisateurs avec leurs soldes
 */
async getAllUsersWithBalances(options: PaginationOptions = {}) {
  const { page = 1, limit = DEFAULT_PAGINATION_LIMIT } = options;
  const validatedLimit = Math.min(limit, MAX_PAGINATION_LIMIT);
  const skip = (page - 1) * validatedLimit;

  try {
    const [users, totalUsers] = await Promise.all([
      this.prisma.user.findMany({
        include: {
          orders: {
            include: {
              payments: true
            }
          }
        },
        skip,
        take: validatedLimit,
      }),
      this.prisma.user.count(),
    ]);

    const usersWithBalances = users.map(user => {
      const totalCommandes = user.orders.reduce((sum, order) => sum + order.total, 0);
      const totalPayé = user.orders
        .flatMap(order => order.payments)
        .filter(p => p.status === PaymentStatus.COMPLETED)
        .reduce((sum, p) => sum + p.amount, 0);
      const reste = totalCommandes - totalPayé;

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,        email: user.email,
        totalCommandes,
        totalPayé,
        reste,
        estRemboursé: reste <= 0,
      };
    });

    return {
      users: usersWithBalances,
      pagination: {
        page,
        limit: validatedLimit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / validatedLimit),
      },
    };
  } catch (error) {
    this.logger.error(`Erreur lors de la récupération des utilisateurs avec soldes: ${error.message}`);
    throw error;
  }
}

/**
 * Récupère un résumé des paiements de tous les utilisateurs
 * @returns Liste des utilisateurs avec le détail de leurs paiements
 */
async getAllUserPaymentsSummary(options: PaginationOptions = {}) {
  const { page = 1, limit = DEFAULT_PAGINATION_LIMIT } = options;
  const validatedLimit = Math.min(limit, MAX_PAGINATION_LIMIT);
  const skip = (page - 1) * validatedLimit;

  try {
    const [users, totalUsers] = await Promise.all([
      this.prisma.user.findMany({
        include: {
          orders: {
            include: {
              payments: true,
            },
          },
        },
        skip,
        take: validatedLimit,
      }),
      this.prisma.user.count(),
    ]);

    const summaries = users.map(user => {
      let totalOrders = 0;
      let totalPayé = 0;
      let totalReste = 0;

      const commandes = user.orders.map(order => {
        const total = order.total;
        const payé = order.payments
          .filter(p => p.status === PaymentStatus.COMPLETED)
          .reduce((sum, p) => sum + p.amount, 0);
        const totalReste = total - payé;
        const remboursement = totalReste < 0 ? Math.abs(totalReste) : 0;


        totalOrders += total;
        totalPayé += payé;

        return {
          id: order.id,
          totalOrders,
          totalPayé,
          totalReste,
          remboursement: totalReste < 0 ? Math.abs(totalReste) : 0
        };
      });

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        commandes,
        totalOrders,
        totalPayé,
        totalReste: totalOrders - totalPayé,
        remboursement: totalReste < 0 ? Math.abs(totalReste) : 0

      };
    });

    return {
      users: summaries,
      pagination: {
        page,
        limit: validatedLimit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / validatedLimit),
      },
    };
  } catch (error) {
    this.logger.error(`Erreur lors de la récupération du résumé des paiements: ${error.message}`);
    throw error;
  }
}

//  Payement avec PayDunya pour Mobile Money

async payWithMobileMoney(amount: number, phone: string, operator: string) {
    const response = await axios.post('https://app.paydunya.com/api/v1/checkout-invoice/create', {
      invoice: {
        total_amount: amount,
        description: 'Paiement e-commerce',
      },
      store: {
        name: 'Ma boutique',
      },
      actions: {
        cancel_url: 'https://mon-site.com/cancel',
        callback_url: 'https://mon-backend.com/payment/callback',
      },
      custom_data: {
        client_phone: phone,
        operator,
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': 'ta-master-key',
        'PAYDUNYA-PRIVATE-KEY': 'ta-private-key',
        'PAYDUNYA-TOKEN': 'ton-token',
        'PAYDUNYA-MODE': 'test',
      }
    });

    return response.data;
  }


}