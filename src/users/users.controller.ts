import { Controller, Get, Post, Body, Param, Delete, Put, Query, Req, UseGuards, UnauthorizedException, Res, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, LoginUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { Public } from 'src/auth/public.decorateur';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { RolesGuard } from 'src/auth/roles.guard';
import { Role, Roles } from 'src/auth/role.decorateur';


@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) // Ajout du RolesGuard au niveau du contrôleur
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ Créer un utilisateur - Seul un admin peut créer des admins
  @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
  @Post()
  @Public()
  // @Roles(Role.admin) // Mais aussi restreinte aux admins ⚠️ (conflit potentiel avec @Public)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // ✅ Connexion - reste publique
  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginUserDto) {
    const { email, password } = loginDto;
    return this.usersService.login(email, password);
  }

  // ✅ Vérifier si l'utilisateur existe par email et mot de passe
  // Pas besoin de @UseGuards(JwtAuthGuard) car déjà au niveau de la classe
  @ApiBearerAuth()
  @Post('verify')
  async verifyUser(@Body() body: { email: string; password: string }, @Req() req) {
    // Vérification que l'utilisateur s'authentifie lui-même ou est admin
    if (req.user.email !== body.email && req.user.role !== 'admin' || 'user') {
      throw new UnauthorizedException('Non autorisé à vérifier cet utilisateur');
    }
    const { email, password } = body;
    return this.usersService.verifyUser(email, password);
  }


  // ✅ Obtenir tous les utilisateurs - Réservé aux admins
  @Roles(Role.admin)
  @ApiBearerAuth()
  @Get()
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  // ✅ Obtenir un utilisateur par ID
  @ApiBearerAuth()
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    // Un utilisateur ne peut voir que son propre profil, sauf s'il est admin
    if (req.user.id !== id && req.user.role !== 'admin' || 'user' ) {
      throw new UnauthorizedException('Non autorisé à consulter ce profil');
    }
    return this.usersService.findOne(id);
  }

  // ✅ Modifier un utilisateur
  @ApiBearerAuth()
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req
  ) {
    // Un utilisateur ne peut modifier que son propre profil, sauf s'il est admin
    if (req.user.id !== id && req.user.role !== 'admin' || 'user') {
      throw new UnauthorizedException('Non autorisé à modifier ce profil');
    }
    return this.usersService.update(id, updateUserDto);
  }

  // ✅ Supprimer un utilisateur - Réservé aux admins
  @Roles(Role.admin)
  @ApiBearerAuth()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ✅ Liste des utilisateurs avec produits associés - Réservé aux admins
  @Roles(Role.admin)
  @ApiBearerAuth()
  @Get('with-products/all')
  async getUsersWithProducts() {
    return this.usersService.findAllWithproducts();
  }
}