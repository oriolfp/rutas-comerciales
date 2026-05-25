import { useMemo } from 'react';
import { haversine } from '../utils/distance';
import type {
  Coordinate,
  LiniaAmbComptador,
  ParadaAmbLinies,
  ParadaAprop,
} from '../types/tmb';

interface Result {
  paradesDins: ParadaAprop[];
  linies: LiniaAmbComptador[];
}

export function useParadesAprop(
  centre: Coordinate | null,
  radiM: number,
  parades: ParadaAmbLinies[],
): Result {
  return useMemo(() => {
    if (!centre || parades.length === 0) {
      return { paradesDins: [], linies: [] };
    }

    const paradesDins: ParadaAprop[] = [];
    for (const p of parades) {
      const distanciaM = haversine(centre, { lat: p.lat, lng: p.lng });
      if (distanciaM <= radiM) {
        paradesDins.push({ ...p, distanciaM });
      }
    }
    paradesDins.sort((a, b) => a.distanciaM - b.distanciaM);

    const linieMap = new Map<string, LiniaAmbComptador>();
    for (const p of paradesDins) {
      for (const l of p.liniesQueParen) {
        const existing = linieMap.get(l.id);
        if (existing) {
          existing.numParades += 1;
        } else {
          linieMap.set(l.id, { ...l, numParades: 1 });
        }
      }
    }
    const linies = [...linieMap.values()].sort((a, b) => {
      if (b.numParades !== a.numParades) return b.numParades - a.numParades;
      return a.codi.localeCompare(b.codi);
    });

    return { paradesDins, linies };
  }, [centre, radiM, parades]);
}
