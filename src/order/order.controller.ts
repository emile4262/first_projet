import { Controller, Post, Get, Param, Body, Delete, UseGuards, Patch, Req, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderService, OrderStatus } from './order.service';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { Request } from 'express';
import { Role, Roles } from 'src/auth/role.decorateur';
import { RolesGuard } from 'src/auth/roles.guard';

@ApiTags('order')
@ApiBearerAuth()
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @ApiOperation({ summary: 'Créer un order' })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orderService.create(dto);
  }

  @ApiOperation({ summary: 'Obtenir tous les order' })
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.orderService.getAllOrders();
  }

  @ApiOperation({ summary: 'Obtenir un order par ID' })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const order = await this.orderService.findOne(id);
    if (!order) {
      throw new NotFoundException(`La commande avec l'ID ${id} n'existe pas`);
    }
    return order;
  }

  @ApiOperation({ summary: 'Supprimer un order par ID' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const order = await this.orderService.findOne(id);
    if (!order) {
      throw new NotFoundException(`La commande avec l'ID ${id} n'existe pas`);
    }
    return this.orderService.remove(id);
  }
  
  

    // méthode PATCH pour rejeter une commande avec validation
@ApiOperation({ summary: 'Mettre à jour le statut d\'une commande' })    
@Patch('status/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
async updateOrderStatus(
  @Param('id') id: string,
  @Body() dto: UpdateOrderStatusDto,
): Promise<any> {
  const order = await this.orderService.findOne(id);

  if (!order) {
    throw new NotFoundException(`La commande avec l'ID ${id} n'existe pas`);
  }

  if (order.status !== OrderStatus.PENDING) {
    throw new BadRequestException('Seules les commandes en attente peuvent être modifiées');
  }

  // Vérification du statut demandé
  if (!dto.status || (dto.status !== OrderStatus.APPROVED && dto.status !== OrderStatus.REJECTED)) {
    throw new BadRequestException('Le statut doit être APPROVED ou REJECTED');
  }

  // Vérification de la raison
  if (!dto.reason || dto.reason.trim() === '') {
    throw new BadRequestException(`Une raison est requise pour ${dto.status !== OrderStatus.APPROVED ? 'approuver' : 'rejeter'} la commande`);
  }

  // Vérification supplémentaire pour les commandes vides
  if (!order.quantity || order.quantity === 0) {
    if (dto.status === OrderStatus.APPROVED) {
      throw new BadRequestException('Une commande vide ne peut pas être approuvée');
    }
  }

  return this.orderService.updateOrderStatus(id, dto.status, dto);
}
  }
 
    

  
 