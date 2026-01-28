/**
 * i18n Utility Functions
 * Helper functions for internationalization
 */

import { type Locale, locales, defaultLocale } from '../../../i18n.config';

/**
 * Get locale from pathname
 */
export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];

  if (locales.includes(potentialLocale as Locale)) {
    return potentialLocale as Locale;
  }

  return defaultLocale;
}

/**
 * Remove locale from pathname
 */
export function removeLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  return pathname.replace(`/${locale}`, '') || '/';
}

/**
 * Add locale to pathname
 */
export function addLocaleToPathname(pathname: string, locale: Locale): string {
  const cleanPath = removeLocaleFromPathname(pathname);
  return `/${locale}${cleanPath}`;
}

/**
 * Check if pathname has locale
 */
export function hasLocaleInPathname(pathname: string): boolean {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  return locales.includes(potentialLocale as Locale);
}

/**
 * Get direction for locale (RTL/LTR)
 */
export function getDirectionForLocale(locale: Locale): 'ltr' | 'rtl' {
  // Add RTL locales here if needed (e.g., 'ar', 'he')
  return 'ltr';
}

/**
 * Validate locale
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * Get browser locale
 */
export function getBrowserLocale(): Locale {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  const browserLang = window.navigator.language;

  // Check exact match
  if (isValidLocale(browserLang)) {
    return browserLang as Locale;
  }

  // Check language code match (e.g., 'es' matches 'es-ES')
  const langCode = browserLang.split('-')[0];
  const matchingLocale = locales.find((locale) => locale.startsWith(langCode));

  return matchingLocale || defaultLocale;
}

/**
 * Set locale cookie
 */
export function setLocaleCookie(locale: Locale) {
  if (typeof document !== 'undefined') {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

/**
 * Get locale cookie
 */
export function getLocaleCookie(): Locale | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
  const locale = match ? match[1] : null;

  return locale && isValidLocale(locale) ? locale : null;
}
