import type { LiniaAmbComptador, TransportType } from '../types/tmb';

interface Props {
  linies: LiniaAmbComptador[];
}

const TYPE_LABEL: Record<TransportType, string> = {
  metro: 'Metro',
  bus: 'Bus',
};

export function LiniesEnZona({ linies }: Props) {
  if (linies.length === 0) return null;
  return (
    <>
      <div className="section-title">
        Línies en aquesta zona <span className="section-count">· {linies.length}</span>
      </div>
      <div className="lines-row">
        {linies.map((l) => (
          <span key={l.id} className="line-chip">
            <span className="line-chip-badge" style={{ background: l.color }}>
              {l.codi}
            </span>
            {TYPE_LABEL[l.tipus]}
            <span className="count">·{l.numParades}</span>
          </span>
        ))}
      </div>
    </>
  );
}
