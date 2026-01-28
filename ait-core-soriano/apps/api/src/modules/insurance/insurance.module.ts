import { Module } from '@nestjs/common';
import { InsuranceController } from './insurance.controller';
import { InsuranceService } from './insurance.service';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CoveragesController } from './coverages.controller';
import { CoveragesService } from './coverages.service';
import { PremiumCalculatorService } from './premium-calculator.service';
import { UnderwritingService } from './underwriting.service';
import { RiskAssessmentService } from './risk-assessment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * Insurance Module
 *
 * Comprehensive insurance management system covering policies, products,
 * coverages, premium calculations, underwriting, and risk assessment.
 *
 * Sub-modules:
 * - Policies: Policy lifecycle management
 * - Products: Insurance product catalog
 * - Coverages: Coverage types and limits
 * - Premium Calculator: Rating and premium calculations
 * - Underwriting: Underwriting rules and processes
 * - Risk Assessment: Risk evaluation and scoring
 *
 * Features:
 * - Multi-line insurance support (Auto, Home, Life, Health, etc.)
 * - Dynamic premium calculation
 * - Automated underwriting
 * - Risk-based pricing
 * - Policy renewals and endorsements
 * - Claims history integration
 * - Agent commission calculations
 *
 * @module InsuranceModule
 */
@Module({
  imports: [PrismaModule, AuditModule, NotificationsModule],
  controllers: [
    InsuranceController,
    PoliciesController,
    ProductsController,
    CoveragesController,
  ],
  providers: [
    InsuranceService,
    PoliciesService,
    ProductsService,
    CoveragesService,
    PremiumCalculatorService,
    UnderwritingService,
    RiskAssessmentService,
  ],
  exports: [
    InsuranceService,
    PoliciesService,
    ProductsService,
    PremiumCalculatorService,
    UnderwritingService,
    RiskAssessmentService,
  ],
})
export class InsuranceModule {}
