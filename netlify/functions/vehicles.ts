import {
  errorResponse,
  fetchIBusBatch,
  fetchIMetroBatch,
  fetchParades,
  NormalisedArrival,
  parseLiniaId,
} from './_tmb';
import type {
  CuaParada,
  Parada,
  TransportType,
  VehicleRaw,
  VehiclesResposta,
} from '../../src/types/tmb';

export default async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    // Path: /api/vehicles/{liniaId}/{liniaCodi}
    // liniaId = "bus-1006" (carries CODI_LINIA, needed by fetchParades)
    // liniaCodi = "H6"     (NOM_LINIA, needed for iBus/iMetro filter)
    const pathParam = url.searchParams.get('path');
    const segments = (pathParam ?? url.pathname.replace(/^.*vehicles\/?/, ''))
      .split('/')
      .map((s) => decodeURIComponent(s))
      .filter(Boolean);
    const [liniaId, liniaCodi] = segments;
    if (!liniaId || !liniaCodi) {
      return errorResponse(400, 'Falten paràmetres liniaId/liniaCodi');
    }

    let tipus: TransportType;
    try {
      tipus = parseLiniaId(liniaId).tipus;
    } catch (err) {
      return errorResponse(400, err instanceof Error ? err.message : String(err));
    }

    let parades: Parada[];
    try {
      parades = await fetchParades(liniaId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return errorResponse(502, `No s'han pogut carregar les parades: ${message}`);
    }

    if (parades.length === 0) {
      return jsonVehiclesResponse({ actualitzat: new Date().toISOString(), vehicles: [] });
    }

    let arribades: NormalisedArrival[];
    try {
      arribades =
        tipus === 'bus'
          ? await fetchIBusBatch(liniaCodi, parades.map((p) => p.codi))
          : await fetchIMetroBatch(liniaCodi, parades.map((p) => p.codi));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return jsonVehiclesResponse({
        actualitzat: new Date().toISOString(),
        vehicles: [],
        missatge: `Temps real no disponible: ${message}`,
      });
    }

    const vehicles = aggregateVehicles(arribades, parades, tipus);
    return jsonVehiclesResponse({ actualitzat: new Date().toISOString(), vehicles });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(500, message);
  }
};

function jsonVehiclesResponse(body: VehiclesResposta): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=30',
      'netlify-cdn-cache-control': 'public, max-age=30, durable',
    },
  });
}

function aggregateVehicles(
  arribades: NormalisedArrival[],
  parades: Parada[],
  tipus: TransportType,
): VehicleRaw[] {
  const stopByCodi = new Map<string, Parada>();
  for (const p of parades) stopByCodi.set(p.codi, p);

  const stopsBySentit = new Map<string, Parada[]>();
  for (const p of parades) {
    const key = p.sentit ?? 'default';
    const list = stopsBySentit.get(key) ?? [];
    list.push(p);
    stopsBySentit.set(key, list);
  }
  for (const list of stopsBySentit.values()) {
    list.sort((a, b) => a.ordre - b.ordre);
  }

  const grouped = new Map<string, NormalisedArrival[]>();
  for (const a of arribades) {
    if (a.minutsRestants === null) continue;
    const id =
      a.vehicleId ||
      `${a.destinacio}|fallback|${a.paradaCodi}|${a.minutsRestants}`;
    const list = grouped.get(id) ?? [];
    list.push(a);
    grouped.set(id, list);
  }

  const vehicles: VehicleRaw[] = [];
  for (const [id, list] of grouped) {
    list.sort((a, b) => (a.minutsRestants ?? 0) - (b.minutsRestants ?? 0));
    const next = list[0];
    const nextStop = stopByCodi.get(next.paradaCodi);
    if (!nextStop) continue;

    let cua: CuaParada[];
    if (list.length > 1) {
      cua = list.slice(0, 4).map((a) => {
        const sp = stopByCodi.get(a.paradaCodi);
        return {
          codi: a.paradaCodi,
          nom: sp?.nom ?? '',
          minuts: a.minutsRestants ?? 0,
        };
      });
    } else {
      const list2 = stopsBySentit.get(nextStop.sentit ?? 'default') ?? [];
      const idx = list2.findIndex((p) => p.codi === nextStop.codi);
      cua = [
        { codi: nextStop.codi, nom: nextStop.nom, minuts: next.minutsRestants ?? 0 },
      ];
      const stepMin = tipus === 'metro' ? 1.5 : 2;
      for (let k = 1; k < 4 && idx >= 0 && idx + k < list2.length; k += 1) {
        const sp = list2[idx + k];
        cua.push({
          codi: sp.codi,
          nom: sp.nom,
          minuts: Math.round((next.minutsRestants ?? 0) + stepMin * k),
        });
      }
    }

    vehicles.push({
      id,
      destinacio: next.destinacio,
      minutsFinsProperaParada: next.minutsRestants ?? 0,
      properaParadaCodi: next.paradaCodi,
      properaParadaNom: nextStop.nom,
      cuaProperesParades: cua,
    });
  }

  vehicles.sort(
    (a, b) => a.minutsFinsProperaParada - b.minutsFinsProperaParada,
  );
  return vehicles;
}

export const config = { path: '/api/vehicles/*' };
