import { Controller, Post, Get, Param, Body, Delete, UseGuards, Patch, Query, BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/config/jwt-auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, RejectOrderDto } from './dto/update-order.dto';
import { Role, Roles } from 'src/config/role.decorateur';
import { OrderStatus } from './order.service';
import { RolesGuard } from 'src/config/roles.guard';
import { Order } from '@prisma/client';
import { SearchOrderDto } from './dto/search.order.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('order')
@ApiBearerAuth()
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @ApiOperation({ summary: 'Créer un order' })
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.orderService.create(dto);
  }

  @ApiOperation({ summary: 'Obtenir tous les orders' })
  @ApiResponse({ status: 200, description: 'commandes récupérés avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @Get()
  @Roles(Role.admin)
  findAll(@Query() query: SearchOrderDto) {
    return this.orderService.findAllOrders(query);
  }

  @ApiOperation({ summary: 'Obtenir un order par ID' })
  @Get(':id')
  @Roles(Role.admin)
  async findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @ApiOperation({ summary: 'Supprimer un order par ID' })
  @Delete(':id')
  @Roles(Role.admin)
  async remove(@Param('id') id: string) {
    return this.orderService.remove(id);
  }

  @ApiOperation({ summary: "Approuver une commande" })
  @Post(':id/approve')
  @Roles(Role.admin)
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  async approve(@Param('id') id: string): Promise<Order> {
    return this.orderService.updateOrderStatus(id, OrderStatus.APPROVED, {} as UpdateOrderStatusDto);
  }

  @ApiOperation({ summary: 'Rejeter une commande' })
  @Post(':id/reject')
  @Roles(Role.admin)
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiBody({ type: RejectOrderDto })
  async reject(@Param('id') id: string, @Body() dto: RejectOrderDto): Promise<Order> {
    return this.orderService.updateOrderStatus(id, OrderStatus.REJECTED, { reason: dto.reason } as UpdateOrderStatusDto);
  }

  @ApiOperation({ summary: 'Mettre à jour le statut d\'une commande' })
  @Patch(':id/status')
  @Roles(Role.admin)
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiBody({ type: UpdateOrderStatusDto })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<Order> {
    if (!dto.status) {
      throw new BadRequestException('Le statut est requis');
    }

    return this.orderService.updateOrderStatus(id, dto.status, dto);
  }
}