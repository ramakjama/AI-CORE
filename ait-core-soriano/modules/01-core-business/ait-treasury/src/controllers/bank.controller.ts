/**
 * BankController
 *
 * API REST para integración bancaria (Open Banking)
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BankIntegrationService } from '../banks/bank-integration.service';
import {
  ConnectBankDto,
  InitiatePaymentDto,
  CreatePaymentBatchDto,
  SyncTransactionsDto,
  CreateStandingOrderDto,
  FilterTransactionsDto,
} from '../dto/bank.dto';

@ApiTags('Bank Integration')
@Controller('banks')
export class BankController {
  constructor(private readonly bankService: BankIntegrationService) {}

  @Post('connect')
  @ApiOperation({ summary: 'Connect to bank via Open Banking' })
  @ApiResponse({ status: 201, description: 'Bank connected successfully' })
  async connectBank(@Body() dto: ConnectBankDto) {
    return this.bankService.connectBank(dto.bankId, dto);
  }

  @Delete('connections/:connectionId')
  @ApiOperation({ summary: 'Disconnect bank connection' })
  @ApiResponse({ status: 200, description: 'Bank disconnected successfully' })
  async disconnectBank(@Param('connectionId') connectionId: string) {
    await this.bankService.disconnectBank(connectionId);
    return { message: 'Bank disconnected successfully' };
  }

  @Post('connections/:connectionId/refresh')
  @ApiOperation({ summary: 'Refresh bank connection' })
  @ApiResponse({ status: 200, description: 'Connection refreshed successfully' })
  async refreshConnection(@Param('connectionId') connectionId: string) {
    return this.bankService.refreshConnection(connectionId);
  }

  @Post('connections/:connectionId/sync')
  @ApiOperation({ summary: 'Sync transactions from bank' })
  @ApiResponse({ status: 200, description: 'Transactions synced successfully' })
  async syncTransactions(@Param('connectionId') connectionId: string) {
    return this.bankService.syncTransactions(connectionId);
  }

  @Get('accounts/:accountId/balance')
  @ApiOperation({ summary: 'Get account balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getBalance(@Param('accountId') accountId: string) {
    return this.bankService.getBalance(accountId);
  }

  @Get('connections/:connectionId/accounts')
  @ApiOperation({ summary: 'Get all accounts for connection' })
  @ApiResponse({ status: 200, description: 'Accounts retrieved successfully' })
  async getAccounts(@Param('connectionId') connectionId: string) {
    return this.bankService.getAccounts(connectionId);
  }

  @Post('payments')
  @ApiOperation({ summary: 'Initiate payment (SEPA)' })
  @ApiResponse({ status: 201, description: 'Payment initiated successfully' })
  async initiatePayment(@Body() dto: InitiatePaymentDto) {
    return this.bankService.initiatePayment(
      dto.accountId,
      dto.creditorName,
      dto.creditorIban,
      dto.amount,
      dto.reference,
      dto.executionDate
    );
  }

  @Get('payments/:paymentId/status')
  @ApiOperation({ summary: 'Get payment status' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved' })
  async getPaymentStatus(@Param('paymentId') paymentId: string) {
    return this.bankService.getPaymentStatus(paymentId);
  }

  @Delete('payments/:paymentId')
  @ApiOperation({ summary: 'Cancel payment' })
  @ApiResponse({ status: 200, description: 'Payment cancelled successfully' })
  async cancelPayment(@Param('paymentId') paymentId: string) {
    await this.bankService.cancelPayment(paymentId);
    return { message: 'Payment cancelled successfully' };
  }

  @Post('payments/batch')
  @ApiOperation({ summary: 'Create payment batch' })
  @ApiResponse({ status: 201, description: 'Payment batch created successfully' })
  async createPaymentBatch(@Body() dto: CreatePaymentBatchDto) {
    return this.bankService.createPaymentBatch(
      dto.accountId,
      dto.payments,
      dto.executionDate
    );
  }

  @Post('standing-orders')
  @ApiOperation({ summary: 'Create standing order' })
  @ApiResponse({ status: 201, description: 'Standing order created successfully' })
  async createStandingOrder(@Body() dto: CreateStandingOrderDto) {
    return this.bankService.createStandingOrder(
      dto.accountId,
      dto.creditorName,
      dto.creditorIban,
      dto.amount,
      dto.frequency as any,
      dto.startDate,
      dto.reference
    );
  }

  @Delete('standing-orders/:standingOrderId')
  @ApiOperation({ summary: 'Cancel standing order' })
  @ApiResponse({ status: 200, description: 'Standing order cancelled successfully' })
  async cancelStandingOrder(@Param('standingOrderId') standingOrderId: string) {
    await this.bankService.cancelStandingOrder(standingOrderId);
    return { message: 'Standing order cancelled successfully' };
  }
}
