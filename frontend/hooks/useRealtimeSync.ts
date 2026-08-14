'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { RealtimeEvent } from '@/types';

/**
 * Subscribes to WebSocket events and keeps React Query caches in sync.
 * Also exposes a short activity feed for the dashboard.
 */
export function useRealtimeSync(maxEvents = 30) {
  const queryClient = useQueryClient();
  const [events, setEvents] = useState<RealtimeEvent[]>([]);

  const onEvent = useCallback(
    (event: RealtimeEvent) => {
      if (event.type === 'SYSTEM_STATUS') {
        return;
      }

      setEvents((prev) => [event, ...prev].slice(0, maxEvents));

      if (event.channel === 'feature-flags') {
        const payload = event.payload as { flagKey?: string };
        void queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
        if (payload.flagKey) {
          void queryClient.invalidateQueries({
            queryKey: ['feature-flag', payload.flagKey],
          });
        }
      }

      if (event.channel === 'incidents') {
        const payload = event.payload as { incidentId?: string; number?: string };
        void queryClient.invalidateQueries({ queryKey: ['incidents'] });
        if (payload.number) {
          void queryClient.invalidateQueries({
            queryKey: ['incident', payload.number],
          });
        }
        if (payload.incidentId) {
          void queryClient.invalidateQueries({
            queryKey: ['incident', payload.incidentId],
          });
        }
        // Emergency flag actions also change flags
        void queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      }
    },
    [maxEvents, queryClient],
  );

  const { status, lastEvent } = useWebSocket(onEvent);

  return { status, lastEvent, events };
}
