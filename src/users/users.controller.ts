import { Controller, Get, Post, Body, Param, Delete, Put, Req, UseGuards, UnauthorizedException, HttpCode, HttpStatus, Patch, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, LoginUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard'; // Décommenté
import { Public } from 'src/auth/public.decorateur';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role, Roles } from 'src/auth/role.decorateur';
import { Request } from 'express';
 
// @UseGuards(JwtAuthGuard, RolesGuard) // Décommenté pour activer la protection d'authentification globale
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

//   créer un utilisateur admin et user
  // @Public()
  @Post('create')
  @ApiOperation({ summary: 'Créer un utilisateur' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // ✅ Connexion - reste publique
  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginUserDto) {
    const { email, password } = loginDto;
    return this.usersService.login(email, password);
  }
 

  // ✅ Obtenir tous les utilisateurs - Réservé aux admins
  @ApiBearerAuth()
  @Get()
  @Roles(Role.admin) 
  async findAll(): Promise<User[]> {
    const users = await this.usersService.findAll();
    //  Ajout de la propriété admin par défaut
    return users.map(user => ({
      ...user,
      admin: (user as any).admin ?? false,
      role: (user as any).role ?? 'user',
    }));
  }

  // ✅ Obtenir un utilisateur par ID
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: Request & { user: any } // Changé User à any pour éviter des problèmes potentiels
  ) {
    // Un utilisateur ne peut voir que son propre profil, sauf s'il est admin
    if (req.user && req.user.id !== id && req.user.role !== 'admin') {
      throw new UnauthorizedException('Non autorisé à consulter ce profil');
    }
    return this.usersService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request & { user: any } // Changé User à any pour éviter des problèmes potentiels
  ) {
    // Un utilisateur ne peut modifier que son propre profil, sauf s'il est admin
    if (req.user && req.user.id !== id && req.user.role !== 'admin') {
      throw new UnauthorizedException('Non autorisé à modifier ce profil');
    }
    return this.usersService.update(id, updateUserDto);
  }

  // ✅ Supprimer un utilisateur - Réservé aux admins
  @ApiBearerAuth()
  @Delete(':id')
  @Roles(Role.admin) // Ajout explicite de la restriction aux admins
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ✅ Liste des utilisateurs avec produits associés - Réservé aux admins
  @ApiBearerAuth()
  @Get('with-products/all')
  @Roles(Role.admin) // Ajout explicite de la restriction aux admins
  async getUsersWithProducts() {
    return this.usersService.findAllWithproducts();
  }

  @Patch(':id/role') // Exemple de route: PATCH /users/:id/role
  @Roles(Role.admin) // Seuls les utilisateurs avec le rôle 'Admin' peuvent accéder à cette route
  @HttpCode(HttpStatus.OK)
  async updateRole(
    @Param('id') userId: string, // L'ID de l'utilisateur dont le rôle doit être changé
    @Body('role') newRole: string, // Le nouveau rôle envoyé dans le corps de la requête
  ) {
    if (!newRole) {
      throw new BadRequestException('Le nouveau rôle est requis.');
    }
    
    // Validation des rôles autorisés
    if (newRole !== 'admin' && newRole !== 'user') {
      throw new BadRequestException('Rôle invalide. Les valeurs autorisées sont "admin" ou "user".');
    }

    const updatedUser =await this.usersService.updateUserRole(userId, newRole);
    return {
      message: `Rôle de l'utilisateur ${userId} mis à jour en '${newRole}' avec succès.`,
      user: updatedUser,
    };
  }

  
}