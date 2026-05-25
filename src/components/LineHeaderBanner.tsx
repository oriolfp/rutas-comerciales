import type { Linia } from '../types/tmb';

interface Props {
  linia: Linia;
}

export function LineHeaderBanner({ linia }: Props) {
  const { origen, desti } = splitNom(linia);
  return (
    <div className="line-header-banner">
      <span
        className="line-header-badge"
        style={{ background: linia.color }}
      >
        {linia.codi}
      </span>
      {origen && desti ? (
        <span className="line-header-name">
          <span className="lhb-origen">{origen}</span>
          <span className="lhb-arrow"> → </span>
          <span className="lhb-desti">{desti}</span>
        </span>
      ) : (
        <span className="line-header-name">{linia.nom || linia.nomComplet}</span>
      )}
    </div>
  );
}

function splitNom(linia: Linia): { origen: string; desti: string } {
  if (linia.origen && linia.desti) {
    return { origen: linia.origen, desti: linia.desti };
  }
  // TMB usually joins origen/desti with an em-dash or en-dash.
  const m = linia.nom.split(/\s+[—–-]\s+/);
  if (m.length === 2) return { origen: m[0].trim(), desti: m[1].trim() };
  return { origen: '', desti: '' };
}
