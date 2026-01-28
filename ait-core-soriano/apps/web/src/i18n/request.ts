/**
 * i18n Request Configuration
 * Handles locale detection and configuration per request
 */

import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, locales, type Locale } from '../../i18n.config';

export default getRequestConfig(async () => {
  // Get locale from cookie or use default
  const cookieStore = cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE');

  let locale: Locale = defaultLocale;

  if (localeCookie && locales.includes(localeCookie.value as Locale)) {
    locale = localeCookie.value as Locale;
  }

  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default,
    timeZone: locale === 'es-ES' ? 'Europe/Madrid' : 'America/New_York',
    now: new Date(),
  };
});
