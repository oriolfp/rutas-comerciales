import type { Coordinate } from '../types/tmb';
import type { GeoStatus } from '../hooks/useGeolocation';

interface Props {
  position: Coordinate | null;
  accuracy: number | null;
  status: GeoStatus;
  error: string | null;
  onRefresh: () => void;
  radius: number;
  onRadiusChange: (r: number) => void;
}

export function LocationBlock({
  position,
  accuracy,
  status,
  error,
  onRefresh,
  radius,
  onRadiusChange,
}: Props) {
  return (
    <div className="location-block">
      <div className="location-row">
        <div className="geo-dot" data-status={status} />
        <div className="location-info">
          <div className="location-title">{titleFor(status)}</div>
          <div className="location-sub">{subtitleFor(status, position, accuracy, error)}</div>
        </div>
        <button
          type="button"
          className="geo-btn"
          onClick={onRefresh}
          disabled={status === 'requesting'}
        >
          {status === 'requesting' ? 'Buscant…' : 'Actualitzar'}
        </button>
      </div>
      <div className="radius-row">
        <label htmlFor="radius">Radi</label>
        <input
          type="range"
          id="radius"
          min={100}
          max={2000}
          step={50}
          value={radius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
        />
        <span className="radius-value">{formatRadius(radius)}</span>
      </div>
    </div>
  );
}

function titleFor(s: GeoStatus) {
  switch (s) {
    case 'granted':
      return 'La meva ubicació';
    case 'requesting':
      return 'Buscant ubicació…';
    case 'denied':
      return 'Permís denegat';
    case 'unavailable':
      return 'Ubicació no disponible';
    default:
      return 'Sense ubicació';
  }
}

function subtitleFor(
  s: GeoStatus,
  position: Coordinate | null,
  accuracy: number | null,
  error: string | null,
): string {
  if (s === 'granted' && position) {
    const acc = accuracy ? ` · precisió ±${Math.round(accuracy)} m` : '';
    return `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}${acc}`;
  }
  if (s === 'denied' || s === 'unavailable') return error ?? '—';
  if (s === 'requesting') return 'Esperant resposta del navegador…';
  return 'Prem "Actualitzar" per fer servir la teva posició.';
}

function formatRadius(m: number) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}
