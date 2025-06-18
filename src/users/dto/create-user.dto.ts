import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsNotEmpty, MinLength, IsString, IsBoolean, IsOptional, IsEnum, Matches } from 'class-validator';

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

export class ResetPasswordDto {
  @ApiProperty({ example: '', description: 'Email de l\'utilisateur' })
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;
}

// dto/verify-otp.dto.ts
export class VerifyOtpDto {
  @ApiProperty({ example: '', description: 'Email de l\'utilisateur' })
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @ApiProperty({ example: '', description: 'Code OTP à 6 chiffres' })
  @IsString({ message: 'OTP doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'OTP requis' })
  @Matches(/^\d{6}$/, { message: 'OTP doit contenir exactement 6 chiffres' })
  otp: string;

  @ApiProperty({ example: '', description: 'Nouveau mot de passe (min 8 caractères)' })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @IsNotEmpty({ message: 'Nouveau mot de passe requis' })
  newPassword: string;
}