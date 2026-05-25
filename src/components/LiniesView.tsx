import { useMemo, useState } from 'react';
import { FilterBar } from './FilterBar';
import { LineList } from './LineList';
import { MapView } from './MapView';
import { SearchInput } from './SearchInput';
import { useLinies } from '../hooks/useLinies';
import { useParades } from '../hooks/useParades';
import { useVehicles } from '../hooks/useVehicles';
import { extrapolateVehiclePosition } from '../utils/route';
import { SPEED_M_S } from '../utils/transit';
import type { Linia, Parada, VehiclePos } from '../types/tmb';

export function LiniesView() {
  const {
    liniesFiltrades,
    loading,
    error,
    filtre,
    setFiltre,
    cerca,
    setCerca,
  } = useLinies();
  const [seleccio, setSeleccio] = useState<Linia | null>(null);
  const { parades, loading: paradesLoading, error: paradesError } = useParades(
    seleccio?.id ?? null,
  );

  const {
    data: vehiclesData,
    refresh: refreshVehicles,
  } = useVehicles({
    tipus: seleccio?.tipus ?? null,
    liniaCodi: seleccio?.codi ?? null,
    enabled: !!seleccio,
  });

  const vehiclesAmbPos = useMemo<VehiclePos[]>(() => {
    if (!seleccio || !vehiclesData) return [];
    const polyline = polylineFromLinia(seleccio, parades);
    if (polyline.length < 2) return [];
    const speed = SPEED_M_S[seleccio.tipus];
    const out: VehiclePos[] = [];
    for (const v of vehiclesData.vehicles) {
      const nextStop = parades.find((p) => p.codi === v.properaParadaCodi);
      if (!nextStop) continue;
      const pos = extrapolateVehiclePosition({
        polyline,
        nextStop: { lat: nextStop.lat, lng: nextStop.lng },
        minutsFinsProperaParada: v.minutsFinsProperaParada,
        speedMS: speed,
      });
      if (!pos) continue;
      out.push({ ...v, ...pos });
    }
    return out;
  }, [seleccio, vehiclesData, parades]);

  const liniaAmbParades: Linia | null = seleccio
    ? { ...seleccio, numParades: parades.length || seleccio.numParades }
    : null;

  return (
    <main className="app-main">
      <aside className="panel">
        <FilterBar value={filtre} onChange={setFiltre} />
        <SearchInput value={cerca} onChange={setCerca} />
        <LineList
          linies={liniesFiltrades}
          loading={loading}
          error={error}
          selectedId={seleccio?.id ?? null}
          onSelect={setSeleccio}
        />
      </aside>
      <section className="map-area" aria-label="Mapa de parades">
        <MapView
          linia={liniaAmbParades}
          parades={parades}
          vehicles={vehiclesAmbPos}
          onRefreshVehicles={seleccio ? refreshVehicles : undefined}
        />
        {seleccio && paradesLoading && (
          <div className="map-overlay">Carregant parades…</div>
        )}
        {seleccio && paradesError && (
          <div className="map-overlay map-overlay--error" role="alert">
            No s'han pogut carregar les parades.
          </div>
        )}
        {!seleccio && (
          <div className="map-hint">Selecciona una línia per veure les parades</div>
        )}
      </section>
    </main>
  );
}

function polylineFromLinia(linia: Linia, parades: Parada[]) {
  if (linia.geometry) {
    if (linia.geometry.type === 'LineString') {
      return linia.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
    }
    return linia.geometry.coordinates.flat().map(([lng, lat]) => ({ lat, lng }));
  }
  return parades.map((p) => ({ lat: p.lat, lng: p.lng }));
}
