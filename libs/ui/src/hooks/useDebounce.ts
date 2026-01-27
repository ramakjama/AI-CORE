import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook that debounces a value
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 *
 * useEffect(() => {
 *   // This will only run 300ms after the user stops typing
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that returns a debounced callback function
 *
 * @param callback - The callback to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced callback and cancel function
 *
 * @example
 * const [debouncedSearch, cancelSearch] = useDebouncedCallback(
 *   (term: string) => fetchResults(term),
 *   300
 * );
 *
 * const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
 *   debouncedSearch(e.target.value);
 * };
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number
): [(...args: Parameters<T>) => void, () => void] {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      cancel();
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay, cancel]
  );

  // Cleanup on unmount
  useEffect(() => {
    return cancel;
  }, [cancel]);

  return [debouncedCallback, cancel];
}

/**
 * Hook for debounced state with both immediate and debounced values
 *
 * @param initialValue - Initial state value
 * @param delay - Debounce delay in milliseconds
 * @returns Object with value, debouncedValue, setValue, and isPending
 *
 * @example
 * const { value, debouncedValue, setValue, isPending } = useDebouncedState('', 300);
 *
 * <input value={value} onChange={(e) => setValue(e.target.value)} />
 * {isPending && <Spinner />}
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number
): {
  value: T;
  debouncedValue: T;
  setValue: (value: T) => void;
  isPending: boolean;
} {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (value !== debouncedValue) {
      setIsPending(true);
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value);
      setIsPending(false);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay, debouncedValue]);

  return { value, debouncedValue, setValue, isPending };
}
