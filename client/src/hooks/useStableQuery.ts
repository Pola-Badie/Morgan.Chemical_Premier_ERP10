import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useRef, useEffect } from 'react';

// Custom hook for stable queries that prevents memory leaks
export function useStableQuery<TData = unknown, TError = unknown>(
  options: UseQueryOptions<TData, TError>
) {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useQuery({
    ...options,
    enabled: options.enabled !== false && isMountedRef.current,
  });
}