import { Module } from '@nestjs/common';
import { ClaimService } from './services/claim.service';
import { ClaimStateMachine } from './workflow/claim-state-machine';
import { OCRService } from './ocr/ocr.service';
import { DamageAssessmentService } from './ocr/damage-assessment.service';
import { ApprovalEngineService } from './approval/approval-engine.service';
import { ClaimAutomationService } from './automation/claim-automation.service';
import { InsurerIntegrationService } from './integrations/insurer-integration.service';
import { PaymentIntegrationService } from './integrations/payment-integration.service';
import { NotificationIntegrationService } from './integrations/notification-integration.service';
import { StorageIntegrationService } from './integrations/storage-integration.service';
import { ClaimController } from './controllers/claim.controller';

/**
 * Módulo AIT Claim Processor
 *
 * Sistema completo de gestión de siniestros con:
 * - State machine de 10 estados
 * - OCR multi-proveedor
 * - Workflow de aprobación multinivel
 * - Detección de fraude
 * - Automatización de procesos
 * - Integraciones externas
 */
@Module({
  controllers: [ClaimController],
  providers: [
    // Core services
    ClaimService,
    ClaimStateMachine,

    // OCR & Analysis
    OCRService,
    DamageAssessmentService,

    // Workflow
    ApprovalEngineService,
    ClaimAutomationService,

    // Integrations
    InsurerIntegrationService,
    PaymentIntegrationService,
    NotificationIntegrationService,
    StorageIntegrationService,
  ],
  exports: [
    ClaimService,
    ClaimStateMachine,
    OCRService,
    ApprovalEngineService,
    ClaimAutomationService,
  ],
})
export class ClaimProcessorModule {}
