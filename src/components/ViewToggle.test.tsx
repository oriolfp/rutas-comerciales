import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ViewToggle } from './ViewToggle';

describe('ViewToggle', () => {
  it('marks the active mode', () => {
    render(<ViewToggle value="list" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: /llista/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: /mapa/i })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('fires onChange with the selected mode', () => {
    const onChange = vi.fn();
    render(<ViewToggle value="map" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /llista/i }));
    expect(onChange).toHaveBeenCalledWith('list');
  });
});
