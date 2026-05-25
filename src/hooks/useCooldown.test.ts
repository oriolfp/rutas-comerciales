import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCooldown } from './useCooldown';

describe('useCooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is idle by default', () => {
    const { result } = renderHook(() => useCooldown(2000));
    expect(result.current.isActive).toBe(false);
    expect(result.current.formatted).toBe('0:00');
  });

  it('starts and ticks down, then resets', () => {
    const { result } = renderHook(() => useCooldown(2000));
    act(() => result.current.start());
    expect(result.current.isActive).toBe(true);
    expect(result.current.formatted).toBe('0:02');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.formatted).toBe('0:01');

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.isActive).toBe(false);
    expect(result.current.formatted).toBe('0:00');
  });
});
