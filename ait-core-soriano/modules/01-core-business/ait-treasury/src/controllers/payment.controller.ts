import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { SchedulePaymentDto } from '../dto/schedule-payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({ summary: 'Create payment' })
  @ApiResponse({ status: 201, description: 'Payment created' })
  async createPayment(@Body() createDto: CreatePaymentDto) {
    return this.paymentService.createPayment(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List payments' })
  @ApiResponse({ status: 200, description: 'Payments retrieved' })
  async getPayments(
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.paymentService.getPayments({ status, startDate, endDate });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment found' })
  async getPaymentById(@Param('id') id: string) {
    return this.paymentService.getPaymentById(id);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute payment' })
  @ApiResponse({ status: 200, description: 'Payment executed' })
  async executePayment(@Param('id') id: string) {
    return this.paymentService.executePayment(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel payment' })
  @ApiResponse({ status: 200, description: 'Payment cancelled' })
  async cancelPayment(@Param('id') id: string) {
    return this.paymentService.cancelPayment(id);
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Schedule payment' })
  @ApiResponse({ status: 201, description: 'Payment scheduled' })
  async schedulePayment(@Body() scheduleDto: SchedulePaymentDto) {
    return this.paymentService.schedulePayment(scheduleDto);
  }

  @Get('schedule/upcoming')
  @ApiOperation({ summary: 'Get upcoming scheduled payments' })
  @ApiResponse({ status: 200, description: 'Scheduled payments retrieved' })
  async getUpcomingPayments(@Query('days') days: number = 30) {
    return this.paymentService.getUpcomingPayments(days);
  }

  @Post('optimize')
  @ApiOperation({ summary: 'Optimize payment schedule using AI' })
  @ApiResponse({ status: 200, description: 'Payment schedule optimized' })
  async optimizePayments() {
    return this.paymentService.optimizePaymentSchedule();
  }

  @Get('batch/:batchId')
  @ApiOperation({ summary: 'Get batch payment status' })
  @ApiResponse({ status: 200, description: 'Batch status retrieved' })
  async getBatchStatus(@Param('batchId') batchId: string) {
    return this.paymentService.getBatchStatus(batchId);
  }

  @Post('batch/:batchId/execute')
  @ApiOperation({ summary: 'Execute batch payments' })
  @ApiResponse({ status: 200, description: 'Batch executed' })
  async executeBatch(@Param('batchId') batchId: string) {
    return this.paymentService.executeBatch(batchId);
  }
}
