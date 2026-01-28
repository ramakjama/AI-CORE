/**
 * Formatting utilities
 */

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { DATE_FORMATS, CURRENCY_CODES } from './constants';

/**
 * Currency formatter
 */
export const formatCurrency = (
  amount: number,
  currency: keyof typeof CURRENCY_CODES = 'EUR',
  locale: string = 'es-ES'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Number formatter
 */
export const formatNumber = (
  value: number,
  decimals: number = 2,
  locale: string = 'es-ES'
): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Percentage formatter
 */
export const formatPercentage = (
  value: number,
  decimals: number = 2,
  locale: string = 'es-ES'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

/**
 * Date formatters
 */
export const formatDate = (
  date: Date | string,
  formatString: string = DATE_FORMATS.DISPLAY
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString, { locale: es });
};

export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, DATE_FORMATS.DISPLAY_DATETIME);
};

export const formatISODate = (date: Date | string): string => {
  return formatDate(date, DATE_FORMATS.ISO);
};

export const formatISODateTime = (date: Date | string): string => {
  return formatDate(date, DATE_FORMATS.ISO_DATETIME);
};

export const formatTime = (date: Date | string): string => {
  return formatDate(date, DATE_FORMATS.TIME);
};

/**
 * Relative time formatter
 */
export const formatRelativeTime = (date: Date | string, locale: string = 'es-ES'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  }
  if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  }
  if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  }
  if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  }
  if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  }
  return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
};

/**
 * Phone number formatter
 */
export const formatPhoneES = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('34')) {
    return `+34 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  }

  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
};

/**
 * IBAN formatter
 */
export const formatIBAN = (iban: string): string => {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
};

/**
 * NIF/NIE/CIF formatter
 */
export const formatSpanishId = (id: string): string => {
  return id.toUpperCase().replace(/\s/g, '');
};

/**
 * License plate formatter
 */
export const formatLicensePlate = (plate: string): string => {
  const cleaned = plate.toUpperCase().replace(/\s/g, '');
  if (cleaned.length === 7) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }
  return cleaned;
};

/**
 * Postal code formatter
 */
export const formatPostalCode = (code: string): string => {
  return code.padStart(5, '0');
};

/**
 * File size formatter
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Truncate text
 */
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitalize first letter
 */
export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Capitalize words
 */
export const capitalizeWords = (text: string): string => {
  return text
    .split(' ')
    .map((word) => capitalizeFirst(word))
    .join(' ');
};

/**
 * Slugify text
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Mask sensitive data
 */
export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  if (username.length <= 2) return email;
  return `${username.charAt(0)}${'*'.repeat(username.length - 2)}${username.slice(-1)}@${domain}`;
};

export const maskPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;
  return `${'*'.repeat(cleaned.length - 4)}${cleaned.slice(-4)}`;
};

export const maskIBAN = (iban: string): string => {
  const cleaned = iban.replace(/\s/g, '');
  if (cleaned.length < 8) return iban;
  return `${cleaned.slice(0, 4)}${'*'.repeat(cleaned.length - 8)}${cleaned.slice(-4)}`;
};

export const maskCreditCard = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length < 8) return cardNumber;
  return `${'*'.repeat(cleaned.length - 4)}${cleaned.slice(-4)}`;
};
