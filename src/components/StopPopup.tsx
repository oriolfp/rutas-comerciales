import { useTempsReal } from '../hooks/useTempsReal';
import type { Linia, Parada } from '../types/tmb';

const HAS_REALTIME: Linia['tipus'][] = ['bus', 'metro'];

interface Props {
  linia: Linia;
  parada: Parada;
  enabled: boolean;
}

export function StopPopup({ linia, parada, enabled }: Props) {
  const supportsRealTime = HAS_REALTIME.includes(linia.tipus);
  const { data, loading, error } = useTempsReal(
    supportsRealTime ? linia.tipus : null,
    linia.codi,
    parada.codi,
    enabled && supportsRealTime,
  );

  return (
    <div className="stop-popup-content">
      <div className="popup-title">{parada.nom}</div>
      <div>
        <span className="popup-badge" style={{ background: linia.color }}>
          {linia.codi}
        </span>
      </div>
      {supportsRealTime ? (
        <TempsRealBlock
          loading={loading}
          error={error}
          data={data}
          liniaCodi={linia.codi}
        />
      ) : (
        <div className="popup-note">
          Temps real no disponible per a {labelTipus(linia.tipus)}.
        </div>
      )}
    </div>
  );
}

function labelTipus(t: Linia['tipus']) {
  switch (t) {
    case 'metro':
      return 'metro';
    case 'tramvia':
      return 'tramvia';
    case 'fgc':
      return 'FGC';
    case 'rodalies':
      return 'Rodalies';
    default:
      return 'aquest mode';
  }
}

function TempsRealBlock({
  loading,
  error,
  data,
  liniaCodi,
}: {
  loading: boolean;
  error: string | null;
  data: ReturnType<typeof useTempsReal>['data'];
  liniaCodi: string;
}) {
  if (loading && !data) return <div className="popup-loading">Consultant temps real…</div>;
  if (error) return <div className="popup-error">Temps real no disponible.</div>;
  if (!data) return null;
  if (!data.disponible || data.arribades.length === 0) {
    return <div className="popup-note">Sense vehicles propers ara mateix.</div>;
  }
  return (
    <ul className="popup-arrivals">
      {data.arribades.slice(0, 5).map((a, idx) => {
        const isOtherLine = a.liniaCodi && a.liniaCodi !== liniaCodi;
        return (
          <li key={idx}>
            <span className="popup-dest">
              {isOtherLine && (
                <span className="popup-otherline">{a.liniaCodi}</span>
              )}
              {a.destinacio || '—'}
            </span>
            <span className="popup-time">{a.text}</span>
          </li>
        );
      })}
    </ul>
  );
}
