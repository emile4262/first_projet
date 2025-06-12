import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, IsString, IsNumber, IsOptional } from 'class-validator';
export class CreateProductDto {
  [x: string]: any;
    @ApiProperty()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    description: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    price: number;
    

    @ApiProperty()
    @IsNotEmpty()
    categoryId: string;
    
   @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    stockInitial: number;

    @ApiProperty()
    @IsNotEmpty()
    userId: string;

    // @ApiProperty()
    // @IsNotEmpty()
    // imageUrl?: string;

   

}
