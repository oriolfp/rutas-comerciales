import { useEffect, useState } from 'react';
import { getParadesAll } from '../services/tmb';
import type { ParadaAmbLinies } from '../types/tmb';

interface Result {
  parades: ParadaAmbLinies[];
  loading: boolean;
  error: string | null;
}

export function useTotesParades(enabled = true): Result {
  const [parades, setParades] = useState<ParadaAmbLinies[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancel = false;
    setLoading(true);
    setError(null);
    getParadesAll()
      .then((data) => {
        if (cancel) return;
        setParades(data);
      })
      .catch((err: Error) => {
        if (cancel) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [enabled]);

  return { parades, loading, error };
}
