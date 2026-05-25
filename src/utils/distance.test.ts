import { describe, expect, it } from 'vitest';
import { formatDistance, haversine } from './distance';

describe('haversine', () => {
  it('returns 0 for the same point', () => {
    const p = { lat: 41.3874, lng: 2.1686 };
    expect(haversine(p, p)).toBeLessThan(0.001);
  });

  it('matches the rough distance Pl. Catalunya ↔ Sagrada Família', () => {
    const catalunya = { lat: 41.3870, lng: 2.1701 };
    const sagrada = { lat: 41.4036, lng: 2.1744 };
    const meters = haversine(catalunya, sagrada);
    // ~1.85 km in real life — allow ±200 m.
    expect(meters).toBeGreaterThan(1650);
    expect(meters).toBeLessThan(2050);
  });
});

describe('formatDistance', () => {
  it('renders meters under 1 km', () => {
    expect(formatDistance(425.6)).toBe('426 m');
  });
  it('renders kilometers above 1 km', () => {
    expect(formatDistance(1456)).toBe('1.5 km');
  });
});
