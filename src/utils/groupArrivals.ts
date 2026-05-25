import type { TempsRealArribada } from '../types/tmb';

export interface ArribadaGroup {
  destinacio: string;
  arribades: TempsRealArribada[];
}

// Splits a flat list of arrivals into groups keyed by destinacio, preserving
// the relative arrival order (closest first). Groups are themselves sorted
// by their first arrival's minutsRestants so the next-coming direction is
// always shown first.
export function groupArrivalsByDestination(
  arribades: TempsRealArribada[],
): ArribadaGroup[] {
  const map = new Map<string, TempsRealArribada[]>();
  for (const a of arribades) {
    const key = a.destinacio || '—';
    const list = map.get(key) ?? [];
    list.push(a);
    map.set(key, list);
  }
  const groups: ArribadaGroup[] = [...map.entries()].map(([destinacio, arribades]) => ({
    destinacio,
    arribades: [...arribades].sort(
      (a, b) => (a.minutsRestants ?? 0) - (b.minutsRestants ?? 0),
    ),
  }));
  groups.sort((a, b) => {
    const am = a.arribades[0]?.minutsRestants ?? Number.POSITIVE_INFINITY;
    const bm = b.arribades[0]?.minutsRestants ?? Number.POSITIVE_INFINITY;
    return am - bm;
  });
  return groups;
}
