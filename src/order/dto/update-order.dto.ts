import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { OrderStatus } from '../order.service';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({ description: 'Le nouveau statut de la commande', enum: OrderStatus })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;

  @ApiProperty({ description: 'Raison du rejet', required: false })
  @ValidateIf((o) => o.status === OrderStatus.REJECTED)
  @IsString()
  @IsNotEmpty()
  reason?: string;
}

export class RejectOrderDto {
  @ApiProperty({ description: 'Raison du rejet' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
