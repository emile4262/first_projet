import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payement.dto';
import { PaymentsService } from './payement.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

//   @Post('webhook')
//   handleWebhook(@Body() body: any) {
//     const { transaction_id, status } = body;
//     return this.paymentsService.handleWebhook(transaction_id, status);
//   }

  @Get('order/:id')
  findBySale(@Param('id') id: string) {
    return this.paymentsService.findByOrder(+id);
  }

  @Get('order/:id/balance')
  getBalance(@Param('id') id: string) {
    return this.paymentsService.getOrderBalance(+id);
  }

//   @Post(':id/process')
//   processPayment(@Param('id') id: string, @Body('method') method: string) {
//     return this.paymentsService.processPayment({ id: +id }, method);
//   }
}
