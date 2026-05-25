import L from 'leaflet';
import { useMemo } from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import type { TransportType, VehiclePos } from '../types/tmb';

interface Props {
  vehicle: VehiclePos;
  liniaCodi: string;
  color: string;
  tipus: TransportType;
}

export function VehicleMarker({ vehicle, liniaCodi, color, tipus }: Props) {
  const icon = useMemo(
    () => buildIcon(tipus, color, vehicle.direccio),
    [tipus, color, vehicle.direccio],
  );

  return (
    <Marker position={[vehicle.lat, vehicle.lng]} icon={icon}>
      <Tooltip direction="top" offset={[0, -10]} className="vehicle-tooltip">
        <span className="vehicle-tooltip-line" style={{ background: color }}>
          {liniaCodi}
        </span>
        <span className="vehicle-tooltip-dest">{vehicle.destinacio || '—'}</span>
      </Tooltip>
      <Popup className="vehicle-popup">
        <div className="vehicle-popup-head">
          <span className="vehicle-popup-line" style={{ background: color }}>
            {liniaCodi}
          </span>
          <span className="vehicle-popup-dest">{vehicle.destinacio || 'Sense destí'}</span>
        </div>
        {vehicle.cuaProperesParades.length > 0 && (
          <ul className="vehicle-popup-queue">
            {vehicle.cuaProperesParades.map((p, idx) => (
              <li key={p.codi} className={idx === 0 ? 'next' : ''}>
                <span className="queue-name">{p.nom}</span>
                <span className="queue-time">{formatMin(p.minuts)}</span>
              </li>
            ))}
          </ul>
        )}
      </Popup>
    </Marker>
  );
}

function formatMin(m: number): string {
  if (m <= 0) return 'Arribant';
  return `${m} min`;
}

function buildIcon(
  tipus: TransportType,
  color: string,
  direccio: 'left' | 'right',
): L.DivIcon {
  const svg = tipus === 'bus' ? busSvg(color) : metroSvg(color);
  const flipClass = direccio === 'left' ? ' flip' : '';
  return L.divIcon({
    html: `<div class="vehicle-icon${flipClass}">${svg}</div>`,
    className: 'vehicle-icon-wrapper',
    iconSize: tipus === 'bus' ? [52, 28] : [52, 22],
    iconAnchor: tipus === 'bus' ? [26, 14] : [26, 11],
  });
}

// Bus — variant C from mockup v3: symmetric rectangle + chevron arrow detached on
// the front side. Direction comes from the chevron + horizontal flip.
function busSvg(color: string): string {
  return `<svg width="52" height="28" viewBox="0 0 52 28" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="6" width="36" height="16" rx="3" fill="${color}"/>
    <rect x="4" y="9" width="32" height="5" rx="1" fill="rgba(255,255,255,0.85)"/>
    <line x1="14" y1="9" x2="14" y2="14" stroke="${color}" stroke-width="0.8"/>
    <line x1="24" y1="9" x2="24" y2="14" stroke="${color}" stroke-width="0.8"/>
    <circle cx="9" cy="23" r="3.2" fill="#1c1c1c"/>
    <circle cx="31" cy="23" r="3.2" fill="#1c1c1c"/>
    <path d="M42 9 L48 14 L42 19" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

// Metro — rounded nose silhouette. Direction baked into the shape (nose on right).
function metroSvg(color: string): string {
  return `<svg width="52" height="22" viewBox="0 0 52 22" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 4 Q3 2 5 2 L42 2 Q50 2 50 11 Q50 20 42 20 L5 20 Q3 20 3 18 Z" fill="${color}"/>
    <rect x="6" y="5" width="6" height="5" rx="1" fill="rgba(255,255,255,0.85)"/>
    <rect x="14" y="5" width="6" height="5" rx="1" fill="rgba(255,255,255,0.85)"/>
    <rect x="22" y="5" width="6" height="5" rx="1" fill="rgba(255,255,255,0.85)"/>
    <circle cx="46" cy="14" r="1.4" fill="#fff7c2"/>
    <line x1="32" y1="3" x2="32" y2="19" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>
  </svg>`;
}
