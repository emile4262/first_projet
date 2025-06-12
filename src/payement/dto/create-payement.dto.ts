import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsNumber, Min, IsOptional, IsEnum, IsDateString } from 'class-validator';

// Enum à importer ou à redéfinir selon ton fichier
 export enum PayementStatus {
  PENDING = 'PENDING',
  COMPLETED= 'COMPLETED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  CANCELLED = "CANCELLED",
 }

// DTO pour la création d'un paiement
 export class CreatePayementDto {
   @ApiProperty()          
  @IsUUID()
  @IsNotEmpty()
  orderId: string;
  
   @ApiProperty()  
  @IsNumber()
  @Min(0.01, { message: 'Le montant doit être supérieur à 0' })
  amount: number;
 }

// DTO pour la mise à jour d'un paiement
export class UpdatePayementDto {
  @ApiProperty()      
  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: 'Le montant doit être supérieur à 0' })
  amount?: number;

   @ApiProperty()  
  @IsOptional()
  @IsEnum(PayementStatus, {
    message: 'Statut de paiement invalide',
  })
  status?: PayementStatus;
}

// DTO pour filtrer les paiements (optionnel, utile pour les endpoints GET)
export class PaymentFilterDto {
   @ApiProperty()     
  @IsOptional()
  @IsEnum(PayementStatus)
  status?: PayementStatus;

   @ApiProperty()  
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty()   
  @IsOptional()
  @IsDateString()
  endDate?: string;

   @ApiProperty()  
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

   @ApiProperty()  
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
