import L from 'leaflet';
import { useEffect } from 'react';
import {
  Circle,
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import type { Coordinate, ParadaAprop } from '../types/tmb';

const FALLBACK_CENTER: [number, number] = [41.3874, 2.1686];

interface Props {
  centre: Coordinate | null;
  radiM: number;
  parades: ParadaAprop[];
  topN: number;
}

export function AproperMeuMap({ centre, radiM, parades, topN }: Props) {
  return (
    <MapContainer
      center={centre ? [centre.lat, centre.lng] : FALLBACK_CENTER}
      zoom={15}
      className="map-container"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains={['a', 'b', 'c', 'd']}
        maxZoom={20}
      />
      {centre && (
        <>
          <Circle
            center={[centre.lat, centre.lng]}
            radius={radiM}
            pathOptions={{
              color: '#1d7df2',
              fillColor: '#1d7df2',
              fillOpacity: 0.08,
              weight: 2,
              dashArray: '6 5',
            }}
          />
          <CircleMarker
            center={[centre.lat, centre.lng]}
            radius={8}
            pathOptions={{
              color: '#ffffff',
              weight: 3,
              fillColor: '#1d7df2',
              fillOpacity: 1,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]} className="user-tooltip">
              Tu
            </Tooltip>
          </CircleMarker>
          <FitToCircle centre={centre} radiM={radiM} />
        </>
      )}
      {parades.map((p, idx) => {
        const rank = idx + 1;
        const isTop = rank <= topN;
        const color = p.liniesQueParen[0]?.color ?? '#666';
        return (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={isTop ? 10 : 5}
            pathOptions={{
              color: '#ffffff',
              weight: isTop ? 3 : 1.5,
              fillColor: color,
              fillOpacity: 1,
            }}
          >
            <Tooltip direction="top" offset={[0, -4]} className="stop-tooltip">
              {isTop && <span className="rank-mini">{rank}</span>}
              <span className="tooltip-name">{p.nom}</span>
            </Tooltip>
          </CircleMarker>
        );
      })}
      <InvalidateOnResize />
    </MapContainer>
  );
}

function FitToCircle({ centre, radiM }: { centre: Coordinate; radiM: number }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLng(centre.lat, centre.lng).toBounds(radiM * 2);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [centre.lat, centre.lng, radiM, map]);
  return null;
}

function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const handler = () => map.invalidateSize();
    window.addEventListener('resize', handler);
    const t = window.setTimeout(handler, 100);
    return () => {
      window.removeEventListener('resize', handler);
      window.clearTimeout(t);
    };
  }, [map]);
  return null;
}
