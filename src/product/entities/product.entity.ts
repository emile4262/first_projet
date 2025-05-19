// import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
// import { OrderItem } from 'src/auth/order/entities/order.entity';

// @Entity()
// export class Product {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column()
//   name: string;

//   @Column('decimal', { precision: 10, scale: 2 })
//   price: number;

//   @Column({ nullable: true })
//   description: string;

//   @CreateDateColumn()
//   createdAt: Date;

//   @UpdateDateColumn()
//   updatedAt: Date;

//   @OneToMany(() => OrderItem, orderItem => orderItem.product)
//   orderItems: OrderItem[];
// }
