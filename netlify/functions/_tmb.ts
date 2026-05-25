import type { Linia, Parada, LineGeometry, TransportType } from '../../src/types/tmb';

const TMB_BASE = 'https://api.tmb.cat/v1';

function requireCredentials(): { app_id: string; app_key: string } {
  const app_id = process.env.TMB_APP_ID;
  const app_key = process.env.TMB_APP_KEY;
  if (!app_id || !app_key) {
    throw new Error(
      'Credencials TMB no configurades. Defineix TMB_APP_ID i TMB_APP_KEY a Netlify (o .env.local per a dev).',
    );
  }
  return { app_id, app_key };
}

function withCreds(url: string): string {
  const { app_id, app_key } = requireCredentials();
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}app_id=${encodeURIComponent(app_id)}&app_key=${encodeURIComponent(app_key)}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(withCreds(url), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`TMB API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export interface RawProbe {
  url: string;
  status: number;
  ok: boolean;
  body: unknown;
}

// Performs a raw fetch and returns the parsed body (or text) without throwing,
// so the debug endpoint can show what TMB returned even on errors.
export async function rawFetch(url: string): Promise<RawProbe> {
  const fullUrl = withCreds(url);
  // Strip credentials from the URL we expose back to the client.
  const safeUrl = fullUrl
    .replace(/([?&])app_id=[^&]*/i, '$1app_id=***')
    .replace(/([?&])app_key=[^&]*/i, '$1app_key=***');
  try {
    const res = await fetch(fullUrl, { headers: { Accept: 'application/json' } });
    const text = await res.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // keep as text
    }
    return { url: safeUrl, status: res.status, ok: res.ok, body };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { url: safeUrl, status: 0, ok: false, body: { error: message } };
  }
}

interface GeoJsonFeature<G, P> {
  type: 'Feature';
  geometry: G | null;
  properties: P;
}
interface GeoJsonCollection<G, P> {
  type: 'FeatureCollection';
  features: GeoJsonFeature<G, P>[];
}

type AnyProps = Record<string, unknown>;

function s(v: unknown): string {
  return v === null || v === undefined ? '' : String(v);
}

function n(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function ensureColor(raw: unknown, fallback: string): string {
  const c = s(raw).trim();
  if (!c) return fallback;
  if (c.startsWith('#')) return c;
  if (/^[0-9a-fA-F]{3,8}$/.test(c)) return `#${c}`;
  return fallback;
}

// Geometry normaliser: accepts LineString or MultiLineString GeoJSON.
function normaliseGeometry(geom: unknown): LineGeometry | null {
  if (!geom || typeof geom !== 'object') return null;
  const g = geom as { type?: string; coordinates?: unknown };
  if (g.type === 'LineString' && Array.isArray(g.coordinates)) {
    return {
      type: 'LineString',
      coordinates: (g.coordinates as [number, number][]).filter(
        (c) => Array.isArray(c) && c.length >= 2,
      ),
    };
  }
  if (g.type === 'MultiLineString' && Array.isArray(g.coordinates)) {
    return {
      type: 'MultiLineString',
      coordinates: (g.coordinates as [number, number][][]).map((seg) =>
        seg.filter((c) => Array.isArray(c) && c.length >= 2),
      ),
    };
  }
  return null;
}

// --- LINIES -----------------------------------------------------------

const DEFAULT_COLORS: Record<TransportType, string> = {
  metro: '#666666',
  bus: '#E84E0F',
  tramvia: '#00AADC',
  fgc: '#8B4513',
  rodalies: '#E3000F',
};

export async function fetchAllLinies(): Promise<Linia[]> {
  const [metro, bus] = await Promise.all([
    fetchJson<GeoJsonCollection<unknown, AnyProps>>(`${TMB_BASE}/transit/linies/metro`),
    fetchJson<GeoJsonCollection<unknown, AnyProps>>(`${TMB_BASE}/transit/linies/bus`),
  ]);

  const result: Linia[] = [];

  for (const f of metro.features) {
    const p = f.properties ?? {};
    const codi = s(p.NOM_LINIA ?? p.CODI_LINIA);
    if (!codi) continue;
    const id = `metro-${s(p.CODI_LINIA ?? codi)}`;
    result.push({
      id,
      codi,
      nom: s(p.DESC_LINIA ?? `${p.ORIGEN_LINIA ?? ''} — ${p.DESTI_LINIA ?? ''}`),
      origen: s(p.ORIGEN_LINIA) || undefined,
      desti: s(p.DESTI_LINIA) || undefined,
      tipus: 'metro',
      color: ensureColor(p.COLOR_LINIA, DEFAULT_COLORS.metro),
      nomComplet: `Metro ${codi}`,
      geometry: normaliseGeometry(f.geometry),
    });
  }

  for (const f of bus.features) {
    const p = f.properties ?? {};
    const codi = s(p.NOM_LINIA ?? p.CODI_LINIA);
    if (!codi) continue;
    const id = `bus-${s(p.CODI_LINIA ?? codi)}`;
    result.push({
      id,
      codi,
      nom: s(p.DESC_LINIA ?? `${p.ORIGEN_LINIA ?? ''} — ${p.DESTI_LINIA ?? ''}`),
      origen: s(p.ORIGEN_LINIA) || undefined,
      desti: s(p.DESTI_LINIA) || undefined,
      tipus: 'bus',
      color: ensureColor(p.COLOR_LINIA, DEFAULT_COLORS.bus),
      nomComplet: `Bus ${codi}`,
      geometry: normaliseGeometry(f.geometry),
    });
  }

  result.sort((a, b) => {
    if (a.tipus !== b.tipus) return a.tipus.localeCompare(b.tipus);
    return naturalCompare(a.codi, b.codi);
  });

  return result;
}

function naturalCompare(a: string, b: string): number {
  const ax = a.match(/^(\D*)(\d+)?(.*)$/);
  const bx = b.match(/^(\D*)(\d+)?(.*)$/);
  if (ax && bx) {
    const [, ap, an, ar] = ax;
    const [, bp, bn, br] = bx;
    if (ap !== bp) return ap.localeCompare(bp);
    const na = an ? parseInt(an, 10) : 0;
    const nb = bn ? parseInt(bn, 10) : 0;
    if (na !== nb) return na - nb;
    return ar.localeCompare(br);
  }
  return a.localeCompare(b);
}

// --- PARADES ----------------------------------------------------------

export function parseLiniaId(id: string): { tipus: 'metro' | 'bus'; codi: string } {
  const idx = id.indexOf('-');
  if (idx < 0) throw new Error(`Identificador de línia invàlid: ${id}`);
  const prefix = id.slice(0, idx);
  const codi = id.slice(idx + 1);
  if (prefix !== 'metro' && prefix !== 'bus') {
    throw new Error(`Tipus de línia no suportat: ${prefix}`);
  }
  return { tipus: prefix, codi };
}

interface MetroEstacioProps {
  CODI_GRUP_ESTACIO?: string | number;
  CODI_ESTACIO?: string | number;
  NOM_ESTACIO?: string;
  ORDRE_ESTACIO?: number;
  PICTO?: string;
}

interface BusParadaProps {
  CODI_PARADA?: string | number;
  NOM_PARADA?: string;
  ORDRE?: number;
  SENTIT?: string;
}

export async function fetchParades(liniaId: string): Promise<Parada[]> {
  const { tipus, codi } = parseLiniaId(liniaId);

  if (tipus === 'metro') {
    const url = `${TMB_BASE}/transit/linies/metro/${encodeURIComponent(codi)}/estacions`;
    const data = await fetchJson<GeoJsonCollection<{ type: string; coordinates: [number, number] }, MetroEstacioProps>>(url);
    return data.features
      .filter((f) => f.geometry && Array.isArray(f.geometry.coordinates))
      .map((f) => {
        const [lng, lat] = f.geometry!.coordinates;
        return {
          id: s(f.properties.CODI_GRUP_ESTACIO ?? f.properties.CODI_ESTACIO ?? `${codi}-${f.properties.ORDRE_ESTACIO}`),
          codi: s(f.properties.CODI_ESTACIO),
          nom: s(f.properties.NOM_ESTACIO),
          ordre: n(f.properties.ORDRE_ESTACIO),
          lat,
          lng,
        } as Parada;
      })
      .sort((a, b) => a.ordre - b.ordre);
  }

  const url = `${TMB_BASE}/transit/linies/bus/${encodeURIComponent(codi)}/parades`;
  const data = await fetchJson<GeoJsonCollection<{ type: string; coordinates: [number, number] }, BusParadaProps>>(url);
  return data.features
    .filter((f) => f.geometry && Array.isArray(f.geometry.coordinates))
    .map((f) => {
      const [lng, lat] = f.geometry!.coordinates;
      return {
        id: `${codi}-${s(f.properties.CODI_PARADA)}-${s(f.properties.SENTIT)}-${n(f.properties.ORDRE)}`,
        codi: s(f.properties.CODI_PARADA),
        nom: s(f.properties.NOM_PARADA),
        ordre: n(f.properties.ORDRE),
        sentit: s(f.properties.SENTIT) || undefined,
        lat,
        lng,
      } as Parada;
    })
    .sort((a, b) => {
      if (a.sentit !== b.sentit) return (a.sentit ?? '').localeCompare(b.sentit ?? '');
      return a.ordre - b.ordre;
    });
}

// --- TEMPS REAL (iBus) -----------------------------------------------

interface IBusRow {
  line?: string;
  'line-name'?: string;
  destination?: string;
  'text-ca'?: string;
  'text-es'?: string;
  'text-en'?: string;
  'in-transit'?: string;
  t_in_min?: number;
  't-in-min'?: number;
  routeId?: string;
  route?: string;
  text?: string;
}

interface IBusResponse {
  features?: { properties: IBusRow }[];
}

export async function fetchIBus(
  liniaCodi: string,
  paradaCodi: string,
): Promise<{
  arribades: { liniaCodi: string; destinacio: string; minutsRestants: number | null; text: string }[];
  raw: IBusResponse;
}> {
  // TMB exposes two iBus endpoints. The line-scoped one is more reliable,
  // but it sometimes returns an empty payload, so we fall back to the
  // stop-wide endpoint and tag every arrival as relevant.
  const lineScopedUrl = `${TMB_BASE}/ibus/lines/${encodeURIComponent(liniaCodi)}/stops/${encodeURIComponent(paradaCodi)}`;
  const stopWideUrl = `${TMB_BASE}/ibus/stops/${encodeURIComponent(paradaCodi)}`;

  let data: IBusResponse = {};
  try {
    data = await fetchJson<IBusResponse>(lineScopedUrl);
  } catch {
    // Line-scoped endpoint may not exist for this combo; fall through to the wide one.
  }

  if (!data.features || data.features.length === 0) {
    data = await fetchJson<IBusResponse>(stopWideUrl);
  }

  const rows = data.features ?? [];
  const normalised = rows.map((row) => {
    const p = row.properties;
    const text = s(p['text-ca'] ?? p.text ?? p['text-es'] ?? '');
    const minuts =
      typeof p.t_in_min === 'number'
        ? p.t_in_min
        : typeof p['t-in-min'] === 'number'
          ? p['t-in-min']
          : null;
    return {
      liniaCodi: s(p.line ?? p['line-name'] ?? p.route ?? p.routeId),
      destinacio: s(p.destination ?? ''),
      minutsRestants: minuts !== null && Number.isFinite(minuts) ? minuts : null,
      text:
        text ||
        (minuts !== null && Number.isFinite(minuts)
          ? `${minuts} min`
          : '—'),
    };
  });

  // Prefer arrivals that match the requested line; if none match (because of
  // naming mismatches like "H10" vs "10"), return everything sorted by minutes.
  const matching = normalised.filter(
    (a) => !liniaCodi || a.liniaCodi === liniaCodi,
  );
  const arribades = matching.length > 0 ? matching : normalised;
  arribades.sort((a, b) => {
    const am = a.minutsRestants ?? Number.POSITIVE_INFINITY;
    const bm = b.minutsRestants ?? Number.POSITIVE_INFINITY;
    return am - bm;
  });

  return { arribades, raw: data };
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': status === 200 ? 'public, max-age=60' : 'no-store',
    },
  });
}

export function errorResponse(status: number, message: string): Response {
  return jsonResponse(status, { error: message });
}
