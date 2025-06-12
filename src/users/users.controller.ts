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
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto, LoginUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { Role, Roles } from 'src/auth/role.decorateur';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
   
  // Création d'utilisateur - PUBLIC 
  @Post('create')
  @ApiOperation({ summary: 'Créer un utilisateur' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
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
  @UseGuards(JwtAuthGuard, RolesGuard) 
  @Roles(Role.admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer tous les utilisateurs' })
  async findAll() {
    return this.usersService.findAll();
  }

  // Récupérer son propre profil 
  @Get('profile/me')
  @UseGuards(JwtAuthGuard) 
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer son propre profil' })
  async getProfile(@Req() req: Request) {
    const user = req.user as any; 
    return this.usersService.findOne(user.sub);
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
}