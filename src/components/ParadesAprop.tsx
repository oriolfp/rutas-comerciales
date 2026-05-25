import { useTempsReal } from '../hooks/useTempsReal';
import { formatDistance } from '../utils/distance';
import type { LiniaResum, ParadaAprop, TempsRealArribada, TransportType } from '../types/tmb';

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
  const { data, loading } = useTempsReal(
    primary ? parada.tipus : null,
    primary?.codi ?? null,
    parada.codi,
    !!primary,
    true,
  );

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
        <div className="line-arrivals">
          {parada.liniesQueParen.map((l) => (
            <LineArrivalRow
              key={l.id}
              linia={l}
              arribades={data?.arribades ?? null}
              loading={loading && !data}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LineArrivalRow({
  linia,
  arribades,
  loading,
}: {
  linia: LiniaResum;
  arribades: TempsRealArribada[] | null;
  loading: boolean;
}) {
  const next = pickNextForLine(arribades, linia.codi);
  return (
    <div className="line-arrival">
      <span className="line-arrival-badge" style={{ background: linia.color }}>
        {linia.codi}
      </span>
      <span className="line-arrival-dest" title={next?.destinacio ?? ''}>
        {next?.destinacio || (loading ? '…' : '—')}
      </span>
      <span className="line-arrival-time">
        {next ? next.text : loading ? '…' : '—'}
      </span>
    </div>
  );
}

function pickNextForLine(
  arribades: TempsRealArribada[] | null,
  liniaCodi: string,
): TempsRealArribada | null {
  if (!arribades) return null;
  const matches = arribades.filter((a) => a.liniaCodi === liniaCodi);
  if (matches.length > 0) return matches[0];
  return null;
}
