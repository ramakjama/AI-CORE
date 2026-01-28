// Module
export * from './claim-processor.module';

// Services
export * from './services/claim.service';
export * from './ocr/ocr.service';
export * from './ocr/damage-assessment.service';
export * from './approval/approval-engine.service';
export * from './automation/claim-automation.service';

// Workflow
export * from './workflow/claim-state-machine';

// DTOs
export * from './dto/claim.dto';

// Entities
export * from './entities/claim.entity';

// Enums
export * from './enums/claim-state.enum';

// Controllers
export * from './controllers/claim.controller';

// Integrations
export * from './integrations/insurer-integration.service';
export * from './integrations/payment-integration.service';
export * from './integrations/notification-integration.service';
export * from './integrations/storage-integration.service';
