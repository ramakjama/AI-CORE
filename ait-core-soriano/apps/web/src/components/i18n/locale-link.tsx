/**
 * LocaleLink Component
 * Link component that maintains locale in URL
 */

'use client';

import Link, { LinkProps } from 'next/link';
import { useLocale } from '@/hooks/use-locale';
import { addLocaleToPathname } from '@/lib/i18n/utils';
import { ComponentProps } from 'react';

type LocaleLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
};

export function LocaleLink({ href, ...props }: LocaleLinkProps) {
  const { locale } = useLocale();
  const localizedHref = addLocaleToPathname(href, locale);

  return <Link {...props} href={localizedHref} />;
}

export default LocaleLink;
