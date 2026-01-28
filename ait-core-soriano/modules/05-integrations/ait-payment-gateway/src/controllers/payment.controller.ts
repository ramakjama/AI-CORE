/**
 * Payment Controller
 * REST API endpoints for payment operations
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  Logger,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentOrchestratorService } from '../services/payment-orchestrator.service';
import { PaymentReconciliationService } from '../services/payment-reconciliation.service';
import { FraudDetectionService } from '../services/fraud-detection.service';
import {
  CreatePaymentDto,
  RefundPaymentDto,
  GetPaymentStatusDto,
  CreateSubscriptionDto,
  CancelSubscriptionDto,
} from '../dto/payment.dto';
import { PaymentProvider, TransactionType } from '../interfaces/payment.types';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private orchestratorService: PaymentOrchestratorService,
    private reconciliationService: PaymentReconciliationService,
    private fraudDetectionService: FraudDetectionService,
  ) {}

  /**
   * Create a new payment
   */
  @Post()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  @ApiResponse({ status: 403, description: 'Payment blocked by fraud detection' })
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @Headers('x-forwarded-for') ipAddress?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    try {
      this.logger.log(`Creating payment for ${dto.customer.email}`);

      // Fraud detection check
      const fraudCheck = await this.fraudDetectionService.checkPayment({
        customer: dto.customer,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        ipAddress: dto.ipAddress || ipAddress,
        userAgent: dto.userAgent || userAgent,
        timestamp: new Date(),
      });

      if (!fraudCheck.passed) {
        this.logger.warn(
          `Payment blocked by fraud detection: Score=${fraudCheck.riskScore}, Flags=${fraudCheck.flags.join(', ')}`,
        );

        throw new HttpException(
          {
            statusCode: HttpStatus.FORBIDDEN,
            message: 'Payment blocked by fraud detection',
            riskScore: fraudCheck.riskScore,
            flags: fraudCheck.flags,
            recommendations: fraudCheck.recommendations,
          },
          HttpStatus.FORBIDDEN,
        );
      }

      // Create payment
      const result = await this.orchestratorService.createPayment(
        {
          amount: dto.amount,
          customer: dto.customer,
          paymentMethod: dto.paymentMethod,
          description: dto.description,
          metadata: dto.metadata,
          returnUrl: dto.returnUrl,
          cancelUrl: dto.cancelUrl,
        },
        dto.preferredProvider,
      );

      // Log transaction
      await this.reconciliationService.logTransaction({
        transactionId: result.transactionId,
        type: TransactionType.PAYMENT,
        provider: result.provider,
        status: result.status,
        amount: result.amount,
        customerId: dto.customer.id || dto.customer.email,
        metadata: dto.metadata,
        request: dto,
        response: result.providerResponse,
        error: result.error,
      });

      // Record for fraud detection
      this.fraudDetectionService.recordTransaction(
        dto.customer.id || dto.customer.email,
        dto.amount.amount,
        result.success,
      );

      return {
        statusCode: HttpStatus.CREATED,
        data: result,
        fraudCheck: {
          riskScore: fraudCheck.riskScore,
          passed: fraudCheck.passed,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Payment creation failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Payment creation failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get payment status
   */
  @Get(':transactionId')
  @ApiOperation({ summary: 'Get payment status' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentStatus(
    @Param('transactionId') transactionId: string,
    @Query('provider') provider: PaymentProvider,
  ) {
    try {
      const result = await this.orchestratorService.getPaymentStatus(transactionId, provider);

      return {
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to get payment status: ${error.message}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Payment not found',
          error: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Refund a payment
   */
  @Post('refund')
  @ApiOperation({ summary: 'Refund a payment' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid refund data' })
  async refundPayment(@Body() dto: RefundPaymentDto) {
    try {
      this.logger.log(`Processing refund for transaction ${dto.transactionId}`);

      const result = await this.orchestratorService.refund(
        {
          transactionId: dto.transactionId,
          amount: dto.amount,
          reason: dto.reason,
          metadata: dto.metadata,
        },
        dto.provider,
      );

      // Log refund transaction
      await this.reconciliationService.logTransaction({
        transactionId: result.refundId,
        type: TransactionType.REFUND,
        provider: dto.provider,
        status: result.status,
        amount: result.amount,
        customerId: dto.metadata?.customerId || 'unknown',
        metadata: dto.metadata,
        request: dto,
        response: result,
        error: result.error,
      });

      return {
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Refund failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Refund processing failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create a subscription
   */
  @Post('subscriptions')
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid subscription data' })
  async createSubscription(@Body() dto: CreateSubscriptionDto) {
    try {
      this.logger.log(`Creating subscription for ${dto.customer.email}`);

      const result = await this.orchestratorService.createSubscription(
        {
          customer: dto.customer,
          plan: dto.plan,
          paymentMethod: dto.paymentMethod,
          trialDays: dto.trialDays,
          metadata: dto.metadata,
        },
        dto.provider,
      );

      // Log subscription transaction
      await this.reconciliationService.logTransaction({
        transactionId: result.id,
        type: TransactionType.SUBSCRIPTION,
        provider: dto.provider,
        status: result.status as any,
        amount: dto.plan.amount,
        customerId: result.customerId,
        metadata: dto.metadata,
        request: dto,
        response: result,
      });

      return {
        statusCode: HttpStatus.CREATED,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Subscription creation failed: ${error.message}`, error.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Subscription creation failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cancel a subscription
   */
  @Post('subscriptions/cancel')
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async cancelSubscription(@Body() dto: CancelSubscriptionDto) {
    try {
      this.logger.log(`Cancelling subscription ${dto.subscriptionId}`);

      const result = await this.orchestratorService.cancelSubscription(
        dto.subscriptionId,
        dto.provider,
        dto.immediate,
      );

      return {
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Subscription cancellation failed: ${error.message}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Subscription cancellation failed',
          error: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Get subscription details
   */
  @Get('subscriptions/:subscriptionId')
  @ApiOperation({ summary: 'Get subscription details' })
  @ApiResponse({ status: 200, description: 'Subscription details retrieved' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async getSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Query('provider') provider: PaymentProvider,
  ) {
    try {
      const result = await this.orchestratorService.getSubscription(subscriptionId, provider);

      return {
        statusCode: HttpStatus.OK,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to get subscription: ${error.message}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Subscription not found',
          error: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Health check for all providers
   */
  @Get('health/check')
  @ApiOperation({ summary: 'Check health of all payment providers' })
  @ApiResponse({ status: 200, description: 'Health check results' })
  async healthCheck() {
    const results = await this.orchestratorService.healthCheckAll();

    return {
      statusCode: HttpStatus.OK,
      data: results,
    };
  }

  /**
   * Get payment statistics
   */
  @Get('stats/overview')
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = this.reconciliationService.getPaymentStatistics(start, end);

    return {
      statusCode: HttpStatus.OK,
      data: stats,
    };
  }
}
