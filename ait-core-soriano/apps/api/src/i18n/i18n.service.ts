/**
 * I18n Service
 * Service for handling internationalization in NestJS
 */

import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { type Locale, DEFAULT_LOCALE, SUPPORTED_LOCALES } from './i18n.config';

interface TranslationCache {
  [locale: string]: Record<string, any>;
}

@Injectable()
export class I18nService {
  private translations: TranslationCache = {};

  constructor() {
    this.loadTranslations();
  }

  /**
   * Load all translation files
   */
  private loadTranslations(): void {
    SUPPORTED_LOCALES.forEach((locale) => {
      try {
        const filePath = join(
          process.cwd(),
          'src',
          'i18n',
          'translations',
          `${locale}.json`
        );
        const content = readFileSync(filePath, 'utf-8');
        this.translations[locale] = JSON.parse(content);
      } catch (error) {
        console.error(`Failed to load translations for locale ${locale}:`, error);
        this.translations[locale] = {};
      }
    });
  }

  /**
   * Get translation for a key
   */
  translate(key: string, locale: Locale = DEFAULT_LOCALE, params?: Record<string, any>): string {
    const localeTranslations = this.translations[locale] || this.translations[DEFAULT_LOCALE];

    // Split key by dots to traverse nested objects
    const keys = key.split('.');
    let translation: any = localeTranslations;

    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        // Fallback to key if translation not found
        return key;
      }
    }

    // Replace parameters in translation
    if (typeof translation === 'string' && params) {
      return this.replaceParams(translation, params);
    }

    return typeof translation === 'string' ? translation : key;
  }

  /**
   * Replace parameters in translation string
   */
  private replaceParams(text: string, params: Record<string, any>): string {
    let result = text;
    Object.entries(params).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    });
    return result;
  }

  /**
   * Get all translations for a locale
   */
  getTranslations(locale: Locale = DEFAULT_LOCALE): Record<string, any> {
    return this.translations[locale] || this.translations[DEFAULT_LOCALE];
  }

  /**
   * Check if locale is supported
   */
  isLocaleSupported(locale: string): boolean {
    return SUPPORTED_LOCALES.includes(locale as Locale);
  }

  /**
   * Get locale from Accept-Language header
   */
  getLocaleFromHeader(acceptLanguage?: string): Locale {
    if (!acceptLanguage) {
      return DEFAULT_LOCALE;
    }

    // Parse Accept-Language header (e.g., "es-ES,es;q=0.9,en;q=0.8")
    const languages = acceptLanguage
      .split(',')
      .map((lang) => {
        const [locale, qValue] = lang.trim().split(';q=');
        return {
          locale: locale.trim(),
          q: qValue ? parseFloat(qValue) : 1,
        };
      })
      .sort((a, b) => b.q - a.q);

    // Find first supported locale
    for (const { locale } of languages) {
      // Check exact match
      if (this.isLocaleSupported(locale)) {
        return locale as Locale;
      }

      // Check language code match (e.g., 'es' matches 'es-ES')
      const langCode = locale.split('-')[0];
      const matchingLocale = SUPPORTED_LOCALES.find((l) => l.startsWith(langCode));
      if (matchingLocale) {
        return matchingLocale;
      }
    }

    return DEFAULT_LOCALE;
  }

  /**
   * Reload translations (useful for development)
   */
  reloadTranslations(): void {
    this.loadTranslations();
  }
}
