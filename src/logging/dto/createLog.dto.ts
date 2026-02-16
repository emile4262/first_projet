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
  
}