import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsNotEmpty, MinLength, IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  // @ApiProperty({ type: Boolean, default: true })
  // @IsBoolean()
  // @IsOptional() 
  // admin?: boolean;

  // @ApiProperty({ enum: ['admin', 'admin'], default: 'admin' })
  // @IsEnum(['admin', 'admin'])
  // @IsOptional()
  // role?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  createdAt: Date;
  admin: boolean;
  role: Role;
}

export class LoginUserDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  // @ApiProperty({ enum: ['admin', 'admin'], default: 'admin' })
  // @IsEnum(['admin', 'admin'])
  // @IsOptional() 
  //  role: 'user' | 'admin' 
 
 
  // @IsOptional()
  // @IsString()
  // imageUrl?: string;

}