/**
 * i18n Formatters
 * Functions for formatting dates, numbers, and currency
 */

import { type Locale, config } from '../../../i18n.config';
import { format as dateFnsFormat } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

const localeMap = {
  'es-ES': es,
  'en-US': enUS,
};

/**
 * Format date according to locale
 */
export function formatDate(
  date: Date | string | number,
  locale: Locale,
  formatType: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const formatString = config.dateFormats[locale][formatType];

  return dateFnsFormat(dateObj, formatString, {
    locale: localeMap[locale],
  });
}

/**
 * Format time according to locale
 */
export function formatTime(
  date: Date | string | number,
  locale: Locale,
  formatType: 'short' | 'medium' | 'long' = 'short'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const formatString = config.timeFormats[locale][formatType];

  return dateFnsFormat(dateObj, formatString, {
    locale: localeMap[locale],
  });
}

/**
 * Format date and time according to locale
 */
export function formatDateTime(
  date: Date | string | number,
  locale: Locale,
  dateFormat: 'short' | 'medium' | 'long' | 'full' = 'medium',
  timeFormat: 'short' | 'medium' | 'long' = 'short'
): string {
  return `${formatDate(date, locale, dateFormat)} ${formatTime(date, locale, timeFormat)}`;
}

/**
 * Format number according to locale
 */
export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  const numberFormat = config.numberFormats[locale];

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/**
 * Format currency according to locale
 */
export function formatCurrency(
  value: number,
  locale: Locale,
  currency?: string,
  options?: Intl.NumberFormatOptions
): string {
  const numberFormat = config.numberFormats[locale];
  const currencyCode = currency || numberFormat.currency;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: numberFormat.currencyDisplay as 'symbol' | 'code' | 'name',
    ...options,
  }).format(value);
}

/**
 * Format percentage according to locale
 */
export function formatPercentage(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value / 100);
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: Locale,
  baseDate: Date = new Date()
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const diffInSeconds = Math.floor((baseDate.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];

  for (const { unit, seconds } of units) {
    const value = Math.floor(diffInSeconds / seconds);
    if (Math.abs(value) >= 1) {
      return rtf.format(-value, unit);
    }
  }

  return rtf.format(0, 'second');
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number, locale: Locale, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${formatNumber(bytes / Math.pow(k, i), locale, {
    minimumFractionDigits: dm,
    maximumFractionDigits: dm,
  })} ${sizes[i]}`;
}

/**
 * Format phone number (basic implementation)
 */
export function formatPhoneNumber(phone: string, locale: Locale): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  if (locale === 'es-ES') {
    // Spanish format: +34 XXX XXX XXX
    if (cleaned.length === 9) {
      return `+34 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
  } else if (locale === 'en-US') {
    // US format: +1 (XXX) XXX-XXXX
    if (cleaned.length === 10) {
      return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
  }

  return phone;
}

/**
 * Format list according to locale
 */
export function formatList(items: string[], locale: Locale, type: 'conjunction' | 'disjunction' = 'conjunction'): string {
  return new Intl.ListFormat(locale, { type }).format(items);
}
