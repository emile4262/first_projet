// import { Injectable, NotFoundException } from '@nestjs/common';
// import axios from 'axios';
// import { CreatePaymentDto, PaymentMethod } from './dto/create-payement.dto';
// import { PaymentStatus } from './dto/update-payement.dto';
// import { PrismaService } from 'src/prisma.service';

// @Injectable()
// export class PaymentsService {
//   constructor(private prisma: PrismaService) {}

//   async create(dto: CreatePaymentDto) {
//     // Vérifier que la vente existe
//     const order = await this.prisma.order.findUnique({
//       where: { id: dto.orderId },
//       include: { payments: true },
//     });
//     if (!order) throw new NotFoundException('order not found');

//     // CAS 1 : Paiement cash -> succès immédiat
//     if (dto.method === PaymentMethod.CASH) {
//       return this.prisma.payment.create({
//         data: {
//           orderId: dto.orderId,
//           amount: dto.amount,
//           method: dto.method,
//           status: PaymentStatus.SUCCESS,
//         },
//       });
//     }

//     // CAS 2 : Paiement Mobile Money via CinetPay
//     const transactionId = `sale-${dto.orderId}-${Date.now()}`;

//     const response = await axios.post('https://api-checkout.cinetpay.com/v2/payment', {
//       apikey: process.env.CINETPAY_API_KEY,
//       site_id: process.env.CINETPAY_SITE_ID,
//       transaction_id: transactionId,
//       amount: dto.amount,
//       currency: 'XOF',
//       description: `Paiement de la vente ${dto.orderId}`,
//       return_url: process.env.CINETPAY_RETURN_URL,
//       notify_url: process.env.CINETPAY_NOTIFY_URL,
//     });

//     // Créer un paiement en attente
//     return this.prisma.payment.create({
//       data: {
//         orderId: dto.orderId,
//         amount: dto.amount,
//         method: dto.method,
//         status: PaymentStatus.PENDING,
//       },
//     });
//   }

//   // Callback CinetPay pour confirmer le paiement
//   async handleWebhook(transactionId: string, status: string) {
//     const payment = await this.prisma.payment.findFirst({
//       where: { },
//       orderBy: { createdAt: 'desc' }, // dernier paiement
//     });

//     if (!payment) throw new NotFoundException('Payment not found');

//     return this.prisma.payment.update({
//       where: { id: payment.id },
//       data: {
//         status: status === 'ACCEPTED' ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
//       },
//     });
//   }

//   // Récupérer les paiements d'une vente
//   async findByOrder(orderId: number) {
//     return this.prisma.payment.findMany({ where: { orderId } });
//   }

//   // Calculer le solde restant
//   async getOrderBalance(orderId: number) {
//     const order = await this.prisma.order.findUnique({
//       where: { id: orderId },
//       include: { payments: true },
//     });
//     if (!order) throw new NotFoundException('order not found');

//     const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
//     return {
//       totalAmount: order.totalAmount,
//       totalPaid,
//       balance: order.totalAmount - totalPaid,
//     };
//   }
// }
