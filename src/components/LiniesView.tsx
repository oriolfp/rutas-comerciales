import { useState } from 'react';
import { FilterBar } from './FilterBar';
import { LineList } from './LineList';
import { MapView } from './MapView';
import { SearchInput } from './SearchInput';
import { useLinies } from '../hooks/useLinies';
import { useParades } from '../hooks/useParades';
import type { Linia } from '../types/tmb';

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
        <MapView linia={liniaAmbParades} parades={parades} />
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
