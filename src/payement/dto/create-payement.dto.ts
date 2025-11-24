import { IsEnum, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export enum PaymentStatus {
  CASH = 'CASH',
  WAVE = 'WAVE',
  ORANGE = 'ORANGE',
  MTN = 'MTN',
  MOOV = 'MOOV',
}

export enum PaymentMethod {
  CASH = 'CASH',
  WAVE = 'WAVE',
  ORANGE = 'ORANGE',
  MTN = 'MTN',
  MOOV = 'MOOV',
}

export class CreatePaymentDto {
  @IsNumber()
  @IsPositive()
  orderId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}
