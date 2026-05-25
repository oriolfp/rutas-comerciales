export type AppMode = 'linies' | 'aprop-meu';

interface Props {
  value: AppMode;
  onChange: (m: AppMode) => void;
}

const OPTIONS: { value: AppMode; label: string }[] = [
  { value: 'linies', label: 'Línies' },
  { value: 'aprop-meu', label: 'Aprop meu' },
];

export function ModeToggle({ value, onChange }: Props) {
  return (
    <div className="mode-toggle" role="tablist" aria-label="Mode de visualització">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
