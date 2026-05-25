# Tasks: Vista "Mapa | Llista" toggle al mode Línies

PRD: `tasks/prd-line-list-view.md`

## Relevant Files

- `src/components/ViewToggle.tsx` - Toggle Mapa|Llista flotant dalt-esquerra del mapa.
- `src/components/ViewToggle.test.tsx` - Tests del toggle (estats actius, onChange).
- `src/components/LineListView.tsx` - Vista alternativa que mostra parades de la línia en columnes per sentit, amb correspondències i indicadors de vehicles.
- `src/components/LineListView.test.tsx` - Tests bàsics (renderitza, sentits, sense vehicles).
- `src/components/StopRow.tsx` - Fila d'una parada amb mini-badges de correspondència, indicador de vehicle i acordió expansible amb temps real `all=1`.
- `src/components/StopRow.test.tsx` - Tests de la fila.
- `src/components/LiniesView.tsx` - Modificar per alternar entre `<MapView>` i `<LineListView>` i compartir refresh.
- `src/components/MapView.tsx` - Renderitza el `ViewToggle` al canto superior esquerre (paral·lel al `RefreshControl`).
- `src/utils/correspondences.ts` - Helper `findCorrespondences(parada, totesParades, maxDistanceM)` que retorna les altres línies (excloent la línia actual) que paren a prop de la parada.
- `src/utils/correspondences.test.ts` - Tests del helper.
- `src/App.css` - Estils del toggle, columnes, capçalera de sentit, mini-badges de correspondència, indicador de vehicle inline, animació de l'acordió.

### Notes

- Tests amb `npm test`.
- `useTotesParades` ja existeix (s'utilitza a "Aprop meu"); el reusarem amb `enabled: true` quan estiguem en mode llista.
- L'endpoint `/api/temps-real/.../all=1` ja existeix i `useTempsReal` accepta el flag `all`.

## Instructions for Completing Tasks

**IMPORTANT:** Marca cada subtasca canviant `- [ ]` per `- [x]` a mesura que avances. Actualitza el fitxer després de cada sub-tasca.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 `git checkout -b feature/line-list-view` des de `main`
  - [x] 0.2 Primer push per establir tracking remot

- [x] 1.0 ViewToggle component (control flotant Mapa | Llista)
  - [x] 1.1 Crear `src/components/ViewToggle.tsx` amb props `{ value: 'map' | 'list'; onChange: (v) => void }`
  - [x] 1.2 Renderitzar dos botons `role="tab"` amb icones SVG inline (targeta-mapa + tres-línies-llista), text "Mapa" / "Llista" a la dreta de la icona
  - [x] 1.3 Estats `active` (fons groc clar `#fff8e1` + text fosc) i `inactive` (fons transparent + text gris)
  - [x] 1.4 Estils inline `display: inline-flex`, `background: white`, `border-radius: 8px`, `box-shadow: 0 2px 8px rgba(0,0,0,0.18)` — equivalent visual al `RefreshControl`
  - [x] 1.5 Tests bàsics (assigna `aria-selected`, dispara `onChange` amb el valor correcte)

- [x] 2.0 LineListView: estructura general + selector de sentit en mòbil
  - [x] 2.1 Crear `src/components/LineListView.tsx` que rep `{ linia, parades, vehicles, correspondencesPerParada }`
  - [x] 2.2 Agrupar parades per `sentit` (per a bus); per a metro, si no hi ha sentit, tota la línia és una sola columna
  - [x] 2.3 Capçalera de cada columna amb nom del destí (`→ {parades[ultima].nom}` o derivat de `linia.desti`)
  - [x] 2.4 Renderitzar `<StopRow>` per a cada parada en ordre
  - [x] 2.5 En mòbil (< 640 px), via CSS media query, **una sola columna a la vegada** + selector dropdown / botons a dalt (`<select>` o tabs) per triar el sentit visible
  - [x] 2.6 Estats: skeleton si `parades.length === 0`, missatge "Sense parades" si no hi ha cap després de la càrrega

- [x] 3.0 Helper de correspondències + StopRow expansible
  - [x] 3.1 Crear `src/utils/correspondences.ts` amb `findCorrespondences(parada, totesParades, maxDistanceM = 50): LiniaResum[]` que utilitza `haversine` (de `distance.ts`) i exclou la línia actual passada com a paràmetre opcional
  - [x] 3.2 Tests unitaris del helper amb un dataset sintètic
  - [x] 3.3 Crear `src/components/StopRow.tsx` amb props `{ parada, ordre, correspondencies, vehicleNext, expanded, onToggle, linia }`
  - [x] 3.4 Renderitzar: número d'ordre, nom de parada, **mini-badges** de correspondència (`min-width: 26px, height: 16px, font-size: 10px`), indicador de vehicle (slot a la dreta) i caret de toggle
  - [x] 3.5 Si `expanded`, renderitzar un `<TempsRealAccordion>` sota la fila amb una crida `useTempsReal({ tipus, liniaCodi: linia.codi, paradaCodi: parada.codi, enabled: true, all: true })`
  - [x] 3.6 Acordió amb animació CSS `max-height` + opacity (0.2s ease)
  - [x] 3.7 Una sola fila pot estar expandida a la vegada — gestionat per `LineListView` amb `useState<string | null>` del `parada.id` actiu

- [x] 4.0 Indicador de vehicle "↓ X min" al costat de la parada
  - [x] 4.1 A `LineListView`, construir un mapa `nextStopCodi -> VehiclePos[]` a partir de `vehicles` (`vehicle.properaParadaCodi`)
  - [x] 4.2 Per a cada `<StopRow>`, passar `vehicleNext = vehiclesByStop[parada.codi] || []`
  - [x] 4.3 Component visual: un xip horitzontal compacte amb la **silueta del vehicle sense flip ni chevron** (variant alternativa del SVG actual) + `↓ {minuts} min` en vermell `#c8001e` font-weight 800
  - [x] 4.4 Si hi ha múltiples vehicles per la mateixa parada (cas rar), apilar-ne fins a 2 + "+N" més
  - [x] 4.5 Estils al CSS per a `.list-vehicle-indicator`

- [x] 5.0 Integració a LiniesView + refresh compartit
  - [x] 5.1 Afegir estat `viewMode: 'map' | 'list'` a `LiniesView` amb `useState`
  - [x] 5.2 Renderitzar `<ViewToggle>` al `MapView` amb `position: absolute; top: 10px; left: 50px;` (al costat dels controls de zoom de Leaflet) — només si hi ha línia seleccionada
  - [x] 5.3 Quan `viewMode === 'list'`, dins de `.map-area` renderitzar `<LineListView>` en lloc de `<MapView>`, però conservant el toggle i el `RefreshControl` flotants (que viuran fora del MapContainer)
  - [x] 5.4 Carregar `useTotesParades({ enabled: viewMode === 'list' && !!seleccio })` per tenir les dades de correspondència sense pagar el cost en mode mapa
  - [x] 5.5 Computar `correspondencesPerParada` amb `useMemo` aplicant `findCorrespondences` a totes les parades de la línia
  - [x] 5.6 Compartir el `refreshVehicles` actual entre mapa i llista (mateix `RefreshControl`)

- [x] 6.0 Tests, responsive QA i PR
  - [x] 6.1 Tests del helper `findCorrespondences` (parades a < 50 m → correspondència; >; sense la línia actual)
  - [x] 6.2 Test bàsic del `ViewToggle`
  - [x] 6.3 Test smoke de `LineListView` (renderitza columnes amb dades mock, expandeix una fila)
  - [x] 6.4 Manual: prova en desktop i mòbil (Chrome i Firefox); verificar que el toggle, mini-badges, vehicles i acordió funcionen
  - [x] 6.5 `npm run build` i `npm test` verds
  - [x] 6.6 Obrir PR `feature/line-list-view` → `main` amb captures de pantalla i checklist de test plan manual:
    - [x] Toggle Mapa ↔ Llista canvia sense crashar
    - [x] Llista mostra columnes per sentit (bus) i una col·lumna per a metro
    - [x] Mini-badges de correspondència apareixen on s'espera (ex. Pl. Catalunya bus mostra L1, L3...)
    - [x] Vehicles apareixen al costat de la propera parada amb el temps correcte
    - [x] Clic a una parada desplega l'acordió amb arribades de totes les línies
    - [x] Refresh button funciona igual en ambdues vistes
    - [x] Cap regressió a "Aprop meu" ni al mapa
