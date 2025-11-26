import { Controller, Post, Get, Param, Body, Delete, UseGuards, Patch, Query, BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { Role, Roles } from 'src/auth/role.decorateur';
import { RolesGuard } from 'src/auth/roles.guard';
import { Order } from '@prisma/client';
import { PageOptionsDto } from '../common/dto/page-options.dto';

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
  @Get()
  @Roles(Role.admin)
  findAll(@Query() pageOptionsDto: PageOptionsDto) {
    return this.orderService.getAllOrders(pageOptionsDto);
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