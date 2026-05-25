import type { Coordinate } from '../types/tmb';
import { haversine } from './distance';
import { directionOfSegment } from './transit';

export interface PolylinePoint {
  lat: number;
  lng: number;
}

// Returns cumulative distance from the first point of the polyline to each vertex.
// Length = polyline.length. cum[0] = 0.
export function cumulativeDistances(polyline: PolylinePoint[]): number[] {
  const out: number[] = new Array(polyline.length);
  out[0] = 0;
  for (let i = 1; i < polyline.length; i += 1) {
    out[i] = out[i - 1] + haversine(polyline[i - 1], polyline[i]);
  }
  return out;
}

// Returns the point at a given distance from the start of the polyline,
// linearly interpolated between the surrounding vertices.
export function pointAtDistanceAlong(
  polyline: PolylinePoint[],
  cum: number[],
  distance: number,
): { lat: number; lng: number; segmentIdx: number } {
  if (polyline.length === 0) return { lat: 0, lng: 0, segmentIdx: 0 };
  const total = cum[cum.length - 1];
  if (distance <= 0) {
    return { lat: polyline[0].lat, lng: polyline[0].lng, segmentIdx: 0 };
  }
  if (distance >= total) {
    const last = polyline.length - 1;
    return { lat: polyline[last].lat, lng: polyline[last].lng, segmentIdx: Math.max(0, last - 1) };
  }
  // Binary search for the segment containing `distance`.
  let lo = 0;
  let hi = cum.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >>> 1;
    if (cum[mid] <= distance) lo = mid;
    else hi = mid;
  }
  const a = polyline[lo];
  const b = polyline[hi];
  const segLen = cum[hi] - cum[lo] || 1;
  const t = (distance - cum[lo]) / segLen;
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
    segmentIdx: lo,
  };
}

// Returns the distance along the polyline to the closest point to (lat, lng).
export function closestDistanceAlong(
  polyline: PolylinePoint[],
  cum: number[],
  target: Coordinate,
): number {
  let bestDist = Infinity;
  let bestAlong = 0;
  for (let i = 0; i < polyline.length - 1; i += 1) {
    const a = polyline[i];
    const b = polyline[i + 1];
    const segLen = cum[i + 1] - cum[i];
    if (segLen === 0) continue;
    // Project target onto segment a→b in lat/lng space (approximate for small distances).
    const dx = b.lng - a.lng;
    const dy = b.lat - a.lat;
    const t = Math.max(
      0,
      Math.min(1, ((target.lng - a.lng) * dx + (target.lat - a.lat) * dy) / (dx * dx + dy * dy || 1)),
    );
    const px = a.lng + t * dx;
    const py = a.lat + t * dy;
    const d = haversine({ lat: target.lat, lng: target.lng }, { lat: py, lng: px });
    if (d < bestDist) {
      bestDist = d;
      bestAlong = cum[i] + segLen * t;
    }
  }
  return bestAlong;
}

export interface ExtrapolateArgs {
  polyline: PolylinePoint[];
  nextStop: Coordinate;
  minutsFinsProperaParada: number;
  speedMS: number;
}

// Places the vehicle along the polyline at `speedMS * minutsFins * 60`
// metres before the next stop. Returns the projected lat/lng and the
// direction of travel based on the surrounding polyline segment.
export function extrapolateVehiclePosition({
  polyline,
  nextStop,
  minutsFinsProperaParada,
  speedMS,
}: ExtrapolateArgs): { lat: number; lng: number; direccio: 'left' | 'right' } | null {
  if (polyline.length < 2) return null;
  const cum = cumulativeDistances(polyline);
  const stopDistance = closestDistanceAlong(polyline, cum, nextStop);
  const back = Math.max(0, minutsFinsProperaParada) * 60 * speedMS;
  const distance = Math.max(0, stopDistance - back);
  const { lat, lng, segmentIdx } = pointAtDistanceAlong(polyline, cum, distance);
  const a = polyline[segmentIdx];
  const b = polyline[Math.min(segmentIdx + 1, polyline.length - 1)];
  const direccio = directionOfSegment(a, b);
  return { lat, lng, direccio };
}
