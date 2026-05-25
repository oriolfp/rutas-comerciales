import { useTempsReal } from '../hooks/useTempsReal';
import { groupArrivalsByDestination } from '../utils/groupArrivals';
import type { Linia, Parada } from '../types/tmb';

interface Props {
  linia: Linia;
  parada: Parada;
  enabled: boolean;
}

export function StopPopup({ linia, parada, enabled }: Props) {
  const { data, loading, error } = useTempsReal(
    linia.tipus,
    linia.codi,
    parada.codi,
    enabled,
  );

  return (
    <div className="stop-popup-content">
      <div className="popup-title">{parada.nom}</div>
      <div>
        <span className="popup-badge" style={{ background: linia.color }}>
          {linia.codi}
        </span>
      </div>
      <TempsRealBlock
        loading={loading}
        error={error}
        data={data}
        liniaCodi={linia.codi}
      />
    </div>
  );
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
  const groups = groupArrivalsByDestination(data.arribades.slice(0, 8));
  return (
    <div className="popup-arrivals">
      {groups.map((g, gi) => (
        <div key={g.destinacio} className="popup-group">
          {gi > 0 && <div className="popup-group-divider" />}
          <div className="popup-group-head">→ {g.destinacio || '—'}</div>
          <ul>
            {g.arribades.map((a, idx) => {
              const isOtherLine = a.liniaCodi && a.liniaCodi !== liniaCodi;
              return (
                <li key={idx}>
                  <span className="popup-dest">
                    {isOtherLine && (
                      <span className="popup-otherline">{a.liniaCodi}</span>
                    )}
                  </span>
                  <span className="popup-time">{a.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
