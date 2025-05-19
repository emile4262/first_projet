// import { Injectable } from '@nestjs/common';
// import { CreateCartDto } from './dto/create-cart.dto';
// // import { UpdateCartDto } from './dto/update-cart.dto';
// import { PrismaService } from 'src/prisma.service';
// import { promises } from 'dns';
// import { Cart } from '@prisma/client';

// @Injectable()
// export class CartService {
//   constructor(private readonly prisma: PrismaService){}
//   // créer un pannier 
//   async create(data: CreateCartDto) {
//     await this.prisma.cart.findUnique({
//       where: { id: data.cartId},

//     });
// const items = await this.prisma.cart.create({
//   data: {
  
//     createdAt: data.createdAt,
//     updatedAt: data.updatedAt, 
//      },
// });

// return items;


// //   findAll() {
// //     return `This action returns all cart`;
// //   }

// //   findOne(id: number) {
// //     return `This action returns a #${id} cart`;
// //   }

// //   update(id: number, updateCartDto: UpdateCartDto) {
// //     return `This action updates a #${id} cart`;
// //   }

// //   remove(id: number) {
// //     return `This action removes a #${id} cart`;
 
//  }
// }