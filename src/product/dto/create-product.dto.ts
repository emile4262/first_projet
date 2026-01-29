import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

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
    @Type(() => Number)
    price: number;
    

    @ApiProperty()
    @IsNotEmpty()
    categoryId: string;
    
   @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    stockInitial: number;

    @ApiProperty()
    @IsOptional()
    @IsNotEmpty()
    userId: string;

    // @ApiProperty()
    // @IsNotEmpty()
    // imageUrl?: string;

   

}
