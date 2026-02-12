import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from "class-validator";

export class CreateOrderDto {
    @ApiProperty({ description: 'ID du produit à commander' })
    @IsNotEmpty()
    @IsUUID()
    productId: string;

    // @ApiProperty({ description: 'ID de l\'utilisateur passant la commande' })
    // @IsNotEmpty()
    // @IsUUID()
    // userId: string;

    @ApiProperty({ description: 'Quantité à commander', minimum: 1 })
    @IsNotEmpty()
    @IsInt()
    @Min(1)
    quantity: number;

    // @ApiProperty({ required: false })
    @IsOptional()
    is_available?: boolean;
}

