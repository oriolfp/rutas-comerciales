import { useMemo, useState } from 'react';
import { FilterBar } from './FilterBar';
import { LineHeaderBanner } from './LineHeaderBanner';
import { LineList } from './LineList';
import { LineListView } from './LineListView';
import { MapView } from './MapView';
import { RefreshControl } from './RefreshControl';
import { SearchInput } from './SearchInput';
import { VehicleVisibilityToggle } from './VehicleVisibilityToggle';
import { ViewToggle, type ViewMode } from './ViewToggle';
import { useLinies } from '../hooks/useLinies';
import { useParades } from '../hooks/useParades';
import { useTotesParades } from '../hooks/useTotesParades';
import { useVehicles } from '../hooks/useVehicles';
import { findCorrespondences } from '../utils/correspondences';
import { extrapolateVehiclePosition } from '../utils/route';
import { SPEED_M_S } from '../utils/transit';
import type {
  Linia,
  LiniaResum,
  Parada,
  VehiclePos,
} from '../types/tmb';

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
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [showVehicles, setShowVehicles] = useState(true);

  const { parades, loading: paradesLoading, error: paradesError } = useParades(
    seleccio?.id ?? null,
  );

  const {
    data: vehiclesData,
    refresh: refreshVehicles,
  } = useVehicles({
    liniaId: seleccio?.id ?? null,
    liniaCodi: seleccio?.codi ?? null,
    enabled: !!seleccio,
  });

  // Heavy fetch — only load it when we're actually showing the list view.
  const { parades: totesParades } = useTotesParades(
    viewMode === 'list' && !!seleccio,
  );

  const correspondencesPerParada = useMemo(() => {
    const map = new Map<string, LiniaResum[]>();
    if (viewMode !== 'list' || totesParades.length === 0 || !seleccio) return map;
    for (const p of parades) {
      map.set(
        p.codi,
        findCorrespondences(
          { lat: p.lat, lng: p.lng },
          totesParades,
          seleccio.id,
        ),
      );
    }
    return map;
  }, [viewMode, parades, totesParades, seleccio]);

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
      // Override direccio from the destination's position: a much more robust
      // signal than the local polyline segment direction (which oscillates on
      // vertical sections of the route).
      const destStop = findDestinationStop(parades, v.destinacio);
      const direccio = destStop
        ? destStop.lng >= pos.lng
          ? 'right'
          : 'left'
        : pos.direccio;
      out.push({ ...v, ...pos, direccio });
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
      <section className="map-area" aria-label="Vista de la línia">
        {seleccio && (
          <div className="line-header-wrapper">
            <LineHeaderBanner linia={seleccio} />
          </div>
        )}
        {seleccio && (
          <div className="view-toggle-wrapper">
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>
        )}
        {viewMode === 'map' || !seleccio ? (
          <MapView
            linia={liniaAmbParades}
            parades={parades}
            vehicles={showVehicles ? vehiclesAmbPos : []}
          />
        ) : (
          <LineListView
            linia={seleccio}
            parades={parades}
            vehicles={showVehicles ? vehiclesAmbPos : []}
            correspondencesPerParada={correspondencesPerParada}
          />
        )}
        {seleccio && (
          <div className="map-controls-stack">
            <RefreshControl onRefresh={refreshVehicles} />
            <VehicleVisibilityToggle
              value={showVehicles}
              onChange={setShowVehicles}
              tipus={seleccio.tipus}
            />
          </div>
        )}
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

function findDestinationStop(parades: Parada[], destinacio: string): Parada | null {
  if (!destinacio) return null;
  const target = destinacio.toLowerCase().trim();
  let m = parades.find((p) => p.nom.toLowerCase() === target);
  if (m) return m;
  m = parades.find((p) => p.nom.toLowerCase().includes(target));
  if (m) return m;
  // Try the reverse: the destinacio contains a parada name (e.g. "Onze de
  // Setembre" matches a parada literally named "Onze de Setembre").
  m = parades.find((p) => target.includes(p.nom.toLowerCase()));
  return m ?? null;
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
