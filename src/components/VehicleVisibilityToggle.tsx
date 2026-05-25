interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
  tipus: 'bus' | 'metro';
}

export function VehicleVisibilityToggle({ value, onChange, tipus }: Props) {
  return (
    <button
      type="button"
      className={`vehicle-visibility-toggle${value ? ' on' : ' off'}`}
      onClick={() => onChange(!value)}
      aria-pressed={value}
      title={value ? 'Amaga els vehicles' : 'Mostra els vehicles'}
    >
      {tipus === 'bus' ? <BusIcon /> : <MetroIcon />}
      {!value && <SlashOverlay />}
    </button>
  );
}

function BusIcon() {
  return (
    <svg width="20" height="14" viewBox="0 0 36 22" fill="none">
      <rect x="2" y="3" width="32" height="14" rx="3" fill="currentColor" />
      <rect x="4" y="6" width="28" height="4" rx="1" fill="rgba(255,255,255,0.85)" />
      <circle cx="8" cy="18" r="2.5" fill="#1c1c1c" />
      <circle cx="28" cy="18" r="2.5" fill="#1c1c1c" />
    </svg>
  );
}

function MetroIcon() {
  return (
    <svg width="22" height="11" viewBox="0 0 36 18" fill="none">
      <path
        d="M2 4 Q2 2 4 2 L28 2 Q34 2 34 9 Q34 16 28 16 L4 16 Q2 16 2 14 Z"
        fill="currentColor"
      />
      <rect x="5" y="5" width="5" height="4" rx="1" fill="rgba(255,255,255,0.85)" />
      <rect x="12" y="5" width="5" height="4" rx="1" fill="rgba(255,255,255,0.85)" />
      <rect x="19" y="5" width="5" height="4" rx="1" fill="rgba(255,255,255,0.85)" />
    </svg>
  );
}

function SlashOverlay() {
  return (
    <svg className="vvt-slash" width="28" height="28" viewBox="0 0 28 28">
      <line
        x1="4"
        y1="24"
        x2="24"
        y2="4"
        stroke="#c8001e"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
