'use client';

import { QueryClient } from '@tanstack/react-query';

/** Shared TanStack Query client for the control plane. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
