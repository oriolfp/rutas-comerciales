import type { Linia } from '../types/tmb';

const TYPE_LABEL: Record<Linia['tipus'], string> = {
  metro: 'Metro',
  bus: 'Bus',
};

interface Props {
  linies: Linia[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (linia: Linia) => void;
}

export function LineList({ linies, selectedId, loading, error, onSelect }: Props) {
  if (loading) {
    return (
      <div className="state-msg" aria-live="polite">
        Carregant línies…
      </div>
    );
  }
  if (error) {
    return (
      <div className="state-msg state-msg--error" role="alert">
        No s'han pogut carregar les línies. {error}
      </div>
    );
  }
  if (linies.length === 0) {
    return <div className="state-msg">Cap línia coincideix amb la cerca.</div>;
  }
  return (
    <div className="line-list" role="list">
      {linies.map((l) => {
        const active = l.id === selectedId;
        return (
          <button
            key={l.id}
            type="button"
            role="listitem"
            className={`line-item${active ? ' active' : ''}`}
            onClick={() => onSelect(l)}
            aria-current={active}
          >
            <span
              className="line-badge"
              style={{ background: l.color }}
              aria-hidden="true"
            >
              {l.codi}
            </span>
            <span className="line-info">
              <span className="line-name" title={l.nom}>
                {l.nom}
              </span>
              <span className="line-type">{TYPE_LABEL[l.tipus]}</span>
            </span>
            {typeof l.numParades === 'number' && (
              <span className="line-count">{l.numParades} par.</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
