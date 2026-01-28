/**
 * Security Middleware
 * Comprehensive security middleware for request validation and protection
 *
 * @module middleware/security
 * @description Production-grade security middleware stack
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createAuditLog } from '../config/security.config';

/**
 * IP Whitelist/Blacklist Middleware
 */
@Injectable()
export class IPFilterMiddleware implements NestMiddleware {
  private readonly logger = new Logger(IPFilterMiddleware.name);
  private readonly whitelist: string[] = process.env.IP_WHITELIST?.split(',') || [];
  private readonly blacklist: string[] = process.env.IP_BLACKLIST?.split(',') || [];

  use(req: Request, res: Response, next: NextFunction) {
    const clientIP = this.getClientIP(req);

    // Check blacklist first
    if (this.blacklist.includes(clientIP)) {
      this.logger.warn(`Blocked IP from blacklist: ${clientIP}`);
      return res.status(403).json({
        statusCode: 403,
        message: 'Access denied',
      });
    }

    // If whitelist is configured, enforce it
    if (this.whitelist.length > 0 && !this.whitelist.includes(clientIP)) {
      this.logger.warn(`Blocked IP not in whitelist: ${clientIP}`);
      return res.status(403).json({
        statusCode: 403,
        message: 'Access denied',
      });
    }

    next();
  }

  private getClientIP(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }
}

/**
 * Request Sanitization Middleware
 * Removes potentially dangerous characters from requests
 */
@Injectable()
export class SanitizationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SanitizationMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Sanitize query parameters
    if (req.query) {
      req.query = this.sanitizeObject(req.query);
    }

    // Sanitize body
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }

    // Sanitize params
    if (req.params) {
      req.params = this.sanitizeObject(req.params);
    }

    next();
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[this.sanitizeString(key)] = this.sanitizeObject(value);
    }

    return sanitized;
  }

  private sanitizeString(str: any): any {
    if (typeof str !== 'string') {
      return str;
    }

    // Remove null bytes
    str = str.replace(/\0/g, '');

    // Remove potential XSS vectors
    str = str.replace(/<script[^>]*>.*?<\/script>/gi, '');
    str = str.replace(/javascript:/gi, '');
    str = str.replace(/on\w+\s*=/gi, '');

    // Remove SQL injection patterns
    str = str.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi, '');

    return str;
  }
}

/**
 * Security Headers Middleware
 * Adds additional security headers not covered by Helmet
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Server identification removal
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    // Additional security headers
    res.setHeader('X-Request-ID', req.headers['x-request-id'] || this.generateRequestId());
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Feature Policy / Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    );

    next();
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Anti-Scraping Middleware
 * Detects and blocks automated scraping attempts
 */
@Injectable()
export class AntiScrapingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AntiScrapingMiddleware.name);
  private requestCounts = new Map<string, { count: number; timestamp: number }>();

  use(req: Request, res: Response, next: NextFunction) {
    const clientIP = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Check for suspicious patterns
    if (this.isSuspiciousBot(userAgent)) {
      this.logger.warn(`Suspicious bot detected: ${userAgent} from ${clientIP}`);
      return res.status(403).json({
        statusCode: 403,
        message: 'Access denied',
      });
    }

    // Track request frequency
    const now = Date.now();
    const record = this.requestCounts.get(clientIP);

    if (record) {
      const timeDiff = now - record.timestamp;

      // More than 100 requests per minute is suspicious
      if (timeDiff < 60000 && record.count > 100) {
        this.logger.warn(`Scraping attempt detected from ${clientIP}`);
        return res.status(429).json({
          statusCode: 429,
          message: 'Too many requests',
        });
      }

      if (timeDiff > 60000) {
        // Reset counter after 1 minute
        this.requestCounts.set(clientIP, { count: 1, timestamp: now });
      } else {
        record.count++;
      }
    } else {
      this.requestCounts.set(clientIP, { count: 1, timestamp: now });
    }

    next();
  }

  private getClientIP(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  private isSuspiciousBot(userAgent: string): boolean {
    const suspiciousPatterns = [
      /scrapy/i,
      /curl/i,
      /wget/i,
      /python-requests/i,
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
    ];

    // Allow legitimate bots
    const legitimateBots = [
      /googlebot/i,
      /bingbot/i,
      /slackbot/i,
      /twitterbot/i,
      /facebookexternalhit/i,
    ];

    if (legitimateBots.some(pattern => pattern.test(userAgent))) {
      return false;
    }

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }
}

/**
 * Request Size Limit Middleware
 * Prevents large payload attacks
 */
@Injectable()
export class RequestSizeLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestSizeLimitMiddleware.name);
  private readonly maxBodySize = 10 * 1024 * 1024; // 10 MB
  private readonly maxHeaderSize = 8 * 1024; // 8 KB

  use(req: Request, res: Response, next: NextFunction) {
    // Check Content-Length header
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    if (contentLength > this.maxBodySize) {
      this.logger.warn(`Request body too large: ${contentLength} bytes`);
      return res.status(413).json({
        statusCode: 413,
        message: 'Request body too large',
      });
    }

    // Check header size
    const headerSize = JSON.stringify(req.headers).length;
    if (headerSize > this.maxHeaderSize) {
      this.logger.warn(`Request headers too large: ${headerSize} bytes`);
      return res.status(431).json({
        statusCode: 431,
        message: 'Request headers too large',
      });
    }

    next();
  }
}

/**
 * Audit Logging Middleware
 * Logs all security-relevant events
 */
@Injectable()
export class AuditLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuditLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Log request
    const auditLog = createAuditLog(
      'http_request',
      'low',
      {
        method: req.method,
        path: req.path,
        query: req.query,
      },
      req
    );

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const severity = this.getSeverity(res.statusCode);

      this.logger.log(
        JSON.stringify({
          ...auditLog,
          statusCode: res.statusCode,
          duration,
          severity,
        })
      );
    });

    next();
  }

  private getSeverity(statusCode: number): 'low' | 'medium' | 'high' | 'critical' {
    if (statusCode >= 500) return 'critical';
    if (statusCode >= 400) return 'high';
    if (statusCode >= 300) return 'medium';
    return 'low';
  }
}

/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */
@Injectable()
export class CSRFProtectionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CSRFProtectionMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF check for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const csrfToken = req.headers['x-csrf-token'] || req.body?._csrf;
    const sessionToken = (req as any).session?.csrfToken;

    if (!csrfToken || csrfToken !== sessionToken) {
      this.logger.warn('CSRF token validation failed');
      return res.status(403).json({
        statusCode: 403,
        message: 'Invalid CSRF token',
      });
    }

    next();
  }
}
