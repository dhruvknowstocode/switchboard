'use client';

import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query client factory.
 * TODO: Phase 3+ — tune staleTime for flags/incidents; invalidate on WS events.
 */
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
