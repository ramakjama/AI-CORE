/**
 * Security Guards
 * NestJS guards for authentication, authorization, and security checks
 *
 * @module guards/security
 * @description Production-ready security guards
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

/**
 * API Key Guard
 * Validates API keys for external integrations
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing');
    }

    const isValid = await this.validateApiKey(apiKey);

    if (!isValid) {
      this.logger.warn(`Invalid API key attempt: ${apiKey.substring(0, 8)}...`);
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }

  private extractApiKey(request: Request): string | null {
    return (
      (request.headers['x-api-key'] as string) ||
      (request.query.apiKey as string) ||
      null
    );
  }

  private async validateApiKey(apiKey: string): Promise<boolean> {
    // TODO: Implement actual API key validation against database
    const validKeys = process.env.VALID_API_KEYS?.split(',') || [];
    return validKeys.includes(apiKey);
  }
}

/**
 * Role-Based Access Control Guard
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!requiredRoles) {
      return true; // No roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const hasRole = requiredRoles.some(role => user.roles?.includes(role));

    if (!hasRole) {
      this.logger.warn(
        `User ${user.id} attempted to access resource requiring roles: ${requiredRoles.join(', ')}`
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

/**
 * Permission-Based Access Control Guard
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler()
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const hasPermission = requiredPermissions.every(permission =>
      user.permissions?.includes(permission)
    );

    if (!hasPermission) {
      this.logger.warn(
        `User ${user.id} lacks required permissions: ${requiredPermissions.join(', ')}`
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

/**
 * IP Whitelist Guard
 */
@Injectable()
export class IPWhitelistGuard implements CanActivate {
  private readonly logger = new Logger(IPWhitelistGuard.name);
  private readonly whitelist: string[] = process.env.IP_WHITELIST?.split(',') || [];

  canActivate(context: ExecutionContext): boolean {
    if (this.whitelist.length === 0) {
      return true; // No whitelist configured
    }

    const request = context.switchToHttp().getRequest<Request>();
    const clientIP = this.getClientIP(request);

    if (!this.whitelist.includes(clientIP)) {
      this.logger.warn(`Access denied for IP: ${clientIP}`);
      throw new ForbiddenException('Access denied');
    }

    return true;
  }

  private getClientIP(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}

/**
 * Resource Ownership Guard
 * Ensures users can only access their own resources
 */
@Injectable()
export class ResourceOwnershipGuard implements CanActivate {
  private readonly logger = new Logger(ResourceOwnershipGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const resourceUserId = request.params.userId || request.body?.userId;

    // Admins can access any resource
    if (user.roles?.includes('admin')) {
      return true;
    }

    // Check ownership
    if (resourceUserId && resourceUserId !== user.id) {
      this.logger.warn(
        `User ${user.id} attempted to access resource owned by ${resourceUserId}`
      );
      throw new ForbiddenException('You can only access your own resources');
    }

    return true;
  }
}

/**
 * Email Verification Guard
 * Ensures user has verified their email
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException('Email verification required');
    }

    return true;
  }
}

/**
 * MFA (Multi-Factor Authentication) Guard
 */
@Injectable()
export class MFAGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (user.mfaEnabled && !user.mfaVerified) {
      throw new ForbiddenException('MFA verification required');
    }

    return true;
  }
}

/**
 * Account Status Guard
 * Checks if user account is active and not suspended
 */
@Injectable()
export class AccountStatusGuard implements CanActivate {
  private readonly logger = new Logger(AccountStatusGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (user.status === 'suspended') {
      this.logger.warn(`Suspended user ${user.id} attempted access`);
      throw new ForbiddenException('Account suspended');
    }

    if (user.status === 'deleted') {
      throw new ForbiddenException('Account deleted');
    }

    if (user.status !== 'active') {
      throw new ForbiddenException('Account not active');
    }

    return true;
  }
}

/**
 * Trial Period Guard
 * Checks if user's trial period has expired
 */
@Injectable()
export class TrialPeriodGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (user.subscriptionType === 'trial' && user.trialExpiresAt) {
      const now = new Date();
      const expiresAt = new Date(user.trialExpiresAt);

      if (now > expiresAt) {
        throw new ForbiddenException('Trial period has expired');
      }
    }

    return true;
  }
}

/**
 * Composite Security Guard
 * Combines multiple security checks
 */
@Injectable()
export class CompositeSecurityGuard implements CanActivate {
  private readonly logger = new Logger(CompositeSecurityGuard.name);

  constructor(
    private readonly rolesGuard: RolesGuard,
    private readonly permissionsGuard: PermissionsGuard,
    private readonly accountStatusGuard: AccountStatusGuard,
    private readonly emailVerifiedGuard: EmailVerifiedGuard,
    private readonly mfaGuard: MFAGuard
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Run all guards in sequence
    const guards = [
      this.accountStatusGuard,
      this.emailVerifiedGuard,
      this.mfaGuard,
      this.rolesGuard,
      this.permissionsGuard,
    ];

    for (const guard of guards) {
      const canActivate = await guard.canActivate(context);
      if (!canActivate) {
        return false;
      }
    }

    return true;
  }
}
