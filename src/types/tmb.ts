export type TransportType = 'metro' | 'bus';

export interface Linia {
  id: string;
  codi: string;
  nom: string;
  origen?: string;
  desti?: string;
  tipus: TransportType;
  color: string;
  nomComplet: string;
  numParades?: number;
  geometry?: LineGeometry | null;
}

export interface Parada {
  id: string;
  codi: string;
  nom: string;
  ordre: number;
  sentit?: string;
  lat: number;
  lng: number;
}

export type LineGeometry =
  | { type: 'LineString'; coordinates: [number, number][] }
  | { type: 'MultiLineString'; coordinates: [number, number][][] };

export interface TempsRealArribada {
  liniaCodi: string;
  destinacio: string;
  minutsRestants: number | null;
  text: string;
}

export interface TempsRealResposta {
  parada: string;
  arribades: TempsRealArribada[];
  actualitzat: string;
  disponible: boolean;
  missatge?: string;
}

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface LiniaResum {
  id: string;
  codi: string;
  tipus: TransportType;
  color: string;
}

export interface ParadaAmbLinies {
  id: string;
  codi: string;
  nom: string;
  lat: number;
  lng: number;
  tipus: TransportType;
  liniesQueParen: LiniaResum[];
}

export interface ParadaAprop extends ParadaAmbLinies {
  distanciaM: number;
}

export interface LiniaAmbComptador extends LiniaResum {
  numParades: number;
}
