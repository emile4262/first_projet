import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { CreatePaymentDto, PaymentMethod } from './dto/create-payement.dto';
import { PaymentStatus } from './dto/update-payement.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

//    création d'un payement
  async create(dto: CreatePaymentDto) {
    const payment = await this.prisma.payment.create({
      data: {
        amount: dto.amount,
        status: PaymentStatus.PENDING,
        orderId: dto.orderId,
      },
    });
    }

    //   appel au service de paiement externe
    async processPayment(payment: any, method: PaymentMethod) {
      try {
        const response = await axios.post('https://api.externalpayment.com/pay', {
            transaction_id: payment.id,
            amount: payment.amount,
            method: method,
        });
        return response.data;
      } catch (error) {
        throw new Error('Payment processing failed');
      }
    }

    // // gestion des webhooks
    // async handleWebhook(transactionId: string, status: string) {
    //   const payment = await this.prisma.payment.findUnique({
    //     where: { id: transactionId },
    //   });
    //   if (!payment) {
    //     throw new NotFoundException('Payment not found');
    //   }
    //     await this.prisma.payment.update({
    //     where: { id: transactionId },
    //     data: { status: status }
    //      });
    // }
    // récupération des payements par commande
    async findByOrder(orderId: number) {
      return this.prisma.payment.findMany({
        where: { orderId: orderId.toString() },
      });
    }

    // récupération du solde d'une commande
    async getOrderBalance(orderId: number) {
      const payments = await this.prisma.payment.findMany({
        where: { orderId: orderId.toString(), status: PaymentStatus.COMPLETED },
      });
      return payments.reduce((sum, payment) => sum + payment.amount, 0);
    }

      
     }
