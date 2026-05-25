import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useParadesAprop } from './useParadesAprop';
import type { ParadaAmbLinies } from '../types/tmb';

const PARADES: ParadaAmbLinies[] = [
  {
    id: 'metro-1',
    codi: '1',
    nom: 'Pl. Catalunya',
    lat: 41.3870,
    lng: 2.1701,
    tipus: 'metro',
    liniesQueParen: [
      { id: 'metro-L1', codi: 'L1', tipus: 'metro', color: '#C8001E' },
      { id: 'metro-L3', codi: 'L3', tipus: 'metro', color: '#007A3D' },
    ],
  },
  {
    id: 'bus-7',
    codi: '7',
    nom: 'Pl. Catalunya (Bus)',
    lat: 41.3875,
    lng: 2.1700,
    tipus: 'bus',
    liniesQueParen: [{ id: 'bus-7', codi: '7', tipus: 'bus', color: '#E84E0F' }],
  },
  {
    // Sagrada Família — outside a 500m radius from Pl. Catalunya
    id: 'metro-sf',
    codi: '99',
    nom: 'Sagrada Família',
    lat: 41.4036,
    lng: 2.1744,
    tipus: 'metro',
    liniesQueParen: [{ id: 'metro-L2', codi: 'L2', tipus: 'metro', color: '#9B2990' }],
  },
];

describe('useParadesAprop', () => {
  it('returns empty when there is no centre', () => {
    const { result } = renderHook(() =>
      useParadesAprop(null, 500, PARADES),
    );
    expect(result.current.paradesDins).toEqual([]);
    expect(result.current.linies).toEqual([]);
  });

  it('keeps only stops within the radius and sorts by distance', () => {
    const centre = { lat: 41.3870, lng: 2.1701 };
    const { result } = renderHook(() => useParadesAprop(centre, 500, PARADES));
    expect(result.current.paradesDins.map((p) => p.codi)).toEqual(['1', '7']);
    expect(result.current.paradesDins[0].distanciaM).toBeLessThan(
      result.current.paradesDins[1].distanciaM,
    );
  });

  it('derives line counts from the stops in range', () => {
    const centre = { lat: 41.3870, lng: 2.1701 };
    const { result } = renderHook(() => useParadesAprop(centre, 500, PARADES));
    const codis = result.current.linies.map((l) => l.codi);
    expect(codis).toContain('L1');
    expect(codis).toContain('L3');
    expect(codis).toContain('7');
    expect(codis).not.toContain('L2');
  });
});
