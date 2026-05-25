import type { Coordinate, LiniaResum, ParadaAmbLinies } from '../types/tmb';
import { haversine } from './distance';

// Returns the unique lines (excluding `excludeLiniaId`) whose stops sit
// within `maxDistanceM` metres from the given point. Used to surface
// transbordaments on the line-list view.
export function findCorrespondences(
  centre: Coordinate,
  totesParades: ParadaAmbLinies[],
  excludeLiniaId: string | null,
  maxDistanceM = 50,
): LiniaResum[] {
  const out = new Map<string, LiniaResum>();
  for (const p of totesParades) {
    const d = haversine(centre, { lat: p.lat, lng: p.lng });
    if (d > maxDistanceM) continue;
    for (const l of p.liniesQueParen) {
      if (excludeLiniaId && l.id === excludeLiniaId) continue;
      if (!out.has(l.id)) out.set(l.id, l);
    }
  }
  return [...out.values()];
}
