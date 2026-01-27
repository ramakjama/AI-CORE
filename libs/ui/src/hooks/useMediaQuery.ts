import { useState, useEffect, useCallback } from 'react';

/**
 * Hook that returns whether a media query matches
 *
 * @param query - CSS media query string
 * @returns Boolean indicating if the query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = useCallback((query: string): boolean => {
    // Prevents SSR issues
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  }, []);

  const [matches, setMatches] = useState<boolean>(() => getMatches(query));

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Update state on mount
    setMatches(mediaQuery.matches);

    // Handler for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Legacy support (Safari < 14)
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}

/**
 * Predefined breakpoint hooks based on Tailwind CSS defaults
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Hook that returns if viewport is at or above a breakpoint
 *
 * @param breakpoint - Tailwind breakpoint name
 * @returns Boolean indicating if viewport width >= breakpoint
 *
 * @example
 * const isDesktop = useBreakpoint('lg');
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${breakpoints[breakpoint]})`);
}

/**
 * Hook that returns the current active breakpoint
 *
 * @returns Current breakpoint name or 'xs' for mobile
 *
 * @example
 * const breakpoint = useCurrentBreakpoint();
 * // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 */
export function useCurrentBreakpoint(): Breakpoint | 'xs' {
  const isSm = useMediaQuery(`(min-width: ${breakpoints.sm})`);
  const isMd = useMediaQuery(`(min-width: ${breakpoints.md})`);
  const isLg = useMediaQuery(`(min-width: ${breakpoints.lg})`);
  const isXl = useMediaQuery(`(min-width: ${breakpoints.xl})`);
  const is2xl = useMediaQuery(`(min-width: ${breakpoints['2xl']})`);

  if (is2xl) return '2xl';
  if (isXl) return 'xl';
  if (isLg) return 'lg';
  if (isMd) return 'md';
  if (isSm) return 'sm';
  return 'xs';
}

/**
 * Hook for responsive values based on breakpoints
 *
 * @param values - Object mapping breakpoints to values
 * @param defaultValue - Default value when no breakpoint matches
 * @returns Current value based on active breakpoint
 *
 * @example
 * const columns = useResponsiveValue({
 *   xs: 1,
 *   sm: 2,
 *   md: 3,
 *   lg: 4,
 * }, 1);
 */
export function useResponsiveValue<T>(
  values: Partial<Record<Breakpoint | 'xs', T>>,
  defaultValue: T
): T {
  const currentBreakpoint = useCurrentBreakpoint();
  const breakpointOrder: (Breakpoint | 'xs')[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];

  // Find the value for current breakpoint or the next smaller one
  const startIndex = breakpointOrder.indexOf(currentBreakpoint);

  for (let i = startIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp]!;
    }
  }

  return defaultValue;
}

/**
 * Common media query hooks
 */
export function useIsMobile(): boolean {
  return !useMediaQuery(`(min-width: ${breakpoints.md})`);
}

export function useIsTablet(): boolean {
  const isMd = useMediaQuery(`(min-width: ${breakpoints.md})`);
  const isLg = useMediaQuery(`(min-width: ${breakpoints.lg})`);
  return isMd && !isLg;
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.lg})`);
}

export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
