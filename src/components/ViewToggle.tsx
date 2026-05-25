export type ViewMode = 'map' | 'list';

interface Props {
  value: ViewMode;
  onChange: (m: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="view-toggle" role="tablist" aria-label="Vista de la línia">
      <button
        type="button"
        role="tab"
        aria-selected={value === 'map'}
        className={value === 'map' ? 'active' : ''}
        onClick={() => onChange('map')}
      >
        <MapIcon />
        <span>Mapa</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'list'}
        className={value === 'list' ? 'active' : ''}
        onClick={() => onChange('list')}
      >
        <ListIcon />
        <span>Llista</span>
      </button>
    </div>
  );
}

function MapIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 3 L3 6 L3 21 L9 18 L15 21 L21 18 L21 3 L15 6 Z" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="9" y1="6" x2="21" y2="6" />
      <line x1="9" y1="12" x2="21" y2="12" />
      <line x1="9" y1="18" x2="21" y2="18" />
      <circle cx="4.5" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
