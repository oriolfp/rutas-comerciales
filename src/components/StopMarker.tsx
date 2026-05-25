import { useState } from 'react';
import { CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { StopPopup } from './StopPopup';
import type { Linia, Parada } from '../types/tmb';

interface Props {
  linia: Linia;
  parada: Parada;
  terminal?: boolean;
}

export function StopMarker({ linia, parada, terminal = false }: Props) {
  const [open, setOpen] = useState(false);
  const radius = terminal ? 9 : 6;
  return (
    <CircleMarker
      center={[parada.lat, parada.lng]}
      radius={radius}
      pathOptions={{
        color: '#ffffff',
        weight: terminal ? 3 : 2,
        fillColor: linia.color,
        fillOpacity: 1,
      }}
      eventHandlers={{
        popupopen: () => setOpen(true),
        popupclose: () => setOpen(false),
      }}
    >
      <Tooltip direction="top" offset={[0, -4]} opacity={1} className="stop-tooltip">
        <span className="tooltip-badge" style={{ background: linia.color }}>
          {linia.codi}
        </span>
        <span className="tooltip-name">{parada.nom}</span>
      </Tooltip>
      <Popup>
        <StopPopup linia={linia} parada={parada} enabled={open} />
      </Popup>
    </CircleMarker>
  );
}
