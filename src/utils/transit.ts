import type { TransportType } from '../types/tmb';

export const SPEED_M_S: Record<TransportType, number> = {
  bus: 5,    // ~18 km/h, typical urban bus average
  metro: 8,  // ~29 km/h, typical metro average
};

export function directionOfSegment(
  a: { lng: number },
  b: { lng: number },
): 'left' | 'right' {
  return b.lng >= a.lng ? 'right' : 'left';
}
