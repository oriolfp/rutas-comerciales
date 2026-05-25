# Tasks: Vehicles en temps real al mapa

PRD: `tasks/prd-vehicles-realtime.md`
Mockup d'icones: `mockup-vehicle-icons-v3.html` (Bus variant C + Metro refinat)

## Relevant Files

- `netlify/functions/vehicles.ts` - Netlify Function nova: `/api/vehicles/{tipus}/{liniaCodi}` agrega arribades de totes les parades d'una línia i deriva vehicles únics.
- `netlify/functions/_tmb.ts` - Ampliar `fetchIBus` per acceptar un mode "batch" amb un array de paradaCodi i `fetchIMetro` amb llista CSV.
- `netlify.toml` - Redirect per `/api/vehicles/*`.
- `src/types/tmb.ts` - Tipus `VehicleRaw` (resposta del backend) i `VehiclePos` (un cop interpolat al frontend).
- `src/services/tmb.ts` - Funció `getVehicles(tipus, liniaCodi)`.
- `src/hooks/useVehicles.ts` - Hook que crida `getVehicles`, exposa `{ data, loading, error, refresh, lastFetchedAt }`.
- `src/hooks/useVehicles.test.ts` - Tests del hook.
- `src/hooks/useCooldown.ts` - Hook genèric que exposa `{ remainingMs, isActive, start, reset, formattedCountdown }`.
- `src/hooks/useCooldown.test.ts` - Tests del hook.
- `src/utils/route.ts` - Càlculs de geometria: `cumulativeDistances(polyline)`, `pointAtDistanceAlong(polyline, d)`, `extrapolateVehiclePosition(...)`.
- `src/utils/route.test.ts` - Tests dels càlculs (segments coneguts, casos límit).
- `src/utils/transit.ts` - Constants `SPEED_M_S = { bus: 5, metro: 8 }` i helpers `directionOfSegment(a, b)` → `'left' | 'right'`.
- `src/components/VehicleMarker.tsx` - Component que renderitza el `DivIcon` SVG (bus variant C amb chevron / metro amb nas) + Tooltip + Popup.
- `src/components/VehicleMarker.test.tsx` - Tests bàsics del component.
- `src/components/RefreshControl.tsx` - Botó circular amb estats Idle / Loading / Cooldown (m:ss).
- `src/components/RefreshControl.test.tsx` - Tests del component.
- `src/components/MapView.tsx` - Integrar la capa de vehicles + RefreshControl quan hi ha línia seleccionada.
- `src/components/LiniesView.tsx` - Orquestrar `useVehicles`, `useCooldown` i propagar el callback de refresc coordinat.
- `src/App.css` - Estils del marcador de vehicle, popup de cua de parades i botó de refresc.

### Notes

- Tests amb `npm test`.
- L'extrapolació es fa al **frontend**, no al backend: la polilínia ja la tenim a través de `useGeometria` i així el backend és més senzill i cachejable.
- Dedupe de vehicles al backend: agrupar per `codi_servei` (metro) o `routeId` (bus). Si no hi ha id, agrupar per `destinacio` + parada amb mínim minuts.

## Instructions for Completing Tasks

**IMPORTANT:** Marca cada subtasca canviant `- [ ]` per `- [x]` a mesura que avances. Actualitza el fitxer després de cada sub-tasca.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 `git checkout -b feature/vehicles-realtime` des de `main`
  - [x] 0.2 Primer push per establir tracking remot

- [x] 1.0 Backend: endpoint /api/vehicles
  - [x] 1.1 Estendre `fetchIBus` (a `_tmb.ts`) amb una variant `fetchIBusBatch(liniaCodi, paradaCodis[])` que faci `mapLimit(stops, 10, fetchIBus(..., all=true))`. Retorna `{ paradaCodi, arribades[] }[]`.
  - [x] 1.2 Estendre `fetchIMetro` (a `_tmb.ts`) per acceptar múltiples codis d'estació en una sola crida (TMB `?estacions=CSV` ja suporta CSV; cal canviar el tipus i la lògica de l'iterador).
  - [x] 1.3 Crear `netlify/functions/vehicles.ts` que rep path `{tipus}/{liniaCodi}`, carrega les parades de la línia (via `fetchParades`), crida el batch corresponent i agrega.
  - [x] 1.4 Implementar dedupe: per a metro, agrupar per `codi_servei`; per a bus, agrupar per `routeId`. Si manca id, agrupar per `destinacio` i quedar-se amb la parada de minuts mínims.
  - [x] 1.5 Per a cada vehicle, calcular la **cua** de parades pendents: filtrar parades del seu sentit (que matchin `destinacio`), agafar les ≤ 4 properes amb temps creixent.
  - [x] 1.6 Retornar shape:
    ```ts
    {
      actualitzat: ISOString;
      vehicles: Array<{
        id: string;
        destinacio: string;
        minutsFinsProperaParada: number;
        properaParadaCodi: string;
        properaParadaNom: string;
        cuaProperesParades: Array<{ codi: string; nom: string; minuts: number }>;
      }>;
    }
    ```
  - [x] 1.7 Headers `cache-control: public, max-age=30` + `netlify-cdn-cache-control: public, max-age=30, durable`.
  - [x] 1.8 Afegir redirect a `netlify.toml`: `from = "/api/vehicles/*"` → `to = "/.netlify/functions/vehicles?path=:splat"`.
  - [x] 1.9 Manejo d'errors: si TMB respon 401/403, retornar 200 amb `vehicles: []` i camp `missatge`.

- [x] 2.0 Frontend data layer
  - [x] 2.1 Afegir tipus a `src/types/tmb.ts`:
    - `VehicleRaw` (resposta del backend, shape de 1.6)
    - `VehiclePos` (estesa amb `lat`, `lng`, `direccio: 'left' | 'right'` un cop interpolada)
  - [x] 2.2 Afegir `getVehicles(tipus, liniaCodi): Promise<VehiclesResposta>` a `src/services/tmb.ts`
  - [x] 2.3 Crear `src/hooks/useVehicles.ts` que rep `{ tipus, liniaId, enabled }` i exposa `{ data, loading, error, refresh, lastFetchedAt }`. **No auto-refresh** intern: només es refresca via `refresh()` o quan canvia la línia.
  - [x] 2.4 Tests bàsics del hook: carrega inicial, refresh manual, reset en canvi de línia.

- [x] 3.0 Interpolació de posició
  - [x] 3.1 Crear `src/utils/transit.ts` amb `SPEED_M_S = { bus: 5, metro: 8 }` i `directionOfSegment([a, b]): 'left' | 'right'` (compara `b.lng - a.lng`).
  - [x] 3.2 Crear `src/utils/route.ts` amb:
    - `cumulativeDistances(polyline): number[]` (distàncies acumulades en metres)
    - `pointAtDistanceAlong(polyline, distance): { lat, lng, segmentIdx }` (busca binàriament i interpola al segment)
    - `closestPointOnPolyline(polyline, lat, lng): { distanceAlong, ... }` (per saber on és cada parada al llarg de la ruta)
  - [x] 3.3 `extrapolateVehiclePosition({ polyline, parades, properaParadaCodi, minutsFinsProperaParada, speedMS })`:
    - Localitzar `distanceAtNextStop = closestPointOnPolyline(polyline, parada.lat, parada.lng).distanceAlong`
    - Calcular `distanceBack = minutsFinsProperaParada * 60 * speedMS`
    - `distanceVehicle = max(0, distanceAtNextStop - distanceBack)`
    - Retornar `pointAtDistanceAlong(polyline, distanceVehicle)` + `directionOfSegment(...)`
  - [x] 3.4 Tests amb una polilínia sintètica recta (10 punts), parada coneguda i temps de 1, 5, 100 min → posicions esperades.
  - [x] 3.5 Tests amb temps molt grans (vehicle "abans del principi"): clamp a `distance = 0` correcte.

- [x] 4.0 Marcadors de vehicle al mapa
  - [x] 4.1 Crear `src/components/VehicleMarker.tsx` que rep `{ vehicle: VehiclePos, color: string, tipus: TransportType, liniaCodi: string }`.
  - [x] 4.2 Renderitzar amb Leaflet `Marker` + `divIcon({ html: ReactDOMServer.renderToStaticMarkup(<svg>...</svg>), className: 'vehicle-icon-wrapper', iconSize: [...], iconAnchor: [...] })`. Inline SVG amb el color de la línia.
  - [x] 4.3 Variant Bus (codi cercat al mockup v3 "Bus variant C"): rect simètric + chevron `>` separat del davant. Flip via CSS `transform: scaleX(-1)` quan `direccio === 'left'`.
  - [x] 4.4 Variant Metro: silueta arrodonida amb nas + llum frontal. Flip horitzontal idèntic.
  - [x] 4.5 `Tooltip` mostrant `{liniaCodi} · {destinacio}` al hover/long-press.
  - [x] 4.6 `Popup` amb:
    - Capçalera: badge de línia + destinació
    - Llista de `cuaProperesParades` (fins a 4 ítems) amb minuts a la dreta en vermell
  - [x] 4.7 Estils CSS al `src/App.css` per a `.vehicle-icon-wrapper`, `.vehicle-popup`, `.vehicle-queue-item`.

- [x] 5.0 Botó de refresc + cooldown
  - [x] 5.1 Crear `src/hooks/useCooldown.ts`:
    - `useCooldown(durationMs)` → `{ remainingMs, isActive, start, reset, formatted }` (mm:ss)
    - Implementat amb `setInterval` cada 1000 ms; cleanup en `unmount`.
  - [x] 5.2 Tests amb fake timers (`vi.useFakeTimers`).
  - [x] 5.3 Crear `src/components/RefreshControl.tsx`:
    - Botó circular blanc amb icona ↻ (SVG inline) al cantó superior dret del mapa (posicionament absolut, similar al `.map-control` existent).
    - Estats: `idle` (cliclable), `loading` (icona girant amb CSS animation), `cooldown` (mostra `m:ss` en lloc de la fletxa, color `#f4a300`, deshabilitat).
  - [x] 5.4 Prop `onRefresh: () => Promise<void>`. En clicar: passa a `loading`, després `await onRefresh()`, després si OK → `cooldown(2 min)`; si KO → torna a `idle` i mostra toast d'error.
  - [x] 5.5 Estils al `App.css` per al botó i la rotació de loading.

- [x] 6.0 Integració, tests i PR
  - [x] 6.1 Integrar a `MapView.tsx`: capa de `<VehicleMarker>` per a cada `vehiclesAmbPos` només quan hi ha línia seleccionada amb polilínia carregada. Renderitzar `<RefreshControl>` al mateix `MapView` només si la línia està seleccionada.
  - [x] 6.2 A `LiniesView.tsx`:
    - Cridar `useVehicles({ tipus: linia.tipus, liniaId: linia.id, enabled: !!linia })`
    - Computar `vehiclesAmbPos` via `useMemo` aplicant `extrapolateVehiclePosition` per a cada raw vehicle (necessita `parades` i `geometria` de la línia).
    - `onRefresh` invoca `vehicles.refresh()` i forces a tornar a cridar els temps reals visibles al panell (afegir un `refreshTrigger` que es passa a `useTempsReal`, o cridar un `refresh` exposat pel hook).
  - [x] 6.3 Reset del cooldown global si l'usuari fa toggle a "Aprop meu" — opcional, decidir si volem persistir o no. Per ara: persisteix entre canvis de línia, es reseteja en sortir del mode "Línies".
  - [x] 6.4 Tests addicionals:
    - `vehicles.test` per a la function (mockejant `fetch`): comprova que agrega correctament 2 stops d'una línia bus amb un mateix `routeId` → 1 vehicle.
    - `LiniesView.test` smoke amb mocks per assegurar que els components es muntem sense crashar.
  - [x] 6.5 `npm run build` i `npm test` verds.
  - [x] 6.6 Actualitzar el mockup v3 (si cal després de prova real) i fer commit.
  - [x] 6.7 Obrir PR `feature/vehicles-realtime` → `main` amb captures i checklist de test plan manual:
    - [ ] Vehicles apareixen al seleccionar una línia activa
    - [ ] Direcció dels vehicles coincideix amb el destí real
    - [ ] Clic a un vehicle obre el popup amb la cua
    - [ ] Botó de refresc: idle → loading → cooldown 2 min amb m:ss visible
    - [ ] Canviar de línia: vehicles es reseteen, cooldown manté el seu estat
