// dto/create-cart.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber, Min, IsArray  } from 'class-validator';
import { CartStatus } from '@prisma/client';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCartDto {

  @ApiProperty()    
  @IsNotEmpty()
  @IsString()
  userId: string;

  
 @ApiProperty()
  @IsOptional()
  @IsArray()
  productIds?: number[];

// //   @ApiProperty() 
// //   @IsOptional()
// //   @IsEnum(CartStatus)
// //   status?: CartStatus = CartStatus.ACTIVE;

//   @ApiProperty() 
//   @IsOptional()
//   @IsNumber()
//   total?: number = 0;
//   status: string;
 }

// // dto/update-cart.dto.ts

// export class UpdateCartDto extends PartialType(CreateCartDto) {

//   @ApiProperty()   
//   @IsOptional()
//   @IsEnum(CartStatus)
//   status?: CartStatus;

//   @ApiProperty() 
//   @IsOptional()
//   @IsNumber()
//   total?: number;
// }

// // dto/change-cart-status.dto.ts


// // export class CartStatusDto {


// //   @ApiProperty()   
// //   @IsNotEmpty()
// //   @IsEnum(CartStatus)
// //   status: CartStatus;
// // }

// // dto/update-cart-total.dto.ts

// // export class UpdateCartTotalDto {

// //   @ApiProperty()   
// //   @IsNotEmpty()
// //   @IsNumber()
// //   @Min(0)
// //   total: number;
// // }

// // dto/cart-query.dto.ts

// export class CartDto {


//   @ApiProperty()   
//   @IsOptional()
//   @IsEnum(CartStatus)
//   status?: CartStatus;


//   @ApiProperty() 
//   @IsOptional()
//   @IsString()
//   userId?: string;


//   @ApiProperty() 
//   @IsOptional()
//   @Transform(({ value }) => parseInt(value))
//   @IsNumber()
//   @Min(1)
//   page?: number = 1;


//   @ApiProperty() 
//   @IsOptional()
//   @Transform(({ value }) => parseInt(value))
//   @IsNumber()
//   @Min(1)
//   limit?: number = 10;
// }

// // dto/delete-abandoned-carts.dto.ts


// // export class CartsDto {

// //   @ApiProperty()    
// //   @IsOptional()
// //   @Transform(({ value }) => parseInt(value))
// //   @IsNumber()
// //   @Min(1)
// //   daysOld?: number = 30;
// // }