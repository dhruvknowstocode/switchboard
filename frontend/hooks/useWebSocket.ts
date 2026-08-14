'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeEvent, WsConnectionStatus } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000/ws';
const MAX_BACKOFF_MS = 15_000;

/**
 * WebSocket hook with reconnect backoff for realtime dashboard updates.
 */
export function useWebSocket(onEvent?: (event: RealtimeEvent) => void) {
  const [status, setStatus] = useState<WsConnectionStatus>('disconnected');
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let socket: WebSocket | null = null;
    let cancelled = false;
    let attempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (cancelled) return;

      try {
        setStatus(attempt === 0 ? 'connecting' : 'connecting');
        socket = new WebSocket(WS_URL);

        socket.onopen = () => {
          if (cancelled) return;
          attempt = 0;
          setStatus('connected');
        };

        socket.onmessage = (message) => {
          try {
            const event = JSON.parse(String(message.data)) as RealtimeEvent;
            setLastEvent(event);
            onEventRef.current?.(event);
          } catch {
            // ignore malformed
          }
        };

        socket.onerror = () => {
          if (!cancelled) setStatus('error');
        };

        socket.onclose = () => {
          if (cancelled) return;
          setStatus('disconnected');
          const delay = Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS);
          attempt += 1;
          reconnectTimer = setTimeout(connect, delay);
        };
      } catch {
        setStatus('error');
        const delay = Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS);
        attempt += 1;
        reconnectTimer = setTimeout(connect, delay);
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  return { status, lastEvent };
}
