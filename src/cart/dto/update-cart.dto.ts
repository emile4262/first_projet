import { IsEnum, IsOptional, IsNumber } from 'class-validator';
export enum CartStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export class UpdateCartDto {
  @IsOptional()
  @IsEnum(CartStatus)
  status?: CartStatus;

  @IsOptional()
  @IsNumber()
  total?: number;
}