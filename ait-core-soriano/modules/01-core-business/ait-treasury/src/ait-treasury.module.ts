import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { TreasuryController } from './controllers/treasury.controller';
import { CashManagementController } from './controllers/cash-management.controller';
import { CashFlowController } from './controllers/cash-flow.controller';
import { ForecastController } from './controllers/forecast.controller';
import { BankController } from './controllers/bank.controller';
import { BudgetController } from './controllers/budget.controller';

// Services
import { PrismaService } from './shared/prisma.service';
import { TreasuryService } from './services/treasury.service';
import { CashManagementService } from './cash/cash-management.service';
import { CashFlowService } from './cash-flow/cash-flow.service';
import { CashForecastService } from './forecasting/cash-forecast.service';
import { BankIntegrationService } from './banks/bank-integration.service';
import { BudgetService } from './budget/budget.service';

/**
 * AIT-TREASURY Module
 *
 * Gestión completa de tesorería con IA
 *
 * Features:
 * - Cash management y posición de liquidez en tiempo real
 * - Cash flow statements automáticos
 * - Forecasting 12 meses con múltiples métodos (ML, regression, weighted)
 * - Integración bancaria completa (Open Banking / PSD2)
 * - Pagos masivos SEPA
 * - Budget tracking y alertas
 * - Conciliación bancaria automática
 * - Análisis de escenarios
 *
 * Dependencies:
 * - AIT-PGC-ENGINE (required)
 * - AIT-ACCOUNTANT (required)
 */
@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [
    TreasuryController,
    CashManagementController,
    CashFlowController,
    ForecastController,
    BankController,
    BudgetController,
  ],
  providers: [
    PrismaService,
    TreasuryService,
    CashManagementService,
    CashFlowService,
    CashForecastService,
    BankIntegrationService,
    BudgetService,
  ],
  exports: [
    PrismaService,
    TreasuryService,
    CashManagementService,
    CashFlowService,
    CashForecastService,
    BankIntegrationService,
    BudgetService,
  ],
})
export class AitTreasuryModule {}
