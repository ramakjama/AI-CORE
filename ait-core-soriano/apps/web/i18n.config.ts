/**
 * i18n Configuration
 * Configures internationalization for the application
 *
 * Supported locales: es-ES (Spanish - Spain), en-US (English - United States)
 */

export type Locale = 'es-ES' | 'en-US';

export const locales: Locale[] = ['es-ES', 'en-US'];

export const defaultLocale: Locale = 'es-ES';

export const localeNames: Record<Locale, string> = {
  'es-ES': 'Español',
  'en-US': 'English',
};

export const localeFlags: Record<Locale, string> = {
  'es-ES': '🇪🇸',
  'en-US': '🇺🇸',
};

export const config = {
  locales,
  defaultLocale,
  localeNames,
  localeFlags,
  localeDetection: true,
  // Date and time formats
  dateFormats: {
    'es-ES': {
      short: 'dd/MM/yyyy',
      medium: 'dd MMM yyyy',
      long: 'dd MMMM yyyy',
      full: "EEEE, d 'de' MMMM 'de' yyyy",
    },
    'en-US': {
      short: 'MM/dd/yyyy',
      medium: 'MMM dd, yyyy',
      long: 'MMMM dd, yyyy',
      full: 'EEEE, MMMM dd, yyyy',
    },
  },
  timeFormats: {
    'es-ES': {
      short: 'HH:mm',
      medium: 'HH:mm:ss',
      long: 'HH:mm:ss z',
    },
    'en-US': {
      short: 'h:mm a',
      medium: 'h:mm:ss a',
      long: 'h:mm:ss a z',
    },
  },
  // Number formats
  numberFormats: {
    'es-ES': {
      decimal: ',',
      thousands: '.',
      currency: 'EUR',
      currencyDisplay: 'symbol',
    },
    'en-US': {
      decimal: '.',
      thousands: ',',
      currency: 'USD',
      currencyDisplay: 'symbol',
    },
  },
} as const;

export default config;
