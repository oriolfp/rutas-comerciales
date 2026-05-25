import { errorResponse, fetchAllLinies, fetchParades } from './_tmb';
import type {
  LiniaResum,
  ParadaAmbLinies,
} from '../../src/types/tmb';

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const res = await Promise.all(batch.map(fn));
    out.push(...res);
  }
  return out;
}

export default async (): Promise<Response> => {
  try {
    const linies = await fetchAllLinies();

    const results = await mapLimit(linies, 10, async (linia) => {
      try {
        const parades = await fetchParades(linia.id);
        return { linia, parades };
      } catch {
        return { linia, parades: [] };
      }
    });

    // Aggregate by (tipus, codi) so each physical stop appears once with the
    // lines that pass through it.
    const map = new Map<string, ParadaAmbLinies>();
    for (const { linia, parades } of results) {
      const liniaResum: LiniaResum = {
        id: linia.id,
        codi: linia.codi,
        tipus: linia.tipus,
        color: linia.color,
      };
      for (const p of parades) {
        if (!p.codi || !Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
        const key = `${linia.tipus}|${p.codi}`;
        const existing = map.get(key);
        if (existing) {
          if (!existing.liniesQueParen.some((l) => l.id === liniaResum.id)) {
            existing.liniesQueParen.push(liniaResum);
          }
        } else {
          map.set(key, {
            id: `${linia.tipus}-${p.codi}`,
            codi: p.codi,
            nom: p.nom,
            lat: p.lat,
            lng: p.lng,
            tipus: linia.tipus,
            liniesQueParen: [liniaResum],
          });
        }
      }
    }

    const stops = [...map.values()];
    return new Response(JSON.stringify(stops), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        // Long edge cache: the stop list barely changes day-to-day.
        'cache-control': 'public, max-age=300',
        'netlify-cdn-cache-control': 'public, max-age=300, durable',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(502, message);
  }
};

export const config = { path: '/api/parades-all' };
