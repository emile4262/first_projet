import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Query, 
  ParseUUIDPipe 
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Delivery } from '@prisma/client';
// Import Role enum/type from the correct location if not from @prisma/client
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles, Role } from 'src/auth/role.decorateur';


@ApiTags('deliveries')
@ApiBearerAuth()
@Controller('deliveries')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}


  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard) 
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Create a new delivery' })
  async create(@Body() createDeliveryDto: CreateDeliveryDto): Promise<Delivery> {
    return this.deliveryService.create(createDeliveryDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard) 
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Get all deliveries' })
  async findAll(): Promise<Delivery[]> {
    return this.deliveryService.findAll();
  }

  @Get('by-date')
  @UseGuards(JwtAuthGuard, RolesGuard) 
  @Roles(Role.admin)
  @ApiOperation({ summary: '' })
  async getDeliveriesByExactDate(@Query('date') date: string) {
  return this.deliveryService.findDeliveriesByExactDate(date);
}


  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) 
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Get a delivery by ID' })
  
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Delivery> {
    return this.deliveryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) 
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Update a delivery by ID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDeliveryDto: UpdateDeliveryDto
  ): Promise<Delivery> {
    return this.deliveryService.update(id, updateDeliveryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) 
  @Roles(Role.admin)
  @ApiOperation({ summary: 'supprimer une livraison par id' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return this.deliveryService.remove(id);
  }

  // @Get('order/:orderId')
  // @UseGuards(JwtAuthGuard, RolesGuard) 
  // @Roles(Role.admin)
  // @ApiOperation({ summary: 'Get deliveries by order ID' })
  // async findByOrderId(@Param('orderId', ParseUUIDPipe) orderId: string): Promise<Delivery[]> {
  //   const deliveries = await this.deliveryService.findAll();
  //   return deliveries.filter(delivery => delivery.orderId === orderId);
  // }

  // ✅ Confirmer la livraison
  @Patch(':id/confirm')
   @UseGuards(JwtAuthGuard, RolesGuard) 
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Confirmer une livraison par ID' })
  async confirmDelivery(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Delivery> {
    return this.deliveryService.confirmDelivery(id);
  }

  // ❌ Annuler la livraison
   @Patch(':id/cancel')
   @UseGuards(JwtAuthGuard, RolesGuard) 
   @Roles(Role.admin)
   @ApiOperation({ summary: 'Annuler une livraison par ID' })
  async cancelDelivery(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Delivery> {
    return this.deliveryService.cancelDelivery(id);
  }
}
  
