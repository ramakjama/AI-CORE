import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { JournalEntryController } from './controllers/journal-entry.controller';
import { LedgerController } from './controllers/ledger.controller';
import { ReconciliationController } from './controllers/reconciliation.controller';
import { ClosingController } from './controllers/closing.controller';
import { ReportsController } from './controllers/reports.controller';

// Services
import { PrismaService } from './shared/prisma.service';
import { JournalEntryService } from './services/journal-entry.service';
import { LedgerService } from './services/ledger.service';
import { ReconciliationService } from './services/reconciliation.service';
import { ClosingService } from './services/closing.service';
import { AnomalyDetectionService } from './services/anomaly-detection.service';
import { PgcEngineIntegrationService } from './services/pgc-engine-integration.service';

/**
 * AI-ACCOUNTANT Module
 *
 * AI-powered accounting automation with real-time bookkeeping,
 * automated journal entries, and PGC compliance.
 *
 * Features:
 * - Automated journal entries with AI classification
 * - Real-time bookkeeping
 * - PGC compliance validation
 * - Bank reconciliation (ML-based matching)
 * - Period closing automation
 * - Anomaly detection
 * - Financial reporting
 *
 * Dependencies:
 * - AI-PGC-ENGINE (required) - For account classification and validation
 * - AI-TREASURY (optional) - For bank reconciliation
 */
@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [
    JournalEntryController,
    LedgerController,
    ReconciliationController,
    ClosingController,
    ReportsController,
  ],
  providers: [
    // Database
    PrismaService,

    // Core Services
    JournalEntryService,
    LedgerService,
    ReconciliationService,
    ClosingService,
    AnomalyDetectionService,

    // Integration Services
    PgcEngineIntegrationService,
  ],
  exports: [
    PrismaService,
    JournalEntryService,
    LedgerService,
    ReconciliationService,
    ClosingService,
    PgcEngineIntegrationService,
  ],
})
export class AiAccountantModule {}
