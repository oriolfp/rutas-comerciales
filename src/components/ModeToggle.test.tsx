import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ModeToggle } from './ModeToggle';

describe('ModeToggle', () => {
  it('marks the active option', () => {
    render(<ModeToggle value="aprop-meu" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Aprop meu' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Línies' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('fires onChange with the chosen mode', () => {
    const onChange = vi.fn();
    render(<ModeToggle value="linies" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Aprop meu' }));
    expect(onChange).toHaveBeenCalledWith('aprop-meu');
  });
});
