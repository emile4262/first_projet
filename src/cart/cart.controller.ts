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
import { AddProductDto, CreateCartDto } from './dto/create-cart.dto';
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

//  creer un nouveau panier
  @Post()
  @ApiOperation({ summary: 'Créer un nouveau panier' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  @HttpCode(HttpStatus.CREATED)
  create(@Body(ValidationPipe) createCartDto: CreateCartDto) {
    return this.cartService.create(createCartDto);
  }

//  recupère tous les paniers
  @Get()
  @ApiOperation({ summary: 'Récupérer tous les paniers' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.cartService.findAll();
  }

   
//  recupère un panier par son identifiant
@Get(':id')
  @ApiOperation({ summary: 'Récupérer un panier par son identifiant' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  findOne(@Param('id') id: string) {
    return this.cartService.findOne(id);
  }

  //  recupère un panier par l'identifiant de l'utilisateur
  @Get('user/:userId')
  @ApiOperation({ summary: 'Récupérer un panier par l\'identifiant de l\'utilisateur' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  findByUser(@Param('userId') userId: string) {
    return this.cartService.findByUserId(userId);
  }

  //  modifier le statut d'un panier
  @Patch(':id/add-product')
  addProduct(
    @Param('id') cartId: string,
    @Body() addProductDto: AddProductDto,
  ) {
    return this.cartService.addProduct(
      cartId,
      addProductDto.productId,
      addProductDto.quantity,
    );
  }

  // @Patch(':id/remove-product/:productId')
  // removeProduct(
  //   @Param('id') cartId: string,
  //   @Param('productId') productId: string,
  // ) {
  //   return this.cartService.removeProduct(cartId, productId);
  // }
 
  //  modifier un panier
  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un panier' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  update(
    @Param('id') id: string,
    @Body() updateCartDto: UpdateCartDto,
  ) {
    return this.cartService.update(id, updateCartDto);
  }

  //  supprimer un panier
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un panier' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  remove(@Param('id') id: string) {
    return this.cartService.remove(id);
  }

  //  supprimer tous les produits d'un panier
  @Delete(':id/clear')
  @ApiOperation({ summary: 'Supprimer tous les produits d\'un panier' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.user)
  clearCart(@Param('id') cartId: string) {
    return this.cartService.clearCart(cartId);
  }
}
