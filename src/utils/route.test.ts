import { describe, expect, it } from 'vitest';
import {
  closestDistanceAlong,
  cumulativeDistances,
  extrapolateVehiclePosition,
  pointAtDistanceAlong,
} from './route';

// Build a 4-point polyline that runs roughly east along the same latitude.
// At lat 41.39, 1 degree of lng ≈ 83.7 km, so 0.01° ≈ 837 m.
const POLY = [
  { lat: 41.39, lng: 2.10 },
  { lat: 41.39, lng: 2.11 },
  { lat: 41.39, lng: 2.12 },
  { lat: 41.39, lng: 2.13 },
];

describe('cumulativeDistances', () => {
  it('starts at 0 and grows monotonically', () => {
    const cum = cumulativeDistances(POLY);
    expect(cum[0]).toBe(0);
    expect(cum[1]).toBeGreaterThan(0);
    expect(cum[2]).toBeGreaterThan(cum[1]);
    expect(cum[3]).toBeGreaterThan(cum[2]);
  });
});

describe('pointAtDistanceAlong', () => {
  it('clamps to the start when distance is negative', () => {
    const cum = cumulativeDistances(POLY);
    const p = pointAtDistanceAlong(POLY, cum, -100);
    expect(p.lat).toBeCloseTo(41.39, 5);
    expect(p.lng).toBeCloseTo(2.10, 5);
  });

  it('clamps to the end when distance exceeds total length', () => {
    const cum = cumulativeDistances(POLY);
    const total = cum[cum.length - 1];
    const p = pointAtDistanceAlong(POLY, cum, total + 5000);
    expect(p.lng).toBeCloseTo(2.13, 5);
  });

  it('interpolates inside a segment', () => {
    const cum = cumulativeDistances(POLY);
    const half = cum[1] / 2;
    const p = pointAtDistanceAlong(POLY, cum, half);
    expect(p.lng).toBeGreaterThan(2.10);
    expect(p.lng).toBeLessThan(2.11);
  });
});

describe('closestDistanceAlong', () => {
  it('returns ~0 for a point near the start', () => {
    const cum = cumulativeDistances(POLY);
    const d = closestDistanceAlong(POLY, cum, { lat: 41.39, lng: 2.1001 });
    expect(d).toBeLessThan(50);
  });

  it('returns near total for a point near the end', () => {
    const cum = cumulativeDistances(POLY);
    const total = cum[cum.length - 1];
    const d = closestDistanceAlong(POLY, cum, { lat: 41.39, lng: 2.1299 });
    expect(total - d).toBeLessThan(50);
  });
});

describe('extrapolateVehiclePosition', () => {
  it('places the vehicle at the stop when minuts ≈ 0', () => {
    const stop = POLY[2]; // ~2.12
    const r = extrapolateVehiclePosition({
      polyline: POLY,
      nextStop: stop,
      minutsFinsProperaParada: 0,
      speedMS: 5,
    });
    expect(r).not.toBeNull();
    expect(r!.lng).toBeCloseTo(stop.lng, 4);
  });

  it('places the vehicle BEFORE the next stop in the direction of travel', () => {
    const stop = POLY[2]; // ~2.12, going east (towards higher lng)
    const r = extrapolateVehiclePosition({
      polyline: POLY,
      nextStop: stop,
      minutsFinsProperaParada: 1, // 1 * 60s * 5m/s = 300 m back
      speedMS: 5,
    });
    expect(r).not.toBeNull();
    // 300 m east of 2.11... should land between 2.10 and 2.12
    expect(r!.lng).toBeLessThan(stop.lng);
    expect(r!.lng).toBeGreaterThan(POLY[0].lng);
  });

  it('clamps to start when minuts is huge', () => {
    const stop = POLY[2];
    const r = extrapolateVehiclePosition({
      polyline: POLY,
      nextStop: stop,
      minutsFinsProperaParada: 1000,
      speedMS: 5,
    });
    expect(r).not.toBeNull();
    expect(r!.lng).toBeCloseTo(POLY[0].lng, 4);
  });

  it('returns null when polyline is too short', () => {
    const r = extrapolateVehiclePosition({
      polyline: [{ lat: 0, lng: 0 }],
      nextStop: { lat: 0, lng: 0 },
      minutsFinsProperaParada: 1,
      speedMS: 5,
    });
    expect(r).toBeNull();
  });
});
