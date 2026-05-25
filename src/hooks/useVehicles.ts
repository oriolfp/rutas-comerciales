import { useCallback, useEffect, useState } from 'react';
import { getVehicles } from '../services/tmb';
import type { TransportType, VehiclesResposta } from '../types/tmb';

interface UseVehiclesArgs {
  tipus: TransportType | null;
  liniaCodi: string | null;
  enabled: boolean;
}

interface UseVehiclesResult {
  data: VehiclesResposta | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  refresh: () => Promise<void>;
}

export function useVehicles({
  tipus,
  liniaCodi,
  enabled,
}: UseVehiclesArgs): UseVehiclesResult {
  const [data, setData] = useState<VehiclesResposta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);

  const fetchNow = useCallback(async () => {
    if (!enabled || !tipus || !liniaCodi) return;
    setLoading(true);
    try {
      const res = await getVehicles(tipus, liniaCodi);
      setData(res);
      setError(null);
      setLastFetchedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [enabled, tipus, liniaCodi]);

  useEffect(() => {
    if (!enabled || !tipus || !liniaCodi) {
      setData(null);
      setError(null);
      setLastFetchedAt(null);
      return;
    }
    fetchNow();
  }, [enabled, tipus, liniaCodi, fetchNow]);

  return { data, loading, error, lastFetchedAt, refresh: fetchNow };
}
