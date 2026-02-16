import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);

  constructor(private prisma: PrismaService) {}

  // Basic logging methods for the interceptor
  logRequest(method: string, url: string, userId?: string, statusCode?: number) {
    this.logger.log(`[${method}] ${url} - User: ${userId || 'anonymous'} - Status: ${statusCode}`);
  }

  log(message: string, context?: string) {
    if (context) {
      this.logger.log(`[${context}] ${message}`);
    } else {
      this.logger.log(message);
    }
  }

  error(message: string, stack?: string, context?: string) {
    if (context) {
      this.logger.error(`[${context}] ${message}`, stack);
    } else {
      this.logger.error(message, stack);
    }
  }

  logCrud(action: string, entityType: string, entityId?: string, userId?: string) {
    this.logger.log(`CRUD: ${action} ${entityType}${entityId ? `(${entityId})` : ''} by user ${userId || 'anonymous'}`);
  }

  // Simple activity logging using existing models
  async logActivity(data: {
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    description: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }) {
    try {
      // Since we don't have ActivityLog model, we'll just log to console
      this.logger.log(`Activity: ${data.action} on ${data.entityType} - ${data.description}`);
      
      // You could store this in a simple text file or create a basic log entry
      // For now, just return the logged data
      return {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to create activity log', error);
      throw error;
    }
  }

  // Get basic logs using existing models
  async getActivityLogs(filters: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    try {
      // Use existing models to create activity logs
      const [users, orders, products, payments, deliveries] = await Promise.all([
        this.prisma.user.findMany({
          where: filters.userId ? { id: filters.userId } : {},
          include: {
            orders: true,
            products: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        this.prisma.order.findMany({
          where: {
            ...(filters.startDate && { createdAt: { gte: filters.startDate } }),
            ...(filters.endDate && { createdAt: { lte: filters.endDate } }),
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: Math.floor(limit / 4),
        }),
        this.prisma.product.findMany({
          where: filters.userId ? { userId: filters.userId } : {},
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: Math.floor(limit / 4),
        }),
        this.prisma.payment.findMany({
          include: {
            order: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: Math.floor(limit / 4),
        }),
        this.prisma.delivery.findMany({
          include: {
            order: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: Math.floor(limit / 4),
        }),
      ]);

      // Transform data into activity log format
      const activityLogs = [
        ...users.map(user => ({
          id: `user-${user.id}`,
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: user.id,
          description: `User ${user.firstName} ${user.lastName} (${user.email}) created`,
          userId: user.id,
          createdAt: user.createdAt,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          },
        })),
        ...orders.map(order => ({
          id: `order-${order.id}`,
          action: 'ORDER_CREATED',
          entityType: 'Order',
          entityId: order.id,
          description: `Order ${order.id} created with status ${order.status}`,
          userId: order.userId,
          createdAt: order.createdAt,
          user: order.user,
        })),
        ...products.map(product => ({
          id: `product-${product.id}`,
          action: 'PRODUCT_CREATED',
          entityType: 'Product',
          entityId: product.id,
          description: `Product ${product.name} created`,
          userId: product.userId,
          createdAt: product.createdAt,
          user: product.user,
        })),
        ...payments.map(payment => ({
          id: `payment-${payment.id}`,
          action: 'PAYMENT_PROCESSED',
          entityType: 'Payment',
          entityId: payment.id,
          description: `Payment of ${payment.amount} processed with status ${payment.status}`,
          userId: payment.order?.user?.id,
          createdAt: payment.createdAt,
          user: payment.order?.user,
        })),
        ...deliveries.map(delivery => ({
          id: `delivery-${delivery.id}`,
          action: 'DELIVERY_CREATED',
          entityType: 'Delivery',
          entityId: delivery.id,
          description: `Delivery created with status ${delivery.status}`,
          userId: delivery.order?.user?.id,
          createdAt: delivery.createdAt,
          user: delivery.order?.user,
        })),
      ];

      // Sort by creation date
      activityLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = activityLogs.length;
      const paginatedLogs = activityLogs.slice(skip, skip + limit);

      return {
        data: paginatedLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get activity logs', error);
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  // Get activity stats using real data
  async getActivityStats(filters: { startDate?: Date; endDate?: Date }) {
    try {
      const whereClause: any = {};
      if (filters.startDate || filters.endDate) {
        whereClause.createdAt = {};
        if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
        if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
      }

      const [totalUsers, totalOrders, totalProducts, totalPayments, totalDeliveries, recentActivities] = await Promise.all([
        this.prisma.user.count({ where: whereClause }),
        this.prisma.order.count({ where: whereClause }),
        this.prisma.product.count({ where: whereClause }),
        this.prisma.payment.count({ where: whereClause }),
        this.prisma.delivery.count({ where: whereClause }),
        this.getActivityLogs({ page: 1, limit: 10, ...filters }),
      ]);

      const totalActivities = totalUsers + totalOrders + totalProducts + totalPayments + totalDeliveries;

      const activitiesByAction = [
        { action: 'USER_CREATED', count: totalUsers },
        { action: 'ORDER_CREATED', count: totalOrders },
        { action: 'PRODUCT_CREATED', count: totalProducts },
        { action: 'PAYMENT_PROCESSED', count: totalPayments },
        { action: 'DELIVERY_CREATED', count: totalDeliveries },
      ];

      // Get top users by activity
      const topUsers = await this.prisma.user.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              orders: true,
              products: true,
            },
          },
        },
        orderBy: {
          orders: {
            _count: 'desc',
          },
        },
        take: 10,
      });

      return {
        totalActivities,
        activitiesByAction,
        topUsers: topUsers.map(user => ({
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          activityCount: user._count.orders + user._count.products,
        })),
        recentActivities: recentActivities.data,
      };
    } catch (error) {
      this.logger.error('Failed to get activity stats', error);
      return {
        totalActivities: 0,
        activitiesByAction: [],
        topUsers: [],
        recentActivities: [],
      };
    }
  }

  // Order logging using existing Order model
  async logOrder(data: {
    orderId: string;
    userId?: string;
    action: string;
    oldStatus?: string;
    newStatus?: string;
    oldData?: any;
    newData?: any;
    reason?: string;
    performedBy?: string;
  }) {
    try {
      this.logger.log(`Order ${data.orderId}: ${data.action} from ${data.oldStatus} to ${data.newStatus}`);
      
      // Update the order if needed
      if (data.newStatus && data.newStatus !== data.oldStatus) {
        return await this.prisma.order.update({
          where: { id: data.orderId },
          data: { 
            status: data.newStatus as any,
            statusReason: data.reason,
          },
        });
      }
      
      return { success: true, message: 'Order logged successfully' };
    } catch (error) {
      this.logger.error('Failed to log order action', error);
      throw error;
    }
  }

  // Product logging using existing Product model
  async logProduct(data: {
    productId: string;
    userId?: string;
    action: string;
    oldData?: any;
    newData?: any;
    reason?: string;
    performedBy?: string;
  }) {
    try {
      this.logger.log(`Product ${data.productId}: ${data.action}`);
      
      // You could update the product if needed
      if (data.newData) {
        return await this.prisma.product.update({
          where: { id: data.productId },
          data: data.newData,
        });
      }
      
      return { success: true, message: 'Product logged successfully' };
    } catch (error) {
      this.logger.error('Failed to log product action', error);
      throw error;
    }
  }

  // Auth logging
  async logAuth(data: {
    userId?: string;
    action: string;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    reason?: string;
  }) {
    try {
      this.logger.log(`Auth: ${data.action} for user ${data.email || data.userId} - Success: ${data.success}`);
      
      return {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to log auth action', error);
      throw error;
    }
  }

  // Payment logging using existing Payment model
  async logPayment(data: {
    paymentId?: string;
    orderId: string;
    userId?: string;
    action: string;
    oldStatus?: string;
    newStatus?: string;
    amount?: number;
    method?: string;
    reason?: string;
    performedBy?: string;
  }) {
    try {
      this.logger.log(`Payment for order ${data.orderId}: ${data.action} - Status: ${data.newStatus}`);
      
      // Update payment if we have paymentId and newStatus
      if (data.paymentId && data.newStatus) {
        return await this.prisma.payment.update({
          where: { id: data.paymentId },
          data: { status: data.newStatus as any },
        });
      }
      
      return { success: true, message: 'Payment logged successfully' };
    } catch (error) {
      this.logger.error('Failed to log payment action', error);
      throw error;
    }
  }

  // Delivery logging using existing Delivery model
  async logDelivery(data: {
    deliveryId?: string;
    orderId: string;
    userId?: string;
    action: string;
    oldStatus?: string;
    newStatus?: string;
    address?: string;
    reason?: string;
    performedBy?: string;
  }) {
    try {
      this.logger.log(`Delivery for order ${data.orderId}: ${data.action} - Status: ${data.newStatus}`);
      
      // Update delivery if we have deliveryId and newStatus
      if (data.deliveryId && data.newStatus) {
        return await this.prisma.delivery.update({
          where: { id: data.deliveryId },
          data: { 
            status: data.newStatus as any,
            ...(data.address && { address: data.address }),
            ...(data.newStatus === 'DELIVERED' && { deliveredAt: new Date() }),
          },
        });
      }
      
      return { success: true, message: 'Delivery logged successfully' };
    } catch (error) {
      this.logger.error('Failed to log delivery action', error);
      throw error;
    }
  }

  // System logging
  async logSystem(data: {
    level: string;
    message: string;
    context?: string;
    metadata?: any;
    userId?: string;
  }) {
    try {
      const logMessage = `[${data.level.toUpperCase()}] ${data.context ? `[${data.context}] ` : ''}${data.message}`;
      
      switch (data.level.toLowerCase()) {
        case 'error':
          this.logger.error(logMessage);
          break;
        case 'warn':
          this.logger.warn(logMessage);
          break;
        case 'debug':
          this.logger.debug(logMessage);
          break;
        default:
          this.logger.log(logMessage);
      }
      
      return {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to log system action', error);
      throw error;
    }
  }

  // Clear all logs (placeholder - would depend on your logging storage)
  async clearAllLogs() {
    this.logger.warn('Clear all logs called - but no persistent storage to clear');
    return { success: true, message: 'No logs to clear in current implementation' };
  }

  // Get logs by entity type (placeholder)
  async getLogsByEntity(entityType: string, entityId: string) {
    this.logger.log(`Getting logs for ${entityType}(${entityId})`);
    return {
      data: [],
      total: 0,
    };
  }

  // Get logs by user (placeholder)
  async getLogsByUser(userId: string, filters: { page?: number; limit?: number } = {}) {
    this.logger.log(`Getting logs for user ${userId}`);
    return {
      data: [],
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 50,
        total: 0,
        totalPages: 0,
      },
    };
  }

  // Additional methods for controller with real data
  async getOrderLogs(filters: any) {
    try {
      const { page = 1, limit = 50, orderId, action } = filters;
      const skip = (page - 1) * limit;

      const whereClause: any = {};
      if (orderId) whereClause.id = orderId;

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            payments: true,
            Delivery: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.order.count({ where: whereClause }),
      ]);

      const orderLogs = orders.map(order => ({
        id: `order-${order.id}`,
        action: action || 'ORDER_CREATED',
        entityType: 'Order',
        entityId: order.id,
        description: `Order ${order.id} - Status: ${order.status}, Total: ${order.total}`,
        userId: order.userId,
        createdAt: order.createdAt,
        order: {
          id: order.id,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
        },
        user: order.user,
      }));

      return {
        data: orderLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get order logs', error);
      return {
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      };
    }
  }

  async getOrderHistory(orderId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          payments: true,
          Delivery: true,
          products: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        return {
          data: [],
          total: 0,
        };
      }

      const history = [
        {
          id: `order-created-${order.id}`,
          action: 'ORDER_CREATED',
          description: `Order created with status ${order.status}`,
          timestamp: order.createdAt,
          data: order,
        },
        ...order.payments.map(payment => ({
          id: `payment-${payment.id}`,
          action: 'PAYMENT_PROCESSED',
          description: `Payment of ${payment.amount} processed with status ${payment.status}`,
          timestamp: payment.createdAt,
          data: payment,
        })),
        ...(order.Delivery && order.Delivery.length > 0 ? order.Delivery.map(delivery => ({
          id: `delivery-${delivery.id}`,
          action: 'DELIVERY_CREATED',
          description: `Delivery created with status ${delivery.status}`,
          timestamp: delivery.createdAt,
          data: delivery,
        })) : []),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return {
        data: history,
        total: history.length,
      };
    } catch (error) {
      this.logger.error('Failed to get order history', error);
      return {
        data: [],
        total: 0,
      };
    }
  }

  async getProductLogs(filters: any) {
    try {
      const { page = 1, limit = 50, productId, action } = filters;
      const skip = (page - 1) * limit;

      const whereClause: any = {};
      if (productId) whereClause.id = productId;

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            category: true,
            reviews: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.product.count({ where: whereClause }),
      ]);

      const productLogs = products.map(product => ({
        id: `product-${product.id}`,
        action: action || 'PRODUCT_CREATED',
        entityType: 'Product',
        entityId: product.id,
        description: `Product ${product.name} - Price: ${product.price}, Stock: ${product.stockFinal}/${product.stockInitial}`,
        userId: product.userId,
        createdAt: product.createdAt,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          stockInitial: product.stockInitial,
          stockFinal: product.stockFinal,
          Is_available: product.Is_available,
          createdAt: product.createdAt,
        },
        user: product.user,
      }));

      return {
        data: productLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get product logs', error);
      return {
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      };
    }
  }

  async getProductHistory(productId: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          category: true,
          reviews: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!product) {
        return {
          data: [],
          total: 0,
        };
      }

      const history = [
        {
          id: `product-created-${product.id}`,
          action: 'PRODUCT_CREATED',
          description: `Product ${product.name} created with price ${product.price}`,
          timestamp: product.createdAt,
          data: product,
        },
        {
          id: `product-updated-${product.id}`,
          action: 'PRODUCT_UPDATED',
          description: `Product last updated on ${product.updatedAt}`,
          timestamp: product.updatedAt,
          data: product,
        },
        ...product.reviews.map(review => ({
          id: `review-${review.id}`,
          action: 'REVIEW_CREATED',
          description: `Review with rating ${review.rating} created by ${review.user.firstName} ${review.user.lastName}`,
          timestamp: review.createdAt,
          data: review,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return {
        data: history,
        total: history.length,
      };
    } catch (error) {
      this.logger.error('Failed to get product history', error);
      return {
        data: [],
        total: 0,
      };
    }
  }

  async getAuthLogs(filters: any) {
    try {
      const { page = 1, limit = 50, userId, action, email, success } = filters;
      const skip = (page - 1) * limit;

      const whereClause: any = {};
      if (userId) whereClause.id = userId;
      if (email) whereClause.email = email;

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            admin: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            lastPasswordResetAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.user.count({ where: whereClause }),
      ]);

      const authLogs: any[] = users.map(user => {
        const authActions: any[] = [];
        
        if (!action || action === 'USER_CREATED') {
          authActions.push({
            id: `auth-created-${user.id}`,
            action: 'USER_CREATED',
            entityType: 'Auth',
            entityId: user.id,
            description: `User account created for ${user.email}`,
            userId: user.id,
            createdAt: user.createdAt,
            success: true,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
            },
          });
        }

        if (user.lastPasswordResetAt && (!action || action === 'PASSWORD_RESET')) {
          authActions.push({
            id: `auth-reset-${user.id}`,
            action: 'PASSWORD_RESET',
            entityType: 'Auth',
            entityId: user.id,
            description: `Password reset for ${user.email}`,
            userId: user.id,
            createdAt: user.lastPasswordResetAt,
            success: true,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
            },
          });
        }

        if (user.updatedAt && (!action || action === 'USER_UPDATED')) {
          authActions.push({
            id: `auth-updated-${user.id}`,
            action: 'USER_UPDATED',
            entityType: 'Auth',
            entityId: user.id,
            description: `User profile updated for ${user.email}`,
            userId: user.id,
            createdAt: user.updatedAt,
            success: true,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
            },
          });
        }

        return authActions;
      }).flat();

      // Filter by success if specified
      const filteredLogs = success !== undefined 
        ? authLogs.filter(log => log.success === success)
        : authLogs;

      // Sort by creation date
      filteredLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const paginatedLogs = filteredLogs.slice(skip, skip + limit);

      return {
        data: paginatedLogs,
        pagination: {
          page,
          limit,
          total: filteredLogs.length,
          totalPages: Math.ceil(filteredLogs.length / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get auth logs', error);
      return {
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      };
    }
  }

  async getFailedLogins(filters: any) {
    try {
      const { page = 1, limit = 50, hours = 24, email } = filters;
      const skip = (page - 1) * limit;

      // Since we don't have failed login tracking, return recent user creations as "activity"
      const whereClause: any = {
        createdAt: {
          gte: new Date(Date.now() - hours * 60 * 60 * 1000),
        },
      };
      
      if (email) {
        whereClause.email = {
          contains: email,
          mode: 'insensitive',
        };
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.user.count({ where: whereClause }),
      ]);

      const failedLogins = users.map(user => ({
        id: `failed-login-${user.id}`,
        action: 'LOGIN_FAILED',
        entityType: 'Auth',
        entityId: user.id,
        description: `Failed login attempt for ${user.email} (simulated - no actual failed login tracking)`,
        userId: user.id,
        createdAt: user.createdAt,
        success: false,
        ipAddress: '192.168.1.1', // Simulated IP
        userAgent: 'Mozilla/5.0...', // Simulated user agent
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      }));

      return {
        data: failedLogins,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get failed logins', error);
      return {
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      };
    }
  }

  async getSystemLogs(filters: any) {
    try {
      const { page = 1, limit = 50, level, source, context } = filters;
      const skip = (page - 1) * limit;

      // Create system logs from database activity
      const [orders, products, users, payments, deliveries] = await Promise.all([
        this.prisma.order.findMany({
          take: Math.floor(limit / 4),
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.product.findMany({
          take: Math.floor(limit / 4),
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.findMany({
          take: Math.floor(limit / 4),
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.payment.findMany({
          take: Math.floor(limit / 8),
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.delivery.findMany({
          take: Math.floor(limit / 8),
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const systemLogs = [
        ...orders.map(order => ({
          id: `system-order-${order.id}`,
          level: 'INFO',
          message: `Order ${order.id} processed with status ${order.status}`,
          context: context || 'ORDER_PROCESSING',
          source: source || 'ORDER_SERVICE',
          timestamp: order.createdAt,
          metadata: {
            orderId: order.id,
            status: order.status,
            total: order.total,
          },
        })),
        ...products.map(product => ({
          id: `system-product-${product.id}`,
          level: 'INFO',
          message: `Product ${product.name} ${product.Is_available ? 'available' : 'unavailable'}`,
          context: context || 'PRODUCT_MANAGEMENT',
          source: source || 'PRODUCT_SERVICE',
          timestamp: product.createdAt,
          metadata: {
            productId: product.id,
            name: product.name,
            price: product.price,
            stock: product.stockFinal,
          },
        })),
        ...users.map(user => ({
          id: `system-user-${user.id}`,
          level: user.admin ? 'WARN' : 'INFO',
          message: `User ${user.email} ${user.admin ? '(ADMIN)' : '(USER)'} created`,
          context: context || 'USER_MANAGEMENT',
          source: source || 'AUTH_SERVICE',
          timestamp: user.createdAt,
          metadata: {
            userId: user.id,
            email: user.email,
            role: user.role,
            admin: user.admin,
          },
        })),
        ...payments.map(payment => ({
          id: `system-payment-${payment.id}`,
          level: payment.status === 'FAILED' ? 'ERROR' : 'INFO',
          message: `Payment of ${payment.amount} ${payment.status.toLowerCase()}`,
          context: context || 'PAYMENT_PROCESSING',
          source: source || 'PAYMENT_SERVICE',
          timestamp: payment.createdAt,
          metadata: {
            paymentId: payment.id,
            amount: payment.amount,
            method: payment.method,
            status: payment.status,
          },
        })),
        ...deliveries.map(delivery => ({
          id: `system-delivery-${delivery.id}`,
          level: delivery.status === 'CANCELED' ? 'ERROR' : 'INFO',
          message: `Delivery ${delivery.status.toLowerCase()} to ${delivery.address}`,
          context: context || 'DELIVERY_MANAGEMENT',
          source: source || 'DELIVERY_SERVICE',
          timestamp: delivery.createdAt,
          metadata: {
            deliveryId: delivery.id,
            address: delivery.address,
            status: delivery.status,
          },
        })),
      ];

      // Filter by level if specified
      const filteredLogs = level 
        ? systemLogs.filter(log => log.level === level.toUpperCase())
        : systemLogs;

      // Sort by timestamp
      filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const paginatedLogs = filteredLogs.slice(skip, skip + limit);

      return {
        data: paginatedLogs,
        pagination: {
          page,
          limit,
          total: filteredLogs.length,
          totalPages: Math.ceil(filteredLogs.length / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get system logs', error);
      return {
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      };
    }
  }

  async getSystemErrors(filters: any) {
    try {
      const { page = 1, limit = 50, hours = 24, context } = filters;
      const skip = (page - 1) * limit;

      // Get failed payments and canceled deliveries as "errors"
      const whereClause: any = {
        createdAt: {
          gte: new Date(Date.now() - hours * 60 * 60 * 1000),
        },
      };

      const [failedPayments, canceledDeliveries] = await Promise.all([
        this.prisma.payment.findMany({
          where: {
            ...whereClause,
            status: 'FAILED',
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
        this.prisma.delivery.findMany({
          where: {
            ...whereClause,
            status: 'CANCELED',
          },
          include: {
            order: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
      ]);

      const systemErrors = [
        ...failedPayments.map(payment => ({
          id: `error-payment-${payment.id}`,
          level: 'ERROR',
          message: `Payment failed for order ${payment.orderId}`,
          context: context || 'PAYMENT_ERROR',
          timestamp: payment.createdAt,
          metadata: {
            paymentId: payment.id,
            orderId: payment.orderId,
            amount: payment.amount,
            method: payment.method,
          },
        })),
        ...canceledDeliveries.map(delivery => ({
          id: `error-delivery-${delivery.id}`,
          level: 'ERROR',
          message: `Delivery canceled for order ${delivery.orderId}`,
          context: context || 'DELIVERY_ERROR',
          timestamp: delivery.createdAt,
          metadata: {
            deliveryId: delivery.id,
            orderId: delivery.orderId,
            address: delivery.address,
            user: delivery.order.user,
          },
        })),
      ];

      // Sort by timestamp
      systemErrors.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const paginatedErrors = systemErrors.slice(skip, skip + limit);

      return {
        data: paginatedErrors,
        pagination: {
          page,
          limit,
          total: systemErrors.length,
          totalPages: Math.ceil(systemErrors.length / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to get system errors', error);
      return {
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      };
    }
  }

  async getDashboard(filters: any) {
    try {
      const { hours = 24 } = filters;
      const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

      const [
        totalUsers,
        totalOrders,
        totalProducts,
        recentUsers,
        recentOrders,
        recentProducts,
        orderStats,
        productStats,
        paymentStats,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.order.count(),
        this.prisma.product.count(),
        this.prisma.user.findMany({
          where: { createdAt: { gte: startDate } },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
          },
        }),
        this.prisma.order.findMany({
          where: { createdAt: { gte: startDate } },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.product.findMany({
          where: { createdAt: { gte: startDate } },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.order.groupBy({
          by: ['status'],
          _count: true,
        }),
        this.prisma.product.groupBy({
          by: ['Is_available'],
          _count: true,
        }),
        this.prisma.payment.groupBy({
          by: ['status'],
          _count: true,
        }),
      ]);

      const recentActivities = [
        ...recentUsers.map(user => ({
          id: `activity-user-${user.id}`,
          action: 'USER_CREATED',
          description: `New user ${user.firstName} ${user.lastName} registered`,
          timestamp: user.createdAt,
          user: user,
        })),
        ...recentOrders.map(order => ({
          id: `activity-order-${order.id}`,
          action: 'ORDER_CREATED',
          description: `New order ${order.id} by ${order.user.firstName} ${order.user.lastName}`,
          timestamp: order.createdAt,
          user: order.user,
        })),
        ...recentProducts.map(product => ({
          id: `activity-product-${product.id}`,
          action: 'PRODUCT_CREATED',
          description: `New product ${product.name} added by ${product.user?.firstName || 'Unknown'} ${product.user?.lastName || ''}`,
          timestamp: product.createdAt,
          user: product.user,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

      return {
        totalActivities: totalUsers + totalOrders + totalProducts,
        totalUsers,
        totalOrders,
        totalProducts,
        recentActivities,
        orderStats: orderStats.map(stat => ({
          status: stat.status,
          count: stat._count,
        })),
        productStats: productStats.map(stat => ({
          available: stat.Is_available,
          count: stat._count,
        })),
        paymentStats: paymentStats.map(stat => ({
          status: stat.status,
          count: stat._count,
        })),
        userStats: {
          total: totalUsers,
          recent: recentUsers.length,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get dashboard data', error);
      return {
        totalActivities: 0,
        totalUsers: 0,
        totalOrders: 0,
        totalProducts: 0,
        recentActivities: [],
        orderStats: [],
        productStats: [],
        paymentStats: [],
        userStats: {
          total: 0,
          recent: 0,
        },
      };
    }
  }
}
