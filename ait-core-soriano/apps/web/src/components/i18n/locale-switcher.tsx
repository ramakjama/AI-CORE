/**
 * LocaleSwitcher Component
 * Dropdown component for switching between locales
 */

'use client';

import { useLocale } from '@/hooks/use-locale';
import { localeNames, localeFlags } from '../../../i18n.config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LocaleSwitcher() {
  const { locale, locales, changeLocale } = useLocale();

  return (
    <Select value={locale} onValueChange={changeLocale}>
      <SelectTrigger className="w-[180px]">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span>{localeFlags[locale]}</span>
            <span>{localeNames[locale]}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            <span className="flex items-center gap-2">
              <span>{localeFlags[loc]}</span>
              <span>{localeNames[loc]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default LocaleSwitcher;
