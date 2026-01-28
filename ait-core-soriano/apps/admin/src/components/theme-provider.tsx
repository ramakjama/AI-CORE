'use client';

import * as React from 'react';
import { useUiStore } from '@/store/ui-store';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const { theme, setTheme } = useUiStore();

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let applyTheme = theme;

    if (theme === 'system' && enableSystem) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      applyTheme = systemTheme;
    }

    if (disableTransitionOnChange) {
      root.classList.add('[&_*]:!transition-none');
      window.setTimeout(() => {
        root.classList.remove('[&_*]:!transition-none');
      }, 0);
    }

    root.classList.add(applyTheme);
  }, [theme, enableSystem, disableTransitionOnChange]);

  const value = {
    theme,
    setTheme,
  };

  return <>{children}</>;
}
