// Data Fetcher Hook with caching
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/types';

interface UseDataFetcherOptions {
  enabled?: boolean;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
  cacheTime?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

interface UseDataFetcherReturn<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: any;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
}

// Simple cache implementation
const cache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

export function useDataFetcher<T = any>(
  url: string | null,
  options: UseDataFetcherOptions = {}
): UseDataFetcherReturn<T> {
  const {
    enabled = true,
    refetchInterval,
    refetchOnWindowFocus = false,
    cacheTime = DEFAULT_CACHE_TIME,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  const intervalRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef<boolean>(true);

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return;

    // Check cache first
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      setData(cached.data);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const response: ApiResponse<T> = await apiClient.get(url);

      if (!mountedRef.current) return;

      if (response.success && response.data) {
        setData(response.data);
        cache.set(url, { data: response.data, timestamp: Date.now() });
        onSuccess?.(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch data');
      }
    } catch (err: any) {
      if (!mountedRef.current) return;

      setIsError(true);
      setError(err);
      onError?.(err);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [url, enabled, cacheTime, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch interval
  useEffect(() => {
    if (refetchInterval && enabled && url) {
      intervalRef.current = setInterval(fetchData, refetchInterval);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, url, fetchData]);

  // Refetch on window focus
  useEffect(() => {
    if (refetchOnWindowFocus && enabled && url) {
      const handleFocus = () => fetchData();
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [refetchOnWindowFocus, enabled, url, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const mutate = useCallback((newData: T) => {
    setData(newData);
    if (url) {
      cache.set(url, { data: newData, timestamp: Date.now() });
    }
  }, [url]);

  return {
    data,
    isLoading,
    isError,
    error,
    refetch: fetchData,
    mutate,
  };
}

// Mutation hook for POST/PUT/DELETE operations
export function useDataMutation<TData = any, TVariables = any>() {
  const [data, setData] = useState<TData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  const mutate = useCallback(
    async (
      method: 'post' | 'put' | 'patch' | 'delete',
      url: string,
      variables?: TVariables
    ) => {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        let response: ApiResponse<TData>;

        switch (method) {
          case 'post':
            response = await apiClient.post(url, variables);
            break;
          case 'put':
            response = await apiClient.put(url, variables);
            break;
          case 'patch':
            response = await apiClient.patch(url, variables);
            break;
          case 'delete':
            response = await apiClient.delete(url);
            break;
        }

        if (response.success && response.data) {
          setData(response.data);
          return response.data;
        } else {
          throw new Error(response.error?.message || 'Mutation failed');
        }
      } catch (err: any) {
        setIsError(true);
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    setIsError(false);
    setError(null);
  }, []);

  return {
    data,
    isLoading,
    isError,
    error,
    mutate,
    reset,
  };
}
