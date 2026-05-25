import { useEffect, useState } from 'react';
import { getTempsReal } from '../services/tmb';
import type { TempsRealResposta, TransportType } from '../types/tmb';

interface UseTempsRealResult {
  data: TempsRealResposta | null;
  loading: boolean;
  error: string | null;
}

const REFRESH_MS = 60_000;

export function useTempsReal(
  tipus: TransportType | null,
  liniaCodi: string | null,
  paradaCodi: string | null,
  enabled: boolean,
  all = false,
): UseTempsRealResult {
  const [data, setData] = useState<TempsRealResposta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !tipus || !liniaCodi || !paradaCodi) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    let cancel = false;
    const fetchOnce = () => {
      setLoading(true);
      getTempsReal(tipus, liniaCodi, paradaCodi, all)
        .then((res) => {
          if (cancel) return;
          setData(res);
          setError(null);
        })
        .catch((err: Error) => {
          if (cancel) return;
          setError(err.message);
        })
        .finally(() => {
          if (!cancel) setLoading(false);
        });
    };
    fetchOnce();
    const id = window.setInterval(fetchOnce, REFRESH_MS);
    return () => {
      cancel = true;
      window.clearInterval(id);
    };
  }, [tipus, liniaCodi, paradaCodi, enabled, all]);

  return { data, loading, error };
}
