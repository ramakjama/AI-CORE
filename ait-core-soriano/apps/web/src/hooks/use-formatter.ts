/**
 * useFormatter Hook
 * Hook for accessing formatting functions with current locale
 */

'use client';

import { useLocale } from 'next-intl';
import { type Locale } from '../../i18n.config';
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatRelativeTime,
  formatFileSize,
  formatPhoneNumber,
  formatList,
} from '@/lib/i18n/formatters';
import { useCallback } from 'react';

export function useFormatter() {
  const locale = useLocale() as Locale;

  const date = useCallback(
    (date: Date | string | number, formatType?: 'short' | 'medium' | 'long' | 'full') => {
      return formatDate(date, locale, formatType);
    },
    [locale]
  );

  const time = useCallback(
    (date: Date | string | number, formatType?: 'short' | 'medium' | 'long') => {
      return formatTime(date, locale, formatType);
    },
    [locale]
  );

  const dateTime = useCallback(
    (
      date: Date | string | number,
      dateFormat?: 'short' | 'medium' | 'long' | 'full',
      timeFormat?: 'short' | 'medium' | 'long'
    ) => {
      return formatDateTime(date, locale, dateFormat, timeFormat);
    },
    [locale]
  );

  const number = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return formatNumber(value, locale, options);
    },
    [locale]
  );

  const currency = useCallback(
    (value: number, currencyCode?: string, options?: Intl.NumberFormatOptions) => {
      return formatCurrency(value, locale, currencyCode, options);
    },
    [locale]
  );

  const percentage = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return formatPercentage(value, locale, options);
    },
    [locale]
  );

  const relativeTime = useCallback(
    (date: Date | string | number, baseDate?: Date) => {
      return formatRelativeTime(date, locale, baseDate);
    },
    [locale]
  );

  const fileSize = useCallback(
    (bytes: number, decimals?: number) => {
      return formatFileSize(bytes, locale, decimals);
    },
    [locale]
  );

  const phoneNumber = useCallback(
    (phone: string) => {
      return formatPhoneNumber(phone, locale);
    },
    [locale]
  );

  const list = useCallback(
    (items: string[], type?: 'conjunction' | 'disjunction') => {
      return formatList(items, locale, type);
    },
    [locale]
  );

  return {
    date,
    time,
    dateTime,
    number,
    currency,
    percentage,
    relativeTime,
    fileSize,
    phoneNumber,
    list,
  };
}

export default useFormatter;
