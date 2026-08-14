'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Short-lived success / error flash for action feedback.
 */
export function useFlash(timeoutMs = 2500) {
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<'ok' | 'danger'>('ok');

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(null), timeoutMs);
    return () => window.clearTimeout(id);
  }, [message, timeoutMs]);

  const flashOk = useCallback((text: string) => {
    setTone('ok');
    setMessage(text);
  }, []);

  const flashError = useCallback((text: string) => {
    setTone('danger');
    setMessage(text);
  }, []);

  const clear = useCallback(() => setMessage(null), []);

  return { message, tone, flashOk, flashError, clear };
}
