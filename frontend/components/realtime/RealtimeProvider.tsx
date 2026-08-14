'use client';

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import type { RealtimeEvent, WsConnectionStatus } from '@/types';

interface RealtimeContextValue {
  status: WsConnectionStatus;
  lastEvent: RealtimeEvent | null;
  events: RealtimeEvent[];
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const value = useRealtimeSync();
  return (
    <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return ctx;
}
