import { useMemo, useState } from 'react';
import { StopRow } from './StopRow';
import type { Linia, LiniaResum, Parada, VehiclePos } from '../types/tmb';

interface Props {
  linia: Linia;
  parades: Parada[];
  vehicles: VehiclePos[];
  correspondencesPerParada: Map<string, LiniaResum[]>;
}

export function LineListView({
  linia,
  parades,
  vehicles,
  correspondencesPerParada,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const columns = useMemo(() => {
    const bySentit = new Map<string, Parada[]>();
    for (const p of parades) {
      const key = p.sentit ?? 'default';
      const list = bySentit.get(key) ?? [];
      list.push(p);
      bySentit.set(key, list);
    }
    for (const list of bySentit.values()) {
      list.sort((a, b) => a.ordre - b.ordre);
    }
    return [...bySentit.entries()].map(([sentit, paradesSent]) => ({
      sentit,
      parades: paradesSent,
      destinacio: paradesSent[paradesSent.length - 1]?.nom ?? sentit,
    }));
  }, [parades]);

  const vehiclesByStop = useMemo(() => {
    const map = new Map<string, VehiclePos[]>();
    for (const v of vehicles) {
      const list = map.get(v.properaParadaCodi) ?? [];
      list.push(v);
      map.set(v.properaParadaCodi, list);
    }
    return map;
  }, [vehicles]);

  const [activeSentit, setActiveSentit] = useState<string>(
    columns[0]?.sentit ?? 'default',
  );

  if (parades.length === 0) {
    return <div className="list-view-empty">Carregant parades…</div>;
  }

  return (
    <div className="line-list-view">
      {columns.length > 1 && (
        <div className="list-sentit-selector" role="tablist" aria-label="Sentit">
          {columns.map((c) => (
            <button
              key={c.sentit}
              type="button"
              role="tab"
              aria-selected={c.sentit === activeSentit}
              className={c.sentit === activeSentit ? 'active' : ''}
              onClick={() => setActiveSentit(c.sentit)}
            >
              → {c.destinacio}
            </button>
          ))}
        </div>
      )}
      <div className={`list-columns${columns.length > 1 ? ' multi' : ''}`}>
        {columns.map((col) => (
          <div
            key={col.sentit}
            className={`list-column${col.sentit === activeSentit ? ' active' : ''}`}
          >
            <div className="list-column-head" style={{ borderTopColor: linia.color }}>
              → {col.destinacio}
            </div>
            <div className="list-column-rows">
              {col.parades.map((p, idx) => (
                <StopRow
                  key={p.id}
                  parada={p}
                  ordre={idx + 1}
                  correspondencies={correspondencesPerParada.get(p.codi) ?? []}
                  vehiclesNext={vehiclesByStop.get(p.codi) ?? []}
                  expanded={expandedId === p.id}
                  onToggle={() =>
                    setExpandedId(expandedId === p.id ? null : p.id)
                  }
                  linia={linia}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
