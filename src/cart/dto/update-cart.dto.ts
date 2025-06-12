import { IsEnum, IsOptional, IsNumber } from 'class-validator';
import { CartStatus } from '@prisma/client';

export class UpdateCartDto {
  @IsOptional()
  @IsEnum(CartStatus)
  status?: CartStatus;

  @IsOptional()
  @IsNumber()
  total?: number;
}
