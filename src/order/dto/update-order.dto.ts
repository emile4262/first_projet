import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { OrderStatus } from '../order.service';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  [x: string]: any;
  // @ApiProperty({
  //   description: 'Le nouveau statut de la commande',
  //   enum: OrderStatus,
  //   example: OrderStatus.PENDING
  // })
  // @IsEnum(OrderStatus)
  // @IsNotEmpty()
  // status: OrderStatus;

  // @IsString()
  // @IsNotEmpty()
  // reason: string;

}
