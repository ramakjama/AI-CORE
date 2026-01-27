/**
 * Formatting utility functions for the UI library
 */

/**
 * Format a number as currency
 * @param value - The number to format
 * @param currency - Currency code (default: 'EUR')
 * @param locale - Locale string (default: 'es-ES')
 */
export function formatCurrency(
  value: number,
  currency: string = 'EUR',
  locale: string = 'es-ES'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number with thousand separators
 * @param value - The number to format
 * @param locale - Locale string (default: 'es-ES')
 */
export function formatNumber(
  value: number,
  locale: string = 'es-ES'
): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format a number as percentage
 * @param value - The number to format (0-1 or 0-100)
 * @param decimals - Number of decimal places
 * @param isDecimal - Whether the value is already in decimal form (0-1)
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  isDecimal: boolean = true
): string {
  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format a date
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @param locale - Locale string (default: 'es-ES')
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  locale: string = 'es-ES'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 * @param date - Date to format
 * @param locale - Locale string (default: 'es-ES')
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: string = 'es-ES'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffSec < 60) return rtf.format(-diffSec, 'second');
  if (diffMin < 60) return rtf.format(-diffMin, 'minute');
  if (diffHour < 24) return rtf.format(-diffHour, 'hour');
  if (diffDay < 7) return rtf.format(-diffDay, 'day');
  if (diffWeek < 4) return rtf.format(-diffWeek, 'week');
  if (diffMonth < 12) return rtf.format(-diffMonth, 'month');
  return rtf.format(-diffYear, 'year');
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Convert bytes to human readable format
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Capitalize first letter of string
 * @param str - String to capitalize
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert string to slug format
 * @param str - String to convert
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format a phone number
 * @param phone - Phone number string
 * @param countryCode - Country code (default: '+34')
 */
export function formatPhone(phone: string, countryCode: string = '+34'): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${countryCode} ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Get initials from a name
 * @param name - Full name
 * @param maxInitials - Maximum number of initials (default: 2)
 */
export function getInitials(name: string, maxInitials: number = 2): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, maxInitials)
    .join('');
}
