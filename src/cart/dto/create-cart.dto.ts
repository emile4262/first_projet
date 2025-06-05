import { IsString, IsInt, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCartDto {
  @ApiProperty({ description: 'ID du produit à ajouter au panier' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Quantité du produit' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'ID de l’utilisateur' })
  @IsNotEmpty()
  userId: string;
  
 
}

