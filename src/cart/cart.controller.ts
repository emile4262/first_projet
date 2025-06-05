import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartStatusDto } from './dto/update-cart.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { Role, Roles } from 'src/auth/role.decorateur';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Ajouter un produit au panier
@ApiOperation({ summary: 'Ajouter un produit au panier' })
@Post('add')
@Roles(Role.admin, Role.user)
createCart(@Body() createCartDto: CreateCartDto) {
  return this.cartService.create(createCartDto, createCartDto.userId);
}


  // Mettre à jour la quantité d’un produit dans le panier
  @ApiOperation({ summary: 'Mettre à jour la quantité d’un produit dans le panier' })
  @Patch(':cartProductId')
  @Roles(Role.admin, Role.user)
  updateCartStatus(
    @Param('cartProductId', ParseIntPipe) cartProductId: number,
    @Body() dto: UpdateCartStatusDto,
    @Req() req: Request
  ) {
    const userId = this.extractUserId(req);
    return this.cartService.updateCartStatus(cartProductId, dto, userId, );
  }

  // Obtenir tous les produits du panier pour l’utilisateur connecté
  @ApiOperation({ summary: 'Obtenir tous les produits du panier pour l’utilisateur connecté' })
  @Get('produits')
  @Roles(Role.admin, Role.user)
  findAll(@Req() req: Request) {
    const userId = this.extractUserId(req);
    return this.cartService.findAll(userId);
  }

  // Supprimer un produit du panier
  @ApiOperation({ summary: 'Supprimer un produit du panier' })
  @Delete(':cartProductId')
  @Roles(Role.admin, Role.user)
  remove(@Param('cartProductId', ParseIntPipe) cartProductId: number, @Req() req: Request) {
    const userId = this.extractUserId(req);
    return this.cartService.remove(userId, cartProductId.toString());
  }

  // Obtenir la totalité du panier pour l’utilisateur connecté
  @ApiOperation({ summary: 'Obtenir la totalité du panier pour l’utilisateur connecté' })
  @Get('total')
  @Roles(Role.admin, Role.user) 
  getTotalCart(@Req() req: Request) {
    const userId = this.extractUserId(req);
    return this.cartService.getTotalCart(userId);
  }

  // Méthode utilitaire pour extraire l'ID de l'utilisateur connecté
  private extractUserId(req: Request): string {
    if (!req.user || typeof req.user['id'] === 'string') {
      throw new Error('User information is missing from request.');
    }
    return req.user['id'];
  }
}
