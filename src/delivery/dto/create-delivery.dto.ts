// create-delivery.dto.ts
import { IsString, IsOptional, IsDateString, IsEnum, IsNotEmpty, Matches } from 'class-validator';
import { DeliveryStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeliveryDto {
  @ApiProperty()  
  @IsString()
  orderId: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  deliveredAt?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  method?: string; 

  @ApiProperty()
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;
}
// export class FindByDateDto {
//   @ApiProperty()   
//   @IsNotEmpty({ message: 'La date est requise' })
//   @Matches(/^\d{4}-\d{2}-\d{2}$/, {
//     message: 'Le format de la date doit être YYYY-MM-DD',
//   })
//   date: string;
// }
  