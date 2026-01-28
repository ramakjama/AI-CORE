/**
 * I18n Middleware
 * Middleware to attach i18n service and locale to request
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { I18nService } from '../i18n/i18n.service';
import { type Locale } from '../i18n/i18n.config';

@Injectable()
export class I18nMiddleware implements NestMiddleware {
  constructor(private readonly i18nService: I18nService) {}

  use(req: Request & { i18nService?: I18nService; locale?: Locale }, res: Response, next: NextFunction) {
    // Attach i18n service to request
    req.i18nService = this.i18nService;

    // Get locale from request
    const acceptLanguage = req.headers['accept-language'];
    const locale = this.i18nService.getLocaleFromHeader(acceptLanguage);
    req.locale = locale;

    // Set Content-Language header in response
    res.setHeader('Content-Language', locale);

    next();
  }
}
