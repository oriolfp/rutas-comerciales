import { useCallback, useEffect, useState } from 'react';
import type { Coordinate } from '../types/tmb';

export type GeoStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable';

interface UseGeolocationResult {
  position: Coordinate | null;
  accuracy: number | null;
  status: GeoStatus;
  error: string | null;
  refresh: () => void;
}

export function useGeolocation(autoRequest = true): UseGeolocationResult {
  const [position, setPosition] = useState<Coordinate | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      setError('Geolocalització no disponible al navegador.');
      return;
    }
    setStatus('requesting');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy);
        setStatus('granted');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
          setError("Cal permís d'ubicació per a aquest mode.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setStatus('unavailable');
          setError('No s’ha pogut obtenir la posició.');
        } else if (err.code === err.TIMEOUT) {
          setStatus('unavailable');
          setError('S’ha esgotat el temps per obtenir la posició.');
        } else {
          setStatus('unavailable');
          setError(err.message);
        }
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  useEffect(() => {
    if (autoRequest) refresh();
  }, [autoRequest, refresh]);

  return { position, accuracy, status, error, refresh };
}
