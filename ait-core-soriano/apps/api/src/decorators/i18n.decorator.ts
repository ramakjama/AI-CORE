/**
 * I18n Decorators
 * Decorators for getting locale and translations in controllers
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DEFAULT_LOCALE, type Locale, SUPPORTED_LOCALES } from '../i18n/i18n.config';

/**
 * Get locale from request
 * Usage: @Locale() locale: Locale
 */
export const Locale = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Locale => {
    const request = ctx.switchToHttp().getRequest();

    // 1. Check query parameter
    const queryLocale = request.query?.locale;
    if (queryLocale && SUPPORTED_LOCALES.includes(queryLocale)) {
      return queryLocale;
    }

    // 2. Check cookie
    const cookieLocale = request.cookies?.LOCALE;
    if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
      return cookieLocale;
    }

    // 3. Check Accept-Language header
    const acceptLanguage = request.headers['accept-language'];
    if (acceptLanguage) {
      const languages = acceptLanguage
        .split(',')
        .map((lang: string) => {
          const [locale] = lang.trim().split(';');
          return locale.trim();
        });

      for (const locale of languages) {
        // Check exact match
        if (SUPPORTED_LOCALES.includes(locale as Locale)) {
          return locale as Locale;
        }

        // Check language code match
        const langCode = locale.split('-')[0];
        const matchingLocale = SUPPORTED_LOCALES.find((l) => l.startsWith(langCode));
        if (matchingLocale) {
          return matchingLocale;
        }
      }
    }

    // 4. Default locale
    return DEFAULT_LOCALE;
  }
);

/**
 * Get translation function
 * Usage: @Translate() t: (key: string, params?: any) => string
 */
export const Translate = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const i18nService = request.i18nService;
    const locale = request.locale || DEFAULT_LOCALE;

    return (key: string, params?: Record<string, any>) => {
      return i18nService?.translate(key, locale, params) || key;
    };
  }
);
