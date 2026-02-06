import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto, ResetPasswordDto, VerifyOtpDto } from './dto/create-auth.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

 @Post('login')
  @ApiOperation({ summary: 'Connexion utilisateur' })
  async login(@Body() loginDto: LoginUserDto) {
    const { email, password } = loginDto;
    return this.authService .login(email, password);
  }

  @Post('forgot-password')
    @ApiOperation({ summary: 'Demander un OTP pour réinitialiser le mot de passe (public)' })
    async forgotPassword(@Body() dto: ResetPasswordDto) {
      return this.authService.sendOtp(dto);
    }

 @Post('reset-password')
   @ApiOperation({ summary: 'Réinitialiser le mot de passe avec OTP (public)' })
   async resetPassword(@Body() dto: VerifyOtpDto) {
     return this.authService.resetPasswordWithOtp(dto);
   }
}
