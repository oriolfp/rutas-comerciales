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

// Aggregates raw arrivals into unique vehicles.
// - Metro provides `codi_servei` which is a real train id → group by it.
// - Bus returns `routeId` but it's the trip/direction id (shared by every bus
//   in that direction) — not unique per vehicle. So for bus we walk
//   "trajectories": starting from the closest arrival in each direction we
//   absorb later-stop arrivals whose minuts grow consistently with travel
//   time, then move on to the next closest unabsorbed arrival.
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

  const withId: NormalisedArrival[] = [];
  const withoutId: NormalisedArrival[] = [];
  for (const a of arribades) {
    if (a.minutsRestants === null) continue;
    if (!stopByCodi.has(a.paradaCodi)) continue;
    if (a.vehicleId && tipus === 'metro') withId.push(a);
    else withoutId.push(a);
  }

  const vehicles: VehicleRaw[] = [];

  // Path 1: metro — group by codi_servei (real train id).
  const byVehicleId = new Map<string, NormalisedArrival[]>();
  for (const a of withId) {
    const list = byVehicleId.get(a.vehicleId!) ?? [];
    list.push(a);
    byVehicleId.set(a.vehicleId!, list);
  }
  for (const [id, list] of byVehicleId) {
    list.sort((a, b) => (a.minutsRestants ?? 0) - (b.minutsRestants ?? 0));
    const head = list[0];
    const headStop = stopByCodi.get(head.paradaCodi)!;
    vehicles.push({
      id,
      destinacio: head.destinacio,
      minutsFinsProperaParada: head.minutsRestants ?? 0,
      properaParadaCodi: head.paradaCodi,
      properaParadaNom: headStop.nom,
      cuaProperesParades: buildQueueFromList(list, stopByCodi),
    });
  }

  // Path 2: bus (or metro without ids) — trajectory walk per direction.
  const stepMin = tipus === 'metro' ? 1.2 : 1.5;
  const byDest = new Map<string, NormalisedArrival[]>();
  for (const a of withoutId) {
    const list = byDest.get(a.destinacio) ?? [];
    list.push(a);
    byDest.set(a.destinacio, list);
  }

  let seq = 0;
  for (const [destinacio, arrivals] of byDest) {
    const remaining = [...arrivals];
    while (remaining.length > 0) {
      remaining.sort((a, b) => (a.minutsRestants ?? 0) - (b.minutsRestants ?? 0));
      const head = remaining.shift()!;
      const headStop = stopByCodi.get(head.paradaCodi)!;
      const headMin = head.minutsRestants ?? 0;
      const trajectory: NormalisedArrival[] = [head];

      for (let i = remaining.length - 1; i >= 0; i--) {
        const a = remaining[i];
        const aStop = stopByCodi.get(a.paradaCodi);
        if (!aStop) continue;
        const ordreDiff = aStop.ordre - headStop.ordre;
        if (ordreDiff <= 0) continue;
        const aMin = a.minutsRestants ?? 0;
        const expected = headMin + ordreDiff * stepMin;
        const tolerance = Math.max(1.5, stepMin * ordreDiff * 0.5);
        if (Math.abs(aMin - expected) <= tolerance) {
          trajectory.push(a);
          remaining.splice(i, 1);
        }
      }

      trajectory.sort((a, b) => (a.minutsRestants ?? 0) - (b.minutsRestants ?? 0));

      let cua: CuaParada[];
      if (trajectory.length > 1) {
        cua = buildQueueFromList(trajectory, stopByCodi);
      } else {
        // Synthesise queue from line order in the head's sentit.
        const list2 = stopsBySentit.get(headStop.sentit ?? 'default') ?? [];
        const idx = list2.findIndex((p) => p.codi === headStop.codi);
        cua = [{ codi: headStop.codi, nom: headStop.nom, minuts: headMin }];
        for (let k = 1; k < 4 && idx >= 0 && idx + k < list2.length; k += 1) {
          const sp = list2[idx + k];
          cua.push({
            codi: sp.codi,
            nom: sp.nom,
            minuts: Math.round(headMin + stepMin * k),
          });
        }
      }

      seq += 1;
      vehicles.push({
        id: `${destinacio}|t${seq}|${head.paradaCodi}|${headMin}`,
        destinacio,
        minutsFinsProperaParada: headMin,
        properaParadaCodi: head.paradaCodi,
        properaParadaNom: headStop.nom,
        cuaProperesParades: cua,
      });
    }
  }

  vehicles.sort(
    (a, b) => a.minutsFinsProperaParada - b.minutsFinsProperaParada,
  );
  return vehicles;
}

function buildQueueFromList(
  list: NormalisedArrival[],
  stopByCodi: Map<string, Parada>,
): CuaParada[] {
  return list.slice(0, 4).map((a) => {
    const sp = stopByCodi.get(a.paradaCodi);
    return {
      codi: a.paradaCodi,
      nom: sp?.nom ?? '',
      minuts: a.minutsRestants ?? 0,
    };
  });
}

export const config = { path: '/api/vehicles/*' };
