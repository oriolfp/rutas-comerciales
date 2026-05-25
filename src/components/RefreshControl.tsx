import { useState } from 'react';
import { useCooldown } from '../hooks/useCooldown';

const COOLDOWN_MS = 2 * 60 * 1000;

interface Props {
  onRefresh: () => Promise<void>;
}

export function RefreshControl({ onRefresh }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const cooldown = useCooldown(COOLDOWN_MS);

  const disabled = loading || cooldown.isActive;

  const handleClick = async () => {
    if (disabled) return;
    setLoading(true);
    setError(false);
    try {
      await onRefresh();
      cooldown.start();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={`refresh-control${cooldown.isActive ? ' cooldown' : ''}${loading ? ' loading' : ''}${error ? ' error' : ''}`}
      disabled={disabled}
      onClick={handleClick}
      aria-label={
        cooldown.isActive
          ? `Refresc disponible en ${cooldown.formatted}`
          : 'Refrescar vehicles i temps real'
      }
      title={
        cooldown.isActive
          ? `Pots tornar a refrescar en ${cooldown.formatted}`
          : 'Refrescar'
      }
    >
      {cooldown.isActive ? (
        <span className="refresh-countdown">{cooldown.formatted}</span>
      ) : (
        <svg
          className="refresh-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 0 1 15.36-6.36L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-15.36 6.36L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
      )}
    </button>
  );
}
