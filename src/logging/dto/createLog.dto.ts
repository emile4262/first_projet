import {  ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty } from "class-validator";

export class CreateLogDto {

    @ApiProperty({ description: 'Message du log' })
    @IsNotEmpty()
    @IsInt()
    message: string;


   @ApiProperty({ description: 'Niveau du log'})
    @IsNotEmpty()
    level: string;

    @ApiProperty({ description: 'Action associée au log' })
    action?: string;

    @ApiProperty({ description: 'Méthode associée au log' })
    method?: string;

    @ApiProperty({ description: 'Entité associée au log' })
    entity?: string;
  
}