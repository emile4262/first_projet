import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Put,
  Delete,
  BadRequestException,
  UseGuards,
  Req,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto, LoginUserDto, ResetPasswordDto, VerifyOtpDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { Role, Roles } from 'src/auth/role.decorateur';
import { ExcludeFieldsInterceptor } from 'src/composant/composant.interceptor';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // Création d'utilisateur - PUBLIC 
  @Post('create')
  @UseInterceptors(new ExcludeFieldsInterceptor(['password', 'role']))
  @ApiOperation({ summary: 'Créer un utilisateur' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  // Connexion - PUBLIC
  @Post('login')
  @ApiOperation({ summary: 'Connexion utilisateur' })
  async login(@Body() loginDto: LoginUserDto) {
    const { email, password } = loginDto;
    return this.usersService.login(email, password);
  }

  // Récupérer tous les utilisateurs - ADMIN SEULEMENT
  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer tous les utilisateurs' })
  async findAll() {
    return this.usersService.findAll();
  }

  // Mettre à jour son propre profil
  @Put('profile/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour son propre profil' })
  async updateProfile(@Body() updateUserDto: UpdateUserDto, @Req() req: Request) {
    const user = req.user as any;
    return this.usersService.update(user.sub, updateUserDto);
  }

  // Supprimer un utilisateur - ADMIN SEULEMENT
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: `Utilisateur ${id} supprimé avec succès` };
  }

  // Endpoints publics (sans authentification)
  @Post('forgot-password')
  @ApiOperation({ summary: 'Demander un OTP pour réinitialiser le mot de passe (public)' })
  async forgotPassword(@Body() dto: ResetPasswordDto) {
    return this.usersService.sendOtp(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Réinitialiser le mot de passe avec OTP (public)' })
  async resetPassword(@Body() dto: VerifyOtpDto) {
    return this.usersService.resetPasswordWithOtp(dto);
  }
}