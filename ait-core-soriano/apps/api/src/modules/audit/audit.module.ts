import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './audit.interceptor';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Audit Module
 *
 * Provides comprehensive audit trail functionality for tracking user actions,
 * data changes, and system events.
 *
 * Features:
 * - Automatic audit logging via interceptor
 * - Change tracking and diff generation
 * - User action history
 * - Compliance and security auditing
 * - Search and filtering capabilities
 * - Export functionality
 *
 * @module AuditModule
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditService, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
