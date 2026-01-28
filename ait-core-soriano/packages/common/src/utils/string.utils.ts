/**
 * String utility functions for AI-Suite
 */

/**
 * Truncate a string to a specified length
 */
export function truncate(str: string, length: number, suffix = '...'): string {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalize each word in a string
 */
export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Convert string to slug (URL-friendly)
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
 * Convert camelCase to kebab-case
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Convert snake_case to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Convert camelCase to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

/**
 * Generate a random string of specified length
 */
export function randomString(length: number, charset?: string): string {
  const chars = charset || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string, maxLength = 2): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, maxLength)
    .join('');
}

/**
 * Strip HTML tags from a string
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

/**
 * Count words in a string
 */
export function wordCount(str: string): number {
  return str
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Check if string is a valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Highlight search terms in text
 */
export function highlightText(text: string, search: string, tag = 'mark'): string {
  if (!search) return text;
  const regex = new RegExp(`(${search})`, 'gi');
  return text.replace(regex, `<${tag}>$1</${tag}>`);
}

/**
 * Format a number as a compact string (e.g., 1.2K, 3.4M)
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
}

/**
 * Format bytes as human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Pluralize a word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const pluralForm = plural || singular + 's';
  return count === 1 ? `${count} ${singular}` : `${count} ${pluralForm}`;
}

/**
 * Mask a string (e.g., for sensitive data)
 */
export function maskString(str: string, visible = 4, maskChar = '*'): string {
  if (str.length <= visible) return str;
  const masked = maskChar.repeat(str.length - visible);
  return masked + str.slice(-visible);
}

/**
 * Mask email address
 */
export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const maskedName = name.length > 2
    ? name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
    : name;
  return `${maskedName}@${domain}`;
}
