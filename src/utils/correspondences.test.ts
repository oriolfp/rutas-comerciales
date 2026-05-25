import { describe, expect, it } from 'vitest';
import { findCorrespondences } from './correspondences';
import type { ParadaAmbLinies } from '../types/tmb';

const L1 = { id: 'metro-1', codi: 'L1', tipus: 'metro' as const, color: '#C8001E' };
const L3 = { id: 'metro-3', codi: 'L3', tipus: 'metro' as const, color: '#007A3D' };
const BUS_22 = { id: 'bus-22', codi: '22', tipus: 'bus' as const, color: '#E84E0F' };

const PARADES: ParadaAmbLinies[] = [
  {
    id: 'metro-100',
    codi: '100',
    nom: 'Pl. Catalunya (L1)',
    lat: 41.3870,
    lng: 2.1701,
    tipus: 'metro',
    liniesQueParen: [L1, L3],
  },
  {
    id: 'bus-1234',
    codi: '1234',
    nom: 'Pl. Catalunya (bus 22)',
    // ~10 m from the metro entrance
    lat: 41.38701,
    lng: 2.17011,
    tipus: 'bus',
    liniesQueParen: [BUS_22],
  },
  {
    id: 'bus-9999',
    codi: '9999',
    nom: 'Sagrada Família',
    lat: 41.4036,
    lng: 2.1744,
    tipus: 'bus',
    liniesQueParen: [{ id: 'bus-50', codi: '50', tipus: 'bus', color: '#000' }],
  },
];

describe('findCorrespondences', () => {
  it('returns nearby lines from any stop within the radius', () => {
    const out = findCorrespondences(
      { lat: 41.3870, lng: 2.1701 },
      PARADES,
      null,
      50,
    );
    const ids = out.map((l) => l.id).sort();
    expect(ids).toEqual(['bus-22', 'metro-1', 'metro-3']);
  });

  it('excludes the line we already know we are on', () => {
    const out = findCorrespondences(
      { lat: 41.3870, lng: 2.1701 },
      PARADES,
      'metro-1',
      50,
    );
    const ids = out.map((l) => l.id);
    expect(ids).not.toContain('metro-1');
    expect(ids).toContain('metro-3');
    expect(ids).toContain('bus-22');
  });

  it('does not include stops outside the radius', () => {
    const out = findCorrespondences(
      { lat: 41.3870, lng: 2.1701 },
      PARADES,
      null,
      50,
    );
    expect(out.map((l) => l.id)).not.toContain('bus-50');
  });

  it('dedupes when several nearby parades share the same line', () => {
    const dup: ParadaAmbLinies[] = [
      { ...PARADES[1], id: 'bus-1234-dup' },
      ...PARADES,
    ];
    const out = findCorrespondences(
      { lat: 41.3870, lng: 2.1701 },
      dup,
      null,
      50,
    );
    const ids = out.map((l) => l.id);
    expect(ids.filter((i) => i === 'bus-22')).toHaveLength(1);
  });
});
