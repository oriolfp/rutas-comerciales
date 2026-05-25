import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
} from 'react-leaflet';
import { StopMarker } from './StopMarker';
import { VehicleMarker } from './VehicleMarker';
import type { Linia, Parada, VehiclePos } from '../types/tmb';

const BARCELONA_CENTER: [number, number] = [41.3874, 2.1686];
const DEFAULT_ZOOM = 13;

interface Props {
  linia: Linia | null;
  parades: Parada[];
  vehicles?: VehiclePos[];
}

export function MapView({ linia, parades, vehicles }: Props) {
  const polylinePoints = useMemo<[number, number][][]>(() => {
    if (linia?.geometry) {
      if (linia.geometry.type === 'LineString') {
        return [linia.geometry.coordinates.map(([lng, lat]) => [lat, lng])];
      }
      return linia.geometry.coordinates.map((seg) =>
        seg.map(([lng, lat]) => [lat, lng] as [number, number]),
      );
    }
    if (parades.length > 1) {
      return [parades.map((p) => [p.lat, p.lng])];
    }
    return [];
  }, [linia, parades]);

  return (
    <MapContainer
      center={BARCELONA_CENTER}
      zoom={DEFAULT_ZOOM}
      className="map-container"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains={['a', 'b', 'c', 'd']}
        maxZoom={20}
      />
      {linia && polylinePoints.map((segment, idx) => (
        <Polyline
          key={`${linia.id}-${idx}`}
          positions={segment}
          pathOptions={{ color: linia.color, weight: 5, opacity: 0.9 }}
        />
      ))}
      {linia &&
        parades.map((p, idx) => (
          <StopMarker
            key={p.id}
            linia={linia}
            parada={p}
            terminal={idx === 0 || idx === parades.length - 1}
          />
        ))}
      {linia && vehicles &&
        vehicles.map((v) => (
          <VehicleMarker
            key={v.id}
            vehicle={v}
            liniaCodi={linia.codi}
            color={linia.color}
            tipus={linia.tipus}
          />
        ))}
      <AutoFit linia={linia} parades={parades} />
      <InvalidateOnResize />
    </MapContainer>
  );
}

function AutoFit({ linia, parades }: { linia: Linia | null; parades: Parada[] }) {
  const map = useMap();
  useEffect(() => {
    if (!linia) return;
    const bounds = L.latLngBounds([]);
    if (linia.geometry) {
      const coords =
        linia.geometry.type === 'LineString'
          ? linia.geometry.coordinates
          : linia.geometry.coordinates.flat();
      coords.forEach(([lng, lat]) => bounds.extend([lat, lng]));
    }
    parades.forEach((p) => bounds.extend([p.lat, p.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [linia, parades, map]);
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
