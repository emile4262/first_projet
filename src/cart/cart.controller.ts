import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { Role, Roles } from 'src/auth/role.decorateur';
import { StringifyOptions } from 'querystring';

@ApiTags('carts')
@ApiBearerAuth()
@Controller('carts')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /** -------------------- CRÉATION -------------------- */
  @Post()
  @ApiOperation({ summary: 'Créer un nouveau panier' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @HttpCode(HttpStatus.CREATED)
  create(@Body(ValidationPipe) createCartDto: CreateCartDto) {
    return this.cartService.create(createCartDto);
  }

  /** -------------------- LECTURE -------------------- */

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les paniers' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.cartService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un panier par ID' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.cartService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: "Récupérer le panier actif d'un utilisateur" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @HttpCode(HttpStatus.OK)
  findByUserId(@Param('userId', ParseIntPipe) userId: string) {
    return this.cartService.findByUserId(userId);
  }

  @Get(':id/count')
  @ApiOperation({ summary: 'Obtenir le nombre total d’éléments dans un panier' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @HttpCode(HttpStatus.OK)
  getItemsCount(@Param('id', ParseIntPipe) id: string) {
    return this.cartService.getProductCount(id);
  }

  @Get(':id/has-product/:productId')
  @ApiOperation({ summary: 'Vérifier si un produit est dans le panier' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @HttpCode(HttpStatus.OK)
  hasProduct(
    @Param('id', ParseIntPipe) id: string,
    @Param('productId', ParseIntPipe) productId: string
  ) {
    return this.cartService.hasProduct(id, productId);
  }

  /** -------------------- MISE À JOUR -------------------- */

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un panier' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseIntPipe) id: string,
    @Body(ValidationPipe) updateCartDto: UpdateCartDto
  ) {
    return this.cartService.update(id, updateCartDto);
  }

  @Patch(':id/total')
  @ApiOperation({ summary: 'Mettre à jour le total du panier' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @HttpCode(HttpStatus.OK)
  updateTotal(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: { newTotal: number }
  ) {
    return this.cartService.updateCartTotal(id, body.newTotal);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Changer le statut du panier' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @HttpCode(HttpStatus.OK)
  changeStatus(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: { status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED' }
  ) {
    return this.cartService.changeCartStatus(id, body.status);
  }

  /** -------------------- SUPPRESSION -------------------- */

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un panier' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: string) {
    return this.cartService.remove(id);
  }

  @Delete(':id/clear')
  @ApiOperation({ summary: 'Vider un panier (supprimer tous les éléments)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @HttpCode(HttpStatus.OK)
  clearCart(@Param('id', ParseIntPipe) id: string) {
    return this.cartService.clearCart(id);
  }
}
