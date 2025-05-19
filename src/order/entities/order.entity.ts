export class order {}
export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// export class Request {
//   id: number;
//   title: string;
//   description: string;
//   status: RequestStatus;
// }

// src/order/order-item.entity.ts
// import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
// ;import { Order } from '@prisma/client';
// import { product } from '@prisma/client';
// import { ProductController } from 'src/product/product.controller';
// import { OrderController } from '../order.controller';
// @Entity()
// export class OrderItem {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column()
//   quantity: number;

//   @ManyToOne(() => ProductController)
//   product: product;

//   @ManyToOne(() =>OrderController)
//   order: Order;
// }
// export { Order };

