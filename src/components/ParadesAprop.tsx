import { useTempsReal } from '../hooks/useTempsReal';
import { formatDistance } from '../utils/distance';
import type { ParadaAprop, TransportType } from '../types/tmb';

const TYPE_LABEL: Record<TransportType, string> = {
  metro: 'Metro',
  bus: 'Bus',
};

interface Props {
  parades: ParadaAprop[];
  topN: number;
}

export function ParadesAprop({ parades, topN }: Props) {
  if (parades.length === 0) {
    return (
      <div className="state-msg">
        No hi ha parades en aquesta zona. Prova un radi més gran.
      </div>
    );
  }
  return (
    <>
      <div className="section-title">
        Parades en aquesta zona <span className="section-count">· {parades.length}</span>
      </div>
      <div className="stops-list">
        {parades.map((p, idx) => (
          <StopItem key={p.id} parada={p} rank={idx + 1} topN={topN} />
        ))}
      </div>
    </>
  );
}

function StopItem({
  parada,
  rank,
  topN,
}: {
  parada: ParadaAprop;
  rank: number;
  topN: number;
}) {
  const isTop = rank <= topN;
  const primary = parada.liniesQueParen[0];
  const { data } = useTempsReal(
    isTop && primary ? parada.tipus : null,
    primary?.codi ?? null,
    parada.codi,
    isTop,
  );
  const nextArrival = data?.arribades[0];

  return (
    <div className={`stop-item${isTop ? ' highlight' : ''}`}>
      <div className={`stop-rank${isTop ? '' : ' muted'}`}>{rank}</div>
      <div className="stop-info">
        <div className="stop-name" title={parada.nom}>{parada.nom}</div>
        <div className="stop-meta">
          <span className="meta-dist">{formatDistance(parada.distanciaM)}</span>
          <span>·</span>
          <span>{TYPE_LABEL[parada.tipus]}</span>
        </div>
        <div className="stop-lines">
          {parada.liniesQueParen.slice(0, 5).map((l) => (
            <span key={l.id} className="stop-line-mini" style={{ background: l.color }}>
              {l.codi}
            </span>
          ))}
        </div>
      </div>
      {isTop && nextArrival && (
        <div className="arrival">
          <span className="arrival-time">{nextArrival.text}</span>
          <span className="arrival-line">
            {nextArrival.liniaCodi}
            {nextArrival.destinacio ? ` · ${truncate(nextArrival.destinacio, 14)}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
