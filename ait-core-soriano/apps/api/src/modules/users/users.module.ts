import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

/**
 * Users Module
 *
 * Manages user accounts, profiles, and related operations.
 *
 * Features:
 * - User registration and activation
 * - Profile management
 * - Password management
 * - User preferences
 * - Role and permission management
 * - User search and filtering
 * - Audit trail integration
 *
 * @module UsersModule
 */
@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
