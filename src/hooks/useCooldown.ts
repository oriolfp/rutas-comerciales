import { useCallback, useEffect, useRef, useState } from 'react';

interface UseCooldownResult {
  remainingMs: number;
  isActive: boolean;
  start: () => void;
  reset: () => void;
  formatted: string;
}

export function useCooldown(durationMs: number): UseCooldownResult {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (endsAt === null) return;
    intervalRef.current = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, [endsAt]);

  useEffect(() => {
    if (endsAt !== null && now >= endsAt) {
      setEndsAt(null);
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [endsAt, now]);

  const remainingMs = endsAt === null ? 0 : Math.max(0, endsAt - now);
  const isActive = remainingMs > 0;

  const start = useCallback(() => {
    setNow(Date.now());
    setEndsAt(Date.now() + durationMs);
  }, [durationMs]);

  const reset = useCallback(() => {
    setEndsAt(null);
  }, []);

  return {
    remainingMs,
    isActive,
    start,
    reset,
    formatted: formatMmSs(remainingMs),
  };
}

function formatMmSs(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
