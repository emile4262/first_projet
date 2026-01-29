import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {

  @ApiProperty({ description: 'Prénom de l\'utilisateur' })
    @IsString()
    @IsNotEmpty()
    firstName: string;
  
    @ApiProperty({ description: 'Nom de l\'utilisateur' })
    @IsString()
    @IsNotEmpty()
    lastName: string;
  
    @ApiProperty({ description: 'Adresse e-mail de l\'utilisateur' })
    @IsEmail()
    @IsNotEmpty()
    email: string;
 
}
