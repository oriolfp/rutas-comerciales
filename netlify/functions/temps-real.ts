import {
  errorResponse,
  fetchIBus,
  fetchIMetro,
  jsonResponse,
  rawFetch,
} from './_tmb';
import type { TempsRealResposta } from '../../src/types/tmb';

const TMB_BASE = 'https://api.tmb.cat/v1';

export default async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const debug = url.searchParams.get('debug') === '1';
    // Path: /api/temps-real/{tipus}/{liniaCodi}/{paradaCodi}
    const path = url.searchParams.get('path');
    const segments = (path ?? url.pathname.replace(/^.*temps-real\/?/, ''))
      .split('/')
      .map((s) => decodeURIComponent(s))
      .filter(Boolean);
    const [tipus, liniaCodi, paradaCodi] = segments;
    if (!tipus || !liniaCodi || !paradaCodi) {
      return errorResponse(400, 'Falten paràmetres tipus/liniaCodi/paradaCodi');
    }

    if (debug) {
      const attempts: Array<{ label: string } & Awaited<ReturnType<typeof rawFetch>>> = [];
      if (tipus === 'metro') {
        attempts.push({
          label: 'metro-estacions',
          ...(await rawFetch(
            `${TMB_BASE}/itransit/metro/estacions?estacions=${encodeURIComponent(paradaCodi)}`,
          )),
        });
      } else if (tipus === 'bus') {
        attempts.push({
          label: 'line-scoped',
          ...(await rawFetch(
            `${TMB_BASE}/ibus/lines/${encodeURIComponent(liniaCodi)}/stops/${encodeURIComponent(paradaCodi)}`,
          )),
        });
        attempts.push({
          label: 'stop-wide',
          ...(await rawFetch(
            `${TMB_BASE}/ibus/stops/${encodeURIComponent(paradaCodi)}`,
          )),
        });
      }
      return jsonResponse(200, {
        inputs: { tipus, liniaCodi, paradaCodi },
        attempts,
        note: 'Mode debug: exposa la resposta crua de TMB. Crida-l com /api/temps-real/{tipus}/{linia}/{parada}?debug=1',
      });
    }

    if (tipus !== 'bus' && tipus !== 'metro') {
      const resposta: TempsRealResposta = {
        parada: paradaCodi,
        arribades: [],
        actualitzat: new Date().toISOString(),
        disponible: false,
        missatge: `Temps real no disponible per a ${tipus}.`,
      };
      return jsonResponse(200, resposta);
    }

    try {
      const { arribades } =
        tipus === 'bus'
          ? await fetchIBus(liniaCodi, paradaCodi)
          : await fetchIMetro(liniaCodi, paradaCodi);
      const resposta: TempsRealResposta = {
        parada: paradaCodi,
        arribades,
        actualitzat: new Date().toISOString(),
        disponible: arribades.length > 0,
        missatge:
          arribades.length === 0
            ? 'Sense vehicles propers ara mateix.'
            : undefined,
      };
      return jsonResponse(200, resposta);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const resposta: TempsRealResposta = {
        parada: paradaCodi,
        arribades: [],
        actualitzat: new Date().toISOString(),
        disponible: false,
        missatge: `Temps real no disponible amb aquestes credencials: ${message}`,
      };
      return jsonResponse(200, resposta);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(500, message);
  }
};

export const config = { path: '/api/temps-real/*' };
