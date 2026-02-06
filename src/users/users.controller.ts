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
  Patch,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto} from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SearchDto } from './dto/search.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/config/roles.guard';
import { JwtAuthGuard } from 'src/config/jwt-auth/jwt-auth.guard';
import { Role, Roles } from 'src/config/role.decorateur';
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
  // @Post('login')
  // @ApiOperation({ summary: 'Connexion utilisateur' })
  // async login(@Body() loginDto: LoginUserDto) {
  //   const { email, password } = loginDto;
  //   return this.usersService.login(email, password);
  // }

  // Récupérer tous les utilisateurs - ADMIN SEULEMENT
  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer tous les utilisateurs' })
  async findAll(@Query() query: SearchDto) {
    return this.usersService.findAll(query);
  }

  // Récuperer par Id
  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // Mettre à jour son propre profil
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour son propre profil' })
  async updateProfile(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto,
   @Req() req: Request) {
    const user = req.user as any;
    return this.usersService.update(
      id,
      updateUserDto
    );
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
  // @Post('forgot-password')
  // @ApiOperation({ summary: 'Demander un OTP pour réinitialiser le mot de passe (public)' })
  // async forgotPassword(@Body() dto: ResetPasswordDto) {
  //   return this.usersService.sendOtp(dto);
  // }

//   @Post('reset-password')
//   @ApiOperation({ summary: 'Réinitialiser le mot de passe avec OTP (public)' })
//   async resetPassword(@Body() dto: VerifyOtpDto) {
//     return this.usersService.resetPasswordWithOtp(dto);
//   }
}