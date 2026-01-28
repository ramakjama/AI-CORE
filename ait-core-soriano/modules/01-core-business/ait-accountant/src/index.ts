import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountantController } from './controllers/accountant.controller';
import { JournalController } from './controllers/journal.controller';
import { ReconciliationController } from './controllers/reconciliation.controller';
import { AccountantService } from './services/accountant.service';
import { JournalService } from './services/journal.service';
import { ReconciliationService } from './services/reconciliation.service';
import { LedgerService } from './services/ledger.service';
import { FiscalPeriodService } from './services/fiscal-period.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
  ],
  controllers: [
    AccountantController,
    JournalController,
    ReconciliationController,
  ],
  providers: [
    AccountantService,
    JournalService,
    ReconciliationService,
    LedgerService,
    FiscalPeriodService,
  ],
  exports: [
    AccountantService,
    JournalService,
    ReconciliationService,
    LedgerService,
    FiscalPeriodService,
  ],
})
export class AiAccountantModule {}

export * from './controllers/accountant.controller';
export * from './controllers/journal.controller';
export * from './controllers/reconciliation.controller';
export * from './services/accountant.service';
export * from './services/journal.service';
export * from './services/reconciliation.service';
export * from './services/ledger.service';
export * from './services/fiscal-period.service';
export * from './dto';
export * from './entities';
export * from './interfaces';
