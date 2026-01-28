/**
 * NestJS i18n Configuration
 * Configures internationalization for the API
 */

export type Locale = 'es-ES' | 'en-US';

export const DEFAULT_LOCALE: Locale = 'es-ES';
export const SUPPORTED_LOCALES: Locale[] = ['es-ES', 'en-US'];

export const I18N_CONFIG = {
  defaultLocale: DEFAULT_LOCALE,
  supportedLocales: SUPPORTED_LOCALES,
  fallbackLocale: DEFAULT_LOCALE,

  // Header name for locale detection
  localeHeader: 'accept-language',

  // Query parameter name for locale
  localeQueryParam: 'locale',

  // Cookie name for locale
  localeCookie: 'LOCALE',

  // Translation file paths
  translationsPath: 'src/i18n/translations',

  // Cache translations
  cache: true,

  // Reload translations on change (development only)
  watch: process.env.NODE_ENV === 'development',
} as const;

export default I18N_CONFIG;
