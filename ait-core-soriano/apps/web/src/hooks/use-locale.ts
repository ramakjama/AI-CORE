/**
 * useLocale Hook
 * Hook for accessing and managing locale
 */

'use client';

import { useLocale as useNextIntlLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { type Locale, locales } from '../../i18n.config';
import { setLocaleCookie, addLocaleToPathname, removeLocaleFromPathname } from '@/lib/i18n/utils';
import { useCallback } from 'react';

export function useLocale() {
  const locale = useNextIntlLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const changeLocale = useCallback(
    (newLocale: Locale) => {
      if (newLocale === locale) return;

      // Set cookie
      setLocaleCookie(newLocale);

      // Update URL
      const cleanPath = removeLocaleFromPathname(pathname);
      const newPath = addLocaleToPathname(cleanPath, newLocale);

      router.push(newPath);
    },
    [locale, pathname, router]
  );

  return {
    locale,
    locales,
    changeLocale,
  };
}

export default useLocale;
