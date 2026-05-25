import { useTempsReal } from '../hooks/useTempsReal';
import { groupArrivalsByDestination } from '../utils/groupArrivals';
import type {
  Linia,
  LiniaResum,
  Parada,
  TransportType,
  VehiclePos,
} from '../types/tmb';

interface Props {
  parada: Parada;
  ordre: number;
  correspondencies: LiniaResum[];
  vehiclesNext: VehiclePos[];
  expanded: boolean;
  onToggle: () => void;
  linia: Linia;
}

export function StopRow({
  parada,
  ordre,
  correspondencies,
  vehiclesNext,
  expanded,
  onToggle,
  linia,
}: Props) {
  return (
    <div
      className={`stop-row${expanded ? ' expanded' : ''}`}
      style={expanded ? { borderLeftColor: linia.color } : undefined}
    >
      <button
        type="button"
        className="stop-row-main"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className="stop-row-ordre">{ordre}</span>
        <div className="stop-row-info">
          <div className="stop-row-name" title={parada.nom}>
            {parada.nom}
          </div>
          {correspondencies.length > 0 && (
            <div className="stop-row-corresp">
              {correspondencies.slice(0, 4).map((l) => (
                <span
                  key={l.id}
                  className="corresp-badge"
                  style={{ background: l.color }}
                  title={`${l.tipus === 'metro' ? 'Metro' : 'Bus'} ${l.codi}`}
                >
                  {l.codi}
                </span>
              ))}
              {correspondencies.length > 4 && (
                <span className="corresp-more">+{correspondencies.length - 4}</span>
              )}
            </div>
          )}
        </div>
        <div className="stop-row-vehicles">
          {vehiclesNext.slice(0, 2).map((v) => (
            <VehicleIndicator
              key={v.id}
              vehicle={v}
              color={linia.color}
              tipus={linia.tipus}
            />
          ))}
          {vehiclesNext.length > 2 && (
            <span className="vehicles-more">+{vehiclesNext.length - 2}</span>
          )}
        </div>
        <span className={`stop-row-caret${expanded ? ' open' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>
      {expanded && <StopRowAccordion parada={parada} linia={linia} />}
    </div>
  );
}

function StopRowAccordion({ parada, linia }: { parada: Parada; linia: Linia }) {
  const { data, loading } = useTempsReal(
    linia.tipus,
    linia.codi,
    parada.codi,
    true,
    true, // all=1 so we get arrivals for every line at the stop
  );
  if (loading && !data) return <div className="acc-loading">Carregant temps real…</div>;
  if (!data) return null;
  if (!data.disponible || data.arribades.length === 0) {
    return <div className="acc-empty">Sense vehicles propers ara mateix.</div>;
  }
  const groups = groupArrivalsByDestination(data.arribades.slice(0, 12));
  return (
    <div className="acc-groups">
      {groups.map((g, gi) => (
        <div key={g.destinacio} className="acc-group">
          {gi > 0 && <div className="acc-group-divider" />}
          <div className="acc-group-head">→ {g.destinacio || '—'}</div>
          <ul className="acc-arrivals">
            {g.arribades.map((a, idx) => (
              <li key={`${a.liniaCodi}-${idx}`}>
                <span
                  className="acc-line"
                  style={{ background: colorForLine(a.liniaCodi, linia) }}
                >
                  {a.liniaCodi}
                </span>
                <span className="acc-time">{a.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function colorForLine(codi: string, linia: Linia): string {
  if (codi === linia.codi) return linia.color;
  return '#9aa0a6';
}

function VehicleIndicator({
  vehicle,
  color,
  tipus,
}: {
  vehicle: VehiclePos;
  color: string;
  tipus: TransportType;
}) {
  const minuts = vehicle.minutsFinsProperaParada;
  const showTime = minuts > 0;
  return (
    <div className="list-vehicle-indicator" title={vehicle.destinacio}>
      <span className="lvi-icon">
        {tipus === 'bus' ? <BusSilhouette color={color} /> : <MetroSilhouette color={color} />}
      </span>
      {showTime && <span className="lvi-time">↓ {minuts} min</span>}
    </div>
  );
}

// Compact silhouette — no chevron, no flip. We only convey time + line color
// in the list view, since the row already implies direction by its position.
function BusSilhouette({ color }: { color: string }) {
  return (
    <svg width="24" height="14" viewBox="0 0 36 22" fill="none">
      <rect x="2" y="3" width="32" height="14" rx="3" fill={color} />
      <rect x="4" y="6" width="28" height="4" rx="1" fill="rgba(255,255,255,0.85)" />
      <circle cx="8" cy="18" r="2.5" fill="#1c1c1c" />
      <circle cx="28" cy="18" r="2.5" fill="#1c1c1c" />
    </svg>
  );
}

function MetroSilhouette({ color }: { color: string }) {
  return (
    <svg width="24" height="11" viewBox="0 0 36 18" fill="none">
      <path
        d="M2 4 Q2 2 4 2 L28 2 Q34 2 34 9 Q34 16 28 16 L4 16 Q2 16 2 14 Z"
        fill={color}
      />
      <rect x="5" y="5" width="5" height="4" rx="1" fill="rgba(255,255,255,0.85)" />
      <rect x="12" y="5" width="5" height="4" rx="1" fill="rgba(255,255,255,0.85)" />
      <rect x="19" y="5" width="5" height="4" rx="1" fill="rgba(255,255,255,0.85)" />
    </svg>
  );
}
