import { errorResponse, fetchIBus, jsonResponse, rawFetch } from './_tmb';
import type { TempsRealResposta } from '../../src/types/tmb';

const TMB_BASE = 'https://api.tmb.cat/v1';

export default async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const debug = url.searchParams.get('debug') === '1';
    // Path: /api/temps-real/{liniaCodi}/{paradaCodi}
    const path = url.searchParams.get('path');
    const segments = (path ?? url.pathname.replace(/^.*temps-real\/?/, ''))
      .split('/')
      .map((s) => decodeURIComponent(s))
      .filter(Boolean);
    const [liniaCodi, paradaCodi] = segments;
    if (!liniaCodi || !paradaCodi) {
      return errorResponse(400, 'Falten paràmetres liniaCodi/paradaCodi');
    }

    if (debug) {
      const lineScoped = await rawFetch(
        `${TMB_BASE}/ibus/lines/${encodeURIComponent(liniaCodi)}/stops/${encodeURIComponent(paradaCodi)}`,
      );
      const stopWide = await rawFetch(
        `${TMB_BASE}/ibus/stops/${encodeURIComponent(paradaCodi)}`,
      );
      return jsonResponse(200, {
        inputs: { liniaCodi, paradaCodi },
        attempts: [
          { label: 'line-scoped', ...lineScoped },
          { label: 'stop-wide', ...stopWide },
        ],
        note:
          'Aquest endpoint exposa la resposta crua de TMB perquè depuris el bug del temps real. Crida-l com /api/temps-real/{liniaCodi}/{paradaCodi}?debug=1',
      });
    }

    try {
      const { arribades } = await fetchIBus(liniaCodi, paradaCodi);
      const resposta: TempsRealResposta = {
        parada: paradaCodi,
        arribades,
        actualitzat: new Date().toISOString(),
        disponible: arribades.length > 0,
        missatge: arribades.length === 0 ? 'Sense informació de temps real ara mateix.' : undefined,
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
