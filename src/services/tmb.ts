import type { Linia, Parada, TempsRealResposta, TransportType } from '../types/tmb';

const API_BASE = '/api';

async function jsonFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Error ${res.status} ${res.statusText} en ${url}: ${body}`);
  }
  return (await res.json()) as T;
}

export function getLinies(): Promise<Linia[]> {
  return jsonFetch<Linia[]>(`${API_BASE}/linies`);
}

export function getParades(liniaId: string): Promise<Parada[]> {
  return jsonFetch<Parada[]>(
    `${API_BASE}/parades/${encodeURIComponent(liniaId)}`,
  );
}

export function getTempsReal(
  tipus: TransportType,
  liniaCodi: string,
  paradaCodi: string,
): Promise<TempsRealResposta> {
  return jsonFetch<TempsRealResposta>(
    `${API_BASE}/temps-real/${encodeURIComponent(tipus)}/${encodeURIComponent(liniaCodi)}/${encodeURIComponent(paradaCodi)}`,
  );
}
