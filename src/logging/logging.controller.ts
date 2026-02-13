import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { LoggingService } from './logging.service';
import { AdminGuard } from '../guards/admin.guard';
import {
  GetActivityLogsDto,
  GetOrderLogsDto,
  GetProductLogsDto,
  GetAuthLogsDto,
  GetSystemLogsDto,
  GetFailedLoginsDto,
  GetSystemErrorsDto,
  GetDashboardDto,
  GetActivityStatsDto,
} from './dto';
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

@Controller('logs')
@ApiBearerAuth()
@ApiSecurity('JWT-auth')
// @UseGuards(AdminGuard) // Temporarily disabled for testing
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  // ============================================
  // ACTIVITY LOGS
  // ============================================

  @Get('activity')
  @HttpCode(HttpStatus.OK)
  async getActivityLogs(@Query() query: GetActivityLogsDto) {
    const result = await this.loggingService.getActivityLogs({
      page: query.page,
      limit: query.limit,
      userId: query.userId,
      action: query.action,
      entityType: query.entityType,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get('activity/stats')
  @HttpCode(HttpStatus.OK)
  async getActivityStats(@Query() query: GetActivityStatsDto) {
    const result = await this.loggingService.getActivityStats({
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });

    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // ORDER LOGS
  // ============================================

  @Get('orders')
  @HttpCode(HttpStatus.OK)
  async getOrderLogs(@Query() query: GetOrderLogsDto) {
    const result = await this.loggingService.getOrderLogs({
      page: query.page,
      limit: query.limit,
      orderId: query.orderId,
      action: query.action,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get('orders/:orderId/history')
  @HttpCode(HttpStatus.OK)
  async getOrderHistory(@Param('orderId') orderId: string) {
    const result = await this.loggingService.getOrderHistory(orderId);

    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // PRODUCT LOGS
  // ============================================

  @Get('products')
  @HttpCode(HttpStatus.OK)
  async getProductLogs(@Query() query: GetProductLogsDto) {
    const result = await this.loggingService.getProductLogs({
      page: query.page,
      limit: query.limit,
      productId: query.productId,
      action: query.action,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get('products/:productId/history')
  @HttpCode(HttpStatus.OK)
  async getProductHistory(@Param('productId') productId: string) {
    const result = await this.loggingService.getProductHistory(productId);

    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // AUTH LOGS
  // ============================================

  @Get('auth')
  @HttpCode(HttpStatus.OK)
  async getAuthLogs(@Query() query: GetAuthLogsDto) {
    const result = await this.loggingService.getAuthLogs({
      page: query.page,
      limit: query.limit,
      userId: query.userId,
      action: query.action,
      success: query.success,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get('auth/failed-logins')
  @HttpCode(HttpStatus.OK)
  async getFailedLogins(@Query() query: GetFailedLoginsDto) {
    const result = await this.loggingService.getFailedLogins(query.hours);

    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // SYSTEM LOGS
  // ============================================

  @Get('system')
  @HttpCode(HttpStatus.OK)
  async getSystemLogs(@Query() query: GetSystemLogsDto) {
    const result = await this.loggingService.getSystemLogs({
      page: query.page,
      limit: query.limit,
      level: query.level,
      source: query.source,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get('system/errors')
  @HttpCode(HttpStatus.OK)
  async getSystemErrors(@Query() query: GetSystemErrorsDto) {
    const result = await this.loggingService.getSystemErrors(query.hours);

    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // DASHBOARD
  // ============================================

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  async getDashboard(@Query() query: GetDashboardDto) {
    const result = await this.loggingService.getDashboard(query.hours);

    return {
      success: true,
      data: result,
    };
  }
}